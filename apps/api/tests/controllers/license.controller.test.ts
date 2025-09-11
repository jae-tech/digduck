import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { build } from "@/app";
import { prisma } from "@/plugins/prisma";
import type { FastifyInstance } from "fastify";

describe("License Controller", () => {
  let app: FastifyInstance;
  let testUserEmail: string;

  beforeAll(async () => {
    app = await build();
    await app.ready();
    testUserEmail = "test@license.com";

    // Clean up test data
    await prisma.licenseUser.deleteMany({
      where: { email: testUserEmail },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.licenseUser.deleteMany({
      where: { email: testUserEmail },
    });
    await app.close();
  });

  describe("POST /license/users", () => {
    it("should create a new license user", async () => {
      const licenseData = {
        email: testUserEmail,
        licenseKey: "TEST123456789ABC",
        allowedDevices: 3,
        maxTransfers: 5,
      };

      const response = await app.inject({
        method: "POST",
        url: "/license/users",
        payload: licenseData,
      });

      expect(response.statusCode).toBe(201);
      const result = response.json();
      expect(result.email).toBe(testUserEmail);
      expect(result.licenseKey).toBe(licenseData.licenseKey);
      expect(result.allowedDevices).toBe(3);
    });

    it("should reject duplicate license key", async () => {
      const duplicateData = {
        email: "another@test.com",
        licenseKey: "TEST123456789ABC", // same as above
        allowedDevices: 3,
      };

      const response = await app.inject({
        method: "POST",
        url: "/license/users",
        payload: duplicateData,
      });

      expect(response.statusCode).toBe(409);
    });

    it("should validate required fields", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/license/users",
        payload: {
          email: testUserEmail,
          // missing licenseKey
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /license/users/:email", () => {
    it("should get license user by email", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/license/users/${encodeURIComponent(testUserEmail)}`,
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.email).toBe(testUserEmail);
      expect(result).toHaveProperty("licenseKey");
      expect(result).toHaveProperty("allowedDevices");
    });

    it("should return 404 for non-existent user", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/license/users/nonexistent@test.com",
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("POST /license/validate", () => {
    it("should validate existing license key", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/license/validate",
        payload: {
          licenseKey: "TEST123456789ABC",
          deviceId: "test-device-001",
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.valid).toBe(true);
      expect(result.userEmail).toBe(testUserEmail);
    });

    it("should reject invalid license key", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/license/validate",
        payload: {
          licenseKey: "INVALID123456789",
          deviceId: "test-device-001",
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.valid).toBe(false);
    });

    it("should validate required fields", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/license/validate",
        payload: {
          licenseKey: "TEST123456789ABC",
          // missing deviceId
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("PUT /license/users/:email", () => {
    it("should update license user", async () => {
      const updateData = {
        allowedDevices: 5,
        maxTransfers: 10,
      };

      const response = await app.inject({
        method: "PUT",
        url: `/license/users/${encodeURIComponent(testUserEmail)}`,
        payload: updateData,
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.allowedDevices).toBe(5);
      expect(result.maxTransfers).toBe(10);
    });

    it("should return 404 for non-existent user", async () => {
      const response = await app.inject({
        method: "PUT",
        url: "/license/users/nonexistent@test.com",
        payload: { allowedDevices: 5 },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("POST /license/subscriptions", () => {
    it("should create license subscription", async () => {
      const subscriptionData = {
        userEmail: testUserEmail,
        subscriptionType: "ONE_MONTH",
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await app.inject({
        method: "POST",
        url: "/license/subscriptions",
        payload: subscriptionData,
      });

      expect(response.statusCode).toBe(201);
      const result = response.json();
      expect(result.userEmail).toBe(testUserEmail);
      expect(result.subscriptionType).toBe("ONE_MONTH");
      expect(result.isActive).toBe(true);
    });
  });
});
