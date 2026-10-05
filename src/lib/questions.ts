/**
 * Answers to spoken questions about money: "how much have I spent this week on
 * Starbucks?". Pure logic over the transactions the store already holds; the
 * sentence itself comes from the locale so it reads naturally in every language.
 * No React Native imports.
 */
import type { Category, MonthStats, Period, RecurringRule, Transaction } from '@/types';
import type { ParsedQuestion, QuestionPeriod } from '@/parser';
import { addDays, fromDateString, monthKey, monthRange, shiftMonthKey, toDateString } from '@/lib/dates';
import { effectivePlan, type CarryState } from '@/lib/rollover';
import { safeToSpend } from '@/lib/safeToSpend';

export interface DateRange { from: string; to: string }

/**
 * Calendar range for a period. Weeks start on Sunday and run to today.
 * `budget` is the current budget period (`current`, from periodContaining) up to today;
 * without one it is the month.
 */
export function periodRange(period: QuestionPeriod, todayStr: string, current?: Period): DateRange {
  const d = fromDateString(todayStr);
  const dow = d.getDay(); // Sunday = 0
  switch (period) {
    case 'today': return { from: todayStr, to: todayStr };
    case 'yesterday': { const y = addDays(todayStr, -1); return { from: y, to: y }; }
    case 'week': return { from: addDays(todayStr, -dow), to: todayStr };
    case 'lastWeek': { const sunday = addDays(todayStr, -dow - 7); return { from: sunday, to: addDays(sunday, 6) }; }
    case 'budget': if (current) return { from: current.start, to: todayStr < current.end ? todayStr : current.end }; return { from: monthRange(monthKey(todayStr)).start, to: todayStr };
    case 'month': return { from: monthRange(monthKey(todayStr)).start, to: todayStr };
    case 'lastMonth': { const r = monthRange(shiftMonthKey(monthKey(todayStr), -1)); return { from: r.start, to: r.end }; }
    case 'year': return { from: `${d.getFullYear()}-01-01`, to: todayStr };
    case 'lastYear': return { from: `${d.getFullYear() - 1}-01-01`, to: `${d.getFullYear() - 1}-12-31` };
    case 'all': default: return { from: '0000-01-01', to: toDateString(new Date(d.getFullYear() + 100, 0, 1)) };
  }
}

export interface Answer {
  total: number;
  count: number;
  /** The category the total covers, when the question was about one. */
  categoryId: string | null;
  /** The categories the total covers, when the question used a word for several ("food"). */
  categoryIds?: string[];
  /** The word the entries were matched on, when the question was about a place or thing. */
  target: string | null;
  /** True when nothing mentioned the target and the answer fell back to its category. */
  usedFallback: boolean;
}

function mentions(tx: Transaction, needle: string): boolean {
  const n = needle.toLowerCase();
  return !!((tx.note && tx.note.toLowerCase().includes(n)) || (tx.rawInput && tx.rawInput.toLowerCase().includes(n)));
}

/**
 * Sums the entries the question is about. `transactions` should already be
 * limited to the period (see periodRange) but the range is checked again here.
 * Matching on a place or thing is a plain case-insensitive substring test over
 * the note and the original words; no regular expression is built from user text.
 */
export function answerQuestion(q: ParsedQuestion, transactions: Transaction[], range: DateRange, categories: Category[]): Answer {
  const inRange = transactions.filter((tx) => tx.type === q.type && tx.occurredAt >= range.from && tx.occurredAt <= range.to);
  const sum = (list: Transaction[]) => Math.round(list.reduce((acc, tx) => acc + tx.amount, 0) * 100) / 100;

  if (q.categoryIds && q.categoryIds.length > 0) {
    const ids = new Set(q.categoryIds);
    const list = inRange.filter((tx) => tx.categoryId != null && ids.has(tx.categoryId));
    return { total: sum(list), count: list.length, categoryId: null, categoryIds: q.categoryIds, target: q.target, usedFallback: false };
  }
  if (q.categoryId) {
    const list = inRange.filter((tx) => tx.categoryId === q.categoryId);
    return { total: sum(list), count: list.length, categoryId: q.categoryId, target: null, usedFallback: false };
  }
  if (q.target) {
    const list = inRange.filter((tx) => mentions(tx, q.target!));
    if (list.length > 0 || !q.fallbackCategoryId || !categories.some((c) => c.id === q.fallbackCategoryId)) {
      return { total: sum(list), count: list.length, categoryId: null, target: q.target, usedFallback: false };
    }
    const byCat = inRange.filter((tx) => tx.categoryId === q.fallbackCategoryId);
    return { total: sum(byCat), count: byCat.length, categoryId: q.fallbackCategoryId, target: q.target, usedFallback: true };
  }
  return { total: sum(inRange), count: inRange.length, categoryId: null, target: null, usedFallback: false };
}

