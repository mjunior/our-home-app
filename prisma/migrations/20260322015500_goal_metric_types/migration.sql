-- Goal metrics (percentage | quantity | occurrence)
ALTER TABLE "Goal" ADD COLUMN "metricType" TEXT NOT NULL DEFAULT 'PERCENTAGE';
ALTER TABLE "Goal" ADD COLUMN "metricValue" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Goal" ADD COLUMN "metricTarget" INTEGER;
