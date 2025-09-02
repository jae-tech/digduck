import { PrismaClient } from "@prisma/client";
import {
  CreateMailHistoryData,
  MailHistoryFilter,
  MailStatus,
  MailProvider
} from "@/types/mail.types";

export class MailHistoryService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  async createMailHistory(data: CreateMailHistoryData) {
    try {
      const mailHistory = await this.prisma.mailHistory.create({
        data: {
          userEmail: data.userEmail,
          fromEmail: data.fromEmail,
          toEmail: data.toEmail,
          ccEmails: data.ccEmails || [],
          bccEmails: data.bccEmails || [],
          subject: data.subject,
          templateId: data.templateId,
          templateVars: data.templateVars,
          provider: data.provider as any,
          status: MailStatus.PENDING as any
        }
      });

      return mailHistory;
    } catch (error) {
      console.error('메일 히스토리 생성 실패:', error);
      throw error;
    }
  }

  async updateMailHistory(id: number, updates: {
    messageId?: string;
    status?: MailStatus;
    errorMessage?: string;
    sentAt?: Date;
    deliveredAt?: Date;
    openedAt?: Date;
    clickedAt?: Date;
  }) {
    try {
      const updatedHistory = await this.prisma.mailHistory.update({
        where: { id },
        data: {
          ...updates,
          status: updates.status as any
        }
      });

      return updatedHistory;
    } catch (error) {
      console.error('메일 히스토리 업데이트 실패:', error);
      throw error;
    }
  }

  async getMailHistory(filter: MailHistoryFilter = {}) {
    const {
      userEmail,
      status,
      provider,
      templateId,
      fromDate,
      toDate,
      page = 1,
      limit = 50
    } = filter;

    try {
      const where: any = {};

      if (userEmail) where.userEmail = userEmail;
      if (status) where.status = status;
      if (provider) where.provider = provider;
      if (templateId) where.templateId = templateId;
      
      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = fromDate;
        if (toDate) where.createdAt.lte = toDate;
      }

      const [totalCount, mailHistory] = await Promise.all([
        this.prisma.mailHistory.count({ where }),
        this.prisma.mailHistory.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            users: {
              select: {
                email: true,
                name: true
              }
            }
          }
        })
      ]);

      return {
        data: mailHistory,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      console.error('메일 히스토리 조회 실패:', error);
      throw error;
    }
  }

  async getMailHistoryById(id: number) {
    try {
      const mailHistory = await this.prisma.mailHistory.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              email: true,
              name: true
            }
          }
        }
      });

      return mailHistory;
    } catch (error) {
      console.error('메일 히스토리 상세 조회 실패:', error);
      throw error;
    }
  }

  async getMailStatistics(userEmail?: string, fromDate?: Date, toDate?: Date) {
    try {
      const where: any = {};
      
      if (userEmail) where.userEmail = userEmail;
      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = fromDate;
        if (toDate) where.createdAt.lte = toDate;
      }

      const [statusStats, providerStats, dailyStats] = await Promise.all([
        // 상태별 통계
        this.prisma.mailHistory.groupBy({
          by: ['status'],
          where,
          _count: {
            id: true
          }
        }),
        
        // 프로바이더별 통계
        this.prisma.mailHistory.groupBy({
          by: ['provider'],
          where,
          _count: {
            id: true
          }
        }),
        
        // 일별 통계 (최근 30일)
        this.prisma.$queryRaw`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as count,
            COUNT(CASE WHEN status = 'SENT' THEN 1 END) as sent_count,
            COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_count
          FROM mailHistory
          WHERE created_at >= NOW() - INTERVAL '30 days'
          ${userEmail ? `AND user_email = '${userEmail}'` : ''}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
          LIMIT 30
        `
      ]);

      return {
        statusStats: statusStats.reduce((acc: any, stat: any) => {
          acc[stat.status as keyof typeof MailStatus] = stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        
        providerStats: providerStats.reduce((acc: any, stat: any) => {
          acc[stat.provider as keyof typeof MailProvider] = stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        
        dailyStats
      };
    } catch (error) {
      console.error('메일 통계 조회 실패:', error);
      throw error;
    }
  }

  async deleteOldHistory(daysToKeep: number = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deletedCount = await this.prisma.mailHistory.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      console.log(`${deletedCount.count}개의 오래된 메일 히스토리를 삭제했습니다.`);
      return deletedCount.count;
    } catch (error) {
      console.error('오래된 메일 히스토리 삭제 실패:', error);
      throw error;
    }
  }
}