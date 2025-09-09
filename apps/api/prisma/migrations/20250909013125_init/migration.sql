/*
  Warnings:

  - The values [WINDOWS,MACOS,LINUX] on the enum `PlatformType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."PlatformType_new" AS ENUM ('DESKTOP', 'WEB');
ALTER TABLE "public"."devices" ALTER COLUMN "platform" TYPE "public"."PlatformType_new" USING ("platform"::text::"public"."PlatformType_new");
ALTER TYPE "public"."PlatformType" RENAME TO "PlatformType_old";
ALTER TYPE "public"."PlatformType_new" RENAME TO "PlatformType";
DROP TYPE "public"."PlatformType_old";
COMMIT;
