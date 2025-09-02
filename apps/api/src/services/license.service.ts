import {
  PrismaClient,
  LicenseSubscriptionType,
  ItemType,
} from "@prisma/client";
import { createHash, randomUUID } from "crypto";
import { env } from "@/config/env";
import {
  CreateLicenseUserRequest,
  CreateSubscriptionRequest,
  ExtendSubscriptionRequest,
  ActivateDeviceRequest,
  TransferDeviceRequest,
  PurchaseItemRequest,
  LicenseVerificationResponse,
  LicenseStatusResponse,
  DeviceInfo,
  LicenseError,
  LicenseErrorCodes,
} from "@/types/license.types";
import { mailService } from "@/services";

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
   * 구독 타입명 변환
   */
  private getSubscriptionTypeName(subscriptionType: LicenseSubscriptionType): string {
    switch (subscriptionType) {
      case "ONE_YEAR":
        return "1년";
      case "LIFETIME":
        return "평생";
      default:
        return "알 수 없음";
    }
  }

  /**
   * 구독 기간 계산
   */
  private calculateEndDate(
    startDate: Date,
    subscriptionType: LicenseSubscriptionType
  ): Date {
    const endDate = new Date(startDate);

    switch (subscriptionType) {
      case "ONE_YEAR":
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case "LIFETIME":
        endDate.setFullYear(endDate.getFullYear() + 100); // 100 years from now for lifetime
        break;
    }

    return endDate;
  }

  /**
   * 라이센스 사용자 생성
   */
  async createLicenseUser(data: CreateLicenseUserRequest) {
    // 사용자 존재 확인
    const existingUser = await this.prisma.users.findUnique({
      where: { email: data.email },
    });

    if (!existingUser) {
      throw new LicenseError(
        `User with email ${data.email} not found`,
        LicenseErrorCodes.USER_NOT_FOUND,
        404
      );
    }

    // 이미 라이센스가 있는지 확인
    const existingLicense = await this.prisma.licenseUsers.findUnique({
      where: { email: data.email },
    });

    if (existingLicense) {
      throw new LicenseError(
        "License already exists for this user",
        LicenseErrorCodes.DUPLICATE_LICENSE,
        409
      );
    }

    // 라이센스 키 생성
    const licenseKey = this.generateLicenseKey(data.email);

    // 라이센스 사용자 생성
    const licenseUser = await this.prisma.licenseUsers.create({
      data: {
        email: data.email,
        licenseKey,
        allowedDevices: data.allowedDevices || 3,
        maxTransfers: data.maxTransfers || 5,
        activatedDevices: [],
      },
    });

    return licenseUser;
  }

  /**
   * 구독 생성
   */
  async createSubscription(data: CreateSubscriptionRequest) {
    // 라이센스 사용자 확인
    const licenseUser = await this.prisma.licenseUsers.findUnique({
      where: { email: data.userEmail },
    });

    if (!licenseUser) {
      throw new LicenseError(
        "License user not found",
        LicenseErrorCodes.LICENSE_NOT_FOUND,
        404
      );
    }

    const startDate = new Date();
    const endDate = this.calculateEndDate(startDate, data.subscriptionType);

    // 트랜잭션으로 구독 생성
    const subscription = await this.prisma.$transaction(async (tx: any) => {
      // 기존 활성 구독 비활성화
      await tx.licenseSubscriptions.updateMany({
        where: {
          userEmail: data.userEmail,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      // 새 구독 생성
      return tx.licenseSubscriptions.create({
        data: {
          userEmail: data.userEmail,
          subscriptionType: data.subscriptionType,
          startDate,
          endDate,
          paymentId: data.paymentId,
        },
      });
    });

    // 라이센스 발급 완료 메일 발송
    if (mailService.isConfigured()) {
      try {
        const licenseUser = await this.prisma.licenseUsers.findUnique({
          where: { email: data.userEmail }
        });

        if (licenseUser) {
          await mailService.sendTemplatedMail(
            'license-created',
            {
              userName: data.userEmail.split('@')[0],
              productName: env.PRODUCT_NAME || 'DigDuck',
              licenseKey: licenseUser.licenseKey,
              userEmail: data.userEmail,
              issueDate: subscription.startDate.toLocaleDateString('ko-KR'),
              expirationDate: subscription.endDate.toLocaleDateString('ko-KR'),
              licenseType: this.getSubscriptionTypeName(data.subscriptionType),
              loginUrl: env.CLIENT_URL || 'https://app.example.com/login',
              companyName: env.COMPANY_NAME || 'DigDuck'
            },
            {
              from: env.MAIL_FROM || 'noreply@digduck.com',
              to: data.userEmail
            }
          );
        }
      } catch (error) {
        console.error('라이센스 발급 메일 발송 실패:', error);
        // 메일 발송 실패는 라이센스 생성을 막지 않음
      }
    }

    return subscription;
  }

  /**
   * 구독 연장
   */
  async extendSubscription(data: ExtendSubscriptionRequest) {
    // 동시성 제어를 위한 락
    return await this.prisma.$transaction(async (tx: any) => {
      // 현재 활성 구독 찾기
      const activeSubscription = await tx.licenseSubscriptions.findFirst({
        where: {
          userEmail: data.userEmail,
          isActive: true,
        },
      });

      let subscription;

      if (activeSubscription) {
        // 기존 구독 연장
        const newEndDate = new Date(activeSubscription.endDate);
        newEndDate.setMonth(newEndDate.getMonth() + data.months);

        subscription = await tx.licenseSubscriptions.update({
          where: { id: activeSubscription.id },
          data: {
            endDate: newEndDate,
            subscriptionType:
              data.subscriptionType || activeSubscription.subscriptionType,
          },
        });
      } else {
        // 신규 구독 생성
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + data.months);

        subscription = await tx.licenseSubscriptions.create({
          data: {
            userEmail: data.userEmail,
            subscriptionType: data.subscriptionType || "ONE_YEAR",
            startDate,
            endDate,
            paymentId: data.paymentId,
          },
        });
      }

      // 연장 기록 저장
      await tx.licenseItems.create({
        data: {
          userEmail: data.userEmail,
          itemType: ItemType.SUBSCRIPTION_EXTENSION,
          quantity: data.months,
        },
      });

      return subscription;
    });
  }

  /**
   * 디바이스 활성화
   */
  async activateDevice(data: ActivateDeviceRequest) {
    const licenseUser = await this.prisma.licenseUsers.findUnique({
      where: { email: data.userEmail },
    });

    if (!licenseUser) {
      throw new LicenseError(
        "License user not found",
        LicenseErrorCodes.LICENSE_NOT_FOUND,
        404
      );
    }

    const activatedDevices =
      licenseUser.activatedDevices as unknown as DeviceInfo[];

    // 이미 활성화된 디바이스인지 확인
    const existingDevice = activatedDevices.find(
      (device) => device.deviceId === data.deviceId
    );
    if (existingDevice) {
      return licenseUser; // 이미 활성화됨
    }

    // 디바이스 한도 확인
    if (activatedDevices.length >= licenseUser.allowedDevices) {
      throw new LicenseError(
        "Device limit exceeded",
        LicenseErrorCodes.DEVICE_LIMIT_EXCEEDED,
        400
      );
    }

    // 새 디바이스 추가
    const newDevice: DeviceInfo = {
      deviceId: data.deviceId,
      platform: data.platform,
      activatedAt: new Date().toISOString(),
    };

    const updatedDevices = [...activatedDevices, newDevice];

    const updatedUser = await this.prisma.licenseUsers.update({
      where: { email: data.userEmail },
      data: {
        activatedDevices: updatedDevices as any,
      },
    });

    return updatedUser;
  }

  /**
   * 디바이스 이전
   */
  async transferDevice(data: TransferDeviceRequest) {
    return await this.prisma.$transaction(async (tx: any) => {
      const licenseUser = await tx.licenseUsers.findUnique({
        where: { email: data.userEmail },
      });

      if (!licenseUser) {
        throw new LicenseError(
          "License user not found",
          LicenseErrorCodes.LICENSE_NOT_FOUND,
          404
        );
      }

      // 이전 횟수 확인
      if (licenseUser.maxTransfers <= 0) {
        throw new LicenseError(
          "No transfers remaining",
          LicenseErrorCodes.TRANSFER_LIMIT_EXCEEDED,
          400
        );
      }

      const activatedDevices =
        licenseUser.activatedDevices as unknown as DeviceInfo[];
      const deviceIndex = activatedDevices.findIndex(
        (device) => device.deviceId === data.oldDeviceId
      );

      if (deviceIndex === -1) {
        throw new LicenseError(
          "Old device not found",
          LicenseErrorCodes.DEVICE_NOT_FOUND,
          404
        );
      }

      // 디바이스 정보 업데이트
      const updatedDevices = [...activatedDevices];
      updatedDevices[deviceIndex] = {
        deviceId: data.newDeviceId,
        platform: data.platform,
        activatedAt: new Date().toISOString(),
      };

      // 라이센스 사용자 업데이트
      const updatedUser = await tx.licenseUsers.update({
        where: { email: data.userEmail },
        data: {
          activatedDevices: updatedDevices as any,
          maxTransfers: licenseUser.maxTransfers - 1,
        },
      });

      // 이전 로그 저장
      await tx.deviceTransfers.create({
        data: {
          userEmail: data.userEmail,
          oldDeviceId: data.oldDeviceId,
          newDeviceId: data.newDeviceId,
          platform: data.platform,
        },
      });

      return updatedUser;
    });
  }

  /**
   * 라이센스 키로 검증
   */
  async verifyLicenseByKey(
    licenseKey: string
  ): Promise<LicenseVerificationResponse> {
    const licenseUser = await this.prisma.licenseUsers.findUnique({
      where: { licenseKey },
      include: {
        licenseSubscriptions: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!licenseUser) {
      return {
        isValid: false,
        isActive: false,
        userEmail: "",
        licenseKey: "",
        allowedDevices: 0,
        activatedDevices: [],
        maxTransfers: 0,
      };
    }

    const activeSubscription = licenseUser.licenseSubscriptions[0];
    const hasActiveSubscription =
      activeSubscription &&
      activeSubscription.isActive &&
      new Date(activeSubscription.endDate) > new Date();

    return {
      isValid: true,
      isActive: hasActiveSubscription || false,
      userEmail: licenseUser.email,
      licenseKey: licenseUser.licenseKey,
      allowedDevices: licenseUser.allowedDevices,
      activatedDevices: licenseUser.activatedDevices as unknown as DeviceInfo[],
      maxTransfers: licenseUser.maxTransfers,
      subscription: activeSubscription
        ? {
            type: activeSubscription.subscriptionType,
            startDate: activeSubscription.startDate,
            endDate: activeSubscription.endDate,
            isActive: activeSubscription.isActive,
          }
        : undefined,
    };
  }

  /**
   * 사용자 이메일로 라이센스 상태 조회
   */
  async getLicenseStatus(userEmail: string): Promise<LicenseStatusResponse> {
    const licenseUser = await this.prisma.licenseUsers.findUnique({
      where: { email: userEmail },
      include: {
        licenseSubscriptions: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        licenseItems: {
          orderBy: { purchasedAt: "desc" },
        },
        deviceTransfers: {
          orderBy: { transferDate: "desc" },
        },
      },
    });

    if (!licenseUser) {
      throw new LicenseError(
        "License user not found",
        LicenseErrorCodes.LICENSE_NOT_FOUND,
        404
      );
    }

    const activatedDevices =
      licenseUser.activatedDevices as unknown as DeviceInfo[];
    const activeSubscription = licenseUser.licenseSubscriptions[0];
    const hasActiveSubscription =
      activeSubscription &&
      activeSubscription.isActive &&
      new Date(activeSubscription.endDate) > new Date();

    return {
      userEmail: licenseUser.email,
      licenseKey: licenseUser.licenseKey,
      allowedDevices: licenseUser.allowedDevices,
      maxTransfers: licenseUser.maxTransfers,
      activatedDevices: activatedDevices as unknown as DeviceInfo[],
      activeDeviceCount: activatedDevices.length,
      hasActiveSubscription: hasActiveSubscription || false,
      subscription: activeSubscription
        ? {
            id: activeSubscription.id,
            type: activeSubscription.subscriptionType,
            startDate: activeSubscription.startDate,
            endDate: activeSubscription.endDate,
            isActive: activeSubscription.isActive,
            paymentId: activeSubscription.paymentId || undefined,
          }
        : undefined,
      items: licenseUser.licenseItems.map((item: any) => ({
        id: item.id,
        itemType: item.itemType,
        quantity: item.quantity,
        purchasedAt: item.purchasedAt,
      })),
      deviceTransfers: licenseUser.deviceTransfers.map((transfer: any) => ({
        id: transfer.id,
        oldDeviceId: transfer.oldDeviceId,
        newDeviceId: transfer.newDeviceId,
        platform: transfer.platform,
        transferDate: transfer.transferDate,
      })),
    };
  }

  /**
   * 아이템 구매
   */
  async purchaseItem(data: PurchaseItemRequest) {
    const licenseUser = await this.prisma.licenseUsers.findUnique({
      where: { email: data.userEmail },
    });

    if (!licenseUser) {
      throw new LicenseError(
        "License user not found",
        LicenseErrorCodes.LICENSE_NOT_FOUND,
        404
      );
    }

    return await this.prisma.$transaction(async (tx: any) => {
      // 아이템 구매 기록
      const item = await tx.licenseItems.create({
        data: {
          userEmail: data.userEmail,
          itemType: data.itemType,
          quantity: data.quantity,
        },
      });

      // 아이템 유형별 처리
      if (data.itemType === ItemType.EXTRA_DEVICE) {
        // 추가 디바이스: 허용 디바이스 수 증가
        await tx.licenseUsers.update({
          where: { email: data.userEmail },
          data: {
            allowedDevices: licenseUser.allowedDevices + data.quantity,
          },
        });
      }

      return item;
    });
  }

  /**
   * 구독 만료 확인 및 업데이트 (스케줄러용)
   */
  async checkAndUpdateExpiredSubscriptions() {
    const now = new Date();

    const expiredSubscriptions =
      await this.prisma.licenseSubscriptions.updateMany({
        where: {
          isActive: true,
          endDate: {
            lt: now,
          },
        },
        data: {
          isActive: false,
        },
      });

    return expiredSubscriptions;
  }
}
