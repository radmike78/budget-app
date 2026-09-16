/**
 * Regression tests from the September 2026 audit: every case here was a
 * confirmed wrong result before the fix that accompanies it.
 */
import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';
import { parseEntries, type ParseContext } from '@/parser';
import { findMoney } from '@/statements/money';
import { parseStatement, rowsFromText } from '@/statements';
import type { Goal } from '@/types';

const TODAY = '2026-09-16';
const ctx = (language = 'en', overrides: Partial<ParseContext> = {}): ParseContext => ({ categories: DEFAULT_CATEGORIES, goals: [], keywordMap: {}, today: TODAY, language, ...overrides });
const one = (text: string, language = 'en', overrides: Partial<ParseContext> = {}) => {
  const r = parseEntries(text, ctx(language, overrides));
  expect(r).toHaveLength(1);
  return r[0];
};

describe('amounts with one decimal are amounts, not dates', () => {
  it.each([
    ['en', 'coffee 4.5', 4.5], ['en', 'spent 12.5 on lunch', 12.5], ['es', 'gasté 2,5 en un café', 2.5], ['de', 'kaffee 3,5', 3.5], ['it', 'caffè 1,5', 1.5],
  ])('%s: %s', (lang, text, amount) => {
    expect(one(text, lang)).toMatchObject({ amount, occurredAt: TODAY });
  });
  it('still reads real dates', () => {
    expect(one('paid 40 on 9/3').occurredAt).toBe('2026-09-03');
    expect(one('miete am 3.9. 800 euro', 'de')).toMatchObject({ amount: 800, occurredAt: '2026-09-03' });
    expect(one('paid 40 on 2026-08-30').occurredAt).toBe('2026-08-30');
  });
});

describe('hyphens survive number-word conversion', () => {
  it('keeps hyphenated names and matches their keywords', () => {
    expect(one('paid 80 for t-mobile')).toMatchObject({ categoryId: 'utilities', note: 'T-mobile' });
    expect(one('wi-fi bill 60')).toMatchObject({ categoryId: 'utilities' });
    expect(one('spent 8 at 7-eleven')).toMatchObject({ amount: 8, note: '7-eleven' });
    expect(one('twenty-five dollars on gas')).toMatchObject({ amount: 25 });
  });
});

describe('spoken decimals', () => {
  it.each([
    ['en', 'spent twelve fifty on lunch', 12.5], ['en', 'two fifty for coffee', 2.5], ['en', 'nine ninety nine for a book', 9.99],
    ['en', 'two hundred and fifty for rent', 250], ['es', 'gasté doce cincuenta en el almuerzo', 12.5], ['de', 'zwölf fünfzig für mittagessen', 12.5], ['de', 'fünfundzwanzig euro für benzin', 25],
  ])('%s: %s -> %s', (lang, text, amount) => {
    expect(one(text, lang).amount).toBe(amount);
  });
});

describe('"made" is not income on its own', () => {
  it('payments and purchases described with "made" are expenses', () => {
    expect(one('made a payment of 200 on my card').type).toBe('expense');
    expect(one('made a 40 purchase at target')).toMatchObject({ type: 'expense', categoryId: 'shopping' });
  });
  it('earning with "made" still is income', () => {
    expect(one('made 300 from a client')).toMatchObject({ type: 'income', categoryId: 'freelance' });
    expect(one('sold my bike for 200').type).toBe('income');
  });
});

describe('goal contributions need a real match', () => {
  const goals: Goal[] = [
    { id: 'g1', name: 'Emergency fund', kind: 'saving', targetAmount: 1000, currentAmount: 0, targetDate: null, createdAt: '2026-01-01T00:00:00Z', completed: false },
    { id: 'g2', name: 'Trip to Japan', kind: 'saving', targetAmount: 3000, currentAmount: 0, targetDate: null, createdAt: '2026-01-01T00:00:00Z', completed: false },
  ];
  it('one shared word does not turn an expense into a contribution', () => {
    expect(one('paid 120 for the emergency room visit', 'en', { goals })).toMatchObject({ kind: 'transaction', categoryId: 'other_expense' });
    expect(one('paid 15 for snacks on the trip', 'en', { goals })).toMatchObject({ kind: 'transaction', categoryId: 'dining' });
  });
  it('real contributions still match', () => {
    expect(one('add 100 to the trip goal', 'en', { goals })).toMatchObject({ kind: 'contribution', goalId: 'g2' });
    expect(one('put 50 in the emergency fund', 'en', { goals })).toMatchObject({ kind: 'contribution', goalId: 'g1' });
  });
});

