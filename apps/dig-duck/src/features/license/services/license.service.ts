import { type LicenseVerificationResult } from "../types/license.types";
import { apiHelpers } from "@/lib/apiClient";

export class LicenseService {
  private static readonly API_BASE_URL = import.meta.env.VITE_API_URL || "";

  static validateFormat(licenseKey: string): boolean {
    // 일반 라이센스: 16자리 영문숫자 조합
    if (licenseKey.length === 16 && /^[A-Z0-9]+$/.test(licenseKey)) {
      return true;
    }

    // 관리자 라이센스: ADMIN + 11자리 숫자 (총 16자리)
    if (licenseKey.length === 16 && licenseKey.startsWith("ADMIN")) {
      const phoneNumber = licenseKey.substring(5); // ADMIN 이후 11자리
      return phoneNumber.length === 11 && /^[0-9]+$/.test(phoneNumber);
    }

    return false;
  }

  static isAdminLicense(licenseKey: string): boolean {
    return licenseKey.startsWith("ADMIN") && licenseKey.length === 16;
  }

  static extractPhoneNumber(adminLicenseKey: string): string | null {
    if (!this.isAdminLicense(adminLicenseKey)) return null;
    return adminLicenseKey.substring(5);
  }

  static formatLicenseKey(value: string): string {
    // 영문숫자만 허용하고 대문자로 변환
    const cleaned = value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    return cleaned.slice(0, 16); // 최대 16자리
  }

  static async verifyLicense(
    licenseKey: string,
    deviceId?: string
  ): Promise<LicenseVerificationResult> {
    try {
      // 실제 API 엔드포인트 사용 - 로그인 API 활용
      const response = await apiHelpers.post('/auth/login', {
        licenseKey,
        deviceId: deviceId || this.generateDeviceId(),
        platform: 'DESKTOP'
      });

      if (response.success) {
        // 토큰 저장
        localStorage.setItem('auth_token', response.data.token);
        
        return {
          success: true,
          userType: this.isAdminLicense(licenseKey) ? "admin" : "user",
          message: "라이센스가 성공적으로 활성화되었습니다.",
          licenseInfo: {
            expiryDate: "2025-12-31", // 구독 정보에서 가져올 수 있음
            userEmail: response.data.user.email,
            productName: "Naver Crawler License",
            userName: response.data.user.name,
            allowedDevices: response.data.licenseInfo.allowedDevices,
            activatedDevices: response.data.licenseInfo.activatedDevices
          },
          token: response.data.token,
          user: response.data.user
        };
      }

      return {
        success: false,
        userType: "user",
        message: "유효하지 않은 라이센스 키입니다."
      };
    } catch (error: any) {
      console.error('라이센스 검증 오류:', error);
      
      // API 응답에서 에러 메시지 추출
      const errorMessage = error.details?.error || error.message || "라이센스 검증 중 오류가 발생했습니다.";
      
      return {
        success: false,
        userType: "user",
        message: errorMessage
      };
    }
  }

  // 디바이스 ID 생성
  private static generateDeviceId(): string {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 16);
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  // 프론트엔드 개발용 시뮬레이션
  // @ts-ignore
  private static async simulateVerification(
    licenseKey: string
  ): Promise<LicenseVerificationResult> {
    // API 호출 시뮬레이션을 위한 딜레이
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const isValidFormat = this.validateFormat(licenseKey);

    if (!isValidFormat) {
      return {
        success: false,
        userType: "user",
        message: "16자리 영문숫자 조합의 라이센스 키를 입력해주세요.",
      };
    }

    // 관리자 라이센스 검증
    if (this.isAdminLicense(licenseKey)) {
      const phoneNumber = this.extractPhoneNumber(licenseKey);

      // 개발용 하드코딩 - 실제로는 백엔드 API에서 확인
      const validAdminPhones = [
        "01012345678",
        "01087654321",
        "01011112222",
        "01096666339",
      ];

      if (phoneNumber && validAdminPhones.includes(phoneNumber)) {
        return {
          success: true,
          userType: "admin",
          message: "관리자 라이센스가 성공적으로 활성화되었습니다.",
          licenseInfo: {
            expiryDate: "2025-12-31",
            userEmail: "admin@company.com",
            productName: "Admin License",
            phoneNumber,
          },
        };
      } else {
        return {
          success: false,
          userType: "user",
          message: "등록되지 않은 관리자 휴대폰 번호입니다.",
        };
      }
    }

    // 일반 사용자 라이센스 검증 (영문숫자 조합)
    const validUserCodes = [
      "ABC123DEF4567890", // 영문숫자 조합 예시
      "XYZ789GHI0123456",
      "TEST1234DEMO567",
      "VALID123LICENSE",
      "DEMO9876ALPHA12",
    ];

    if (validUserCodes.includes(licenseKey)) {
      return {
        success: true,
        userType: "user",
        message: "라이센스가 성공적으로 활성화되었습니다.",
        licenseInfo: {
          expiryDate: "2025-12-31",
          userEmail: "user@example.com",
          productName: "Standard License",
        },
      };
    }

    return {
      success: false,
      userType: "user",
      message: "유효하지 않은 라이센스 키입니다. 다시 확인해주세요.",
    };
  }

  static async revokeLicense(licenseKey: string): Promise<boolean> {
    try {
      await apiHelpers.post('/api/license/revoke', { licenseKey });
      return true;
    } catch (error) {
      console.error("라이센스 해지 실패:", error);
      return false;
    }
  }
}
