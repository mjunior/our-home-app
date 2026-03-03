-- Phase 8 investment transfer support
ALTER TABLE "Transaction" ADD COLUMN "transferGroupId" TEXT;
CREATE INDEX "Transaction_householdId_transferGroupId_idx" ON "Transaction"("householdId", "transferGroupId");
