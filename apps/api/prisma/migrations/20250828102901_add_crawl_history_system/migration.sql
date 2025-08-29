-- CreateEnum
CREATE TYPE "public"."SourceSite" AS ENUM ('SMARTSTORE', 'COUPANG', 'GMARKET', 'AUCTION', 'ELEVENST');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."CrawlStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "public"."CrawlStatus" ADD VALUE 'CANCELLED';

-- CreateTable
CREATE TABLE "public"."crawl_history" (
    "id" SERIAL NOT NULL,
    "userEmail" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "sourceSite" "public"."SourceSite" NOT NULL DEFAULT 'SMARTSTORE',
    "searchUrl" TEXT NOT NULL,
    "searchKeywords" TEXT,
    "status" "public"."CrawlStatus" NOT NULL DEFAULT 'PENDING',
    "itemsFound" INTEGER NOT NULL DEFAULT 0,
    "itemsCrawled" INTEGER NOT NULL DEFAULT 0,
    "pagesProcessed" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    "errorDetails" JSONB,
    "userAgent" TEXT,
    "proxyUsed" TEXT,
    "requestInterval" INTEGER,
    "crawlSettings" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crawl_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crawl_items" (
    "id" SERIAL NOT NULL,
    "crawlHistoryId" INTEGER NOT NULL,
    "itemId" TEXT,
    "title" TEXT,
    "content" TEXT,
    "url" TEXT,
    "rating" DECIMAL(3,2),
    "reviewDate" TIMESTAMP(3),
    "reviewerName" TEXT,
    "isVerified" BOOLEAN,
    "price" DECIMAL(10,2),
    "originalPrice" DECIMAL(10,2),
    "discount" INTEGER,
    "stock" INTEGER,
    "imageUrls" JSONB,
    "videoUrls" JSONB,
    "siteSpecificData" JSONB,
    "itemOrder" INTEGER,
    "pageNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crawl_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crawl_templates" (
    "id" SERIAL NOT NULL,
    "userEmail" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sourceSite" "public"."SourceSite" NOT NULL,
    "maxPages" INTEGER NOT NULL DEFAULT 10,
    "maxItems" INTEGER NOT NULL DEFAULT 2000,
    "requestDelay" INTEGER NOT NULL DEFAULT 1000,
    "filters" JSONB,
    "selectors" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crawl_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crawl_history_userEmail_idx" ON "public"."crawl_history"("userEmail");

-- CreateIndex
CREATE INDEX "crawl_history_sourceSite_idx" ON "public"."crawl_history"("sourceSite");

-- CreateIndex
CREATE INDEX "crawl_history_status_idx" ON "public"."crawl_history"("status");

-- CreateIndex
CREATE INDEX "crawl_history_createdAt_idx" ON "public"."crawl_history"("createdAt");

-- CreateIndex
CREATE INDEX "crawl_history_deviceId_idx" ON "public"."crawl_history"("deviceId");

-- CreateIndex
CREATE INDEX "crawl_items_crawlHistoryId_idx" ON "public"."crawl_items"("crawlHistoryId");

-- CreateIndex
CREATE INDEX "crawl_items_itemId_idx" ON "public"."crawl_items"("itemId");

-- CreateIndex
CREATE INDEX "crawl_items_rating_idx" ON "public"."crawl_items"("rating");

-- CreateIndex
CREATE INDEX "crawl_items_reviewDate_idx" ON "public"."crawl_items"("reviewDate");

-- CreateIndex
CREATE INDEX "crawl_items_price_idx" ON "public"."crawl_items"("price");

-- CreateIndex
CREATE INDEX "crawl_templates_userEmail_idx" ON "public"."crawl_templates"("userEmail");

-- CreateIndex
CREATE INDEX "crawl_templates_sourceSite_idx" ON "public"."crawl_templates"("sourceSite");

-- CreateIndex
CREATE INDEX "crawl_templates_isPublic_idx" ON "public"."crawl_templates"("isPublic");

-- AddForeignKey
ALTER TABLE "public"."crawl_history" ADD CONSTRAINT "crawl_history_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "public"."users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crawl_items" ADD CONSTRAINT "crawl_items_crawlHistoryId_fkey" FOREIGN KEY ("crawlHistoryId") REFERENCES "public"."crawl_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crawl_templates" ADD CONSTRAINT "crawl_templates_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "public"."users"("email") ON DELETE CASCADE ON UPDATE CASCADE;
