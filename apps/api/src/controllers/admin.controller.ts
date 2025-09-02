import { FastifyRequest, FastifyReply } from "fastify";
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
} from "@/decorators/controller.decorator";
import { prisma } from "@/plugins/prisma";

interface AdminStatsQuery {
  period?: "day" | "week" | "month" | "year";
  startDate?: string;
  endDate?: string;
}

interface LicenseQuery {
  page?: string;
  limit?: string;
  search?: string;
  status?: "active" | "expired" | "suspended" | "revoked";
  licenseType?: "user" | "admin";
}

@Controller("/admin")
export class AdminController {
  @Get("/licenses/stats")
  async getLicenseStats(
    request: FastifyRequest<{ Querystring: AdminStatsQuery }>,
    reply: FastifyReply
  ) {
    try {
      const { } = request.query;

      // 통계 쿼리 실행
      const [
        totalUsers,
        activeUsers,
        expiredUsers,
        suspendedUsers,
        revokedUsers,
        adminUsers,
      ] = await Promise.all([
        prisma.licenseUsers.count(),
        prisma.licenseUsers.count({
          where: {
            licenseSubscriptions: {
              some: {
                isActive: true,
                endDate: { gt: new Date() },
              },
            },
          },
        }),
        prisma.licenseUsers.count({
          where: {
            licenseSubscriptions: {
              some: {
                isActive: false,
                endDate: { lt: new Date() },
              },
            },
          },
        }),
        prisma.licenseUsers.count({
          where: {
            licenseSubscriptions: {
              some: {
                isActive: false,
              },
            },
          },
        }),
        prisma.licenseUsers.count({
          where: {
            licenseSubscriptions: {
              none: {},
            },
          },
        }),
        prisma.licenseUsers.count({
          where: {
            licenseKey: { startsWith: "ADMIN" },
          },
        }),
      ]);

      // 30일 내 만료 예정
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const expiringSoon = await prisma.licenseUsers.count({
        where: {
          licenseSubscriptions: {
            some: {
              isActive: true,
              endDate: {
                gte: new Date(),
                lte: thirtyDaysFromNow,
              },
            },
          },
        },
      });

      reply.code(200).send({
        success: true,
        data: {
          total: totalUsers,
          active: activeUsers,
          expired: expiredUsers,
          suspended: suspendedUsers,
          revoked: revokedUsers,
          admin: adminUsers,
          expiringSoon,
        },
      });
    } catch (error) {
      console.error("관리자 통계 오류:", error);
      reply.code(500).send({
        success: false,
        error: "라이센스 통계 조회 실패",
      });
    }
  }

  @Get("/licenses")
  async getLicenses(
    request: FastifyRequest<{ Querystring: LicenseQuery }>,
    reply: FastifyReply
  ) {
    try {
      const {
        page = "1",
        limit = "20",
        search,
        status,
        licenseType,
      } = request.query;

      const skip = (Number(page) - 1) * Number(limit);

      // 검색 및 필터 조건 구성
      const where: any = {};

      if (search) {
        where.OR = [
          { licenseKey: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { users: { name: { contains: search, mode: "insensitive" } } },
        ];
      }

      if (licenseType === "admin") {
        where.licenseKey = { startsWith: "ADMIN" };
      } else if (licenseType === "user") {
        where.licenseKey = { not: { startsWith: "ADMIN" } };
      }

      if (status) {
        switch (status) {
          case "active":
            where.licenseSubscriptions = {
              some: {
                isActive: true,
                endDate: { gt: new Date() },
              },
            };
            break;
          case "expired":
            where.licenseSubscriptions = {
              some: {
                endDate: { lt: new Date() },
              },
            };
            break;
          case "suspended":
            where.licenseSubscriptions = {
              some: {
                isActive: false,
              },
            };
            break;
          case "revoked":
            where.licenseSubscriptions = {
              none: {},
            };
            break;
        }
      }

      const [users, total] = await Promise.all([
        prisma.licenseUsers.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            licenseSubscriptions: {
              where: { isActive: true },
              take: 1,
            },
            licenseItems: true,
            deviceTransfers: {
              take: 5,
              orderBy: { transferDate: "desc" },
            },
            users: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.licenseUsers.count({ where }),
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
      console.error("라이센스 목록 오류:", error);
      reply.code(500).send({
        success: false,
        error: "라이센스 목록 조회 실패",
      });
    }
  }

  @Delete("/licenses/:licenseKey")
  async deleteLicense(
    request: FastifyRequest<{ Params: { licenseKey: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { licenseKey } = request.params;

      // 라이센스 사용자 삭제 (CASCADE로 관련 데이터도 함께 삭제됨)
      await prisma.licenseUsers.delete({
        where: { licenseKey },
      });

      reply.code(200).send({
        success: true,
        message: "라이센스가 성공적으로 삭제되었습니다",
      });
    } catch (error) {
      console.error("라이센스 삭제 오류:", error);
      reply.code(500).send({
        success: false,
        error: "라이센스 삭제 실패",
      });
    }
  }

  @Put("/licenses/:licenseKey/status")
  async updateLicenseStatus(
    request: FastifyRequest<{
      Params: { licenseKey: string };
      Body: { action: "activate" | "suspend" | "revoke" };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { licenseKey } = request.params;
      const { action } = request.body;

      switch (action) {
        case "activate":
          await prisma.licenseSubscriptions.updateMany({
            where: { userEmail: licenseKey },
            data: { isActive: true },
          });
          break;
        case "suspend":
          await prisma.licenseSubscriptions.updateMany({
            where: { userEmail: licenseKey },
            data: { isActive: false },
          });
          break;
        case "revoke":
          await prisma.licenseSubscriptions.deleteMany({
            where: { userEmail: licenseKey },
          });
          break;
      }

      reply.code(200).send({
        success: true,
        message: `라이센스 상태가 성공적으로 변경되었습니다`,
      });
    } catch (error) {
      console.error("라이센스 상태 업데이트 오류:", error);
      reply.code(500).send({
        success: false,
        error: "라이센스 상태 업데이트 실패",
      });
    }
  }

  @Post("/licenses/bulk")
  async bulkLicenseAction(
    request: FastifyRequest<{
      Body: {
        action: "activate" | "suspend" | "revoke" | "delete";
        licenseIds: string[];
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { action, licenseIds } = request.body;

      switch (action) {
        case "activate":
          await prisma.licenseSubscriptions.updateMany({
            where: { userEmail: { in: licenseIds } },
            data: { isActive: true },
          });
          break;
        case "suspend":
          await prisma.licenseSubscriptions.updateMany({
            where: { userEmail: { in: licenseIds } },
            data: { isActive: false },
          });
          break;
        case "revoke":
          await prisma.licenseSubscriptions.deleteMany({
            where: { userEmail: { in: licenseIds } },
          });
          break;
        case "delete":
          await prisma.licenseUsers.deleteMany({
            where: { licenseKey: { in: licenseIds } },
          });
          break;
      }

      reply.code(200).send({
        success: true,
        message: `대량 작업이 성공적으로 완료되었습니다`,
      });
    } catch (error) {
      console.error("대량 라이센스 작업 오류:", error);
      reply.code(500).send({
        success: false,
        error: "대량 작업 실행 실패",
      });
    }
  }
}
