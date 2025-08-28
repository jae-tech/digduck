import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { build } from '@/app';
import { prisma } from '@/plugins/prisma';
import type { FastifyInstance } from 'fastify';

describe('Crawl History Controller', () => {
  let app: FastifyInstance;
  let testUserEmail: string;
  let testCrawlId: number;

  beforeAll(async () => {
    app = await build();
    await app.ready();
    testUserEmail = 'test@crawl.com';
    
    // Clean up test data
    await prisma.crawlHistory.deleteMany({
      where: { userEmail: testUserEmail }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.crawlHistory.deleteMany({
      where: { userEmail: testUserEmail }
    });
    await app.close();
  });

  describe('POST /crawl-history/start', () => {
    it('should start a new crawl job', async () => {
      const crawlData = {
        userEmail: testUserEmail,
        deviceId: 'test-device-001',
        sourceSite: 'SMARTSTORE',
        searchUrl: 'https://smartstore.naver.com/test/products/123',
        searchKeywords: 'test product',
        crawlSettings: {
          maxPages: 5,
          maxItems: 100,
          requestDelay: 1000
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/crawl-history/start',
        payload: crawlData
      });

      expect(response.statusCode).toBe(201);
      const result = response.json();
      expect(result.crawlHistory).toBeDefined();
      expect(result.jobId).toBeDefined();
      expect(result.crawlHistory.userEmail).toBe(testUserEmail);
      expect(result.crawlHistory.sourceSite).toBe('SMARTSTORE');
      expect(result.crawlHistory.status).toBe('PENDING');
      
      testCrawlId = result.jobId;
    });

    it('should validate required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/crawl-history/start',
        payload: {
          userEmail: testUserEmail,
          // missing required fields
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject invalid source site', async () => {
      const crawlData = {
        userEmail: testUserEmail,
        deviceId: 'test-device-001',
        sourceSite: 'INVALID_SITE',
        searchUrl: 'https://example.com/test'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/crawl-history/start',
        payload: crawlData
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /crawl-history/:id', () => {
    it('should get crawl history by id', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/crawl-history/${testCrawlId}?userEmail=${encodeURIComponent(testUserEmail)}`
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.id).toBe(testCrawlId);
      expect(result.userEmail).toBe(testUserEmail);
      expect(result.sourceSite).toBe('SMARTSTORE');
    });

    it('should return 404 for non-existent crawl', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/crawl-history/99999?userEmail=' + encodeURIComponent(testUserEmail)
      });

      expect(response.statusCode).toBe(404);
    });

    it('should prevent access to other user\'s crawl history', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/crawl-history/${testCrawlId}?userEmail=other@user.com`
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /crawl-history', () => {
    it('should list user crawl history', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/crawl-history?userEmail=${encodeURIComponent(testUserEmail)}&limit=10&offset=0`
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.crawlHistory).toBeInstanceOf(Array);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/crawl-history?userEmail=${encodeURIComponent(testUserEmail)}&status=PENDING`
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      result.crawlHistory.forEach((crawl: any) => {
        expect(crawl.status).toBe('PENDING');
      });
    });

    it('should filter by source site', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/crawl-history?userEmail=${encodeURIComponent(testUserEmail)}&sourceSite=SMARTSTORE`
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      result.crawlHistory.forEach((crawl: any) => {
        expect(crawl.sourceSite).toBe('SMARTSTORE');
      });
    });
  });

  describe('PUT /crawl-history/:id/stop', () => {
    it('should stop crawl job', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/crawl-history/${testCrawlId}/stop`,
        payload: {
          userEmail: testUserEmail
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.success).toBe(true);
    });

    it('should return 404 for non-existent crawl', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/crawl-history/99999/stop',
        payload: {
          userEmail: testUserEmail
        }
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /crawl-history/:id/status', () => {
    it('should get crawl job status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/crawl-history/${testCrawlId}/status?userEmail=${encodeURIComponent(testUserEmail)}`
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.crawlHistory).toBeDefined();
      expect(result.isActive).toBeDefined();
      expect(typeof result.isActive).toBe('boolean');
    });
  });

  describe('POST /crawl-history/:id/items', () => {
    it('should add crawl items', async () => {
      const crawlItems = [{
        crawlHistoryId: testCrawlId,
        itemId: 'test-item-001',
        title: 'Test Product',
        content: 'Test product description',
        url: 'https://smartstore.naver.com/test/products/123',
        rating: 4.5,
        price: 29990,
        itemOrder: 1,
        pageNumber: 1
      }];

      const response = await app.inject({
        method: 'POST',
        url: `/crawl-history/${testCrawlId}/items`,
        payload: { items: crawlItems }
      });

      expect(response.statusCode).toBe(201);
      const result = response.json();
      expect(result.success).toBe(true);
      expect(result.itemsAdded).toBe(1);
    });

    it('should validate item data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/crawl-history/${testCrawlId}/items`,
        payload: {
          items: [{
            crawlHistoryId: testCrawlId,
            // missing required fields
          }]
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('DELETE /crawl-history/:id', () => {
    it('should delete crawl history', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/crawl-history/${testCrawlId}`,
        payload: {
          userEmail: testUserEmail
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.success).toBe(true);
    });

    it('should return 404 for already deleted crawl', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/crawl-history/${testCrawlId}`,
        payload: {
          userEmail: testUserEmail
        }
      });

      expect(response.statusCode).toBe(404);
    });
  });
});