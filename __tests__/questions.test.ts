import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';
import { parseEntries, type ParseContext } from '@/parser';
import { answerQuestion, compareRanges, periodRange } from '@/lib/questions';
import type { Transaction } from '@/types';

const TODAY = '2026-09-16'; // a Wednesday
function ctx(language = 'en', overrides: Partial<ParseContext> = {}): ParseContext {
  return { categories: DEFAULT_CATEGORIES, goals: [], keywordMap: {}, today: TODAY, language, categoryLabels: { dining: 'Dining out', groceries: 'Groceries', transport: 'Transportation' }, ...overrides };
}
function ask(text: string, language = 'en') {
  const r = parseEntries(text, ctx(language));
  expect(r).toHaveLength(1);
  return r[0];
}
function tx(partial: Partial<Transaction> & { amount: number; occurredAt: string }): Transaction {
  return { id: Math.random().toString(36).slice(2), type: 'expense', categoryId: 'dining', note: null, rawInput: null, createdAt: '2026-09-01T00:00:00Z', isRecurringInstance: false, recurringRuleId: null, ...partial };
}

describe('the two-expense sentence', () => {
  it('Spent $9.87 at Starbucks and $58 at Korean BBQ becomes two dining entries', () => {
    const r = parseEntries('Spent $9.87 at Starbucks and $58 at Korean BBQ', ctx());
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ kind: 'transaction', type: 'expense', amount: 9.87, categoryId: 'dining', note: 'Starbucks' });
    expect(r[1]).toMatchObject({ kind: 'transaction', type: 'expense', amount: 58, categoryId: 'dining', note: 'Korean BBQ' });
    expect(r[1].hints).toEqual([]);
  });
});

describe('parsing questions', () => {
  it('how much have I spent this week on Starbucks', () => {
    const r = ask('How much have I spent this week on Starbucks?');
    expect(r.kind).toBe('question');
    expect(r.question).toMatchObject({ type: 'expense', period: 'week', target: 'Starbucks', categoryId: null, fallbackCategoryId: 'dining' });
  });
  it('how much have I spent dining out this month is a category question', () => {
    const r = ask('How much have I spent dining out this month?');
    expect(r.question).toMatchObject({ type: 'expense', period: 'month', categoryId: 'dining' });
  });
  it('understands other periods, plain totals and income', () => {
    expect(ask('how much did I spend on groceries last month').question).toMatchObject({ period: 'lastMonth', categoryId: 'groceries' });
    expect(ask('what did I spend today').question).toMatchObject({ period: 'today', target: null });
    expect(ask('how much have I spent').question).toMatchObject({ period: 'month', target: null });
    expect(ask('how much have I spent in total').question).toMatchObject({ period: 'all', target: null });
    expect(ask('How much have I earned this year?').question).toMatchObject({ type: 'income', period: 'year' });
    expect(ask("How much did I spend at Trader Joe's so far this month").question).toMatchObject({ period: 'month', target: "Trader Joe's" });
  });
  it('keeps the user casing of the target', () => {
    expect(ask('how much did i spend at KOREAN BBQ this week').question?.target).toBe('KOREAN BBQ');
  });
  it('does not turn ordinary entries into questions', () => {
    expect(parseEntries('spent 12 on lunch', ctx())[0].kind).toBe('transaction');
    expect(parseEntries('how much is my rent', ctx())[0].kind).not.toBe('question');
    expect(parseEntries('got paid 2400', ctx())[0].kind).toBe('transaction');
    expect(parseEntries('remind me to pay rent on the 1st at 9am', ctx())[0].kind).toBe('reminder');
  });
  it('never builds a pattern from the user text, and skips very long input', () => {
    for (const bad of ['how much did I spend on (.*) this week', 'how much on [a-z]+ today', 'how much have I spent on \\\\d+ this month']) {
      const r = parseEntries(bad, ctx());
      expect(r[0].kind).toBe('question');
      expect(r[0].question?.target).toBeTruthy();
    }
    const long = parseEntries('how much did i spend on ' + 'a'.repeat(300), ctx());
    expect(long[0].kind).not.toBe('question');
  });
  it.each([
    ['es', '¿Cuánto he gastado esta semana en Starbucks?', 'week', 'Starbucks'],
    ['fr', "Combien j'ai dépensé cette semaine chez Starbucks ?", 'week', 'Starbucks'],
    ['de', 'Wie viel habe ich diese Woche bei Starbucks ausgegeben?', 'week', 'Starbucks'],
    ['it', 'Quanto ho speso questa settimana da Starbucks?', 'week', 'Starbucks'],
    ['ja', '今週スターバックスでいくら使った？', 'week', 'スターバックス'],
    ['ko', '이번 주에 스타벅스에서 얼마 썼어?', 'week', '스타벅스'],
    ['zh', '这周在星巴克花了多少钱？', 'week', '星巴克'],
  ])('%s: %s', (lang, text, period, target) => {
    const r = ask(text, lang);
    expect(r.kind).toBe('question');
    expect(r.question).toMatchObject({ type: 'expense', period, target });
  });
  it.each([
    ['es', 'cuánto gané este año'], ['fr', "combien ai-je gagné cette année"], ['de', 'wie viel habe ich dieses jahr verdient'], ['it', "quanto ho guadagnato quest'anno"],
    ['ja', '今年いくら稼いだ？'], ['ko', '올해 얼마 벌었어?'], ['zh', '今年赚了多少钱'],
  ])('%s income: %s', (lang, text) => {
    expect(ask(text, lang).question).toMatchObject({ type: 'income', period: 'year', target: null });
  });
  it('still parses ordinary entries in other languages', () => {
    expect(parseEntries('gasté 12 en el almuerzo', ctx('es'))[0]).toMatchObject({ kind: 'transaction', amount: 12 });
    expect(parseEntries('午饭花了30块', ctx('zh'))[0]).toMatchObject({ kind: 'transaction', amount: 30 });
  });
});

