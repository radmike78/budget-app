/**
 * "What's my remaining budget?", "how much do I have left for groceries?",
 * "how much have I spent this pay period?" and "how much on food?", in every
 * language the app speaks.
 */
import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';
import { parseEntries, type ParseContext } from '@/parser';
import { answerQuestion, answerRemaining, periodRange, type RemainingContext } from '@/lib/questions';
import { en } from '@/i18n/locales/en';
import { es } from '@/i18n/locales/es';
import { fr } from '@/i18n/locales/fr';
import { de } from '@/i18n/locales/de';
import { it as itLocale } from '@/i18n/locales/it';
import { ja } from '@/i18n/locales/ja';
import { ko } from '@/i18n/locales/ko';
import { zh } from '@/i18n/locales/zh';
import type { Category, MonthStats, Transaction } from '@/types';

const TODAY = '2026-09-16';
const LOCALES = { en, es, fr, de, it: itLocale, ja, ko, zh };
type Lang = keyof typeof LOCALES;

function ask(text: string, language: Lang = 'en', categories: Category[] = DEFAULT_CATEGORIES) {
  const ctx: ParseContext = { categories, goals: [], keywordMap: {}, today: TODAY, language, categoryLabels: LOCALES[language].s.categoryNames };
  const r = parseEntries(text, ctx);
  expect(r).toHaveLength(1);
  expect(r[0].kind).toBe('question');
  return r[0].question!;
}

describe('asking what is left', () => {
  it.each([
    'What is my remaining budget?',
    "what's my remaining budget",
    'how much do I have left',
    'how much money do we have left this month',
    "what's left",
    'how much can I still spend',
  ])('"%s" asks for the overall amount left', (text) => {
    expect(ask(text)).toMatchObject({ ask: 'left', period: 'budget', target: null, categoryId: null, categoryIds: null });
  });

  it.each([
    ["what's my remaining budget for groceries", 'groceries'],
    ['how much is left in my grocery budget', 'groceries'],
    ['how much can I still spend on dining this month', 'dining'],
    ["what's my dining budget", 'dining'],
    ['how much is left of my entertainment plan', 'entertainment'],
    ['how much do I have left for rent', 'rent'],
  ])('"%s" asks about one category', (text, id) => {
    const q = ask(text);
    expect(q.ask).toBe('left');
    expect(q.categoryId ?? q.fallbackCategoryId).toBe(id);
  });

  it('"food" means groceries and eating out together, as a whole word only', () => {
    expect(ask("what's left for food")).toMatchObject({ ask: 'left', categoryIds: ['groceries', 'dining'] });
    expect(ask('how much did I spend on food')).toMatchObject({ ask: 'spent', categoryIds: ['groceries', 'dining'] });
    expect(ask('how much did I spend on food truck tacos').categoryIds).toBeNull();
  });

  it('a category the user named "Food" wins over the everyday word', () => {
    const cats = [...DEFAULT_CATEGORIES, { ...DEFAULT_CATEGORIES[4], id: 'c_food', name: 'Food', isDefault: false }];
    expect(ask('how much did I spend on food', 'en', cats)).toMatchObject({ categoryId: 'c_food', categoryIds: null });
  });

  it('an entry that only mentions "left" is still an entry', () => {
    const r = parseEntries('lunch 12 left a tip', { categories: DEFAULT_CATEGORIES, goals: [], keywordMap: {}, today: TODAY, language: 'en' });
    expect(r[0].kind).toBe('transaction');
    expect(r[0].amount).toBe(12);
  });
});

describe('the pay period as a period', () => {
  it.each(['How much have I spent this pay period?', 'how much have I spent since payday', 'how much did I spend since I got paid'])('"%s"', (text) => {
    expect(ask(text)).toMatchObject({ ask: 'spent', period: 'budget', periodDefaulted: false });
  });
  it('says when no period was given, so the answer can use the budget period', () => {
    expect(ask('how much have I spent on entertainment')).toMatchObject({ period: 'month', periodDefaulted: true, categoryId: 'entertainment' });
    expect(ask('how much did I spend on gas this week')).toMatchObject({ period: 'week', periodDefaulted: false, fallbackCategoryId: 'transport' });
  });
  it('runs from the period start to today, and falls back to the month', () => {
    expect(periodRange('budget', TODAY, { start: '2026-09-11', end: '2026-09-24' })).toEqual({ from: '2026-09-11', to: TODAY });
    expect(periodRange('budget', TODAY)).toEqual({ from: '2026-09-01', to: TODAY });
  });
});

