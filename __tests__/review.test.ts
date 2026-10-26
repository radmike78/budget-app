/**
 * Behaviour pinned down by the Opus 5.5 review pass: each block is a bug that
 * shipped, and the test is what keeps it from coming back.
 */
import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';
import { formatMoney, moneyInputText, parseMoneyInput } from '@/lib/money';
import { genderOf, pickVoice } from '@/lib/voices';
import { parseInput } from '@/parser';
import { en } from '@/i18n/locales/en';
import { de } from '@/i18n/locales/de';

const ctx = { categories: DEFAULT_CATEGORIES, goals: [], keywordMap: {}, today: '2026-10-04', nowTime: '12:00', language: 'en' };

describe('money never reads "minus nothing"', () => {
  it('drops the sign when the amount rounds to zero', () => {
    // 0.1 + 0.2 - 0.3 is 5.6e-17; the other way round it is negative, and is still no money.
    expect(formatMoney(0.3 - 0.1 - 0.2, 'USD')).toBe('$0.00');
    expect(formatMoney(-0.004, 'USD')).toBe('$0.00');
    expect(formatMoney(-0.4, 'JPY')).toBe('¥0');
    expect(formatMoney(-0.000001, 'EUR', { compact: true, format: de.format })).toBe('0\u00a0€');
  });
  it('keeps the sign on a real negative', () => {
    expect(formatMoney(-0.005, 'USD')).toBe('-$0.01');
    expect(formatMoney(-12, 'USD', { compact: true })).toBe('-$12');
  });
});

describe('a bare currency symbol is not a note', () => {
  it('leaves no "$" behind', () => {
    expect(parseInput('$-20 refund', ctx).note).toBeNull();
    expect(parseInput('coffee $', ctx).note).toBe('Coffee');
    expect(parseInput('lunch 12 €', ctx).note).toBe('Lunch');
  });
  it('keeps notes that merely contain a symbol or a number', () => {
    expect(parseInput('spent 45 at Phillips 66', ctx).note).toBe('Phillips 66');
    expect(parseInput('spent 12 at 7-Eleven', ctx).note).toMatch(/7-Eleven/i);
  });
});

describe('voice names are matched as whole names', () => {
  it('does not find a female name inside a male one', () => {
    expect(genderOf('Florian')).not.toBe('female');
    expect(genderOf('Gustavo')).not.toBe('female');
    expect(genderOf('de-DE Florian (Enhanced)')).not.toBe('female');
  });
  it('still reads the usual names and the explicit markers', () => {
    expect(genderOf('Samantha')).toBe('female');
    expect(genderOf('Ava (Premium)')).toBe('female');
    expect(genderOf('Daniel')).toBe('male');
    expect(genderOf('en-us-x-sfg#female_1-local')).toBe('female');
    expect(genderOf('en-us-x-iom#male_2-local')).toBe('male');
    expect(genderOf('Siri Female')).toBe('female');
  });
  it('so a male voice is chosen when one is asked for', () => {
    const voices = [
      { identifier: 'flo', name: 'Florian', language: 'de-DE' },
      { identifier: 'anna', name: 'Anna', language: 'de-DE' },
    ];
    expect(pickVoice(voices, 'de-DE', 'female')).toBe('anna');
    expect(pickVoice(voices, 'de-DE', 'male')).toBe('flo');
  });
});

describe('the home card never calls income a plan', () => {
  it('says it falls short instead, in words, since the headline is already the amount', () => {
    expect(en.s.shortOfIncome(false)).toBe('more than came in');
    expect(en.s.shortOfIncome(true)).toBe('short once the bills are paid');
    expect(en.s.shortOfIncome(true)).not.toMatch(/plan|\d/);
  });
  it('and past a real plan the label names the plan, not the amount over it', () => {
    expect(en.s.pastPlanLabel('$1,200')).toBe('past the $1,200 plan');
  });
});

describe('an amount in an edit field reads as money', () => {
  it('shows cents as two digits, and whole amounts bare', () => {
    expect(moneyInputText(14.2)).toBe('14.20');
    expect(moneyInputText(14.25)).toBe('14.25');
    expect(moneyInputText(1200)).toBe('1200');
    expect(moneyInputText(0.5)).toBe('0.50');
  });
  it('uses the locale\'s decimal mark, and reads back to the same number', () => {
    expect(moneyInputText(14.2, true)).toBe('14,20');
    for (const n of [14.2, 0.05, 1234.5, 99]) {
      expect(parseMoneyInput(moneyInputText(n))).toBe(n);
      expect(parseMoneyInput(moneyInputText(n, true), true)).toBe(n);
    }
  });
});

describe('a place keeps the capitals it was said with', () => {
  it('even when the amount sits between the words', () => {
    expect(parseInput('coffee 6.50 at Blue Bottle', ctx).note).toBe('Coffee at Blue Bottle');
    expect(parseInput('dinner 48 at the Thai place', ctx).note).toMatch(/Thai/);
  });
  it('and still when the words were said together', () => {
    expect(parseInput("spent 40 at Fleming's Steakhouse", ctx).note).toBe("Fleming's Steakhouse");
  });
});

describe('answers are never read by a network voice', () => {
  it('skips Android voices that synthesise on Google servers', () => {
    const voices = [
      { identifier: 'en-us-x-tpf-network', name: 'en-us-x-tpf-network', language: 'en-US', quality: 'Enhanced' },
      { identifier: 'en-us-x-sfg#female_1-local', name: 'en-us-x-sfg#female_1-local', language: 'en-US', quality: 'Default' },
    ];
    expect(pickVoice(voices, 'en-US', 'female')).toBe('en-us-x-sfg#female_1-local');
  });
});
