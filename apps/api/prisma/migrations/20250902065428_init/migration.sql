-- CreateEnum
CREATE TYPE "public"."BillingCycle" AS ENUM ('ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'TWELVE_MONTHS');

-- CreateEnum
CREATE TYPE "public"."CrawlStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ItemType" AS ENUM ('SMARTSTORE_CRAWLER', 'SUBSCRIPTION_EXTENSION', 'EXTRA_DEVICE', 'ADMIN_ACCESS');

-- CreateEnum
CREATE TYPE "public"."LicenseSubscriptionType" AS ENUM ('ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'TWELVE_MONTHS');

-- CreateEnum
CREATE TYPE "public"."PlatformType" AS ENUM ('WEB', 'DESKTOP');

-- CreateEnum
CREATE TYPE "public"."SourceSite" AS ENUM ('SMARTSTORE', 'COUPANG', 'GMARKET', 'AUCTION', 'ELEVENST');

-- CreateEnum
CREATE TYPE "public"."MailStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'OPENED', 'CLICKED');

-- CreateEnum
CREATE TYPE "public"."MailProvider" AS ENUM ('SMTP', 'GMAIL', 'OUTLOOK', 'ZOHO');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateTable
CREATE TABLE "public"."competitor_offers" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "crawl_job_id" INTEGER,
    "competitor_name" TEXT NOT NULL,
    "competitor_url" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitor_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crawl_history" (
    "id" SERIAL NOT NULL,
    "user_email" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "source_site" "public"."SourceSite" NOT NULL DEFAULT 'SMARTSTORE',
    "search_url" TEXT NOT NULL,
    "search_keywords" TEXT,
    "status" "public"."CrawlStatus" NOT NULL DEFAULT 'PENDING',
    "items_found" INTEGER NOT NULL DEFAULT 0,
    "items_crawled" INTEGER NOT NULL DEFAULT 0,
    "pages_processed" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "error_message" TEXT,
    "error_details" JSONB,
    "user_agent" TEXT,
    "proxy_used" TEXT,
    "request_interval" INTEGER,
    "crawl_settings" JSONB,
    "metadata" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crawl_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crawl_items" (
    "id" SERIAL NOT NULL,
    "crawl_history_id" INTEGER NOT NULL,
    "item_id" TEXT,
    "title" TEXT,
    "content" TEXT,
    "url" TEXT,
    "rating" DECIMAL(3,2),
    "review_date" DATE,
    "reviewer_name" TEXT,
    "is_verified" BOOLEAN,
    "price" DECIMAL(10,2),
    "original_price" DECIMAL(10,2),
    "discount" INTEGER,
    "stock" INTEGER,
    "image_urls" JSONB,
    "video_urls" JSONB,
    "site_specific_data" JSONB,
    "item_order" INTEGER,
    "page_number" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crawl_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crawl_jobs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "error_msg" TEXT,
    "status" "public"."CrawlStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "crawl_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crawl_templates" (
    "id" SERIAL NOT NULL,
    "user_email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source_site" "public"."SourceSite" NOT NULL,
    "max_pages" INTEGER NOT NULL DEFAULT 10,
    "max_items" INTEGER NOT NULL DEFAULT 2000,
    "request_delay" INTEGER NOT NULL DEFAULT 1000,
    "filters" JSONB,
    "selectors" JSONB,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crawl_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."device_transfers" (
    "id" SERIAL NOT NULL,
    "user_email" TEXT NOT NULL,
    "old_device_id" TEXT NOT NULL,
    "new_device_id" TEXT NOT NULL,
    "platform" "public"."PlatformType" NOT NULL,
    "transfer_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."license_items" (
    "id" SERIAL NOT NULL,
    "user_email" TEXT NOT NULL,
    "item_type" "public"."ItemType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "license_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."license_subscriptions" (
    "id" SERIAL NOT NULL,
    "user_email" TEXT NOT NULL,
    "subscription_type" "public"."LicenseSubscriptionType" NOT NULL,
    "start_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "payment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "license_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."license_users" (
    "email" TEXT NOT NULL,
    "license_key" TEXT NOT NULL,
    "allowed_devices" INTEGER NOT NULL DEFAULT 3,
    "max_transfers" INTEGER NOT NULL DEFAULT 5,
    "activated_devices" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "license_users_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "public"."plans" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "features" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "billing_cycle" "public"."BillingCycle" NOT NULL DEFAULT 'ONE_MONTH',

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."price_change_logs" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "old_price" DECIMAL(10,2) NOT NULL,
    "new_price" DECIMAL(10,2) NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "smart_store_product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "current_price" DECIMAL(10,2) NOT NULL,
    "target_price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "id" SERIAL NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "start_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" DATE,
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."mail_history" (
    "id" SERIAL NOT NULL,
    "user_email" TEXT,
    "from_email" TEXT NOT NULL,
    "to_email" TEXT NOT NULL,
    "cc_emails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bcc_emails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subject" TEXT NOT NULL,
    "template_id" TEXT,
    "template_vars" JSONB,
    "provider" "public"."MailProvider" NOT NULL,
    "message_id" TEXT,
    "status" "public"."MailStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crawl_history_created_at_idx" ON "public"."crawl_history"("created_at");

-- CreateIndex
CREATE INDEX "crawl_history_device_id_idx" ON "public"."crawl_history"("device_id");

-- CreateIndex
CREATE INDEX "crawl_history_source_site_idx" ON "public"."crawl_history"("source_site");

-- CreateIndex
CREATE INDEX "crawl_history_status_idx" ON "public"."crawl_history"("status");

-- CreateIndex
CREATE INDEX "crawl_history_user_email_idx" ON "public"."crawl_history"("user_email");

-- CreateIndex
CREATE INDEX "crawl_items_crawl_history_id_idx" ON "public"."crawl_items"("crawl_history_id");

-- CreateIndex
CREATE INDEX "crawl_items_item_id_idx" ON "public"."crawl_items"("item_id");

-- CreateIndex
CREATE INDEX "crawl_items_price_idx" ON "public"."crawl_items"("price");

-- CreateIndex
CREATE INDEX "crawl_items_rating_idx" ON "public"."crawl_items"("rating");

-- CreateIndex
CREATE INDEX "crawl_items_review_date_idx" ON "public"."crawl_items"("review_date");

-- CreateIndex
CREATE INDEX "crawl_templates_is_public_idx" ON "public"."crawl_templates"("is_public");

-- CreateIndex
CREATE INDEX "crawl_templates_source_site_idx" ON "public"."crawl_templates"("source_site");

-- CreateIndex
CREATE INDEX "crawl_templates_user_email_idx" ON "public"."crawl_templates"("user_email");

-- CreateIndex
CREATE UNIQUE INDEX "license_users_license_key_key" ON "public"."license_users"("license_key");

-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "public"."plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "mail_history_user_email_idx" ON "public"."mail_history"("user_email");

-- CreateIndex
CREATE INDEX "mail_history_status_idx" ON "public"."mail_history"("status");

-- CreateIndex
CREATE INDEX "mail_history_created_at_idx" ON "public"."mail_history"("created_at");

-- CreateIndex
CREATE INDEX "mail_history_template_id_idx" ON "public"."mail_history"("template_id");

-- AddForeignKey
ALTER TABLE "public"."competitor_offers" ADD CONSTRAINT "competitor_offers_crawl_job_id_fkey" FOREIGN KEY ("crawl_job_id") REFERENCES "public"."crawl_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."competitor_offers" ADD CONSTRAINT "competitor_offers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crawl_history" ADD CONSTRAINT "crawl_history_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crawl_items" ADD CONSTRAINT "crawl_items_crawl_history_id_fkey" FOREIGN KEY ("crawl_history_id") REFERENCES "public"."crawl_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crawl_jobs" ADD CONSTRAINT "crawl_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crawl_templates" ADD CONSTRAINT "crawl_templates_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."device_transfers" ADD CONSTRAINT "device_transfers_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "public"."license_users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."license_items" ADD CONSTRAINT "license_items_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "public"."license_users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."license_subscriptions" ADD CONSTRAINT "license_subscriptions_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "public"."license_users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."license_users" ADD CONSTRAINT "license_users_email_fkey" FOREIGN KEY ("email") REFERENCES "public"."users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."price_change_logs" ADD CONSTRAINT "price_change_logs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mail_history" ADD CONSTRAINT "mail_history_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE SET NULL ON UPDATE CASCADE;
