import Fastify from "fastify";
import { registerUserHandler, loginUserHandler } from "./controller/auth.controller";
import { createApiKeySchema, loginUserSchema, registerUserSchema, updateSubscriptionSchema } from "./schema/zodSchema";

import {validatorCompiler,serializerCompiler, type ZodTypeProvider} from "fastify-type-provider-zod"
import { createApiKey, getApiKey } from "./controller/apiKey.controller";
import { authenticate } from "./middleware/middleware";
import { validateApiKey } from "./middleware/apiKeyMiddleware";
import { enforceLimits } from "./middleware/enforceLimits";
import { redis } from "./redisconnection/connection";
import { syncUsageToDB } from "./jobs/usageSync";
import { updateSubscriptionHandler } from "./controller/internalSubscription.controller";
import { metricsHandler } from "./controller/internalMetrics.controller";

const fastify = Fastify({ logger: false })
  .setValidatorCompiler(validatorCompiler)
  .setSerializerCompiler(serializerCompiler)
  .withTypeProvider<ZodTypeProvider>()

const PORT = 3000;
fastify.get("/", function (request, reply) {
  reply.send({ hello: "world" });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Auth Routes
fastify.post(
  "/auth/register",
  {
    schema: {
      body: registerUserSchema,
    },
  },
  registerUserHandler
)

fastify.post(
  "/auth/login",
  {
    schema: {
      body: loginUserSchema,
    },
  },
  loginUserHandler
)

fastify.post(
  "/api-key/create",
  {
    preHandler: authenticate,
    schema: {
      body: createApiKeySchema,
    },
  },
  createApiKey
)

fastify.get(
  "/api-key/get",
  {
    preHandler: authenticate,
  },
  getApiKey
)

fastify.get(
  "/protected",
  {
    preHandler: [validateApiKey, enforceLimits]
  },
  async (request, reply) => {
    return {
      message: "Access granted",
      userId: request.apiUser?.id
    }
  }
)

fastify.post(
  "/internal/subscription/update",
  {
    preHandler: authenticate,
    schema: { body: updateSubscriptionSchema },
  },
  updateSubscriptionHandler
)

fastify.get("/internal/metrics", metricsHandler)
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function start() {
  try {
    await redis.connect()
    const address = await fastify.listen({
      port: PORT,
    })
    console.log(`Server running at PORT -> http://localhost:${PORT}`)

    // 🔥 Background job
    setInterval(async () => {
      await syncUsageToDB().catch((err) => {
        console.error("Usage sync failed:", err)
      })
    }, 5 * 60 * 1000)

  } catch (err) {
    console.error("BOOT ERROR:", err)
    process.exit(1)
  }
}
start()
