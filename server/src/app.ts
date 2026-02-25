import Fastify from "fastify";
import { registerUserHandler, loginUserHandler } from "./controller/auth.controller";

const fastify = Fastify({});

fastify.get("/", function (request, reply) {
  reply.send({ hello: "world" });
});

fastify.post("/auth/register", registerUserHandler)
fastify.post("/auth/login", loginUserHandler)


fastify.listen({ port: 3000 }, function (err, address) {
  console.log("App runnig on PORT 3000");
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
