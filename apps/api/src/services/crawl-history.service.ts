import { PrismaClient, JobStatus, JobType, TargetType, Prisma } from "@prisma/client";

// 새 스키마에 맞는 인터페이스들
interface CreateCrawlJobRequest {
  userEmail: string;
  projectId?: number;
  targetId?: number;
  serviceId: number;
  jobType: JobType;
  config: any;
  priority?: number;
  scheduledAt?: Date;
}

interface UpdateCrawlJobRequest {
  status?: JobStatus;
  totalItems?: number;
  processedItems?: number;
  successItems?: number;
  failedItems?: number;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTime?: number;
  errorCode?: string;
  errorMessage?: string;
  errorDetails?: any;
  metadata?: any;
}

interface CreateCrawlResultRequest {
  jobId: number;
  itemId?: string;
  itemType: string;
  data: any;
  metadata?: any;
  quality?: number;
  itemOrder?: number;
  pageNumber?: number;
}

interface CrawlJobFilter {
  userEmail?: string;
  status?: JobStatus;
  serviceId?: number;
  jobType?: JobType;
  dateRange?: { from?: Date; to?: Date };
}

interface CrawlJobResponse {
  id: number;
  userEmail: string;
  projectId?: number;
  targetId?: number;
  serviceId: number;
  jobType: JobType;
  config: any;
  status: JobStatus;
  priority: number;
  totalItems: number;
  processedItems: number;
  successItems: number;
  failedItems: number;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTime?: number;
  errorCode?: string;
  errorMessage?: string;
  errorDetails?: any;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  user?: any;
  service?: any;
  project?: any;
  target?: any;
  results?: any[];
}

interface CrawlStatistics {
  totalJobs: number;
  pendingJobs: number;
  runningJobs: number;
  completedJobs: number;
  failedJobs: number;
  cancelledJobs: number;
  totalItemsProcessed: number;
  averageDuration: number;
  jobsByStatus: { [status: string]: number };
  jobsByType: { [type: string]: number };
  jobsByService: { [service: string]: number };
  recentJobs: CrawlJobResponse[];
}

