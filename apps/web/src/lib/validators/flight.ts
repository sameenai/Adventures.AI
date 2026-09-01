import { z } from "zod";

export const flightSearchSchema = z.object({
  origin: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/, "Must be a valid IATA code"),
  destination: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/, "Must be a valid IATA code"),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  passengers: z.number().int().min(1).max(9).default(1),
  cabinClass: z.enum(["economy", "premium_economy", "business", "first"]).default("economy"),
});

export type FlightSearchInput = z.infer<typeof flightSearchSchema>;
