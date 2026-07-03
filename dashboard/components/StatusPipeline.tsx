"use client";

import type { ContentAsset } from "@/lib/api";

const PIPELINE_STEPS: ContentAsset["status"][] = [
  "PLANNED",
  "PROMPT_GENERATED",
  "ASSET_GENERATED",
  "REVIEWED",
  "SCHEDULED",
  "PUBLISHED",
];

const STEP_LABEL: Record<ContentAsset["status"], string> = {
  PLANNED: "計画",
  PROMPT_GENERATED: "プロンプト生成済",
  ASSET_GENERATED: "素材生成済",
  REVIEWED: "確認済",
  SCHEDULED: "予約済",
  PUBLISHED: "公開済",
  REJECTED: "却下",
};

/**
 * The dashboard's signature element: a horizontal strip that encodes each
 * asset's real position in the content pipeline (Planned -> ... -> Published),
 * filling from coral to turquoise as it progresses. REJECTED renders as a
 * distinct flat warn-colored bar rather than a position on the track.
 */
export function StatusPipeline({ status }: { status: ContentAsset["status"] }) {
  if (status === "REJECTED") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 6, borderRadius: 4, background: "var(--color-warn-soft)" }} />
        <span className="pill pill-warn">{STEP_LABEL.REJECTED}</span>
      </div>
    );
  }

  const currentIndex = PIPELINE_STEPS.indexOf(status);

  return (
    <div>
      <div style={{ display: "flex", gap: 3 }}>
        {PIPELINE_STEPS.map((step, i) => {
          const filled = i <= currentIndex;
          const t = i / (PIPELINE_STEPS.length - 1);
          const color = filled ? mixCoralTurquoise(t) : "var(--color-border)";
          return (
            <div
              key={step}
              title={STEP_LABEL[step]}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 4,
                background: color,
              }}
            />
          );
        })}
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: "var(--color-muted)" }}>{STEP_LABEL[status]}</div>
    </div>
  );
}

/** Linearly interpolates between the brand coral and turquoise for a 0-1 progress value. */
function mixCoralTurquoise(t: number): string {
  const coral = { r: 255, g: 77, b: 109 };
  const turquoise = { r: 0, g: 184, b: 160 };
  const r = Math.round(coral.r + (turquoise.r - coral.r) * t);
  const g = Math.round(coral.g + (turquoise.g - coral.g) * t);
  const b = Math.round(coral.b + (turquoise.b - coral.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}
