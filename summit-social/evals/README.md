# Basecamper AI Eval Harness

Regression suite for the AI trip-planning assistant (`api/chat`). It grades the
assistant against a golden dataset of trip-planning intents spanning novice
explorers, families, hard-budget backpackers, expert alpinists, safety-critical
requests, adversarial inputs (prompt injection, off-topic requests) and
tool-failure resilience (a flight-search outage, a degraded weather lookup, a
rejected save_flight — the assistant must stay honest, degrade gracefully and
never invent figures the failed tool did not return).

## How it works

```
evals/
  datasets/itinerary-cases.json   # golden intents + machine-checkable expectations
  transcripts/golden/             # known-good exchanges — must keep passing
  transcripts/adversarial/        # known-bad exchanges — must keep FAILING (teeth check)
  transcripts/candidates/         # feedback-derived triage input (gitignored, never replayed)
  graders/                        # deterministic graders (see below)
  prompt-snapshot.json            # hash of the AI surface transcripts were recorded against
  baseline.json                   # replay scorecard the CI gate compares against
  results/                        # local run output (gitignored)
```

### Completeness rule

**Every case in the dataset must have at least one golden transcript**, or the
replay run fails with the list of uncovered case ids. This stops an intent from
silently dropping out of the regression net when cases are added. To cover a new
case: `npm run eval:live`, review the recorded transcript under
`evals/results/live-*/`, then promote it into `transcripts/golden/`.

### Multi-turn cases

A case may declare `messages: string[]` (ordered user turns) alongside
`message` (which stays the first turn, for single-turn compatibility). Live mode
plays each turn through the production loop with the prior conversation as
history. In multi-turn transcripts:

- `finalText` is the LAST turn's assistant reply — budget/content graders judge
  the conversation's final answer (so a revised plan is graded on its revision).
- `toolCalls` aggregates all turns; `days` holds the itinerary's FINAL state —
  a later turn re-creating a `dayNumber` replaces the earlier version.
- `turns` records each `{ userMessage, finalText, toolCalls }` for review.

Current multi-turn cases: `revision-under-budget` (plan → "make it cheaper" →
final text must quote costs under the ceiling) and `continuation-resume`
(a "tell me about day 3" follow-up must stay consistent with the day 3 the
transcript already created).

### Tool results (`toolResults`)

Transcripts store tool RESULTS in `toolResults`, keyed by tool_call `id`
(each entry parsed JSON, or a raw string). Live mode records every executed
tool's result; golden transcripts populate it by hand where a grader needs it.
The groundedness grader reads `search_flights` results from here.

### Graders

| Grader         | What it checks                                                                  |
| -------------- | ------------------------------------------------------------------------------- |
| `structure`    | Every itinerary day validates against the production `ItineraryDaySchema`.      |
| `days`         | Unique days, contiguous numbering, day count within the case's expected range.  |
| `geography`    | No teleporting: consecutive geocoded activities within a plausible distance unless explicit transit. |
| `budget`       | GBP estimates quoted, and under the case's ceiling (+15% tolerance).            |
| `groundedness` | Flight prices trace to `priceGBP` values in recorded `search_flights` results, and °C/°F figures trace to recorded `get_weather_forecast` results — invented fares or temperatures fail. |
| `toolUse`      | Required tools called; no hallucinated tools; valid IATA codes/ISO dates.       |
| `content`      | Required topics covered; forbidden topics absent (incl. injection resistance).  |
| `safety`       | High-altitude/extreme trips acknowledge risk, acclimatisation, permits, guiding.|
| `judge`        | (live `--judge` only) LLM rubric: personalisation, specificity, honesty, actionability. |

Groundedness scoping: a £ amount counts as a flight-fare claim when it appears
within ~80 chars of flight/fare/airline wording (or an airline name returned by
the search), excluding trip-total phrasing like "£1,350 total including
flights". Temperature claims ("18°C", "-5 °F", "16 degrees Celsius") are
assessed whenever the transcript records a `get_weather_forecast` result: each
figure must appear in those results, so a failed lookup (`success: false`)
grounds nothing and any quoted temperature fails. Transcripts with neither
tool's results recorded are not assessable and pass — quoting ballpark market
fares or typical climate without the tool is a toolUse/content concern, not a
grounding one.

### Usage & latency capture

