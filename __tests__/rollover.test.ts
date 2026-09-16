import type { Category, Period } from '@/types';
import { bucketByPeriod, carryInto, effectivePlan, type PastPeriod } from '@/lib/rollover';

const cat = (over: Partial<Category>): Category => ({ id: 'groceries', name: 'Groceries', icon: null, kind: 'expense', monthlyLimit: 300, isDefault: true, archived: false, sortOrder: 1, rollover: 'carry', rolloverSince: '2026-06-01', ...over });
const P = (m: number): Period => ({ start: `2026-${String(m).padStart(2, '0')}-01`, end: `2026-${String(m).padStart(2, '0')}-${[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]}` });
const past = (...spent: number[]): PastPeriod[] => spent.map((s, i) => ({ period: P(6 + i), spent: s }));
const current = P(9);
const none = new Map<string, number>();

describe('carryInto', () => {
  it('does nothing when the category resets, has no limit, or has no history', () => {
    expect(carryInto(cat({ rollover: 'reset' }), current, past(100, 100, 100), none)).toEqual({ amount: 0, pendingLeftover: null });
    expect(carryInto(cat({ rollover: undefined }), current, past(100, 100, 100), none)).toEqual({ amount: 0, pendingLeftover: null });
    expect(carryInto(cat({ monthlyLimit: null }), current, past(100, 100, 100), none)).toEqual({ amount: 0, pendingLeftover: null });
    expect(carryInto(cat({}), current, [], none)).toEqual({ amount: 0, pendingLeftover: null });
  });
  it('carries what was not spent, period after period', () => {
    // June 250 of 300 -> 50; July plan 350, spent 300 -> 50; August plan 350, spent 200 -> 150.
    expect(carryInto(cat({}), current, past(250, 300, 200), none)).toEqual({ amount: 150, pendingLeftover: null });
  });
  it('never carries a shortfall into the next period', () => {
    // July went 100 past the plan; August starts from the limit again.
    expect(carryInto(cat({}), current, past(250, 450, 280), none)).toEqual({ amount: 20, pendingLeftover: null });
  });
  it('ignores periods from before carrying over was switched on', () => {
    // Only August (on/after the since date) counts: 300 - 200 = 100.
    expect(carryInto(cat({ rolloverSince: '2026-08-01' }), current, past(0, 0, 200), none)).toEqual({ amount: 100, pendingLeftover: null });
    // Switched on in the current period: nothing from before, no question either.
    expect(carryInto(cat({ rollover: 'ask', rolloverSince: '2026-09-01' }), current, past(0, 0, 0), none)).toEqual({ amount: 0, pendingLeftover: null });
  });
  it('rounds to cents', () => {
    expect(carryInto(cat({ monthlyLimit: 100 }), current, past(33.33, 33.33, 33.33), none).amount).toBe(200.01);
  });

  describe('ask mode', () => {
    const ask = cat({ rollover: 'ask' });
    it('asks about the previous period’s leftover when there is no answer yet', () => {
      expect(carryInto(ask, current, past(0, 0, 220), none)).toEqual({ amount: 0, pendingLeftover: 80 });
    });
    it('asks nothing when nothing was left', () => {
      expect(carryInto(ask, current, past(0, 0, 300), none)).toEqual({ amount: 0, pendingLeftover: null });
      expect(carryInto(ask, current, past(0, 0, 340), none)).toEqual({ amount: 0, pendingLeftover: null });
    });
    it('uses the answer once given, and counts an earlier answer in the previous plan', () => {
      expect(carryInto(ask, current, past(0, 0, 220), new Map([['2026-09-01', 80]]))).toEqual({ amount: 80, pendingLeftover: null });
      expect(carryInto(ask, current, past(0, 0, 220), new Map([['2026-09-01', 0]]))).toEqual({ amount: 0, pendingLeftover: null });
      // August's plan was 300 + 50 carried in; 220 spent leaves 130 to ask about now.
      expect(carryInto(ask, current, past(0, 0, 220), new Map([['2026-08-01', 50]]))).toEqual({ amount: 0, pendingLeftover: 130 });
    });
  });
});

describe('effectivePlan and bucketing', () => {
  it('adds the carry to the limit; no limit stays no plan', () => {
    expect(effectivePlan(cat({}), { amount: 150, pendingLeftover: null })).toBe(450);
    expect(effectivePlan(cat({}), undefined)).toBe(300);
    expect(effectivePlan(cat({ monthlyLimit: null }), { amount: 150, pendingLeftover: null })).toBeNull();
  });
  it('sums daily rows into the right periods and drops rows outside them', () => {
    const periods = [P(7), P(8)];
    const rows = [
      { categoryId: 'groceries', occurredAt: '2026-07-03', total: 40 },
      { categoryId: 'groceries', occurredAt: '2026-07-31', total: 60.5 },
      { categoryId: 'groceries', occurredAt: '2026-08-01', total: 10 },
      { categoryId: 'dining', occurredAt: '2026-08-15', total: 25 },
      { categoryId: 'groceries', occurredAt: '2026-09-02', total: 999 },
      { categoryId: null, occurredAt: '2026-08-02', total: 5 },
    ];
    const out = bucketByPeriod(rows, periods);
    expect(out.get('groceries')).toEqual([{ period: P(7), spent: 100.5 }, { period: P(8), spent: 10 }]);
    expect(out.get('dining')).toEqual([{ period: P(7), spent: 0 }, { period: P(8), spent: 25 }]);
  });
});
