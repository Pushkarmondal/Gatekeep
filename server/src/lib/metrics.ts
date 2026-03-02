import { redis } from "../redisconnection/connection"


const METRIC_PREFIX = "metrics"

function key(name: string) {
  return `${METRIC_PREFIX}:${name}`
}

export async function incrementMetric(name: string) {
  await redis.incr(key(name))
}

export async function getMetric(name: string) {
  const value = await redis.get(key(name))
  return Number(value || 0)
}

export async function getAllMetrics() {
  const keys = [
    "total_requests",
    "rate_limit_hits",
    "quota_exceeded",
    "subscription_blocked",
    "invalid_api_key",
  ]

  const results: Record<string, number> = {}

  for (const k of keys) {
    results[k] = await getMetric(k)
  }

  return results
}