import { PrismaClient } from "@prisma/client";

interface CreateLicenseRequest {
  email: string;
  serviceId: number;
  subscriptionPlanId: number;
  allowedDevices?: number;
  maxTransfers?: number;
}

interface AdminUsersFilter {
  page?: number;
  limit?: number;
  search?: string;
}

interface LicenseValidationResult {
  isValid: boolean;
  license?: any;
  user?: any;
  service?: any;
  subscriptionPlan?: any;
  devices?: any[];
  error?: string;
}

export class LicenseManagementService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 관리자용 라이센스 사용자 목록 조회
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
   * 라이센스 생성
   */
  async createLicense(data: CreateLicenseRequest) {
    const { email, serviceId, subscriptionPlanId, allowedDevices = 3, maxTransfers = 5 } = data;

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

    // 라이센스 키 생성
    const licenseKey = this.generateLicenseKey(email);

    // 시작일과 종료일 계산
    const startDate = new Date();
    let endDate: Date | null = null;

    if (subscriptionPlan.duration) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + subscriptionPlan.duration);
    }

    // 라이센스 생성
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
   * 라이센스 검증
   */
  async validateLicense(licenseKey: string): Promise<LicenseValidationResult> {
    try {
      // 라이센스 조회
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
            select: { id: true, code: true, name: true, duration: true, price: true },
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

      // 라이센스 활성 상태 확인
      if (!license.isActive) {
        return {
          isValid: false,
          error: "라이센스가 비활성 상태입니다",
        };
      }

      // 만료일 확인 (평생 라이센스는 endDate가 null)
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
   * 라이센스 사용자 삭제
   */
  async deleteLicenseUser(email: string) {
    // 해당 이메일의 모든 라이센스 삭제
    await this.prisma.licenses.deleteMany({
      where: { userEmail: email },
    });

    // 사용자도 삭제 (다른 라이센스가 없다면)
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
   * 라이센스 키 생성 함수
   */
  private generateLicenseKey(_email: string): string {
    // 일반 사용자 라이센스 키 생성 (16자리 영문숫자)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
}