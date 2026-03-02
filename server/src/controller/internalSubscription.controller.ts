import { prisma } from "../../db"
import { redis } from "../redisconnection/connection"


export async function updateSubscriptionHandler(request: any, reply: any) {
  const { userId, status, planId } = request.body

  const subscription = await prisma.subscription.findFirst({
    where: { userId },
  })

  if (!subscription) {
    return reply.status(404).send({ error: "Subscription not found" })
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status,
      ...(planId && { planId }),
    },
  })

  // 🔥 Invalidate plan cache
  await redis.del(`plan:${userId}`)

  return reply.send({ message: "Subscription updated" })
}