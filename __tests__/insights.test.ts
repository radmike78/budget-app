/**
 * The maths behind "did I spend more than last month?", "what did I spend the most on?" and
 * "can I afford a $200 jacket?". Pure.
 */
import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';
import { answerAfford, answerTop, compareRanges, type RemainingContext } from '@/lib/questions';
import { parseOne } from './phrasings/harness';
import { en } from '@/i18n/locales/en';
import type { MonthStats, Transaction } from '@/types';

const tx = (categoryId: string, amount: number, occurredAt: string): Transaction => ({ id: `${categoryId}${amount}${occurredAt}`, type: 'expense', categoryId, amount, note: null, rawInput: null, occurredAt, createdAt: `${occurredAt}T12:00:00Z`, isRecurringInstance: false, recurringRuleId: null });

describe('comparing at the same point', () => {
  it('the month so far against last month up to the same day', () => {
    expect(compareRanges('month', '2026-09-16')).toEqual({ now: { from: '2026-09-01', to: '2026-09-16' }, before: { from: '2026-08-01', to: '2026-08-16' } });
  });
  it('never runs past the end of a shorter month', () => {
    expect(compareRanges('month', '2026-03-31').before).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });
  it('the week so far against last week to the same weekday', () => {
    expect(compareRanges('week', '2026-09-16')).toEqual({ now: { from: '2026-09-13', to: '2026-09-16' }, before: { from: '2026-09-06', to: '2026-09-09' } });
  });
  it('the pay period so far against as many days into the last one', () => {
    const r = compareRanges('budget', '2026-09-16', { start: '2026-09-11', end: '2026-09-24' }, { start: '2026-08-28', end: '2026-09-10' });
    expect(r).toEqual({ now: { from: '2026-09-11', to: '2026-09-16' }, before: { from: '2026-08-28', to: '2026-09-02' } });
  });
  it('the year so far against last year to the same date', () => {
    expect(compareRanges('year', '2026-09-16')).toEqual({ now: { from: '2026-01-01', to: '2026-09-16' }, before: { from: '2025-01-01', to: '2025-09-16' } });
  });
  it('a period that is over is compared whole with the one before it', () => {
    // Wednesday 16 September 2026, weeks starting Sunday: last week was the 6th to the 12th.
    expect(compareRanges('lastWeek', '2026-09-16')).toEqual({ now: { from: '2026-09-06', to: '2026-09-12' }, before: { from: '2026-08-30', to: '2026-09-05' } });
    expect(compareRanges('yesterday', '2026-09-16')).toEqual({ now: { from: '2026-09-15', to: '2026-09-15' }, before: { from: '2026-09-14', to: '2026-09-14' } });
    expect(compareRanges('today', '2026-09-16')).toEqual({ now: { from: '2026-09-16', to: '2026-09-16' }, before: { from: '2026-09-15', to: '2026-09-15' } });
    expect(compareRanges('lastMonth', '2026-09-16')).toEqual({ now: { from: '2026-08-01', to: '2026-08-31' }, before: { from: '2026-07-01', to: '2026-07-31' } });
    expect(compareRanges('lastYear', '2026-09-16')).toEqual({ now: { from: '2025-01-01', to: '2025-12-31' }, before: { from: '2024-01-01', to: '2024-12-31' } });
    expect(compareRanges('recentDays', '2026-09-16', undefined, undefined, 0, 30)).toEqual({ now: { from: '2026-08-18', to: '2026-09-16' }, before: { from: '2026-07-19', to: '2026-08-17' } });
    expect(compareRanges('weekend', '2026-09-16')).toEqual({ now: { from: '2026-09-12', to: '2026-09-13' }, before: { from: '2026-09-05', to: '2026-09-06' } });
  });
});

describe('where most went', () => {
  it('names the biggest category and the whole it is part of', () => {
    const rows = [tx('groceries', 120, '2026-09-03'), tx('dining', 40, '2026-09-05'), tx('groceries', 80, '2026-09-10'), tx('transport', 60, '2026-09-12'), tx('dining', 500, '2026-08-30')];
    expect(answerTop(rows, { from: '2026-09-01', to: '2026-09-16' })).toEqual({ categoryId: 'groceries', amount: 200, total: 300 });
  });
  it('says nothing when nothing went out', () => {
    expect(answerTop([], { from: '2026-09-01', to: '2026-09-16' })).toBeNull();
  });
});

const stats = (over: Partial<MonthStats> = {}): MonthStats => ({ month: '2026-09', period: { start: '2026-09-01', end: '2026-09-30' }, income: 0, expenses: 300, byCategory: [{ categoryId: 'shopping', total: 100, count: 2 }, { categoryId: 'dining', total: 200, count: 5 }], ...over });
const ctx = (over: Partial<RemainingContext> = {}): RemainingContext => ({ stats: stats(), categories: DEFAULT_CATEGORIES, carry: {}, overallLimit: null, rules: [], today: '2026-09-16', ...over });
const ask = (text: string) => parseOne(text, 'en')[0].question!;

describe('weighing a price against what is left', () => {
  it('against the overall plan when the thing has no plan of its own', () => {
    expect(answerAfford(ask('can I afford a $200 jacket'), ctx({ overallLimit: 1000 }))).toEqual({ kind: 'measured', left: 700, after: 500, categoryIds: null });
  });
  it('against the category plan when there is one', () => {
    const cats = DEFAULT_CATEGORIES.map((c) => (c.id === 'dining' ? { ...c, monthlyLimit: 250 } : c));
    expect(answerAfford(ask('is 80 ok for dinner'), ctx({ categories: cats, overallLimit: 1000 }))).toEqual({ kind: 'measured', left: 50, after: -30, categoryIds: ['dining'] });
  });
  it('against income less bills when there is no plan', () => {
    expect(answerAfford(ask('can I afford 200 for shoes'), ctx({ stats: stats({ income: 400 }) }))).toEqual({ kind: 'measured', left: 100, after: -100, categoryIds: null });
  });
  it('says so when there is nothing to weigh it against', () => {
    expect(answerAfford(ask('can I afford 200 for shoes'), ctx())).toEqual({ kind: 'unknown' });
  });
});

describe('the sentences never judge', () => {
  it('state the numbers', () => {
    const s = en.s;
    expect(s.answerCompare('this month', '$820.00', null, 'less', '$120.00', 'last month')).toBe("This month you've spent $820.00, $120.00 less than by this point last month.");
    expect(s.answerTop('this month', 'Groceries', '$410.00', '$1,230.00')).toBe('This month the most went to Groceries: $410.00 of $1,230.00.');
    expect(s.answerAffordFits('$200.00', '$500.00', null, 'September 30')).toBe("After $200.00 you'd still have $500.00, until September 30.");
    expect(s.answerAffordShort('$80.00', '$30.00', 'Dining out', 'September 30')).toBe("$80.00 is $30.00 more than what's left of the Dining out plan until September 30.");
    for (const line of [s.answerAffordShort('$1', '$2', null, 'x'), s.answerCompare('this week', '$1', null, 'more', '$2', 'last week')]) expect(line).not.toMatch(/!|can't|cannot|over budget|too much/i);
  });
});
