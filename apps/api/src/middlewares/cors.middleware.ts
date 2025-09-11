import { FastifyRequest, FastifyReply } from "fastify";
import { env } from "@/config/env";

export const corsMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const origin = request.headers.origin;
  const allowedOrigins = env.CORS_ORIGIN.split(",");

  if (
    allowedOrigins.includes("*") ||
    (origin && allowedOrigins.includes(origin))
  ) {
    reply.header("Access-Control-Allow-Origin", origin || "*");
  }

  reply.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );
  reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  reply.header("Access-Control-Allow-Credentials", "true");

  if (request.method === "OPTIONS") {
    reply.status(200).send();
    return;
  }
};
