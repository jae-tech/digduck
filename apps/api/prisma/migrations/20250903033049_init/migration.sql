/*
  Warnings:

  - The values [ONE_MONTH,THREE_MONTHS,SIX_MONTHS,TWELVE_MONTHS] on the enum `LicenseSubscriptionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."LicenseSubscriptionType_new" AS ENUM ('ONE_YEAR', 'LIFETIME');
ALTER TABLE "public"."license_subscriptions" ALTER COLUMN "subscription_type" TYPE "public"."LicenseSubscriptionType_new" USING ("subscription_type"::text::"public"."LicenseSubscriptionType_new");
ALTER TYPE "public"."LicenseSubscriptionType" RENAME TO "LicenseSubscriptionType_old";
ALTER TYPE "public"."LicenseSubscriptionType_new" RENAME TO "LicenseSubscriptionType";
DROP TYPE "public"."LicenseSubscriptionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "nickname" TEXT;
