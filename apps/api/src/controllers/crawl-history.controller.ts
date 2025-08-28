import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { CrawlHistoryService } from '../services/crawl-history.service'
import { IntegratedCrawlService } from '../services/integrated-crawl.service'
import { prisma } from '../plugins/prisma'
import { SourceSite, CrawlStatus } from '@prisma/client'
import {
  CreateCrawlHistoryRequest,
  UpdateCrawlHistoryRequest,
  CreateCrawlItemRequest,
  CreateCrawlTemplateRequest,
  StartCrawlRequest,
  CrawlHistoryFilter,
  CrawlHistoryError
} from '../types/crawl-history.types'

export class CrawlHistoryController {
  private crawlHistoryService: CrawlHistoryService
  private integratedCrawlService: IntegratedCrawlService

  constructor() {
    this.crawlHistoryService = new CrawlHistoryService(prisma)
    this.integratedCrawlService = new IntegratedCrawlService(prisma)
  }

  /**
   * Fastify 플러그인으로 라우트 등록
   */
  async routes(fastify: FastifyInstance) {
    // 크롤링 시작
    fastify.post('/start', {
      schema: {
        tags: ['Crawl History'],
        description: 'Start new crawl',
        body: {
          type: 'object',
          required: ['userEmail', 'deviceId', 'sourceSite', 'searchUrl'],
          properties: {
            userEmail: { type: 'string', format: 'email' },
            deviceId: { type: 'string' },
            sourceSite: { 
              type: 'string', 
              enum: ['SMARTSTORE', 'COUPANG', 'GMARKET', 'AUCTION', 'ELEVENST'] 
            },
            searchUrl: { type: 'string', format: 'uri' },
            searchKeywords: { type: 'string' },
            crawlSettings: {
              type: 'object',
              properties: {
                maxPages: { type: 'integer', minimum: 1, maximum: 100 },
                maxItems: { type: 'integer', minimum: 1, maximum: 10000 },
                requestDelay: { type: 'integer', minimum: 100, maximum: 5000 }
              }
            },
            templateId: { type: 'integer' }
          }
        }
      }
    }, this.startCrawl)

    // 크롤링 히스토리 생성
    fastify.post('/history', {
      schema: {
        tags: ['Crawl History'],
        description: 'Create crawl history',
        body: {
          type: 'object',
          required: ['userEmail', 'deviceId', 'sourceSite', 'searchUrl'],
          properties: {
            userEmail: { type: 'string', format: 'email' },
            deviceId: { type: 'string' },
            sourceSite: { 
              type: 'string', 
              enum: ['SMARTSTORE', 'COUPANG', 'GMARKET', 'AUCTION', 'ELEVENST'] 
            },
            searchUrl: { type: 'string', format: 'uri' },
            searchKeywords: { type: 'string' },
            crawlSettings: { type: 'object' },
            userAgent: { type: 'string' },
            proxyUsed: { type: 'string' },
            requestInterval: { type: 'integer' }
          }
        }
      }
    }, this.createCrawlHistory)

    // 크롤링 히스토리 업데이트
    fastify.put('/history/:crawlId', {
      schema: {
        tags: ['Crawl History'],
        description: 'Update crawl history',
        params: {
          type: 'object',
          properties: {
            crawlId: { type: 'integer' }
          }
        },
        body: {
          type: 'object',
          properties: {
            status: { 
              type: 'string',
              enum: ['PENDING', 'RUNNING', 'COMPLETED', 'SUCCESS', 'FAILED', 'CANCELLED']
            },
            itemsFound: { type: 'integer' },
            itemsCrawled: { type: 'integer' },
            pagesProcessed: { type: 'integer' },
            durationMs: { type: 'integer' },
            errorMessage: { type: 'string' }
          }
        }
      }
    }, this.updateCrawlHistory)

    // 크롤링 아이템 추가 (배치)
    fastify.post('/history/:crawlId/items', {
      schema: {
        tags: ['Crawl History'],
        description: 'Add crawl items in batch',
        params: {
          type: 'object',
          properties: {
            crawlId: { type: 'integer' }
          }
        },
        body: {
          type: 'object',
          required: ['items'],
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  itemId: { type: 'string' },
                  title: { type: 'string' },
                  content: { type: 'string' },
                  url: { type: 'string' },
                  rating: { type: 'number' },
                  price: { type: 'number' },
                  itemOrder: { type: 'integer' },
                  pageNumber: { type: 'integer' }
                }
              }
            }
          }
        }
      }
    }, this.addCrawlItems)

    // 사용자별 크롤링 히스토리 조회
    fastify.get('/history', {
      schema: {
        tags: ['Crawl History'],
        description: 'Get crawl history list',
        querystring: {
          type: 'object',
          properties: {
            userEmail: { type: 'string', format: 'email' },
            sourceSite: { 
              type: 'string',
              enum: ['SMARTSTORE', 'COUPANG', 'GMARKET', 'AUCTION', 'ELEVENST']
            },
            status: { 
              type: 'string',
              enum: ['PENDING', 'RUNNING', 'COMPLETED', 'SUCCESS', 'FAILED', 'CANCELLED']
            },
            deviceId: { type: 'string' },
            searchKeywords: { type: 'string' },
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            includeItems: { type: 'boolean' },
            itemsLimit: { type: 'integer', minimum: 1, maximum: 1000 },
            dateFrom: { type: 'string', format: 'date-time' },
            dateTo: { type: 'string', format: 'date-time' }
          }
        }
      }
    }, this.getCrawlHistory)

    // 크롤링 히스토리 상세 조회
    fastify.get('/history/:crawlId', {
      schema: {
        tags: ['Crawl History'],
        description: 'Get crawl history detail',
        params: {
          type: 'object',
          properties: {
            crawlId: { type: 'integer' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            userEmail: { type: 'string', format: 'email' }
          }
        }
      }
    }, this.getCrawlHistoryDetail)

    // 크롤링 완료 처리
    fastify.post('/history/:crawlId/complete', {
      schema: {
        tags: ['Crawl History'],
        description: 'Complete crawl',
        params: {
          type: 'object',
          properties: {
            crawlId: { type: 'integer' }
          }
        },
        body: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            errorMessage: { type: 'string' }
          }
        }
      }
    }, this.completeCrawl)

    // 크롤링 통계
    fastify.get('/statistics', {
      schema: {
        tags: ['Crawl History'],
        description: 'Get crawl statistics',
        querystring: {
          type: 'object',
          required: ['userEmail'],
          properties: {
            userEmail: { type: 'string', format: 'email' },
            dateFrom: { type: 'string', format: 'date-time' },
            dateTo: { type: 'string', format: 'date-time' }
          }
        }
      }
    }, this.getCrawlStatistics)

    // 크롤링 템플릿 생성
    fastify.post('/templates', {
      schema: {
        tags: ['Crawl Templates'],
        description: 'Create crawl template',
        body: {
          type: 'object',
          required: ['userEmail', 'name', 'sourceSite'],
          properties: {
            userEmail: { type: 'string', format: 'email' },
            name: { type: 'string' },
            description: { type: 'string' },
            sourceSite: { 
              type: 'string',
              enum: ['SMARTSTORE', 'COUPANG', 'GMARKET', 'AUCTION', 'ELEVENST']
            },
            maxPages: { type: 'integer', minimum: 1, maximum: 100 },
            maxItems: { type: 'integer', minimum: 1, maximum: 10000 },
            requestDelay: { type: 'integer', minimum: 100, maximum: 5000 },
            isPublic: { type: 'boolean' }
          }
        }
      }
    }, this.createCrawlTemplate)

    // 크롤링 템플릿 목록
    fastify.get('/templates', {
      schema: {
        tags: ['Crawl Templates'],
        description: 'Get crawl templates',
        querystring: {
          type: 'object',
          required: ['userEmail'],
          properties: {
            userEmail: { type: 'string', format: 'email' },
            includePublic: { type: 'boolean' },
            sourceSite: { 
              type: 'string',
              enum: ['SMARTSTORE', 'COUPANG', 'GMARKET', 'AUCTION', 'ELEVENST']
            },
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 }
          }
        }
      }
    }, this.getCrawlTemplates)
  }

  /**
   * 크롤링 시작
   */
  startCrawl = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request.body as StartCrawlRequest
      const result = await this.crawlHistoryService.startCrawl(data)
      
      reply.code(201).send({
        success: true,
        data: result
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 크롤링 히스토리 생성
   */
  createCrawlHistory = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request.body as CreateCrawlHistoryRequest
      const result = await this.crawlHistoryService.createCrawlHistory(data)
      
      reply.code(201).send({
        success: true,
        data: result
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 크롤링 히스토리 업데이트
   */
  updateCrawlHistory = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { crawlId } = request.params as { crawlId: number }
      const data = request.body as UpdateCrawlHistoryRequest
      
      const result = await this.crawlHistoryService.updateCrawlHistory(crawlId, data)
      
      reply.code(200).send({
        success: true,
        data: result
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 크롤링 아이템 추가
   */
  addCrawlItems = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { crawlId } = request.params as { crawlId: number }
      const { items } = request.body as { items: CreateCrawlItemRequest[] }
      
      // crawlHistoryId 설정
      const itemsWithCrawlId = items.map(item => ({
        ...item,
        crawlHistoryId: crawlId
      }))
      
      const result = await this.crawlHistoryService.addCrawlItems(itemsWithCrawlId)
      
      reply.code(201).send({
        success: true,
        data: result,
        message: `${result.length} items added`
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 크롤링 히스토리 조회
   */
  getCrawlHistory = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as any
      
      const filter: CrawlHistoryFilter = {
        userEmail: query.userEmail,
        sourceSite: query.sourceSite as SourceSite,
        status: query.status as CrawlStatus,
        deviceId: query.deviceId,
        searchKeywords: query.searchKeywords,
        dateRange: (query.dateFrom || query.dateTo) ? {
          from: query.dateFrom ? new Date(query.dateFrom) : undefined,
          to: query.dateTo ? new Date(query.dateTo) : undefined
        } : undefined
      }

      const options = {
        page: query.page ? Number(query.page) : 1,
        limit: query.limit ? Number(query.limit) : 20,
        includeItems: query.includeItems === 'true',
        itemsLimit: query.itemsLimit ? Number(query.itemsLimit) : 100
      }

      const result = await this.crawlHistoryService.getCrawlHistory(filter, options)
      
      reply.code(200).send({
        success: true,
        data: result.data,
        pagination: result.pagination
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 크롤링 히스토리 상세 조회
   */
  getCrawlHistoryDetail = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { crawlId } = request.params as { crawlId: number }
      const { userEmail } = request.query as { userEmail?: string }
      
      const result = await this.crawlHistoryService.getCrawlHistoryDetail(
        Number(crawlId),
        userEmail
      )
      
      reply.code(200).send({
        success: true,
        data: result
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 크롤링 완료
   */
  completeCrawl = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { crawlId } = request.params as { crawlId: number }
      const { success = true, errorMessage } = request.body as { 
        success?: boolean
        errorMessage?: string
      }
      
      const result = await this.crawlHistoryService.completeCrawl(
        Number(crawlId),
        success,
        errorMessage
      )
      
      reply.code(200).send({
        success: true,
        data: result
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 크롤링 통계
   */
  getCrawlStatistics = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userEmail, dateFrom, dateTo } = request.query as {
        userEmail: string
        dateFrom?: string
        dateTo?: string
      }
      
      const dateRange = (dateFrom || dateTo) ? {
        from: dateFrom ? new Date(dateFrom) : undefined,
        to: dateTo ? new Date(dateTo) : undefined
      } : undefined

      const result = await this.crawlHistoryService.getCrawlStatistics(
        userEmail,
        dateRange
      )
      
      reply.code(200).send({
        success: true,
        data: result
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 크롤링 템플릿 생성
   */
  createCrawlTemplate = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request.body as CreateCrawlTemplateRequest
      const result = await this.crawlHistoryService.createCrawlTemplate(data)
      
      reply.code(201).send({
        success: true,
        data: result
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 크롤링 템플릿 목록
   */
  getCrawlTemplates = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as any
      
      const options = {
        includePublic: query.includePublic !== 'false',
        sourceSite: query.sourceSite as SourceSite,
        page: query.page ? Number(query.page) : 1,
        limit: query.limit ? Number(query.limit) : 20
      }

      const result = await this.crawlHistoryService.getCrawlTemplates(
        query.userEmail,
        options
      )
      
      reply.code(200).send({
        success: true,
        data: result.data,
        pagination: result.pagination
      })
    } catch (error) {
      this.handleError(error, reply)
    }
  }

  /**
   * 에러 처리 헬퍼
   */
  private handleError(error: any, reply: FastifyReply) {
    console.error('Crawl History Controller Error:', error)
    
    if (error instanceof CrawlHistoryError) {
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