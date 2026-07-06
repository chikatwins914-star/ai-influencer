import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import { CharacterSheetSchema, toDbCharacterInput, type CharacterSheet } from "../../shared/characterSchema.js";

const CHARACTERS_DIR = path.resolve(process.cwd(), "assets/characters");

/**
 * Loads a character sheet JSON file from disk and validates it.
 * Throws on invalid data — callers should not silently proceed with
 * a malformed/incomplete character definition.
 */
export async function loadCharacterSheet(jsonPath: string): Promise<CharacterSheet> {
  const raw = await readFile(jsonPath, "utf-8");
  const parsed = JSON.parse(raw);
  const result = CharacterSheetSchema.safeParse(parsed);

  if (!result.success) {
    logger.error({ jsonPath, issues: result.error.flatten() }, "Invalid character sheet");
    throw new Error(`Invalid character sheet at ${jsonPath}: ${result.error.message}`);
  }

  return result.data;
}

/**
 * Creates the character if it doesn't exist (matched by name), or updates
 * it in place if it does. Keeps re-running the seed idempotent.
 */
export async function upsertCharacter(sheet: CharacterSheet) {
  const dbInput = toDbCharacterInput(sheet);

  const existing = await prisma.character.findFirst({ where: { name: sheet.name } });

  if (existing) {
    const updated = await prisma.character.update({
      where: { id: existing.id },
      data: dbInput,
    });
    logger.info({ characterId: updated.id, name: updated.name }, "Character updated");
    return updated;
  }

  const created = await prisma.character.create({ data: dbInput });
  logger.info({ characterId: created.id, name: created.name }, "Character created");
  return created;
}

/**
 * Loads every character sheet bundled under assets/characters/<name>/<name>.json
 * and upserts each (by name) into the database. Safe to call repeatedly —
 * used both by the CLI seed script and by the one-time setup endpoint
 * (GET /api/characters/seed-default), since a fresh deploy's database has
 * no rows yet and nothing else populates it.
 */
export async function seedDefaultCharacters(): Promise<{ seeded: string[]; skipped: Array<{ dir: string; error: string }> }> {
  const dirs = await readdir(CHARACTERS_DIR, { withFileTypes: true });
  const seeded: string[] = [];
  const skipped: Array<{ dir: string; error: string }> = [];

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    const jsonPath = path.join(CHARACTERS_DIR, dir.name, `${dir.name}.json`);

    try {
      const sheet = await loadCharacterSheet(jsonPath);
      const character = await upsertCharacter(sheet);
      seeded.push(character.name);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err, jsonPath }, "Skipping character — failed to load/seed");
      skipped.push({ dir: dir.name, error: message });
    }
  }

  return { seeded, skipped };
}

/**
 * Convenience: parses JSON array fields back out for API responses.
 */
export function deserializeCharacter<T extends Record<string, unknown>>(character: T) {
  const arrayFields = ["hobbies", "favoriteFoods", "dislikedFoods", "accessories"] as const;
  const result: Record<string, unknown> = { ...character };

  for (const field of arrayFields) {
    const value = character[field];
    if (typeof value === "string") {
      try {
        result[field] = JSON.parse(value);
      } catch {
        result[field] = [];
      }
    }
  }

  return result;
}
