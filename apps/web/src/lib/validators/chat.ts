import { z } from "zod";

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  itineraryId: z.string().optional(),
  preferences: z
    .object({
      budget: z.number().int().positive().optional(),
      fitnessLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
      travelDates: z
        .object({
          start: z.string(),
          end: z.string(),
        })
        .optional(),
      travellers: z.number().int().min(1).max(20).optional(),
    })
    .optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

export const chatFeedbackSchema = z.object({
  itineraryId: z.string().min(1),
  /** Index into the itinerary's stored chatHistory of the assistant reply being rated. */
  messageIndex: z.number().int().min(0),
  rating: z.enum(["UP", "DOWN"]),
  comment: z.string().max(500).optional(),
});

export type ChatFeedbackInput = z.infer<typeof chatFeedbackSchema>;
