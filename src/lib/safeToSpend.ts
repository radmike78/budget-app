/**
 * "Safe to spend until payday": what is left of this period's income after
 * what has gone out and the repeating bills still due before the period ends.
 * A plain number, not a rule; it is only shown when there is income in the
 * period. Pure.
 */
import type { MonthStats, RecurringRule } from '@/types';
import { daysBetween, fromDateString } from './dates';
import { advance } from './recurring';

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

export function safeToSpend(stats: MonthStats, rules: Pick<RecurringRule, 'type' | 'active' | 'amount' | 'nextOccurrence' | 'frequency' | 'anchorDay'>[], today: string): SafeToSpend | null {
  if (stats.income <= 0) return null;
  const { start, end } = stats.period;
  if (today < start || today > end) return null;
  let upcoming = 0;
  for (const r of rules) {
    if (!r.active || r.type !== 'expense') continue;
    // A weekly bill can fall due several times before the period ends; every occurrence counts.
    const anchor = r.anchorDay ?? fromDateString(r.nextOccurrence).getDate();
    let d = r.nextOccurrence;
    for (let guard = 0; d <= end && guard < 60; guard += 1) {
      if (d > today) upcoming += r.amount;
      d = advance(d, r.frequency, anchor);
    }
  }
  const amount = Math.round((stats.income - stats.expenses - upcoming) * 100) / 100;
  const daysLeft = daysBetween(today, end) + 1;
  const perDay = amount > 0 && daysLeft > 0 ? Math.round((amount / daysLeft) * 100) / 100 : null;
  return { amount, upcoming: Math.round(upcoming * 100) / 100, daysLeft, perDay };
}
