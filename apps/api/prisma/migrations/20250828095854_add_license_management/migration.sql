-- CreateEnum
CREATE TYPE "public"."LicenseSubscriptionType" AS ENUM ('ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'TWELVE_MONTHS');

-- CreateEnum
CREATE TYPE "public"."PlatformType" AS ENUM ('WEB', 'DESKTOP');

-- CreateEnum
CREATE TYPE "public"."ItemType" AS ENUM ('SMARTSTORE_CRAWLER', 'SUBSCRIPTION_EXTENSION', 'EXTRA_DEVICE');

-- CreateTable
CREATE TABLE "public"."license_users" (
    "email" TEXT NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "allowedDevices" INTEGER NOT NULL DEFAULT 3,
    "maxTransfers" INTEGER NOT NULL DEFAULT 5,
    "activatedDevices" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "license_users_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "public"."license_subscriptions" (
    "id" SERIAL NOT NULL,
    "userEmail" TEXT NOT NULL,
    "subscriptionType" "public"."LicenseSubscriptionType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "license_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."license_items" (
    "id" SERIAL NOT NULL,
    "userEmail" TEXT NOT NULL,
    "itemType" "public"."ItemType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "license_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."device_transfers" (
    "id" SERIAL NOT NULL,
    "userEmail" TEXT NOT NULL,
    "oldDeviceId" TEXT NOT NULL,
    "newDeviceId" TEXT NOT NULL,
    "platform" "public"."PlatformType" NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "license_users_licenseKey_key" ON "public"."license_users"("licenseKey");

-- AddForeignKey
ALTER TABLE "public"."license_users" ADD CONSTRAINT "license_users_email_fkey" FOREIGN KEY ("email") REFERENCES "public"."users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."license_subscriptions" ADD CONSTRAINT "license_subscriptions_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "public"."license_users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."license_items" ADD CONSTRAINT "license_items_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "public"."license_users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."device_transfers" ADD CONSTRAINT "device_transfers_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "public"."license_users"("email") ON DELETE CASCADE ON UPDATE CASCADE;
