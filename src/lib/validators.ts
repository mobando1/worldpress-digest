import { z } from "zod";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(1, "Name is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

export const createSourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens"
    ),
  url: z.string().url("Invalid URL"),
  rssUrl: z.string().url("Invalid RSS URL").optional().or(z.literal("")),
  type: z.enum(["RSS", "API", "SCRAPE"]),
  region: z.string().optional(),
  language: z.string().default("en"),
  category: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export type CreateSourceInput = z.infer<typeof createSourceSchema>;

export const updateSourceSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens"
    )
    .optional(),
  url: z.string().url().optional(),
  rssUrl: z.string().url().optional().or(z.literal("")).nullable(),
  type: z.enum(["RSS", "API", "SCRAPE"]).optional(),
  region: z.string().optional().nullable(),
  language: z.string().optional(),
  category: z.string().optional().nullable(),
  enabled: z.boolean().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "ERROR", "DISABLED"]).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateSourceInput = z.infer<typeof updateSourceSchema>;

// ---------------------------------------------------------------------------
// Alert Rules
// ---------------------------------------------------------------------------

export const createAlertRuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  keywords: z
    .array(z.string().min(1))
    .min(1, "At least one keyword is required"),
  minBreakingScore: z.number().int().min(0).max(100).default(0),
  channels: z
    .array(z.enum(["EMAIL", "PUSH", "IN_APP"]))
    .min(1, "At least one channel is required"),
  categoryIds: z.array(z.string().uuid()),
});

export type CreateAlertRuleInput = z.infer<typeof createAlertRuleSchema>;

export const updateAlertRuleSchema = z.object({
  name: z.string().min(1).optional(),
  keywords: z.array(z.string().min(1)).optional(),
  minBreakingScore: z.number().int().min(0).max(100).optional(),
  channels: z.array(z.enum(["EMAIL", "PUSH", "IN_APP"])).optional(),
  enabled: z.boolean().optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
});

export type UpdateAlertRuleInput = z.infer<typeof updateAlertRuleSchema>;

// ---------------------------------------------------------------------------
// Article Filters
// ---------------------------------------------------------------------------

export const articleFiltersSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  sourceId: z.string().uuid().optional(),
  language: z.string().optional(),
  country: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ArticleFiltersInput = z.infer<typeof articleFiltersSchema>;
