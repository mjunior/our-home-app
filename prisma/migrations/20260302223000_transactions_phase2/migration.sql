-- Phase 2 transaction enhancements (SQLite)
ALTER TABLE "Transaction" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'EXPENSE';
ALTER TABLE "Transaction" ADD COLUMN "invoiceMonthKey" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "invoiceDueDate" DATETIME;

-- Rebuild table to enforce required category relation.
PRAGMA foreign_keys=off;

CREATE TABLE "new_Transaction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "householdId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL NOT NULL,
  "occurredAt" DATETIME NOT NULL,
  "invoiceMonthKey" TEXT,
  "invoiceDueDate" DATETIME,
  "accountId" TEXT,
  "creditCardId" TEXT,
  "categoryId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Transaction_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "CreditCard" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Transaction" (
  "id", "householdId", "kind", "description", "amount", "occurredAt", "invoiceMonthKey", "invoiceDueDate", "accountId", "creditCardId", "categoryId", "createdAt", "updatedAt"
)
SELECT
  "id", "householdId", COALESCE("kind", 'EXPENSE'), "description", "amount", "occurredAt", "invoiceMonthKey", "invoiceDueDate", "accountId", "creditCardId", COALESCE("categoryId", ''), "createdAt", "updatedAt"
FROM "Transaction";

DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE INDEX "Transaction_householdId_occurredAt_idx" ON "Transaction"("householdId", "occurredAt");

PRAGMA foreign_keys=on;
