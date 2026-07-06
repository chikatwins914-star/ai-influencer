import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { generateUgcScript } from "../services/ugcService.js";

export const ugcRouter = Router();

const CATEGORY_ENUM = [
  "SKINCARE",
  "SUPPLEMENT",
  "SPORTS_EQUIPMENT",
  "TENNIS_EQUIPMENT",
  "BEAUTY",
  "GADGET",
  "OTHER",
] as const;
const STATUS_ENUM = [
  "LEAD",
  "PITCHED",
  "NEGOTIATING",
  "CONTRACTED",
  "IN_PRODUCTION",
  "DELIVERED",
  "PAID",
  "DECLINED",
] as const;

// GET /api/ugc — list all UGC deals
ugcRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const deals = await prisma.uGCDeal.findMany({ orderBy: { createdAt: "desc" } });
    res.json(deals);
  })
);

// POST /api/ugc — create a new deal (starts at status LEAD)
const CreateSchema = z.object({
  brandName: z.string().min(1),
  category: z.enum(CATEGORY_ENUM),
  contactEmail: z.string().email().optional(),
  fee: z.number().positive().optional(),
});
ugcRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = CreateSchema.parse(req.body);
    const deal = await prisma.uGCDeal.create({
      data: {
        brandName: body.brandName,
        category: body.category,
        ...(body.contactEmail !== undefined ? { contactEmail: body.contactEmail } : {}),
        ...(body.fee !== undefined ? { fee: body.fee } : {}),
      },
    });
    res.status(201).json(deal);
  })
);

// PATCH /api/ugc/:id — update status/fields as a deal progresses
const UpdateSchema = z.object({
  category: z.enum(CATEGORY_ENUM).optional(),
  status: z.enum(STATUS_ENUM).optional(),
  contactEmail: z.string().email().nullable().optional(),
  fee: z.number().positive().nullable().optional(),
  script: z.string().optional(),
  deliverablePath: z.string().nullable().optional(),
  disclosureConfirmed: z.boolean().optional(),
  dueDate: z.string().nullable().optional(),
  deliveredAt: z.string().nullable().optional(),
});
ugcRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = req.params["id"];
    if (!id) throw new AppError("Missing deal id", 400);

    const existing = await prisma.uGCDeal.findUnique({ where: { id } });
    if (!existing) throw new AppError("UGC deal not found", 404);

    const body = UpdateSchema.parse(req.body);
    const data: Record<string, unknown> = { ...body };
    if (body.dueDate !== undefined) data["dueDate"] = body.dueDate ? new Date(body.dueDate) : null;
    if (body.deliveredAt !== undefined) data["deliveredAt"] = body.deliveredAt ? new Date(body.deliveredAt) : null;

    const updated = await prisma.uGCDeal.update({ where: { id }, data });
    res.json(updated);
  })
);

// POST /api/ugc/:id/script — generate + save a deliverable script for this deal
const ScriptSchema = z.object({ productName: z.string().min(1) });
ugcRouter.post(
  "/:id/script",
  asyncHandler(async (req, res) => {
    const id = req.params["id"];
    if (!id) throw new AppError("Missing deal id", 400);

    const deal = await prisma.uGCDeal.findUnique({ where: { id } });
    if (!deal) throw new AppError("UGC deal not found", 404);

    const { productName } = ScriptSchema.parse(req.body);
    const script = generateUgcScript(deal.category, productName, deal.brandName);
    const updated = await prisma.uGCDeal.update({ where: { id }, data: { script } });
    res.json(updated);
  })
);
