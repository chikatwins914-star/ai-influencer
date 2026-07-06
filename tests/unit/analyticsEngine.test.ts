import { describe, expect, it } from "vitest";
import { generateRecommendations, summarizeWeek, type WeeklyMetrics } from "../../shared/analyticsEngine.js";

const baseMetrics: WeeklyMetrics = {
  igReach: 10000,
  igSaveRate: 0.05,
  igRetentionRate: 0.5,
  igFollowerGrowth: 100,
  ttViews: 50000,
  ttLikes: 2000,
  ttFollowerGrowth: 200,
  ttEngagementRate: 0.05,
  fanvueRevenue: 500,
  fanvueCvr: 0.02,
  ugcDealCloseRate: 0.3,
};

describe("analytics recommendation engine", () => {
  it("flags a reach drop of more than 10% vs the previous week", () => {
    const previous: WeeklyMetrics = { ...baseMetrics, igReach: 20000 };
    const recs = generateRecommendations(baseMetrics, previous);
    expect(recs.some((r) => r.includes("リーチ"))).toBe(true);
  });

  it("flags a low save rate", () => {
    const recs = generateRecommendations({ ...baseMetrics, igSaveRate: 0.005 }, null);
    expect(recs.some((r) => r.includes("保存率"))).toBe(true);
  });

  it("flags a low retention rate", () => {
    const recs = generateRecommendations({ ...baseMetrics, igRetentionRate: 0.1 }, null);
    expect(recs.some((r) => r.includes("視聴維持率"))).toBe(true);
  });

  it("flags stalled follower growth", () => {
    const recs = generateRecommendations({ ...baseMetrics, igFollowerGrowth: -5 }, null);
    expect(recs.some((r) => r.includes("フォロワー"))).toBe(true);
  });

  it("returns a positive-status message when all metrics are healthy", () => {
    const recs = generateRecommendations(baseMetrics, baseMetrics);
    expect(recs).toHaveLength(1);
    expect(recs[0]).toContain("維持");
  });

  it("summarizes the week with a percent change when a previous snapshot exists", () => {
    const previous: WeeklyMetrics = { ...baseMetrics, igReach: 5000 };
    const summary = summarizeWeek(baseMetrics, previous);
    expect(summary).toContain("前週比");
  });
});
