"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, type FanvuePost } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { FanvueDisclosureWarning } from "@/components/AIDisclosure";

const STATUS_LABEL: Record<FanvuePost["status"], string> = {
  DRAFT: "下書き",
  SCHEDULED: "予約済",
  PUBLISHED: "公開済",
};

export default function FanvuePage() {
  const [posts, setPosts] = useState<FanvuePost[]>([]);
  const [funnelCopy, setFunnelCopy] = useState<{ captionCta: string; bioLine: string; profileUrl: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [postList, copy] = await Promise.all([
        api.fanvue.posts(),
        api.fanvue.funnelCopy(new Date().toISOString()),
      ]);
      setPosts(postList);
      setFunnelCopy(copy);
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreatePost(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.fanvue.createPost({
        title: title.trim(),
        description: description.trim(),
        ...(price ? { price: Number(price) } : {}),
      });
      setTitle("");
      setDescription("");
      setPrice("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="empty-state">読み込み中...</div>;

  return (
    <div>
      <PageHeader title="Fanvue" description="投稿ドラフト管理・Instagram誘導コピー" />

      {error && (
        <div className="card" style={{ borderColor: "var(--color-coral)", marginBottom: 16 }}>
          <strong style={{ color: "var(--color-coral)" }}>エラー:</strong> {error}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <FanvueDisclosureWarning />
      </div>

      {funnelCopy && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Instagram → Fanvue 誘導コピー</h3>
          <div style={{ fontSize: 13, marginBottom: 6 }}>
            <span className="muted">キャプションCTA: </span>
            {funnelCopy.captionCta}
          </div>
          <div style={{ fontSize: 13, marginBottom: 6 }}>
            <span className="muted">バイオ: </span>
            {funnelCopy.bioLine}
          </div>
          <div className="mono muted" style={{ fontSize: 12 }}>
            {funnelCopy.profileUrl}
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>新規投稿ドラフト</h3>
        <form onSubmit={handleCreatePost} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            placeholder="タイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)" }}
          />
          <textarea
            placeholder="説明"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)" }}
          />
          <input
            placeholder="価格(任意)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", width: 160 }}
          />
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
            {saving ? "作成中..." : "ドラフト作成"}
          </button>
        </form>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">投稿ドラフトがまだありません。</div>
      ) : (
        posts.map((p) => (
          <div className="card" key={p.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.title}</div>
                <p className="muted" style={{ fontSize: 13, maxWidth: 500 }}>
                  {p.description}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className="pill pill-turquoise">{STATUS_LABEL[p.status]}</span>
                {p.price != null && <div style={{ fontSize: 13, marginTop: 6 }}>${p.price}</div>}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