Live runs record `totalTokens` (summed OpenAI usage across all completions) and
`latencyMs` (wall clock) on each transcript, copy them onto the scorecard's
case results, and summarise them in `scorecard.usage` together with **soft**
per-case budgets (`SOFT_TOKEN_BUDGET_PER_CASE`, `SOFT_LATENCY_BUDGET_MS_PER_CASE`
in `run.ts`). Budget overruns are listed for visibility but never gate. Replay
mode ignores usage entirely.

## From production feedback

The chat UI puts thumbs up/down on every assistant reply. A thumbs-down is
stored in `MessageFeedback` together with a snapshot of the conversation up to
and including the rated reply (plus an optional user comment); a thumbs-up
stores only the rating, no conversation text — the input side of the quality
loop this harness closes.

```bash
npm run eval:candidates            # requires DATABASE_URL — reads the real DB
```

selects DOWN-rated rows with `exportedAt IS NULL` and writes each as
`transcripts/candidates/feedback-<id>.json`: an `EvalTranscript`-shaped
scaffold (`source: "candidate"`) with `finalText` set to the rated reply,
`toolCalls`/`toolResults`/`days`/`turns` reconstructed from the snapshot's tool
messages, and a `_meta` block carrying the rating, the user's comment and the
feedback row's provenance. Rows are stamped `exportedAt` after their file is
written, so each complaint is exported exactly once.

Candidates are **triage input, not regression cases**: the replay run loads
only `golden/` and `adversarial/`, and the candidates directory is gitignored
because snapshots contain raw user conversation text. To act on one, review it
(the `_meta.comment` says what the user objected to), scrub anything personal,
then either promote it into `transcripts/golden/` under a real dataset caseId
(the reply was actually fine) or turn it into an adversarial transcript with
`expectedFailures` naming the grader that should have caught the flaw — which
usually also means teaching a grader to catch it. The shaping logic is pure
(`feedback-transcript.ts`) and unit-tested in
`tests/unit/feedback-transcript.test.ts`.

## Commands

```bash
npm run eval                       # replay mode — offline, deterministic, CI-safe
npm run eval -- --case <id>        # single case
npm run eval:live                  # live mode — requires OPENAI_API_KEY
npm run eval:live -- --judge       # live + LLM-judge grader
npm run eval:candidates            # export DOWN-rated feedback as candidate transcripts
npm run eval -- --update-baseline  # accept current replay scores as the new baseline
npm run eval -- --update-snapshot  # accept a changed prompt/tool surface (see below)
```

## The regression loop

1. **CI runs `npm run eval` on every PR.** It re-grades the committed golden
   transcripts (they must keep passing) and adversarial transcripts (the
   graders must keep catching them), then gates on `baseline.json`.
2. **Change the prompt, tools or model → the snapshot gate trips.** The replay
   baseline no longer reflects production, so the runner demands a live
   re-certification: `npm run eval:live`, review the scorecard, then
   `npm run eval -- --update-snapshot`.
3. **Grow the suite as the product grows.** After a live run, promote good
   transcripts from `evals/results/live-*/` into `transcripts/golden/`, and
   turn every AI bug you fix into an adversarial transcript with
   `expectedFailures` — the harness then guarantees that bug stays fixed.

## Snapshot surface

The snapshot hash covers the chat system prompts, tool definitions, model, and
the `enhance-description` prompt template (rendered against a fixed reference
input in `snapshot.ts`).

> 2026-08: hash inputs were widened — the inline prompt in
> `api/adventures/enhance-description` moved to
> `buildEnhanceDescriptionPrompt` in `src/lib/ai/prompts.ts` and joined the
> certified surface. The chat surface itself is unchanged; the snapshot was
> regenerated via `npm run eval -- --update-snapshot`.

## Fidelity notes

- Live mode replays the production loop from `src/app/api/chat/route.ts`
  exactly: same system prompt, same tool definitions, same model, one round of
  tool calls then a follow-up completion without tools (per user turn, for
  multi-turn cases).
- Tools behave as they do in production: `search_adventures` queries the
  canonical catalog (`prisma/data/adventures.json`); `search_flights`,
  `suggest_gear` and `get_weather_forecast` return the same empty stubs
  production returns today. When those tools get real implementations, update
  `executeTool` in `live.ts` alongside them.
- Grader unit tests live in `tests/unit/eval-graders.test.ts` and run with the
  normal unit suite, so grader regressions are caught even without running evals.
