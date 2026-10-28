/**
 * Answers to spoken questions about money: "how much have I spent this week on
 * Starbucks?". Pure logic over the transactions the store already holds; the
 * sentence itself comes from the locale so it reads naturally in every language.
 * No React Native imports.
 */
import type { Category, Debt, Goal, MonthStats, Period, RecurringRule, Transaction } from '@/types';
import type { ParsedQuestion, QuestionPeriod } from '@/parser';
import { addDays, daysBetween, fromDateString, isValidDateString, monthKey, monthRange, shiftMonthKey, toDateString } from '@/lib/dates';
import { effectivePlan, type CarryState } from '@/lib/rollover';
import { safeToSpend } from '@/lib/safeToSpend';

export interface DateRange { from: string; to: string }

/**
 * Calendar range for a period. Weeks start on the locale's first day (`firstDay`, Sunday by default) and run to today.
 * `budget` is the current budget period (`current`, from periodContaining) up to today;
 * without one it is the month. `namedMonth` is the calendar month `month` (0 = January): this year's up to today,
 * or last year's when it has not come yet. `day` is the one day `date` ("last Wednesday"), today when none was given.
 */
export function periodRange(period: QuestionPeriod, todayStr: string, current?: Period, days = 7, firstDay = 0, month?: number, date?: string): DateRange {
  const d = fromDateString(todayStr);
  const dow = (d.getDay() - firstDay + 7) % 7; // 0 on the first day of the week
  const sun = d.getDay(); // Sunday = 0, for the weekend
  switch (period) {
    case 'today': return { from: todayStr, to: todayStr };
    case 'day': { const day = date && isValidDateString(date) ? date : todayStr; return { from: day, to: day }; }
    case 'namedMonth': {
      const m = month != null && month >= 0 && month <= 11 ? Math.floor(month) : d.getMonth();
      let key = `${d.getFullYear()}-${String(m + 1).padStart(2, '0')}`;
      if (monthRange(key).start > todayStr) key = `${d.getFullYear() - 1}-${String(m + 1).padStart(2, '0')}`;
      const r = monthRange(key);
      return { from: r.start, to: r.end < todayStr ? r.end : todayStr };
    }
    case 'yesterday': { const y = addDays(todayStr, -1); return { from: y, to: y }; }
    case 'week': return { from: addDays(todayStr, -dow), to: todayStr };
    case 'lastWeek': { const first = addDays(todayStr, -dow - 7); return { from: first, to: addDays(first, 6) }; }
    case 'budget': if (current) return { from: current.start, to: todayStr < current.end ? todayStr : current.end }; return { from: monthRange(monthKey(todayStr)).start, to: todayStr };
    case 'month': return { from: monthRange(monthKey(todayStr)).start, to: todayStr };
    // The most recent Saturday and Sunday: this one while it is under way, else the one just gone.
    case 'weekend': {
      if (sun === 6) return { from: todayStr, to: todayStr };
      if (sun === 0) return { from: addDays(todayStr, -1), to: todayStr };
      const saturday = addDays(todayStr, -(sun + 1));
      return { from: saturday, to: addDays(saturday, 1) };
    }
    case 'recentDays': return { from: addDays(todayStr, -(Math.max(1, Math.min(366, Math.round(days))) - 1)), to: todayStr };
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
/** The entries a question is about: the period, then the category, the group, or the place or thing named. */
function selectEntries(q: ParsedQuestion, transactions: Transaction[], range: DateRange, categories: Category[]): { list: Transaction[]; categoryId: string | null; categoryIds?: string[]; target: string | null; usedFallback: boolean } {
  const inRange = transactions.filter((tx) => tx.type === q.type && tx.occurredAt >= range.from && tx.occurredAt <= range.to);
  if (q.categoryIds && q.categoryIds.length > 0) {
    const ids = new Set(q.categoryIds);
    return { list: inRange.filter((tx) => tx.categoryId != null && ids.has(tx.categoryId)), categoryId: null, categoryIds: q.categoryIds, target: q.target, usedFallback: false };
  }
  if (q.categoryId) return { list: inRange.filter((tx) => tx.categoryId === q.categoryId), categoryId: q.categoryId, target: null, usedFallback: false };
  if (q.target) {
    const list = inRange.filter((tx) => mentions(tx, q.target!));
    if (list.length > 0 || !q.fallbackCategoryId || !categories.some((c) => c.id === q.fallbackCategoryId)) return { list, categoryId: null, target: q.target, usedFallback: false };
    return { list: inRange.filter((tx) => tx.categoryId === q.fallbackCategoryId), categoryId: q.fallbackCategoryId, target: q.target, usedFallback: true };
  }
  return { list: inRange, categoryId: null, target: null, usedFallback: false };
}

export function answerQuestion(q: ParsedQuestion, transactions: Transaction[], range: DateRange, categories: Category[]): Answer {
  const { list, ...rest } = selectEntries(q, transactions, range, categories);
  const total = Math.round(list.reduce((acc, tx) => acc + tx.amount, 0) * 100) / 100;
  return { total, count: list.length, ...rest };
}

/** "How much do I owe?": the debts on file and what is still to pay on each open debt goal, added up. */
export function totalOwed(debts: Pick<Debt, 'balance'>[], goals: Pick<Goal, 'kind' | 'completed' | 'targetAmount' | 'currentAmount'>[]): { total: number; count: number } {
  let total = 0;
  let count = 0;
  for (const d of debts) if (d.balance > 0) { total += d.balance; count += 1; }
  for (const g of goals) if (g.kind === 'debt' && !g.completed && g.targetAmount - g.currentAmount > 0) { total += g.targetAmount - g.currentAmount; count += 1; }
  return { total: round2(total), count };
}

/**
 * "How much is left on my credit card goal?": the open goal the words name, by a plain substring either way once the
 * generic words ("goal", "fund") are dropped; never a RegExp from the words.
 */
export function findGoalByWords(target: string, goals: Goal[], goalNouns?: RegExp): Goal | null {
  const words = target.toLowerCase().split(/\s+/u).filter((w) => w && !(goalNouns && goalNouns.test(w)));
  const key = words.join(' ').trim();
  if (!key) return null;
  const open = goals.filter((g) => !g.completed);
  const exact = open.find((g) => g.name.toLowerCase() === key);
  if (exact) return exact;
  // Whole words either way ("credit card goal" names "Credit card", "car" does not); scripts without spaces use the run itself.
  const subset = (a: string[], b: string[]) => a.length > 0 && a.every((w) => b.includes(w));
  return open.find((g) => {
    const nameWords = g.name.toLowerCase().split(/\s+/u).filter(Boolean);
    if (words.length === 1 && nameWords.length === 1 && (!/\s/.test(key) && key.length > 1) && !/^[\p{Script=Latin}\p{Script=Cyrillic}\p{Script=Greek}'\-]+$/u.test(key)) return nameWords[0].includes(key) || key.includes(nameWords[0]);
    return subset(words, nameWords) || subset(nameWords, words);
  }) ?? null;
}

export interface BiggestAnswer {
  /** The largest entry; the earliest when two are equal. */
  entry: Transaction;
  /** What all the matching entries add up to, so the answer can say what share it was. */
  total: number;
  count: number;
  categoryId: string | null;
  target: string | null;
  usedFallback: boolean;
}

/** "What was my biggest expense last month?": the single largest entry among those the question is about. */
export function answerBiggest(q: ParsedQuestion, transactions: Transaction[], range: DateRange, categories: Category[]): BiggestAnswer | null {
  const { list, categoryId, target, usedFallback } = selectEntries({ ...q, type: 'expense' }, transactions, range, categories);
  if (!list.length) return null;
  let entry = list[0];
  for (const tx of list) if (tx.amount > entry.amount || (tx.amount === entry.amount && tx.occurredAt < entry.occurredAt)) entry = tx;
  return { entry, total: round2(list.reduce((acc, tx) => acc + tx.amount, 0)), count: list.length, categoryId, target, usedFallback };
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

export interface CompareRanges {
  now: DateRange;
  before: DateRange;
}

/**
 * "Did I spend more than last month?" is fair only at the same point: the month so far against last month up to
 * the same day, the week so far against last week to the same weekday, the pay period so far against the same
 * number of days into the one before (`previous`, from shiftPeriod).
 */
export function compareRanges(period: QuestionPeriod, todayStr: string, current?: Period, previous?: Period, firstDay = 0, days = 7, month?: number, date?: string): CompareRanges {
  const d = fromDateString(todayStr);
  const clamp = (from: string, to: string, end: string): DateRange => ({ from, to: to > end ? end : to });
  // A period that is over is compared whole with the one before it: last week with the week before, yesterday with
  // the day before, the last 30 days with the 30 before them; today, with all of yesterday.
  if (period === 'lastMonth') return { now: periodRange('lastMonth', todayStr), before: monthRangeOf(shiftMonthKey(monthKey(todayStr), -2)) };
  // A month said by name against the month before it; the current month, so far, against the same point.
  if (period === 'namedMonth') {
    const now = periodRange('namedMonth', todayStr, current, days, firstDay, month);
    if (now.from === monthRange(monthKey(todayStr)).start) return compareRanges('month', todayStr);
    return { now, before: monthRangeOf(shiftMonthKey(now.from.slice(0, 7), -1)) };
  }
  // One day against the day before it ("did I spend more last Wednesday than the day before").
  if (period === 'day') { const now = periodRange('day', todayStr, current, days, firstDay, month, date); const y = addDays(now.from, -1); return { now, before: { from: y, to: y } }; }
  if (period === 'lastYear') { const y = d.getFullYear() - 1; return { now: { from: `${y}-01-01`, to: `${y}-12-31` }, before: { from: `${y - 1}-01-01`, to: `${y - 1}-12-31` } }; }
  if (period === 'lastWeek' || period === 'yesterday' || period === 'weekend' || period === 'recentDays' || period === 'today') {
    const now = periodRange(period, todayStr, current, days, firstDay);
    if (period === 'today') { const y = addDays(todayStr, -1); return { now, before: { from: y, to: y } }; }
    // The weekend before is a week back whatever today is; other spans sit right before their own length.
    const len = period === 'weekend' ? 7 : daysBetween(now.from, now.to) + 1;
    return { now, before: { from: addDays(now.from, -len), to: addDays(now.to, -len) } };
  }
  if (period === 'week') {
    const now = periodRange('week', todayStr, undefined, 7, firstDay);
    return { now, before: { from: addDays(now.from, -7), to: addDays(todayStr, -7) } };
  }
  if (period === 'year') {
    const y = d.getFullYear();
    const sameDay = `${y - 1}-${todayStr.slice(5)}`;
    return { now: { from: `${y}-01-01`, to: todayStr }, before: clamp(`${y - 1}-01-01`, sameDay === `${y - 1}-02-29` ? `${y - 1}-02-28` : sameDay, `${y - 1}-12-31`) };
  }
  if (period === 'budget' && current && previous) {
    const elapsed = Math.round((fromDateString(todayStr).getTime() - fromDateString(current.start).getTime()) / 86400000);
    return { now: { from: current.start, to: todayStr }, before: clamp(previous.start, addDays(previous.start, elapsed), previous.end) };
  }
  const thisMonth = monthRange(monthKey(todayStr));
  const last = monthRange(shiftMonthKey(monthKey(todayStr), -1));
  const elapsed = d.getDate() - 1;
  return { now: { from: thisMonth.start, to: todayStr }, before: clamp(last.start, addDays(last.start, elapsed), last.end) };
}

function monthRangeOf(key: string): DateRange {
  const r = monthRange(key);
  return { from: r.start, to: r.end };
}

export interface TopAnswer {
  categoryId: string | null;
  amount: number;
  total: number;
}

/** Where most of the money went in a range: the biggest category and the total it is part of. */
export function answerTop(transactions: Transaction[], range: DateRange): TopAnswer | null {
  const byCat = new Map<string | null, number>();
  let total = 0;
  for (const tx of transactions) {
    if (tx.type !== 'expense' || tx.occurredAt < range.from || tx.occurredAt > range.to) continue;
    byCat.set(tx.categoryId, (byCat.get(tx.categoryId) ?? 0) + tx.amount);
    total += tx.amount;
  }
  if (total <= 0) return null;
  let best: { id: string | null; amount: number } = { id: null, amount: -1 };
  for (const [id, amount] of byCat) if (amount > best.amount) best = { id, amount };
  return { categoryId: best.id, amount: round2(best.amount), total: round2(total) };
}

export type AffordAnswer =
  /** `left` is what remains now; `after` is what would remain once `price` went out (negative when short). */
  | { kind: 'measured'; left: number; after: number; categoryIds: string[] | null }
  | { kind: 'unknown' };

/**
 * "Can I afford a $200 jacket?" Weighed against the plan of the category it belongs to when that has one,
 * else against what is left overall (the same number as the Today card). Never a yes or no: the numbers.
 */
export function answerAfford(q: ParsedQuestion, ctx: RemainingContext): AffordAnswer {
  const price = q.price ?? 0;
  const own = q.target ? answerRemaining(q, ctx) : null;
  const r = own && own.kind === 'category' ? own : answerRemaining({ ...q, target: null, categoryId: null, categoryIds: null, fallbackCategoryId: null }, ctx);
  if (r.kind === 'overall' || r.kind === 'income' || r.kind === 'plans' || r.kind === 'category') {
    return { kind: 'measured', left: r.left, after: round2(r.left - price), categoryIds: r.kind === 'category' ? r.ids : null };
  }
  return { kind: 'unknown' };
}
