import {
  Controller,
  Get,
  Post,
  Schema,
} from "@/decorators/controller.decorator";
import { MailInitService } from "@/services/mail-init.service";
import { FastifyRequest } from "fastify";

@Controller("/mail-test")
export class MailTestController {
  @Post("/init")
  @Schema({
    description: "Initialize mail service from environment variables",
    tags: ["mail-test"],
    security: [{ bearerAuth: [] }],
  })
  async initFromEnv() {
    const success = await MailInitService.initializeFromEnv();
    return {
      success,
      message: success ? "메일 서비스 초기화 완료" : "메일 서비스 초기화 실패"
    };
  }

  @Get("/connection")
  @Schema({
    description: "Test mail server connection",
    tags: ["mail-test"],
    security: [{ bearerAuth: [] }],
  })
  async testConnection() {
    const isConnected = await MailInitService.testConnection();
    return {
      success: isConnected,
      message: isConnected ? "메일 서버 연결 성공" : "메일 서버 연결 실패"
    };
  }

  @Post("/send")
  @Schema({
    description: "Send test email",
    tags: ["mail-test"],
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      properties: {
        toEmail: { type: "string", format: "email" }
      }
    }
  })
  async sendTestMail(
    request: FastifyRequest<{
      Body: {
        toEmail?: string;
      };
    }>
  ) {
    const { toEmail } = request.body || {};
    const success = await MailInitService.sendTestMail(toEmail);
    return {
      success,
      message: success ? "테스트 메일 발송 완료" : "테스트 메일 발송 실패",
      recipient: toEmail || process.env.MAIL_USER || "설정된 기본 이메일"
    };
  }

  @Post("/init-and-test")
  @Schema({
    description: "Initialize mail service and run full test",
    tags: ["mail-test"],
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      properties: {
        testEmail: { type: "string", format: "email" }
      }
    }
  })
  async initAndTest(
    request: FastifyRequest<{
      Body: {
        testEmail?: string;
      };
    }>
  ) {
    const { testEmail } = request.body || {};
    
    // 1. 초기화
    const initSuccess = await MailInitService.initializeFromEnv();
    if (!initSuccess) {
      return {
        success: false,
        message: "메일 서비스 초기화 실패",
        steps: {
          init: false,
          connection: false,
          testMail: false
        }
      };
    }

    // 2. 연결 테스트
    const connectionSuccess = await MailInitService.testConnection();
    if (!connectionSuccess) {
      return {
        success: false,
        message: "메일 서버 연결 실패",
        steps: {
          init: true,
          connection: false,
          testMail: false
        }
      };
    }

    // 3. 테스트 메일 발송
    const testMailSuccess = await MailInitService.sendTestMail(testEmail);
    
    return {
      success: testMailSuccess,
      message: testMailSuccess ? "모든 테스트 완료" : "테스트 메일 발송 실패",
      steps: {
        init: true,
        connection: true,
        testMail: testMailSuccess
      },
      recipient: testEmail || process.env.MAIL_USER || "설정된 기본 이메일"
    };
  }
}