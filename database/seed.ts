/**
 * Seeds character sheets from assets/characters/<name>/<name>.json into the database.
 * Run with: npx tsx database/seed.ts
 */
import { seedDefaultCharacters } from "../src/services/characterService.js";
import { logger } from "../src/utils/logger.js";
import { prisma } from "../src/utils/prisma.js";

seedDefaultCharacters()
  .then(({ seeded, skipped }) => {
    logger.info({ seeded, skipped }, "Seeding complete");
  })
  .catch((err: unknown) => {
    logger.error({ err }, "Seeding failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
