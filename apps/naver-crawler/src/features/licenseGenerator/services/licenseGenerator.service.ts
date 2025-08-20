import {
  type LicenseConfig,
  type LicenseGenerationResult,
  type GeneratedLicense,
  type BulkLicenseConfig,
} from "../types/licenseGenerator.types";

export class LicenseGeneratorService {
  private static readonly API_BASE_URL = import.meta.env.VITE_API_URL || "";

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

  // 단일 라이센스 생성
  static async generateLicense(
    config: LicenseConfig
  ): Promise<LicenseGenerationResult> {
    try {
      // 실제 구현에서는 실제 API 엔드포인트를 사용
      const response = await fetch(
        `${this.API_BASE_URL}/api/admin/license/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify(config),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // 개발용 시뮬레이션
      return this.simulateGeneration(config);
    }
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
      const response = await fetch(
        `${this.API_BASE_URL}/api/admin/license/${licenseKey}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Failed to delete license:", error);
      return false;
    }
  }
}
