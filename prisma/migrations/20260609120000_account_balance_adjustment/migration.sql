-- Store direct account balance adjustments separately from operational transactions (SQLite)
ALTER TABLE "Account" ADD COLUMN "balanceAdjustment" DECIMAL NOT NULL DEFAULT 0;
