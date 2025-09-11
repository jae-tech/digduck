import { describe, it, expect, beforeEach, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { LicenseService } from "../../src/services/license.service";
import { testPrisma } from "../setup";

describe("LicenseService", () => {
  let licenseService: LicenseService;

  beforeEach(() => {
    licenseService = new LicenseService(testPrisma);
  });

  describe("generateLicenseKey", () => {
    it("라이센스 키를 생성해야 함", () => {
      const userEmail = "test@example.com";
      const subscriptionType = "monthly";

      const licenseKey = licenseService.generateLicenseKey(
        userEmail,
        subscriptionType,
      );

      expect(licenseKey).toBeDefined();
      expect(typeof licenseKey).toBe("string");
      expect(licenseKey.length).toBeGreaterThan(0);
    });

    it("동일한 입력에 대해 동일한 키를 생성해야 함", () => {
      const userEmail = "test@example.com";
      const subscriptionType = "monthly";

      const key1 = licenseService.generateLicenseKey(
        userEmail,
        subscriptionType,
      );
      const key2 = licenseService.generateLicenseKey(
        userEmail,
        subscriptionType,
      );

      expect(key1).toBe(key2);
    });
  });

  describe("createLicense", () => {
    it("새 라이센스를 생성해야 함", async () => {
      const licenseData = {
        userEmail: "test@example.com",
        userName: "테스트 사용자",
        subscriptionType: "monthly" as const,
        subscriptionPeriodMonths: 1,
      };

      // Mock database responses
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "테스트 사용자",
        createdAt: new Date(),
      };
      const mockSubscription = {
        id: 1,
        userId: 1,
        type: "monthly",
        expiresAt: new Date(),
        isActive: true,
      };

      testPrisma.$transaction.mockResolvedValue({
        user: mockUser,
        subscription: mockSubscription,
      });

      const result = await licenseService.createLicense(licenseData);

      expect(result.success).toBe(true);
      expect(result.licenseKey).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe(licenseData.userEmail);
      expect(result.subscription).toBeDefined();
    });

    it("중복 이메일로 라이센스 생성 시 실패해야 함", async () => {
      const licenseData = {
        userEmail: "duplicate@example.com",
        userName: "테스트 사용자",
        subscriptionType: "monthly" as const,
        subscriptionPeriodMonths: 1,
      };

      await licenseService.createLicense(licenseData);
      const result = await licenseService.createLicense(licenseData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("validateLicense", () => {
    it("유효한 라이센스를 검증해야 함", async () => {
      const licenseData = {
        userEmail: "valid@example.com",
        userName: "테스트 사용자",
        subscriptionType: "monthly" as const,
        subscriptionPeriodMonths: 1,
      };

      const created = await licenseService.createLicense(licenseData);
      const result = await licenseService.validateLicense(created.licenseKey!);

      expect(result.isValid).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.subscription).toBeDefined();
    });

    it("존재하지 않는 라이센스 키로 검증 시 실패해야 함", async () => {
      const result = await licenseService.validateLicense("invalid-key");

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("activateDevice", () => {
    let licenseKey: string;

    beforeEach(async () => {
      const licenseData = {
        userEmail: "device@example.com",
        userName: "테스트 사용자",
        subscriptionType: "monthly" as const,
        subscriptionPeriodMonths: 1,
      };
      const created = await licenseService.createLicense(licenseData);
      licenseKey = created.licenseKey!;
    });

    it("디바이스를 활성화해야 함", async () => {
      const deviceInfo = {
        deviceId: "device-123",
        deviceName: "Test Device",
        platform: "windows",
        osVersion: "10.0",
        hwid: "hw-123",
      };

      const result = await licenseService.activateDevice(
        licenseKey,
        deviceInfo,
      );

      expect(result.success).toBe(true);
      expect(result.activeDevices).toBe(1);
    });

    it("최대 디바이스 수 초과 시 실패해야 함", async () => {
      // 최대 3개까지 활성화
      for (let i = 1; i <= 3; i++) {
        const deviceInfo = {
          deviceId: `device-${i}`,
          deviceName: `Test Device ${i}`,
          platform: "windows",
          osVersion: "10.0",
          hwid: `hw-${i}`,
        };
        await licenseService.activateDevice(licenseKey, deviceInfo);
      }

      // 4번째 디바이스는 실패해야 함
      const deviceInfo = {
        deviceId: "device-4",
        deviceName: "Test Device 4",
        platform: "windows",
        osVersion: "10.0",
        hwid: "hw-4",
      };

      const result = await licenseService.activateDevice(
        licenseKey,
        deviceInfo,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("maximum number of devices");
    });
  });
});
