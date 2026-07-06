"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, ALL_UGC_CATEGORIES, ALL_UGC_STATUSES, type UGCDeal, type UGCCategory, type UGCStatus } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { UGCDisclosureChecklist } from "@/components/AIDisclosure";

const CATEGORY_LABEL: Record<UGCCategory, string> = {
  SKINCARE: "スキンケア",
  SUPPLEMENT: "サプリメント",
  SPORTS_EQUIPMENT: "スポーツ用品",
  TENNIS_EQUIPMENT: "テニス用品",
  BEAUTY: "ビューティー",
  GADGET: "ガジェット",
  OTHER: "その他",
};

const STATUS_LABEL: Record<UGCStatus, string> = {
  LEAD: "リード",
  PITCHED: "提案済",
  NEGOTIATING: "交渉中",
  CONTRACTED: "契約済",
  IN_PRODUCTION: "制作中",
  DELIVERED: "納品済",
  PAID: "入金済",
  DECLINED: "見送り",
};

export default function UgcPage() {
  const [deals, setDeals] = useState<UGCDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [brandName, setBrandName] = useState("");
  const [category, setCategory] = useState<UGCCategory>("OTHER");
  const [contactEmail, setContactEmail] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setDeals(await api.ugc.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!brandName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.ugc.create({
        brandName: brandName.trim(),
        category,
        ...(contactEmail.trim() ? { contactEmail: contactEmail.trim() } : {}),
      });
      setBrandName("");
      setContactEmail("");
      setCategory("OTHER");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: UGCStatus) {
    setBusyId(id);
    setError(null);
    try {
      await api.ugc.update(id, { status });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新に失敗しました");
    } finally {
      setBusyId(null);
    }
  }

  async function handleGenerateScript(deal: UGCDeal) {
    // eslint-disable-next-line no-alert
    const productName = window.prompt(`${deal.brandName}のUGC案件 — 商品名を入力してください:`);
    if (!productName) return;
    setBusyId(deal.id);
    setError(null);
    try {
      await api.ugc.generateScript(deal.id, productName);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "スクリプト生成に失敗しました");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="empty-state">読み込み中...</div>;

  return (
    <div>
      <PageHeader title="UGC案件" description="ブランドタイアップ案件の管理" />

      {error && (
        <div className="card" style={{ borderColor: "var(--color-coral)", marginBottom: 16 }}>
          <strong style={{ color: "var(--color-coral)" }}>エラー:</strong> {error}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <UGCDisclosureChecklist />
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>新規案件を追加</h3>
        <form onSubmit={handleCreate} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
              ブランド名
            </label>
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)" }}
            />
          </div>
          <div>
            <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
              カテゴリ
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as UGCCategory)}
              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)" }}
            >
              {ALL_UGC_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
              連絡先メール(任意)
            </label>
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)" }}
            />
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "追加中..." : "追加"}
          </button>
        </form>
      </div>

      {deals.length === 0 ? (
        <div className="empty-state">UGC案件がまだありません。</div>
      ) : (
        deals.map((deal) => (
          <div className="card" key={deal.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{deal.brandName}</span>
                  <span className="pill pill-muted">{CATEGORY_LABEL[deal.category]}</span>
                  {deal.fee != null && <span className="pill pill-coral">${deal.fee}</span>}
                </div>
                {deal.contactEmail && (
                  <div className="muted" style={{ fontSize: 13 }}>
                    {deal.contactEmail}
                  </div>
                )}
                {deal.script && (
                  <details style={{ marginTop: 10 }}>
                    <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--color-turquoise)" }}>
                      生成済みスクリプトを表示
                    </summary>
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        fontSize: 12,
                        marginTop: 8,
                        background: "var(--color-bg)",
                        padding: 12,
                        borderRadius: 8,
                      }}
                    >
                      {deal.script}
                    </pre>
                  </details>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <select
                  value={deal.status}
                  disabled={busyId === deal.id}
                  onChange={(e) => handleStatusChange(deal.id, e.target.value as UGCStatus)}
                  style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13 }}
                >
                  {ALL_UGC_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleGenerateScript(deal)}
                  disabled={busyId === deal.id}
                  className="btn btn-secondary"
                  style={{ display: "block", marginTop: 8, width: "100%" }}
                >
                  スクリプト生成
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