/**
 * What is left this period, for "what's my remaining budget?" and "how much do I
 * have left for groceries?". The same numbers the Today card shows: the overall
 * plan when there is one, else what income leaves after spending and the bills
 * still due, else the category plans added up. A category question answers from
 * that category's plan, carry-over included. Never a judgement, only the numbers.
 */
export type Remaining =
  /** Left of the overall plan (negative when past it). */
  | { kind: 'overall'; left: number; plan: number }
  /** Income minus spending minus bills still due (negative when short). */
  | { kind: 'income'; left: number; billsDue: number }
  /** The category plans added up, less what went out in those categories. */
  | { kind: 'plans'; left: number; plan: number }
  /** No plan and no income this period: only what went out can be said. */
  | { kind: 'nothing'; spent: number }
  /** Left of the plan for the categories asked about (only those that have a plan). */
  | { kind: 'category'; ids: string[]; left: number; plan: number }
  /** The categories asked about have no plan. */
  | { kind: 'categoryNoPlan'; ids: string[]; spent: number }
  /** The words did not name a category. */
  | { kind: 'unknown' };

export interface RemainingContext {
  /** Totals for the current period. */
  stats: MonthStats;
  categories: Category[];
  carry: Record<string, CarryState>;
  overallLimit: number | null;
  rules: Pick<RecurringRule, 'type' | 'active' | 'amount' | 'nextOccurrence' | 'frequency' | 'anchorDay'>[];
  today: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function answerRemaining(q: ParsedQuestion, ctx: RemainingContext): Remaining {
  const spentIn = (id: string) => ctx.stats.byCategory.find((b) => b.categoryId === id)?.total ?? 0;
  const ids = q.categoryIds && q.categoryIds.length > 0 ? q.categoryIds : [q.categoryId ?? q.fallbackCategoryId].filter((id): id is string => !!id);
  const known = ids.filter((id) => ctx.categories.some((c) => c.id === id && c.kind === 'expense'));

  if (q.target) {
    if (known.length === 0) return { kind: 'unknown' };
    const planned = known.flatMap((id) => {
      const cat = ctx.categories.find((c) => c.id === id)!;
      const plan = effectivePlan(cat, ctx.carry[id]);
      return plan != null ? [{ id, plan }] : [];
    });
    if (planned.length === 0) return { kind: 'categoryNoPlan', ids: known, spent: round2(known.reduce((acc, id) => acc + spentIn(id), 0)) };
    const plan = round2(planned.reduce((acc, p) => acc + p.plan, 0));
    const spent = planned.reduce((acc, p) => acc + spentIn(p.id), 0);
    return { kind: 'category', ids: planned.map((p) => p.id), left: round2(plan - spent), plan };
  }

  if (ctx.overallLimit != null && ctx.overallLimit > 0) {
    return { kind: 'overall', left: round2(ctx.overallLimit - ctx.stats.expenses), plan: ctx.overallLimit };
  }
  const safe = safeToSpend(ctx.stats, ctx.rules, ctx.today);
  if (safe) return { kind: 'income', left: safe.amount, billsDue: safe.upcoming };
  let plan = 0;
  let spent = 0;
  for (const cat of ctx.categories) {
    if (cat.kind !== 'expense' || cat.archived) continue;
    const p = effectivePlan(cat, ctx.carry[cat.id]);
    if (p == null) continue;
    plan += p;
    spent += spentIn(cat.id);
  }
  if (plan > 0) return { kind: 'plans', left: round2(plan - spent), plan: round2(plan) };
  return { kind: 'nothing', spent: round2(ctx.stats.expenses) };
}
