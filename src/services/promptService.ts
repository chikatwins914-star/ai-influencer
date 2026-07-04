import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import { deserializeCharacter } from "./characterService.js";
import { ALL_CONTENT_GENRES, type ContentGenre } from "../../shared/types.js";
import {
  buildImagePrompt,
  buildHashtags,
  type CharacterForPrompt,
} from "../../shared/promptEngine.js";
import { getVideoTemplate } from "../../shared/videoPromptTemplates.js";
import { GENRE_DAILY_QUOTA } from "../../shared/promptVariables.js";
import { CAPTION_TEMPLATES, fillTemplate } from "../../shared/captionTemplates.js";
import { withDisclosureTag } from "../../shared/aiDisclosure.js";
import { AppError } from "../middleware/errorHandler.js";

interface DbCharacterRaw {
  id: string;
  name: string;
  age: number;
  hairStyle: string;
  faceFeatures: string;
  eyeDescription: string;
  skinDescription: string;
  accessories: string; // JSON-encoded
  fashionStyle: string;
}

async function getCharacterForPrompt(characterId: string): Promise<CharacterForPrompt & { id: string }> {
  const raw = await prisma.character.findUnique({ where: { id: characterId } });
  if (!raw) throw new AppError("Character not found", 404);

  const deserialized = deserializeCharacter(raw as unknown as DbCharacterRaw) as unknown as DbCharacterRaw & {
    accessories: string[];
  };

  return {
    id: raw.id,
    name: raw.name,
    age: raw.age,
    hairStyle: raw.hairStyle,
    faceFeatures: raw.faceFeatures,
    eyeDescription: raw.eyeDescription,
    skinDescription: raw.skinDescription,
    accessories: deserialized.accessories,
    fashionStyle: raw.fashionStyle,
  };
}

/** Picks `count` genres for the day, cycling deterministically off the date so
 * output is spread across genres rather than random-clustered. */
function pickGenresForDay(count: number, dateISO: string, offset = 0): ContentGenre[] {
  const dayNumber = new Date(dateISO).getTime() / 86_400_000;
  const start = Math.floor(dayNumber + offset) % ALL_CONTENT_GENRES.length;
  const picked: ContentGenre[] = [];
  for (let i = 0; i < count; i++) {
    const genre = ALL_CONTENT_GENRES[(start + i) % ALL_CONTENT_GENRES.length];
    if (genre) picked.push(genre);
  }
  return picked;
}

export interface DailyImagePromptResult {
  genre: ContentGenre;
  prompt: string;
  negativePrompt: string;
}

/** Generates the day's image prompts — target: 20/day, distributed per GENRE_DAILY_QUOTA. */
export function generateDailyImagePrompts(
  character: CharacterForPrompt,
  dateISO: string,
  quota: Record<ContentGenre, number> = GENRE_DAILY_QUOTA
): DailyImagePromptResult[] {
  const results: DailyImagePromptResult[] = [];
  for (const genre of ALL_CONTENT_GENRES) {
    const count = quota[genre] ?? 0;
    for (let slot = 0; slot < count; slot++) {
      const seedKey = `${character.name}-${dateISO}-${genre}-${slot}`;
      const { prompt, negativePrompt } = buildImagePrompt(character, genre, seedKey);
      results.push({ genre, prompt, negativePrompt });
    }
  }
  return results;
}

export interface DailyVideoPromptResult {
  genre: ContentGenre;
  prompt: string;
  videoStructure: { hook: string; body: string; ending: string; cta: string };
}

/** Generates the day's Reels video prompts — target: 3/day. */
export function generateDailyVideoPrompts(
  character: CharacterForPrompt,
  dateISO: string,
  count = 3
): DailyVideoPromptResult[] {
  const genres = pickGenresForDay(count, dateISO, 3); // offset so it doesn't always mirror image genre order
  return genres.map((genre, i) => {
    const seedKey = `${character.name}-${dateISO}-video-${genre}-${i}`;
    const { prompt: visualPrompt } = buildImagePrompt(character, genre, seedKey);
    const structure = getVideoTemplate(genre, i);
    return {
      genre,
      prompt: `${visualPrompt}. 15-30s vertical Reel, 4-6 dynamic clips, trending audio.`,
      videoStructure: structure,
    };
  });
}

export interface DailyStoryPromptResult {
  genre: ContentGenre;
  prompt: string;
}

/** Generates the day's Story prompts — target: 5/day. */
export function generateDailyStoryPrompts(
  character: CharacterForPrompt,
  dateISO: string,
  count = 5
): DailyStoryPromptResult[] {
  const genres = pickGenresForDay(count, dateISO, 6);
  return genres.map((genre, i) => {
    const seedKey = `${character.name}-${dateISO}-story-${genre}-${i}`;
    const { prompt } = buildImagePrompt(character, genre, seedKey);
    return { genre, prompt: `${prompt}. Vertical 9:16 Story format, casual/candid framing.` };
  });
}

