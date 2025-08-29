import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import type { JWTPayload } from "@/types/auth.types";

export const authMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    console.log('authMiddleware called, headers:', request.headers.authorization);
    const decoded = (await request.jwtVerify()) as JWTPayload;
    console.log('JWT verified, decoded:', decoded);
    request.user = decoded;
  } catch (err) {
    console.error('JWT verification failed:', err);
    reply.status(401).send({
      success: false,
      error: "Unauthorized",
    });
  }
};

export const optionalAuthMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const decoded = (await request.jwtVerify()) as JWTPayload;
    request.user = decoded;
  } catch (err) {
    // 인증 실패해도 계속 진행
    (request as any).user = undefined;
  }
};

// Fastify 인스턴스에 authenticate 메서드 추가
export const setupAuthDecorator = (app: FastifyInstance) => {
  app.decorate("authenticate", authMiddleware);
  app.decorate("optionalAuth", optionalAuthMiddleware);
};
