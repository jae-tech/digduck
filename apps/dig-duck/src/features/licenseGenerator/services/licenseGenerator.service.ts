import {
  type LicenseConfig,
  type LicenseGenerationResult,
  type BulkLicenseConfig,
} from "../types/licenseGenerator.types";
import { apiHelpers } from "@/lib/apiClient";

export class LicenseGeneratorService {
  // private static readonly API_BASE_URL = import.meta.env.VITE_API_URL || "";

  // 라이센스 키 생성 함수
  static generateLicenseKey(
    type: "user" | "admin",
    phoneNumber?: string
  ): string {
    if (type === "admin" && phoneNumber) {
      return `ADMIN${phoneNumber}`;
    }

    // 사용자 라이센스 키 생성 (16자리 영문숫자)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 사용자 등록 후 라이센스 생성
  static async registerUserAndGenerateLicense(
    config: LicenseConfig
  ): Promise<LicenseGenerationResult> {
    try {
      // 1. 먼저 사용자 등록
      try {
        const userRegistration = await apiHelpers.post('/auth/register', {
          email: config.userEmail,
          name: config.userName || 'User'
        });
        
        if (!userRegistration.success) {
          // 이미 존재하는 사용자라면 계속 진행
          if (!userRegistration.error?.includes('already exists')) {
            throw new Error(userRegistration.error || 'User registration failed');
          }
        }
      } catch (userError: any) {
        // 이미 사용자가 존재하는 경우가 아니면 에러 처리
        if (!userError.details?.error?.includes('already exists')) {
          return {
            success: false,
            message: `사용자 등록 실패: ${userError.message}`,
            error: "USER_REGISTRATION_FAILED"
          };
        }
      }

      // 2. 라이센스 사용자 생성
      const licenseUserResponse = await apiHelpers.post('/api/license/users', {
        email: config.userEmail,
        allowedDevices: config.maxActivations || 3,
        maxTransfers: 5
      });

      if (!licenseUserResponse.success) {
        return {
          success: false,
          message: `라이센스 생성 실패: ${licenseUserResponse.error}`,
          error: "LICENSE_CREATION_FAILED"
        };
      }

      // 3. 구독 생성
      const subscriptionType = this.getSubscriptionType(config.expiryDate);
      const subscriptionResponse = await apiHelpers.post('/api/license/subscriptions', {
        userEmail: config.userEmail,
        subscriptionType,
        paymentId: `admin_generated_${Date.now()}`
      });

      if (!subscriptionResponse.success) {
        return {
          success: false,
          message: `구독 생성 실패: ${subscriptionResponse.error}`,
          error: "SUBSCRIPTION_CREATION_FAILED"
        };
      }

      return {
        success: true,
        licenseKey: licenseUserResponse.data.licenseKey,
        message: "라이센스가 성공적으로 생성되었습니다.",
      };

    } catch (error: any) {
      console.error('License generation error:', error);
      return {
        success: false,
        message: `라이센스 생성 중 오류가 발생했습니다: ${error.message}`,
        error: "GENERATION_FAILED"
      };
    }
  }

  // 만료일을 기준으로 구독 타입 결정
  private static getSubscriptionType(expiryDate: string): 'ONE_MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'TWELVE_MONTHS' {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffMonths = (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth());
    
    if (diffMonths <= 1) return 'ONE_MONTH';
    if (diffMonths <= 3) return 'THREE_MONTHS';
    if (diffMonths <= 6) return 'SIX_MONTHS';
    return 'TWELVE_MONTHS';
  }

  // 단일 라이센스 생성 (기존 메서드를 새로운 로직으로 대체)
  static async generateLicense(
    config: LicenseConfig
  ): Promise<LicenseGenerationResult> {
    return this.registerUserAndGenerateLicense(config);
  }

  // 대량 라이센스 생성
  static async generateBulkLicenses(
    bulkConfig: BulkLicenseConfig
  ): Promise<LicenseGenerationResult[]> {
    const results: LicenseGenerationResult[] = [];

    for (let i = 0; i < bulkConfig.count; i++) {
      const config = { ...bulkConfig.config };
      if (bulkConfig.prefix) {
        config.userEmail = `${bulkConfig.prefix}${i + 1}@example.com`;
      }

      const result = await this.generateLicense(config);
      results.push(result);

      // 서버 부하 방지를 위한 딜레이
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
  }

  // 개발용 시뮬레이션
  // @ts-ignore
  private static async simulateGeneration(
    config: LicenseConfig
  ): Promise<LicenseGenerationResult> {
    // API 호출 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      // 관리자 라이센스 검증
      if (config.licenseType === "admin") {
        if (!config.phoneNumber || config.phoneNumber.length !== 11) {
          return {
            success: false,
            message: "관리자 라이센스에는 11자리 휴대폰 번호가 필요합니다.",
            error: "INVALID_PHONE_NUMBER",
          };
        }
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(config.userEmail)) {
        return {
          success: false,
          message: "올바른 이메일 형식을 입력해주세요.",
          error: "INVALID_EMAIL",
        };
      }

      // 만료일 검증
      const expiryDate = new Date(config.expiryDate);
      const today = new Date();
      if (expiryDate <= today) {
        return {
          success: false,
          message: "만료일은 오늘 이후의 날짜여야 합니다.",
          error: "INVALID_EXPIRY_DATE",
        };
      }

      // 라이센스 키 생성
      const licenseKey = this.generateLicenseKey(
        config.licenseType,
        config.phoneNumber
      );

      return {
        success: true,
        licenseKey,
        message: "라이센스가 성공적으로 생성되었습니다.",
      };
    } catch (error) {
      return {
        success: false,
        message: "라이센스 생성 중 오류가 발생했습니다.",
        error: "GENERATION_FAILED",
      };
    }
  }

  // 라이센스 유효성 검증
  static validateLicenseConfig(config: LicenseConfig): string[] {
    const errors: string[] = [];

    if (!config.userEmail.trim()) {
      errors.push("사용자 이메일을 입력해주세요.");
    }

    if (!config.productName.trim()) {
      errors.push("제품명을 입력해주세요.");
    }

    if (!config.expiryDate) {
      errors.push("만료일을 선택해주세요.");
    }

    if (config.maxActivations < 1) {
      errors.push("최대 활성화 횟수는 1회 이상이어야 합니다.");
    }

    if (config.licenseType === "admin" && !config.phoneNumber) {
      errors.push("관리자 라이센스에는 휴대폰 번호가 필요합니다.");
    }

    return errors;
  }

  // 라이센스 삭제
  static async deleteLicense(licenseKey: string): Promise<boolean> {
    try {
      await apiHelpers.delete(`/api/admin/license/${licenseKey}`);
      return true;
    } catch (error) {
      console.error("Failed to delete license:", error);
      return false;
    }
  }
}
