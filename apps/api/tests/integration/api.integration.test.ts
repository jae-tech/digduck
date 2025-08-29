import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '@/app';
import { prisma } from '@/plugins/prisma';
import type { FastifyInstance } from 'fastify';

describe('API Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Application Startup', () => {
    it('should start the application successfully', () => {
      expect(app).toBeDefined();
      expect(app.server).toBeDefined();
    });

    it('should have all required plugins loaded', () => {
      expect(app.hasDecorator('prisma')).toBe(true);
      expect(app.hasDecorator('jwt')).toBe(true);
    });

    it('should connect to database', async () => {
      // Test database connection
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      expect(result).toBeDefined();
    });
  });

  describe('Health Endpoints', () => {
    it('should respond to health check', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
    });

    it('should provide detailed health information', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      const result = response.json();
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('database');
      expect(typeof result.uptime).toBe('number');
    });
  });

  describe('API Documentation', () => {
    it('should serve Swagger documentation', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/documentation'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    });

    it('should provide OpenAPI JSON spec', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/documentation/json'
      });

      expect(response.statusCode).toBe(200);
      const spec = response.json();
      expect(spec.openapi).toBeDefined();
      expect(spec.info).toBeDefined();
      expect(spec.paths).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 routes gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/non-existent-endpoint'
      });

      expect(response.statusCode).toBe(404);
      const result = response.json();
      expect(result.error).toBeDefined();
    });

    it('should handle malformed JSON requests', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: 'invalid json string',
        headers: {
          'content-type': 'application/json'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return proper error format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/non-existent'
      });

      const result = response.json();
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('statusCode');
    });
  });

  describe('Security Features', () => {
    it('should include security headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      // Helmet security headers
      expect(response.headers).toHaveProperty('x-dns-prefetch-control');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
    });

    it('should enforce CORS policies', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/auth/login',
        headers: {
          origin: 'https://example.com'
        }
      });

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should validate content types', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'test@example.com', password: 'password' },
        headers: {
          'content-type': 'text/plain'
        }
      });

      expect(response.statusCode).toBe(415);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limits to sensitive endpoints', async () => {
      const requests = [];

      // Make rapid requests to trigger rate limiting
      for (let i = 0; i < 20; i++) {
        requests.push(
          app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: { email: 'test@example.com', password: 'password' }
          })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.statusCode === 429);
      
      expect(rateLimited).toBe(true);
    });
  });

  describe('Database Integration', () => {
    it('should handle database operations', async () => {
      // Test that database queries work
      const count = await prisma.user.count();
      expect(typeof count).toBe('number');
    });

    it('should handle database transactions', async () => {
      // Test transaction capability
      await expect(
        prisma.$transaction([
          prisma.user.count(),
          prisma.crawlHistory.count()
        ])
      ).resolves.not.toThrow();
    });

    it('should handle database errors gracefully', async () => {
      // This should not crash the application
      await expect(
        prisma.$queryRaw`SELECT * FROM non_existent_table`
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      const start = Date.now();
      
      await app.inject({
        method: 'GET',
        url: '/health'
      });
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle concurrent requests', async () => {
      const concurrentRequests = Array.from({ length: 10 }, () =>
        app.inject({
          method: 'GET',
          url: '/health'
        })
      );

      const responses = await Promise.all(concurrentRequests);
      
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });
    });
  });

  describe('Content Type Handling', () => {
    it('should accept JSON content type', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'test@example.com', password: 'password' },
        headers: {
          'content-type': 'application/json'
        }
      });

      // Should not return 415 (Unsupported Media Type)
      expect(response.statusCode).not.toBe(415);
    });

    it('should return JSON responses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.headers['content-type']).toContain('application/json');
      expect(() => JSON.parse(response.body)).not.toThrow();
    });
  });
});