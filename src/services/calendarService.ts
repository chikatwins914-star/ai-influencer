import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import { ALL_CONTENT_GENRES, type ContentGenre } from "../../shared/types.js";
import { buildHolidayLookup, lookupHoliday } from "../../shared/holidays.js";

const CTA_POOL = [
  "Comment your thoughts below!",
  "Save this for later!",
  "Tag a friend who needs to see this!",
  "Link in bio!",
  "DM me for more details!",
  "Let me know what you think 👇",
];

const GENRE_THEME_LABEL: Record<ContentGenre, string> = {
  GYM: "Gym / Fitness",
  MORNING_ROUTINE: "Morning Routine",
  COFFEE: "Coffee Break",
  TENNIS: "Tennis",
  BEACH: "Beach Day",
  MIRROR_SELFIE: "Outfit / Mirror Selfie",
  HEALTHY_FOOD: "Healthy Food",
  TRAVEL: "Travel / Study Abroad",
  CASUAL_DATE: "Casual Date",
  BEHIND_THE_SCENES: "Behind the Scenes",
  ROOM_SELFIE: "Dorm Life / Room Selfie",
  LIBRARY_STUDY: "Library / Study Session",
};

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface CalendarDayPlan {
  date: string; // ISO date
  postTime: string;
  theme: string;
  genre: ContentGenre;
  cta: string;
  productTieIn: string | null;
  fanvuePromo: boolean;
  isHoliday: boolean;
  holidayName: string | null;
}

/**
 * Builds a `days`-length content calendar starting at `startDateISO`.
 * - Genre rotates through all genres so themes stay varied.
 * - Every 4th day includes a Fanvue promo nudge (roughly weekly cadence
 *   without hardcoding a specific weekday).
 * - Every 7th day reserves a UGC/product tie-in slot.
 * - Holidays (North American) override the theme with a festive variant.
 */
export function buildYearPlan(startDateISO: string, days = 365): CalendarDayPlan[] {
  const startDate = new Date(`${startDateISO}T00:00:00`);
  const holidayLookup = buildHolidayLookup(startDate, days);

  const plan: CalendarDayPlan[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateISO = toLocalISODate(date);

    const genre = ALL_CONTENT_GENRES[i % ALL_CONTENT_GENRES.length] as ContentGenre;
    const holidayName = lookupHoliday(holidayLookup, date) ?? null;
    const isHoliday = holidayName !== null;

    const theme = isHoliday ? `${holidayName} special — ${GENRE_THEME_LABEL[genre]}` : GENRE_THEME_LABEL[genre];
    const cta = CTA_POOL[i % CTA_POOL.length] ?? CTA_POOL[0]!;
    const fanvuePromo = i % 4 === 0;
    const productTieIn = i % 7 === 0 ? "UGC/product tie-in slot — assign from active UGC deals" : null;

    plan.push({
      date: dateISO,
      postTime: "09:00",
      theme,
      genre,
      cta,
      productTieIn,
      fanvuePromo,
      isHoliday,
      holidayName,
    });
  }

  return plan;
}

/** Persists a year plan as CalendarEntry rows (idempotent upsert per characterId+date). */
export async function persistYearPlan(characterId: string, startDateISO: string, days = 365) {
  const plan = buildYearPlan(startDateISO, days);

  for (const day of plan) {
    await prisma.calendarEntry.upsert({
      where: { characterId_date: { characterId, date: new Date(`${day.date}T00:00:00`) } },
      update: {
        postTime: day.postTime,
        theme: day.theme,
        genre: day.genre,
        cta: day.cta,
        productTieIn: day.productTieIn,
        fanvuePromo: day.fanvuePromo,
        isHoliday: day.isHoliday,
        holidayName: day.holidayName,
      },
      create: {
        characterId,
        date: new Date(`${day.date}T00:00:00`),
        postTime: day.postTime,
        theme: day.theme,
        genre: day.genre,
        cta: day.cta,
        productTieIn: day.productTieIn,
        fanvuePromo: day.fanvuePromo,
        isHoliday: day.isHoliday,
        holidayName: day.holidayName,
      },
    });
  }

  logger.info({ characterId, startDateISO, days }, "Year calendar persisted");
  return { count: plan.length };
}
