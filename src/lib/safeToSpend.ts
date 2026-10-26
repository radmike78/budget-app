/**
 * "Safe to spend until payday": what is left of this period's income after
 * what has gone out, the repeating bills still due before the period ends, and
 * what a bill soon after needs from this period (`reserveForLater`).
 * A plain number, not a rule; it is only shown when there is income in the
 * period. Pure.
 */
import type { MonthStats, RecurringRule } from '@/types';
import { addDays, daysBetween, fromDateString } from './dates';
import { advance } from './recurring';
import { isWholeMonth } from './periods';

export interface SafeToSpend {
  /** Income minus spending minus bills still due. Can be negative. */
  amount: number;
  /** Repeating expenses still due before the period ends, plus what a later bill needs kept from now. */
  upcoming: number;
  /** Days left in the period including today. */
  daysLeft: number;
  /** amount / daysLeft when both are positive, else null. */
  perDay: number | null;
}

type Rule = Pick<RecurringRule, 'type' | 'active' | 'amount' | 'nextOccurrence' | 'frequency' | 'anchorDay'>;

/** Every date a rule falls on in (after, until]. */
function datesBetween(r: Rule, after: string, until: string): string[] {
  const anchor = r.anchorDay ?? fromDateString(r.nextOccurrence).getDate();
  const out: string[] = [];
  let d = r.nextOccurrence;
  for (let guard = 0; d <= after && guard < 2000; guard += 1) d = advance(d, r.frequency, anchor);
  for (let guard = 0; d <= until && guard < 60; guard += 1) {
    out.push(d);
    d = advance(d, r.frequency, anchor);
  }
  return out;
}

/** The repeating bills due in the next `days` days, soonest first: what Today lists as coming up. */
export function upcomingBills<R extends Rule>(rules: R[], todayStr: string, days = 31, limit = 3): { rule: R; date: string }[] {
  const out: { rule: R; date: string }[] = [];
  for (const r of rules) {
    if (!r.active || r.type !== 'expense') continue;
    for (const date of datesBetween(r, todayStr, addDays(todayStr, days))) out.push({ rule: r, date });
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : b.rule.amount - a.rule.amount)).slice(0, limit);
}

/** How far ahead a bill bigger than the paychecks before it is seen. */
const LOOKAHEAD_DAYS = 31;

/**
 * Money this period has to keep for a bill after it that the next paychecks cannot cover: paid weekly, rent of
 * 1,000 at the end of the month needs half of it from a 500 paycheck before. The coming weeks are walked in date
 * order (pay first on a shared day); the lowest the running total goes is what has to be kept now. Only with
 * repeating income, since without it nothing is known about the paychecks ahead.
 */
export function reserveForLater(rules: Rule[], periodEnd: string): number {
  const active = rules.filter((r) => r.active);
  if (!active.some((r) => r.type === 'income')) return 0;
  const until = addDays(periodEnd, LOOKAHEAD_DAYS);
  const events: { date: string; amount: number }[] = [];
  for (const r of active) for (const date of datesBetween(r, periodEnd, until)) events.push({ date, amount: r.type === 'income' ? r.amount : -r.amount });
  events.sort((a, b) => (a.date === b.date ? b.amount - a.amount : a.date < b.date ? -1 : 1));
  let running = 0;
  let lowest = 0;
  for (const e of events) {
    running += e.amount;
    lowest = Math.min(lowest, running);
  }
  return lowest < 0 ? Math.round(-lowest * 100) / 100 : 0;
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
    // A rule can sit behind today when the catch-up has not finished walking it
    // forward yet, so skip the past first and count only what is still to come.
    for (let guard = 0; d <= today && guard < 2000; guard += 1) d = advance(d, r.frequency, anchor);
    for (let guard = 0; d <= end && guard < 60; guard += 1) {
      upcoming += r.amount;
      d = advance(d, r.frequency, anchor);
    }
  }
  // A calendar month pays its own bills from its own income, so nothing is kept for the month after; a pay
  // period ends where the next paycheck starts, so a bill soon after it has to come out of this one.
  if (!isWholeMonth(stats.period)) upcoming += reserveForLater(rules, end);
  const amount = Math.round((stats.income - stats.expenses - upcoming) * 100) / 100;
  const daysLeft = daysBetween(today, end) + 1;
  const perDay = amount > 0 && daysLeft > 0 ? Math.round((amount / daysLeft) * 100) / 100 : null;
  return { amount, upcoming: Math.round(upcoming * 100) / 100, daysLeft, perDay };
}
