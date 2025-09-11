import { env } from "@/config/env";
import {
  BulkMailOptions,
  BulkMailResult,
  MailConfig,
  MailOptions,
  MailProvider,
  MailProviderConfig,
  MailSendResult,
  MailTemplate,
} from "@/types/mail.types";
import nodemailer, { SendMailOptions, Transporter } from "nodemailer";

/**
 * 통합 알림 서비스
 * SMTP 설정, 템플릿 관리, 메일 발송 등 모든 이메일 알림을 처리합니다
 */
export class NotificationService {
  private transporter: Transporter | null = null;
  private config: MailConfig | null = null;
  private templates: Map<string, MailTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  // ========== 메일 환경설정 ==========

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
      case MailProvider.ZOHO:
        return {
          host: "smtp.zoho.com",
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
      if (this.transporter) {
        await this.transporter.verify();
        console.log("✅ 메일 서버 연결 성공");
      }
    } catch (error) {
      console.error("❌ 메일 서버 연결 실패:", error);
      throw new Error("메일 서버 설정을 확인해주세요");
    }
  }

  async initializeFromEnv(): Promise<boolean> {
    try {
      const mailUser = env.MAIL_USER;
      const mailPass = env.MAIL_PASS;
      const mailProvider =
        (env.MAIL_PROVIDER as MailProvider) || MailProvider.GMAIL;

      if (!mailUser || !mailPass) {
        console.log(
          "⚠️ 메일 서비스 환경변수가 설정되지 않았습니다 (MAIL_USER, MAIL_PASS)"
        );
        return false;
      }

      await this.configure({
        provider: mailProvider,
        config: {
          host: env.MAIL_HOST || "",
          port: env.MAIL_PORT || 587,
          secure: env.MAIL_SECURE === "true",
          auth: {
            user: mailUser,
            pass: mailPass,
          },
        },
      });

      console.log("✅ 메일 서비스가 환경변수로부터 초기화되었습니다");
      console.log(`📧 Provider: ${mailProvider}`);
      console.log(`👤 User: ${mailUser}`);

      return true;
    } catch (error) {
      console.error("❌ 메일 서비스 초기화 실패:", error);
      return false;
    }
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
        pass: "***", // 비밀번호는 마스킹 처리
      },
    };
  }

  // ========== 메일 발송 ==========

  async sendMail(
    options: MailOptions & { userEmail?: string }
  ): Promise<MailSendResult> {
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
    options: Omit<MailOptions, "subject" | "html" | "text"> & {
      userEmail?: string;
    }
  ): Promise<MailSendResult> {
    const rendered = this.renderTemplate(templateId, variables);

    if (!rendered) {
      return {
        success: false,
        error: `템플릿을 찾을 수 없습니다: ${templateId}`,
      };
    }

    const result = await this.sendMail({
      ...options,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      userEmail: options.userEmail,
    });

    return result;
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

        // 대량 발송 시 서버 부하 방지를 위해 잠시 대기
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

  // ========== 연결 및 테스트 ==========

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

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log("메일 서비스가 설정되지 않았습니다");
      return false;
    }

    try {
      const isConnected = await this.verifyConnection();
      if (isConnected) {
        console.log("✅ 메일 서버 연결 테스트 성공");
      } else {
        console.log("❌ 메일 서버 연결 테스트 실패");
      }
      return isConnected;
    } catch (error) {
      console.error("❌ 메일 서버 연결 테스트 오류:", error);
      return false;
    }
  }

  async sendTestMail(toEmail?: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log("메일 서비스가 설정되지 않았습니다");
      return false;
    }

    try {
      const result = await this.sendTemplatedMail(
        "notification",
        {
          userName: "테스트 사용자",
          title: "메일 서비스 테스트",
          message:
            "이 메일은 메일 서비스가 정상적으로 작동하는지 확인하기 위한 테스트 메일입니다.",
          companyName: env.COMPANY_NAME || "DigDuck",
        },
        {
          from: env.MAIL_FROM || env.MAIL_USER || "test@example.com",
          to: toEmail || env.MAIL_USER || "test@example.com",
        }
      );

      if (result.success) {
        console.log("✅ 테스트 메일 발송 성공");
        console.log(`📧 수신자: ${toEmail || env.MAIL_USER}`);
        return true;
      } else {
        console.log("❌ 테스트 메일 발송 실패:", result.error);
        return false;
      }
    } catch (error) {
      console.error("❌ 테스트 메일 발송 오류:", error);
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
      this.config = null;
    }
  }

  // ========== 템플릿 관리 ==========

  private initializeDefaultTemplates(): void {
    const defaultTemplates: MailTemplate[] = [
      {
        id: "welcome",
        name: "환영 메일",
        subject: "{{companyName}}에 오신 것을 환영합니다!",
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">안녕하세요 {{userName}}님!</h1>
            <p>{{companyName}}에 오신 것을 환영합니다.</p>
            <p>앞으로 많은 도움이 되는 서비스를 제공하겠습니다.</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
              <p><strong>시작하기:</strong></p>
              <ul>
                <li>프로필을 완성해보세요</li>
                <li>첫 번째 프로젝트를 만들어보세요</li>
                <li>고객지원팀에 문의하세요</li>
              </ul>
            </div>
            <p>감사합니다.<br/>{{companyName}} 팀</p>
          </div>
        `,
        textTemplate: `
안녕하세요 {{userName}}님!

{{companyName}}에 오신 것을 환영합니다.
앞으로 많은 도움이 되는 서비스를 제공하겠습니다.

시작하기:
- 프로필을 완성해보세요
- 첫 번째 프로젝트를 만들어보세요
- 고객지원팀에 문의하세요

감사합니다.
{{companyName}} 팀
        `,
        variables: ["userName", "companyName"],
      },
      {
        id: "password-reset",
        name: "비밀번호 재설정",
        subject: "비밀번호 재설정 요청",
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">비밀번호 재설정</h1>
            <p>안녕하세요 {{userName}}님,</p>
            <p>비밀번호 재설정을 요청하셨습니다.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{resetUrl}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">비밀번호 재설정</a>
            </div>
            <p style="color: #666; font-size: 14px;">이 링크는 {{expireTime}}분 후에 만료됩니다.</p>
            <p style="color: #666; font-size: 14px;">만약 비밀번호 재설정을 요청하지 않으셨다면, 이 메일을 무시하세요.</p>
          </div>
        `,
        textTemplate: `
비밀번호 재설정

안녕하세요 {{userName}}님,

비밀번호 재설정을 요청하셨습니다.
다음 링크를 클릭하여 비밀번호를 재설정하세요:

{{resetUrl}}

이 링크는 {{expireTime}}분 후에 만료됩니다.
만약 비밀번호 재설정을 요청하지 않으셨다면, 이 메일을 무시하세요.
        `,
        variables: ["userName", "resetUrl", "expireTime"],
      },
      {
        id: "notification",
        name: "일반 알림",
        subject: "{{title}}",
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">{{title}}</h1>
            <p>안녕하세요 {{userName}}님,</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; border-radius: 0 5px 5px 0;">
              <p>{{message}}</p>
            </div>
            <p>감사합니다.<br/>{{companyName}} 팀</p>
          </div>
        `,
        textTemplate: `
{{title}}

안녕하세요 {{userName}}님,

{{message}}

감사합니다.
{{companyName}} 팀
        `,
        variables: ["userName", "title", "message", "companyName"],
      },
      {
        id: "license-created",
        name: "라이센스 발급 완료",
        subject: "{{productName}} 라이센스가 발급되었습니다",
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">라이센스 발급 완료</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">{{productName}}</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h2 style="margin: 0 0 10px 0; font-size: 18px;">안녕하세요 {{userName}}님!</h2>
              <p style="margin: 0; opacity: 0.9;">요청하신 라이센스가 성공적으로 발급되었습니다.</p>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 16px;">📋 라이센스 정보</h3>
              <div style="margin-bottom: 12px;">
                <span style="color: #64748b; font-size: 14px;">라이센스 키:</span><br/>
                <code style="background-color: #e2e8f0; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 14px; word-break: break-all; display: block; margin-top: 4px;">{{licenseKey}}</code>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <span style="color: #64748b; font-size: 14px;">사용자 이메일:</span><br/>
                  <strong style="color: #1e293b;">{{userEmail}}</strong>
                </div>
                <div>
                  <span style="color: #64748b; font-size: 14px;">발급일:</span><br/>
                  <strong style="color: #1e293b;">{{issueDate}}</strong>
                </div>
                <div>
                  <span style="color: #64748b; font-size: 14px;">만료일:</span><br/>
                  <strong style="color: #dc2626;">{{expirationDate}}</strong>
                </div>
                <div>
                  <span style="color: #64748b; font-size: 14px;">라이센스 타입:</span><br/>
                  <strong style="color: #059669;">{{licenseType}}</strong>
                </div>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500;">서비스 시작하기</a>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #374151; font-size: 14px; margin: 0;">
                감사합니다.<br/>
                <strong>{{companyName}} 팀</strong>
              </p>
            </div>
          </div>
        `,
        textTemplate: `
라이센스 발급 완료 - {{productName}}

안녕하세요 {{userName}}님!

요청하신 라이센스가 성공적으로 발급되었습니다.

📋 라이센스 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
라이센스 키: {{licenseKey}}
사용자 이메일: {{userEmail}}
발급일: {{issueDate}}
만료일: {{expirationDate}}
라이센스 타입: {{licenseType}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

서비스 시작하기: {{loginUrl}}

감사합니다.
{{companyName}} 팀
        `,
        variables: [
          "userName",
          "productName",
          "licenseKey",
          "userEmail",
          "issueDate",
          "expirationDate",
          "licenseType",
          "loginUrl",
          "companyName",
        ],
      },
      {
        id: "license-expiry-warning",
        name: "라이센스 만료 경고",
        subject: "{{productName}} 라이센스 만료 안내 ({{daysLeft}}일 남음)",
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0;">라이센스 만료 안내</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">{{productName}}</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h2 style="margin: 0 0 10px 0; font-size: 18px;">⏰ {{userName}}님의 라이센스가 곧 만료됩니다</h2>
              <p style="margin: 0; opacity: 0.9; font-size: 24px; font-weight: bold;">{{daysLeft}}일 후 만료</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{renewUrl}}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500; margin-right: 10px;">라이센스 갱신하기</a>
              <a href="{{contactUrl}}" style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500;">문의하기</a>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #374151; font-size: 14px; margin: 0;">
                감사합니다.<br/>
                <strong>{{companyName}} 팀</strong>
              </p>
            </div>
          </div>
        `,
        textTemplate: `
라이센스 만료 안내 - {{productName}}

⏰ {{userName}}님의 라이센스가 곧 만료됩니다
{{daysLeft}}일 후 만료

라이센스 갱신: {{renewUrl}}
문의하기: {{contactUrl}}

감사합니다.
{{companyName}} 팀
        `,
        variables: [
          "userName",
          "productName",
          "daysLeft",
          "licenseKey",
          "expirationDate",
          "renewUrl",
          "contactUrl",
          "companyName",
        ],
      },
    ];

    defaultTemplates.forEach((template) => {
      this.templates.set(template.id, template);
    });
  }

  getTemplate(id: string): MailTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): MailTemplate[] {
    return Array.from(this.templates.values());
  }

  addTemplate(template: MailTemplate): void {
    this.templates.set(template.id, template);
  }

  updateTemplate(id: string, updates: Partial<MailTemplate>): boolean {
    const existing = this.templates.get(id);
    if (!existing) return false;

    const updated = { ...existing, ...updates, id }; // ID는 변경할 수 없음
    this.templates.set(id, updated);
    return true;
  }

  deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  renderTemplate(
    templateId: string,
    variables: Record<string, any>
  ): { subject: string; html: string; text?: string } | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    const replaceVariables = (
      content: string,
      vars: Record<string, any>
    ): string => {
      return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return vars[key] !== undefined ? String(vars[key]) : match;
      });
    };

    return {
      subject: replaceVariables(template.subject, variables),
      html: replaceVariables(template.htmlTemplate, variables),
      text: template.textTemplate
        ? replaceVariables(template.textTemplate, variables)
        : undefined,
    };
  }

  validateTemplate(template: Partial<MailTemplate>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!template.id?.trim()) {
      errors.push("템플릿 ID가 필요합니다");
    }

    if (!template.name?.trim()) {
      errors.push("템플릿 이름이 필요합니다");
    }

    if (!template.subject?.trim()) {
      errors.push("제목이 필요합니다");
    }

    if (!template.htmlTemplate?.trim()) {
      errors.push("HTML 템플릿이 필요합니다");
    }

    if (!Array.isArray(template.variables)) {
      errors.push("변수 배열이 필요합니다");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  extractVariables(content: string): string[] {
    const matches = content.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];

    return [...new Set(matches.map((match) => match.replace(/[{}]/g, "")))];
  }
}
