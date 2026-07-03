import { readFile } from "node:fs/promises";
import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import { CharacterSheetSchema, toDbCharacterInput, type CharacterSheet } from "../../shared/characterSchema.js";

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
