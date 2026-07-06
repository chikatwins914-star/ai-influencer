"use client";

import { useEffect, useState } from "react";
import { api, type Character, type CalendarEntry } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function CalendarPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const characters = await api.characters.list();
      const primary = characters[0] ?? null;
      setCharacter(primary);
      if (primary) {
        const list = await api.calendar.list(primary.id, todayISO(), addDaysISO(todayISO(), 30));
        setEntries(list);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleGenerate() {
    if (!character) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await api.calendar.generate(character.id, todayISO(), 365);
      await load();
      // eslint-disable-next-line no-alert
      alert(`${result.count}日分のカレンダーを生成しました`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <div className="empty-state">読み込み中...</div>;

  return (
    <div>
      <PageHeader title="投稿カレンダー" description="今後30日分のテーマ・投稿予定(全体は365日分生成可能)" />

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
            <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
              まだ生成していない場合、または延長したい場合はこちらから365日分のカレンダーを生成できます。
            </p>
            <button onClick={handleGenerate} disabled={generating} className="btn btn-primary">
              {generating ? "生成中..." : "365日分のカレンダーを生成"}
            </button>
          </div>

          {entries.length === 0 ? (
            <div className="empty-state">この期間の予定がありません。上のボタンから生成してください。</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>日付</th>
                  <th>時刻</th>
                  <th>テーマ</th>
                  <th>ジャンル</th>
                  <th>CTA</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td>
                      {new Date(e.date).toLocaleDateString("ja-JP")}
                      {e.isHoliday && (
                        <span className="pill pill-coral" style={{ marginLeft: 6 }}>
                          {e.holidayName}
                        </span>
                      )}
                    </td>
                    <td className="mono">{e.postTime}</td>
                    <td>{e.theme}</td>
                    <td>{e.genre ? <span className="pill pill-muted">{e.genre}</span> : "-"}</td>
                    <td className="muted" style={{ maxWidth: 260 }}>
                      {e.cta ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
