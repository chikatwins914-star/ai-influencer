const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(body || res.statusText, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface Character {
  id: string;
  name: string;
  age: number;
  heightCm: number;
  weightKg: number;
  personality: string;
  hobbies: string[];
  brandColor: string;
  fashionStyle: string;
  worldview: string;
}

export interface ContentAsset {
  id: string;
  characterId: string;
  type: "IMAGE" | "VIDEO_REEL" | "STORY";
  genre: string;
  prompt: string;
  negativePrompt: string | null;
  videoStructure: string | null;
  filePath: string | null;
  status: "PLANNED" | "PROMPT_GENERATED" | "ASSET_GENERATED" | "REVIEWED" | "SCHEDULED" | "PUBLISHED" | "REJECTED";
  scheduledFor: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export interface CalendarEntry {
  id: string;
  date: string;
  postTime: string;
  theme: string;
  genre: string | null;
  cta: string | null;
  productTieIn: string | null;
  fanvuePromo: boolean;
  isHoliday: boolean;
  holidayName: string | null;
}

export interface FanvuePost {
  id: string;
  title: string;
  description: string;
  price: number | null;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  scheduledFor: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export interface AnalyticsSnapshot {
  id: string;
  periodStart: string;
  periodEnd: string;
  igReach: number | null;
  igSaveRate: number | null;
  igRetentionRate: number | null;
  igFollowerGrowth: number | null;
  fanvueRevenue: number | null;
  fanvueCvr: number | null;
  ugcDealCloseRate: number | null;
  reportSummary: string | null;
  recommendations: string | null;
}

export const api = {
  characters: {
    list: () => request<Character[]>("/api/characters"),
  },
  content: {
    assets: (characterId: string, type?: ContentAsset["type"]) =>
      request<ContentAsset[]>(
        `/api/prompts/assets?characterId=${encodeURIComponent(characterId)}${type ? `&type=${type}` : ""}`
      ),
    generateToday: (characterId: string) =>
      request<{ date: string; counts: Record<string, number>; outputPath: string }>("/api/content/generate-today", {
        method: "POST",
        body: JSON.stringify({ characterId }),
      }),
  },
  instagram: {
    dailyOps: (characterId: string) =>
      request<{
        date: string;
        theme: string | null;
        cta: string | null;
        fanvuePromo: boolean;
        scheduled: Record<string, string[]>;
      }>("/api/instagram/daily-ops", { method: "POST", body: JSON.stringify({ characterId }) }),
  },
  calendar: {
    list: (characterId: string, from?: string, to?: string) => {
      const params = new URLSearchParams({ characterId });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      return request<CalendarEntry[]>(`/api/calendar?${params.toString()}`);
    },
  },
  fanvue: {
    posts: () => request<FanvuePost[]>("/api/fanvue/posts"),
    funnelCopy: (seedKey: string) =>
      request<{ captionCta: string; bioLine: string; profileUrl: string }>(
        `/api/fanvue/funnel-copy?seedKey=${encodeURIComponent(seedKey)}`
      ),
    messageTemplates: () =>
      request<Array<{ id: string; category: string; template: string; variables: string[] }>>(
        "/api/fanvue/message-templates"
      ),
  },
  analytics: {
    snapshots: (limit = 10) => request<AnalyticsSnapshot[]>(`/api/analytics/snapshots?limit=${limit}`),
  },
};
