/**
 * Second pre-launch review: pay periods with a bonus or a benefit, carry-over shown on earlier periods,
 * monthly reminders that would fire a month early, and money typed with a stray separator.
 */
import type { RecurringRule } from '@/types';
import { parseMoneyInput } from '@/lib/money';
import { mainPayRules, periodContaining } from '@/lib/periods';
import { carryInto } from '@/lib/rollover';
import { reserveForLater, safeToSpend } from '@/lib/safeToSpend';

jest.mock('expo-notifications', () => ({}));
// eslint-disable-next-line import/first
import { monthlyTriggerFits } from '@/lib/reminders';

const rule = (over: Partial<RecurringRule>): RecurringRule => ({ id: 'r', amount: 1500, type: 'income', categoryId: 'salary', frequency: 'biweekly', nextOccurrence: '2026-10-23', anchorDay: null, note: null, active: true, ...over });

describe('paydays come from the pay that arrives most often and matters most', () => {
  it('a yearly bonus never makes the period a year long', () => {
    const rules = [rule({}), rule({ id: 'bonus', amount: 5000, frequency: 'yearly', nextOccurrence: '2027-03-15' })];
    expect(mainPayRules(rules).map((r) => r.id)).toEqual(['r']);
    expect(periodContaining('pay', rules, '2026-10-17')).toEqual({ start: '2026-10-09', end: '2026-10-22' });
  });
  it('weekly pay is compared by what it brings in a month, not by one payment', () => {
    const rules = [rule({ id: 'wage', amount: 600, frequency: 'weekly', nextOccurrence: '2026-10-23' }), rule({ id: 'benefit', amount: 1500, frequency: 'monthly', nextOccurrence: '2026-11-01', anchorDay: 1 })];
    expect(mainPayRules(rules).map((r) => r.id).sort()).toEqual(['benefit', 'wage']);
  });
  it('a yearly income alone still sets the paydays', () => {
    expect(mainPayRules([rule({ frequency: 'yearly' })])).toHaveLength(1);
  });
});

describe('carry-over is never shown on a period before it started', () => {
  it('a period before the plan changed has nothing carried in', () => {
    const cat = { monthlyLimit: 100, rollover: 'carry' as const, rolloverSince: '2026-10-01' };
    const aug = { start: '2026-08-01', end: '2026-08-31' };
    const jul = { period: { start: '2026-07-01', end: '2026-07-31' }, spent: 0 };
    expect(carryInto(cat, aug, [jul], new Map([['2026-10-01', 40]]))).toEqual({ amount: 0, pendingLeftover: null });
    expect(carryInto(cat, { start: '2026-10-01', end: '2026-10-31' }, [], new Map([['2026-10-01', 40]]))).toEqual({ amount: 40, pendingLeftover: null });
  });
});

describe('a monthly reminder never fires a month early', () => {
  it('uses the repeating trigger only when its next firing is the first date', () => {
    // Set on February 1 for "rent on the 1st" from March 1: a monthly trigger would fire this morning.
    expect(monthlyTriggerFits(new Date(2026, 2, 1, 9, 0), new Date(2026, 1, 1, 8, 0))).toBe(false);
    expect(monthlyTriggerFits(new Date(2026, 4, 4, 9, 0), new Date(2026, 3, 3, 8, 0))).toBe(false);
    // Later this month, or next month once this month's day has gone by: the trigger lands on the first date.
    expect(monthlyTriggerFits(new Date(2026, 1, 15, 9, 0), new Date(2026, 1, 1, 8, 0))).toBe(true);
    expect(monthlyTriggerFits(new Date(2026, 2, 1, 9, 0), new Date(2026, 1, 1, 10, 0))).toBe(true);
    // Already started: every month from here is right.
    expect(monthlyTriggerFits(new Date(2026, 0, 1, 9, 0), new Date(2026, 1, 10, 8, 0))).toBe(true);
  });
});

describe('money typed with a stray separator at the end', () => {
  it('keeps the decimal instead of multiplying by a hundred', () => {
    expect(parseMoneyInput('12.50.')).toBe(12.5);
    expect(parseMoneyInput('$12.50.')).toBe(12.5);
    expect(parseMoneyInput('1.5,')).toBe(1.5);
    expect(parseMoneyInput('12,50.', true)).toBe(12.5);
    expect(parseMoneyInput('12.')).toBe(12);
    expect(parseMoneyInput('.')).toBeNull();
  });
});

describe('safe to spend keeps what a bill after payday will need', () => {
  const pay = rule({ id: 'pay', amount: 500, frequency: 'weekly', nextOccurrence: '2026-10-22' });
  const rent = rule({ id: 'rent', type: 'expense', categoryId: 'rent', amount: 1000, frequency: 'monthly', nextOccurrence: '2026-10-31', anchorDay: 31 });
  it('keeps from now only what the paychecks before a bill cannot cover', () => {
    // Weekly: the 22nd and the 29th bring 1,000 before rent on the 31st, so nothing has to be kept now.
    expect(reserveForLater([pay, rent], '2026-10-21')).toBe(0);
    // Every other week: only the 29th comes before rent, so 500 of it has to come from this period.
    const biweekly = { ...pay, frequency: 'biweekly' as const, nextOccurrence: '2026-10-29' };
    expect(reserveForLater([biweekly, rent], '2026-10-21')).toBe(500);
    const stats = { period: { start: '2026-10-15', end: '2026-10-28' }, income: 500, expenses: 0 } as unknown as Parameters<typeof safeToSpend>[0];
    expect(safeToSpend(stats, [{ ...biweekly, nextOccurrence: '2026-10-29' }, rent], '2026-10-16')!.amount).toBe(0);
  });
  it('without repeating income nothing ahead is known, so nothing extra is kept', () => {
    expect(reserveForLater([rent], '2026-10-21')).toBe(0);
  });
});
