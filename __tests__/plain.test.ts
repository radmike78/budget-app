import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';
import { categoryLineSentence, goalProgress, isWholeMonth, monthSummarySentence, periodSummarySentence, topCategorySentence } from '@/lib/plain';
import type { Goal, MonthStats } from '@/types';

const TODAY = '2026-09-10';

describe('monthSummarySentence', () => {
  it('describes a normal month', () => {
    const stats: MonthStats = { month: '2026-09', period: { start: '2026-09-01', end: '2026-09-30' }, income: 2400, expenses: 1180, byCategory: [] };
    expect(monthSummarySentence(stats, 'USD', true)).toBe("So far in September you've brought in $2,400 and spent $1,180. That leaves $1,220.");
  });
  it('handles no entries', () => {
    const stats: MonthStats = { month: '2026-09', period: { start: '2026-09-01', end: '2026-09-30' }, income: 0, expenses: 0, byCategory: [] };
    expect(monthSummarySentence(stats, 'USD', true)).toMatch(/Nothing logged yet in September/);
  });
  it('handles spending only', () => {
    const stats: MonthStats = { month: '2026-09', period: { start: '2026-09-01', end: '2026-09-30' }, income: 0, expenses: 80.5, byCategory: [] };
    expect(monthSummarySentence(stats, 'EUR', true)).toBe("You've spent €80.50 so far in September. No income logged yet.");
  });
  it('is honest when spending exceeds income', () => {
    const stats: MonthStats = { month: '2026-08', period: { start: '2026-08-01', end: '2026-08-31' }, income: 100, expenses: 150, byCategory: [] };
    expect(monthSummarySentence(stats, 'USD', false)).toBe("In August you've brought in $100 and spent $150. That's $50 more out than in.");
  });
});

describe('topCategorySentence', () => {
  it('names the biggest category', () => {
    const stats: MonthStats = { month: '2026-09', period: { start: '2026-09-01', end: '2026-09-30' }, income: 0, expenses: 500, byCategory: [{ categoryId: 'groceries', total: 300, count: 4 }, { categoryId: 'dining', total: 200, count: 6 }] };
    expect(topCategorySentence(stats, DEFAULT_CATEGORIES, 'USD')).toBe('Most of it went to Groceries ($300).');
  });
});

describe('categoryLineSentence', () => {
  const dining = DEFAULT_CATEGORIES.find((c) => c.id === 'dining')!;
  it('without a limit', () => {
    expect(categoryLineSentence(dining.monthlyLimit, 120, 'USD')).toBe('$120 this month.');
    expect(categoryLineSentence(null, 120, 'USD', undefined, true)).toBe('$120 this period.');
  });
  it('with a limit', () => {
    expect(categoryLineSentence(300, 120, 'USD')).toBe('$120 of your $300 plan. $180 left.');
  });
  it('past the limit, calmly', () => {
    expect(categoryLineSentence(300, 320, 'USD')).toBe('$320 so far, $20 past your $300 plan.');
  });
});

describe('periodSummarySentence', () => {
  const pay: MonthStats = { month: '2026-09', period: { start: '2026-09-04', end: '2026-09-17' }, income: 2400, expenses: 1180, byCategory: [] };
  it('speaks in paydays when the period is not a whole month', () => {
    expect(isWholeMonth(pay.period)).toBe(false);
    expect(periodSummarySentence(pay, 'USD', true, 'pay', TODAY)).toBe("Since September 4 you've brought in $2,400 and spent $1,180. That leaves $1,220.");
    expect(periodSummarySentence(pay, 'USD', false, 'pay', TODAY)).toBe("From September 4 to September 17 you've brought in $2,400 and spent $1,180. That leaves $1,220.");
    expect(periodSummarySentence({ ...pay, income: 0, expenses: 0 }, 'USD', true, 'pay', TODAY)).toMatch(/Nothing logged yet since September 4/);
  });
  it('falls back to the month sentence for a whole month, whatever the setting', () => {
    const month: MonthStats = { ...pay, period: { start: '2026-09-01', end: '2026-09-30' } };
    expect(isWholeMonth(month.period)).toBe(true);
    expect(periodSummarySentence(month, 'USD', true, 'pay', TODAY)).toBe(monthSummarySentence(month, 'USD', true));
    expect(periodSummarySentence(pay, 'USD', true, 'month', TODAY)).toBe(monthSummarySentence(pay, 'USD', true));
  });
});

describe('goalProgress', () => {
  const base: Goal = { id: 'g', name: 'Trip', kind: 'saving', targetAmount: 500, currentAmount: 320, targetDate: '2026-12-01', createdAt: '2026-08-01T00:00:00.000Z', completed: false };
  it('reports ahead of pace', () => {
    // 320 saved in 40 days = 8/day; 180 remaining -> 23 days -> Oct 3, ~8 weeks before Dec 1.
    const p = goalProgress(base, 'USD', TODAY);
    expect(p.status).toBe('ahead');
    expect(p.sentence).toBe("You're $180 away, on pace to hit it 8 weeks early.");
  });
  it('does not count what the goal started with as pace', () => {
    // Started with 300 forty days ago and only 20 added since: behind, not "8 weeks early".
    expect(goalProgress({ ...base, startingAmount: 300 }, 'USD', TODAY).status).toBe('behind');
    // Nothing added since it was made: no pace to judge yet.
    expect(goalProgress({ ...base, startingAmount: 320 }, 'USD', TODAY).status).toBe('no_pace');
  });
  it('waits a week before judging the pace', () => {
    const fresh = { ...base, createdAt: '2026-09-08T00:00:00.000Z', startingAmount: 0 };
    expect(goalProgress(fresh, 'USD', TODAY).status).toBe('no_pace');
    expect(goalProgress(fresh, 'USD', '2026-09-15').status).not.toBe('no_pace');
  });
  it('reports behind pace with a weekly suggestion', () => {
    const p = goalProgress({ ...base, currentAmount: 20 }, 'USD', TODAY);
    expect(p.status).toBe('behind');
    expect(p.sentence).toMatch(/a week would keep it on time/);
  });
  it('handles a goal with no date', () => {
    const p = goalProgress({ ...base, targetDate: null }, 'USD', TODAY);
    expect(p.sentence).toBe("You're $180 away. No deadline on this one.");
  });
  it('handles done', () => {
    const p = goalProgress({ ...base, currentAmount: 500 }, 'USD', TODAY);
    expect(p.status).toBe('done');
    expect(p.fraction).toBe(1);
  });
  it('suggests a weekly amount when nothing is saved yet', () => {
    const p = goalProgress({ ...base, currentAmount: 0 }, 'USD', TODAY);
    expect(p.sentence).toMatch(/Setting aside \$\d+ a week gets you there by December 1\./);
  });
});
