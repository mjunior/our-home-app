-- Phase 13 scope hardening migration (SQLite)
-- 1) Reassign legacy household-main data to an existing owner household when possible.
-- 2) Remove orphan/ambiguous rows that still do not belong to a valid household.

UPDATE "Account"
SET "householdId" = (
  SELECT "householdId" FROM "User" ORDER BY "createdAt" ASC LIMIT 1
)
WHERE "householdId" = 'household-main'
  AND EXISTS (SELECT 1 FROM "User");

UPDATE "CreditCard"
SET "householdId" = (
  SELECT "householdId" FROM "User" ORDER BY "createdAt" ASC LIMIT 1
)
WHERE "householdId" = 'household-main'
  AND EXISTS (SELECT 1 FROM "User");

UPDATE "Category"
SET "householdId" = (
  SELECT "householdId" FROM "User" ORDER BY "createdAt" ASC LIMIT 1
)
WHERE "householdId" = 'household-main'
  AND EXISTS (SELECT 1 FROM "User");

UPDATE "Transaction"
SET "householdId" = (
  SELECT "householdId" FROM "User" ORDER BY "createdAt" ASC LIMIT 1
)
WHERE "householdId" = 'household-main'
  AND EXISTS (SELECT 1 FROM "User");

UPDATE "InstallmentPlan"
SET "householdId" = (
  SELECT "householdId" FROM "User" ORDER BY "createdAt" ASC LIMIT 1
)
WHERE "householdId" = 'household-main'
  AND EXISTS (SELECT 1 FROM "User");

UPDATE "RecurringRule"
SET "householdId" = (
  SELECT "householdId" FROM "User" ORDER BY "createdAt" ASC LIMIT 1
)
WHERE "householdId" = 'household-main'
  AND EXISTS (SELECT 1 FROM "User");

UPDATE "ScheduledInstance"
SET "householdId" = (
  SELECT "householdId" FROM "User" ORDER BY "createdAt" ASC LIMIT 1
)
WHERE "householdId" = 'household-main'
  AND EXISTS (SELECT 1 FROM "User");

DELETE FROM "Transaction"
WHERE "householdId" NOT IN (SELECT "id" FROM "Household")
  OR ("accountId" IS NOT NULL AND "accountId" NOT IN (SELECT "id" FROM "Account"))
  OR ("creditCardId" IS NOT NULL AND "creditCardId" NOT IN (SELECT "id" FROM "CreditCard"))
  OR "categoryId" NOT IN (SELECT "id" FROM "Category");

DELETE FROM "ScheduledInstance"
WHERE "householdId" NOT IN (SELECT "id" FROM "Household")
  OR ("accountId" IS NOT NULL AND "accountId" NOT IN (SELECT "id" FROM "Account"))
  OR ("creditCardId" IS NOT NULL AND "creditCardId" NOT IN (SELECT "id" FROM "CreditCard"))
  OR "categoryId" NOT IN (SELECT "id" FROM "Category");

DELETE FROM "InstallmentPlan"
WHERE "householdId" NOT IN (SELECT "id" FROM "Household")
  OR ("accountId" IS NOT NULL AND "accountId" NOT IN (SELECT "id" FROM "Account"))
  OR ("creditCardId" IS NOT NULL AND "creditCardId" NOT IN (SELECT "id" FROM "CreditCard"))
  OR "categoryId" NOT IN (SELECT "id" FROM "Category");

DELETE FROM "RecurringRule"
WHERE "householdId" NOT IN (SELECT "id" FROM "Household")
  OR ("accountId" IS NOT NULL AND "accountId" NOT IN (SELECT "id" FROM "Account"))
  OR ("creditCardId" IS NOT NULL AND "creditCardId" NOT IN (SELECT "id" FROM "CreditCard"))
  OR "categoryId" NOT IN (SELECT "id" FROM "Category");

DELETE FROM "Account" WHERE "householdId" NOT IN (SELECT "id" FROM "Household");
DELETE FROM "CreditCard" WHERE "householdId" NOT IN (SELECT "id" FROM "Household");
DELETE FROM "Category" WHERE "householdId" NOT IN (SELECT "id" FROM "Household");
