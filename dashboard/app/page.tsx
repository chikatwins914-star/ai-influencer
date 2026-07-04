"use client";

import { useEffect, useState } from "react";
import { api, type Character, type ContentAsset } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusPipeline } from "@/components/StatusPipeline";
import {
  AIDisclosureHeader,
  AIDisclosureTag,
  PostPreviewWithDisclosure,
  InstagramPublishChecklist,
  FanvueDisclosureWarning,
} from "@/components/AIDisclosure";

export default function DashboardPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"generate" | "schedule" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const characters = await api.characters.list();
      const primary = characters[0] ?? null;
      setCharacter(primary);
      if (primary) {
        const list = await api.content.assets(primary.id);
        setAssets(list);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleGenerateToday() {
    if (!character) return;
    setActionLoading("generate");
    setError(null);
    try {
      const result = await api.content.generateToday(character.id);
      setLastAction(
        `今日分を生成しました: 画像${result.counts.images}枚 / リール${result.counts.videos}本 / ストーリー${result.counts.stories}本`
      );
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleScheduleToday() {
    if (!character) return;
    setActionLoading("schedule");
    setError(null);
    try {
      const result = await api.instagram.dailyOps(character.id);
      setLastAction(`投稿をスケジュール済みにしました`);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "スケジュール設定に失敗しました");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return <div className="p-8">読み込み中...</div>;
  }

  if (!character) {
    return <div className="p-8 text-center text-gray-500">キャラクターが見つかりません</div>;
  }

  const imageCount = assets.filter((a) => a.type === "IMAGE").length;
  const reelCount = assets.filter((a) => a.type === "VIDEO_REEL").length;
  const storyCount = assets.filter((a) => a.type === "STORY").length;
  const publishedCount = assets.filter((a) => a.status === "PUBLISHED").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title={`${character.name} - AI Influencer Dashboard`} description="AI disclosure policy compliant" />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <AIDisclosureHeader />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <strong>エラー:</strong> {error}
          </div>
        )}

        {lastAction && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
            <strong>✓ {lastAction}</strong>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          <StatCard label="生成済み画像" value={imageCount} />
          <StatCard label="生成済みリール" value={reelCount} />
          <StatCard label="生成済みストーリー" value={storyCount} />
          <StatCard label="公開済み" value={publishedCount} />
        </div>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">今日のタスク</h2>
          <div className="space-y-3">
            <p className="text-gray-600">
              このボタンで今日の投稿(画像20枚 + リール3本 + ストーリー5本)を自動生成します。
              <strong className="text-amber-700"> AI開示タグは自動付与されます。</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleGenerateToday}
                disabled={actionLoading === "generate"}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading === "generate" ? "生成中..." : "今日の投稿を生成"}
              </button>
              <button
                onClick={handleScheduleToday}
                disabled={actionLoading === "schedule"}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading === "schedule" ? "スケジュール中..." : "投稿をスケジュール"}
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Instagram投稿前チェック</h2>
          <InstagramPublishChecklist />
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Fanvueプロフィール管理</h2>
          <FanvueDisclosureWarning />
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">生成状況</h2>
          <div className="space-y-3">
            {assets.slice(0, 5).map((asset) => (
              <StatusPipeline key={asset.id} status={asset.status} />
            ))}
            {assets.length === 0 && <p className="text-gray-500 text-sm">まだコンテンツがありません</p>}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">最近の生成コンテンツ</h2>
          <div className="space-y-4">
            {assets.slice(0, 5).map((asset) => (
              <PostPreviewWithDisclosure key={asset.id} caption={asset.prompt.slice(0, 100)} mediaType={asset.type} />
            ))}
            {assets.length === 0 && <p className="text-gray-500 text-center py-8">まだコンテンツがありません</p>}
          </div>
        </section>

        <section id="ai-policy" className="bg-gray-900 text-white rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3">AI Disclosure Policy Reference</h3>
          <div className="space-y-2 text-sm font-mono">
            <div>
              <strong>Caption Tag:</strong> <AIDisclosureTag />
            </div>
            <div>
              <strong>Fanvue Profile:</strong> <br />
              <span className="text-gray-300 text-xs">
                "This profile features an AI-generated persona. All images, videos, and messages are synthetic
                content, not a real person."
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
