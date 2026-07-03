import { Router } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";
import { prisma } from "../utils/prisma.js";
import {
  seedFanvueMessageTemplates,
  createFanvuePost,
  draftFanvueMessage,
  getInstagramToFanvueFunnelCopy,
} from "../services/fanvueService.js";

export const fanvueRouter = Router();

// POST /api/fanvue/message-templates/seed — one-time (idempotent) setup of standard templates
fanvueRouter.post(
  "/message-templates/seed",
  asyncHandler(async (_req, res) => {
    const result = await seedFanvueMessageTemplates();
    res.status(201).json(result);
  })
);

fanvueRouter.get(
  "/message-templates",
  asyncHandler(async (_req, res) => {
    const templates = await prisma.fanvueMessage.findMany({ orderBy: { category: "asc" } });
    res.json(templates.map((t) => ({ ...t, variables: JSON.parse(t.variables) })));
  })
);

// POST /api/fanvue/message-templates/:category/draft — fill a template with variables
const DraftSchema = z.object({ variables: z.record(z.string()).default({}) });
const CATEGORY_ENUM = ["WELCOME", "PROMO", "RENEWAL_REMINDER", "THANK_YOU", "PPV_OFFER"] as const;
fanvueRouter.post(
  "/message-templates/:category/draft",
  asyncHandler(async (req, res) => {
    const category = req.params["category"];
    if (!category || !(CATEGORY_ENUM as readonly string[]).includes(category)) {
      throw new AppError("Invalid category", 400);
    }
    const { variables } = DraftSchema.parse(req.body);
    const result = await draftFanvueMessage(category as (typeof CATEGORY_ENUM)[number], variables);
    if (!result) throw new AppError("No template found for this category — run seed first", 404);
    res.json(result);
  })
);

// POST /api/fanvue/posts — create a Fanvue post draft (limited content management)
const CreatePostSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive().optional(),
  scheduledFor: z.string().optional(), // ISO datetime
});
fanvueRouter.post(
  "/posts",
  asyncHandler(async (req, res) => {
    const body = CreatePostSchema.parse(req.body);
    const post = await createFanvuePost({
      title: body.title,
      description: body.description,
      ...(body.price !== undefined ? { price: body.price } : {}),
      ...(body.scheduledFor ? { scheduledFor: new Date(body.scheduledFor) } : {}),
    });
    res.status(201).json(post);
  })
);

fanvueRouter.get(
  "/posts",
  asyncHandler(async (_req, res) => {
    const posts = await prisma.fanvuePost.findMany({ orderBy: { createdAt: "desc" } });
    res.json(posts);
  })
);

// GET /api/fanvue/funnel-copy?seedKey=... — Instagram-side CTA copy driving to Fanvue
fanvueRouter.get(
  "/funnel-copy",
  asyncHandler(async (req, res) => {
    const seedKey = typeof req.query["seedKey"] === "string" ? req.query["seedKey"] : new Date().toISOString();
    res.json(getInstagramToFanvueFunnelCopy(seedKey));
  })
);
