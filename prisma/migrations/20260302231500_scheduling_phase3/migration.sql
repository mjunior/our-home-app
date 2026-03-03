-- Phase 3 scheduling structures
CREATE TABLE IF NOT EXISTS "InstallmentPlan" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "householdId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "totalAmount" DECIMAL NOT NULL,
  "installmentsCount" INTEGER NOT NULL,
  "startMonth" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "accountId" TEXT,
  "creditCardId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "RecurringRule" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "householdId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL NOT NULL,
  "startMonth" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "accountId" TEXT,
  "creditCardId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "revisionOfRuleId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ScheduledInstance" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "householdId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "monthKey" TEXT NOT NULL,
  "occurredAt" DATETIME NOT NULL,
  "kind" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL NOT NULL,
  "categoryId" TEXT NOT NULL,
  "accountId" TEXT,
  "creditCardId" TEXT,
  "instanceKey" TEXT NOT NULL,
  "locked" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ScheduledInstance_instanceKey_key" ON "ScheduledInstance"("instanceKey");
