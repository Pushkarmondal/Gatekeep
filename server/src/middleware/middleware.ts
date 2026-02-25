import jwt from "jsonwebtoken";

export async function authenticate(request: any, reply: any) {
  try {
    console.log("Auth header:", request.headers.authorization);

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No valid auth header");
      return reply.status(401).send({ error: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-jwt-secret",
    ) as { id: string };
    request.user = { id: decoded.id };
  } catch (err) {
    console.log("JWT ERROR:", err);
    return reply.status(401).send({ error: "Invalid token" });
  }
}
