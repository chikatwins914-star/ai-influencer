import { describe, expect, it } from "vitest";
import { GENRE_DAILY_QUOTA } from "../../shared/promptVariables.js";
import { config } from "../../config/index.js";
import {
  generateDailyImagePrompts,
  generateDailyVideoPrompts,
  generateDailyStoryPrompts,
} from "../../src/services/promptService.js";
import type { CharacterForPrompt } from "../../shared/promptEngine.js";

const maria: CharacterForPrompt = {
  name: "Maria",
  age: 22,
  hairStyle: "long dark brown hair",
  faceFeatures: "oval face, warm smile",
  eyeDescription: "dark brown eyes",
  skinDescription: "olive tan skin",
  accessories: ["gold necklace"],
  fashionStyle: "athleisure",
};

describe("daily content quotas", () => {
  it("GENRE_DAILY_QUOTA sums to the configured daily image target", () => {
    const total = Object.values(GENRE_DAILY_QUOTA).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(config.targets.imagesPerDay);
  });

  it("generates exactly 20 image prompts for a day", () => {
    const images = generateDailyImagePrompts(maria, "2026-07-04");
    expect(images).toHaveLength(20);
  });

  it("generates exactly 3 video prompts for a day", () => {
    const videos = generateDailyVideoPrompts(maria, "2026-07-04");
    expect(videos).toHaveLength(3);
  });

  it("generates exactly 5 story prompts for a day", () => {
    const stories = generateDailyStoryPrompts(maria, "2026-07-04");
    expect(stories).toHaveLength(5);
  });

  it("includes student-life genres (room selfie / library study) in the pool", () => {
    const images = generateDailyImagePrompts(maria, "2026-07-04");
    const genres = new Set(images.map((i) => i.genre));
    expect(genres.has("ROOM_SELFIE")).toBe(true);
    expect(genres.has("LIBRARY_STUDY")).toBe(true);
  });
});
