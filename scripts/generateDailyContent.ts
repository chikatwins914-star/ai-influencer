/**
 * CLI entry point for daily content generation — the "one button" job
 * described in the automation spec, runnable without the API server.
 *
 * Usage:
 *   npx tsx scripts/generateDailyContent.ts --character=Maria [--date=2026-07-04]
 */
import { prisma } from "../src/utils/prisma.js";
import { logger } from "../src/utils/logger.js";
import { persistDailyContentPlan } from "../src/services/promptService.js";

function parseArg(name: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg?.split("=")[1];
}

async function main() {
  const characterName = parseArg("character") ?? "Maria";
  const date = parseArg("date") ?? new Date().toISOString().slice(0, 10);

  const character = await prisma.character.findFirst({ where: { name: characterName } });
  if (!character) {
    throw new Error(`Character "${characterName}" not found. Run database/seed.ts first.`);
  }

  const result = await persistDailyContentPlan(character.id, date);
  logger.info(
    { date, images: result.images.length, videos: result.videos.length, stories: result.stories.length },
    `✅ Daily content plan ready — see ${result.outputPath}`
  );
}

main()
  .catch((err: unknown) => {
    logger.error({ err }, "Daily content generation failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