describe('every language asks the same things', () => {
  const cases: [Lang, string, Record<string, unknown>][] = [
    ['es', '¿Cuánto me queda?', { ask: 'left', target: null }],
    ['es', '¿cuánto me queda del presupuesto de comida?', { ask: 'left', categoryIds: ['groceries', 'dining'] }],
    ['es', '¿cuánto he gastado este periodo de pago?', { ask: 'spent', period: 'budget' }],
    ['es', '¿cuánto gasté desde que cobré?', { ask: 'spent', period: 'budget' }],
    ['fr', 'Combien il me reste ?', { ask: 'left', target: null }],
    ['fr', 'combien me reste-t-il pour la nourriture', { ask: 'left', categoryIds: ['groceries', 'dining'] }],
    ['fr', "combien j'ai dépensé depuis la paie", { ask: 'spent', period: 'budget' }],
    ['de', 'Wie viel habe ich noch?', { ask: 'left', target: null }],
    ['de', 'Wie viel habe ich noch für Lebensmittel?', { ask: 'left', categoryId: 'groceries' }],
    ['de', 'wie viel habe ich noch für essen', { ask: 'left', categoryIds: ['groceries', 'dining'] }],
    ['de', 'wie viel habe ich seit dem zahltag ausgegeben', { ask: 'spent', period: 'budget' }],
    ['de', 'wie viel ist für essen draufgegangen', { ask: 'spent', categoryIds: ['groceries', 'dining'] }],
    ['it', 'Quanto mi resta?', { ask: 'left', target: null }],
    ['it', 'quanto mi resta per il cibo', { ask: 'left', categoryIds: ['groceries', 'dining'] }],
    ['it', 'quanto ho speso dallo stipendio', { ask: 'spent', period: 'budget' }],
    ['ja', '予算はあといくら？', { ask: 'left', target: null }],
    ['ja', '食費はあといくら使える？', { ask: 'left', categoryIds: ['groceries', 'dining'] }],
    ['ja', '給料日からいくら使った？', { ask: 'spent', period: 'budget' }],
    ['ko', '예산 얼마나 남았어?', { ask: 'left', target: null }],
    ['ko', '식비 얼마 남았어?', { ask: 'left', categoryIds: ['groceries', 'dining'] }],
    ['ko', '월급날부터 얼마 썼어?', { ask: 'spent', period: 'budget' }],
    ['zh', '预算还剩多少？', { ask: 'left', target: null }],
    ['zh', '吃饭还剩多少？', { ask: 'left', categoryIds: ['groceries', 'dining'] }],
    ['zh', '发工资以来花了多少钱', { ask: 'spent', period: 'budget' }],
  ];
  it.each(cases)('%s: %s', (lang, text, expected) => {
    expect(ask(text, lang)).toMatchObject(expected);
  });
});

const stats = (over: Partial<MonthStats> = {}): MonthStats => ({
  month: '2026-09',
  period: { start: '2026-09-01', end: '2026-09-30' },
  income: 0,
  expenses: 300,
  byCategory: [{ categoryId: 'groceries', total: 180, count: 4 }, { categoryId: 'dining', total: 120, count: 3 }],
  ...over,
});
const withPlans = (plans: Record<string, number>) => DEFAULT_CATEGORIES.map((c) => (plans[c.id] != null ? { ...c, monthlyLimit: plans[c.id] } : c));
const rctx = (over: Partial<RemainingContext> = {}): RemainingContext => ({ stats: stats(), categories: DEFAULT_CATEGORIES, carry: {}, overallLimit: null, rules: [], today: TODAY, ...over });

