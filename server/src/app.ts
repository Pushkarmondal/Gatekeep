import Fastify from "fastify";
import { registerUserHandler, loginUserHandler } from "./controller/auth.controller";
import { createApiKeySchema, loginUserSchema, registerUserSchema } from "./schema/zodSchema";

import {validatorCompiler,serializerCompiler, type ZodTypeProvider} from "fastify-type-provider-zod"
import { createApiKey, getApiKey } from "./controller/apiKey.controller";
import { authenticate } from "./middleware/middleware";

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
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function start() {
  try {
    const address = await fastify.listen({
      port: PORT,
    })
    console.log(`Server running at PORT -> http://localhost:${PORT}`)
  } catch (err) {
    console.error("BOOT ERROR:", err)
    process.exit(1)
  }
}
start()
