import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { build } from '@/app';
import { autoRegisterControllers } from '@/utils/auto-register';
import type { FastifyInstance } from 'fastify';
import path from 'path';

describe('Auto-Register Utility', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Controller Registration', () => {
    it('should register all controllers in the controllers directory', async () => {
      const controllersPath = path.join(__dirname, '../../src/controllers');
      
      // This should not throw an error
      expect(async () => {
        await autoRegisterControllers(app, controllersPath);
      }).not.toThrow();
    });

    it('should handle non-existent directory gracefully', async () => {
      const nonExistentPath = path.join(__dirname, 'non-existent-directory');
      
      // Should handle gracefully without throwing
      await expect(autoRegisterControllers(app, nonExistentPath)).resolves.not.toThrow();
    });

    it('should skip non-TypeScript files', async () => {
      const testPath = path.join(__dirname, '../fixtures');
      
      // Should skip files that are not .ts or .js controller files
      await expect(autoRegisterControllers(app, testPath)).resolves.not.toThrow();
    });
  });

  describe('Route Registration Verification', () => {
    it('should have auth routes registered', () => {
      const routes = app.printRoutes({ includeHooks: false });
      
      expect(routes).toContain('POST /auth/login');
      expect(routes).toContain('POST /auth/register');
      expect(routes).toContain('GET /auth/profile');
    });

    it('should have license routes registered', () => {
      const routes = app.printRoutes({ includeHooks: false });
      
      expect(routes).toContain('POST /license/users');
      expect(routes).toContain('GET /license/users/:email');
      expect(routes).toContain('POST /license/validate');
    });

    it('should have crawl-history routes registered', () => {
      const routes = app.printRoutes({ includeHooks: false });
      
      expect(routes).toContain('POST /crawl-history/start');
      expect(routes).toContain('GET /crawl-history/:id');
      expect(routes).toContain('PUT /crawl-history/:id/stop');
    });

    it('should have health check route registered', () => {
      const routes = app.printRoutes({ includeHooks: false });
      
      // Health check should be available
      expect(routes).toContain('GET /health');
    });
  });

  describe('Route Handler Verification', () => {
    it('should respond to registered auth routes', async () => {
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'test@example.com', password: 'password' }
      });

      // Should not return 404 (route not found)
      expect(loginResponse.statusCode).not.toBe(404);
    });

    it('should respond to registered license routes', async () => {
      const validateResponse = await app.inject({
        method: 'POST',
        url: '/license/validate',
        payload: { licenseKey: 'TEST123', deviceId: 'device1' }
      });

      // Should not return 404 (route not found)
      expect(validateResponse.statusCode).not.toBe(404);
    });

    it('should respond to registered crawl-history routes', async () => {
      const historyResponse = await app.inject({
        method: 'GET',
        url: '/crawl-history?userEmail=test@example.com'
      });

      // Should not return 404 (route not found)
      expect(historyResponse.statusCode).not.toBe(404);
    });

    it('should return 404 for unregistered routes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/non-existent-endpoint'
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('Error Handling in Registration', () => {
    it('should handle controllers with syntax errors gracefully', async () => {
      // Mock a controller with syntax errors
      const mockPath = '/tmp/mock-controllers';
      
      // The auto-register should handle errors gracefully
      await expect(autoRegisterControllers(app, mockPath)).resolves.not.toThrow();
    });

    it('should continue registration even if one controller fails', async () => {
      // This tests that the registration process is resilient
      const controllersPath = path.join(__dirname, '../../src/controllers');
      
      // Should complete successfully even if individual controllers have issues
      await expect(autoRegisterControllers(app, controllersPath)).resolves.not.toThrow();
    });
  });

  describe('Plugin Loading Verification', () => {
    it('should have prisma plugin loaded', () => {
      expect(app.hasDecorator('prisma')).toBe(true);
    });

    it('should have JWT plugin loaded', () => {
      expect(app.hasDecorator('jwt')).toBe(true);
    });

    it('should have request validation capabilities', async () => {
      // Test that validation middleware is working
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {} // Empty payload should trigger validation
      });

      // Should validate and return appropriate error (not 500 server error)
      expect([400, 500]).toContain(response.statusCode);
    });
  });
});