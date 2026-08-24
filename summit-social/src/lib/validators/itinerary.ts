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

export type ItineraryStatusValue = "DRAFT" | "PLANNING" | "BOOKED" | "COMPLETED";

// Forward-only lifecycle, with one escape hatch: a BOOKED trip may fall back
// to PLANNING (cancellation/re-plan). Anything else is a client bug.
const LEGAL_TRANSITIONS: Record<ItineraryStatusValue, ItineraryStatusValue[]> = {
  DRAFT: ["PLANNING", "BOOKED"],
  PLANNING: ["BOOKED", "DRAFT"],
  BOOKED: ["COMPLETED", "PLANNING"],
  COMPLETED: [],
};

export function isLegalStatusTransition(
  from: ItineraryStatusValue,
  to: ItineraryStatusValue,
): boolean {
  return from === to || LEGAL_TRANSITIONS[from].includes(to);
}
