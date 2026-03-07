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
