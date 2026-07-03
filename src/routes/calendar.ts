import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { persistYearPlan } from "../services/calendarService.js";
import { prisma } from "../utils/prisma.js";

export const calendarRouter = Router();

const GenerateSchema = z.object({
  characterId: z.string().min(1),
  startDate: z.string().min(1),
  days: z.number().int().positive().max(730).optional(),
});

// POST /api/calendar/generate — builds + persists a 365-day (default) content calendar
calendarRouter.post(
  "/generate",
  asyncHandler(async (req, res) => {
    const body = GenerateSchema.parse(req.body);
    const result = await persistYearPlan(body.characterId, body.startDate, body.days ?? 365);
    res.status(201).json(result);
  })
);

// GET /api/calendar?characterId=...&from=YYYY-MM-DD&to=YYYY-MM-DD
const ListSchema = z.object({
  characterId: z.string().min(1),
  from: z.string().optional(),
  to: z.string().optional(),
});
calendarRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = ListSchema.parse(req.query);
    const entries = await prisma.calendarEntry.findMany({
      where: {
        characterId: query.characterId,
        ...(query.from || query.to
          ? {
              date: {
                ...(query.from ? { gte: new Date(`${query.from}T00:00:00`) } : {}),
                ...(query.to ? { lte: new Date(`${query.to}T00:00:00`) } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: "asc" },
    });
    res.json(entries);
  })
);
