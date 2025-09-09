import { prisma } from "@/plugins/prisma";
import type { JWTPayload } from "@/types/auth.types";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

// 서비스 코드에 따른 리다이렉트 경로 매핑
const getServiceRoute = (serviceCode: string): string => {
  const serviceRoutes: Record<string, string> = {
    "NAVER_BLOG_CRAWLING": "/crawler/naver-blog",
    // 추가 구현된 서비스들은 여기에 추가
  };
  return serviceRoutes[serviceCode] || "/dashboard";
};

// 라이센스 정보로부터 리다이렉트 경로 계산
const getRedirectPath = async (licenseKey: string): Promise<string | null> => {
  try {
    const licenseData = await prisma.licenses.findUnique({
      where: { licenseKey },
      include: {
        user: { select: { isAdmin: true } },
        service: { select: { code: true } },
      },
    });

    if (!licenseData) return null;

    // 관리자는 관리자 대시보드로
    if (licenseData.user.isAdmin) {
      return "/admin/dashboard";
    }

    // 일반 사용자는 서비스별 페이지로
    return getServiceRoute(licenseData.service.code);
  } catch (error) {
    console.error("Error getting redirect path:", error);
    return null;
  }
};

export const authMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    console.log(
      "authMiddleware called, headers:",
      request.headers.authorization
    );
    const decoded = (await request.jwtVerify()) as JWTPayload;
    console.log("JWT verified, decoded:", decoded);
    request.user = decoded;

    // 리다이렉트 경로 계산하여 요청 객체에 추가
    if (decoded.licenseKey) {
      const redirectPath = await getRedirectPath(decoded.licenseKey);
      if (redirectPath) {
        (request as any).redirectPath = redirectPath;
      }
    }
  } catch (err) {
    console.error("JWT verification failed:", err);
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
