"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, type AnalyticsSnapshot } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";

interface SnapshotForm {
  periodStart: string;
  periodEnd: string;
  igReach: string;
  igSaveRate: string;
  igRetentionRate: string;
  igFollowerGrowth: string;
  fanvueRevenue: string;
  fanvueCvr: string;
  ugcDealCloseRate: string;
}

const EMPTY_FORM: SnapshotForm = {
  periodStart: "",
  periodEnd: "",
  igReach: "",
  igSaveRate: "",
  igRetentionRate: "",
  igFollowerGrowth: "",
  fanvueRevenue: "",
  fanvueCvr: "",
  ugcDealCloseRate: "",
};

const FIELD_LABEL: Record<keyof Omit<SnapshotForm, "periodStart" | "periodEnd">, string> = {
  igReach: "IGリーチ",
  igSaveRate: "IG保存率 (0-1)",
  igRetentionRate: "IG視聴維持率 (0-1)",
  igFollowerGrowth: "IGフォロワー増加数",
  fanvueRevenue: "Fanvue売上",
  fanvueCvr: "Fanvue CVR (0-1)",
  ugcDealCloseRate: "UGC成約率 (0-1)",
};

export default function AnalyticsPage() {
  const [snapshots, setSnapshots] = useState<AnalyticsSnapshot[]>([]);
  const [form, setForm] = useState<SnapshotForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [report, setReport] = useState<{ summary: string; recommendations: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setSnapshots(await api.analytics.snapshots());
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRecordSnapshot(e: FormEvent) {
    e.preventDefault();
    if (!form.periodStart || !form.periodEnd) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
      };
      for (const key of Object.keys(FIELD_LABEL) as Array<keyof typeof FIELD_LABEL>) {
        if (form[key] !== "") payload[key] = Number(form[key]);
      }
      await api.analytics.recordSnapshot(payload);
      setForm(EMPTY_FORM);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "記録に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function handleWeeklyReport() {
    setReportBusy(true);
    setError(null);
    try {
      const result = await api.analytics.weeklyReport();
      setReport({ summary: result.summary, recommendations: result.recommendations });
    } catch (e) {
      setError(e instanceof Error ? e.message : "レポート生成に失敗しました(スナップショットが必要です)");
    } finally {
      setReportBusy(false);
    }
  }

  if (loading) return <div className="empty-state">読み込み中...</div>;

  return (
    <div>
      <PageHeader title="分析" description="週次スナップショットとルールベースの改善提案" />

      {error && (
        <div className="card" style={{ borderColor: "var(--color-coral)", marginBottom: 16 }}>
          <strong style={{ color: "var(--color-coral)" }}>エラー:</strong> {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>週次スナップショットを記録</h3>
        <form onSubmit={handleRecordSnapshot}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
            <div>
              <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                期間開始
              </label>
              <input
                type="date"
                value={form.periodStart}
                onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
                style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", width: "100%" }}
              />
            </div>
            <div>
              <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                期間終了
              </label>
              <input
                type="date"
                value={form.periodEnd}
                onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
                style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", width: "100%" }}
              />
            </div>
            {(Object.keys(FIELD_LABEL) as Array<keyof typeof FIELD_LABEL>).map((key) => (
              <div key={key}>
                <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  {FIELD_LABEL[key]}
                </label>
                <input
                  type="number"
                  step="any"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", width: "100%" }}
                />
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: 14 }}>
            {saving ? "記録中..." : "記録する"}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>週次レポート</h3>
          <button onClick={handleWeeklyReport} disabled={reportBusy} className="btn btn-secondary">
            {reportBusy ? "生成中..." : "最新スナップショットからレポート生成"}
          </button>
        </div>
        {report && (
          <div>
            <p style={{ fontSize: 13, marginBottom: 10 }}>{report.summary}</p>
            <ul style={{ fontSize: 13, paddingLeft: 18 }}>
              {report.recommendations.map((r, i) => (
                <li key={i} style={{ marginBottom: 4 }}>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {snapshots.length === 0 ? (
        <div className="empty-state">スナップショットがまだありません。</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>期間</th>
              <th>IGリーチ</th>
              <th>IG保存率</th>
              <th>Fanvue売上</th>
              <th>Fanvue CVR</th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((s) => (
              <tr key={s.id}>
                <td>
                  {new Date(s.periodStart).toLocaleDateString("ja-JP")} 〜{" "}
                  {new Date(s.periodEnd).toLocaleDateString("ja-JP")}
                </td>
                <td>{s.igReach ?? "-"}</td>
                <td>{s.igSaveRate != null ? `${(s.igSaveRate * 100).toFixed(1)}%` : "-"}</td>
                <td>{s.fanvueRevenue != null ? `$${s.fanvueRevenue}` : "-"}</td>
                <td>{s.fanvueCvr != null ? `${(s.fanvueCvr * 100).toFixed(1)}%` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
