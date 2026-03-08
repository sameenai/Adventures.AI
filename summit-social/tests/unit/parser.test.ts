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

  it("parses raw JSON object without code block", () => {
    const content = JSON.stringify({
      title: "Alpine Adventure",
      days: [
        {
          dayNumber: 1,
          title: "Arrival",
          activities: [{ time: "10:00", activity: "Check in", location: "Hotel" }],
        },
      ],
    });
    const result = parseItineraryFromLLM(content);
    expect(result).not.toBeNull();
    expect(result?.title).toBe("Alpine Adventure");
  });

  it("parses itinerary with optional description", () => {
    const content = `\`\`\`json
{
  "title": "Desert Trek",
  "description": "A journey through the Sahara",
  "days": [
    {
      "dayNumber": 1,
      "title": "Day 1",
      "description": "Starting point",
      "activities": [{ "time": "06:00", "activity": "Sunrise hike", "location": "Dune base" }]
    }
  ]
}
\`\`\``;
    const result = parseItineraryFromLLM(content);
    expect(result?.description).toBe("A journey through the Sahara");
    expect(result?.days[0].description).toBe("Starting point");
  });

  it("parses activities with optional notes and coordinates", () => {
    const content = `\`\`\`json
{
  "title": "City Walk",
  "days": [
    {
      "dayNumber": 1,
      "title": "Morning",
      "activities": [
        {
          "time": "09:00",
          "activity": "Museum visit",
          "location": "British Museum",
          "notes": "Bring ID",
          "lat": 51.5194,
          "lng": -0.1270
        }
      ]
    }
  ]
}
\`\`\``;
    const result = parseItineraryFromLLM(content);
    expect(result?.days[0].activities[0].notes).toBe("Bring ID");
    expect(result?.days[0].activities[0].lat).toBeCloseTo(51.5194);
    expect(result?.days[0].activities[0].lng).toBeCloseTo(-0.127);
  });

  it("parses multi-day itinerary", () => {
    const days = Array.from({ length: 7 }, (_, i) => ({
      dayNumber: i + 1,
      title: `Day ${i + 1}`,
      activities: [{ time: "08:00", activity: `Activity ${i + 1}`, location: "Location" }],
    }));

    const content = `\`\`\`json
${JSON.stringify({ title: "Week Adventure", days })}
\`\`\``;

    const result = parseItineraryFromLLM(content);
    expect(result?.days).toHaveLength(7);
    expect(result?.days[6].dayNumber).toBe(7);
  });

  it("returns null for missing title", () => {
    const content = `\`\`\`json
{
  "days": [{ "dayNumber": 1, "title": "Day 1", "activities": [] }]
}
\`\`\``;
    const result = parseItineraryFromLLM(content);
    expect(result).toBeNull();
  });

  it("returns null for missing days array", () => {
    const content = `\`\`\`json
{"title": "No Days"}
\`\`\``;
    const result = parseItineraryFromLLM(content);
    expect(result).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    const content = "```json\n{title: 'missing quotes'}\n```";
    const result = parseItineraryFromLLM(content);
    expect(result).toBeNull();
  });

  it("returns null for empty string", () => {
    const result = parseItineraryFromLLM("");
    expect(result).toBeNull();
  });

  it("handles extra whitespace around the code block", () => {
    const content = `
      Some preamble text.

      \`\`\`json
      {
        "title": "Spaced Out",
        "days": [
          {
            "dayNumber": 1,
            "title": "Day 1",
            "activities": [{ "time": "10:00", "activity": "Start", "location": "Here" }]
          }
        ]
      }
      \`\`\`

      Some postamble.
    `;
    const result = parseItineraryFromLLM(content);
    expect(result).not.toBeNull();
    expect(result?.title).toBe("Spaced Out");
  });
});
