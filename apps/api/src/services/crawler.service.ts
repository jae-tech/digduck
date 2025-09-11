import {
  CrawlOptions,
  CrawlProgressCallback,
  CrawlResultItem,
} from "@/services/crawlers/base-crawler";
import {
  NaverBlogCategory,
  NaverBlogCrawler,
} from "@/services/crawlers/naver-blog-crawler";
import { SmartStoreCrawler } from "@/services/crawlers/naver-shopping-review-crawler";
import {
  AddCrawlResultRequest,
  CrawlJobFilter,
  CrawlSettings,
  CreateCrawlJobRequest,
  UpdateCrawlJobRequest,
} from "@/types/crawl.types";
import { PrismaClient } from "@prisma/client";

/**
 * 통합된 크롤러 서비스
 * - 크롤러 실행 및 관리
 * - 크롤링 작업 관리
 * - 크롤링 히스토리 및 통계
 */
export class CrawlerService {
  private naverBlogCrawler: NaverBlogCrawler;
  private smartStoreCrawler: SmartStoreCrawler;
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.naverBlogCrawler = new NaverBlogCrawler();
    this.smartStoreCrawler = new SmartStoreCrawler();
    this.prisma = prisma || new PrismaClient();
  }

  // ==================== 크롤러 실행 메서드들 ====================

  /**
   * 네이버 블로그 크롤링 실행
   */
  async crawlNaverBlog(
    searchUrl: string,
    options: CrawlOptions & CrawlSettings,
    callback?: CrawlProgressCallback,
  ): Promise<CrawlResultItem[]> {
    return await this.naverBlogCrawler.crawlNaverBlog(
      searchUrl,
      options,
      callback,
    );
  }

  /**
   * 네이버 블로그 카테고리 목록 조회
   */
  async getNaverBlogCategories(blogId: string): Promise<NaverBlogCategory[]> {
    return await this.naverBlogCrawler.getNaverBlogCategories(blogId);
  }

  /**
   * 스마트스토어 크롤링 실행
   */
  async crawlSmartStore(
    searchUrl: string,
    options: CrawlOptions & CrawlSettings,
    callback?: CrawlProgressCallback,
  ): Promise<CrawlResultItem[]> {
    return await this.smartStoreCrawler.crawlNaverShoppingReview(
      searchUrl,
      options,
      callback,
    );
  }

  // ==================== 크롤링 작업 관리 ====================

  /**
   * 크롤링 작업 시작
   */
  async startCrawlJob(data: CreateCrawlJobRequest) {
    // 라이센스 검증
    await this.validateUserLicense(data.userEmail);

    // 진행중인 크롤링 확인
    const runningJob = await this.prisma.crawlJobs.findFirst({
      where: {
        userEmail: data.userEmail,
        status: "RUNNING",
      },
    });

    if (runningJob) {
      throw new Error("이미 진행 중인 크롤링 작업이 있습니다");
    }

    // 크롤링 작업 생성
    const crawlJob = await this.prisma.crawlJobs.create({
      data: {
        userEmail: data.userEmail,
        projectId: data.projectId,
        targetId: data.targetId,
        serviceId: data.serviceId,
        jobType: data.jobType,
        config: data.config,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        service: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            projectName: true,
          },
        },
        target: {
          select: {
            id: true,
            targetType: true,
            targetValue: true,
          },
        },
      },
    });

    return crawlJob;
  }

  /**
   * 크롤링 작업 업데이트
   */
  async updateCrawlJob(jobId: number, data: UpdateCrawlJobRequest) {
    const job = await this.prisma.crawlJobs.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error("크롤링 작업을 찾을 수 없습니다");
    }

    return await this.prisma.crawlJobs.update({
      where: { id: jobId },
      data,
    });
  }

  /**
   * 크롤링 작업 취소
   */
  async cancelCrawlJob(jobId: number, userEmail: string) {
    const job = await this.prisma.crawlJobs.findFirst({
      where: {
        id: jobId,
        userEmail,
      },
    });

    if (!job) {
      throw new Error("크롤링 작업을 찾을 수 없습니다");
    }

    if (job.status === "COMPLETED" || job.status === "CANCELLED") {
      throw new Error("이미 완료되거나 취소된 작업입니다");
    }

    return await this.prisma.crawlJobs.update({
      where: { id: jobId },
      data: {
        status: "CANCELLED",
        completedAt: new Date(),
      },
    });
  }

  /**
   * 크롤링 작업 완료 처리
   */
  async completeCrawlJob(jobId: number, success: boolean = true) {
    const status = success ? "COMPLETED" : "FAILED";
    return await this.updateCrawlJob(jobId, {
      status,
      completedAt: new Date(),
    });
  }

  // ==================== 크롤링 결과 관리 ====================

  /**
   * 크롤링 결과 추가
   */
  async addCrawlResults(results: AddCrawlResultRequest[]) {
    if (results.length === 0) return [];

    return await this.prisma.crawlResults.createMany({
      data: results,
    });
  }

  /**
   * 크롤링 결과 조회
   */
  async getCrawlResults(jobId: number) {
    return await this.prisma.crawlResults.findMany({
      where: { jobId },
      orderBy: { createdAt: "desc" },
    });
  }

  // ==================== 크롤링 히스토리 및 조회 ====================

  /**
   * 크롤링 작업 목록 조회
   */
  async getCrawlJobs(filter: CrawlJobFilter) {
    const {
      userEmail,
      status,
      serviceId,
      jobType,
      page = 1,
      limit = 20,
      dateRange,
    } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userEmail) where.userEmail = userEmail;
    if (status) where.status = status;
    if (serviceId) where.serviceId = serviceId;
    if (jobType) where.jobType = jobType;
    if (dateRange?.from || dateRange?.to) {
      where.createdAt = {};
      if (dateRange.from) where.createdAt.gte = dateRange.from;
      if (dateRange.to) where.createdAt.lte = dateRange.to;
    }

    const [jobs, total] = await Promise.all([
      this.prisma.crawlJobs.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          service: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          project: {
            select: {
              id: true,
              projectName: true,
            },
          },
          target: {
            select: {
              id: true,
              targetType: true,
              targetValue: true,
            },
          },
          results: {
            take: 5,
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.crawlJobs.count({ where }),
    ]);

    return {
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 크롤링 작업 상세 조회
   */
  async getCrawlJobDetail(jobId: number, userEmail?: string) {
    const where: any = { id: jobId };
    if (userEmail) where.userEmail = userEmail;

    const job = await this.prisma.crawlJobs.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        service: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            projectName: true,
          },
        },
        target: {
          select: {
            id: true,
            targetType: true,
            targetValue: true,
          },
        },
        results: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!job) {
      throw new Error("크롤링 작업을 찾을 수 없습니다");
    }

    return job;
  }

  // ==================== 통계 및 대시보드 ====================

  /**
   * 크롤링 통계 조회
   */
  async getCrawlStatistics(
    userEmail: string,
    dateRange?: { from?: Date; to?: Date },
  ) {
    const where: any = { userEmail };
    if (dateRange?.from || dateRange?.to) {
      where.createdAt = {};
      if (dateRange.from) where.createdAt.gte = dateRange.from;
      if (dateRange.to) where.createdAt.lte = dateRange.to;
    }

    const [
      totalJobs,
      pendingJobs,
      runningJobs,
      completedJobs,
      failedJobs,
      cancelledJobs,
      totalItemsProcessed,
    ] = await Promise.all([
      this.prisma.crawlJobs.count({ where }),
      this.prisma.crawlJobs.count({ where: { ...where, status: "PENDING" } }),
      this.prisma.crawlJobs.count({ where: { ...where, status: "RUNNING" } }),
      this.prisma.crawlJobs.count({ where: { ...where, status: "COMPLETED" } }),
      this.prisma.crawlJobs.count({ where: { ...where, status: "FAILED" } }),
      this.prisma.crawlJobs.count({ where: { ...where, status: "CANCELLED" } }),
      this.prisma.crawlJobs.aggregate({
        where,
        _sum: { successItems: true },
      }),
    ]);

    // 평균 실행 시간 계산
    const completedJobsWithDuration = await this.prisma.crawlJobs.findMany({
      where: {
        ...where,
        status: "COMPLETED",
        startedAt: { not: null },
        completedAt: { not: null },
      },
      select: { startedAt: true, completedAt: true },
    });

    const averageDuration =
      completedJobsWithDuration.length > 0
        ? completedJobsWithDuration.reduce((sum, job) => {
            const duration =
              job.completedAt!.getTime() - job.startedAt!.getTime();
            return sum + duration;
          }, 0) / completedJobsWithDuration.length
        : 0;

    return {
      totalJobs,
      pendingJobs,
      runningJobs,
      completedJobs,
      failedJobs,
      cancelledJobs,
      totalItemsProcessed: totalItemsProcessed._sum.successItems || 0,
      averageDuration: Math.round(averageDuration / 1000), // 초 단위
      jobsByStatus: {
        PENDING: pendingJobs,
        RUNNING: runningJobs,
        COMPLETED: completedJobs,
        FAILED: failedJobs,
        CANCELLED: cancelledJobs,
      },
    };
  }

  // ==================== Private 메서드들 ====================

  /**
   * 라이센스 검증
   */
  private async validateUserLicense(userEmail: string) {
    const license = await this.prisma.licenses.findFirst({
      where: {
        userEmail,
        isActive: true,
        OR: [
          { endDate: null }, // 평생 라이센스
          { endDate: { gt: new Date() } }, // 유효한 라이센스
        ],
      },
    });

    if (!license) {
      throw new Error("유효한 라이센스가 없습니다");
    }

    return license;
  }
}
