import { PrismaClient, SourceSite, CrawlStatus, Prisma } from '@prisma/client'
import {
  CreateCrawlHistoryRequest,
  UpdateCrawlHistoryRequest,
  CreateCrawlItemRequest,
  CreateCrawlTemplateRequest,
  StartCrawlRequest,
  CrawlHistoryFilter,
  CrawlHistoryResponse,
  CrawlItemResponse,
  CrawlTemplateResponse,
  CrawlStatistics,
  CrawlHistoryError,
  CrawlHistoryErrorCodes
} from '../types/crawl-history.types'

export class CrawlHistoryService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 크롤링 시작
   */
  async startCrawl(data: StartCrawlRequest): Promise<CrawlHistoryResponse> {
    // 라이센스 검증
    await this.validateUserLicense(data.userEmail, data.deviceId)

    // 진행중인 크롤링 확인
    const runningCrawl = await this.prisma.crawlHistory.findFirst({
      where: {
        userEmail: data.userEmail,
        status: CrawlStatus.RUNNING
      }
    })

    if (runningCrawl) {
      throw new CrawlHistoryError(
        'Another crawl is already running',
        CrawlHistoryErrorCodes.CRAWL_ALREADY_RUNNING,
        409
      )
    }

    // 템플릿 설정 로드 (있는 경우)
    let crawlSettings = data.crawlSettings
    if (data.templateId) {
      const template = await this.prisma.crawlTemplates.findFirst({
        where: {
          id: data.templateId,
          OR: [
            { userEmail: data.userEmail },
            { isPublic: true }
          ]
        }
      })

      if (template) {
        crawlSettings = {
          maxPages: template.maxPages,
          maxItems: template.maxItems,
          requestDelay: template.requestDelay,
          filters: template.filters as any,
          selectors: template.selectors as any,
          ...crawlSettings
        }

        // 사용 횟수 증가
        await this.prisma.crawlTemplates.update({
          where: { id: template.id },
          data: { usageCount: { increment: 1 } }
        })
      }
    }

    // 크롤링 히스토리 생성
    const crawlHistory = await this.prisma.crawlHistory.create({
      data: {
        userEmail: data.userEmail,
        deviceId: data.deviceId,
        sourceSite: data.sourceSite,
        searchUrl: data.searchUrl,
        searchKeywords: data.searchKeywords,
        status: CrawlStatus.PENDING,
        crawlSettings: crawlSettings as any,
        startedAt: new Date()
      }
    })

    return this.formatCrawlHistoryResponse(crawlHistory)
  }

  /**
   * 크롤링 히스토리 생성
   */
  async createCrawlHistory(data: CreateCrawlHistoryRequest): Promise<CrawlHistoryResponse> {
    const crawlHistory = await this.prisma.crawlHistory.create({
      data: {
        userEmail: data.userEmail,
        deviceId: data.deviceId,
        sourceSite: data.sourceSite,
        searchUrl: data.searchUrl,
        searchKeywords: data.searchKeywords,
        crawlSettings: data.crawlSettings as any,
        userAgent: data.userAgent,
        proxyUsed: data.proxyUsed,
        requestInterval: data.requestInterval
      }
    })

    return this.formatCrawlHistoryResponse(crawlHistory)
  }

  /**
   * 크롤링 히스토리 업데이트
   */
  async updateCrawlHistory(
    crawlId: number, 
    data: UpdateCrawlHistoryRequest
  ): Promise<CrawlHistoryResponse> {
    const crawlHistory = await this.prisma.crawlHistory.findUnique({
      where: { id: crawlId }
    })

    if (!crawlHistory) {
      throw new CrawlHistoryError(
        'Crawl history not found',
        CrawlHistoryErrorCodes.CRAWL_NOT_FOUND,
        404
      )
    }

    const updatedCrawlHistory = await this.prisma.crawlHistory.update({
      where: { id: crawlId },
      data: {
        ...data,
        errorDetails: data.errorDetails as any,
        metadata: data.metadata as any
      }
    })

    return this.formatCrawlHistoryResponse(updatedCrawlHistory)
  }

  /**
   * 크롤링 아이템 추가 (배치)
   */
  async addCrawlItems(items: CreateCrawlItemRequest[]): Promise<CrawlItemResponse[]> {
    if (items.length === 0) return []

    // 트랜잭션으로 배치 삽입
    const createdItems = await this.prisma.$transaction(
      items.map(item =>
        this.prisma.crawlItems.create({
          data: {
            crawlHistoryId: item.crawlHistoryId,
            itemId: item.itemId,
            title: item.title,
            content: item.content,
            url: item.url,
            rating: item.rating,
            reviewDate: item.reviewDate,
            reviewerName: item.reviewerName,
            isVerified: item.isVerified,
            price: item.price,
            originalPrice: item.originalPrice,
            discount: item.discount,
            stock: item.stock,
            imageUrls: item.imageUrls as any,
            videoUrls: item.videoUrls as any,
            siteSpecificData: item.siteSpecificData as any,
            itemOrder: item.itemOrder,
            pageNumber: item.pageNumber
          }
        })
      )
    )

    // 크롤링 히스토리의 아이템 수 업데이트
    const crawlHistoryId = items[0].crawlHistoryId
    await this.prisma.crawlHistory.update({
      where: { id: crawlHistoryId },
      data: {
        itemsCrawled: { increment: items.length }
      }
    })

    return createdItems.map(this.formatCrawlItemResponse)
  }

  /**
   * 사용자별 크롤링 히스토리 조회
   */
  async getCrawlHistory(
    filter: CrawlHistoryFilter,
    options: {
      page?: number
      limit?: number
      includeItems?: boolean
      itemsLimit?: number
    } = {}
  ) {
    const { page = 1, limit = 20, includeItems = false, itemsLimit = 100 } = options
    const skip = (page - 1) * limit

    const where: Prisma.crawlHistoryWhereInput = {
      userEmail: filter.userEmail,
      sourceSite: filter.sourceSite,
      status: filter.status,
      deviceId: filter.deviceId,
      ...(filter.searchKeywords && {
        searchKeywords: {
          contains: filter.searchKeywords,
          mode: 'insensitive'
        }
      }),
      ...(filter.dateRange && {
        createdAt: {
          gte: filter.dateRange.from,
          lte: filter.dateRange.to
        }
      })
    }

    const [crawlHistories, total] = await Promise.all([
      this.prisma.crawlHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: includeItems ? {
          crawlItems: {
            take: itemsLimit,
            orderBy: { itemOrder: 'asc' }
          }
        } : undefined
      }),
      this.prisma.crawlHistory.count({ where })
    ])

    return {
      data: crawlHistories.map((ch: any) => this.formatCrawlHistoryResponse(ch)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * 크롤링 히스토리 상세 조회
   */
  async getCrawlHistoryDetail(
    crawlId: number,
    userEmail?: string
  ): Promise<CrawlHistoryResponse> {
    const where: Prisma.crawlHistoryWhereInput = {
      id: crawlId,
      ...(userEmail && { userEmail })
    }

    const crawlHistory = await this.prisma.crawlHistory.findFirst({
      where,
      include: {
        crawlItems: {
          orderBy: { itemOrder: 'asc' }
        }
      }
    })

    if (!crawlHistory) {
      throw new CrawlHistoryError(
        'Crawl history not found',
        CrawlHistoryErrorCodes.CRAWL_NOT_FOUND,
        404
      )
    }

    return this.formatCrawlHistoryResponse(crawlHistory)
  }

  /**
   * 크롤링 템플릿 생성
   */
  async createCrawlTemplate(data: CreateCrawlTemplateRequest): Promise<CrawlTemplateResponse> {
    const template = await this.prisma.crawlTemplates.create({
      data: {
        userEmail: data.userEmail,
        name: data.name,
        description: data.description,
        sourceSite: data.sourceSite,
        maxPages: data.maxPages || 10,
        maxItems: data.maxItems || 2000,
        requestDelay: data.requestDelay || 1000,
        filters: data.filters as any,
        selectors: data.selectors as any,
        isPublic: data.isPublic || false
      }
    })

    return this.formatCrawlTemplateResponse(template)
  }

  /**
   * 사용자별 크롤링 템플릿 조회
   */
  async getCrawlTemplates(
    userEmail: string,
    options: {
      includePublic?: boolean
      sourceSite?: SourceSite
      page?: number
      limit?: number
    } = {}
  ) {
    const { includePublic = true, sourceSite, page = 1, limit = 20 } = options
    const skip = (page - 1) * limit

    const where: Prisma.crawlTemplatesWhereInput = {
      OR: [
        { userEmail },
        ...(includePublic ? [{ isPublic: true }] : [])
      ],
      ...(sourceSite && { sourceSite })
    }

    const [templates, total] = await Promise.all([
      this.prisma.crawlTemplates.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { usageCount: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      this.prisma.crawlTemplates.count({ where })
    ])

    return {
      data: templates.map(this.formatCrawlTemplateResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * 사용자별 크롤링 통계
   */
  async getCrawlStatistics(
    userEmail: string,
    dateRange?: { from?: Date, to?: Date }
  ): Promise<CrawlStatistics> {
    const where: Prisma.crawlHistoryWhereInput = {
      userEmail,
      ...(dateRange && {
        createdAt: {
          gte: dateRange.from,
          lte: dateRange.to
        }
      })
    }

    const [
      totalCrawls,
      successfulCrawls,
      failedCrawls,
      crawlsByStatus,
      crawlsBySite,
      totalItems,
      avgDuration
    ] = await Promise.all([
      this.prisma.crawlHistory.count({ where }),
      this.prisma.crawlHistory.count({
        where: { ...where, status: { in: [CrawlStatus.COMPLETED, CrawlStatus.SUCCESS] } }
      }),
      this.prisma.crawlHistory.count({
        where: { ...where, status: CrawlStatus.FAILED }
      }),
      this.prisma.crawlHistory.groupBy({
        by: ['status'],
        where,
        _count: { status: true }
      }),
      this.prisma.crawlHistory.groupBy({
        by: ['sourceSite'],
        where,
        _count: { sourceSite: true }
      }),
      this.prisma.crawlHistory.aggregate({
        where,
        _sum: { itemsCrawled: true }
      }),
      this.prisma.crawlHistory.aggregate({
        where: {
          ...where,
          durationMs: { not: null }
        },
        _avg: { durationMs: true }
      })
    ])

    return {
      totalCrawls,
      successfulCrawls,
      failedCrawls,
      totalItemsCrawled: totalItems._sum.itemsCrawled || 0,
      averageDuration: Math.round(avgDuration._avg.durationMs || 0),
      crawlsByStatus: crawlsByStatus.reduce((acc: any, item: any) => {
        acc[item.status] = item._count.status
        return acc
      }, {} as { [status: string]: number }),
      crawlsBySite: crawlsBySite.reduce((acc: any, item: any) => {
        acc[item.sourceSite] = item._count.sourceSite
        return acc
      }, {} as { [site: string]: number }),
      crawlsByDate: [] // TODO: 날짜별 통계 구현
    }
  }

  /**
   * 크롤링 완료 처리
   */
  async completeCrawl(
    crawlId: number,
    success: boolean = true,
    errorMessage?: string
  ): Promise<CrawlHistoryResponse> {
    const completedAt = new Date()
    
    const crawlHistory = await this.prisma.crawlHistory.findUnique({
      where: { id: crawlId }
    })

    if (!crawlHistory) {
      throw new CrawlHistoryError(
        'Crawl history not found',
        CrawlHistoryErrorCodes.CRAWL_NOT_FOUND,
        404
      )
    }

    const durationMs = crawlHistory.startedAt 
      ? completedAt.getTime() - crawlHistory.startedAt.getTime()
      : null

    const updatedCrawlHistory = await this.prisma.crawlHistory.update({
      where: { id: crawlId },
      data: {
        status: success ? CrawlStatus.COMPLETED : CrawlStatus.FAILED,
        completedAt,
        durationMs,
        errorMessage: success ? null : errorMessage
      }
    })

    return this.formatCrawlHistoryResponse(updatedCrawlHistory)
  }

  /**
   * 라이센스 검증
   */
  private async validateUserLicense(userEmail: string, deviceId: string) {
    const licenseUser = await this.prisma.licenseUsers.findUnique({
      where: { email: userEmail },
      include: {
        licenseSubscriptions: {
          where: { isActive: true },
          take: 1
        }
      }
    })

    if (!licenseUser) {
      throw new CrawlHistoryError(
        'License not found',
        CrawlHistoryErrorCodes.LICENSE_EXPIRED,
        402
      )
    }

    // 구독 확인
    const activeSubscription = licenseUser.licenseSubscriptions[0]
    if (!activeSubscription || new Date(activeSubscription.endDate) < new Date()) {
      throw new CrawlHistoryError(
        'License expired',
        CrawlHistoryErrorCodes.LICENSE_EXPIRED,
        402
      )
    }

    // 디바이스 활성화 확인
    const activatedDevices = licenseUser.activatedDevices as any[]
    const isDeviceActivated = activatedDevices.some(
      device => device.device_id === deviceId
    )

    if (!isDeviceActivated) {
      throw new CrawlHistoryError(
        'Device not activated',
        CrawlHistoryErrorCodes.DEVICE_NOT_ACTIVATED,
        403
      )
    }
  }

  /**
   * 응답 포매팅
   */
  private formatCrawlHistoryResponse(crawlHistory: any): CrawlHistoryResponse {
    return {
      id: crawlHistory.id,
      userEmail: crawlHistory.userEmail,
      deviceId: crawlHistory.deviceId,
      sourceSite: crawlHistory.sourceSite,
      searchUrl: crawlHistory.searchUrl,
      searchKeywords: crawlHistory.searchKeywords,
      status: crawlHistory.status,
      itemsFound: crawlHistory.itemsFound,
      itemsCrawled: crawlHistory.itemsCrawled,
      pagesProcessed: crawlHistory.pagesProcessed,
      startedAt: crawlHistory.startedAt,
      completedAt: crawlHistory.completedAt,
      durationMs: crawlHistory.durationMs,
      errorMessage: crawlHistory.errorMessage,
      errorDetails: crawlHistory.errorDetails,
      userAgent: crawlHistory.userAgent,
      proxyUsed: crawlHistory.proxyUsed,
      requestInterval: crawlHistory.requestInterval,
      crawlSettings: crawlHistory.crawlSettings,
      metadata: crawlHistory.metadata,
      createdAt: crawlHistory.createdAt,
      crawlItems: crawlHistory.crawlItems?.map(this.formatCrawlItemResponse)
    }
  }

  private formatCrawlItemResponse(crawlItem: any): CrawlItemResponse {
    return {
      id: crawlItem.id,
      crawlHistoryId: crawlItem.crawlHistoryId,
      itemId: crawlItem.itemId,
      title: crawlItem.title,
      content: crawlItem.content,
      url: crawlItem.url,
      rating: crawlItem.rating ? Number(crawlItem.rating) : undefined,
      reviewDate: crawlItem.reviewDate,
      reviewerName: crawlItem.reviewerName,
      isVerified: crawlItem.isVerified,
      price: crawlItem.price ? Number(crawlItem.price) : undefined,
      originalPrice: crawlItem.originalPrice ? Number(crawlItem.originalPrice) : undefined,
      discount: crawlItem.discount,
      stock: crawlItem.stock,
      imageUrls: crawlItem.imageUrls,
      videoUrls: crawlItem.videoUrls,
      siteSpecificData: crawlItem.siteSpecificData,
      itemOrder: crawlItem.itemOrder,
      pageNumber: crawlItem.pageNumber,
      createdAt: crawlItem.createdAt
    }
  }

  private formatCrawlTemplateResponse(template: any): CrawlTemplateResponse {
    return {
      id: template.id,
      userEmail: template.userEmail,
      name: template.name,
      description: template.description,
      sourceSite: template.sourceSite,
      maxPages: template.maxPages,
      maxItems: template.maxItems,
      requestDelay: template.requestDelay,
      filters: template.filters,
      selectors: template.selectors,
      isPublic: template.isPublic,
      usageCount: template.usageCount,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt
    }
  }
}