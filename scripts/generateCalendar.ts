/**
 * CLI entry point for generating the 365-day content calendar.
 *
 * Usage:
 *   npx tsx scripts/generateCalendar.ts --character=Maria --start=2026-07-04 [--days=365]
 */
import { prisma } from "../src/utils/prisma.js";
import { logger } from "../src/utils/logger.js";
import { persistYearPlan } from "../src/services/calendarService.js";

function parseArg(name: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg?.split("=")[1];
}

async function main() {
  const characterName = parseArg("character") ?? "Maria";
  const startDate = parseArg("start") ?? new Date().toISOString().slice(0, 10);
  const days = Number(parseArg("days") ?? "365");

  const character = await prisma.character.findFirst({ where: { name: characterName } });
  if (!character) {
    throw new Error(`Character "${characterName}" not found. Run database/seed.ts first.`);
  }

  const result = await persistYearPlan(character.id, startDate, days);
  logger.info({ startDate, days, count: result.count }, `✅ Calendar generated (${result.count} days)`);
}

main()
  .catch((err: unknown) => {
    logger.error({ err }, "Calendar generation failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
