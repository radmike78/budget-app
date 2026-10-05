/**
 * Fixes in the shared parser that every language benefits from, found while
 * collecting the phrasings: each was a real sentence the app misread.
 */
import type { Goal } from '@/types';
import { parseOne } from './harness';

const goal = (name: string) => [{ id: 'g1', name, kind: 'saving', targetAmount: 3000, savedAmount: 0, targetDate: null, completed: false, createdAt: '2026-01-01' }] as unknown as Goal[];

describe('goal names', () => {
  it('match without accents: "Japon" finds "Viaje a Japón"', () => {
    const [r] = parseOne('puse 100 para el viaje a Japon', 'es', undefined, goal('Viaje a Japón'));
    expect(r).toMatchObject({ kind: 'contribution', goalId: 'g1', amount: 100 });
  });
  it('read a hyphen as a space: "Japan-Kasse" is the Japan goal', () => {
    const [r] = parseOne('100 in die Japan-Kasse gesteckt', 'de');
    expect(r).toMatchObject({ kind: 'contribution', goalId: 'g1', amount: 100 });
  });
});

describe('a hyphenated word is also its parts', () => {
  it('"Tram-Billett" is transport', () => {
    expect(parseOne('Tram-Billett 3.80', 'de')[0]).toMatchObject({ amount: 3.8, categoryId: 'transport' });
  });
});

describe('keywords written with an apostrophe', () => {
  it('match the way the text is split ("m\'a donné" is "m a donné")', () => {
    expect(parseOne("ma mère m'a donné 50", 'fr')[0]).toMatchObject({ type: 'income', amount: 50 });
  });
});

describe('an exclamation before the amount does not make two entries', () => {
  it.each([
    ['Payday! 2400', 'en'],
    ['給料日！25万円', 'ja'],
    ['Zahltag! 2400', 'de'],
  ])('%s', (text, lang) => {
    const r = parseOne(text, lang);
    expect(r).toHaveLength(1);
    expect(r[0].type).toBe('income');
  });
  it('but two real sentences still make two', () => {
    expect(parseOne('Lunch 12! Coffee 4', 'en')).toHaveLength(2);
  });
});

describe('a year after a month is a year only when it looks like one', () => {
  it('"by June 2027," keeps 2027 as the year', () => {
    expect(parseOne('save 3000 for a trip to Hawaii by June 2027, please', 'en')[0]).toMatchObject({ kind: 'goal', amount: 3000, targetDate: '2027-06-30' });
  });
  it('"by June 3000" is an amount, never the year 3000', () => {
    expect(parseOne('save by June 3000 for a car', 'en')[0]).toMatchObject({ kind: 'goal', amount: 3000 });
  });
  it('"bis Juni 2000 Euro" is an amount', () => {
    expect(parseOne('Ich will bis Juni 2000 Euro sparen', 'de')[0]).toMatchObject({ kind: 'goal', amount: 2000 });
  });
});

describe('a count before a counter word is not the price', () => {
  it.each([
    ['책 2권 3만원', 'ko', 30000],
    ['신발 1켤레 5만원', 'ko', 50000],
    ['3箱啤酒120', 'zh', 120],
    ['苹果2斤15块', 'zh', 15],
  ])('%s', (text, lang, amount) => {
    const r = parseOne(text, lang);
    expect(r).toHaveLength(1);
    expect(r[0].amount).toBe(amount);
  });
});
