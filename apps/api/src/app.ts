import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import postgres from "@fastify/postgres";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

import { env } from "@/config/env";
import { registerRoutes } from "@/routes";
import { errorHandler } from "@/middlewares/error.middleware";
import { setupAuthDecorator } from "@/middlewares/auth.middleware";
import { setAppInstance } from "@/controllers/auth.controller";
import { setUserAppInstance } from "@/controllers/user.controller";
import type { JWTPayload } from "@repo/shared";
import logger, { loggerConfig } from "@/utils/logger";

// 타입 확장 (수정됨)
declare module "fastify" {
  interface FastifyRequest {
    startTime?: number;
    user: JWTPayload;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: JWTPayload;
    payload: JWTPayload;
  }
}

export const build = async (): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: loggerConfig,
    genReqId: () => crypto.randomUUID(),
  });

  // 요청 시작 로깅 훅
  app.addHook("onRequest", async (request, reply) => {
    if (request.url === "/favicon.ico") return;

    // 요청 시작 시간 기록
    request.startTime = Date.now();

    // 메서드별 이모티콘
    const methodEmojis: Record<string, string> = {
      GET: "📥",
      POST: "📤",
      PUT: "✏️",
      DELETE: "🗑️",
      PATCH: "🔧",
    };

    const emoji = methodEmojis[request.method] || "📄";

    logger.info(
      {
        method: request.method,
        url: request.url,
        userAgent: request.headers["user-agent"],
        ip: request.ip,
      },
      `${emoji} ${request.method} ${request.url} - Request started`
    );
  });

  // 요청 완료 로깅 훅
  app.addHook("onResponse", async (request, reply) => {
    const duration = Date.now() - (request.startTime || 0);

    // 상태코드별 이모티콘
    const getStatusEmoji = (statusCode: number) => {
      if (statusCode >= 500) return "💥"; // 서버 에러
      if (statusCode >= 400) return "❌"; // 클라이언트 에러
      if (statusCode >= 300) return "🔄"; // 리다이렉트
      if (statusCode >= 200) return "✅"; // 성공
      return "❓"; // 기타
    };

    // 응답 시간별 이모티콘
    const getSpeedEmoji = (duration: number) => {
      if (duration < 100) return "⚡"; // 매우 빠름
      if (duration < 500) return "🏃"; // 빠름
      if (duration < 1000) return "🚶"; // 보통
      if (duration < 3000) return "🐌"; // 느림
      return "🐢"; // 매우 느림
    };

    const statusEmoji = getStatusEmoji(reply.statusCode);
    const speedEmoji = getSpeedEmoji(duration);

    logger.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration: `${duration}ms`,
        success: reply.statusCode < 400,
      },
      `${statusEmoji} ${speedEmoji} ${request.method} ${request.url} - ${reply.statusCode} (${duration}ms)`
    );
  });

  // 에러 로깅 훅
  app.addHook("onError", async (request, reply, error) => {
    const duration = Date.now() - (request.startTime || 0);

    logger.error(
      {
        method: request.method,
        url: request.url,
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
        },
        duration: `${duration}ms`,
      },
      `🔥 💣 ${request.method} ${request.url} - ERROR: ${error.message}`
    );
  });

  // Swagger 등록
  await app.register(swagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "My Fullstack API",
        version: "1.0.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: "1 minute",
  });

  // Security plugins
  await app.register(helmet);
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  // JWT plugin
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  // Database plugin
  await app.register(postgres, {
    connectionString: env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Auth decorator 설정
  setupAuthDecorator(app);

  // 컨트롤러에 app 인스턴스 전달
  setAppInstance(app);
  setUserAppInstance(app);

  // Error handler
  app.setErrorHandler(errorHandler);

  // Routes
  await registerRoutes(app);

  return app;
};
