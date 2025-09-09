import nodemailer, { Transporter, SendMailOptions } from "nodemailer";
import {
  MailConfig,
  MailOptions,
  MailSendResult,
  BulkMailOptions,
  BulkMailResult,
  MailProvider,
  MailProviderConfig,
  MailStatus,
} from "@/types/mail.types";
import { MailTemplateService } from "./mail-template.service";
import { env } from "@/config/env";

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
      await this.transporter.verify();
      console.log("✅ 메일 서버 연결 성공");
    } catch (error) {
      console.error("❌ 메일 서버 연결 실패:", error);
      throw new Error("메일 서버 설정을 확인해주세요");
    }
  }

  async sendMail(options: MailOptions & { userEmail?: string }): Promise<MailSendResult> {
    if (!this.transporter) {
      throw new Error(
        "메일 서비스가 설정되지 않았습니다. configure()를 먼저 호출해주세요."
      );
    }

    // 메일 히스토리 기능 비활성화됨

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

      // 메일 히스토리 기능 비활성화됨

      return {
        success: true,
        messageId: result.messageId,
        rejectedRecipients: result.rejected || [],
      };
    } catch (error) {
      console.error("메일 발송 실패:", error);
      
      // 메일 히스토리 기능 비활성화됨

      return {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      };
    }
  }

  async sendTemplatedMail(
    templateId: string,
    variables: Record<string, any>,
    options: Omit<MailOptions, "subject" | "html" | "text"> & { userEmail?: string }
  ): Promise<MailSendResult> {
    const rendered = this.templateService.renderTemplate(templateId, variables);

    if (!rendered) {
      return {
        success: false,
        error: `템플릿을 찾을 수 없습니다: ${templateId}`,
      };
    }

    // 메일 히스토리 기능 비활성화됨

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


  private getCurrentProvider(): MailProvider {
    // 현재 설정된 프로바이더 반환
    const provider = process.env.MAIL_PROVIDER?.toLowerCase();
    switch (provider) {
      case 'gmail': return MailProvider.GMAIL;
      case 'outlook': return MailProvider.OUTLOOK;
      case 'zoho': return MailProvider.ZOHO;
      default: return MailProvider.SMTP;
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

  // 메일 히스토리 기능 (MailHistoryService 병합)
  // 새 스키마에서 mailHistory 테이블이 제거되어 기능이 비활성화됨
  async createMailHistory(data: any): Promise<void> {
    // 기능 비활성화됨 - mailHistory 테이블이 스키마에서 제거됨
    console.warn("Mail history functionality disabled - mailHistory table was removed from schema");
  }

  async getMailHistory(filter: any): Promise<{ data: any[] }> {
    // 기능 비활성화됨 - mailHistory 테이블이 스키마에서 제거됨
    console.warn("Mail history functionality disabled - mailHistory table was removed from schema");
    return { data: [] };
  }

  async updateMailHistory(id: number, data: any): Promise<void> {
    // 기능 비활성화됨 - mailHistory 테이블이 스키마에서 제거됨
    console.warn("Mail history functionality disabled - mailHistory table was removed from schema");
  }

  async getMailStatistics(userEmail?: string, fromDate?: Date, toDate?: Date): Promise<any> {
    // 기능 비활성화됨 - mailHistory 테이블이 스키마에서 제거됨
    console.warn("Mail history functionality disabled - mailHistory table was removed from schema");
    return {
      totalSent: 0,
      totalFailed: 0,
      recentSends: []
    };
  }

  // MailInitService 기능 통합
  async initializeFromEnv(): Promise<boolean> {
    try {
      const mailUser = process.env.MAIL_USER;
      const mailPass = process.env.MAIL_PASS;
      const mailProvider = process.env.MAIL_PROVIDER as MailProvider || MailProvider.GMAIL;

      if (!mailUser || !mailPass) {
        console.log('⚠️ 메일 서비스 환경변수가 설정되지 않았습니다 (MAIL_USER, MAIL_PASS)');
        return false;
      }

      await this.configure({
        provider: mailProvider,
        config: {
          host: process.env.MAIL_HOST || '',
          port: parseInt(process.env.MAIL_PORT || '587'),
          secure: process.env.MAIL_SECURE === 'true',
          auth: {
            user: mailUser,
            pass: mailPass
          }
        }
      });

      console.log('✅ 메일 서비스가 환경변수로부터 초기화되었습니다');
      console.log(`📧 Provider: ${mailProvider}`);
      console.log(`👤 User: ${mailUser}`);
      
      return true;
    } catch (error) {
      console.error('❌ 메일 서비스 초기화 실패:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('메일 서비스가 설정되지 않았습니다');
      return false;
    }

    try {
      const isConnected = await this.verifyConnection();
      if (isConnected) {
        console.log('✅ 메일 서버 연결 테스트 성공');
      } else {
        console.log('❌ 메일 서버 연결 테스트 실패');
      }
      return isConnected;
    } catch (error) {
      console.error('❌ 메일 서버 연결 테스트 오류:', error);
      return false;
    }
  }

  async sendTestMail(toEmail?: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('메일 서비스가 설정되지 않았습니다');
      return false;
    }

    try {
      const result = await this.sendTemplatedMail(
        'notification',
        {
          userName: '테스트 사용자',
          title: '메일 서비스 테스트',
          message: '이 메일은 메일 서비스가 정상적으로 작동하는지 확인하기 위한 테스트 메일입니다.',
          companyName: env.COMPANY_NAME || 'DigDuck'
        },
        {
          from: env.MAIL_FROM || process.env.MAIL_USER || 'test@example.com',
          to: toEmail || process.env.MAIL_USER || 'test@example.com'
        }
      );

      if (result.success) {
        console.log('✅ 테스트 메일 발송 성공');
        console.log(`📧 수신자: ${toEmail || process.env.MAIL_USER}`);
        return true;
      } else {
        console.log('❌ 테스트 메일 발송 실패:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ 테스트 메일 발송 오류:', error);
      return false;
    }
  }
}
