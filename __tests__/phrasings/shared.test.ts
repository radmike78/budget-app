/**
 * Fixes in the shared parser that every language benefits from, found while
 * collecting the phrasings: each was a real sentence the app misread.
 */
import type { Goal } from '@/types';
import { periodRange } from '@/lib/questions';
import { en } from '@/i18n/locales/en';
import { es } from '@/i18n/locales/es';
import { de } from '@/i18n/locales/de';
import { ja } from '@/i18n/locales/ja';
import { zh } from '@/i18n/locales/zh';
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

describe('the weekend and the last few days are periods', () => {
  it.each([
    ['how much did I spend over the weekend', 'en'],
    ['¿cuánto gasté el fin de semana?', 'es'],
    ["combien j'ai dépensé ce week-end", 'fr'],
    ['Wie viel habe ich am Wochenende ausgegeben?', 'de'],
    ['quanto ho speso nel weekend', 'it'],
    ['週末いくら使った？', 'ja'],
    ['주말에 얼마 썼어?', 'ko'],
    ['周末花了多少钱', 'zh'],
  ])('%s', (text, lang) => {
    expect(parseOne(text, lang)[0]).toMatchObject({ kind: 'question', question: { ask: 'spent', period: 'weekend', target: null } });
  });
  it.each([
    ['how much have I spent in the last 7 days', 'en', 7],
    ['how much on coffee over the past 30 days', 'en', 30],
    ['¿cuánto gasté en los últimos 10 días?', 'es', 10],
    ["combien j'ai dépensé ces 14 derniers jours", 'fr', 14],
    ['Wie viel habe ich in den letzten 7 Tagen ausgegeben?', 'de', 7],
    ['quanto ho speso negli ultimi 5 giorni', 'it', 5],
    ['過去7日間でいくら使った？', 'ja', 7],
    ['최근 7일 동안 얼마 썼어?', 'ko', 7],
    ['最近7天花了多少钱', 'zh', 7],
  ])('%s', (text, lang, days) => {
    expect(parseOne(text, lang)[0]).toMatchObject({ kind: 'question', question: { ask: 'spent', period: 'recentDays', days } });
  });
  it('a target still comes through: "on coffee over the past 30 days"', () => {
    expect(parseOne('how much on coffee over the past 30 days', 'en')[0].question).toMatchObject({ target: 'Coffee', fallbackCategoryId: 'dining' });
  });
});

describe('ranges for the new periods', () => {
  // TODAY in the harness is Wednesday 2026-09-16.
  it('the weekend is the Saturday and Sunday just gone, or this one while it is under way', () => {
    expect(periodRange('weekend', '2026-09-16')).toEqual({ from: '2026-09-12', to: '2026-09-13' });
    expect(periodRange('weekend', '2026-09-19')).toEqual({ from: '2026-09-19', to: '2026-09-19' });
    expect(periodRange('weekend', '2026-09-20')).toEqual({ from: '2026-09-19', to: '2026-09-20' });
  });
  it('the last 7 days are today and the six before it', () => {
    expect(periodRange('recentDays', '2026-09-16', undefined, 7)).toEqual({ from: '2026-09-10', to: '2026-09-16' });
    expect(periodRange('recentDays', '2026-09-16', undefined, 1)).toEqual({ from: '2026-09-16', to: '2026-09-16' });
  });
  it('the answer names them in every language', () => {
    for (const t of [en.s, es.s, de.s, ja.s]) {
      expect(t.periodNames.weekend).toBeTruthy();
      expect(t.periodLastDays(7)).toContain('7');
    }
    expect(en.s.answerTotal(en.s.periodLastDays(7), '$40.00', null, 3, false)).toBe("In the last 7 days you've spent $40.00, across 3 entries.");
  });
});

describe('"what is left" with an amount in it is an entry', () => {
  it('"left 5 for the tip" is not a question', () => {
    expect(parseOne('how much is left 5 for the tip', 'en')[0].kind).toBe('transaction');
  });
});

describe('a category word that holds a verb is still a fix', () => {
  // 买菜 (groceries) holds 买 (buy), 打车 (taxi) holds 打; the verb check only looks outside the category's words.
  it.each([['改成买菜', 'groceries'], ['放到买菜里', 'groceries'], ['把它改成买菜', 'groceries'], ['改成交通', 'transport']])('%s', (text, id) => {
    expect(parseOne(text, 'zh', zh.s.categoryNames)[0]).toMatchObject({ kind: 'correction', correction: { categoryId: id } });
  });
  it('while a verb outside them still makes a new entry', () => {
    expect(parseOne('其实午饭花了14', 'zh', zh.s.categoryNames)[0].kind).toBe('transaction');
  });
});
