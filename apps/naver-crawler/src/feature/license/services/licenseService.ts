import { type LicenseVerificationResult } from "../types/license.types";

export class LicenseService {
  private static readonly API_BASE_URL = import.meta.env.VITE_API_URL || "";

  static formatLicenseKey(value: string): string {
    // 영숫자만 허용하고 대문자로 변환
    return value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  }

  static validateFormat(licenseKey: string): boolean {
    const cleanKey = licenseKey.replace(/-/g, "");
    return cleanKey.length === 16 && /^[A-Z0-9]+$/.test(cleanKey);
  }

  static async verifyLicense(
    licenseKey: string
  ): Promise<LicenseVerificationResult> {
    try {
      // 실제 구현에서는 실제 API 엔드포인트를 사용
      const response = await fetch(`${this.API_BASE_URL}/api/license/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ licenseKey: licenseKey.replace(/-/g, "") }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // 데모용 시뮬레이션 - 실제로는 위의 API 호출만 사용
      return this.simulateVerification(licenseKey);
    }
  }

  // 데모용 시뮬레이션 메서드 - 실제 프로덕션에서는 제거
  private static async simulateVerification(
    licenseKey: string
  ): Promise<LicenseVerificationResult> {
    // API 호출 시뮬레이션을 위한 딜레이
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const cleanKey = licenseKey.replace(/-/g, "");
    const isValidFormat = this.validateFormat(licenseKey);

    // 데모용 라이센스 키들
    const validDemoKeys = ["DEMO-1234-5678-ABCD", "TEST-9876-5432-EFGH"];
    const isValidDemo = validDemoKeys.some(
      (key) => key.replace(/-/g, "") === cleanKey
    );

    if (!isValidFormat) {
      return {
        success: false,
        message: "올바른 형식의 라이센스 키를 입력해주세요.",
      };
    }

    if (isValidDemo || cleanKey === "VALID123456789ABC") {
      return {
        success: true,
        message: "라이센스가 성공적으로 활성화되었습니다.",
        licenseInfo: {
          expiryDate: "2025-12-31",
          userEmail: "user@example.com",
          productName: "Demo Product",
        },
      };
    }

    return {
      success: false,
      message: "유효하지 않은 라이센스 키입니다. 다시 확인해주세요.",
    };
  }

  static async revokeLicense(licenseKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/license/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ licenseKey: licenseKey.replace(/-/g, "") }),
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to revoke license:", error);
      return false;
    }
  }
}
