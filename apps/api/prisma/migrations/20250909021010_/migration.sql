/*
  Warnings:

  - A unique constraint covering the columns `[device_id,license_key]` on the table `devices` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."devices_device_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "devices_device_id_license_key_key" ON "public"."devices"("device_id", "license_key");