describe('CJK amounts', () => {
  it('thousands commas, 1.5万 and counters', () => {
    expect(one('花了1,200块', 'zh').amount).toBe(1200);
    expect(one('工资1.5万到账', 'zh')).toMatchObject({ amount: 15000, type: 'income' });
    expect(one('点了一份外卖25', 'zh').amount).toBe(25);
    expect(one('买了一顿饭 50', 'zh').amount).toBe(50);
    expect(one('점심 1.5만원', 'ko').amount).toBe(15000);
    expect(one('本を一冊 1500', 'ja').amount).toBe(1500);
  });
});

describe('day numbers before amounts in decimal-comma languages', () => {
  it('es, fr, it read the day and keep the amount', () => {
    expect(one('pagué el 3 100 euros de luz', 'es')).toMatchObject({ amount: 100, occurredAt: '2026-09-03', categoryId: 'utilities' });
    expect(one("j'ai payé le loyer le 1er 800 euros", 'fr')).toMatchObject({ amount: 800, occurredAt: '2026-09-01' });
    expect(one("pagato l'affitto il 1 800 euro", 'it')).toMatchObject({ amount: 800, occurredAt: '2026-09-01' });
  });
  it('mixed separators: the last one is the decimal', () => {
    expect(one('spent 1,234.56 on a laptop', 'es').amount).toBe(1234.56);
    expect(one('spent 1.234,56 on a laptop', 'en').amount).toBe(1234.56);
  });
});

describe('reminders and questions', () => {
  it('a reminder that mentions a question is still a reminder', () => {
    expect(one('remind me to check how much I spent this week').kind).toBe('reminder');
  });
  it('the 31st in a 30-day month means the next real 31st', () => {
    expect(one('remind me to pay rent on the 31st')).toMatchObject({ kind: 'reminder', occurredAt: '2026-10-31' });
  });
  it('zh "a few yuan" is an entry, not a question', () => {
    expect(one('花了几块钱买糖', 'zh').kind).not.toBe('question');
  });
});

describe('statement import', () => {
  it('space-grouped numbers only with a decimal comma', () => {
    expect(findMoney('01/05 CHECK 123 450.00').map((m) => m.value)).toEqual([450]);
    expect(findMoney('TERMINAL 12 100.00').map((m) => m.value)).toEqual([100]);
    expect(findMoney('TOTAL 1 234,56').map((m) => m.value)).toEqual([1234.56]);
  });
  it('keeps "Total Wine" purchases, imports repeated identical lines, and files shop refunds as other income', () => {
    const text = 'Statement Period: 01/01/2026 - 01/31/2026\nDeposits\n01/12  WM SUPERCENTER RETURN   35.20\nWithdrawals\n01/05  TOTAL WINE & MORE SEATTLE WA   45.00\n01/06  MTA*NYCT PAYCARD   2.90\n01/06  MTA*NYCT PAYCARD   2.90\nTotal withdrawals  50.80\n';
    const p = parseStatement(rowsFromText(text), ctx(), { language: 'en', today: TODAY });
    const byDesc = (d: string) => p.lines.filter((l) => l.description.toLowerCase().includes(d));
    expect(byDesc('total wine')).toHaveLength(1);
    expect(byDesc('total withdrawals')).toHaveLength(0);
    const fares = byDesc('paycard');
    expect(fares).toHaveLength(2);
    expect(fares.every((l) => l.include && !l.duplicate)).toBe(true);
    expect(new Set(fares.map((l) => l.fingerprint)).size).toBe(2);
    expect(byDesc('supercenter')[0]).toMatchObject({ direction: 'in', categoryId: 'other_income' });
  });
});
