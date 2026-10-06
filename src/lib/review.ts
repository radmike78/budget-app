/**
 * The look back at the period that just ended, shown on Today for the first days of a new one: what went
 * out against the period before, what came in and was kept, and the biggest categories with how each moved.
 * Numbers and key words only; it states, it never advises. Pure.
 */
import type { MonthStats, Period } from '@/types';
import { daysBetween } from './dates';
import { compareWeeks } from './recap';

/** How many days into a new period the look back stays on Today. */
export const REVIEW_DAYS = 5;

export type Change = 'less' | 'more' | 'same' | 'first';

export interface ReviewRow {
  categoryId: string | null;
  total: number;
  previous: number;
  change: Change;
}

export interface PeriodReview {
  period: Period;
  previousPeriod: Period | null;
  spent: number;
  previousSpent: number;
  change: Change;
  income: number;
  /** Income less spending, when anything came in. Negative when more went out. */
  kept: number | null;
  /** The biggest categories of the period, at most three, biggest first. */
  rows: ReviewRow[];
}

/** True for the first days of `current`, when the period before is fresh enough to look back on. */
export function isReviewTime(current: Period, todayStr: string, days = REVIEW_DAYS): boolean {
  return todayStr >= current.start && daysBetween(current.start, todayStr) < days;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function periodReview(last: MonthStats, before: MonthStats | null): PeriodReview | null {
  if (last.expenses <= 0 && last.income <= 0) return null;
  const prevBy = new Map((before?.byCategory ?? []).map((b) => [b.categoryId, b.total]));
  const rows = [...last.byCategory]
    .filter((b) => b.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
    .map((b) => {
      const previous = round2(prevBy.get(b.categoryId) ?? 0);
      return { categoryId: b.categoryId, total: round2(b.total), previous, change: before ? compareWeeks(b.total, previous) : 'first' as Change };
    });
  const previousSpent = round2(before?.expenses ?? 0);
  return {
    period: last.period,
    previousPeriod: before?.period ?? null,
    spent: round2(last.expenses),
    previousSpent,
    change: before ? compareWeeks(last.expenses, previousSpent) : 'first',
    income: round2(last.income),
    kept: last.income > 0 ? round2(last.income - last.expenses) : null,
    rows,
  };
}
