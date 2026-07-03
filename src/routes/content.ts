import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { persistDailyContentPlan } from "../services/promptService.js";

export const contentRouter = Router();

const GenerateSchema = z.object({
  characterId: z.string().min(1),
  date: z.string().min(1).optional(), // defaults to today (UTC) if omitted
});

/**
 * POST /api/content/generate-today
 * The "one button" daily content generation job: builds and persists the
 * day's images/reels/stories + captions, and writes a handoff file to
 * assets/prompts/{date}/ for use with external image/video generation tools.
 */
contentRouter.post(
  "/generate-today",
  asyncHandler(async (req, res) => {
    const body = GenerateSchema.parse(req.body);
    const date = body.date ?? new Date().toISOString().slice(0, 10);

    const result = await persistDailyContentPlan(body.characterId, date);

    res.status(201).json({
      date,
      counts: {
        images: result.images.length,
        videos: result.videos.length,
        stories: result.stories.length,
      },
      outputPath: result.outputPath,
      assetIds: result,
    });
  })
);
