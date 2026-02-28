// import { redis } from "../redisconnection/connection";

import { getUserPlan } from "../controller/plan.controller"
import { redis } from "../redisconnection/connection"

// export function getCurrentMinuteKey(userId: string) {
//   const now = new Date();
//   const minute = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
//   return `rate:${userId}:${minute}`;
// }

// export function getCurrentMonthKey(userId: string) {
//   const now = new Date();
//   const month = now.toISOString().slice(0, 7); // YYYY-MM
//   return `rate:${userId}:${month}`;
// }

// export async function enforceLimits(request: any, reply: any) {
//   const userId = request.apiUser?.id;
//   if (!userId) {
//     return reply.status(401).send({ error: "Unauthorized" });
//   }

//   // TODO: Replace with real plan lookup
//   const rateLimitPerMinute = 10
//   const monthlyQuota = 1000

//   const rateKey = getCurrentMinuteKey(userId);
//   const currentRate = await redis.incr(rateKey);

//   if (currentRate === 1) {
//     await redis.expire(rateKey, 60)
//   }

//   if (currentRate > rateLimitPerMinute) {
//     return reply.status(429).send({ error: "Rate limit exceeded" })
//   }

//   // ---- Monthly Quota ----
//   const monthKey = getCurrentMonthKey(userId)

//   const currentUsage = await redis.incr(monthKey)

//   if (currentUsage === 1) {
//     // 40 days TTL safety
//     await redis.expire(monthKey, 60 * 60 * 24 * 40)
//   }

//   if (currentUsage > monthlyQuota) {
//     return reply.status(402).send({ error: "Monthly quota exceeded" })
//   }
// }






function getCurrentMinuteKey(userId: string) {
  const now = new Date()
  const minute = now.toISOString().slice(0, 16)
  return `rate:${userId}:${minute}`
}

function getCurrentMonthKey(userId: string) {
  const now = new Date()
  const month = now.toISOString().slice(0, 7)
  return `usage:${userId}:${month}`
}

export async function enforceLimits(request: any, reply: any) {
  try {
    const userId = request.apiUser?.id

    if (!userId) {
      return reply.status(401).send({ error: "Unauthorized" })
    }

    // 🔥 Load dynamic plan
    const plan = await getUserPlan(userId)

    // ---- Rate Limit ----
    const rateKey = getCurrentMinuteKey(userId)

    const currentRate = await redis.incr(rateKey)

    if (currentRate === 1) {
      await redis.expire(rateKey, 60)
    }

    if (currentRate > plan.rateLimitPerMinute) {
      return reply.status(429).send({ error: "Rate limit exceeded" })
    }

    // ---- Monthly Quota ----
    const monthKey = getCurrentMonthKey(userId)

    const currentUsage = await redis.incr(monthKey)

    if (currentUsage === 1) {
      await redis.expire(monthKey, 60 * 60 * 24 * 40)
    }

    if (currentUsage > plan.monthlyQuota) {
      return reply.status(402).send({ error: "Monthly quota exceeded" })
    }

  } catch (err: any) {
    if (err.message === "NO_ACTIVE_SUBSCRIPTION") {
      return reply.status(403).send({ error: "No active subscription" })
    }

    request.log.error(err)
    return reply.status(500).send({ error: "Enforcement error" })
  }
}