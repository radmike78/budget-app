/**
 * The weekly recap shown on Today at the start of a week (Sunday and Monday):
 * what went out last week, where most of it went, and how that compares to
 * the week before. Weeks start on Sunday, like spoken questions. Pure.
 */
import { addDays, fromDateString } from './dates';

export interface DateRange { from: string; to: string }

/** The calendar week (Sunday to Saturday) that contains `dateStr`, shifted by `offset` weeks. */
export function weekRange(dateStr: string, offset = 0): DateRange {
  const dow = fromDateString(dateStr).getDay();
  const from = addDays(dateStr, -dow + offset * 7);
  return { from, to: addDays(from, 6) };
}

/** True on Sunday and Monday, when last week is fresh enough to be worth a card. */
export function isRecapDay(dateStr: string): boolean {
  const dow = fromDateString(dateStr).getDay();
  return dow === 0 || dow === 1;
}

export interface WeekRecap {
  week: DateRange;
  total: number;
  previousTotal: number;
  topCategoryId: string | null;
  topTotal: number;
  entries: number;
}

export interface SpendRow { categoryId: string | null; occurredAt: string; total: number }

/** Sums expense rows (per category and day) into last week's recap; `today` decides which week is "last". */
export function weekRecap(rows: SpendRow[], today: string): WeekRecap {
  const week = weekRange(today, -1);
  const before = weekRange(today, -2);
  let total = 0;
  let previousTotal = 0;
  let entries = 0;
  const byCat = new Map<string | null, number>();
  for (const r of rows) {
    if (r.occurredAt >= week.from && r.occurredAt <= week.to) {
      total += r.total;
      entries += 1;
      byCat.set(r.categoryId, (byCat.get(r.categoryId) ?? 0) + r.total);
    } else if (r.occurredAt >= before.from && r.occurredAt <= before.to) {
      previousTotal += r.total;
    }
  }
  let topCategoryId: string | null = null;
  let topTotal = 0;
  for (const [id, t] of byCat) if (t > topTotal) { topTotal = t; topCategoryId = id; }
  const round = (n: number) => Math.round(n * 100) / 100;
  return { week, total: round(total), previousTotal: round(previousTotal), topCategoryId, topTotal: round(topTotal), entries };
}

/** How the week compares: within 5% is "about the same". */
export function compareWeeks(total: number, previous: number): 'less' | 'more' | 'same' | 'first' {
  if (previous <= 0) return 'first';
  const delta = (total - previous) / previous;
  if (Math.abs(delta) <= 0.05) return 'same';
  return delta < 0 ? 'less' : 'more';
}
