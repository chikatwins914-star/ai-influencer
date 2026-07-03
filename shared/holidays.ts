/**
 * North American (Canada + US) holiday calculator, covering the holidays
 * most relevant to lifestyle/fitness content calendars. Not exhaustive —
 * add more via FIXED_DATE_HOLIDAYS / floatingHolidaysForYear() as needed.
 */

export interface HolidayOnDate {
  name: string;
  date: Date; // local date, time set to midnight
}

const FIXED_DATE_HOLIDAYS: Array<{ month: number; day: number; name: string }> = [
  { month: 1, day: 1, name: "New Year's Day" },
  { month: 2, day: 14, name: "Valentine's Day" },
  { month: 3, day: 17, name: "St. Patrick's Day" },
  { month: 7, day: 1, name: "Canada Day" },
  { month: 7, day: 4, name: "US Independence Day" },
  { month: 10, day: 31, name: "Halloween" },
  { month: 12, day: 24, name: "Christmas Eve" },
  { month: 12, day: 25, name: "Christmas Day" },
  { month: 12, day: 31, name: "New Year's Eve" },
];

/** weekday: 0=Sunday..6=Saturday. n=1 means first occurrence, n=-1 means last occurrence in the month. */
function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  if (n > 0) {
    const first = new Date(year, month - 1, 1);
    const firstWeekday = first.getDay();
    const offset = (weekday - firstWeekday + 7) % 7;
    const day = 1 + offset + (n - 1) * 7;
    return new Date(year, month - 1, day);
  }
  const lastDay = new Date(year, month, 0);
  const lastWeekday = lastDay.getDay();
  const offset = (lastWeekday - weekday + 7) % 7;
  return new Date(year, month - 1, lastDay.getDate() - offset);
}

/** The Monday on or immediately before the given month/day (used for Victoria Day: Monday before May 25). */
function mondayOnOrBefore(year: number, month: number, day: number): Date {
  const target = new Date(year, month - 1, day);
  const weekday = target.getDay();
  const offset = (weekday - 1 + 7) % 7; // days since Monday
  return addDays(target, -offset);
}

function floatingHolidaysForYear(year: number): HolidayOnDate[] {
  return [
    { name: "Family Day (Canada)", date: nthWeekdayOfMonth(year, 2, 1, 3) },
    { name: "Mother's Day", date: nthWeekdayOfMonth(year, 5, 0, 2) },
    { name: "Victoria Day (Canada)", date: mondayOnOrBefore(year, 5, 24) },
    { name: "Memorial Day (US)", date: nthWeekdayOfMonth(year, 5, 1, -1) },
    { name: "Father's Day", date: nthWeekdayOfMonth(year, 6, 0, 3) },
    { name: "Labor Day", date: nthWeekdayOfMonth(year, 9, 1, 1) },
    { name: "Canadian Thanksgiving", date: nthWeekdayOfMonth(year, 10, 1, 2) },
    { name: "US Thanksgiving", date: nthWeekdayOfMonth(year, 11, 4, 4) },
    { name: "Black Friday", date: addDays(nthWeekdayOfMonth(year, 11, 4, 4), 1) },
    { name: "Cyber Monday", date: addDays(nthWeekdayOfMonth(year, 11, 4, 4), 4) },
  ];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * Returns a lookup map (dateKey -> holiday name) for all holidays falling
 * within [startDate, startDate + days). Spans a year boundary correctly by
 * computing holidays for every calendar year touched by the range.
 */
export function buildHolidayLookup(startDate: Date, days: number): Map<string, string> {
  const endDate = addDays(startDate, days);
  const years = new Set<number>();
  for (let y = startDate.getFullYear(); y <= endDate.getFullYear(); y++) years.add(y);

  const lookup = new Map<string, string>();
  for (const year of years) {
    for (const fixed of FIXED_DATE_HOLIDAYS) {
      const d = new Date(year, fixed.month - 1, fixed.day);
      lookup.set(dateKey(d), fixed.name);
    }
    for (const floating of floatingHolidaysForYear(year)) {
      lookup.set(dateKey(floating.date), floating.name);
    }
  }
  return lookup;
}

export function lookupHoliday(lookup: Map<string, string>, date: Date): string | undefined {
  return lookup.get(dateKey(date));
}
