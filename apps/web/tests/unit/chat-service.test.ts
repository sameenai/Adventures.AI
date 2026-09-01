// The agentic core: bounded multi-round tool loop + history sanitization
import { describe, expect, it, vi } from "vitest";
import type OpenAI from "openai";
import { runAgentLoop, sanitizeStoredHistory, MAX_TOOL_ROUNDS } from "@/lib/ai/chat-service";

type Chunk = {
  choices: Array<{
    delta: {
      content?: string;
      tool_calls?: Array<{
        index: number;
        id?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
    finish_reason: string | null;
  }>;
};

async function* streamOf(chunks: Chunk[]) {
  for (const chunk of chunks) yield chunk;
}

function textChunk(content: string, finish: string | null = null): Chunk {
  return { choices: [{ delta: { content }, finish_reason: finish }] };
}

function toolCallChunks(id: string, name: string, args: object): Chunk[] {
  return [
    {
      choices: [
        {
          delta: {
            tool_calls: [{ index: 0, id, function: { name, arguments: JSON.stringify(args) } }],
          },
          finish_reason: null,
        },
      ],
    },
    { choices: [{ delta: {}, finish_reason: "tool_calls" }] },
  ];
}

function fakeClient(streams: Chunk[][]) {
  const create = vi.fn();
  for (const chunks of streams) {
    create.mockResolvedValueOnce(streamOf(chunks));
  }
  return { client: { chat: { completions: { create } } } as unknown as OpenAI, create };
}

const baseCtx = (client: OpenAI) => ({ userId: "u1", itineraryId: "it1", client });

describe("runAgentLoop", () => {
  it("chains multiple tool rounds and keeps tools available on every round", async () => {
    const { client, create } = fakeClient([
      toolCallChunks("call-1", "search_adventures", { query: "nepal" }),
      toolCallChunks("call-2", "search_flights", { origin: "LHR", destination: "KTM" }),
      [textChunk("Here is your plan", "stop")],
    ]);
    const executor = vi.fn().mockResolvedValue(JSON.stringify({ success: true }));

    const tokens: string[] = [];
    const result = await runAgentLoop({
      client,
      model: "gpt-4o",
      messages: [{ role: "user", content: "plan nepal" }],
      tools: [{ type: "function", function: { name: "noop", parameters: {} } }],
      executors: { search_adventures: executor, search_flights: executor },
      ctx: baseCtx(client),
      onToken: (t) => tokens.push(t),
    });

    expect(create).toHaveBeenCalledTimes(3);
    // Every round must offer tools — the defining property of an agent loop.
    expect(create.mock.calls[0][0].tools).toBeDefined();
    expect(create.mock.calls[1][0].tools).toBeDefined();
    expect(create.mock.calls[2][0].tools).toBeDefined();
    expect(executor).toHaveBeenCalledTimes(2);
    expect(result.fullContent).toBe("Here is your plan");
    expect(tokens.join("")).toBe("Here is your plan");

    // Transcript contains the tool interactions for history persistence.
    const roles = result.transcript.map((m) => m.role);
    expect(roles).toEqual(["assistant", "tool", "assistant", "tool", "assistant"]);
  });

  it("returns an honest failure for tools that have no executor", async () => {
    const { client, create } = fakeClient([
      toolCallChunks("call-1", "book_hotel", { city: "Kathmandu" }),
      [textChunk("Sorry", "stop")],
    ]);

    await runAgentLoop({
      client,
      model: "gpt-4o",
      messages: [{ role: "user", content: "book a hotel" }],
      tools: [],
      executors: {},
      ctx: baseCtx(client),
      onToken: () => {},
    });

    const secondCallMessages = create.mock.calls[1][0].messages;
    const toolResult = secondCallMessages.at(-1);
    expect(toolResult.role).toBe("tool");
    const payload = JSON.parse(toolResult.content);
    expect(payload.success).toBe(false);
    expect(payload.error).toContain("not available");
  });

  it("survives malformed tool arguments without aborting the stream", async () => {
    const { client, create } = fakeClient([
      [
        {
          choices: [
            {
              delta: {
                tool_calls: [
                  { index: 0, id: "call-1", function: { name: "search_adventures", arguments: "{not json" } },
                ],
              },
              finish_reason: null,
            },
          ],
        },
        { choices: [{ delta: {}, finish_reason: "tool_calls" }] },
      ],
      [textChunk("Recovered", "stop")],
    ]);
    const executor = vi.fn();

    const result = await runAgentLoop({
      client,
      model: "gpt-4o",
      messages: [{ role: "user", content: "hi" }],
      tools: [],
      executors: { search_adventures: executor },
      ctx: baseCtx(client),
      onToken: () => {},
    });

    expect(executor).not.toHaveBeenCalled();
    const toolResult = create.mock.calls[1][0].messages.at(-1);
    expect(JSON.parse(toolResult.content).success).toBe(false);
    expect(result.fullContent).toBe("Recovered");
  });

  it("converts executor exceptions into failure payloads", async () => {
    const { client, create } = fakeClient([
      toolCallChunks("call-1", "search_flights", { origin: "LHR" }),
      [textChunk("ok", "stop")],
    ]);
    const executor = vi.fn().mockRejectedValue(new Error("provider down"));

    await runAgentLoop({
      client,
      model: "gpt-4o",
      messages: [{ role: "user", content: "flights" }],
      tools: [],
      executors: { search_flights: executor },
      ctx: baseCtx(client),
      onToken: () => {},
    });

    const toolResult = create.mock.calls[1][0].messages.at(-1);
    expect(JSON.parse(toolResult.content).success).toBe(false);
  });

  it("caps runaway tool loops at maxRounds and forces a final answer", async () => {
    // The model asks for a tool on every round, forever.
    const rounds: Chunk[][] = [];
    for (let i = 0; i < MAX_TOOL_ROUNDS; i++) {
      rounds.push(toolCallChunks(`call-${i}`, "search_adventures", { query: "x" }));
    }
    rounds.push([textChunk("Final answer", "stop")]);
    const { client, create } = fakeClient(rounds);
    const executor = vi.fn().mockResolvedValue(JSON.stringify({ success: true }));

    const result = await runAgentLoop({
      client,
      model: "gpt-4o",
      messages: [{ role: "user", content: "loop" }],
      tools: [],
      executors: { search_adventures: executor },
      ctx: baseCtx(client),
      onToken: () => {},
    });

    expect(create).toHaveBeenCalledTimes(MAX_TOOL_ROUNDS + 1);
    // The final call must withhold tools so the model answers.
    expect(create.mock.calls[MAX_TOOL_ROUNDS][0].tools).toBeUndefined();
    expect(result.fullContent).toBe("Final answer");
  });
});

describe("sanitizeStoredHistory", () => {
  it("returns [] for non-arrays", () => {
    expect(sanitizeStoredHistory(null)).toEqual([]);
    expect(sanitizeStoredHistory("junk")).toEqual([]);
    expect(sanitizeStoredHistory({})).toEqual([]);
  });

  it("keeps plain user/assistant exchanges", () => {
    const out = sanitizeStoredHistory([
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
    ]);
    expect(out).toHaveLength(2);
  });

  it("preserves complete tool interactions", () => {
    const out = sanitizeStoredHistory([
      { role: "user", content: "flights" },
      {
        role: "assistant",
        content: null,
        tool_calls: [
          { id: "c1", type: "function", function: { name: "search_flights", arguments: "{}" } },
        ],
      },
      { role: "tool", tool_call_id: "c1", content: '{"success":true}' },
      { role: "assistant", content: "Found 3 flights" },
    ]);
    expect(out.map((m) => m.role)).toEqual(["user", "assistant", "tool", "assistant"]);
  });

  it("drops dangling tool messages that answer nothing", () => {
    const out = sanitizeStoredHistory([
      { role: "tool", tool_call_id: "orphan", content: "{}" },
      { role: "user", content: "hi" },
    ]);
    expect(out.map((m) => m.role)).toEqual(["user"]);
  });

  it("truncates a trailing assistant tool_calls message with unanswered calls", () => {
    const out = sanitizeStoredHistory([
      { role: "user", content: "flights" },
      {
        role: "assistant",
        content: null,
        tool_calls: [
          { id: "c1", type: "function", function: { name: "search_flights", arguments: "{}" } },
          { id: "c2", type: "function", function: { name: "search_adventures", arguments: "{}" } },
        ],
      },
      { role: "tool", tool_call_id: "c1", content: "{}" },
      // c2 never answered — the API would reject the whole conversation
    ]);
    expect(out.map((m) => m.role)).toEqual(["user"]);
  });

  it("drops unknown roles and malformed entries", () => {
    const out = sanitizeStoredHistory([
      { role: "system", content: "injected" },
      { role: "user" },
      42,
      { role: "assistant", content: "ok" },
    ]);
    expect(out.map((m) => m.role)).toEqual(["assistant"]);
  });
});
