"use client";

import { useEffect, useState } from "react";
import { api, type Character, type ContentAsset } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { StatusPipeline } from "@/components/StatusPipeline";

const TYPE_LABEL: Record<ContentAsset["type"], string> = {
  IMAGE: "画像",
  VIDEO_REEL: "リール",
  STORY: "ストーリー",
};

export default function ContentPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [typeFilter, setTypeFilter] = useState<ContentAsset["type"] | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyAssetId, setBusyAssetId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const characters = await api.characters.list();
      const primary = characters[0] ?? null;
      setCharacter(primary);
      if (primary) {
        const list = await api.content.assets(primary.id, typeFilter === "ALL" ? undefined : typeFilter);
        setAssets(list);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  async function handleGenerateAsset(assetId: string) {
    setBusyAssetId(assetId);
    setError(null);
    try {
      await api.content.generateAssets([assetId]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました");
    } finally {
      setBusyAssetId(null);
    }
  }

  if (loading) return <div className="empty-state">読み込み中...</div>;

  return (
    <div>
      <PageHeader title="コンテンツ" description="生成済みの画像・リール・ストーリー一覧" />

      {error && (
        <div className="card" style={{ borderColor: "var(--color-coral)", marginBottom: 16 }}>
          <strong style={{ color: "var(--color-coral)" }}>エラー:</strong> {error}
        </div>
      )}

      {!character ? (
        <div className="empty-state">キャラクターが登録されていません。</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {(["ALL", "IMAGE", "VIDEO_REEL", "STORY"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`btn ${typeFilter === t ? "btn-primary" : "btn-secondary"}`}
              >
                {t === "ALL" ? "すべて" : TYPE_LABEL[t]}
              </button>
            ))}
          </div>

          {assets.length === 0 ? (
            <div className="empty-state">
              コンテンツがまだありません。「今日のタスク」ページで生成してください。
            </div>
          ) : (
            assets.map((asset) => (
              <div className="card" key={asset.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span className="pill pill-turquoise">{TYPE_LABEL[asset.type]}</span>
                      <span className="pill pill-muted">{asset.genre}</span>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {new Date(asset.createdAt).toLocaleString("ja-JP")}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 640 }}>{asset.prompt}</p>
                    {asset.filePath && (
                      <p className="muted mono" style={{ fontSize: 11, marginTop: 6 }}>
                        {asset.filePath}
                      </p>
                    )}
                  </div>
                  <div style={{ width: 200, flexShrink: 0 }}>
                    <StatusPipeline status={asset.status} />
                    {asset.status === "PROMPT_GENERATED" && (
                      <button
                        onClick={() => handleGenerateAsset(asset.id)}
                        disabled={busyAssetId === asset.id}
                        className="btn btn-secondary"
                        style={{ marginTop: 10, width: "100%" }}
                      >
                        {busyAssetId === asset.id ? "生成中..." : "素材を生成"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
