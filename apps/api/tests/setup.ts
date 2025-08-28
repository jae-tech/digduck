import { PrismaClient } from '@prisma/client'
import { beforeAll, afterAll, beforeEach, vi } from 'vitest'

// Set up test environment variables
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  process.env.PORT = '3001';
  process.env.LOG_LEVEL = 'silent';
  process.env.LICENSE_SALT = 'test-license-salt-key-for-testing';
});

// Mock PrismaClient for testing
export const testPrisma = {
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn()
  },
  licenseUser: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn()
  },
  licenseSubscription: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn()
  },
  licenseItem: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn()
  },
  deviceTransfer: {
    create: vi.fn(),
    findMany: vi.fn(),
    deleteMany: vi.fn()
  },
  crawlHistory: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn()
  },
  crawlItem: {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
    deleteMany: vi.fn()
  },
  crawlTemplate: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn()
  },
  $transaction: vi.fn(),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $queryRaw: vi.fn().mockResolvedValue([{ test: 1 }])
} as any

beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
})

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
})

beforeEach(async () => {
  // Reset all mocks before each test
  vi.clearAllMocks()
})