import {z} from "zod";

export const registerUserSchema = z.object({
    email: z.email(),
    password: z.string(),
});

export const loginUserSchema = z.object({
    email: z.email(),
    password: z.string(),
});

export const createApiKeySchema = z.object({
  name: z.string().min(3, "Key name must be at least 3 characters").max(50, "Key name too long").trim(),
});

export const createPlanSchema = z.object({
  name: z.string().min(2).max(50),
  monthlyQuota: z.number().int().positive(),
  rateLimitPerMinute: z.number().int().positive(),
  priceInCents: z.number().int().nonnegative(),
  stripePriceId: z.string().optional(),
})

export const updatePlanSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  monthlyQuota: z.number().int().positive().optional(),
  rateLimitPerMinute: z.number().int().positive().optional(),
  priceInCents: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
})

export const createSubscriptionSchema = z.object({
  userId: z.uuid(),
  planId: z.uuid(),
  currentPeriodStart: z.iso.datetime(),
  currentPeriodEnd: z.iso.datetime(),
})

export const stripeWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.any()
  })
})