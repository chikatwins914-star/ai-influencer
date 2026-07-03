/**
 * Shared domain types used across src/ (API), scripts/ (batch jobs),
 * and dashboard/ (Web UI). Kept in sync with database/schema.prisma
 * for the enum-like string unions.
 */

export type ContentGenre =
  | "GYM"
  | "MORNING_ROUTINE"
  | "COFFEE"
  | "TENNIS"
  | "BEACH"
  | "MIRROR_SELFIE"
  | "HEALTHY_FOOD"
  | "TRAVEL"
  | "CASUAL_DATE"
  | "BEHIND_THE_SCENES"
  | "ROOM_SELFIE"
  | "LIBRARY_STUDY";

export const ALL_CONTENT_GENRES: readonly ContentGenre[] = [
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
];

export type ContentType = "IMAGE" | "VIDEO_REEL" | "STORY";

export type ContentStatus =
  | "PLANNED"
  | "PROMPT_GENERATED"
  | "ASSET_GENERATED"
  | "REVIEWED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "REJECTED";

export interface VideoStructure {
  hook: string;
  body: string;
  ending: string;
  cta: string;
}

export interface CharacterProfile {
  id?: string;
  name: string;
  isAI: true;
  age: number;
  heightCm: number;
  weightKg: number;
  personality: string;
  hobbies: string[];
  speechStyle: string;
  favoriteFoods: string[];
  dislikedFoods: string[];
  trainingRoutine: string;
  tennisHistory: string;
  brandColor: string;
  fashionStyle: string;
  hairStyle: string;
  faceFeatures: string;
  eyeDescription: string;
  skinDescription: string;
  accessories: string[];
  worldview: string;
}

export interface GeneratedPrompt {
  genre: ContentGenre;
  type: ContentType;
  prompt: string;
  negativePrompt?: string;
  videoStructure?: VideoStructure;
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
