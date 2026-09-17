import { compareWeeks, isRecapDay, weekRange, weekRecap } from '@/lib/recap';
import { safeToSpend } from '@/lib/safeToSpend';
import { mix, ramp } from '@/lib/color';
import type { MonthStats } from '@/types';

describe('weekly recap', () => {
  it('weeks start on Sunday', () => {
    expect(weekRange('2026-09-16')).toEqual({ from: '2026-09-13', to: '2026-09-19' });
    expect(weekRange('2026-09-13', -1)).toEqual({ from: '2026-09-06', to: '2026-09-12' });
    expect(weekRange('2026-09-19', -2)).toEqual({ from: '2026-08-30', to: '2026-09-05' });
  });
  it('shows on Sunday and Monday only', () => {
    expect(isRecapDay('2026-09-13')).toBe(true);
    expect(isRecapDay('2026-09-14')).toBe(true);
    expect(isRecapDay('2026-09-15')).toBe(false);
    expect(isRecapDay('2026-09-19')).toBe(false);
  });
  it('sums last week, finds the biggest category and compares with the week before', () => {
    const rows = [
      { categoryId: 'groceries', occurredAt: '2026-09-07', total: 80 },
      { categoryId: 'groceries', occurredAt: '2026-09-10', total: 45.5 },
      { categoryId: 'dining', occurredAt: '2026-09-12', total: 60 },
      { categoryId: 'dining', occurredAt: '2026-09-01', total: 200 },
      { categoryId: 'rent', occurredAt: '2026-09-13', total: 1400 },
    ];
    const r = weekRecap(rows, '2026-09-14');
    expect(r).toMatchObject({ week: { from: '2026-09-06', to: '2026-09-12' }, total: 185.5, previousTotal: 200, topCategoryId: 'groceries', topTotal: 125.5, entries: 3 });
    expect(compareWeeks(r.total, r.previousTotal)).toBe('less');
  });
  it('compares within five percent as the same, and has no comparison for a first week', () => {
    expect(compareWeeks(100, 96)).toBe('same');
    expect(compareWeeks(100, 90)).toBe('more');
    expect(compareWeeks(80, 100)).toBe('less');
    expect(compareWeeks(80, 0)).toBe('first');
  });
});

describe('safe to spend', () => {
  const stats: MonthStats = { month: '2026-09', period: { start: '2026-09-11', end: '2026-09-24' }, income: 2000, expenses: 286.97, byCategory: [] };
  const rules = [
    { type: 'expense' as const, active: true, amount: 120, nextOccurrence: '2026-09-20', frequency: 'monthly' as const, anchorDay: null },
    { type: 'expense' as const, active: true, amount: 900, nextOccurrence: '2026-10-01', frequency: 'monthly' as const, anchorDay: null },
    { type: 'expense' as const, active: false, amount: 50, nextOccurrence: '2026-09-18', frequency: 'weekly' as const, anchorDay: null },
    { type: 'income' as const, active: true, amount: 2000, nextOccurrence: '2026-09-25', frequency: 'biweekly' as const, anchorDay: null },
  ];
  it('takes income, minus spending, minus bills still due in the period', () => {
    expect(safeToSpend(stats, rules, '2026-09-16')).toEqual({ amount: 1593.03, upcoming: 120, daysLeft: 9, perDay: 177 });
  });
  it('is silent without income or outside the period', () => {
    expect(safeToSpend({ ...stats, income: 0 }, rules, '2026-09-16')).toBeNull();
    expect(safeToSpend(stats, rules, '2026-09-25')).toBeNull();
  });
  it('can be negative, and then has no per-day figure', () => {
    expect(safeToSpend({ ...stats, expenses: 2100 }, rules, '2026-09-24')).toMatchObject({ amount: -100, perDay: null, daysLeft: 1 });
  });
});

describe('colour helpers', () => {
  it('mixes toward a colour and builds a one-hue ramp, strongest first', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#3D6B5E', '#3D6B5E', 0.3)).toBe('#3d6b5e');
    const r = ramp('#3D6B5E', '#F7F6F3', 4);
    expect(r).toHaveLength(4);
    expect(r[0]).toBe('#3d6b5e');
    expect(new Set(r).size).toBe(4);
  });
});
