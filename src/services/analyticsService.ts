import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import { generateRecommendations, summarizeWeek, type WeeklyMetrics } from "../../shared/analyticsEngine.js";

export interface RecordWeeklySnapshotInput extends WeeklyMetrics {
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
}

/** Records a week's raw metrics as-is (no analysis yet — see buildWeeklyReport). */
export async function recordWeeklySnapshot(input: RecordWeeklySnapshotInput) {
  const snapshot = await prisma.analyticsSnapshot.create({
    data: {
      periodStart: new Date(`${input.periodStart}T00:00:00`),
      periodEnd: new Date(`${input.periodEnd}T00:00:00`),
      igReach: input.igReach,
      igSaveRate: input.igSaveRate,
      igRetentionRate: input.igRetentionRate,
      igFollowerGrowth: input.igFollowerGrowth,
      fanvueRevenue: input.fanvueRevenue,
      fanvueCvr: input.fanvueCvr,
      ugcDealCloseRate: input.ugcDealCloseRate,
    },
  });
  logger.info({ snapshotId: snapshot.id }, "Weekly analytics snapshot recorded");
  return snapshot;
}

function toMetrics(snapshot: {
  igReach: number | null;
  igSaveRate: number | null;
  igRetentionRate: number | null;
  igFollowerGrowth: number | null;
  fanvueRevenue: number | null;
  fanvueCvr: number | null;
  ugcDealCloseRate: number | null;
}): WeeklyMetrics {
  return {
    igReach: snapshot.igReach,
    igSaveRate: snapshot.igSaveRate,
    igRetentionRate: snapshot.igRetentionRate,
    igFollowerGrowth: snapshot.igFollowerGrowth,
    fanvueRevenue: snapshot.fanvueRevenue,
    fanvueCvr: snapshot.fanvueCvr,
    ugcDealCloseRate: snapshot.ugcDealCloseRate,
  };
}

/**
 * Generates recommendations + summary for the most recent snapshot (compared
 * against the one before it), persists them onto that snapshot row, and
 * writes a human-readable Markdown report to analytics/{periodEnd}/report.md.
 */
export async function buildWeeklyReport(): Promise<{
  snapshotId: string;
  summary: string;
  recommendations: string[];
  reportPath: string;
}> {
  const [latest, previous] = await prisma.analyticsSnapshot.findMany({
    orderBy: { periodEnd: "desc" },
    take: 2,
  });

  if (!latest) {
    throw new Error("No analytics snapshot found — call recordWeeklySnapshot() first.");
  }

  const currentMetrics = toMetrics(latest);
  const previousMetrics = previous ? toMetrics(previous) : null;

  const recommendations = generateRecommendations(currentMetrics, previousMetrics);
  const summary = summarizeWeek(currentMetrics, previousMetrics);

  const updated = await prisma.analyticsSnapshot.update({
    where: { id: latest.id },
    data: {
      reportSummary: summary,
      recommendations: JSON.stringify(recommendations),
    },
  });

  const reportPath = await writeWeeklyReportFile(updated, recommendations, summary);

  logger.info({ snapshotId: updated.id, reportPath }, "Weekly analytics report built");

  return { snapshotId: updated.id, summary, recommendations, reportPath };
}

async function writeWeeklyReportFile(
  snapshot: {
    periodStart: Date;
    periodEnd: Date;
    igReach: number | null;
    igSaveRate: number | null;
    igRetentionRate: number | null;
    igFollowerGrowth: number | null;
    fanvueRevenue: number | null;
    fanvueCvr: number | null;
    ugcDealCloseRate: number | null;
  },
  recommendations: string[],
  summary: string
): Promise<string> {
  const periodEndISO = snapshot.periodEnd.toISOString().slice(0, 10);
  const dir = path.resolve(process.cwd(), "analytics", periodEndISO);
  await mkdir(dir, { recursive: true });

  const fmtPct = (v: number | null) => (v === null ? "—" : `${(v * 100).toFixed(1)}%`);
  const fmtNum = (v: number | null) => (v === null ? "—" : v.toLocaleString());

  const md = [
    `# Weekly Report — ${snapshot.periodStart.toISOString().slice(0, 10)} to ${periodEndISO}`,
    "",
    `## Summary`,
    summary,
    "",
    `## Instagram`,
    `- Reach: ${fmtNum(snapshot.igReach)}`,
    `- Save rate: ${fmtPct(snapshot.igSaveRate)}`,
    `- Reel retention rate: ${fmtPct(snapshot.igRetentionRate)}`,
    `- Follower growth: ${snapshot.igFollowerGrowth ?? "—"}`,
    "",
    `## Fanvue`,
    `- Revenue: ${snapshot.fanvueRevenue === null ? "—" : `$${snapshot.fanvueRevenue.toLocaleString()}`}`,
    `- CVR: ${fmtPct(snapshot.fanvueCvr)}`,
    "",
    `## UGC`,
    `- Deal close rate: ${fmtPct(snapshot.ugcDealCloseRate)}`,
    "",
    `## Recommendations`,
    ...recommendations.map((r, i) => `${i + 1}. ${r}`),
  ].join("\n");

  await writeFile(path.join(dir, "report.md"), md, "utf-8");
  return dir;
}