export function generateCaption(genre: ContentGenre, seedKey: string, extra = ""): {
  text: string;
  hashtags: string[];
} {
  const templates = CAPTION_TEMPLATES[genre];
  const rngIndex = Math.abs(hashCode(seedKey)) % templates.length;
  const template = templates[rngIndex] ?? templates[0];
  const filled = fillTemplate(template ?? "{extra}", { extra });
  const withHashtags = `${filled.trim()}\n\n${buildHashtags(genre).join(" ")}`;
  return { text: withDisclosureTag(withHashtags), hashtags: buildHashtags(genre) };
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

/**
 * Builds the full day's content plan and persists it as ContentAsset +
 * Caption rows (status PROMPT_GENERATED) so downstream phases (automation,
 * dashboard) can pick them up. Also writes a human-readable handoff file
 * under assets/prompts/{date}/ so prompts can be copy-pasted into whatever
 * external image/video generation tool is being used (this system generates
 * prompts + metadata; it does not call an image/video generation API itself
 * — see project design notes). Idempotent-ish: does not dedupe against
 * previous runs for the same date — call once per day per character.
 */
export async function persistDailyContentPlan(characterId: string, dateISO: string) {
  const character = await getCharacterForPrompt(characterId);

  const images = generateDailyImagePrompts(character, dateISO);
  const videos = generateDailyVideoPrompts(character, dateISO);
  const stories = generateDailyStoryPrompts(character, dateISO);

  const createdIds: { images: string[]; videos: string[]; stories: string[] } = {
    images: [],
    videos: [],
    stories: [],
  };

  const fileRows: {
    images: Array<{ genre: string; prompt: string; negativePrompt: string; caption: string }>;
    videos: Array<{ genre: string; prompt: string; structure: unknown; caption: string }>;
    stories: Array<{ genre: string; prompt: string }>;
  } = { images: [], videos: [], stories: [] };

  for (const [i, img] of images.entries()) {
    const asset = await prisma.contentAsset.create({
      data: {
        characterId,
        type: "IMAGE",
        genre: img.genre,
        prompt: img.prompt,
        negativePrompt: img.negativePrompt,
        status: "PROMPT_GENERATED",
      },
    });
    createdIds.images.push(asset.id);

    const caption = generateCaption(img.genre, `${dateISO}-image-${img.genre}-${i}`);
    await prisma.caption.create({
      data: { characterId, contentAssetId: asset.id, text: caption.text, hashtags: JSON.stringify(caption.hashtags) },
    });
    fileRows.images.push({ genre: img.genre, prompt: img.prompt, negativePrompt: img.negativePrompt, caption: caption.text });
  }

  for (const [i, vid] of videos.entries()) {
    const asset = await prisma.contentAsset.create({
      data: {
        characterId,
        type: "VIDEO_REEL",
        genre: vid.genre,
        prompt: vid.prompt,
        videoStructure: JSON.stringify(vid.videoStructure),
        status: "PROMPT_GENERATED",
      },
    });
    createdIds.videos.push(asset.id);

    const caption = generateCaption(vid.genre, `${dateISO}-video-${vid.genre}-${i}`);
    await prisma.caption.create({
      data: { characterId, contentAssetId: asset.id, text: caption.text, hashtags: JSON.stringify(caption.hashtags) },
    });
    fileRows.videos.push({ genre: vid.genre, prompt: vid.prompt, structure: vid.videoStructure, caption: caption.text });
  }

  for (const story of stories) {
    const asset = await prisma.contentAsset.create({
      data: {
        characterId,
        type: "STORY",
        genre: story.genre,
        prompt: story.prompt,
        status: "PROMPT_GENERATED",
      },
    });
    createdIds.stories.push(asset.id);
    fileRows.stories.push({ genre: story.genre, prompt: story.prompt });
  }

  const outputPath = await writeDailyContentFiles(dateISO, character.name, fileRows);

  logger.info(
    {
      characterId,
      dateISO,
      counts: { images: images.length, videos: videos.length, stories: stories.length },
      outputPath,
    },
    "Daily content plan persisted"
  );

  return { ...createdIds, outputPath };
}

/**
 * Writes the day's prompts + captions to assets/prompts/{date}/ as both
 * JSON (for tooling) and Markdown (for a human to read/copy-paste).
 */
async function writeDailyContentFiles(
  dateISO: string,
  characterName: string,
  rows: {
    images: Array<{ genre: string; prompt: string; negativePrompt: string; caption: string }>;
    videos: Array<{ genre: string; prompt: string; structure: unknown; caption: string }>;
    stories: Array<{ genre: string; prompt: string }>;
  }
): Promise<string> {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const dir = path.resolve(process.cwd(), "assets/prompts", dateISO);
  await mkdir(dir, { recursive: true });

  await writeFile(path.join(dir, "plan.json"), JSON.stringify(rows, null, 2), "utf-8");

  const md = [
    `# ${characterName} — Content Plan for ${dateISO}`,
    "",
    `> Generated automatically. Copy prompts into your image/video generation tool of choice.`,
    "",
    `## Images (${rows.images.length})`,
    ...rows.images.flatMap((r, i) => [
      `### ${i + 1}. ${r.genre}`,
      `**Prompt:** ${r.prompt}`,
      `**Negative prompt:** ${r.negativePrompt}`,
      `**Caption:**\n\n${r.caption}`,
      "",
    ]),
    `## Reels (${rows.videos.length})`,
    ...rows.videos.flatMap((r, i) => [
      `### ${i + 1}. ${r.genre}`,
      `**Prompt:** ${r.prompt}`,
      `**Structure:** \`${JSON.stringify(r.structure)}\``,
      `**Caption:**\n\n${r.caption}`,
      "",
    ]),
    `## Stories (${rows.stories.length})`,
    ...rows.stories.flatMap((r, i) => [`### ${i + 1}. ${r.genre}`, `**Prompt:** ${r.prompt}`, ""]),
  ].join("\n");

  await writeFile(path.join(dir, "plan.md"), md, "utf-8");

  return dir;
}