describe('working out what is left', () => {
  const overall = ask("what's my remaining budget");
  it('answers from the overall plan first', () => {
    expect(answerRemaining(overall, rctx({ overallLimit: 1000 }))).toEqual({ kind: 'overall', left: 700, plan: 1000 });
    expect(answerRemaining(overall, rctx({ overallLimit: 250 }))).toEqual({ kind: 'overall', left: -50, plan: 250 });
  });
  it('then from income, less the bills still due this period', () => {
    const rules = [{ type: 'expense' as const, active: true, amount: 100, nextOccurrence: '2026-09-20', frequency: 'monthly' as const, anchorDay: 20 }];
    expect(answerRemaining(overall, rctx({ stats: stats({ income: 1000 }), rules }))).toEqual({ kind: 'income', left: 600, billsDue: 100 });
  });
  it('then from the category plans added up', () => {
    expect(answerRemaining(overall, rctx({ categories: withPlans({ groceries: 400, dining: 100 }) }))).toEqual({ kind: 'plans', left: 200, plan: 500 });
  });
  it('and says so when there is nothing to count down from', () => {
    expect(answerRemaining(overall, rctx())).toEqual({ kind: 'nothing', spent: 300 });
  });
  it('answers a category from its own plan, carry-over included', () => {
    const q = ask('how much do I have left for groceries');
    expect(answerRemaining(q, rctx({ categories: withPlans({ groceries: 250 }), carry: { groceries: { amount: 50, pendingLeftover: null } } }))).toEqual({ kind: 'category', ids: ['groceries'], left: 120, plan: 300 });
    expect(answerRemaining(q, rctx())).toEqual({ kind: 'categoryNoPlan', ids: ['groceries'], spent: 180 });
  });
  it('a group counts only the categories that have a plan, and names them', () => {
    const q = ask("what's left for food");
    expect(answerRemaining(q, rctx({ categories: withPlans({ groceries: 400 }) }))).toEqual({ kind: 'category', ids: ['groceries'], left: 220, plan: 400 });
    expect(answerRemaining(q, rctx({ categories: withPlans({ groceries: 400, dining: 100 }) }))).toEqual({ kind: 'category', ids: ['groceries', 'dining'], left: 200, plan: 500 });
  });
  it('words that name no category say so', () => {
    expect(answerRemaining(ask('how much do I have left for zorbles'), rctx())).toEqual({ kind: 'unknown' });
  });
});

describe('spending on a group', () => {
  it('sums every category in it', () => {
    const tx = (categoryId: string, amount: number): Transaction => ({ id: `${categoryId}${amount}`, type: 'expense', categoryId, amount, note: null, rawInput: null, occurredAt: '2026-09-10', createdAt: '2026-09-10T00:00:00Z', isRecurringInstance: false, recurringRuleId: null });
    const q = ask('how much did I spend on food');
    const a = answerQuestion(q, [tx('groceries', 40), tx('dining', 25), tx('transport', 60)], periodRange('month', TODAY), DEFAULT_CATEGORIES);
    expect(a).toMatchObject({ total: 65, count: 2, categoryIds: ['groceries', 'dining'] });
  });
});

describe('the sentences', () => {
  it('read plainly in English, without alarm words', () => {
    const s = en.s;
    expect(s.answerLeft('$120.00', '$300.00', 'Groceries', 'September 30')).toBe('You have $120.00 left of your $300.00 plan for Groceries, until September 30.');
    expect(s.answerIncomeLeft('$600.00', 'September 30', true)).toBe('After the bills still due, you have $600.00 to spend until September 30.');
    expect(s.periodNames.budget).toBe('this pay period');
    expect(s.answerNoPlanFor('Shopping', null)).toBe("Shopping has no plan, so there's nothing to count down from. Nothing has gone to it this period.");
    for (const lang of Object.keys(LOCALES) as Lang[]) {
      const t = LOCALES[lang].s;
      const all = [t.answerLeft('1', '2', 'x', 'd'), t.answerPast('1', '2', null), t.answerIncomeLeft('1', 'd', true), t.answerIncomeShort('1', false), t.answerPlansLeft('1', '2', 'd'), t.answerNothingSet('1'), t.answerNoPlanFor('x', '1'), t.answerNoPlanFor('x', null), t.answerNoCategory('x')];
      for (const line of all) {
        expect(line.length).toBeGreaterThan(5);
        expect(line).not.toMatch(/over budget|!|¡/i);
      }
      expect(t.periodNames.budget).toBeTruthy();
    }
  });
});
