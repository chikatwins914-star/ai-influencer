import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { prisma } from "../utils/prisma.js";
import { recordWeeklySnapshot, buildWeeklyReport } from "../services/analyticsService.js";

export const analyticsRouter = Router();

const SnapshotSchema = z.object({
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  igReach: z.number().nullable().optional(),
  igSaveRate: z.number().min(0).max(1).nullable().optional(),
  igRetentionRate: z.number().min(0).max(1).nullable().optional(),
  igFollowerGrowth: z.number().nullable().optional(),
  fanvueRevenue: z.number().nullable().optional(),
  fanvueCvr: z.number().min(0).max(1).nullable().optional(),
  ugcDealCloseRate: z.number().min(0).max(1).nullable().optional(),
});

// POST /api/analytics/snapshot — record this week's raw metrics
analyticsRouter.post(
  "/snapshot",
  asyncHandler(async (req, res) => {
    const body = SnapshotSchema.parse(req.body);
    const snapshot = await recordWeeklySnapshot({
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      igReach: body.igReach ?? null,
      igSaveRate: body.igSaveRate ?? null,
      igRetentionRate: body.igRetentionRate ?? null,
      igFollowerGrowth: body.igFollowerGrowth ?? null,
      fanvueRevenue: body.fanvueRevenue ?? null,
      fanvueCvr: body.fanvueCvr ?? null,
      ugcDealCloseRate: body.ugcDealCloseRate ?? null,
    });
    res.status(201).json(snapshot);
  })
);

// GET /api/analytics/snapshots?limit=10
analyticsRouter.get(
  "/snapshots",
  asyncHandler(async (req, res) => {
    const limit = Number(req.query["limit"] ?? 10);
    const snapshots = await prisma.analyticsSnapshot.findMany({
      orderBy: { periodEnd: "desc" },
      take: Number.isFinite(limit) ? limit : 10,
    });
    res.json(snapshots);
  })
);

// POST /api/analytics/weekly-report — analyzes the latest snapshot vs the previous one
analyticsRouter.post(
  "/weekly-report",
  asyncHandler(async (_req, res) => {
    const result = await buildWeeklyReport();
    res.status(201).json(result);
  })
);
