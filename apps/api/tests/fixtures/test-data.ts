// Test data fixtures for API tests

export const mockUsers = {
  validUser: {
    email: 'test@example.com',
    password: 'securePassword123',
    name: 'Test User'
  },
  adminUser: {
    email: 'admin@example.com',
    password: 'adminPassword123',
    name: 'Admin User'
  },
  invalidUser: {
    email: 'invalid-email',
    password: '123',
    name: ''
  }
};

export const mockLicenseUsers = {
  basicUser: {
    email: 'basic@example.com',
    licenseKey: 'BASIC1234567890AB',
    allowedDevices: 3,
    maxTransfers: 5,
    activatedDevices: []
  },
  premiumUser: {
    email: 'premium@example.com',
    licenseKey: 'PREMIUM123456789',
    allowedDevices: 10,
    maxTransfers: 20,
    activatedDevices: [
      { deviceId: 'device-001', platform: 'WEB', activatedAt: new Date() }
    ]
  },
  expiredUser: {
    email: 'expired@example.com',
    licenseKey: 'EXPIRED123456789',
    allowedDevices: 3,
    maxTransfers: 5,
    activatedDevices: []
  }
};

export const mockLicenseSubscriptions = {
  activeSubscription: {
    subscriptionType: 'THREE_MONTHS',
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
    isActive: true,
    paymentId: 'payment-123'
  },
  expiredSubscription: {
    subscriptionType: 'ONE_MONTH',
    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
    endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
    isActive: false,
    paymentId: 'payment-456'
  }
};

export const mockCrawlHistories = {
  pendingCrawl: {
    userEmail: 'test@example.com',
    deviceId: 'device-001',
    sourceSite: 'SMARTSTORE',
    searchUrl: 'https://smartstore.naver.com/test/products/123',
    searchKeywords: 'test product',
    status: 'PENDING',
    itemsFound: 0,
    itemsCrawled: 0,
    pagesProcessed: 0,
    crawlSettings: {
      maxPages: 10,
      maxItems: 1000,
      requestDelay: 2000
    }
  },
  completedCrawl: {
    userEmail: 'test@example.com',
    deviceId: 'device-001',
    sourceSite: 'SMARTSTORE',
    searchUrl: 'https://smartstore.naver.com/test/products/456',
    searchKeywords: 'completed test',
    status: 'SUCCESS',
    itemsFound: 150,
    itemsCrawled: 150,
    pagesProcessed: 5,
    startedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    completedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    durationMs: 30 * 60 * 1000, // 30 minutes
    crawlSettings: {
      maxPages: 10,
      maxItems: 1000,
      requestDelay: 2000
    }
  },
  failedCrawl: {
    userEmail: 'test@example.com',
    deviceId: 'device-001',
    sourceSite: 'SMARTSTORE',
    searchUrl: 'https://smartstore.naver.com/invalid/url',
    searchKeywords: 'failed test',
    status: 'FAILED',
    itemsFound: 0,
    itemsCrawled: 0,
    pagesProcessed: 0,
    startedAt: new Date(Date.now() - 120 * 60 * 1000), // 2 hours ago
    completedAt: new Date(Date.now() - 110 * 60 * 1000), // 1 hour 50 minutes ago
    durationMs: 10 * 60 * 1000, // 10 minutes
    errorMessage: 'Failed to access the specified URL',
    errorDetails: {
      statusCode: 404,
      message: 'Page not found'
    }
  }
};

export const mockCrawlItems = {
  smartstoreReview: {
    itemId: 'review-123456',
    title: 'Great product!',
    content: 'This product exceeded my expectations. Highly recommended!',
    url: 'https://smartstore.naver.com/test/products/123/reviews/456',
    rating: 5.0,
    reviewDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    reviewerName: 'happy_customer',
    isVerified: true,
    itemOrder: 1,
    pageNumber: 1,
    siteSpecificData: {
      helpfulCount: 15,
      reviewImages: ['image1.jpg', 'image2.jpg']
    }
  },
  smartstoreProduct: {
    itemId: 'product-789012',
    title: 'Premium Test Product',
    content: 'High-quality test product with excellent features',
    url: 'https://smartstore.naver.com/test/products/789',
    price: 29900,
    originalPrice: 39900,
    discount: 25,
    stock: 100,
    imageUrls: ['product1.jpg', 'product2.jpg', 'product3.jpg'],
    itemOrder: 1,
    pageNumber: 1,
    siteSpecificData: {
      category: 'Electronics',
      brand: 'TestBrand',
      specifications: {
        weight: '1.2kg',
        dimensions: '20x15x5cm'
      }
    }
  }
};

export const mockJWTPayloads = {
  validUser: {
    userId: 'user-123',
    email: 'test@example.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 // expires in 1 hour
  },
  expiredUser: {
    userId: 'user-456',
    email: 'expired@example.com',
    iat: Math.floor(Date.now() / 1000) - 7200, // issued 2 hours ago
    exp: Math.floor(Date.now() / 1000) - 3600  // expired 1 hour ago
  },
  adminUser: {
    userId: 'admin-789',
    email: 'admin@example.com',
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  }
};

export const mockApiResponses = {
  success: {
    success: true,
    message: 'Operation completed successfully',
    timestamp: new Date().toISOString()
  },
  error: {
    success: false,
    error: 'Bad Request',
    message: 'The request contains invalid data',
    statusCode: 400,
    timestamp: new Date().toISOString()
  },
  unauthorized: {
    success: false,
    error: 'Unauthorized',
    message: 'Authentication required',
    statusCode: 401,
    timestamp: new Date().toISOString()
  },
  notFound: {
    success: false,
    error: 'Not Found',
    message: 'The requested resource was not found',
    statusCode: 404,
    timestamp: new Date().toISOString()
  }
};

export const mockValidationErrors = {
  missingEmail: {
    email: undefined,
    password: 'validPassword123'
  },
  invalidEmail: {
    email: 'not-an-email',
    password: 'validPassword123'
  },
  shortPassword: {
    email: 'test@example.com',
    password: '123'
  },
  emptyPayload: {},
  invalidCrawlSettings: {
    maxPages: -1,
    maxItems: 'not-a-number',
    requestDelay: 'invalid'
  }
};

// Helper functions for creating test data
export const createTestUser = (overrides = {}) => ({
  ...mockUsers.validUser,
  ...overrides
});

export const createTestLicenseUser = (overrides = {}) => ({
  ...mockLicenseUsers.basicUser,
  ...overrides
});

export const createTestCrawlHistory = (overrides = {}) => ({
  ...mockCrawlHistories.pendingCrawl,
  ...overrides
});

export const createTestCrawlItem = (overrides = {}) => ({
  ...mockCrawlItems.smartstoreReview,
  ...overrides
});

// Database cleanup helpers
export const cleanupTestData = {
  async users(emails: string[]) {
    const { prisma } = await import('@/plugins/prisma');
    await prisma.user.deleteMany({
      where: { email: { in: emails } }
    });
  },
  
  async licenseUsers(emails: string[]) {
    const { prisma } = await import('@/plugins/prisma');
    await prisma.licenseUser.deleteMany({
      where: { email: { in: emails } }
    });
  },
  
  async crawlHistories(userEmails: string[]) {
    const { prisma } = await import('@/plugins/prisma');
    await prisma.crawlHistory.deleteMany({
      where: { userEmail: { in: userEmails } }
    });
  }
};