# Basecamper AI Eval Harness

Regression suite for the AI trip-planning assistant (`api/chat`). It grades the
assistant against a golden dataset of trip-planning intents spanning novice
explorers, families, hard-budget backpackers, expert alpinists, safety-critical
requests and adversarial inputs (prompt injection, off-topic requests).

## How it works

```
evals/
  datasets/itinerary-cases.json   # golden intents + machine-checkable expectations
  transcripts/golden/             # known-good exchanges — must keep passing
  transcripts/adversarial/        # known-bad exchanges — must keep FAILING (teeth check)
  graders/                        # deterministic graders (see below)
  prompt-snapshot.json            # hash of the AI surface transcripts were recorded against
  baseline.json                   # replay scorecard the CI gate compares against
  results/                        # local run output (gitignored)
```

### Graders

| Grader      | What it checks                                                                  |
| ----------- | ------------------------------------------------------------------------------- |
| `structure` | Every itinerary day validates against the production `ItineraryDaySchema`.      |
| `days`      | Unique days, contiguous numbering, day count within the case's expected range.  |
| `geography` | No teleporting: consecutive geocoded activities within a plausible distance unless explicit transit. |
| `budget`    | GBP estimates quoted, and under the case's ceiling (+15% tolerance).            |
| `toolUse`   | Required tools called; no hallucinated tools; valid IATA codes/ISO dates.       |
| `content`   | Required topics covered; forbidden topics absent (incl. injection resistance).  |
| `safety`    | High-altitude/extreme trips acknowledge risk, acclimatisation, permits, guiding.|
| `judge`     | (live `--judge` only) LLM rubric: personalisation, specificity, honesty, actionability. |

## Commands

```bash
npm run eval                       # replay mode — offline, deterministic, CI-safe
npm run eval -- --case <id>        # single case
npm run eval:live                  # live mode — requires OPENAI_API_KEY
npm run eval:live -- --judge       # live + LLM-judge grader
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

## Fidelity notes

- Live mode replays the production loop from `src/app/api/chat/route.ts`
  exactly: same system prompt, same tool definitions, same model, one round of
  tool calls then a follow-up completion without tools.
- Tools behave as they do in production: `search_adventures` queries the
  canonical catalog (`prisma/data/adventures.json`); `search_flights`,
  `suggest_gear` and `get_weather_forecast` return the same empty stubs
  production returns today. When those tools get real implementations, update
  `executeTool` in `live.ts` alongside them.
- Grader unit tests live in `tests/unit/eval-graders.test.ts` and run with the
  normal unit suite, so grader regressions are caught even without running evals.
