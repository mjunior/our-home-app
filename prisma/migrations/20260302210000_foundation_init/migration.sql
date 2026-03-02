-- Foundation init migration (SQLite)
CREATE TABLE "Account" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "householdId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "openingBalance" DECIMAL NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "CreditCard" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "householdId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "closeDay" INTEGER NOT NULL,
  "dueDay" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Category" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "householdId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalized" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Transaction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "householdId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL NOT NULL,
  "occurredAt" DATETIME NOT NULL,
  "accountId" TEXT,
  "creditCardId" TEXT,
  "categoryId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Transaction_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "CreditCard" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Account_householdId_name_key" ON "Account"("householdId", "name");
CREATE UNIQUE INDEX "CreditCard_householdId_name_key" ON "CreditCard"("householdId", "name");
CREATE UNIQUE INDEX "Category_householdId_normalized_key" ON "Category"("householdId", "normalized");
CREATE INDEX "Transaction_householdId_occurredAt_idx" ON "Transaction"("householdId", "occurredAt");
