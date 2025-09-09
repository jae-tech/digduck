-- CreateEnum
CREATE TYPE "public"."LicenseStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."LicenseSubscriptionType" AS ENUM ('BASIC', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."PlatformType" AS ENUM ('WINDOWS', 'MACOS', 'LINUX', 'WEB');

-- CreateEnum
CREATE TYPE "public"."ItemType" AS ENUM ('EXTRA_DEVICE', 'SUBSCRIPTION_EXTENSION');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."JobType" AS ENUM ('FULL_CRAWL', 'UPDATE_CRAWL', 'TARGETED_CRAWL');

-- CreateEnum
CREATE TYPE "public"."TargetType" AS ENUM ('URL', 'KEYWORD', 'CATEGORY', 'STORE_ID');

-- CreateEnum
CREATE TYPE "public"."UsageType" AS ENUM ('CRAWL_COUNT', 'DATA_POINTS', 'API_CALLS');

-- CreateEnum
CREATE TYPE "public"."Period" AS ENUM ('DAILY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('JOB_COMPLETED', 'QUOTA_WARNING', 'LICENSE_EXPIRING', 'SYSTEM_MAINTENANCE');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "nickname" TEXT,
    "avatar" TEXT,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."services" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'crawling',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscription_plans" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration" INTEGER,
    "price" DECIMAL(10,2) NOT NULL,
    "discount" DOUBLE PRECISION,
    "features" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."addon_products" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addon_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."licenses" (
    "id" SERIAL NOT NULL,
    "user_email" TEXT NOT NULL,
    "license_key" TEXT NOT NULL,
    "service_id" INTEGER NOT NULL,
    "subscription_plan_id" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "max_devices" INTEGER NOT NULL DEFAULT 3,
    "activated_devices" JSONB NOT NULL DEFAULT '[]',
    "max_transfers" INTEGER NOT NULL DEFAULT 5,
    "extra_devices_purchased" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."license_addons" (
    "id" SERIAL NOT NULL,
    "license_key" TEXT NOT NULL,
    "addon_product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "purchase_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "license_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crawl_projects" (
    "id" SERIAL NOT NULL,
    "user_email" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "service_id" INTEGER NOT NULL,
    "description" TEXT,
    "config" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crawl_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crawl_targets" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "target_type" "public"."TargetType" NOT NULL,
    "target_value" TEXT NOT NULL,
    "target_config" JSONB,
    "schedule" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_crawled" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crawl_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crawl_jobs" (
    "id" SERIAL NOT NULL,
    "user_email" TEXT NOT NULL,
    "project_id" INTEGER,
    "target_id" INTEGER,
    "service_id" INTEGER NOT NULL,
    "job_type" "public"."JobType" NOT NULL,
    "config" JSONB NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "total_items" INTEGER NOT NULL DEFAULT 0,
    "processed_items" INTEGER NOT NULL DEFAULT 0,
    "success_items" INTEGER NOT NULL DEFAULT 0,
    "failed_items" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "estimated_time" INTEGER,
    "error_code" TEXT,
    "error_message" TEXT,
    "error_details" JSONB,
    "user_agent" TEXT,
    "proxy_used" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crawl_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crawl_results" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "item_id" TEXT,
    "item_type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "metadata" JSONB,
    "quality" DOUBLE PRECISION,
    "item_order" INTEGER,
    "page_number" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crawl_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usage_stats" (
    "id" SERIAL NOT NULL,
    "user_email" TEXT NOT NULL,
    "license_key" TEXT NOT NULL,
    "service_id" INTEGER NOT NULL,
    "usage_type" "public"."UsageType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "period" "public"."Period" NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" SERIAL NOT NULL,
    "user_email" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "services_code_key" ON "public"."services"("code");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_code_key" ON "public"."subscription_plans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "addon_products_code_key" ON "public"."addon_products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "licenses_license_key_key" ON "public"."licenses"("license_key");

-- CreateIndex
CREATE INDEX "licenses_user_email_idx" ON "public"."licenses"("user_email");

-- CreateIndex
CREATE INDEX "licenses_service_id_idx" ON "public"."licenses"("service_id");

-- CreateIndex
CREATE INDEX "licenses_subscription_plan_id_idx" ON "public"."licenses"("subscription_plan_id");

-- CreateIndex
CREATE INDEX "license_addons_license_key_idx" ON "public"."license_addons"("license_key");

-- CreateIndex
CREATE INDEX "license_addons_addon_product_id_idx" ON "public"."license_addons"("addon_product_id");

-- CreateIndex
CREATE INDEX "crawl_projects_user_email_idx" ON "public"."crawl_projects"("user_email");

-- CreateIndex
CREATE INDEX "crawl_projects_service_id_idx" ON "public"."crawl_projects"("service_id");

-- CreateIndex
CREATE INDEX "crawl_targets_project_id_idx" ON "public"."crawl_targets"("project_id");

-- CreateIndex
CREATE INDEX "crawl_targets_target_type_idx" ON "public"."crawl_targets"("target_type");

-- CreateIndex
CREATE INDEX "crawl_jobs_user_email_idx" ON "public"."crawl_jobs"("user_email");

-- CreateIndex
CREATE INDEX "crawl_jobs_status_idx" ON "public"."crawl_jobs"("status");

-- CreateIndex
CREATE INDEX "crawl_jobs_service_id_idx" ON "public"."crawl_jobs"("service_id");

-- CreateIndex
CREATE INDEX "crawl_jobs_created_at_idx" ON "public"."crawl_jobs"("created_at");

-- CreateIndex
CREATE INDEX "crawl_results_job_id_idx" ON "public"."crawl_results"("job_id");

-- CreateIndex
CREATE INDEX "crawl_results_item_type_idx" ON "public"."crawl_results"("item_type");

-- CreateIndex
CREATE INDEX "crawl_results_item_id_idx" ON "public"."crawl_results"("item_id");

-- CreateIndex
CREATE INDEX "usage_stats_user_email_idx" ON "public"."usage_stats"("user_email");

-- CreateIndex
CREATE INDEX "usage_stats_service_id_idx" ON "public"."usage_stats"("service_id");

-- CreateIndex
CREATE INDEX "usage_stats_period_start_idx" ON "public"."usage_stats"("period_start");

-- CreateIndex
CREATE UNIQUE INDEX "usage_stats_user_email_license_key_service_id_usage_type_pe_key" ON "public"."usage_stats"("user_email", "license_key", "service_id", "usage_type", "period_start");

-- CreateIndex
CREATE INDEX "notifications_user_email_idx" ON "public"."notifications"("user_email");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "public"."notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "public"."notifications"("created_at");

-- AddForeignKey
ALTER TABLE "public"."licenses" ADD CONSTRAINT "licenses_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."licenses" ADD CONSTRAINT "licenses_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."licenses" ADD CONSTRAINT "licenses_subscription_plan_id_fkey" FOREIGN KEY ("subscription_plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."license_addons" ADD CONSTRAINT "license_addons_license_key_fkey" FOREIGN KEY ("license_key") REFERENCES "public"."licenses"("license_key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."license_addons" ADD CONSTRAINT "license_addons_addon_product_id_fkey" FOREIGN KEY ("addon_product_id") REFERENCES "public"."addon_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crawl_projects" ADD CONSTRAINT "crawl_projects_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crawl_projects" ADD CONSTRAINT "crawl_projects_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crawl_targets" ADD CONSTRAINT "crawl_targets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."crawl_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crawl_jobs" ADD CONSTRAINT "crawl_jobs_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crawl_jobs" ADD CONSTRAINT "crawl_jobs_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crawl_jobs" ADD CONSTRAINT "crawl_jobs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."crawl_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crawl_jobs" ADD CONSTRAINT "crawl_jobs_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "public"."crawl_targets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crawl_results" ADD CONSTRAINT "crawl_results_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."crawl_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usage_stats" ADD CONSTRAINT "usage_stats_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usage_stats" ADD CONSTRAINT "usage_stats_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usage_stats" ADD CONSTRAINT "usage_stats_license_key_fkey" FOREIGN KEY ("license_key") REFERENCES "public"."licenses"("license_key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE CASCADE ON UPDATE CASCADE;
