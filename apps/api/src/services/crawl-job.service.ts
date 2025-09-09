import { PrismaClient, JobStatus, JobType } from "@prisma/client";

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

interface AddCrawlResultRequest {
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
  page?: number;
  limit?: number;
}

export class CrawlJobService {
  constructor(private prisma: PrismaClient) {}

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

    const updatedJob = await this.prisma.crawlJobs.update({
      where: { id: jobId },
      data,
    });

    return updatedJob;
  }

  /**
   * 크롤링 결과 추가
   */
  async addCrawlResults(results: AddCrawlResultRequest[]) {
    if (results.length === 0) return [];

    const createdResults = await this.prisma.crawlResults.createMany({
      data: results,
    });

    return createdResults;
  }

  /**
   * 크롤링 작업 목록 조회
   */
  async getCrawlJobs(filter: CrawlJobFilter) {
    const { userEmail, status, serviceId, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userEmail) {
      where.userEmail = userEmail;
    }

    if (status) {
      where.status = status;
    }

    if (serviceId) {
      where.serviceId = serviceId;
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
  async getCrawlJobById(jobId: number) {
    const job = await this.prisma.crawlJobs.findUnique({
      where: { id: jobId },
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

    const updatedJob = await this.prisma.crawlJobs.update({
      where: { id: jobId },
      data: {
        status: "CANCELLED",
        completedAt: new Date(),
      },
    });

    return updatedJob;
  }

  /**
   * 크롤링 통계 조회
   */
  async getCrawlStatistics(userEmail: string) {
    const [
      totalJobs,
      runningJobs,
      completedJobs,
      failedJobs,
      pendingJobs,
    ] = await Promise.all([
      this.prisma.crawlJobs.count({
        where: { userEmail },
      }),
      this.prisma.crawlJobs.count({
        where: { userEmail, status: "RUNNING" },
      }),
      this.prisma.crawlJobs.count({
        where: { userEmail, status: "COMPLETED" },
      }),
      this.prisma.crawlJobs.count({
        where: { userEmail, status: "FAILED" },
      }),
      this.prisma.crawlJobs.count({
        where: { userEmail, status: "PENDING" },
      }),
    ]);

    return {
      totalJobs,
      runningJobs,
      completedJobs,
      failedJobs,
      pendingJobs,
    };
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
}