import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";

/** Default posting times (local time-of-day strings) when no calendar entry overrides them. */
const DEFAULT_TIMES = {
  image: "09:00",
  reels: ["12:00", "15:30", "19:00"],
  stories: ["08:30", "11:00", "14:00", "17:00", "20:30"],
};

/**
 * Selects today's unscheduled PROMPT_GENERATED assets (1 image, up to 3
 * reels, up to 5 stories — matching the daily posting spec) and assigns
 * scheduledFor timestamps + moves them to SCHEDULED status. Does not
 * publish anything itself — that's a separate explicit step via
 * instagramService, so a human can review scheduled content first.
 */
export async function planTodayInstagramOps(characterId: string, dateISO: string) {
  const calendarEntry = await prisma.calendarEntry.findUnique({
    where: { characterId_date: { characterId, date: new Date(dateISO) } },
  });

  const [image] = await prisma.contentAsset.findMany({
    where: { characterId, type: "IMAGE", status: "PROMPT_GENERATED" },
    orderBy: { createdAt: "asc" },
    take: 1,
  });

  const reels = await prisma.contentAsset.findMany({
    where: { characterId, type: "VIDEO_REEL", status: "PROMPT_GENERATED" },
    orderBy: { createdAt: "asc" },
    take: 3,
  });

  const stories = await prisma.contentAsset.findMany({
    where: { characterId, type: "STORY", status: "PROMPT_GENERATED" },
    orderBy: { createdAt: "asc" },
    take: 5,
  });

  const scheduled: { images: string[]; reels: string[]; stories: string[] } = {
    images: [],
    reels: [],
    stories: [],
  };

  if (image) {
    const time = calendarEntry?.postTime ?? DEFAULT_TIMES.image;
    await prisma.contentAsset.update({
      where: { id: image.id },
      data: { status: "SCHEDULED", scheduledFor: combineDateAndTime(dateISO, time) },
    });
    scheduled.images.push(image.id);
  }

  for (const [i, reel] of reels.entries()) {
    const time = DEFAULT_TIMES.reels[i] ?? DEFAULT_TIMES.reels[0] ?? "12:00";
    await prisma.contentAsset.update({
      where: { id: reel.id },
      data: { status: "SCHEDULED", scheduledFor: combineDateAndTime(dateISO, time) },
    });
    scheduled.reels.push(reel.id);
  }

  for (const [i, story] of stories.entries()) {
    const time = DEFAULT_TIMES.stories[i] ?? DEFAULT_TIMES.stories[0] ?? "09:00";
    await prisma.contentAsset.update({
      where: { id: story.id },
      data: { status: "SCHEDULED", scheduledFor: combineDateAndTime(dateISO, time) },
    });
    scheduled.stories.push(story.id);
  }

  logger.info({ characterId, dateISO, scheduled }, "Today's Instagram ops planned");

  return {
    theme: calendarEntry?.theme ?? null,
    cta: calendarEntry?.cta ?? null,
    fanvuePromo: calendarEntry?.fanvuePromo ?? false,
    scheduled,
  };
}

function combineDateAndTime(dateISO: string, time: string): Date {
  return new Date(`${dateISO}T${time}:00`);
}
