-- AlterTable
ALTER TABLE "analytics_snapshots" ADD COLUMN     "ttViews" INTEGER,
ADD COLUMN     "ttLikes" INTEGER,
ADD COLUMN     "ttFollowerGrowth" INTEGER,
ADD COLUMN     "ttEngagementRate" DOUBLE PRECISION;
