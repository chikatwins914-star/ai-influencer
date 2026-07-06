"use client";

import { useEffect, useState } from "react";
import { api, absoluteMediaUrl, downloadMedia, type Character, type ContentAsset } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { StatusPipeline } from "@/components/StatusPipeline";

const TYPE_LABEL: Record<ContentAsset["type"], string> = {
  IMAGE: "画像",
  VIDEO_REEL: "リール",
  STORY: "ストーリー",
};

const GENRES = [
  "GYM",
  "MORNING_ROUTINE",
  "COFFEE",
  "TENNIS",
  "BEACH",
  "MIRROR_SELFIE",
  "HEALTHY_FOOD",
  "TRAVEL",
  "CASUAL_DATE",
  "BEHIND_THE_SCENES",
  "ROOM_SELFIE",
  "LIBRARY_STUDY",
  "MOTIVATION",
] as const;

export default function ContentPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [typeFilter, setTypeFilter] = useState<ContentAsset["type"] | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyAssetId, setBusyAssetId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<ContentAsset["type"]>("VIDEO_REEL");
  const [uploadGenre, setUploadGenre] = useState<(typeof GENRES)[number]>("GYM");
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploading, setUploading] = useState(false);

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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file next time
    if (!file || !character) return;

    setUploading(true);
    setError(null);
    try {
      await api.content.uploadAsset({
        characterId: character.id,
        type: uploadType,
        genre: uploadGenre,
        prompt: uploadCaption || undefined,
        file,
      });
      setUploadCaption("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(asset: ContentAsset) {
    if (!asset.mediaUrl) return;
    setDownloadingId(asset.id);
    setError(null);
    try {
      const ext = asset.mediaUrl.split(".").pop() ?? "bin";
      await downloadMedia(asset.mediaUrl, `${asset.genre}-${asset.id}.${ext}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ダウンロードに失敗しました");
    } finally {
      setDownloadingId(null);
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
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 14 }}>自分で作った動画/画像をアップロード</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value as ContentAsset["type"])}
                className="btn btn-secondary"
              >
                {(["VIDEO_REEL", "IMAGE", "STORY"] as const).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
              <select
                value={uploadGenre}
                onChange={(e) => setUploadGenre(e.target.value as (typeof GENRES)[number])}
                className="btn btn-secondary"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="キャプション(任意)"
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                style={{ flex: 1, minWidth: 160, padding: "8px 10px", borderRadius: 8 }}
              />
              <label className="btn btn-primary" style={{ cursor: uploading ? "not-allowed" : "pointer" }}>
                {uploading ? "アップロード中..." : "ファイルを選択"}
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,image/png,image/jpeg,image/webp"
                  onChange={handleUpload}
                  disabled={uploading}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>

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
                  {asset.mediaUrl && (
                    <div style={{ width: 140, flexShrink: 0 }}>
                      {asset.type === "VIDEO_REEL" ? (
                        <video
                          src={absoluteMediaUrl(asset.mediaUrl)}
                          controls
                          style={{ width: "100%", borderRadius: 8, background: "#000" }}
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={absoluteMediaUrl(asset.mediaUrl)}
                          alt={`${asset.genre} preview`}
                          style={{ width: "100%", borderRadius: 8, objectFit: "cover" }}
                        />
                      )}
                      <button
                        onClick={() => handleDownload(asset)}
                        disabled={downloadingId === asset.id}
                        className="btn btn-secondary"
                        style={{ marginTop: 8, width: "100%", fontSize: 12, padding: "6px 10px" }}
                      >
                        {downloadingId === asset.id ? "保存中..." : "ダウンロード"}
                      </button>
                    </div>
                  )}
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
