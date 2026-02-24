import Fastify from "fastify";

const fastify = Fastify({});

fastify.get("/", function (request, reply) {
  reply.send({ hello: "world" });
});

fastify.listen({ port: 3000 }, function (err, address) {
  console.log("App runnig on PORT 3000");
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
