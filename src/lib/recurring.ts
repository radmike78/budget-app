import type { Frequency, RecurringRule } from '@/types';
import { addDays, addMonths, addYears, fromDateString } from './dates';

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: 'Every week',
  biweekly: 'Every 2 weeks',
  monthly: 'Every month',
  yearly: 'Every year',
};

/**
 * Next occurrence after `date`. Monthly rules keep the original day-of-month
 * (anchorDay), so a rule on the 31st lands on the 28th in February and back on
 * the 31st in March.
 */
export function advance(date: string, frequency: Frequency, anchorDay?: number): string {
  switch (frequency) {
    case 'weekly':
      return addDays(date, 7);
    case 'biweekly':
      return addDays(date, 14);
    case 'monthly':
      return addMonths(date, 1, anchorDay);
    case 'yearly':
      return addYears(date, 1, anchorDay);
  }
}

export interface DueResult {
  /** Dates (YYYY-MM-DD) that should be logged now. */
  due: string[];
  /** The rule's new next_occurrence after logging. */
  nextOccurrence: string;
}

/**
 * Every occurrence from the rule's next_occurrence up to and including today.
 * Capped so a rule left untouched for years cannot generate thousands of rows.
 */
export function dueOccurrences(rule: Pick<RecurringRule, 'nextOccurrence' | 'frequency'> & { anchorDay?: number | null }, todayStr: string, cap = 120): DueResult {
  const due: string[] = [];
  let next = rule.nextOccurrence;
  // The anchor is the day the user chose; without it a rule on the 31st would drift to the 28th after February.
  const anchorDay = rule.anchorDay ?? fromDateString(rule.nextOccurrence).getDate();
  while (next <= todayStr && due.length < cap) {
    due.push(next);
    next = advance(next, rule.frequency, anchorDay);
  }
  return { due, nextOccurrence: next };
}

/** Approximate monthly cost of a rule, for the Budget screen. */
export function monthlyEquivalent(rule: Pick<RecurringRule, 'amount' | 'frequency'>): number {
  switch (rule.frequency) {
    case 'weekly':
      return (rule.amount * 52) / 12;
    case 'biweekly':
      return (rule.amount * 26) / 12;
    case 'monthly':
      return rule.amount;
    case 'yearly':
      return rule.amount / 12;
  }
}

/**
 * The first date on or after `todayStr` for a rule that was paused: what fell due while it was paused was
 * never paid, so it is skipped, not logged. A rule whose next date is still ahead keeps it.
 */
export function resumeFrom(rule: Pick<RecurringRule, 'nextOccurrence' | 'frequency'> & { anchorDay?: number | null }, todayStr: string): string {
  const anchor = rule.anchorDay ?? Number(rule.nextOccurrence.slice(8, 10));
  let d = rule.nextOccurrence;
  for (let guard = 0; d < todayStr && guard < 5000; guard += 1) d = advance(d, rule.frequency, anchor);
  return d;
}

/** The last date of the series that starts at `start` and falls on or before `todayStr` (`start` itself if none later). */
export function latestOnOrBefore(start: string, frequency: Frequency, todayStr: string, anchorDay?: number): string {
  const anchor = anchorDay ?? Number(start.slice(8, 10));
  let d = start;
  for (let guard = 0; guard < 5000; guard += 1) {
    const next = advance(d, frequency, anchor);
    if (next > todayStr) break;
    d = next;
  }
  return d;
}
