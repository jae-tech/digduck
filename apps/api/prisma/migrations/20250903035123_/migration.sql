/*
  Warnings:

  - You are about to drop the column `payment_id` on the `license_subscriptions` table. All the data in the column will be lost.
  - The primary key for the `license_users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `email` on the `license_users` table. All the data in the column will be lost.
  - Added the required column `user_email` to the `license_users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."device_transfers" DROP CONSTRAINT "device_transfers_user_email_fkey";

-- DropForeignKey
ALTER TABLE "public"."license_items" DROP CONSTRAINT "license_items_user_email_fkey";

-- DropForeignKey
ALTER TABLE "public"."license_subscriptions" DROP CONSTRAINT "license_subscriptions_user_email_fkey";

-- DropForeignKey
ALTER TABLE "public"."license_users" DROP CONSTRAINT "license_users_email_fkey";

-- AlterTable
ALTER TABLE "public"."license_subscriptions" DROP COLUMN "payment_id";

-- AlterTable
ALTER TABLE "public"."license_users" DROP CONSTRAINT "license_users_pkey",
DROP COLUMN "email",
ADD COLUMN     "user_email" TEXT NOT NULL,
ADD CONSTRAINT "license_users_pkey" PRIMARY KEY ("user_email");

-- AddForeignKey
ALTER TABLE "public"."device_transfers" ADD CONSTRAINT "device_transfers_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "public"."license_users"("user_email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."license_items" ADD CONSTRAINT "license_items_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "public"."license_users"("user_email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."license_subscriptions" ADD CONSTRAINT "license_subscriptions_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "public"."license_users"("user_email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."license_users" ADD CONSTRAINT "license_users_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE CASCADE ON UPDATE CASCADE;
