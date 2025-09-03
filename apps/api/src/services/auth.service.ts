import { FastifyInstance } from "fastify";
import { prisma } from "../plugins/prisma";
import { env } from "../config/env";
import type { JWTPayload } from "@repo/shared";

interface LicenseLoginCredentials {
  licenseKey: string;
  deviceId: string;
  platform?: "WEB" | "DESKTOP";
}

interface RegisterData {
  email: string;
  name: string;
}

interface User {
  id: number;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface LicenseInfo {
  allowedDevices: number;
  activatedDevices: any[];
  isActive: boolean;
}

interface LoginResult {
  token: string;
  user: User;
  licenseInfo: LicenseInfo;
  purchasedItems?: any[];
}

export class AuthService {
  constructor(private app: FastifyInstance) {}

  async loginWithLicense(
    credentials: LicenseLoginCredentials
  ): Promise<LoginResult> {
    const { licenseKey, deviceId, platform = "WEB" } = credentials;

    // 라이센스 검증
    const licenseData = await prisma.licenseUsers.findUnique({
      where: { licenseKey },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        licenseItems: true,
        licenseSubscriptions: {
          where: {
            isActive: true,
            endDate: {
              gt: new Date(),
            },
          },
        },
      },
    });

    if (!licenseData) {
      throw new Error("잘못된 라이센스 키");
    }

    // 구독 확인
    const activeSubscription = licenseData.licenseSubscriptions[0];
    if (!activeSubscription) {
      throw new Error("라이센스가 만료되었거나 비활성 상태입니다");
    }

    // 디바이스 활성화 확인 및 처리
    const activatedDevices = (licenseData.activatedDevices as any[]) || [];
    const isDeviceActivated = activatedDevices.some(
      (device: any) => device.deviceId === deviceId
    );

    if (!isDeviceActivated) {
      // 디바이스 한도 확인
      if (activatedDevices.length >= licenseData.allowedDevices) {
        throw new Error("디바이스 한도 초과");
      }

      // 새 디바이스 추가
      const newDevice = {
        deviceId: deviceId,
        platform: platform,
        activatedAt: new Date().toISOString(),
      };
      const updatedDevices = [...activatedDevices, newDevice];

      // 디바이스 정보 업데이트
      await prisma.licenseUsers.update({
        where: { licenseKey },
        data: {
          activatedDevices: updatedDevices,
        },
      });

      activatedDevices.push(newDevice);
    }

    // JWT 토큰 생성
    const token = this.app.jwt.sign(
      {
        userId: licenseData.users.id.toString(),
        email: licenseData.users.email,
        licenseKey: licenseKey,
        deviceId: deviceId,
      },
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    const user = {
      id: licenseData.users.id,
      email: licenseData.users.email,
      name: licenseData.users.name,
      createdAt: licenseData.users.createdAt,
      updatedAt: licenseData.users.updatedAt,
    };

    const licenseInfo = {
      allowedDevices: licenseData.allowedDevices,
      activatedDevices: activatedDevices,
      isActive: true,
    };

    // 구매한 아이템 조회
    const purchasedItems = licenseData.licenseItems.map((item) => ({
      id: item.id,
      itemType: item.itemType,
      quantity: item.quantity,
      purchasedAt: item.purchasedAt,
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