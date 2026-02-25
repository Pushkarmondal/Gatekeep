import Fastify from "fastify";
import { registerUserHandler, loginUserHandler } from "./controller/auth.controller";
import { loginUserSchema, registerUserSchema } from "./schema/zodSchema";

import {validatorCompiler,serializerCompiler, type ZodTypeProvider} from "fastify-type-provider-zod"

const fastify = Fastify({ logger: false })
  .setValidatorCompiler(validatorCompiler)
  .setSerializerCompiler(serializerCompiler)
  .withTypeProvider<ZodTypeProvider>()

const PORT = 3000;
fastify.get("/", function (request, reply) {
  reply.send({ hello: "world" });
});

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


// fastify.listen({ port: 3000 }, function (err, address) {
//   console.log("App runnig on PORT 3000");
//   if (err) {
//     fastify.log.error(err);
//     process.exit(1);
//   }
// });

async function start() {
  try {
    const address = await fastify.listen({
      port: PORT,
    })
    console.log(`Server running at PORT ->: ${PORT}`)
  } catch (err) {
    console.error("BOOT ERROR:", err)
    process.exit(1)
  }
}
start()
