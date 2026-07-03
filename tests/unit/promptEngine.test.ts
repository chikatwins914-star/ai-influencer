import { describe, expect, it } from "vitest";
import {
  buildBaseIdentityPrompt,
  buildImagePrompt,
  pickSceneVariant,
  STANDARD_NEGATIVE_PROMPT,
  type CharacterForPrompt,
} from "../../shared/promptEngine.js";
import { ALL_CONTENT_GENRES } from "../../shared/types.js";
import { getVideoTemplate } from "../../shared/videoPromptTemplates.js";
import { generateCaption } from "../../src/services/promptService.js";

const maria: CharacterForPrompt = {
  name: "Maria",
  age: 22,
  hairStyle: "long dark brown straight-to-wavy hair, center-parted",
  faceFeatures: "oval face shape, genuine warm smile",
  eyeDescription: "dark brown almond-shaped eyes",
  skinDescription: "warm olive tan skin",
  accessories: ["delicate gold necklace", "small stud earrings"],
  fashionStyle: "beach/athleisure",
};

describe("promptEngine", () => {
  it("builds a base identity prompt containing all fixed traits", () => {
    const base = buildBaseIdentityPrompt(maria);
    expect(base).toContain("dark brown almond-shaped eyes");
    expect(base).toContain("warm olive tan skin");
    expect(base).toContain("delicate gold necklace");
  });

  it("is deterministic for the same seed key", () => {
    const a = pickSceneVariant("BEACH", "Maria-2026-07-04-BEACH-0");
    const b = pickSceneVariant("BEACH", "Maria-2026-07-04-BEACH-0");
    expect(a).toEqual(b);
  });

  it("can produce different variants for different seed keys", () => {
    const variants = new Set(
      Array.from({ length: 10 }, (_, i) => JSON.stringify(pickSceneVariant("BEACH", `seed-${i}`)))
    );
    expect(variants.size).toBeGreaterThan(1);
  });

  it("every genre has at least one scene variant and one video template", () => {
    for (const genre of ALL_CONTENT_GENRES) {
      expect(() => pickSceneVariant(genre, "smoke-test")).not.toThrow();
      expect(() => getVideoTemplate(genre)).not.toThrow();
    }
  });

  it("includes the character identity and standard negative prompt in image prompts", () => {
    const { prompt, negativePrompt } = buildImagePrompt(maria, "GYM", "seed-x");
    expect(prompt).toContain("dark brown almond-shaped eyes");
    expect(negativePrompt).toBe(STANDARD_NEGATIVE_PROMPT);
  });
});

describe("caption generation", () => {
  it("appends the AI disclosure tag to every caption", () => {
    const { text } = generateCaption("COFFEE", "seed-caption-1");
    expect(text).toContain("#AI");
  });
});
