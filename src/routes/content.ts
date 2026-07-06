import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";
import { persistDailyContentPlan } from "../services/promptService.js";
import { generateAssetFiles } from "../services/assetGenerationService.js";
import { prisma } from "../utils/prisma.js";
import { ALL_CONTENT_GENRES } from "../../shared/types.js";
import { IMAGES_ROOT, VIDEOS_ROOT, persistGeneratedFile, toMediaUrl } from "../services/generation/providerUtils.js";

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

// Caps how much work one HTTP request can trigger — each video asset alone
// can take several minutes against a real provider, so an unbounded batch
// risks tying up the request far longer than any reverse proxy will wait.
const MAX_ASSET_IDS_PER_REQUEST = 20;

const GenerateAssetsSchema = z.object({
  assetIds: z.array(z.string().min(1)).min(1).max(MAX_ASSET_IDS_PER_REQUEST),
});

/**
 * POST /api/content/generate-assets
 * Calls the configured image/video provider (see providerFactory.ts) for
 * each given ContentAsset (must be status PROMPT_GENERATED) and persists
 * the resulting file path. Hits real, paid external APIs when a real
 * provider is configured — this does not run automatically as part of
 * generate-today.
 */
contentRouter.post(
  "/generate-assets",
  asyncHandler(async (req, res) => {
    const { assetIds } = GenerateAssetsSchema.parse(req.body);
    const outcomes = await generateAssetFiles(assetIds);

    const failedCount = outcomes.filter((o) => o.status === "FAILED").length;
    const statusCode = failedCount === 0 ? 201 : failedCount === outcomes.length ? 502 : 207;

    res.status(statusCode).json({ outcomes });
  })
);

// Enough for a full-length vertical reel — comfortably covers the memory
// storage buffer used below for a single upload at a time.
const MAX_UPLOAD_BYTES = 300 * 1024 * 1024;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES } });

const EXT_BY_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const UploadAssetSchema = z.object({
  characterId: z.string().min(1),
  type: z.enum(["IMAGE", "VIDEO_REEL", "STORY"]).default("VIDEO_REEL"),
  genre: z.enum(ALL_CONTENT_GENRES as [string, ...string[]]),
  prompt: z.string().min(1).default("Manually created content (uploaded, not AI-generated)"),
  scheduledFor: z.string().datetime().optional(),
});

/**
 * POST /api/content/upload-asset (multipart/form-data)
 * Registers a manually-produced file (e.g. a video edited outside this
 * system) as a ContentAsset, skipping the AI generation step entirely —
 * the asset is created already at ASSET_GENERATED with the uploaded file
 * as its filePath, so it flows into the same review/schedule/publish
 * pipeline as a generated one.
 */
contentRouter.post(
  "/upload-asset",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const body = UploadAssetSchema.parse(req.body);
    const file = req.file;
    if (!file) throw new AppError("No file uploaded — expected a multipart 'file' field", 400);

    const ext = EXT_BY_MIME[file.mimetype];
    if (!ext) throw new AppError(`Unsupported file type: ${file.mimetype}`, 400);

    const isVideo = body.type === "VIDEO_REEL";
    const root = isVideo ? VIDEOS_ROOT : IMAGES_ROOT;

    const asset = await prisma.contentAsset.create({
      data: {
        characterId: body.characterId,
        type: body.type,
        genre: body.genre as (typeof ALL_CONTENT_GENRES)[number],
        prompt: body.prompt,
        status: "PLANNED",
        ...(body.scheduledFor ? { scheduledFor: new Date(body.scheduledFor) } : {}),
      },
    });

    const filePath = await persistGeneratedFile(root, body.characterId, asset.id, ext, file.buffer);
    const updated = await prisma.contentAsset.update({
      where: { id: asset.id },
      data: { filePath, status: "ASSET_GENERATED" },
    });

    res.status(201).json({ ...updated, mediaUrl: toMediaUrl(updated.filePath, isVideo) });
  })
);
