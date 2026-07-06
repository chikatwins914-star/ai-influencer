/**
 * Rule-based weekly recommendation engine. Compares this week's metrics to
 * last week's and produces plain-language suggestions. This intentionally
 * does NOT call an LLM — it's deterministic, auditable, and free to run on
 * every report. If richer analysis is wanted later, swap this out for an
 * Anthropic API call using the same input/output shape.
 */

export interface WeeklyMetrics {
  igReach: number | null;
  igSaveRate: number | null; // 0-1
  igRetentionRate: number | null; // 0-1
  igFollowerGrowth: number | null; // absolute change
  ttViews: number | null;
  ttLikes: number | null;
  ttFollowerGrowth: number | null; // absolute change
  ttEngagementRate: number | null; // 0-1, (likes+comments+shares)/views
  fanvueRevenue: number | null;
  fanvueCvr: number | null; // 0-1
  ugcDealCloseRate: number | null; // 0-1
}

function pctChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

export function generateRecommendations(current: WeeklyMetrics, previous: WeeklyMetrics | null): string[] {
  const recs: string[] = [];

  const reachChange = previous ? pctChange(current.igReach, previous.igReach) : null;
  if (reachChange !== null && reachChange < -0.1) {
    recs.push(
      "リーチが先週比10%以上低下。投稿時間をフォロワーのアクティブ時間帯に合わせる、トレンド音源をReelsに使う、ジャンル配分(GYM/BEACH等)を見直すことを検討。"
    );
  }

  if (current.igSaveRate !== null && current.igSaveRate < 0.02) {
    recs.push(
      "保存率が低め(2%未満の目安)。レシピ・ルーティン紹介・チェックリスト系(HEALTHY_FOOD, MORNING_ROUTINE, LIBRARY_STUDY)など「後で見返したくなる」実用コンテンツの比率を増やすと改善しやすい。"
    );
  }

  if (current.igRetentionRate !== null && current.igRetentionRate < 0.4) {
    recs.push(
      "リール視聴維持率が40%未満。Hookの最初の1-3秒をより強く(結果を先に見せる、テキストオーバーレイで疑問を投げかける等)し、動画尺を短縮することを検討。"
    );
  }

  if (current.igFollowerGrowth !== null && current.igFollowerGrowth <= 0) {
    recs.push(
      "フォロワー増加が停滞/減少。投稿頻度(画像1枚+リール3本+ストーリー5本/日)が守れているか確認し、UGCコラボやトレンド企画への参加を検討。"
    );
  }

  const ttViewsChange = previous ? pctChange(current.ttViews, previous.ttViews) : null;
  if (ttViewsChange !== null && ttViewsChange < -0.1) {
    recs.push(
      "TikTokの再生数が先週比10%以上低下。最初の1-2秒のフックを強める、トレンド音源・トレンドフォーマットへの乗り換え、投稿頻度の見直しを検討。"
    );
  }

  if (current.ttEngagementRate !== null && current.ttEngagementRate < 0.03) {
    recs.push(
      "TikTokのエンゲージメント率が低め(3%未満の目安)。コメントを誘発する一言(質問・煽り)をキャプションや動画内テキストに追加することを検討。"
    );
  }

  if (current.ttFollowerGrowth !== null && current.ttFollowerGrowth <= 0) {
    recs.push("TikTokのフォロワー増加が停滞/減少。投稿頻度と、Instagramでバズった企画をTikTok向けに再構成して投稿することを検討。");
  }

  if (current.fanvueCvr !== null && current.fanvueCvr < 0.01) {
    recs.push(
      "Instagram→Fanvueの転換率が低め(1%未満の目安)。バイオリンクの視認性、キャプションCTAの頻度、Fanvue側のウェルカムメッセージ/価格設定を見直すことを検討。"
    );
  }

  if (current.ugcDealCloseRate !== null && current.ugcDealCloseRate < 0.2) {
    recs.push(
      "UGC案件の受注率が低め(20%未満の目安)。営業テンプレのパーソナライズ度を上げる、実績(過去の受注実績)を先方に見せる、フォローアップのタイミングを早めることを検討。"
    );
  }

  if (recs.length === 0) {
    recs.push(
      "主要指標は目安ラインを満たしている。現在の投稿ペース・コンテンツ配分を維持しつつ、A/Bテストで更なる伸びしろを探る段階。"
    );
  }

  return recs;
}

export function summarizeWeek(current: WeeklyMetrics, previous: WeeklyMetrics | null): string {
  const parts: string[] = [];

  if (current.igReach !== null) {
    const change = previous ? pctChange(current.igReach, previous.igReach) : null;
    parts.push(
      `IGリーチ: ${current.igReach.toLocaleString()}${change !== null ? `(前週比${(change * 100).toFixed(1)}%)` : ""}`
    );
  }
  if (current.igFollowerGrowth !== null) {
    parts.push(`フォロワー増減: ${current.igFollowerGrowth >= 0 ? "+" : ""}${current.igFollowerGrowth}`);
  }
  if (current.ttViews !== null) {
    const change = previous ? pctChange(current.ttViews, previous.ttViews) : null;
    parts.push(
      `TikTok再生数: ${current.ttViews.toLocaleString()}${change !== null ? `(前週比${(change * 100).toFixed(1)}%)` : ""}`
    );
  }
  if (current.ttFollowerGrowth !== null) {
    parts.push(`TikTokフォロワー増減: ${current.ttFollowerGrowth >= 0 ? "+" : ""}${current.ttFollowerGrowth}`);
  }
  if (current.fanvueRevenue !== null) {
    parts.push(`Fanvue売上: $${current.fanvueRevenue.toLocaleString()}`);
  }
  if (current.ugcDealCloseRate !== null) {
    parts.push(`UGC受注率: ${(current.ugcDealCloseRate * 100).toFixed(1)}%`);
  }

  return parts.length > 0 ? parts.join(" / ") : "今週のデータはまだ入力されていません。";
}
