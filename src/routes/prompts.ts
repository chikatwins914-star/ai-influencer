import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { persistDailyContentPlan, generateCaption } from "../services/promptService.js";
import { prisma } from "../utils/prisma.js";
import { ALL_CONTENT_GENRES } from "../../shared/types.js";

export const promptRouter = Router();

const DailyPlanSchema = z.object({
  characterId: z.string().min(1),
  date: z.string().min(1), // ISO date, e.g. "2026-07-04"
});

// POST /api/prompts/daily-plan — generates + persists a full day's image/video/story prompts
promptRouter.post(
  "/daily-plan",
  asyncHandler(async (req, res) => {
    const { characterId, date } = DailyPlanSchema.parse(req.body);
    const result = await persistDailyContentPlan(characterId, date);
    res.status(201).json(result);
  })
);

// GET /api/prompts/assets?characterId=...&date=...&type=IMAGE — list generated assets
const ListAssetsQuerySchema = z.object({
  characterId: z.string().min(1),
  type: z.enum(["IMAGE", "VIDEO_REEL", "STORY"]).optional(),
});
promptRouter.get(
  "/assets",
  asyncHandler(async (req, res) => {
    const query = ListAssetsQuerySchema.parse(req.query);
    const assets = await prisma.contentAsset.findMany({
      where: { characterId: query.characterId, ...(query.type ? { type: query.type } : {}) },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json(assets);
  })
);

// POST /api/prompts/caption — generate a single caption for a genre
const CaptionSchema = z.object({
  genre: z.enum(ALL_CONTENT_GENRES as [string, ...string[]]),
  seedKey: z.string().min(1),
  extra: z.string().optional(),
});
promptRouter.post(
  "/caption",
  asyncHandler(async (req, res) => {
    const body = CaptionSchema.parse(req.body);
    const genre = body.genre as (typeof ALL_CONTENT_GENRES)[number];
    const result = generateCaption(genre, body.seedKey, body.extra ?? "");
    res.json(result);
  })
);

promptRouter.get(
  "/genres",
  asyncHandler(async (_req, res) => {
    res.json(ALL_CONTENT_GENRES);
  })
);
