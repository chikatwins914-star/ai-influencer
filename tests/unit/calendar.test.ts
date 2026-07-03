import { describe, expect, it } from "vitest";
import { buildYearPlan } from "../../src/services/calendarService.js";
import { buildHolidayLookup, lookupHoliday } from "../../shared/holidays.js";

describe("holiday lookup", () => {
  it("identifies fixed-date holidays", () => {
    const lookup = buildHolidayLookup(new Date("2026-01-01T00:00:00"), 366);
    expect(lookupHoliday(lookup, new Date(2026, 6, 1))).toBe("Canada Day"); // July 1
    expect(lookupHoliday(lookup, new Date(2026, 11, 25))).toBe("Christmas Day");
  });

  it("identifies floating holidays (US Thanksgiving = 4th Thursday of November)", () => {
    const lookup = buildHolidayLookup(new Date("2026-01-01T00:00:00"), 366);
    const thanksgiving = lookupHoliday(lookup, new Date(2026, 10, 26)); // Nov 26, 2026 is the 4th Thursday
    expect(thanksgiving).toBe("US Thanksgiving");
  });
});

describe("buildYearPlan", () => {
  it("generates exactly `days` entries", () => {
    const plan = buildYearPlan("2026-07-04", 365);
    expect(plan).toHaveLength(365);
  });

  it("covers consecutive calendar dates with no gaps or duplicates", () => {
    const plan = buildYearPlan("2026-07-04", 30);
    const dates = plan.map((p) => p.date);
    expect(new Set(dates).size).toBe(30);
  });

  it("marks known holidays within the range", () => {
    const plan = buildYearPlan("2026-01-01", 365);
    const canadaDay = plan.find((p) => p.date === "2026-07-01");
    expect(canadaDay?.isHoliday).toBe(true);
    expect(canadaDay?.holidayName).toBe("Canada Day");
  });

  it("includes a Fanvue promo roughly every 4 days and a UGC slot every 7 days", () => {
    const plan = buildYearPlan("2026-07-04", 28);
    const fanvueCount = plan.filter((p) => p.fanvuePromo).length;
    const ugcCount = plan.filter((p) => p.productTieIn !== null).length;
    expect(fanvueCount).toBe(7); // 28 / 4
    expect(ugcCount).toBe(4); // 28 / 7
  });

  it("rotates through all content genres, including student-life ones", () => {
    const plan = buildYearPlan("2026-07-04", 12);
    const genres = new Set(plan.map((p) => p.genre));
    expect(genres.has("ROOM_SELFIE")).toBe(true);
    expect(genres.has("LIBRARY_STUDY")).toBe(true);
  });
});
