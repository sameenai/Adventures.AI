import { z } from "zod";

export const createItinerarySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
  budget: z.number().int().min(0).optional(),
  travellers: z.number().int().min(1).max(99).optional(),
});

export const updateItinerarySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(["DRAFT", "PLANNING", "BOOKED", "COMPLETED"]).optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
  budget: z.number().int().min(0).nullable().optional(),
  travellers: z.number().int().min(1).max(99).optional(),
});

export type CreateItineraryInput = z.infer<typeof createItinerarySchema>;
export type UpdateItineraryInput = z.infer<typeof updateItinerarySchema>;
