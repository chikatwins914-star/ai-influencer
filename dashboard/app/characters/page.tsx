"use client";

import { useEffect, useState } from "react";
import { api, type Character } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.characters
      .list()
      .then(setCharacters)
      .catch((e) => setError(e instanceof Error ? e.message : "読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="キャラクター" description="運用中のAIペルソナ一覧" />

      {loading ? (
        <div className="empty-state">読み込み中...</div>
      ) : error ? (
        <div className="empty-state">API通信エラー: {error}</div>
      ) : characters.length === 0 ? (
        <div className="empty-state">キャラクターが登録されていません。database/seed.ts を実行してください。</div>
      ) : (
        characters.map((c) => (
          <div className="card" key={c.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span
                    aria-hidden
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: c.brandColor.split("(")[0]?.trim().split(" ")[0] ?? "var(--color-coral)",
                      display: "inline-block",
                      border: "1px solid var(--color-border)",
                    }}
                  />
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>{c.name}</span>
                  <span className="pill pill-turquoise">AI生成</span>
                </div>
                <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
                  {c.age}歳 / {c.heightCm}cm / {c.weightKg}kg
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 560 }}>{c.personality}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                  {c.hobbies.map((h) => (
                    <span key={h} className="pill pill-muted">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ width: 260, fontSize: 13 }}>
                <div className="muted" style={{ marginBottom: 4 }}>
                  ファッション
                </div>
                <div style={{ marginBottom: 12 }}>{c.fashionStyle}</div>
                <div className="muted" style={{ marginBottom: 4 }}>
                  世界観
                </div>
                <div style={{ lineHeight: 1.5 }}>{c.worldview}</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
