import { PrismaClient } from "@prisma/client";
import {
  AdminStatsFilter,
  LicenseFilter,
  LicenseStats,
  LicenseListResult,
} from "@/types/admin.types";

export class AdminService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 라이센스 통계 조회
   */
  async getLicenseStats(filter: AdminStatsFilter = {}): Promise<LicenseStats> {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [
      totalLicenses,
      activeLicenses,
      expiredLicenses,
      suspendedLicenses,
      adminLicenses,
      expiringSoon,
    ] = await Promise.all([
      // 전체 라이센스 수
      this.prisma.licenses.count(),

      // 활성 라이센스 수
      this.prisma.licenses.count({
        where: {
          isActive: true,
          OR: [
            { endDate: null }, // 평생 라이센스
            { endDate: { gt: now } }, // 만료일이 아직 남은 라이센스
          ],
        },
      }),

      // 만료된 라이센스 수
      this.prisma.licenses.count({
        where: {
          endDate: { lt: now },
        },
      }),

      // 정지된 라이센스 수
      this.prisma.licenses.count({
        where: {
          isActive: false,
        },
      }),

      // 관리자 라이센스 수 (Admin 서비스 기반)
      this.prisma.licenses.count({
        where: {
          user: {
            isAdmin: true,
          },
        },
      }),

      // 30일 내 만료 예정
      this.prisma.licenses.count({
        where: {
          isActive: true,
          endDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
      }),
    ]);

    // revoked는 삭제된 라이센스이므로 0으로 설정
    const revokedLicenses = 0;

    return {
      total: totalLicenses,
      active: activeLicenses,
      expired: expiredLicenses,
      suspended: suspendedLicenses,
      revoked: revokedLicenses,
      admin: adminLicenses,
      expiringSoon,
    };
  }

  /**
   * 라이센스 목록 조회
   */
  async getLicenses(filter: LicenseFilter): Promise<LicenseListResult> {
    const { page = 1, limit = 20, search, status, licenseType } = filter;
    const skip = (page - 1) * limit;
    const now = new Date();

    // 검색 및 필터 조건 구성
    const where: any = {};

    if (search) {
      where.OR = [
        { licenseKey: { contains: search, mode: "insensitive" } },
        { userEmail: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (licenseType === "admin") {
      where.user = { isAdmin: true };
    } else if (licenseType === "user") {
      where.user = { isAdmin: false };
    }

    if (status) {
      switch (status) {
        case "active":
          where.isActive = true;
          where.OR = [{ endDate: null }, { endDate: { gt: now } }];
          break;
        case "expired":
          where.endDate = { lt: now };
          break;
        case "suspended":
          where.isActive = false;
          break;
        case "revoked":
          // 삭제된 라이센스는 조회되지 않으므로 빈 결과
          where.id = -1;
          break;
      }
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
          addons: {
            include: {
              addonProduct: true,
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
   * 라이센스 삭제
   */
  async deleteLicense(licenseKey: string): Promise<void> {
    await this.prisma.licenses.delete({
      where: { licenseKey },
    });
  }

  /**
   * 라이센스 상태 업데이트
   */
  async updateLicenseStatus(
    licenseKey: string,
    action: "activate" | "suspend" | "revoke",
  ): Promise<void> {
    switch (action) {
      case "activate":
        await this.prisma.licenses.update({
          where: { licenseKey },
          data: { isActive: true },
        });
        break;
      case "suspend":
        await this.prisma.licenses.update({
          where: { licenseKey },
          data: { isActive: false },
        });
        break;
      case "revoke":
        await this.prisma.licenses.delete({
          where: { licenseKey },
        });
        break;
    }
  }

  /**
   * 대량 라이센스 작업
   */
  async bulkLicenseAction(
    action: "activate" | "suspend" | "revoke" | "delete",
    licenseKeys: string[],
  ): Promise<void> {
    switch (action) {
      case "activate":
        await this.prisma.licenses.updateMany({
          where: { licenseKey: { in: licenseKeys } },
          data: { isActive: true },
        });
        break;
      case "suspend":
        await this.prisma.licenses.updateMany({
          where: { licenseKey: { in: licenseKeys } },
          data: { isActive: false },
        });
        break;
      case "revoke":
      case "delete":
        await this.prisma.licenses.deleteMany({
          where: { licenseKey: { in: licenseKeys } },
        });
        break;
    }
  }
}
