import { prisma } from "../../db"
import { SubscriptionStatus } from "../../generated/prisma/enums"
import { redis } from "../redisconnection/connection"
import { createPlanSchema, createSubscriptionSchema } from "../schema/zodSchema"

interface PlanSnapshot {
  rateLimitPerMinute: number
  monthlyQuota: number
}

function getPlanCacheKey(userId: string) {
  return `plan:${userId}`
}

export async function getUserPlan(userId: string): Promise<PlanSnapshot> {
  const cacheKey = getPlanCacheKey(userId)

  // 1️⃣ Try Redis first
  const cached = await redis.get(cacheKey)

  if (cached) {
    return JSON.parse(cached)
  }

  // 2️⃣ Fallback to DB
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE,
    },
    include: {
      plan: true,
    },
  })

  if (!subscription) {
    throw new Error("NO_ACTIVE_SUBSCRIPTION")
  }

  const snapshot: PlanSnapshot = {
    rateLimitPerMinute: subscription.plan.rateLimitPerMinute,
    monthlyQuota: subscription.plan.monthlyQuota,
  }

  // 3️⃣ Cache for 10 minutes
  await redis.set(cacheKey, JSON.stringify(snapshot), {
    EX: 60 * 10,
  })

  return snapshot
}

export async function createPlan(request: any, reply: any) {
    try {
        const {name, monthlyQuota, rateLimitPerMinute, priceInCents, stripePriceId} = createPlanSchema.parse(request.body)
        if(!name || !monthlyQuota || !rateLimitPerMinute || !priceInCents) {
            return reply.status(400).send({ error: "Missing required fields" })
        }
        const createPlanData = await prisma.plan.create({
            data: {
                name,
                monthlyQuota,
                rateLimitPerMinute,
                priceInCents,
                stripePriceId,
                active: true
            }
        })
        return reply.status(201).send(createPlanData)
    } catch (error) {
        return reply.status(500).send({ error: "Failed to create plan" })
    }
}

export async function createSubscription(request: any, reply: any) {
    try {
        const {userId, planId, currentPeriodStart, currentPeriodEnd} = createSubscriptionSchema.parse(request.body)
        if(!userId || !planId || !currentPeriodStart || !currentPeriodEnd) {
            return reply.status(400).send({ error: "Missing required fields" })
        }
        const createSubscriptionData = await prisma.subscription.create({
            data: {
                userId,
                planId,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: SubscriptionStatus.ACTIVE,
                stripeSubscriptionId: "temp-stripe-id"
            }
        })
        return reply.status(201).send(createSubscriptionData)
    } catch (error) {
        return reply.status(500).send({ error: "Failed to create subscription" })
    }
}