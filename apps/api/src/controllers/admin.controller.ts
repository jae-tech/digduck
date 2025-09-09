import { FastifyRequest, FastifyReply } from "fastify";
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
} from "@/decorators/controller.decorator";
import { prisma } from "@/plugins/prisma";
import { AdminService } from "@/services/admin.service";

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
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService(prisma);
  }
  @Get("/licenses/stats")
  async getLicenseStats(
    request: FastifyRequest<{ Querystring: AdminStatsQuery }>,
    reply: FastifyReply
  ) {
    try {
      const filter = request.query;
      const stats = await this.adminService.getLicenseStats(filter);

      reply.code(200).send({
        success: true,
        data: stats,
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

      const filter = {
        page: Number(page),
        limit: Number(limit),
        search,
        status,
        licenseType,
      };

      const result = await this.adminService.getLicenses(filter);

      reply.code(200).send({
        success: true,
        data: result,
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

      await this.adminService.deleteLicense(licenseKey);

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

      await this.adminService.updateLicenseStatus(licenseKey, action);

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

      await this.adminService.bulkLicenseAction(action, licenseIds);

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
