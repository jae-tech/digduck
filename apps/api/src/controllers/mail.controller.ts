import {
  Controller,
  Get,
  Post,
  Schema,
} from "@/decorators/controller.decorator";
import { mailService } from "@/services";
import { FastifyRequest } from "fastify";
import { MailProvider } from "@/types/mail.types";

@Controller("/mail")
export class MailController {
  @Post("/configure")
  @Schema({
    description: "Configure mail service",
    tags: ["mail"],
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      properties: {
        provider: {
          type: "string",
          enum: ["smtp", "gmail", "outlook"],
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

    await mailService.configure({
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
      config: mailService.getConfigSummary(),
    };
  }

  @Get("/status")
  @Schema({
    description: "Get mail service status",
    tags: ["mail"],
    security: [{ bearerAuth: [] }],
  })
  async getStatus() {
    const isConfigured = mailService.isConfigured();
    const isConnected = isConfigured
      ? await mailService.verifyConnection()
      : false;

    return {
      isConfigured,
      isConnected,
      config: mailService.getConfigSummary(),
    };
  }

  @Post("/send")
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
    if (!mailService.isConfigured()) {
      throw new Error("메일 서비스가 설정되지 않았습니다");
    }

    const result = await mailService.sendMail(request.body);
    return result;
  }

  @Post("/send-template")
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
    if (!mailService.isConfigured()) {
      throw new Error("메일 서비스가 설정되지 않았습니다");
    }

    const { templateId, variables = {}, ...mailOptions } = request.body;
    const result = await mailService.sendTemplatedMail(
      templateId,
      variables,
      mailOptions
    );
    return result;
  }

  @Post("/send-bulk")
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
    if (!mailService.isConfigured()) {
      throw new Error("메일 서비스가 설정되지 않았습니다");
    }

    const result = await mailService.sendBulkMail(request.body);
    return result;
  }

  @Get("/templates")
  @Schema({
    description: "Get all email templates",
    tags: ["mail"],
    security: [{ bearerAuth: [] }],
  })
  async getTemplates() {
    const templates = mailService.getTemplateService().getAllTemplates();
    return { templates };
  }

  @Get("/templates/:id")
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
    const template = mailService
      .getTemplateService()
      .getTemplate(request.params.id);

    if (!template) {
      throw new Error("템플릿을 찾을 수 없습니다");
    }

    return { template };
  }

  @Post("/templates")
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
    const templateService = mailService.getTemplateService();
    const validation = templateService.validateTemplate(request.body);

    if (!validation.valid) {
      throw new Error(`템플릿 검증 실패: ${validation.errors.join(", ")}`);
    }

    templateService.addTemplate(request.body);
    return { success: true, message: "템플릿이 추가되었습니다" };
  }
}
