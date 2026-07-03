import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { CharacterSheetSchema, toDbCharacterInput } from "../../shared/characterSchema.js";

const MARIA_JSON_PATH = path.resolve(process.cwd(), "assets/characters/maria/maria.json");

describe("Character sheet: Maria", () => {
  it("validates against the character sheet schema", async () => {
    const raw = await readFile(MARIA_JSON_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    const result = CharacterSheetSchema.safeParse(parsed);

    expect(result.success).toBe(true);
  });

  it("is flagged as AI and an adult", async () => {
    const raw = await readFile(MARIA_JSON_PATH, "utf-8");
    const sheet = CharacterSheetSchema.parse(JSON.parse(raw));

    expect(sheet.isAI).toBe(true);
    expect(sheet.age).toBeGreaterThanOrEqual(18);
  });

  it("maps down to a DB-shaped input with JSON-encoded array fields", async () => {
    const raw = await readFile(MARIA_JSON_PATH, "utf-8");
    const sheet = CharacterSheetSchema.parse(JSON.parse(raw));
    const dbInput = toDbCharacterInput(sheet);

    expect(typeof dbInput.hobbies).toBe("string");
    expect(JSON.parse(dbInput.hobbies)).toEqual(sheet.hobbies);
    expect(dbInput.name).toBe("Maria");
  });

  it("rejects a sheet with age under 18", () => {
    const invalid = {
      name: "Test",
      isAI: true,
      age: 16,
      heightCm: 160,
      weightKg: 50,
      nationality: { ethnicity: "x", bornIn: "x", currentBase: "x", languages: ["en"] },
      personality: "x",
      hobbies: ["x"],
      speechStyle: "x",
      favoriteFoods: ["x"],
      dislikedFoods: [],
      trainingRoutine: "x",
      tennisHistory: "x",
      brandColor: "#000000",
      fashionStyle: "x",
      hairStyle: "x",
      faceFeatures: "x",
      eyeDescription: "x",
      skinDescription: "x",
      accessories: [],
      worldview: "x",
    };

    const result = CharacterSheetSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
