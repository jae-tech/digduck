import {
  PrismaClient,
} from "@prisma/client";
import { createHash, randomUUID } from "crypto";
import { env } from "@/config/env";

export class LicenseService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 라이센스 키 생성
   */
  private generateLicenseKey(email: string): string {
    const uuid = randomUUID();
    const salt = env.LICENSE_SALT;
    const data = `${email}-${uuid}-${salt}`;
    const fullHash = createHash("sha256")
      .update(data)
      .digest("hex")
      .toUpperCase();
    // 16자리로 자르기
    return fullHash.substring(0, 16);
  }

  /**
   * 구독 플랜 코드에 따른 이름 변환
   */
  private getSubscriptionPlanName(planCode: string): string {
    switch (planCode) {
      case "ONE_MONTH":
        return "1개월";
      case "THREE_MONTHS":
        return "3개월";
      case "SIX_MONTHS":
        return "6개월";
      case "TWELVE_MONTHS":
        return "12개월";
      case "BASIC":
        return "기본";
      case "PREMIUM":
        return "프리미엄";
      case "ENTERPRISE":
        return "엔터프라이즈";
      default:
        return "알 수 없음";
    }
  }

  /**
   * 구독 기간 계산
   */
  private calculateEndDate(
    startDate: Date,
    duration: number | null
  ): Date | null {
    // 평생 라이센스인 경우 (duration이 null)
    if (duration === null) {
      return null;
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);
    
    return endDate;
  }

  /*
   * 이 파일의 기존 메서드들은 새 스키마에 맞지 않으므로 
   * 새로 생성한 AdminService, LicenseManagementService를 사용하세요.
   * 
   * 주요 대체 서비스:
   * - AdminService: 관리자 기능
   * - LicenseManagementService: 라이센스 관리 기능
   * - AuthService: 인증 및 라이센스 검증
   */
}