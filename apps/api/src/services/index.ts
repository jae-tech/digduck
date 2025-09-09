import { NaverShoppingAPI } from "@/external/apis/naver-shopping-api";
import { ComparisonService } from "./comparison.service";
import { CrawlService } from "./crawl.service";
import { MailService } from "./mail.service";
import { MailTemplateService } from "./mail-template.service";
import { LicenseNotificationService } from "./license-notification.service";
import { PrismaClient } from "@prisma/client";

// 1. API 레이어
const naverShoppingAPI = new NaverShoppingAPI();
const prisma = new PrismaClient();

// 2. 비즈니스 서비스들 (의존성 수동 주입)
export const comparisonService = new ComparisonService(naverShoppingAPI);
export const crawlService = new CrawlService();
export const mailService = new MailService();
export const mailTemplateService = new MailTemplateService();
export const licenseNotificationService = new LicenseNotificationService(
  prisma
);
