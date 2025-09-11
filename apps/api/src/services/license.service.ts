import { PrismaClient } from "@prisma/client";
import { createHash, randomUUID } from "crypto";
import { env } from "@/config/env";
import {
  CreateLicenseRequest,
  AdminUsersFilter,
  LicenseValidationResult,
} from "@/types/license.types";

/**
 * 통합 라이선스 서비스
 * 라이선스 관리, 검증, 알림 등 모든 라이선스 관련 작업을 처리합니다
 */
export class LicenseService {
  constructor(private prisma: PrismaClient) {}

  // ========== 라이선스 관리 ==========

  /**
   * 관리자용 라이선스 사용자 목록 조회
   */
  async getAdminUsers(filter: AdminUsersFilter) {
    const { page = 1, limit = 20, search } = filter;
    const skip = (page - 1) * limit;

    // 검색 조건 구성
    const where: any = {};

    if (search) {
      where.OR = [
        { licenseKey: { contains: search, mode: "insensitive" } },
        { userEmail: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [licenses, total] = await Promise.all([
      this.prisma.licenses.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              nickname: true,
              isAdmin: true,
              createdAt: true,
            },
          },
          service: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          subscriptionPlan: {
            select: {
              id: true,
              code: true,
              name: true,
              duration: true,
              price: true,
            },
          },
          devices: {
            where: { status: "ACTIVE" },
            select: {
              id: true,
              deviceId: true,
              deviceName: true,
              platform: true,
              lastActive: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.licenses.count({ where }),
    ]);

    return {
      licenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 라이선스 생성
   */
  async createLicense(data: CreateLicenseRequest) {
    const {
      email,
      serviceId,
      subscriptionPlanId,
      allowedDevices = 3,
      maxTransfers = 5,
    } = data;

    // 사용자 확인 또는 생성
    let user = await this.prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.users.create({
        data: {
          email,
          name: email.split("@")[0], // 기본 이름 설정
        },
      });
    }

    // 구독 플랜 정보 확인
    const subscriptionPlan = await this.prisma.subscriptionPlans.findUnique({
      where: { id: subscriptionPlanId },
    });

    if (!subscriptionPlan) {
      throw new Error("구독 플랜을 찾을 수 없습니다");
    }

    // 라이선스 키 생성
    const licenseKey = this.generateLicenseKey(email);

    // 시작일과 종료일 계산
    const startDate = new Date();
    const endDate = this.calculateEndDate(startDate, subscriptionPlan.duration);

    // 라이선스 생성
    const license = await this.prisma.licenses.create({
      data: {
        userEmail: email,
        licenseKey,
        serviceId,
        subscriptionPlanId,
        startDate,
        endDate,
        maxDevices: allowedDevices,
        maxTransfers,
        isActive: true,
      },
      include: {
        user: true,
        service: true,
        subscriptionPlan: true,
      },
    });

    return license;
  }

  /**
   * 라이선스 검증
   */
  async validateLicense(licenseKey: string): Promise<LicenseValidationResult> {
    try {
      // 라이선스 조회
      const license = await this.prisma.licenses.findUnique({
        where: { licenseKey },
        include: {
          user: {
            select: { id: true, email: true, name: true, nickname: true },
          },
          service: {
            select: { id: true, code: true, name: true },
          },
          subscriptionPlan: {
            select: {
              id: true,
              code: true,
              name: true,
              duration: true,
              price: true,
            },
          },
          devices: {
            where: { status: "ACTIVE" },
            select: {
              id: true,
              deviceId: true,
              deviceName: true,
              platform: true,
              lastActive: true,
            },
          },
        },
      });

      if (!license) {
        return {
          isValid: false,
          error: "라이센스를 찾을 수 없습니다",
        };
      }

      // 라이선스 활성 상태 확인
      if (!license.isActive) {
        return {
          isValid: false,
          error: "라이센스가 비활성 상태입니다",
        };
      }

      // 만료일 확인 (평생 라이선스는 endDate가 null)
      const now = new Date();
      if (license.endDate && license.endDate < now) {
        return {
          isValid: false,
          error: "라이센스가 만료되었습니다",
        };
      }

      return {
        isValid: true,
        license,
        user: license.user,
        service: license.service,
        subscriptionPlan: license.subscriptionPlan,
        devices: license.devices,
      };
    } catch (error) {
      console.error("라이센스 검증 오류:", error);
      return {
        isValid: false,
        error: "라이센스 검증 중 오류가 발생했습니다",
      };
    }
  }

  /**
   * 라이선스 사용자 삭제
   */
  async deleteLicenseUser(email: string) {
    // 해당 이메일의 모든 라이선스 삭제
    await this.prisma.licenses.deleteMany({
      where: { userEmail: email },
    });

    // 사용자도 삭제 (다른 라이선스가 없다면)
    const remainingLicenses = await this.prisma.licenses.count({
      where: { userEmail: email },
    });

    if (remainingLicenses === 0) {
      await this.prisma.users.delete({
        where: { email },
      });
    }
  }

  /**
   * 구독 플랜 목록 조회
   */
  async getSubscriptionPlans() {
    return this.prisma.subscriptionPlans.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  /**
   * 서비스 목록 조회
   */
  async getServices() {
    return this.prisma.services.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  // ========== 알림 관련 메서드 ==========

  /**
   * 만료 예정 라이선스 확인 및 알림 발송
   */
  async checkExpiringLicenses(): Promise<void> {
    // 순환 참조 방지를 위한 동적 import
    const { notificationService } = await import("@/services");

    if (!notificationService.isConfigured()) {
      console.log("메일 서비스가 설정되지 않아 만료 알림을 건너뜁니다.");
      return;
    }

    const now = new Date();
    const warningDates = [
      new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30일 후
      new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7일 후
      new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3일 후
      new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1일 후
    ];

    for (const warningDate of warningDates) {
      await this.sendExpiryWarnings(warningDate);
    }
  }

  /**
   * 개별 라이선스 만료 경고 발송
   */
  async sendExpiryWarning(
    userEmail: string,
    daysLeft: number,
  ): Promise<boolean> {
    // 순환 참조 방지를 위한 동적 import
    const { notificationService } = await import("@/services");

    if (!notificationService.isConfigured()) {
      console.log("메일 서비스가 설정되지 않았습니다.");
      return false;
    }

    try {
      const license = await this.prisma.licenses.findFirst({
        where: {
          userEmail: userEmail,
          isActive: true,
          OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
        },
        include: {
          user: true,
          service: true,
          subscriptionPlan: true,
        },
      });

      if (!license) {
        console.log(`활성 라이센스를 찾을 수 없습니다: ${userEmail}`);
        return false;
      }

      await notificationService.sendTemplatedMail(
        "license-expiry-warning",
        {
          userName: license.user?.name || userEmail.split("@")[0],
          productName: env.PRODUCT_NAME || "DigDuck",
          daysLeft: daysLeft.toString(),
          licenseKey: license.licenseKey,
          expirationDate: license.endDate?.toLocaleDateString("ko-KR") || "",
          renewUrl: `${env.CLIENT_URL || "https://app.example.com"}/license/renew`,
          contactUrl: `${env.CLIENT_URL || "https://app.example.com"}/contact`,
          companyName: env.COMPANY_NAME || "DigDuck",
        },
        {
          from: env.MAIL_FROM || "noreply@digduck.com",
          to: userEmail,
        },
      );

      console.log(
        `개별 만료 경고 메일 발송 완료: ${userEmail} (${daysLeft}일 남음)`,
      );
      return true;
    } catch (error) {
      console.error(`개별 만료 경고 메일 발송 실패: ${userEmail}`, error);
      return false;
    }
  }

  /**
   * 라이선스 갱신 완료 알림 발송
   */
  async sendRenewalNotification(userEmail: string): Promise<boolean> {
    // 순환 참조 방지를 위한 동적 import
    const { notificationService } = await import("@/services");

    if (!notificationService.isConfigured()) {
      return false;
    }

    try {
      const license = await this.prisma.licenses.findFirst({
        where: {
          userEmail: userEmail,
          isActive: true,
          OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
        },
        include: {
          user: true,
          service: true,
          subscriptionPlan: true,
        },
      });

      if (!license) {
        return false;
      }

      await notificationService.sendTemplatedMail(
        "license-created", // 갱신도 동일한 템플릿 사용
        {
          userName: license.user?.name || userEmail.split("@")[0],
          productName: env.PRODUCT_NAME || "DigDuck",
          licenseKey: license.licenseKey,
          userEmail: userEmail,
          issueDate: license.createdAt.toLocaleDateString("ko-KR"),
          expirationDate:
            license.endDate?.toLocaleDateString("ko-KR") || "평생",
          licenseType: license.subscriptionPlan?.name || "기본",
          loginUrl: env.CLIENT_URL || "https://app.example.com/login",
          companyName: env.COMPANY_NAME || "DigDuck",
        },
        {
          from: env.MAIL_FROM || "noreply@digduck.com",
          to: userEmail,
        },
      );

      return true;
    } catch (error) {
      console.error("라이센스 갱신 알림 발송 실패:", error);
      return false;
    }
  }

  // ========== 내부 헬퍼 메서드 ==========

  /**
   * 라이선스 키 생성
   */
  private generateLicenseKey(email: string): string {
    // UUID 기반 생성 방식 사용 (고유성 보장)
    const uuid = randomUUID();
    const salt = env.LICENSE_SALT;

    if (salt) {
      // salt가 있으면 해시 기반 생성
      const data = `${email}-${uuid}-${salt}`;
      const fullHash = createHash("sha256")
        .update(data)
        .digest("hex")
        .toUpperCase();
      return fullHash.substring(0, 16);
    } else {
      // salt가 없으면 랜덤 생성
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  }

  /**
   * 구독 기간 계산
   */
  private calculateEndDate(
    startDate: Date,
    duration: number | null,
  ): Date | null {
    // 평생 라이선스인 경우 (duration이 null)
    if (duration === null) {
      return null;
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);

    return endDate;
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
      case "ONE_YEAR":
        return "12개월";
      case "BASIC":
        return "기본";
      case "PREMIUM":
        return "프리미엄";
      case "ENTERPRISE":
        return "엔터프라이즈";
      case "LIFETIME":
        return "평생";
      default:
        return "알 수 없음";
    }
  }

  /**
   * 특정 날짜에 만료되는 라이선스에 대해 경고 메일 발송
   */
  private async sendExpiryWarnings(targetDate: Date): Promise<void> {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const expiringLicenses = await this.prisma.licenses.findMany({
      where: {
        endDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        isActive: true,
      },
      include: {
        user: true,
        service: true,
        subscriptionPlan: true,
      },
    });

    const now = new Date();
    const daysLeft = Math.ceil(
      (targetDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
    );

    for (const license of expiringLicenses) {
      try {
        if (!license.user) continue;

        await this.sendExpiryWarning(license.userEmail, daysLeft);
      } catch (error) {
        console.error(`만료 경고 메일 발송 실패: ${license.userEmail}`, error);
      }
    }
  }
}
