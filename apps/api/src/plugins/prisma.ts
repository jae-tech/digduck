import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import fp from "fastify-plugin";

// Fastify 타입 확장
declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const prisma = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["info"],
  });

  // 데이터베이스 연결
  await prisma.$connect();

  // Fastify에 prisma 추가
  fastify.decorate("prisma", prisma);

  // 앱 종료 시 연결 해제
  fastify.addHook("onClose", async (fastify) => {
    await fastify.prisma.$disconnect();
  });
});
