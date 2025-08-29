import { FastifyRequest, FastifyReply } from "fastify";
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
} from "@/decorators/controller.decorator";
import { prisma } from "@/plugins/prisma";

interface CreateLicenseUserBody {
  email: string;
  allowedDevices?: number;
  maxTransfers?: number;
}

interface CreateSubscriptionBody {
  userEmail: string;
  subscriptionType:
    | "ONE_MONTH"
    | "THREE_MONTHS"
    | "SIX_MONTHS"
    | "TWELVE_MONTHS";
  paymentId: string;
}

interface AdminUsersQuery {
  page?: string;
  limit?: string;
  search?: string;
}

@Controller("/license")
export class LicenseController {
  @Get("/admin/users")
  async getAdminUsers(
    request: FastifyRequest<{ Querystring: AdminUsersQuery }>,
    reply: FastifyReply
  ) {
    try {
      const { page = "1", limit = "20", search } = request.query;

      const skip = (Number(page) - 1) * Number(limit);

      // 검색 조건 구성
      const where: any = {};

      if (search) {
        where.OR = [
          { licenseKey: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { users: { name: { contains: search, mode: "insensitive" } } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.license_users.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            license_subscriptions: {
              where: { isActive: true },
              take: 1,
              orderBy: { createdAt: "desc" },
            },
            users: {
              select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.license_users.count({ where }),
      ]);

      reply.code(200).send({
        success: true,
        data: {
          users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error("라이센스 관리자 사용자 오류:", error);
      reply.code(500).send({
        success: false,
        error: "라이센스 사용자 조회 실패",
      });
    }
  }

  @Post("/users")
  async createLicenseUser(
    request: FastifyRequest<{ Body: CreateLicenseUserBody }>,
    reply: FastifyReply
  ) {
    try {
      const { email, allowedDevices = 3, maxTransfers = 5 } = request.body;

      // 라이센스 키 생성
      const licenseKey = this.generateLicenseKey(email);

      // 라이센스 사용자 생성
      const licenseUser = await prisma.license_users.create({
        data: {
          email,
          licenseKey,
          allowedDevices,
          maxTransfers,
          activatedDevices: [],
        },
      });

      reply.code(201).send({
        success: true,
        data: licenseUser,
        message: "라이센스 사용자가 성공적으로 생성되었습니다",
      });
    } catch (error) {
      console.error("라이센스 사용자 생성 오류:", error);
      reply.code(500).send({
        success: false,
        error: "라이센스 사용자 생성 실패",
      });
    }
  }

  @Post("/subscriptions")
  async createSubscription(
    request: FastifyRequest<{ Body: CreateSubscriptionBody }>,
    reply: FastifyReply
  ) {
    try {
      const { userEmail, subscriptionType, paymentId } = request.body;

      // 구독 기간 계산
      const now = new Date();
      const endDate = new Date(now);

      switch (subscriptionType) {
        case "ONE_MONTH":
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case "THREE_MONTHS":
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case "SIX_MONTHS":
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case "TWELVE_MONTHS":
          endDate.setMonth(endDate.getMonth() + 12);
          break;
      }

      // 기존 활성 구독 비활성화
      await prisma.license_subscriptions.updateMany({
        where: {
          userEmail,
          isActive: true,
        },
        data: { isActive: false },
      });

      // 새 구독 생성
      const subscription = await prisma.license_subscriptions.create({
        data: {
          userEmail,
          subscriptionType,
          startDate: now,
          endDate,
          isActive: true,
          paymentId,
        },
      });

      reply.code(201).send({
        success: true,
        data: subscription,
        message: "구독이 성공적으로 생성되었습니다",
      });
    } catch (error) {
      console.error("구독 생성 오류:", error);
      reply.code(500).send({
        success: false,
        error: "구독 생성 실패",
      });
    }
  }

  @Get("/validate/:licenseKey")
  async validateLicense(
    request: FastifyRequest<{ Params: { licenseKey: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { licenseKey } = request.params;

      // 라이센스 조회
      const licenseUser = await prisma.license_users.findUnique({
        where: { licenseKey },
        include: {
          license_subscriptions: {
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          users: {
            select: { id: true, email: true, name: true },
          },
        },
      });

      if (!licenseUser) {
        return reply.code(404).send({
          success: false,
          error: "라이센스를 찾을 수 없습니다",
        });
      }

      // 활성 구독 확인
      const activeSubscription = licenseUser.license_subscriptions[0];
      if (!activeSubscription || activeSubscription.endDate < new Date()) {
        return reply.code(400).send({
          success: false,
          error: "라이센스가 만료되었거나 비활성 상태입니다",
        });
      }

      reply.code(200).send({
        success: true,
        data: {
          licenseKey,
          user: licenseUser.users,
          subscription: activeSubscription,
          allowedDevices: licenseUser.allowedDevices,
          activatedDevices: licenseUser.activatedDevices?.length || 0,
        },
        message: "라이센스가 유효합니다",
      });
    } catch (error) {
      console.error("라이센스 검증 오류:", error);
      reply.code(500).send({
        success: false,
        error: "라이센스 검증 실패",
      });
    }
  }

  @Delete("/users/:email")
  async deleteLicenseUser(
    request: FastifyRequest<{ Params: { email: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { email } = request.params;

      // 라이센스 사용자 삭제 (CASCADE로 구독도 함께 삭제됨)
      await prisma.license_users.delete({
        where: { email },
      });

      reply.code(200).send({
        success: true,
        message: "라이센스 사용자가 성공적으로 삭제되었습니다",
      });
    } catch (error) {
      console.error("라이센스 사용자 삭제 오류:", error);
      reply.code(500).send({
        success: false,
        error: "라이센스 사용자 삭제 실패",
      });
    }
  }

  /**
   * 라이센스 키 생성 함수
   */
  private generateLicenseKey(email: string): string {
    // 일반 사용자 라이센스 키 생성 (16자리 영문숫자)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
