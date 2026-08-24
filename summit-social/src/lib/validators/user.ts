import { z } from "zod";

/**
 * Zod's .url() accepts javascript:, data: and vbscript: schemes, which render
 * into <a href> on public pages — a stored-XSS vector. Restrict to http(s).
 */
export const httpUrlSchema = z
  .string()
  .url()
  .refine((value) => /^https?:\/\//i.test(value), "Must be an http(s) URL");

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  instagramUrl: httpUrlSchema.optional().or(z.literal("")),
  twitterUrl: httpUrlSchema.optional().or(z.literal("")),
  websiteUrl: httpUrlSchema.optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
