import { logger } from "@/lib/logger";
import type OpenAI from "openai";
import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
  ChatCompletionToolMessageParam,
} from "openai/resources/chat/completions";

/**
 * The agentic core of the trip planner: a bounded tool loop that keeps the
 * tools available on EVERY round (the previous implementation allowed exactly
 * one round and dropped tools from the follow-up call, so the model could
 * never chain search → compare → build-day), streams text as it arrives, and
 * returns the full transcript including tool calls so history survives turns.
 */

export const MAX_TOOL_ROUNDS = 6;

export interface ToolExecutionContext {
  userId: string;
  itineraryId: string;
  client: OpenAI;
}

/** Executors return the JSON string handed back to the model as the tool result. */
export type ToolExecutor = (args: unknown, ctx: ToolExecutionContext) => Promise<string>;

interface AccumulatedToolCall {
  id: string;
  function: { name: string; arguments: string };
}

export interface AgentLoopOptions {
  client: OpenAI;
  model: string;
  messages: ChatCompletionMessageParam[];
  tools: ChatCompletionTool[];
  executors: Record<string, ToolExecutor>;
  ctx: ToolExecutionContext;
  onToken: (token: string) => void;
  maxRounds?: number;
}

export interface AgentLoopResult {
  /** All assistant text streamed to the user, across every round. */
  fullContent: string;
  /** Messages produced during the loop, ready to append to chat history. */
  transcript: ChatCompletionMessageParam[];
}

export async function runAgentLoop(options: AgentLoopOptions): Promise<AgentLoopResult> {
  const { client, model, tools, executors, ctx, onToken } = options;
  const maxRounds = options.maxRounds ?? MAX_TOOL_ROUNDS;

  const messages: ChatCompletionMessageParam[] = [...options.messages];
  const transcript: ChatCompletionMessageParam[] = [];
  let fullContent = "";

  for (let round = 0; round <= maxRounds; round++) {
    // On the final permitted round, withhold tools so the model must answer.
    const allowTools = round < maxRounds;
    const stream = await client.chat.completions.create({
      model,
      messages,
      ...(allowTools ? { tools } : {}),
      stream: true,
    });

    let roundContent = "";
    const toolCallsMap = new Map<number, AccumulatedToolCall>();
    let finishReason: string | null = null;

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      finishReason = choice?.finish_reason ?? finishReason;

      const delta = choice?.delta;
      if (delta?.content) {
        roundContent += delta.content;
        fullContent += delta.content;
        onToken(delta.content);
      }
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const existing = toolCallsMap.get(tc.index) ?? {
            id: "",
            function: { name: "", arguments: "" },
          };
          if (tc.id) existing.id = tc.id;
          if (tc.function?.name) existing.function.name += tc.function.name;
          if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
          toolCallsMap.set(tc.index, existing);
        }
      }
    }

    if (finishReason === "tool_calls" && toolCallsMap.size > 0 && allowTools) {
      const toolCalls: ChatCompletionMessageToolCall[] = Array.from(toolCallsMap.values()).map(
        (tc) => ({
          id: tc.id,
          type: "function" as const,
          function: { name: tc.function.name, arguments: tc.function.arguments },
        }),
      );
      const assistantMessage: ChatCompletionAssistantMessageParam = {
        role: "assistant",
        content: roundContent || null,
        tool_calls: toolCalls,
      };

      const toolMessages: ChatCompletionToolMessageParam[] = [];
      for (const tc of toolCalls) {
        toolMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: await executeToolCall(tc, executors, ctx),
        });
      }

      messages.push(assistantMessage, ...toolMessages);
      transcript.push(assistantMessage, ...toolMessages);
      continue;
    }

    if (roundContent) {
      transcript.push({ role: "assistant", content: roundContent });
    }
    break;
  }

  return { fullContent, transcript };
}

/**
 * Executes one tool call defensively: unknown tools and malformed arguments
 * produce an honest failure payload instead of a fabricated empty success
 * (the old dispatcher returned {success:true, results:[]} for everything it
 * didn't implement, teaching the model to report "no flights found").
 */
async function executeToolCall(
  toolCall: ChatCompletionMessageToolCall,
  executors: Record<string, ToolExecutor>,
  ctx: ToolExecutionContext,
): Promise<string> {
  const name = toolCall.function.name;
  const executor = executors[name];
  if (!executor) {
    return JSON.stringify({
      success: false,
      error: `Tool "${name}" is not available. Tell the user this capability is currently unavailable rather than inventing results.`,
    });
  }

  let args: unknown;
  try {
    args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
  } catch {
    return JSON.stringify({ success: false, error: "Invalid tool arguments (malformed JSON)" });
  }

  try {
    return await executor(args, ctx);
  } catch (err) {
    logger.error(`Tool ${name} failed`, err);
    return JSON.stringify({ success: false, error: `Tool "${name}" failed to run` });
  }
}

// ---------------------------------------------------------------------------
// Stored history
// ---------------------------------------------------------------------------

type StoredMessage = {
  role?: unknown;
  content?: unknown;
  tool_calls?: unknown;
  tool_call_id?: unknown;
};

/**
 * Chat history is persisted as JSON including tool interactions. Rebuild a
 * valid OpenAI message array from it: unknown roles are dropped, and tool
 * messages are only kept when they answer a tool call from the immediately
 * preceding assistant message (the API rejects dangling tool messages).
 */
export function sanitizeStoredHistory(raw: unknown): ChatCompletionMessageParam[] {
  if (!Array.isArray(raw)) return [];

  const out: ChatCompletionMessageParam[] = [];
  let openToolCallIds: Set<string> = new Set();

  for (const item of raw as StoredMessage[]) {
    if (!item || typeof item !== "object") continue;
    const role = item.role;
    const content = typeof item.content === "string" ? item.content : null;

    if (role === "user" && content !== null) {
      out.push({ role: "user", content });
      openToolCallIds = new Set();
      continue;
    }

    if (role === "assistant") {
      const toolCalls = Array.isArray(item.tool_calls)
        ? (item.tool_calls as ChatCompletionMessageToolCall[]).filter(
            (tc) =>
              tc &&
              typeof tc.id === "string" &&
              tc.type === "function" &&
              typeof tc.function?.name === "string" &&
              typeof tc.function?.arguments === "string",
          )
        : [];
      if (toolCalls.length > 0) {
        out.push({ role: "assistant", content, tool_calls: toolCalls });
        openToolCallIds = new Set(toolCalls.map((tc) => tc.id));
      } else if (content !== null) {
        out.push({ role: "assistant", content });
        openToolCallIds = new Set();
      }
      continue;
    }

    if (role === "tool") {
      const toolCallId = typeof item.tool_call_id === "string" ? item.tool_call_id : null;
      if (toolCallId && content !== null && openToolCallIds.has(toolCallId)) {
        out.push({ role: "tool", tool_call_id: toolCallId, content });
        openToolCallIds.delete(toolCallId);
      }
    }
  }

  // Any assistant tool_calls left partially or fully unanswered at the tail
  // would make the API reject the whole conversation — truncate from that
  // assistant message (dropping its answered tool replies with it).
  if (openToolCallIds.size > 0) {
    for (let i = out.length - 1; i >= 0; i--) {
      const msg = out[i];
      if (msg.role === "assistant" && "tool_calls" in msg && msg.tool_calls) {
        out.length = i;
        break;
      }
    }
  }

  return out;
}
