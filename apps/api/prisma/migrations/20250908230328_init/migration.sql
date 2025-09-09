-- CreateEnum
CREATE TYPE "public"."DeviceStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "public"."devices" (
    "id" SERIAL NOT NULL,
    "device_id" TEXT NOT NULL,
    "license_key" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "platform" "public"."PlatformType" NOT NULL,
    "status" "public"."DeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "first_activated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devices_device_id_key" ON "public"."devices"("device_id");

-- CreateIndex
CREATE INDEX "devices_license_key_idx" ON "public"."devices"("license_key");

-- CreateIndex
CREATE INDEX "devices_status_idx" ON "public"."devices"("status");

-- AddForeignKey
ALTER TABLE "public"."devices" ADD CONSTRAINT "devices_license_key_fkey" FOREIGN KEY ("license_key") REFERENCES "public"."licenses"("license_key") ON DELETE CASCADE ON UPDATE CASCADE;
