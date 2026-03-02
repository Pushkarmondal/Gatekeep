import { prisma } from "../../db"
import crypto from "crypto"
import { incrementMetric } from "../lib/metrics"

function hashApiKey(rawKey: string) {
  return crypto
    .createHash("sha256")
    .update(rawKey)
    .digest("hex")
}

export async function validateApiKey(request: any, reply: any) {
  const authHeader = request.headers.authorization

  if (!authHeader?.startsWith("Bearer ")) {
    await incrementMetric("invalid_api_key")
    return reply.status(401).send({ error: "Missing API key" })
  }

  const rawKey = authHeader.split(" ")[1]

  const keyHash = hashApiKey(rawKey)

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: true }
  })

  if (!apiKey || apiKey.revoked) {
    await incrementMetric("invalid_api_key")
    return reply.status(403).send({ error: "Invalid API key" })
  }

  request.apiUser = {
    id: apiKey.user.id
  }
}