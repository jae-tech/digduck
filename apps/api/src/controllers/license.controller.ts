import { env } from "@/config/env";
import {
  Controller,
  Delete,
  Get,
  Post,
} from "@/decorators/controller.decorator";
import { licenseService, notificationService } from "@/services";
import { AdminUsersQuery, CreateLicenseUserBody } from "@/types/license.types";
import { FastifyReply, FastifyRequest } from "fastify";

@Controller("/license")
export class LicenseController {
  @Get("/admin/users")
  async getAdminUsers(
    request: FastifyRequest<{ Querystring: AdminUsersQuery }>,
    reply: FastifyReply
  ) {
    try {
      const { page = "1", limit = "20", search } = request.query;

      const filter = {
        page: Number(page),
        limit: Number(limit),
        search,
      };

      const result = await licenseService.getAdminUsers(filter);

      reply.code(200).send({
        success: true,
        data: result,
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
      const {
        email,
        serviceId,
        subscriptionPlanId,
        allowedDevices = 3,
        maxTransfers = 5,
      } = request.body;

      const license = await licenseService.createLicense({
        email,
        serviceId,
        subscriptionPlanId,
        allowedDevices,
        maxTransfers,
      });

      // 라이센스 발급 완료 메일 발송
      if (notificationService.isConfigured()) {
        try {
          await notificationService.sendTemplatedMail(
            "license-created",
            {
              userName: email.split("@")[0],
              productName: env.PRODUCT_NAME || "DigDuck",
              licenseKey: license.licenseKey,
              userEmail: email,
              issueDate: license.startDate.toLocaleDateString("ko-KR"),
              expirationDate:
                license.endDate?.toLocaleDateString("ko-KR") || "평생",
              licenseType: license.subscriptionPlan.name,
              loginUrl: env.CLIENT_URL || "https://digduck.app/license",
              companyName: env.COMPANY_NAME || "DigDuck",
            },
            {
              from: env.MAIL_FROM || "noreply@digduck.com",
              to: email,
            }
          );
          console.log(`라이센스 발급 메일 발송 완료: ${email}`);
        } catch (error) {
          console.error("라이센스 발급 메일 발송 실패:", error);
        }
      }

      reply.code(201).send({
        success: true,
        data: license,
        message: "라이센스가 성공적으로 생성되었습니다",
      });
    } catch (error) {
      console.error("라이센스 생성 오류:", error);
      reply.code(500).send({
        success: false,
        error: "라이센스 생성 실패",
      });
    }
  }

  @Get("/subscription-plans")
  async getSubscriptionPlans(request: FastifyRequest, reply: FastifyReply) {
    try {
      const plans = await licenseService.getSubscriptionPlans();

      reply.code(200).send({
        success: true,
        data: plans,
      });
    } catch (error) {
      console.error("구독 플랜 조회 오류:", error);
      reply.code(500).send({
        success: false,
        error: "구독 플랜 조회 실패",
      });
    }
  }

  @Get("/services")
  async getServices(request: FastifyRequest, reply: FastifyReply) {
    try {
      const services = await licenseService.getServices();

      reply.code(200).send({
        success: true,
        data: services,
      });
    } catch (error) {
      console.error("서비스 조회 오류:", error);
      reply.code(500).send({
        success: false,
        error: "서비스 조회 실패",
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

      const result = await licenseService.validateLicense(licenseKey);

      if (!result.isValid) {
        return reply.code(400).send({
          success: false,
          error: result.error,
        });
      }

      reply.code(200).send({
        success: true,
        data: {
          licenseKey,
          user: result.user,
          license: result.license,
          service: result.service,
          subscriptionPlan: result.subscriptionPlan,
          devices: result.devices,
          allowedDevices: result.license?.maxDevices || 0,
          activatedDevices: result.devices?.length || 0,
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

      await licenseService.deleteLicenseUser(email);

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
}
