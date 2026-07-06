import type { ContentGenre } from "./types.js";
import { GENRE_VARIANTS, GENRE_HASHTAGS, type SceneVariant } from "./promptVariables.js";

/**
 * Minimal shape needed to build prompts — matches the deserialized
 * Character DB record (array fields already parsed back from JSON).
 */
export interface CharacterForPrompt {
  name: string;
  age: number;
  hairStyle: string;
  faceFeatures: string;
  eyeDescription: string;
  skinDescription: string;
  accessories: string[];
  fashionStyle: string;
}

/**
 * The fixed identity block. This exact wording (mirroring
 * assets/characters/maria/visual-reference.md) must appear in every
 * image/video prompt to keep the character visually consistent.
 */
export function buildBaseIdentityPrompt(character: CharacterForPrompt): string {
  const accessories = character.accessories.join(", ");
  return [
    `a young woman in her early ${Math.floor(character.age / 10) * 10}s, mixed Japanese-Brazilian ethnicity`,
    character.hairStyle,
    character.eyeDescription,
    character.skinDescription,
    character.faceFeatures,
    "athletic slender toned physique with a defined waist",
    accessories ? `wearing ${accessories}` : "",
    "consistent facial identity across all images, genuine warm smile",
  ]
    .filter(Boolean)
    .join(", ");
}

export const STANDARD_NEGATIVE_PROMPT =
  "deformed face, asymmetrical eyes, inconsistent facial features, extra fingers, extra limbs, " +
  "blurry, low quality, watermark, text overlay, unrealistic anatomy, plastic skin, over-smoothed skin, " +
  "different hair color, different face shape, mutated hands";

/**
 * Deterministic pseudo-random picker (mulberry32) so the same
 * (characterId, genre, dayIndex, slotIndex) always yields the same
 * scene variant — useful for reproducible daily batches and tests,
 * while still rotating through the variant pool across a day's output.
 */
function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return h;
}

export function pickSceneVariant(genre: ContentGenre, seedKey: string): SceneVariant {
  const pool = GENRE_VARIANTS[genre];
  const rng = mulberry32(hashSeed(seedKey));
  const index = Math.floor(rng() * pool.length);
  const variant = pool[Math.min(index, pool.length - 1)];
  if (!variant) throw new Error(`No scene variants configured for genre ${genre}`);
  return variant;
}

/**
 * The set of camera angles generated together for a single scene — one
 * generation produces one image per entry here, all sharing the same
 * location/outfit/lighting/action, so a "moment" reads like a real photo
 * dump instead of a single isolated shot.
 */
export const ANGLE_VARIANTS = [
  "front-facing, eye-level medium shot, direct gaze at camera",
  "captured from the side, profile angle, full body shot",
  "captured from a higher angle looking down, dynamic full-body shot",
  "extreme close-up on the face, capturing detailed expression",
] as const;

export function buildImagePrompt(
  character: CharacterForPrompt,
  genre: ContentGenre,
  seedKey: string,
  cameraFramingOverride?: string
): {
  prompt: string;
  negativePrompt: string;
  variant: SceneVariant;
} {
  const variant = pickSceneVariant(genre, seedKey);
  const base = buildBaseIdentityPrompt(character);

  const prompt = [
    base,
    variant.action,
    `wearing ${variant.outfit}`,
    `at ${variant.location}`,
    variant.lighting,
    cameraFramingOverride ?? variant.cameraFraming,
    "an expensive lifestyle moment captured by accident, like a real travel memory rather than a staged photoshoot",
    "ultra-photorealistic smartphone photography shot on an iPhone 17 Pro Max",
    "natural imperfections, realistic asymmetry, authentic candid moment, natural lighting, fox-effect eyelashes",
    "raw unedited photo aesthetic, no artificial beauty retouching, no studio perfection",
  ].join(", ");

  return { prompt, negativePrompt: STANDARD_NEGATIVE_PROMPT, variant };
}

export function buildHashtags(genre: ContentGenre): string[] {
  return [...GENRE_HASHTAGS[genre], "#ai", "#digitalcharacter"];
}
