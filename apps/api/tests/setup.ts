import { PrismaClient } from '@prisma/client'
import { beforeAll, afterAll, beforeEach, vi } from 'vitest'

// Mock PrismaClient for testing
export const testPrisma = {
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
  $transaction: vi.fn()
} as any

beforeAll(async () => {
  // Setup test environment
})

afterAll(async () => {
  // Clean up test environment
})

beforeEach(async () => {
  // Reset all mocks before each test
  vi.clearAllMocks()
})