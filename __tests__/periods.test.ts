import type { RecurringRule } from '@/types';
import { safeToSpend } from '@/lib/safeToSpend';
import { hasPayRules, payDates, periodContaining, periodLabel, samePeriod, shiftPeriod } from '@/lib/periods';

const TODAY = '2026-09-16';
const rule = (over: Partial<RecurringRule>): RecurringRule => ({ id: 'r', amount: 2000, type: 'income', categoryId: 'salary', frequency: 'biweekly', nextOccurrence: '2026-09-25', anchorDay: null, note: null, active: true, ...over });

describe('payDates', () => {
  it('walks a biweekly rule backwards and forwards from its next date', () => {
    expect(payDates([rule({})], '2026-08-01', '2026-10-31')).toEqual(['2026-08-14', '2026-08-28', '2026-09-11', '2026-09-25', '2026-10-09', '2026-10-23']);
  });
  it('keeps the anchor day for monthly pay (the 31st comes back after February)', () => {
    expect(payDates([rule({ frequency: 'monthly', nextOccurrence: '2026-03-31', anchorDay: 31 })], '2026-01-01', '2026-05-31')).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31']);
  });
  it('merges two incomes and ignores expenses and paused rules', () => {
    const rules = [
      rule({ id: 'a', frequency: 'monthly', nextOccurrence: '2026-10-01', anchorDay: 1 }),
      rule({ id: 'b', frequency: 'monthly', nextOccurrence: '2026-09-15', anchorDay: 15 }),
      rule({ id: 'c', type: 'expense', frequency: 'weekly', nextOccurrence: '2026-09-18' }),
      rule({ id: 'd', active: false, frequency: 'weekly', nextOccurrence: '2026-09-19' }),
    ];
    expect(payDates(rules, '2026-09-01', '2026-10-15')).toEqual(['2026-09-01', '2026-09-15', '2026-10-01', '2026-10-15']);
    expect(hasPayRules(rules)).toBe(true);
    expect(hasPayRules([rules[2], rules[3]])).toBe(false);
  });
});

describe('periodContaining', () => {
  it('is the calendar month by default', () => {
    expect(periodContaining('month', [rule({})], TODAY)).toEqual({ start: '2026-09-01', end: '2026-09-30' });
  });
  it('runs from payday to the day before the next payday', () => {
    expect(periodContaining('pay', [rule({})], TODAY)).toEqual({ start: '2026-09-11', end: '2026-09-24' });
    expect(periodContaining('pay', [rule({})], '2026-09-25')).toEqual({ start: '2026-09-25', end: '2026-10-08' });
    expect(periodContaining('pay', [rule({})], '2026-09-24')).toEqual({ start: '2026-09-11', end: '2026-09-24' });
  });
  it('falls back to the month when there is no repeating income', () => {
    expect(periodContaining('pay', [], TODAY)).toEqual({ start: '2026-09-01', end: '2026-09-30' });
    expect(periodContaining('pay', [rule({ type: 'expense' })], TODAY)).toEqual({ start: '2026-09-01', end: '2026-09-30' });
  });
  it('a yearly income still gives a bounded period', () => {
    const p = periodContaining('pay', [rule({ frequency: 'yearly', nextOccurrence: '2027-01-15' })], TODAY);
    expect(p).toEqual({ start: '2026-01-15', end: '2027-01-14' });
  });
});

describe('shiftPeriod', () => {
  const rules = [rule({})];
  it('steps whole periods in both directions', () => {
    const now = periodContaining('pay', rules, TODAY);
    expect(shiftPeriod('pay', rules, now, -1)).toEqual({ start: '2026-08-28', end: '2026-09-10' });
    expect(shiftPeriod('pay', rules, now, -2)).toEqual({ start: '2026-08-14', end: '2026-08-27' });
    expect(shiftPeriod('pay', rules, shiftPeriod('pay', rules, now, -3), 3)).toEqual(now);
    expect(shiftPeriod('month', rules, { start: '2026-09-01', end: '2026-09-30' }, -1)).toEqual({ start: '2026-08-01', end: '2026-08-31' });
    expect(shiftPeriod('month', rules, { start: '2026-01-01', end: '2026-01-31' }, -1)).toEqual({ start: '2025-12-01', end: '2025-12-31' });
  });
  it('compares periods by their dates', () => {
    expect(samePeriod({ start: '2026-09-11', end: '2026-09-24' }, periodContaining('pay', rules, TODAY))).toBe(true);
    expect(samePeriod({ start: '2026-09-11', end: '2026-09-25' }, periodContaining('pay', rules, TODAY))).toBe(false);
    expect(samePeriod(null, periodContaining('pay', rules, TODAY))).toBe(false);
  });
  it('labels a period with short dates, adding the year only when it differs', () => {
    expect(periodLabel({ start: '2026-09-11', end: '2026-09-24' }, TODAY)).toBe('September 11 – September 24');
    expect(periodLabel({ start: '2025-12-26', end: '2026-01-08' }, TODAY)).toBe('December 26, 2025 – January 8');
  });
});

describe('safeToSpend counts every occurrence before the period ends', () => {
  it('adds a weekly bill twice when it falls due twice', () => {
    const stats = { period: { start: '2026-09-01', end: '2026-09-30' }, income: 3000, expenses: 500, month: '2026-09', byCategory: [] } as any;
    const rule = { type: 'expense', active: true, amount: 50, nextOccurrence: '2026-09-20', frequency: 'weekly', anchorDay: null } as any;
    expect(safeToSpend(stats, [rule], '2026-09-17')).toMatchObject({ amount: 2400, upcoming: 100 });
    const monthly = { ...rule, frequency: 'monthly', nextOccurrence: '2026-09-25' };
    expect(safeToSpend(stats, [monthly], '2026-09-17')).toMatchObject({ amount: 2450, upcoming: 50 });
  });

  it('counts nothing that has already happened, however far behind the rule sits', () => {
    const stats = { period: { start: '2026-09-01', end: '2026-09-30' }, income: 3000, expenses: 500, month: '2026-09', byCategory: [] } as any;
    // Already due this period but in the past: it is in `expenses` already, never in "still to come".
    const passed = { type: 'expense', active: true, amount: 50, nextOccurrence: '2026-09-04', frequency: 'monthly', anchorDay: 4 } as any;
    expect(safeToSpend(stats, [passed], '2026-09-17')).toMatchObject({ upcoming: 0 });
    // A rule the catch-up has not finished walking forward still reports the right bills ahead.
    const behind = { type: 'expense', active: true, amount: 50, nextOccurrence: '2019-01-02', frequency: 'weekly', anchorDay: null } as any;
    expect(safeToSpend(stats, [behind], '2026-09-17')).toMatchObject({ upcoming: 100 });
  });
});
