/**
 * CLI entry point for generating the weekly analytics report from the
 * latest recorded snapshot. Record a snapshot first via
 * POST /api/analytics/snapshot or recordWeeklySnapshot().
 *
 * Usage:
 *   npx tsx scripts/generateWeeklyReport.ts
 */
import { prisma } from "../src/utils/prisma.js";
import { logger } from "../src/utils/logger.js";
import { buildWeeklyReport } from "../src/services/analyticsService.js";

async function main() {
  const result = await buildWeeklyReport();
  logger.info(result, `✅ Weekly report ready — see ${result.reportPath}`);
}

main()
  .catch((err: unknown) => {
    logger.error({ err }, "Weekly report generation failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
