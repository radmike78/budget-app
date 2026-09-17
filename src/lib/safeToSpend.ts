/**
 * "Safe to spend until payday": what is left of this period's income after
 * what has gone out and the repeating bills still due before the period ends.
 * A plain number, not a rule; it is only shown when there is income in the
 * period. Pure.
 */
import type { MonthStats, RecurringRule } from '@/types';
import { daysBetween } from './dates';

export interface SafeToSpend {
  /** Income minus spending minus bills still due. Can be negative. */
  amount: number;
  /** Repeating expenses still due before the period ends. */
  upcoming: number;
  /** Days left in the period including today. */
  daysLeft: number;
  /** amount / daysLeft when both are positive, else null. */
  perDay: number | null;
}

export function safeToSpend(stats: MonthStats, rules: Pick<RecurringRule, 'type' | 'active' | 'amount' | 'nextOccurrence'>[], today: string): SafeToSpend | null {
  if (stats.income <= 0) return null;
  const { start, end } = stats.period;
  if (today < start || today > end) return null;
  const upcoming = rules
    .filter((r) => r.active && r.type === 'expense' && r.nextOccurrence > today && r.nextOccurrence <= end)
    .reduce((s, r) => s + r.amount, 0);
  const amount = Math.round((stats.income - stats.expenses - upcoming) * 100) / 100;
  const daysLeft = daysBetween(today, end) + 1;
  const perDay = amount > 0 && daysLeft > 0 ? Math.round((amount / daysLeft) * 100) / 100 : null;
  return { amount, upcoming: Math.round(upcoming * 100) / 100, daysLeft, perDay };
}
