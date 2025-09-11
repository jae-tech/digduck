import {
  LicenseLoginCredentials,
  LoginResult,
  RegisterData,
  User,
} from "@/types/auth.types";
import type { JWTPayload } from "@repo/shared";
import { FastifyInstance } from "fastify";
import { env } from "../config/env";
import { prisma } from "../plugins/prisma";

export class AuthService {
  constructor(private app: FastifyInstance) {}

  async loginWithLicense(
    credentials: LicenseLoginCredentials
  ): Promise<LoginResult> {
    const { licenseKey, deviceId, platform } = credentials;

    // 라이센스 검증
    const licenseData = await prisma.licenses.findUnique({
      where: { licenseKey },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            nickname: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        addons: {
          include: {
            addonProduct: true,
          },
        },
        devices: {
          where: { status: "ACTIVE" },
        },
        service: {
          select: {
            code: true,
            name: true,
          },
        },
        subscriptionPlan: {
          select: {
            code: true,
            name: true,
            duration: true,
          },
        },
      },
    });

    if (!licenseData) {
      throw new Error("잘못된 라이센스 키");
    }

    // 라이센스 활성화 및 만료 확인
    if (!licenseData.isActive) {
      throw new Error("라이센스가 비활성 상태입니다");
    }

    const now = new Date();
    if (licenseData.endDate && licenseData.endDate < now) {
      throw new Error("라이센스가 만료되었습니다");
    }

    // 디바이스 등록 또는 업데이트 (upsert 사용)
    // 현재 라이센스의 디바이스 한도 확인 (새 디바이스인 경우만)
    const existingDeviceForLicense = await prisma.devices.findFirst({
      where: {
        deviceId: deviceId,
        licenseKey: licenseKey,
      },
    });

    if (
      !existingDeviceForLicense &&
      licenseData.devices.length >= licenseData.maxDevices
    ) {
      throw new Error("디바이스 한도 초과");
    }

    // upsert를 사용하여 디바이스 등록 또는 활동 시간 업데이트
    await prisma.devices.upsert({
      where: {
        deviceId_licenseKey: {
          deviceId: deviceId,
          licenseKey: licenseKey,
        },
      },
      update: {
        lastActive: now,
        status: "ACTIVE",
      },
      create: {
        deviceId,
        licenseKey,
        deviceName: `${platform} Device`,
        platform: platform as any,
        status: "ACTIVE",
      },
    });

    // JWT 토큰 생성
    const token = this.app.jwt.sign(
      {
        userId: licenseData.user.id.toString(),
        email: licenseData.user.email,
        licenseKey: licenseKey,
        deviceId: deviceId,
      },
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    const user = {
      id: licenseData.user.id,
      email: licenseData.user.email,
      name: licenseData.user.name,
      nickname: licenseData.user.nickname,
      createdAt: licenseData.user.createdAt,
      updatedAt: licenseData.user.updatedAt,
    };

    const licenseInfo = {
      allowedDevices: licenseData.maxDevices,
      activatedDevices: licenseData.devices.map((device) => ({
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        platform: device.platform,
        lastActive: device.lastActive,
      })),
      isActive: licenseData.isActive,
      expiryDate: licenseData.endDate,
      serviceName: licenseData.service.name,
      serviceCode: licenseData.service.code,
      planCode: licenseData.subscriptionPlan.code,
      planName: licenseData.subscriptionPlan.name,
    };

    // 구매한 애드온 아이템 조회
    const purchasedItems = licenseData.addons.map((addon) => ({
      id: addon.id,
      itemType: addon.addonProduct.code,
      quantity: addon.quantity,
      purchasedAt: addon.purchaseDate,
    }));

    return {
      token,
      user,
      licenseInfo,
      purchasedItems,
    };
  }

  async register(userData: RegisterData): Promise<User> {
    const { email, name } = userData;

    // 이메일 중복 확인
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("이메일이 이미 존재합니다");
    }

    // 사용자 생성
    const user = await prisma.users.create({
      data: {
        email,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async getUserProfile(userId: number): Promise<User> {
    const userData = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userData) {
      throw new Error("사용자를 찾을 수 없습니다");
    }

    return userData;
  }

  async updateUserProfile(
    userId: number,
    updateData: Partial<User>
  ): Promise<User> {
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = this.app.jwt.verify(token) as JWTPayload;
      return decoded;
    } catch (error) {
      throw new Error("토큰이 유효하지 않습니다");
    }
  }
}