export class CrawlHistoryService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 크롤링 작업 시작
   */
  async startCrawlJob(data: CreateCrawlJobRequest): Promise<CrawlJobResponse> {
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
        priority: data.priority || 5,
        scheduledAt: data.scheduledAt,
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

    return this.formatCrawlJobResponse(crawlJob);
  }

  /**
   * 크롤링 작업 업데이트
   */
  async updateCrawlJob(jobId: number, data: UpdateCrawlJobRequest): Promise<CrawlJobResponse> {
    const job = await this.prisma.crawlJobs.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error("크롤링 작업을 찾을 수 없습니다");
    }

    const updatedJob = await this.prisma.crawlJobs.update({
      where: { id: jobId },
      data,
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

    return this.formatCrawlJobResponse(updatedJob);
  }

  /**
   * 크롤링 결과 추가 (배치)
   */
  async addCrawlResults(results: CreateCrawlResultRequest[]): Promise<any[]> {
    if (results.length === 0) return [];

    const createdResults = await this.prisma.crawlResults.createMany({
      data: results,
    });

    // 첫 번째 결과의 jobId로 작업 진행률 업데이트
    if (results.length > 0) {
      const jobId = results[0].jobId;
      await this.prisma.crawlJobs.update({
        where: { id: jobId },
        data: {
          processedItems: { increment: results.length },
          successItems: { increment: results.length },
        },
      });
    }

    return [createdResults];
  }

  /**
   * 사용자별 크롤링 작업 히스토리 조회
   */
  async getCrawlHistory(
    filter: CrawlJobFilter,
    options: {
      page?: number;
      limit?: number;
      includeResults?: boolean;
      resultsLimit?: number;
    } = {}
  ) {
    const {
      page = 1,
      limit = 20,
      includeResults = false,
      resultsLimit = 100,
    } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.crawlJobsWhereInput = {
      userEmail: filter.userEmail,
      serviceId: filter.serviceId,
      status: filter.status,
      jobType: filter.jobType,
      ...(filter.dateRange && {
        createdAt: {
          gte: filter.dateRange.from,
          lte: filter.dateRange.to,
        },
      }),
    };

    const [crawlJobs, total] = await Promise.all([
      this.prisma.crawlJobs.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
          results: includeResults
            ? {
                take: resultsLimit,
                orderBy: { createdAt: "desc" },
              }
            : false,
        },
      }),
      this.prisma.crawlJobs.count({ where }),
    ]);

    return {
      data: crawlJobs.map((job: any) => this.formatCrawlJobResponse(job)),
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
  async getCrawlJobDetail(jobId: number, userEmail?: string): Promise<CrawlJobResponse> {
    const where: Prisma.crawlJobsWhereInput = {
      id: jobId,
      ...(userEmail && { userEmail }),
    };

    const crawlJob = await this.prisma.crawlJobs.findFirst({
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

    if (!crawlJob) {
      throw new Error("크롤링 작업을 찾을 수 없습니다");
    }

    return this.formatCrawlJobResponse(crawlJob);
  }

  /**
   * 사용자별 크롤링 통계
   */
  async getCrawlStatistics(
    userEmail: string,
    dateRange?: { from?: Date; to?: Date }
  ): Promise<CrawlStatistics> {
    const where: Prisma.crawlJobsWhereInput = {
      userEmail,
      ...(dateRange && {
        createdAt: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      }),
    };

    const [
      totalJobs,
      pendingJobs,
      runningJobs,
      completedJobs,
      failedJobs,
      cancelledJobs,
      jobsByStatus,
      jobsByType,
      jobsByService,
      totalItemsProcessed,
      avgDuration,
      recentJobs,
    ] = await Promise.all([
      this.prisma.crawlJobs.count({ where }),
      this.prisma.crawlJobs.count({ where: { ...where, status: "PENDING" } }),
      this.prisma.crawlJobs.count({ where: { ...where, status: "RUNNING" } }),
      this.prisma.crawlJobs.count({ where: { ...where, status: "COMPLETED" } }),
      this.prisma.crawlJobs.count({ where: { ...where, status: "FAILED" } }),
      this.prisma.crawlJobs.count({ where: { ...where, status: "CANCELLED" } }),
      this.prisma.crawlJobs.groupBy({
        by: ["status"],
        where,
        _count: { status: true },
      }),
      this.prisma.crawlJobs.groupBy({
        by: ["jobType"],
        where,
        _count: { jobType: true },
      }),
      this.prisma.crawlJobs.groupBy({
        by: ["serviceId"],
        where,
        _count: { serviceId: true },
      }),
      this.prisma.crawlJobs.aggregate({
        where,
        _sum: { successItems: true },
      }),
      this.prisma.crawlJobs.aggregate({
        where: {
          ...where,
          startedAt: { not: null },
          completedAt: { not: null },
        },
        _avg: { estimatedTime: true },
      }),
      this.prisma.crawlJobs.findMany({
        where,
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          service: { select: { name: true } },
          project: { select: { projectName: true } },
        },
      }),
    ]);

    return {
      totalJobs,
      pendingJobs,
      runningJobs,
      completedJobs,
      failedJobs,
      cancelledJobs,
      totalItemsProcessed: totalItemsProcessed._sum.successItems || 0,
      averageDuration: Math.round(avgDuration._avg.estimatedTime || 0),
      jobsByStatus: jobsByStatus.reduce(
        (acc: any, item: any) => {
          acc[item.status] = item._count.status;
          return acc;
        },
        {} as { [status: string]: number }
      ),
      jobsByType: jobsByType.reduce(
        (acc: any, item: any) => {
          acc[item.jobType] = item._count.jobType;
          return acc;
        },
        {} as { [type: string]: number }
      ),
      jobsByService: jobsByService.reduce(
        (acc: any, item: any) => {
          acc[item.serviceId] = item._count.serviceId;
          return acc;
        },
        {} as { [service: string]: number }
      ),
      recentJobs: recentJobs.map((job: any) => this.formatCrawlJobResponse(job)),
    };
  }

  /**
   * 크롤링 작업 완료 처리
   */
  async completeCrawlJob(
    jobId: number,
    success: boolean = true,
    errorMessage?: string,
    errorCode?: string
  ): Promise<CrawlJobResponse> {
    const completedAt = new Date();

    const job = await this.prisma.crawlJobs.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error("크롤링 작업을 찾을 수 없습니다");
    }

    const estimatedTime = job.startedAt
      ? completedAt.getTime() - job.startedAt.getTime()
      : null;

    const updatedJob = await this.prisma.crawlJobs.update({
      where: { id: jobId },
      data: {
        status: success ? "COMPLETED" : "FAILED",
        completedAt,
        estimatedTime,
        errorMessage: success ? null : errorMessage,
        errorCode: success ? null : errorCode,
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

    return this.formatCrawlJobResponse(updatedJob);
  }

  /**
   * 크롤링 작업 취소
   */
  async cancelCrawlJob(jobId: number, userEmail: string): Promise<CrawlJobResponse> {
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

    const updatedJob = await this.prisma.crawlJobs.update({
      where: { id: jobId },
      data: {
        status: "CANCELLED",
        completedAt: new Date(),
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

    return this.formatCrawlJobResponse(updatedJob);
  }

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

  /**
   * 응답 포매팅
   */
  private formatCrawlJobResponse(crawlJob: any): CrawlJobResponse {
    return {
      id: crawlJob.id,
      userEmail: crawlJob.userEmail,
      projectId: crawlJob.projectId,
      targetId: crawlJob.targetId,
      serviceId: crawlJob.serviceId,
      jobType: crawlJob.jobType,
      config: crawlJob.config,
      status: crawlJob.status,
      priority: crawlJob.priority,
      totalItems: crawlJob.totalItems,
      processedItems: crawlJob.processedItems,
      successItems: crawlJob.successItems,
      failedItems: crawlJob.failedItems,
      scheduledAt: crawlJob.scheduledAt,
      startedAt: crawlJob.startedAt,
      completedAt: crawlJob.completedAt,
      estimatedTime: crawlJob.estimatedTime,
      errorCode: crawlJob.errorCode,
      errorMessage: crawlJob.errorMessage,
      errorDetails: crawlJob.errorDetails,
      metadata: crawlJob.metadata,
      createdAt: crawlJob.createdAt,
      updatedAt: crawlJob.updatedAt,
      user: crawlJob.user,
      service: crawlJob.service,
      project: crawlJob.project,
      target: crawlJob.target,
      results: crawlJob.results,
    };
  }
}