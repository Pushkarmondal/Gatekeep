import { redis } from "../redisconnection/connection";

export function getCurrentMinuteKey(userId: string) {
  const now = new Date();
  const minute = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
  return `rate:${userId}:${minute}`;
}

export function getCurrentMonthKey(userId: string) {
  const now = new Date();
  const month = now.toISOString().slice(0, 7); // YYYY-MM
  return `rate:${userId}:${month}`;
}

export async function enforceLimits(request: any, reply: any) {
  const userId = request.apiUser?.id;
  if (!userId) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  // TODO: Replace with real plan lookup
  const rateLimitPerMinute = 10
  const monthlyQuota = 1000

  const rateKey = getCurrentMinuteKey(userId);
  const currentRate = await redis.incr(rateKey);

  if (currentRate === 1) {
    await redis.expire(rateKey, 60)
  }

  if (currentRate > rateLimitPerMinute) {
    return reply.status(429).send({ error: "Rate limit exceeded" })
  }

  // ---- Monthly Quota ----
  const monthKey = getCurrentMonthKey(userId)

  const currentUsage = await redis.incr(monthKey)

  if (currentUsage === 1) {
    // 40 days TTL safety
    await redis.expire(monthKey, 60 * 60 * 24 * 40)
  }

  if (currentUsage > monthlyQuota) {
    return reply.status(402).send({ error: "Monthly quota exceeded" })
  }
}
