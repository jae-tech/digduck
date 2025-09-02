import { PrismaClient } from "@prisma/client";
import { mailService } from "@/services";
import { env } from "@/config/env";

export class LicenseNotificationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 만료 예정 라이센스 확인 및 알림 발송
   */
  async checkExpiringLicenses(): Promise<void> {
    if (!mailService.isConfigured()) {
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
   * 특정 날짜에 만료되는 라이센스에 대해 경고 메일 발송
   */
  private async sendExpiryWarnings(targetDate: Date): Promise<void> {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const expiringSubscriptions =
      await this.prisma.licenseSubscriptions.findMany({
        where: {
          endDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          isActive: true,
        },
        include: {
          licenseUsers: true,
        },
      });

    const now = new Date();
    const daysLeft = Math.ceil(
      (targetDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );

    for (const subscription of expiringSubscriptions) {
      try {
        if (!subscription.licenseUsers) continue;

        await mailService.sendTemplatedMail(
          "license-expiry-warning",
          {
            userName:
              subscription.licenseUsers.email ||
              subscription.userEmail.split("@")[0],
            productName: env.PRODUCT_NAME || "DigDuck",
            daysLeft: daysLeft.toString(),
            licenseKey: subscription.licenseUsers.licenseKey,
            expirationDate: subscription.endDate.toLocaleDateString("ko-KR"),
            renewUrl: `${env.CLIENT_URL || "https://app.example.com"}/license/renew`,
            contactUrl: `${env.CLIENT_URL || "https://app.example.com"}/contact`,
            companyName: env.COMPANY_NAME || "DigDuck",
          },
          {
            from: env.MAIL_FROM || "noreply@digduck.com",
            to: subscription.userEmail,
          }
        );

        console.log(
          `만료 경고 메일 발송 완료: ${subscription.userEmail} (${daysLeft}일 남음)`
        );
      } catch (error) {
        console.error(
          `만료 경고 메일 발송 실패: ${subscription.userEmail}`,
          error
        );
      }
    }
  }

  /**
   * 개별 라이센스 만료 경고 발송
   */
  async sendExpiryWarning(
    userEmail: string,
    daysLeft: number
  ): Promise<boolean> {
    if (!mailService.isConfigured()) {
      console.log("메일 서비스가 설정되지 않았습니다.");
      return false;
    }

    try {
      const licenseUser = await this.prisma.licenseUsers.findUnique({
        where: { email: userEmail },
        include: {
          licenseSubscriptions: {
            where: { isActive: true },
            orderBy: { endDate: "desc" },
            take: 1,
          },
        },
      });

      if (!licenseUser || licenseUser.licenseSubscriptions.length === 0) {
        console.log(`활성 라이센스를 찾을 수 없습니다: ${userEmail}`);
        return false;
      }

      const activeSubscription = licenseUser.licenseSubscriptions[0];

      await mailService.sendTemplatedMail(
        "license-expiry-warning",
        {
          userName: licenseUser.email || userEmail.split("@")[0],
          productName: env.PRODUCT_NAME || "DigDuck",
          daysLeft: daysLeft.toString(),
          licenseKey: licenseUser.licenseKey,
          expirationDate:
            activeSubscription.endDate.toLocaleDateString("ko-KR"),
          renewUrl: `${env.CLIENT_URL || "https://app.example.com"}/license/renew`,
          contactUrl: `${env.CLIENT_URL || "https://app.example.com"}/contact`,
          companyName: env.COMPANY_NAME || "DigDuck",
        },
        {
          from: env.MAIL_FROM || "noreply@digduck.com",
          to: userEmail,
        }
      );

      console.log(
        `개별 만료 경고 메일 발송 완료: ${userEmail} (${daysLeft}일 남음)`
      );
      return true;
    } catch (error) {
      console.error(`개별 만료 경고 메일 발송 실패: ${userEmail}`, error);
      return false;
    }
  }

  /**
   * 라이센스 갱신 완료 알림 발송
   */
  async sendRenewalNotification(userEmail: string): Promise<boolean> {
    if (!mailService.isConfigured()) {
      return false;
    }

    try {
      const licenseUser = await this.prisma.licenseUsers.findUnique({
        where: { email: userEmail },
        include: {
          licenseSubscriptions: {
            where: { isActive: true },
            orderBy: { endDate: "desc" },
            take: 1,
          },
        },
      });

      if (!licenseUser || licenseUser.licenseSubscriptions.length === 0) {
        return false;
      }

      const activeSubscription = licenseUser.licenseSubscriptions[0];

      await mailService.sendTemplatedMail(
        "license-created", // 갱신도 동일한 템플릿 사용
        {
          userName: licenseUser.email || userEmail.split("@")[0],
          productName: env.PRODUCT_NAME || "DigDuck",
          licenseKey: licenseUser.licenseKey,
          userEmail: userEmail,
          issueDate: activeSubscription.createdAt.toLocaleDateString("ko-KR"),
          expirationDate:
            activeSubscription.endDate.toLocaleDateString("ko-KR"),
          licenseType: this.getSubscriptionTypeName(
            activeSubscription.subscriptionType
          ),
          loginUrl: env.CLIENT_URL || "https://app.example.com/login",
          companyName: env.COMPANY_NAME || "DigDuck",
        },
        {
          from: env.MAIL_FROM || "noreply@digduck.com",
          to: userEmail,
        }
      );

      return true;
    } catch (error) {
      console.error("라이센스 갱신 알림 발송 실패:", error);
      return false;
    }
  }

  /**
   * 구독 타입명 변환
   */
  private getSubscriptionTypeName(subscriptionType: string): string {
    switch (subscriptionType) {
      case "ONE_MONTH":
        return "1개월";
      case "THREE_MONTHS":
        return "3개월";
      case "SIX_MONTHS":
        return "6개월";
      case "ONE_YEAR":
        return "1년";
      case "LIFETIME":
        return "평생";
      default:
        return "알 수 없음";
    }
  }
}
