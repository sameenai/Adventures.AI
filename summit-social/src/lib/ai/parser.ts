import { z } from "zod";

const ActivitySchema = z.object({
  time: z.string(),
  activity: z.string(),
  location: z.string(),
  notes: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const ItineraryDaySchema = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string(),
  description: z.string().optional(),
  activities: z.array(ActivitySchema),
});

export const ParsedItinerarySchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  days: z.array(ItineraryDaySchema),
});

export type ParsedItinerary = z.infer<typeof ParsedItinerarySchema>;
export type ItineraryDay = z.infer<typeof ItineraryDaySchema>;
export type Activity = z.infer<typeof ActivitySchema>;

export const SearchAdventuresArgsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  continent: z.string().optional(),
  difficulty: z.string().optional(),
  maxDuration: z.number().optional(),
});

export type SearchAdventuresArgs = z.infer<typeof SearchAdventuresArgsSchema>;

export function parseItineraryFromLLM(content: string): ParsedItinerary | null {
  const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[1]);
    return ParsedItinerarySchema.parse(parsed);
  } catch {
    return null;
  }
}