describe('periodRange', () => {
  it('weeks start on Sunday and run to today', () => {
    expect(periodRange('week', TODAY)).toEqual({ from: '2026-09-13', to: '2026-09-16' });
    expect(periodRange('lastWeek', TODAY)).toEqual({ from: '2026-09-06', to: '2026-09-12' });
    expect(periodRange('week', '2026-09-13')).toEqual({ from: '2026-09-13', to: '2026-09-13' }); // a Sunday
    expect(periodRange('week', '2026-09-19')).toEqual({ from: '2026-09-13', to: '2026-09-19' }); // a Saturday
  });
  it('months and years', () => {
    expect(periodRange('month', TODAY)).toEqual({ from: '2026-09-01', to: '2026-09-16' });
    expect(periodRange('lastMonth', TODAY)).toEqual({ from: '2026-08-01', to: '2026-08-31' });
    expect(periodRange('year', TODAY)).toEqual({ from: '2026-01-01', to: '2026-09-16' });
    expect(periodRange('lastYear', TODAY)).toEqual({ from: '2025-01-01', to: '2025-12-31' });
    expect(periodRange('yesterday', TODAY)).toEqual({ from: '2026-09-15', to: '2026-09-15' });
  });
});

describe('answerQuestion', () => {
  const rows: Transaction[] = [
    tx({ amount: 9.87, occurredAt: '2026-09-15', note: 'Starbucks' }),
    tx({ amount: 4.5, occurredAt: '2026-09-14', note: 'Coffee', rawInput: 'coffee at starbucks 4.50' }),
    tx({ amount: 6, occurredAt: '2026-09-10', note: 'Starbucks' }), // last week (Sun 6 to Sat 12)
    tx({ amount: 58, occurredAt: '2026-09-15', note: 'Korean BBQ' }),
    tx({ amount: 120, occurredAt: '2026-09-03', categoryId: 'groceries', note: 'Costco' }),
    tx({ amount: 2400, occurredAt: '2026-09-01', type: 'income', categoryId: 'salary', note: 'Salary' }),
  ];
  it('sums entries that mention the place, in the period', () => {
    const q = ask('How much have I spent this week on Starbucks?').question!;
    const a = answerQuestion(q, rows, periodRange(q.period, TODAY), DEFAULT_CATEGORIES);
    expect(a).toMatchObject({ total: 14.37, count: 2, target: 'Starbucks', usedFallback: false });
  });
  it('sums a category for the month', () => {
    const q = ask('How much have I spent dining out this month?').question!;
    const a = answerQuestion(q, rows, periodRange(q.period, TODAY), DEFAULT_CATEGORIES);
    expect(a).toMatchObject({ total: 78.37, count: 4, categoryId: 'dining' });
  });
  it('falls back to the category when nothing mentions the word', () => {
    const q = ask('How much have I spent on restaurants this month?').question!;
    const a = answerQuestion(q, rows, periodRange(q.period, TODAY), DEFAULT_CATEGORIES);
    expect(a).toMatchObject({ categoryId: 'dining', usedFallback: true, count: 4 });
  });
  it('answers plain totals and income, and zero when nothing matches', () => {
    const all = ask('how much have I spent this month').question!;
    expect(answerQuestion(all, rows, periodRange('month', TODAY), DEFAULT_CATEGORIES)).toMatchObject({ total: 198.37, count: 5 });
    const inc = ask('how much have I earned this month').question!;
    expect(answerQuestion(inc, rows, periodRange('month', TODAY), DEFAULT_CATEGORIES)).toMatchObject({ total: 2400, count: 1 });
    const none = ask('how much did I spend at Blorp this week').question!;
    expect(answerQuestion(none, rows, periodRange('week', TODAY), DEFAULT_CATEGORIES)).toMatchObject({ total: 0, count: 0, usedFallback: false });
  });
});

describe('"this week" starts on Monday where the locale says so', () => {
  it('week, last week and the comparison follow firstDay; the weekend stays Saturday and Sunday', () => {
    expect(periodRange('week', '2026-09-16', undefined, 7, 1)).toEqual({ from: '2026-09-14', to: '2026-09-16' });
    expect(periodRange('lastWeek', '2026-09-16', undefined, 7, 1)).toEqual({ from: '2026-09-07', to: '2026-09-13' });
    expect(periodRange('week', '2026-09-13', undefined, 7, 1)).toEqual({ from: '2026-09-07', to: '2026-09-13' });
    expect(periodRange('weekend', '2026-09-16', undefined, 7, 1)).toEqual({ from: '2026-09-12', to: '2026-09-13' });
    expect(compareRanges('week', '2026-09-16', undefined, undefined, 1)).toEqual({ now: { from: '2026-09-14', to: '2026-09-16' }, before: { from: '2026-09-07', to: '2026-09-09' } });
  });
});
