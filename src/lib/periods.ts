/**
 * Budget periods. The default is the calendar month. With "pay" mode a period
 * runs from one payday to the day before the next, and paydays come from the
 * user's repeating income (nothing is linked or guessed). Pure: no React Native.
 */
import type { BudgetPeriodMode, Frequency, Period, RecurringRule } from '@/types';
import { addDays, addMonths, addYears, fromDateString, longDate, monthKey, monthRange, type DateFormat, EN_DATE_FORMAT } from './dates';
import { advance } from './recurring';

type PayRule = Pick<RecurringRule, 'type' | 'active' | 'frequency' | 'nextOccurrence' | 'anchorDay'>;

/** Steps one occurrence back; the mirror of `advance`. */
function retreat(date: string, frequency: Frequency, anchorDay?: number): string {
  switch (frequency) {
    case 'weekly':
      return addDays(date, -7);
    case 'biweekly':
      return addDays(date, -14);
    case 'monthly':
      return addMonths(date, -1, anchorDay);
    case 'yearly':
      return addYears(date, -1);
  }
}

export function hasPayRules(rules: PayRule[]): boolean {
  return rules.some((r) => r.active && r.type === 'income');
}

/** Every payday from active income rules within [from, to], sorted, no duplicates. */
export function payDates(rules: PayRule[], from: string, to: string): string[] {
  const dates = new Set<string>();
  const GUARD = 1200;
  for (const r of rules) {
    if (!r.active || r.type !== 'income') continue;
    const anchor = r.anchorDay ?? fromDateString(r.nextOccurrence).getDate();
    let d = r.nextOccurrence;
    let guard = 0;
    while (d > to && guard++ < GUARD) d = retreat(d, r.frequency, anchor);
    let back = d;
    guard = 0;
    while (back >= from && guard++ < GUARD) {
      if (back <= to) dates.add(back);
      back = retreat(back, r.frequency, anchor);
    }
    let fwd = advance(d, r.frequency, anchor);
    guard = 0;
    while (fwd <= to && guard++ < GUARD) {
      if (fwd >= from) dates.add(fwd);
      fwd = advance(fwd, r.frequency, anchor);
    }
  }
  return [...dates].sort();
}

/**
 * The period that contains `dateStr`. In pay mode that is payday to the day
 * before the next payday; without a payday on each side (no repeating income
 * yet) it falls back to the calendar month, so the screens always have a range.
 */
export function periodContaining(mode: BudgetPeriodMode, rules: PayRule[], dateStr: string): Period {
  if (mode === 'pay' && hasPayRules(rules)) {
    const dates = payDates(rules, addDays(dateStr, -400), addDays(dateStr, 400));
    let start: string | null = null;
    let next: string | null = null;
    for (const d of dates) {
      if (d <= dateStr) start = d;
      else { next = d; break; }
    }
    if (start && next) return { start, end: addDays(next, -1) };
  }
  const r = monthRange(monthKey(dateStr));
  return { start: r.start, end: r.end };
}

/** The period `delta` steps away (negative = earlier). */
export function shiftPeriod(mode: BudgetPeriodMode, rules: PayRule[], period: Period, delta: number): Period {
  let p = period;
  for (let i = 0; i < Math.abs(delta); i += 1) p = periodContaining(mode, rules, delta > 0 ? addDays(p.end, 1) : addDays(p.start, -1));
  return p;
}

export function samePeriod(a: Period | null | undefined, b: Period | null | undefined): boolean {
  return !!a && !!b && a.start === b.start && a.end === b.end;
}

/** "September 5 – September 18" (the year is added when a date is not in the current year). */
export function periodLabel(period: Period, todayStr: string, fmt: DateFormat = EN_DATE_FORMAT): string {
  return `${longDate(period.start, todayStr, fmt)} – ${longDate(period.end, todayStr, fmt)}`;
}
