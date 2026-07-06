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
  /** Public URL to view the generated file (served from the API host), or
   * null until an asset has actually been generated via generate-assets. */
  mediaUrl: string | null;
  status: "PLANNED" | "PROMPT_GENERATED" | "ASSET_GENERATED" | "REVIEWED" | "SCHEDULED" | "PUBLISHED" | "REJECTED";
  scheduledFor: string | null;
  publishedAt: string | null;
  createdAt: string;
}

/** Prepends the API host to a mediaUrl (e.g. "/media/images/...") so it can
 * be used directly as an <img>/<video> src or download link from the
 * dashboard's own origin. */
export function absoluteMediaUrl(mediaUrl: string): string {
  return `${API_BASE}${mediaUrl}`;
}

/** Fetches a generated media file as a blob and triggers a browser download
 * with the given filename — plain <a download> doesn't reliably force a
 * save for cross-origin URLs, so this reads the bytes via fetch (the API's
 * CORS policy already allows this dashboard's origin) and saves via an
 * object URL instead. */
export async function downloadMedia(mediaUrl: string, filename: string): Promise<void> {
  const res = await fetch(absoluteMediaUrl(mediaUrl));
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
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

export type UGCCategory =
  | "SKINCARE"
  | "SUPPLEMENT"
  | "SPORTS_EQUIPMENT"
  | "TENNIS_EQUIPMENT"
  | "BEAUTY"
  | "GADGET"
  | "OTHER";

export type UGCStatus =
  | "LEAD"
  | "PITCHED"
  | "NEGOTIATING"
  | "CONTRACTED"
  | "IN_PRODUCTION"
  | "DELIVERED"
  | "PAID"
  | "DECLINED";

export interface UGCDeal {
  id: string;
  brandName: string;
  category: UGCCategory;
  status: UGCStatus;
  contactEmail: string | null;
  fee: number | null;
  script: string | null;
  deliverablePath: string | null;
  disclosureConfirmed: boolean;
  dueDate: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const ALL_UGC_CATEGORIES: UGCCategory[] = [
  "SKINCARE",
  "SUPPLEMENT",
  "SPORTS_EQUIPMENT",
  "TENNIS_EQUIPMENT",
  "BEAUTY",
  "GADGET",
  "OTHER",
];

export const ALL_UGC_STATUSES: UGCStatus[] = [
  "LEAD",
  "PITCHED",
  "NEGOTIATING",
  "CONTRACTED",
  "IN_PRODUCTION",
  "DELIVERED",
  "PAID",
  "DECLINED",
];

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
    generateAssets: (assetIds: string[]) =>
      request<{ outcomes: Array<{ assetId: string; status: string; filePath?: string; error?: string }> }>(
        "/api/content/generate-assets",
        { method: "POST", body: JSON.stringify({ assetIds }) }
      ),
    /** Registers a manually-produced file (e.g. a video edited outside this
     * system) as a ContentAsset — bypasses AI generation, uses FormData
     * (not the shared `request` helper, which always sends JSON). */
    uploadAsset: async (params: {
      characterId: string;
      type: ContentAsset["type"];
      genre: string;
      prompt?: string;
      file: File;
    }): Promise<ContentAsset> => {
      const form = new FormData();
      form.append("characterId", params.characterId);
      form.append("type", params.type);
      form.append("genre", params.genre);
      if (params.prompt) form.append("prompt", params.prompt);
      form.append("file", params.file);

      const res = await fetch(`${API_BASE}/api/content/upload-asset`, { method: "POST", body: form });
      if (!res.ok) throw new ApiError(await res.text(), res.status);
      return (await res.json()) as ContentAsset;
    },
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
    generate: (characterId: string, startDate: string, days?: number) =>
      request<{ count: number }>("/api/calendar/generate", {
        method: "POST",
        body: JSON.stringify({ characterId, startDate, ...(days ? { days } : {}) }),
      }),
  },
  fanvue: {
    posts: () => request<FanvuePost[]>("/api/fanvue/posts"),
    createPost: (input: { title: string; description: string; price?: number; scheduledFor?: string }) =>
      request<FanvuePost>("/api/fanvue/posts", { method: "POST", body: JSON.stringify(input) }),
    funnelCopy: (seedKey: string) =>
      request<{ captionCta: string; bioLine: string; profileUrl: string }>(
        `/api/fanvue/funnel-copy?seedKey=${encodeURIComponent(seedKey)}`
      ),
    messageTemplates: () =>
      request<Array<{ id: string; category: string; template: string; variables: string[] }>>(
        "/api/fanvue/message-templates"
      ),
    seedMessageTemplates: () =>
      request<{ created: string[] }>("/api/fanvue/message-templates/seed", { method: "POST" }),
    draftMessage: (category: string, variables: Record<string, string>) =>
      request<{ text: string }>(`/api/fanvue/message-templates/${category}/draft`, {
        method: "POST",
        body: JSON.stringify({ variables }),
      }),
  },
  analytics: {
    snapshots: (limit = 10) => request<AnalyticsSnapshot[]>(`/api/analytics/snapshots?limit=${limit}`),
    recordSnapshot: (input: Record<string, unknown>) =>
      request<AnalyticsSnapshot>("/api/analytics/snapshot", { method: "POST", body: JSON.stringify(input) }),
    weeklyReport: () =>
      request<{ snapshotId: string; summary: string; recommendations: string[]; reportPath: string }>(
        "/api/analytics/weekly-report",
        { method: "POST" }
      ),
  },
  ugc: {
    list: () => request<UGCDeal[]>("/api/ugc"),
    create: (input: { brandName: string; category: UGCCategory; contactEmail?: string; fee?: number }) =>
      request<UGCDeal>("/api/ugc", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, input: Partial<Pick<UGCDeal, "status" | "category" | "fee" | "contactEmail" | "disclosureConfirmed" | "deliverablePath">>) =>
      request<UGCDeal>(`/api/ugc/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    generateScript: (id: string, productName: string) =>
      request<UGCDeal>(`/api/ugc/${id}/script`, { method: "POST", body: JSON.stringify({ productName }) }),
  },
};
