import { FastifyRequest, FastifyReply, FastifyError } from "fastify";
import { env } from "../config/env";

interface AppError extends Error {
  statusCode?: number;
  code?: string;
  validation?: any[];
}

export const errorHandler = (
  error: FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let details: any = undefined;
  let emoji = "💥";

  // 에러 타입별 이모티콘과 메시지
  if ("validation" in error && error.validation) {
    statusCode = 400;
    message = "Validation Error";
    details = error.validation;
    emoji = "📝";
  } else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
    if (statusCode === 401) emoji = "🔐";
    else if (statusCode === 403) emoji = "🚫";
    else if (statusCode === 404) emoji = "🔍";
    else if (statusCode === 409) emoji = "⚠️";
  } else if (
    error.message.includes("jwt") ||
    error.code === "FST_JWT_AUTHORIZATION_TOKEN_INVALID"
  ) {
    statusCode = 401;
    message = "Invalid or expired token";
    emoji = "🔐";
  } else if (error.code === "23505") {
    statusCode = 409;
    message = "Resource already exists";
    emoji = "📋";
  } else if (error.code === "23503") {
    statusCode = 400;
    message = "Invalid reference";
    emoji = "🔗";
  } else if (error.code === "FST_TOO_MANY_REQUESTS") {
    statusCode = 429;
    message = "Too many requests";
    emoji = "🚦";
  }

  // 로그 출력
  request.log.error(
    {
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
      },
      request: {
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: request.body,
      },
    },
    `${emoji} ❌ ${message}`
  );

  const response: any = {
    success: false,
    error: message,
    statusCode,
  };

  if (details) {
    response.details = details;
  }

  if (env.NODE_ENV === "development") {
    response.stack = error.stack;
    response.originalError = error.message;
  }

  reply.status(statusCode).send(response);
};
