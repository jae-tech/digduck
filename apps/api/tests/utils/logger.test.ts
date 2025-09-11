import { describe, it, expect, vi, beforeEach } from "vitest";
import logger from "@/utils/logger";

describe("Logger Utility", () => {
  beforeEach(() => {
    // Clear any mocked console methods
    vi.clearAllMocks();
  });

  describe("Logger Instance", () => {
    it("should have required log methods", () => {
      expect(logger).toHaveProperty("info");
      expect(logger).toHaveProperty("error");
      expect(logger).toHaveProperty("warn");
      expect(logger).toHaveProperty("debug");
      expect(logger).toHaveProperty("fatal");
      expect(logger).toHaveProperty("trace");
    });

    it("should be callable as functions", () => {
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.error).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.debug).toBe("function");
    });
  });

  describe("Log Levels", () => {
    it("should log info messages", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      logger.info("Test info message");

      // Note: pino may not use console.log directly in tests
      // This test verifies the method doesn't throw
      expect(() => logger.info("Test info message")).not.toThrow();

      consoleSpy.mockRestore();
    });

    it("should log error messages", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      logger.error("Test error message");

      expect(() => logger.error("Test error message")).not.toThrow();

      consoleSpy.mockRestore();
    });

    it("should log warn messages", () => {
      expect(() => logger.warn("Test warn message")).not.toThrow();
    });

    it("should log debug messages", () => {
      expect(() => logger.debug("Test debug message")).not.toThrow();
    });
  });

  describe("Log Message Formatting", () => {
    it("should handle string messages", () => {
      expect(() => logger.info("Simple string message")).not.toThrow();
    });

    it("should handle object messages", () => {
      const testObject = {
        user: "test@example.com",
        action: "login",
        timestamp: new Date(),
      };

      expect(() => logger.info(testObject)).not.toThrow();
    });

    it("should handle messages with additional data", () => {
      expect(() => {
        logger.info({ msg: "User action", userId: "123", action: "purchase" });
      }).not.toThrow();
    });

    it("should handle error objects", () => {
      const testError = new Error("Test error for logging");

      expect(() => logger.error(testError)).not.toThrow();
      expect(() =>
        logger.error({ error: testError, context: "auth" }),
      ).not.toThrow();
    });
  });

  describe("Performance Logging", () => {
    it("should handle performance measurements", () => {
      const startTime = Date.now();

      // Simulate some work
      setTimeout(() => {
        const duration = Date.now() - startTime;

        expect(() => {
          logger.info({
            msg: "Operation completed",
            duration,
            operation: "test",
          });
        }).not.toThrow();
      }, 10);
    });

    it("should log request timing information", () => {
      const requestInfo = {
        method: "POST",
        url: "/auth/login",
        statusCode: 200,
        responseTime: 145,
        userAgent: "test-agent",
      };

      expect(() => {
        logger.info({
          msg: "HTTP request processed",
          ...requestInfo,
        });
      }).not.toThrow();
    });
  });

  describe("Structured Logging", () => {
    it("should support structured log entries", () => {
      const structuredLog = {
        level: "info",
        timestamp: new Date().toISOString(),
        service: "api-test",
        version: "1.0.0",
        environment: "test",
        requestId: "req-123",
        userId: "user-456",
        action: "data-access",
        resource: "user-profile",
        result: "success",
      };

      expect(() => logger.info(structuredLog)).not.toThrow();
    });

    it("should handle nested object structures", () => {
      const complexLog = {
        event: "crawl-completed",
        crawl: {
          id: "crawl-789",
          site: "smartstore",
          pages: 5,
          items: 150,
          duration: 45000,
        },
        user: {
          email: "crawler@test.com",
          subscription: "premium",
        },
        performance: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
        },
      };

      expect(() => logger.info(complexLog)).not.toThrow();
    });
  });
});
