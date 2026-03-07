import { describe, expect, it } from "vitest";
import { parseItineraryFromLLM } from "@/lib/ai/parser";

describe("parseItineraryFromLLM", () => {
  it("parses valid JSON itinerary from markdown code block", () => {
    const content = `Here's your itinerary:

\`\`\`json
{
  "title": "Nepal Trek",
  "description": "A 5-day trek in the Himalayas",
  "days": [
    {
      "dayNumber": 1,
      "title": "Arrival in Kathmandu",
      "activities": [
        {
          "time": "14:00",
          "activity": "Airport pickup",
          "location": "Tribhuvan Airport"
        }
      ]
    }
  ]
}
\`\`\``;

    const result = parseItineraryFromLLM(content);
    expect(result).not.toBeNull();
    expect(result?.title).toBe("Nepal Trek");
    expect(result?.days).toHaveLength(1);
    expect(result?.days[0].dayNumber).toBe(1);
  });

  it("returns null for invalid content", () => {
    const result = parseItineraryFromLLM("Just some text without JSON");
    expect(result).toBeNull();
  });

  it("returns null for invalid JSON structure", () => {
    const content = '```json\n{"invalid": true}\n```';
    const result = parseItineraryFromLLM(content);
    expect(result).toBeNull();
  });
});
