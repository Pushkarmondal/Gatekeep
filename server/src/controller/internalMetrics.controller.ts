import { getAllMetrics } from "../lib/metrics"

export async function metricsHandler(request: any, reply: any) {
  const metrics = await getAllMetrics()

  return reply.send({
    metrics,
    timestamp: new Date().toISOString(),
  })
}