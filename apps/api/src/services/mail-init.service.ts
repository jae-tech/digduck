import { mailService } from "@/services";
import { MailProvider } from "@/types/mail.types";
import { env } from "@/config/env";

export class MailInitService {
  static async initializeFromEnv(): Promise<boolean> {
    try {
      const mailUser = process.env.MAIL_USER;
      const mailPass = process.env.MAIL_PASS;
      const mailProvider = process.env.MAIL_PROVIDER as MailProvider || MailProvider.GMAIL;

      if (!mailUser || !mailPass) {
        console.log('⚠️ 메일 서비스 환경변수가 설정되지 않았습니다 (MAIL_USER, MAIL_PASS)');
        return false;
      }

      await mailService.configure({
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

  static async testConnection(): Promise<boolean> {
    if (!mailService.isConfigured()) {
      console.log('메일 서비스가 설정되지 않았습니다');
      return false;
    }

    try {
      const isConnected = await mailService.verifyConnection();
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

  static async sendTestMail(toEmail?: string): Promise<boolean> {
    if (!mailService.isConfigured()) {
      console.log('메일 서비스가 설정되지 않았습니다');
      return false;
    }

    try {
      const result = await mailService.sendTemplatedMail(
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