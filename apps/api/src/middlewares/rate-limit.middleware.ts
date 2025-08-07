import { FastifyRequest, FastifyReply } from "fastify";

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware = (options: RateLimitOptions) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const key = request.ip;
    const now = Date.now();
    const windowMs = options.windowMs;

    const userRequests = requestCounts.get(key);

    if (!userRequests || now > userRequests.resetTime) {
      // 새로운 윈도우 시작
      requestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return;
    }

    if (userRequests.count >= options.maxRequests) {
      const remainingTime = Math.ceil((userRequests.resetTime - now) / 1000);

      reply.status(429).send({
        success: false,
        error: options.message || "Too many requests",
        retryAfter: remainingTime,
      });
      return;
    }

    userRequests.count++;
  };
};
