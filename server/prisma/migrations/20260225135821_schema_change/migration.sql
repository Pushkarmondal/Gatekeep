/*
  Warnings:

  - A unique constraint covering the columns `[activeSubscriptionId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeSubscriptionId" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordHash" TEXT;

-- CreateIndex
CREATE INDEX "ApiKey_revoked_idx" ON "ApiKey"("revoked");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- CreateIndex
CREATE INDEX "UsageRecord_userId_idx" ON "UsageRecord"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_activeSubscriptionId_key" ON "User"("activeSubscriptionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeSubscriptionId_fkey" FOREIGN KEY ("activeSubscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
