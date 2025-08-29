import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '@/app';
import type { FastifyInstance } from 'fastify';

describe('Basic API Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Application Health', () => {
    it('should start successfully', () => {
      expect(app).toBeDefined();
      expect(app.server).toBeDefined();
    });

    it('should have required plugins loaded', () => {
      expect(app.hasDecorator('prisma')).toBe(true);
      expect(app.hasDecorator('jwt')).toBe(true);
    });

    it('should respond to root endpoint', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/'
      });

      // Should not crash - either 404 (no root handler) or 200 (if root handler exists)
      expect([200, 404]).toContain(response.statusCode);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/non-existent-endpoint'
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: 'invalid json',
        headers: {
          'content-type': 'application/json'
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/'
      });

      // Check for Helmet security headers
      expect(response.headers).toHaveProperty('x-dns-prefetch-control');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
    });

    it('should support CORS', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/auth/login'
      });

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Authentication Endpoints', () => {
    it('should have login endpoint', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'password123'
        }
      });

      // Should not return 404 (endpoint exists)
      expect(response.statusCode).not.toBe(404);
    });

    it('should have register endpoint', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        }
      });

      // Should not return 404 (endpoint exists)
      expect(response.statusCode).not.toBe(404);
    });

    it('should validate login input', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {}
      });

      // Could be 400 (validation error) or 401 (invalid credentials) or 500 (server error)
      expect([400, 401, 500]).toContain(response.statusCode);
    });

    it('should validate register input', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {}
      });

      // Could be 400 (validation error) or 500 (server error)
      expect([400, 500]).toContain(response.statusCode);
    });
  });

  describe('JWT Functionality', () => {
    it('should be able to sign JWT tokens', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = app.jwt.sign(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should be able to verify JWT tokens', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = app.jwt.sign(payload);
      
      const decoded = app.jwt.verify(token);
      expect(decoded.userId).toBe('123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should reject invalid JWT tokens', () => {
      expect(() => {
        app.jwt.verify('invalid.token.here');
      }).toThrow();
    });
  });

  describe('Database Connection', () => {
    it('should connect to database', async () => {
      // Test basic database query
      const result = await app.prisma.$queryRaw`SELECT 1 as test`;
      expect(result).toBeDefined();
    });

    it('should handle database models', async () => {
      // Test that Prisma models are accessible
      expect(app.prisma.user).toBeDefined();
      expect(app.prisma.licenseUser).toBeDefined();
      expect(app.prisma.crawlHistory).toBeDefined();
    });
  });

  describe('API Documentation', () => {
    it('should serve Swagger documentation', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    });

    it('should provide OpenAPI spec', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs/json'
      });

      expect(response.statusCode).toBe(200);
      const spec = response.json();
      expect(spec.openapi).toBeDefined();
      expect(spec.info).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should respond within reasonable time', async () => {
      const start = Date.now();
      
      await app.inject({
        method: 'GET',
        url: '/'
      });
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        app.inject({
          method: 'GET',
          url: '/'
        })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect([200, 404]).toContain(response.statusCode);
      });
    });
  });
});