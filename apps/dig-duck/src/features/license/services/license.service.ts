import { apiHelpers } from "@/lib/apiClient";
import { type LicenseVerificationResult } from "../types/license.types";

export class LicenseService {
  static async verifyLicense(
    licenseKey: string,
    platform: "desktop" | "web",
    deviceId?: string
  ): Promise<LicenseVerificationResult> {
    try {
      const requestData = {
        licenseKey,
        platform: platform.toUpperCase(),
        deviceId: deviceId || this.generateDeviceId(),
      };

      const { data, success } = await apiHelpers.post(
        "/auth/login",
        requestData
      );

      if (success) {
        localStorage.setItem("auth_token", data.token);

        const result: LicenseVerificationResult = {
          success: true,
          userType: data.user.isAdmin ? "admin" : "user",
          message: "라이센스가 성공적으로 활성화되었습니다.",
          licenseInfo: {
            expiryDate: data.licenseInfo.expiryDate,
            userEmail: data.user.email,
            serviceCode: data.licenseInfo.serviceCode,
            serviceName: data.licenseInfo.serviceName,
            userName: data.user.name,
            allowedDevices: data.licenseInfo.allowedDevices,
            activatedDevices: data.licenseInfo.activatedDevices,
          },
          token: data.token,
          user: data.user,
        };

        return result;
      }

      return {
        success: false,
        userType: "user",
        message: "유효하지 않은 라이센스 키입니다.",
      };
    } catch (error: any) {
      console.error("License verification error:", error);

      // API 응답에서 에러 메시지 추출
      const errorMessage =
        error.details?.error ||
        error.message ||
        "라이센스 검증 중 오류가 발생했습니다.";

      return {
        success: false,
        userType: "user",
        message: errorMessage,
      };
    }
  }

  // 디바이스 ID 생성
  private static generateDeviceId(): string {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = "device_" + Math.random().toString(36).substr(2, 16);
      localStorage.setItem("device_id", deviceId);
    }
    return deviceId;
  }

  static async revokeLicense(licenseKey: string): Promise<boolean> {
    try {
      await apiHelpers.post("/api/license/revoke", { licenseKey });
      return true;
    } catch (error) {
      console.error("Failed to revoke license:", error);
      return false;
    }
  }
}
