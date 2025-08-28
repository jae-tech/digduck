import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { LicenseService } from '../services/license.service'
import { prisma } from '../plugins/prisma'
import { 
  CreateLicenseUserRequest, 
  CreateSubscriptionRequest, 
  ExtendSubscriptionRequest,
  ActivateDeviceRequest,
  TransferDeviceRequest,
  PurchaseItemRequest,
  LicenseError 
} from '../types/license.types'

export class LicenseController {
  private licenseService: LicenseService

  constructor() {
    this.licenseService = new LicenseService(prisma)
  }

  /**
   * Fastify 플러그인으로 라우트 등록
   */
  async routes(fastify: FastifyInstance) {
    // Public routes
    fastify.post('/validate', {
      schema: {
        tags: ['License'],
        description: 'Validate license key',
        body: {
          type: 'object',
          required: ['licenseKey'],
          properties: {
            licenseKey: { type: 'string' },
            deviceId: { type: 'string' }
          }
        }
      }
    }, this.validateLicense)

    fastify.get('/verify/:licenseKey', {
      schema: {
        tags: ['License'],
        description: 'Verify license by key',
        params: {
          type: 'object',
          properties: {
            licenseKey: { type: 'string' }
          }
        }
      }
    }, this.verifyLicense)

    // User management
    fastify.post('/users', {
      schema: {
        tags: ['License'],
        description: 'Create license user',
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
            allowedDevices: { type: 'integer', minimum: 1, maximum: 10 },
            maxTransfers: { type: 'integer', minimum: 0, maximum: 20 }
          }
        }
      }
    }, this.createUser)

    fastify.get('/status/:email', {
      schema: {
        tags: ['License'],
        description: 'Get license status by email',
        params: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' }
          }
        }
      }
    }, this.getLicenseStatus)

    // Subscription management
    fastify.post('/subscriptions', {
      schema: {
        tags: ['License'],
        description: 'Create subscription',
        body: {
          type: 'object',
          required: ['userEmail', 'subscriptionType'],
          properties: {
            userEmail: { type: 'string', format: 'email' },
            subscriptionType: { 
              type: 'string',
              enum: ['ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'TWELVE_MONTHS']
            },
            paymentId: { type: 'string' }
          }
        }
      }
    }, this.createSubscription)

    fastify.post('/subscriptions/extend', {
      schema: {
        tags: ['License'],
        description: 'Extend subscription',
        body: {
          type: 'object',
          required: ['userEmail', 'months'],
          properties: {
            userEmail: { type: 'string', format: 'email' },
            months: { type: 'integer', minimum: 1, maximum: 12 },
            subscriptionType: { 
              type: 'string',
              enum: ['ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'TWELVE_MONTHS']
            },
            paymentId: { type: 'string' }
          }
        }
      }
    }, this.extendSubscription)

    // Device management
    fastify.post('/devices/activate', {
      schema: {
        tags: ['License'],
        description: 'Activate device',
        body: {
          type: 'object',
          required: ['userEmail', 'deviceId', 'platform'],
          properties: {
            userEmail: { type: 'string', format: 'email' },
            deviceId: { type: 'string' },
            platform: { type: 'string', enum: ['WEB', 'DESKTOP'] }
          }
        }
      }
    }, this.activateDevice)

    fastify.post('/devices/transfer', {
      schema: {
        tags: ['License'],
        description: 'Transfer device',
        body: {
          type: 'object',
          required: ['userEmail', 'oldDeviceId', 'newDeviceId', 'platform'],
          properties: {
            userEmail: { type: 'string', format: 'email' },
            oldDeviceId: { type: 'string' },
            newDeviceId: { type: 'string' },
            platform: { type: 'string', enum: ['WEB', 'DESKTOP'] }
          }
        }
      }
    }, this.transferDevice)

    // Item purchase
    fastify.post('/items/purchase', {
      schema: {
        tags: ['License'],
        description: 'Purchase item',
        body: {
          type: 'object',
          required: ['userEmail', 'itemType', 'quantity'],
          properties: {
            userEmail: { type: 'string', format: 'email' },
            itemType: { 
              type: 'string',
              enum: ['SMARTSTORE_CRAWLER', 'SUBSCRIPTION_EXTENSION', 'EXTRA_DEVICE']
            },
            quantity: { type: 'integer', minimum: 1, maximum: 100 }
          }
        }
      }
    }, this.purchaseItem)

    // Admin routes
    fastify.post('/admin/update-expired', {
      schema: {
        tags: ['License Admin'],
        description: 'Update expired subscriptions'
      }
    }, this.updateExpiredSubscriptions)

    fastify.get('/admin/users', {
      schema: {
        tags: ['License Admin'],
        description: 'Get all license users',
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            search: { type: 'string' }
          }
        }
      }
    }, this.getAllLicenseUsers)
  }

  /**
   * 라이센스 사용자 생성
   * POST /api/license/users
   */
  createUser = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request.body as CreateLicenseUserRequest
      const licenseUser = await this.licenseService.createLicenseUser(data)
      
      reply.code(201).send({
        success: true,
        data: licenseUser
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 구독 생성
   * POST /api/license/subscriptions
   */
  createSubscription = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request.body as CreateSubscriptionRequest
      const subscription = await this.licenseService.createSubscription(data)
      
      reply.code(201).send({
        success: true,
        data: subscription
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 구독 연장
   * POST /api/license/subscriptions/extend
   */
  extendSubscription = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request.body as ExtendSubscriptionRequest
      const subscription = await this.licenseService.extendSubscription(data)
      
      reply.code(200).send({
        success: true,
        data: subscription
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 디바이스 활성화
   * POST /api/license/devices/activate
   */
  activateDevice = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request.body as ActivateDeviceRequest
      const licenseUser = await this.licenseService.activateDevice(data)
      
      reply.code(200).send({
        success: true,
        data: {
          userEmail: licenseUser.email,
          activatedDevices: licenseUser.activatedDevices,
          allowedDevices: licenseUser.allowedDevices
        }
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 디바이스 이전
   * POST /api/license/devices/transfer
   */
  transferDevice = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request.body as TransferDeviceRequest
      const licenseUser = await this.licenseService.transferDevice(data)
      
      reply.code(200).send({
        success: true,
        data: {
          userEmail: licenseUser.email,
          activatedDevices: licenseUser.activatedDevices,
          maxTransfers: licenseUser.maxTransfers
        }
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 라이센스 키로 검증
   * GET /api/license/verify/:licenseKey
   */
  verifyLicense = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { licenseKey } = request.params as { licenseKey: string }
      const verification = await this.licenseService.verifyLicenseByKey(licenseKey)
      
      reply.code(200).send({
        success: true,
        data: verification
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 사용자 라이센스 상태 조회
   * GET /api/license/status/:email
   */
  getLicenseStatus = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email } = request.params as { email: string }
      const status = await this.licenseService.getLicenseStatus(email)
      
      reply.code(200).send({
        success: true,
        data: status
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 아이템 구매
   * POST /api/license/items/purchase
   */
  purchaseItem = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request.body as PurchaseItemRequest
      const item = await this.licenseService.purchaseItem(data)
      
      reply.code(201).send({
        success: true,
        data: item
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 만료된 구독 확인 및 업데이트 (관리자용)
   * POST /api/license/admin/update-expired
   */
  updateExpiredSubscriptions = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await this.licenseService.checkAndUpdateExpiredSubscriptions()
      
      reply.code(200).send({
        success: true,
        data: {
          updatedCount: result.count,
          message: `${result.count} expired subscriptions updated`
        }
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 라이센스 키 검증 (간단한 버전 - 클라이언트용)
   * POST /api/license/validate
   */
  validateLicense = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { licenseKey, deviceId } = request.body as { licenseKey: string, deviceId?: string }
      
      if (!licenseKey) {
        return reply.code(400).send({
          success: false,
          error: 'License key is required'
        })
      }

      const verification = await this.licenseService.verifyLicenseByKey(licenseKey)
      
      if (!verification.isValid) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid license key'
        })
      }

      if (!verification.isActive) {
        return reply.code(402).send({
          success: false,
          error: 'License expired or inactive'
        })
      }

      // 디바이스 ID가 제공된 경우 디바이스 활성화 확인
      if (deviceId) {
        const isDeviceActivated = verification.activatedDevices.some(
          device => device.device_id === deviceId
        )
        
        return reply.code(200).send({
          success: true,
          data: {
            isValid: true,
            isActive: true,
            isDeviceActivated,
            userEmail: verification.userEmail,
            allowedDevices: verification.allowedDevices,
            activatedDeviceCount: verification.activatedDevices.length
          }
        })
      }

      reply.code(200).send({
        success: true,
        data: {
          isValid: true,
          isActive: true,
          userEmail: verification.userEmail
        }
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 사용자별 라이센스 정보 조회 (관리자용)
   * GET /api/license/admin/users
   */
  getAllLicenseUsers = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { page = 1, limit = 10, search } = request.query as { page?: number, limit?: number, search?: string }
      const skip = (Number(page) - 1) * Number(limit)

      const where = search ? {
        OR: [
          { email: { contains: search as string, mode: 'insensitive' as const } },
          { licenseKey: { contains: search as string, mode: 'insensitive' as const } }
        ]
      } : {}

      const [users, total] = await Promise.all([
        prisma.licenseUser.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            subscriptions: {
              where: { isActive: true },
              take: 1
            },
            items: true,
            deviceTransfers: {
              take: 5,
              orderBy: { transferDate: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.licenseUser.count({ where })
      ])

      reply.code(200).send({
        success: true,
        data: {
          users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 에러 처리 헬퍼
   */
  private handleError(error: any, reply: FastifyReply) {
    console.error('License Controller Error:', error)
    
    if (error instanceof LicenseError) {
      return reply.code(error.statusCode).send({
        success: false,
        error: error.message,
        code: error.code
      })
    }

    reply.code(500).send({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }
}