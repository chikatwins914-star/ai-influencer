import { describe, expect, it } from "vitest";
import { GENRE_DAILY_QUOTA } from "../../shared/promptVariables.js";
import { config } from "../../config/index.js";
import {
  generateDailyImagePrompts,
  generateDailyVideoPrompts,
  generateDailyStoryPrompts,
} from "../../src/services/promptService.js";
import { ANGLE_VARIANTS, type CharacterForPrompt } from "../../shared/promptEngine.js";

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
  it("GENRE_DAILY_QUOTA (scenes) times the angle count matches the daily image target", () => {
    const totalScenes = Object.values(GENRE_DAILY_QUOTA).reduce((sum, n) => sum + n, 0);
    expect(totalScenes * ANGLE_VARIANTS.length).toBe(config.targets.imagesPerDay);
  });

  it("generates exactly 20 image prompts for a day (one per angle per scene)", () => {
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

  it("only generates the 3 enabled genres (room selfie / beach / casual date)", () => {
    const images = generateDailyImagePrompts(maria, "2026-07-04");
    const genres = new Set(images.map((i) => i.genre));
    expect(genres).toEqual(new Set(["ROOM_SELFIE", "BEACH", "CASUAL_DATE"]));
  });
});
