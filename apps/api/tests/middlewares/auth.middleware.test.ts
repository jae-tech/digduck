import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '@/app';
import type { FastifyInstance } from 'fastify';

describe('Auth Middleware', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('JWT Token Validation', () => {
    it('should reject requests without Authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/profile'
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().message).toContain('Authorization header is required');
    });

    it('should reject malformed Authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/profile',
        headers: {
          authorization: 'InvalidFormat'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject invalid Bearer token format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/profile',
        headers: {
          authorization: 'Bearer'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject expired or invalid JWT tokens', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/profile',
        headers: {
          authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
        }
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().message).toContain('Invalid token');
    });

    it('should create a valid JWT token and accept it', async () => {
      // Create a valid token using the app's JWT instance
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com'
      };
      
      const token = app.jwt.sign(payload, { expiresIn: '1h' });

      const response = await app.inject({
        method: 'GET',
        url: '/auth/profile',
        headers: {
          authorization: `Bearer ${token}`
        }
      });

      // Since UserService is not implemented, we expect 500 instead of 200
      // but the auth middleware should pass through (not 401)
      expect(response.statusCode).toBe(500);
      expect(response.json().message).toContain('UserService not implemented');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on auth endpoints', async () => {
      const requests = [];
      
      // Make multiple requests quickly
      for (let i = 0; i < 15; i++) {
        requests.push(
          app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: {
              email: 'test@example.com',
              password: 'password'
            }
          })
        );
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.statusCode === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in responses', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/auth/login'
      });

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });

    it('should handle preflight requests', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/auth/login',
        headers: {
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'Content-Type'
        }
      });

      expect(response.statusCode).toBe(204);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/profile'
      });

      // Check for common security headers set by helmet
      expect(response.headers).toHaveProperty('x-dns-prefetch-control');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-download-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });
});