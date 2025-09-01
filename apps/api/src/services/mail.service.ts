import nodemailer, { Transporter, SendMailOptions } from "nodemailer";
import {
  MailConfig,
  MailOptions,
  MailSendResult,
  BulkMailOptions,
  BulkMailResult,
  MailProvider,
  MailProviderConfig,
} from "@/types/mail.types";
import { MailTemplateService } from "./mail-template.service";

export class MailService {
  private transporter: Transporter | null = null;
  private config: MailConfig | null = null;
  private templateService: MailTemplateService;

  constructor() {
    this.templateService = new MailTemplateService();
  }

  private getProviderConfig(provider: MailProvider): Partial<MailConfig> {
    switch (provider) {
      case MailProvider.GMAIL:
        return {
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
        };
      case MailProvider.OUTLOOK:
        return {
          host: "smtp-mail.outlook.com",
          port: 587,
          secure: false,
        };
      default:
        return {};
    }
  }

  async configure(config: MailProviderConfig): Promise<void> {
    const providerDefaults = this.getProviderConfig(config.provider);

    this.config = {
      ...providerDefaults,
      ...config.config,
    };

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.auth.user,
        pass: this.config.auth.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // 연결 테스트
    try {
      await this.transporter.verify();
      console.log("✅ 메일 서버 연결 성공");
    } catch (error) {
      console.error("❌ 메일 서버 연결 실패:", error);
      throw new Error("메일 서버 설정을 확인해주세요");
    }
  }

  async sendMail(options: MailOptions): Promise<MailSendResult> {
    if (!this.transporter) {
      throw new Error(
        "메일 서비스가 설정되지 않았습니다. configure()를 먼저 호출해주세요."
      );
    }

    try {
      const mailOptions: SendMailOptions = {
        from: options.from,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        cc: Array.isArray(options.cc) ? options.cc?.join(", ") : options.cc,
        bcc: Array.isArray(options.bcc) ? options.bcc?.join(", ") : options.bcc,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
        rejectedRecipients: result.rejected || [],
      };
    } catch (error) {
      console.error("메일 발송 실패:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      };
    }
  }

  async sendTemplatedMail(
    templateId: string,
    variables: Record<string, any>,
    options: Omit<MailOptions, "subject" | "html" | "text">
  ): Promise<MailSendResult> {
    const rendered = this.templateService.renderTemplate(templateId, variables);

    if (!rendered) {
      return {
        success: false,
        error: `템플릿을 찾을 수 없습니다: ${templateId}`,
      };
    }

    return this.sendMail({
      ...options,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  }

  async sendBulkMail(options: BulkMailOptions): Promise<BulkMailResult> {
    const results: BulkMailResult["results"] = [];
    let totalSent = 0;
    let totalFailed = 0;

    for (const recipient of options.recipients) {
      try {
        const result = await this.sendTemplatedMail(
          options.template,
          recipient.variables || {},
          {
            from: options.from,
            to: recipient.email,
          }
        );

        results.push({
          email: recipient.email,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        });

        if (result.success) {
          totalSent++;
        } else {
          totalFailed++;
        }

        // 대량 발송시 서버 부하 방지를 위한 지연
        if (options.recipients.length > 10) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        results.push({
          email: recipient.email,
          success: false,
          error: error instanceof Error ? error.message : "알 수 없는 오류",
        });
        totalFailed++;
      }
    }

    return {
      totalSent,
      totalFailed,
      results,
    };
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }

  getTemplateService(): MailTemplateService {
    return this.templateService;
  }

  isConfigured(): boolean {
    return this.transporter !== null && this.config !== null;
  }

  getConfigSummary(): Partial<MailConfig> | null {
    if (!this.config) return null;

    return {
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.auth.user,
        pass: "***", // 비밀번호는 마스킹
      },
    };
  }

  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
      this.config = null;
    }
  }
}
