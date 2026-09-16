/**
 * Answers to spoken questions about money: "how much have I spent this week on
 * Starbucks?". Pure logic over the transactions the store already holds; the
 * sentence itself comes from the locale so it reads naturally in every language.
 * No React Native imports.
 */
import type { Category, Transaction } from '@/types';
import type { ParsedQuestion, QuestionPeriod } from '@/parser';
import { addDays, fromDateString, monthKey, monthRange, shiftMonthKey, toDateString } from '@/lib/dates';

export interface DateRange { from: string; to: string }

/** Calendar range for a period. Weeks start on Sunday and run to today. */
export function periodRange(period: QuestionPeriod, todayStr: string): DateRange {
  const d = fromDateString(todayStr);
  const dow = d.getDay(); // Sunday = 0
  switch (period) {
    case 'today': return { from: todayStr, to: todayStr };
    case 'yesterday': { const y = addDays(todayStr, -1); return { from: y, to: y }; }
    case 'week': return { from: addDays(todayStr, -dow), to: todayStr };
    case 'lastWeek': { const sunday = addDays(todayStr, -dow - 7); return { from: sunday, to: addDays(sunday, 6) }; }
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
