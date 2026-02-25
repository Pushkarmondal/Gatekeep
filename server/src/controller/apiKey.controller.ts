import crypto from "crypto";
import { prisma } from "../../db";

export async function createApiKey(request: any, reply: any) {
  try {
    const userId = request.user.id;
    const { name } = request.body;
    if (!name) {
      return reply.status(400).send({ error: "Key name is required!" });
    }
    const randomBytes = crypto.randomBytes(32).toString("hex");
    const rawKey = `gk_live_${randomBytes}`;
    const hashKey = crypto.createHash("sha256").update(rawKey).digest("hex");

    const createHashKey = await prisma.apiKey.create({
      data: {
        name,
        keyHash: hashKey,
        userId,
      },
    });
    return reply.status(201).send({
      id: createHashKey.id,
      name: createHashKey.name,
      apiKey: rawKey,
      createdAt: createHashKey.createdAt,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: "Internal server error" });
  }
}
