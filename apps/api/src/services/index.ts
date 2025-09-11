import { NaverShoppingAPI } from "@/external/apis/naver-shopping-api";
import { PrismaClient } from "@prisma/client";
import { AdminService } from "./admin.service";
import { ComparisonService } from "./comparison.service";
import { CrawlerService } from "./crawler.service";
import { LicenseService } from "./license.service";
import { NotificationService } from "./notification.service";

// API 레이어
const naverShoppingAPI = new NaverShoppingAPI();
const prisma = new PrismaClient();

// 비즈니스 서비스들
export const comparisonService = new ComparisonService(naverShoppingAPI);
export const crawlerService = new CrawlerService(prisma);
export const notificationService = new NotificationService();
export const licenseService = new LicenseService(prisma);
export const adminService = new AdminService(prisma);
