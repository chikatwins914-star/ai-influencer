import { z } from "zod";

/**
 * Full character "sheet" schema — this is richer than the Prisma Character
 * model (it includes narrative/reference metadata used for prompt authoring,
 * e.g. nationality details, reference image paths). Use
 * `toDbCharacterInput()` below to map down to the fields the database
 * actually persists.
 */
export const CharacterSheetSchema = z.object({
  name: z.string().min(1),
  isAI: z.literal(true), // hard constraint: this system never models real people
  age: z.number().int().min(18, "Characters must be modeled as adults (18+)"),
  heightCm: z.number().int().positive(),
  weightKg: z.number().int().positive(),
  nationality: z.object({
    ethnicity: z.string(),
    bornIn: z.string(),
    currentBase: z.string(),
    languages: z.array(z.string()).min(1),
  }),
  personality: z.string().min(1),
  hobbies: z.array(z.string()).min(1),
  speechStyle: z.string().min(1),
  favoriteFoods: z.array(z.string()).min(1),
  dislikedFoods: z.array(z.string()),
  trainingRoutine: z.string().min(1),
  tennisHistory: z.string().min(1),
  brandColor: z.string().min(1),
  fashionStyle: z.string().min(1),
  hairStyle: z.string().min(1),
  faceFeatures: z.string().min(1),
  eyeDescription: z.string().min(1),
  skinDescription: z.string().min(1),
  accessories: z.array(z.string()),
  worldview: z.string().min(1),
  visualReferenceDoc: z.string().optional(),
  referenceImages: z.array(z.string()).optional(),
});

export type CharacterSheet = z.infer<typeof CharacterSheetSchema>;

/**
 * Maps a full character sheet down to exactly the fields stored in the
 * `Character` Prisma model. Array fields are JSON-encoded because SQLite
 * has no native array/text[] type.
 */
export function toDbCharacterInput(sheet: CharacterSheet) {
  return {
    name: sheet.name,
    isAI: sheet.isAI,
    age: sheet.age,
    heightCm: sheet.heightCm,
    weightKg: sheet.weightKg,
    personality: sheet.personality,
    hobbies: JSON.stringify(sheet.hobbies),
    speechStyle: sheet.speechStyle,
    favoriteFoods: JSON.stringify(sheet.favoriteFoods),
    dislikedFoods: JSON.stringify(sheet.dislikedFoods),
    trainingRoutine: sheet.trainingRoutine,
    tennisHistory: sheet.tennisHistory,
    brandColor: sheet.brandColor,
    fashionStyle: sheet.fashionStyle,
    hairStyle: sheet.hairStyle,
    faceFeatures: sheet.faceFeatures,
    eyeDescription: sheet.eyeDescription,
    skinDescription: sheet.skinDescription,
    accessories: JSON.stringify(sheet.accessories),
    worldview: sheet.worldview,
  };
}
