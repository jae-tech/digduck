import {
  Controller,
  Post,
  Schema,
} from "@/decorators/controller.decorator";
import { licenseNotificationService } from "@/services";
import { FastifyRequest } from "fastify";

@Controller("/license-notifications")
export class LicenseNotificationController {
  @Post("/check-expiring")
  @Schema({
    description: "Check and send expiring license notifications",
    tags: ["license"],
    security: [{ bearerAuth: [] }],
  })
  async checkExpiringLicenses() {
    await licenseNotificationService.checkExpiringLicenses();
    return { 
      success: true, 
      message: "만료 예정 라이센스 확인 및 알림 발송 완료" 
    };
  }

  @Post("/send-expiry-warning")
  @Schema({
    description: "Send expiry warning to specific user",
    tags: ["license"],
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      properties: {
        userEmail: { type: "string", format: "email" },
        daysLeft: { type: "number", minimum: 1 }
      },
      required: ["userEmail", "daysLeft"]
    }
  })
  async sendExpiryWarning(
    request: FastifyRequest<{
      Body: {
        userEmail: string;
        daysLeft: number;
      };
    }>
  ) {
    const { userEmail, daysLeft } = request.body;
    
    const success = await licenseNotificationService.sendExpiryWarning(userEmail, daysLeft);
    
    return {
      success,
      message: success 
        ? "만료 경고 메일 발송 완료" 
        : "만료 경고 메일 발송 실패"
    };
  }

  @Post("/send-renewal-notification")
  @Schema({
    description: "Send renewal notification to specific user",
    tags: ["license"],
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      properties: {
        userEmail: { type: "string", format: "email" }
      },
      required: ["userEmail"]
    }
  })
  async sendRenewalNotification(
    request: FastifyRequest<{
      Body: {
        userEmail: string;
      };
    }>
  ) {
    const { userEmail } = request.body;
    
    const success = await licenseNotificationService.sendRenewalNotification(userEmail);
    
    return {
      success,
      message: success 
        ? "라이센스 갱신 알림 발송 완료" 
        : "라이센스 갱신 알림 발송 실패"
    };
  }
}