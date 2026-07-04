import { Router } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";
import { prisma } from "../utils/prisma.js";
import { publishToInstagram } from "../services/instagramService.js";
import { planTodayInstagramOps } from "../services/instagramOpsService.js";
import { draftCommentReply, draftDmReply } from "../../shared/inboundMessageDrafts.js";
import { AI_DISCLOSURE } from "../../shared/aiDisclosure.js";
import { config } from "../../config/index.js";

export const instagramRouter = Router();

// POST /api/instagram/publish/:assetId
// `mediaUrl` must be a publicly reachable URL to the already-generated
// image/video (this system does not host media itself — see instagramService.ts)
const PublishSchema = z.object({ mediaUrl: z.string().url() });
instagramRouter.post(
  "/publish/:assetId",
  asyncHandler(async (req, res) => {
    const assetId = req.params["assetId"];
    if (!assetId) throw new AppError("Missing asset id", 400);

    const { mediaUrl } = PublishSchema.parse(req.body);

    const asset = await prisma.contentAsset.findUnique({ where: { id: assetId } });
    if (!asset) throw new AppError("Content asset not found", 404);

    const caption = await prisma.caption.findFirst({ where: { contentAssetId: asset.id } });
    const mediaType = asset.type === "VIDEO_REEL" ? "REELS" : asset.type === "STORY" ? "STORIES" : "IMAGE";

    const result = await publishToInstagram({
      mediaUrl,
      ...(caption?.text ? { caption: caption.text } : {}),
      mediaType,
    });

    const updated = await prisma.contentAsset.update({
      where: { id: asset.id },
      data: { status: "PUBLISHED", publishedAt: new Date(), filePath: mediaUrl },
    });

    res.json({ asset: updated, instagram: result });
  })
);

// POST /api/instagram/daily-ops — schedules today's 1 image + up to 3 reels + up to 5 stories
const DailyOpsSchema = z.object({ characterId: z.string().min(1), date: z.string().min(1).optional() });
instagramRouter.post(
  "/daily-ops",
  asyncHandler(async (req, res) => {
    const body = DailyOpsSchema.parse(req.body);
    const date = body.date ?? new Date().toISOString().slice(0, 10);
    const result = await planTodayInstagramOps(body.characterId, date);
    res.json({ date, ...result });
  })
);

// POST /api/instagram/comment-reply — draft a reply to an inbound comment
const CommentSchema = z.object({ commentText: z.string().min(1) });
instagramRouter.post(
  "/comment-reply",
  asyncHandler(async (req, res) => {
    const { commentText } = CommentSchema.parse(req.body);
    res.json(draftCommentReply(commentText));
  })
);

// POST /api/instagram/dm-reply — draft a reply to an inbound DM
const DmSchema = z.object({ messageText: z.string().min(1) });
instagramRouter.post(
  "/dm-reply",
  asyncHandler(async (req, res) => {
    const { messageText } = DmSchema.parse(req.body);
    res.json(draftDmReply(messageText, config.fanvue.accountEmail));
  })
);

// GET /api/instagram/disclosure-guidance — quick reference for what must be disclosed where
instagramRouter.get(
  "/disclosure-guidance",
  asyncHandler(async (_req, res) => {
    res.json(AI_DISCLOSURE);
  })
);
