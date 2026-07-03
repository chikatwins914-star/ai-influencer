/**
 * Seeds character sheets from assets/characters/*/*.json into the database.
 * Run with: npx tsx database/seed.ts
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import { loadCharacterSheet, upsertCharacter } from "../src/services/characterService.js";
import { logger } from "../src/utils/logger.js";
import { prisma } from "../src/utils/prisma.js";

const CHARACTERS_DIR = path.resolve(process.cwd(), "assets/characters");

async function main() {
  const dirs = await readdir(CHARACTERS_DIR, { withFileTypes: true });

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;

    const jsonPath = path.join(CHARACTERS_DIR, dir.name, `${dir.name}.json`);

    try {
      const sheet = await loadCharacterSheet(jsonPath);
      await upsertCharacter(sheet);
    } catch (err) {
      logger.error({ err, jsonPath }, "Skipping character — failed to load/seed");
    }
  }
}

main()
  .then(() => {
    logger.info("Seeding complete");
  })
  .catch((err: unknown) => {
    logger.error({ err }, "Seeding failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
