import { prisma } from "../../db"
import { SubscriptionStatus } from "../../generated/prisma/enums"
import { redis } from "../redisconnection/connection"

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

  // 3️⃣ Cache for 5 minutes
  await redis.set(cacheKey, JSON.stringify(snapshot), {
    EX: 60 * 5,
  })

  return snapshot
}