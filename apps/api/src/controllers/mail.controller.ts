import {
  Controller,
  Get,
  Post,
  Schema,
} from "@/decorators/controller.decorator";
import { notificationService } from "@/services";
import { MailProvider } from "@/types/mail.types";
import { FastifyRequest } from "fastify";

@Controller("mail")
export class MailController {
  @Post("configure")
  @Schema({
    description: "Configure mail service",
    tags: ["mail"],
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      properties: {
        provider: {
          type: "string",
          enum: ["smtp", "gmail", "outlook", "zoho"],
        },
        host: { type: "string" },
        port: { type: "number" },
        secure: { type: "boolean" },
        user: { type: "string" },
        pass: { type: "string" },
      },
      required: ["provider", "user", "pass"],
    },
  })
  async configure(
    request: FastifyRequest<{
      Body: {
        provider: string;
        host?: string;
        port?: number;
        secure?: boolean;
        user: string;
        pass: string;
      };
    }>
  ) {
    const { provider, host, port, secure, user, pass } = request.body;

    await notificationService.configure({
      provider: provider as MailProvider,
      config: {
        host: host || "",
        port: port || 587,
        secure: secure || false,
        auth: { user, pass },
      },
    });

    return {
      success: true,
      message: "메일 서비스 설정 완료",
      config: notificationService.getConfigSummary(),
    };
  }

  @Get("status")
  @Schema({
    description: "Get mail service status",
    tags: ["mail"],
    security: [{ bearerAuth: [] }],
  })
  async getStatus() {
    const isConfigured = notificationService.isConfigured();
    const isConnected = isConfigured
      ? await notificationService.verifyConnection()
      : false;

    return {
      isConfigured,
      isConnected,
      config: notificationService.getConfigSummary(),
    };
  }

  @Post("send")
  @Schema({
    description: "Send single email",
    tags: ["mail"],
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      properties: {
        from: { type: "string", format: "email" },
        to: {
          oneOf: [
            { type: "string", format: "email" },
            { type: "array", items: { type: "string", format: "email" } },
          ],
        },
        cc: {
          oneOf: [
            { type: "string", format: "email" },
            { type: "array", items: { type: "string", format: "email" } },
          ],
        },
        bcc: {
          oneOf: [
            { type: "string", format: "email" },
            { type: "array", items: { type: "string", format: "email" } },
          ],
        },
        subject: { type: "string" },
        text: { type: "string" },
        html: { type: "string" },
      },
      required: ["from", "to", "subject"],
    },
  })
  async sendMail(
    request: FastifyRequest<{
      Body: {
        from: string;
        to: string | string[];
        cc?: string | string[];
        bcc?: string | string[];
        subject: string;
        text?: string;
        html?: string;
      };
    }>
  ) {
    if (!notificationService.isConfigured()) {
      throw new Error("메일 서비스가 설정되지 않았습니다");
    }

    const result = await notificationService.sendMail(request.body);
    return result;
  }

  @Post("send-template")
  @Schema({
    description: "Send email using template",
    tags: ["mail"],
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      properties: {
        templateId: { type: "string" },
        variables: { type: "object" },
        from: { type: "string", format: "email" },
        to: {
          oneOf: [
            { type: "string", format: "email" },
            { type: "array", items: { type: "string", format: "email" } },
          ],
        },
        cc: {
          oneOf: [
            { type: "string", format: "email" },
            { type: "array", items: { type: "string", format: "email" } },
          ],
        },
        bcc: {
          oneOf: [
            { type: "string", format: "email" },
            { type: "array", items: { type: "string", format: "email" } },
          ],
        },
      },
      required: ["templateId", "from", "to"],
    },
  })
  async sendTemplatedMail(
    request: FastifyRequest<{
      Body: {
        templateId: string;
        variables?: Record<string, any>;
        from: string;
        to: string | string[];
        cc?: string | string[];
        bcc?: string | string[];
      };
    }>
  ) {
    if (!notificationService.isConfigured()) {
      throw new Error("메일 서비스가 설정되지 않았습니다");
    }

    const { templateId, variables = {}, ...mailOptions } = request.body;
    const result = await notificationService.sendTemplatedMail(
      templateId,
      variables,
      mailOptions
    );
    return result;
  }

  @Post("send-bulk")
  @Schema({
    description: "Send bulk emails using template",
    tags: ["mail"],
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      properties: {
        template: { type: "string" },
        from: { type: "string", format: "email" },
        recipients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              email: { type: "string", format: "email" },
              variables: { type: "object" },
            },
            required: ["email"],
          },
        },
      },
      required: ["template", "from", "recipients"],
    },
  })
  async sendBulkMail(
    request: FastifyRequest<{
      Body: {
        template: string;
        from: string;
        recipients: Array<{
          email: string;
          variables?: Record<string, any>;
        }>;
      };
    }>
  ) {
    if (!notificationService.isConfigured()) {
      throw new Error("메일 서비스가 설정되지 않았습니다");
    }

    const result = await notificationService.sendBulkMail(request.body);
    return result;
  }

  @Get("templates")
  @Schema({
    description: "Get all email templates",
    tags: ["mail"],
    security: [{ bearerAuth: [] }],
  })
  async getTemplates() {
    const templates = notificationService.getAllTemplates();
    return { templates };
  }

  @Get("templates/:id")
  @Schema({
    description: "Get specific email template",
    tags: ["mail"],
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
  })
  async getTemplate(request: FastifyRequest<{ Params: { id: string } }>) {
    const template = notificationService.getTemplate(request.params.id);

    if (!template) {
      throw new Error("템플릿을 찾을 수 없습니다");
    }

    return { template };
  }

  @Post("templates")
  @Schema({
    description: "Add new email template",
    tags: ["mail"],
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        subject: { type: "string" },
        htmlTemplate: { type: "string" },
        textTemplate: { type: "string" },
        variables: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["id", "name", "subject", "htmlTemplate", "variables"],
    },
  })
  async addTemplate(
    request: FastifyRequest<{
      Body: {
        id: string;
        name: string;
        subject: string;
        htmlTemplate: string;
        textTemplate?: string;
        variables: string[];
      };
    }>
  ) {
    const validation = notificationService.validateTemplate(request.body);

    if (!validation.valid) {
      throw new Error(`템플릿 검증 실패: ${validation.errors.join(", ")}`);
    }

    notificationService.addTemplate(request.body);
    return { success: true, message: "템플릿이 추가되었습니다" };
  }

  // ===== 테스트 기능 (기존 mail-test.controller 통합) =====

  @Post("test/init")
  @Schema({
    description: "Initialize mail service from environment variables",
    tags: ["mail"],
    security: [{ bearerAuth: [] }],
  })
  async initFromEnv() {
    const success = await notificationService.initializeFromEnv();
    return {
      success,
      message: success ? "메일 서비스 초기화 완료" : "메일 서비스 초기화 실패",
    };
  }

  @Get("test/connection")
  @Schema({
    description: "Test mail server connection",
    tags: ["mail"],
    security: [{ bearerAuth: [] }],
  })
  async testConnection() {
    const isConnected = await notificationService.testConnection();
    return {
      success: isConnected,
      message: isConnected ? "메일 서버 연결 성공" : "메일 서버 연결 실패",
    };
  }

  @Post("test/send")
  @Schema({
    description: "Send test email",
    tags: ["mail"],
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      properties: {
        toEmail: { type: "string", format: "email" },
      },
    },
  })
  async sendTestMail(
    request: FastifyRequest<{
      Body: {
        toEmail?: string;
      };
    }>
  ) {
    const { toEmail } = request.body || {};
    const success = await notificationService.sendTestMail(toEmail);
    return {
      success,
      message: success ? "테스트 메일 발송 완료" : "테스트 메일 발송 실패",
      recipient: toEmail || process.env.MAIL_USER || "설정된 기본 이메일",
    };
  }

  @Post("test/full")
  @Schema({
    description: "Initialize mail service and run full test",
    tags: ["mail"],
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      properties: {
        testEmail: { type: "string", format: "email" },
      },
    },
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
    const initSuccess = await notificationService.initializeFromEnv();
    if (!initSuccess) {
      return {
        success: false,
        message: "메일 서비스 초기화 실패",
        steps: {
          init: false,
          connection: false,
          testMail: false,
        },
      };
    }

    // 2. 연결 테스트
    const connectionSuccess = await notificationService.testConnection();
    if (!connectionSuccess) {
      return {
        success: false,
        message: "메일 서버 연결 실패",
        steps: {
          init: true,
          connection: false,
          testMail: false,
        },
      };
    }

    // 3. 테스트 메일 발송
    const testMailSuccess = await notificationService.sendTestMail(testEmail);

    return {
      success: testMailSuccess,
      message: testMailSuccess ? "모든 테스트 완료" : "테스트 메일 발송 실패",
      steps: {
        init: true,
        connection: true,
        testMail: testMailSuccess,
      },
      recipient: testEmail || process.env.MAIL_USER || "설정된 기본 이메일",
    };
  }
}
