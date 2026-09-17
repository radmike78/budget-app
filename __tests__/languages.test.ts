import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';
import { parseInput, learnableWords, type ParseContext } from '@/parser';
import { getPack } from '@/parser/packs';
import type { Goal } from '@/types';

const TODAY = '2026-09-10'; // Thursday

const goals: Goal[] = [
  { id: 'g1', name: 'Viaje a Japón', kind: 'saving', targetAmount: 3000, currentAmount: 500, targetDate: '2027-04-01', createdAt: '2026-08-01T00:00:00Z', completed: false },
];

function ctx(language: string, overrides: Partial<ParseContext> = {}): ParseContext {
  return { categories: DEFAULT_CATEGORIES, goals: [], keywordMap: {}, today: TODAY, language, ...overrides };
}

describe('number words per language', () => {
  it.each([
    ['es', 'gasté veinticinco euros', 'gasté 25 euros'],
    ['es', 'doscientos cincuenta', '250'],
    ['es', 'mil doscientos', '1200'],
    ['fr', 'vingt-cinq euros', '25 euros'],
    ['fr', 'quatre-vingt-dix euros', '90 euros'],
    ['fr', 'deux cents', '200'],
    ['fr', 'mille deux cents', '1200'],
    ['it', 'venticinque euro', '25 euro'],
    ['it', 'duecentocinquanta', '250'],
    ['it', 'duemila', '2000'],
    ['de', 'fünfundzwanzig euro', '25 euro'],
    ['de', 'zweihundertfünfzig', '250'],
    ['de', 'eintausendzweihundert', '1200'],
    ['de', 'der hund kostet', 'der hund kostet'],
    ['zh', '十二块', '12块'],
    ['zh', '一千二百', '1200'],
    ['zh', '两百五', '250'],
    ['zh', '12块5', '12.5块'],
    ['ja', '千二百円', '1200円'],
    ['ja', '1万2千円', '12000円'],
    ['ja', '五百円', '500円'],
    ['ko', '2만5천원', '25000원'],
    ['ko', '만원', '10000원'],
    ['ko', '오천원', '5000원'],
    ['ko', '12,000원', '12000원'],
  ])('%s: %s -> %s', (lang, input, expected) => {
    expect(getPack(lang).numberWords(input)).toBe(expected);
  });
});

describe('Spanish', () => {
  it('parses an expense with a category', () => {
    const r = parseInput('gasté 12 euros en el almuerzo', ctx('es'));
    expect(r.kind).toBe('transaction');
    expect(r.amount).toBe(12);
    expect(r.type).toBe('expense');
    expect(r.categoryId).toBe('dining');
    expect(r.note).toBe('Almuerzo');
  });
  it('handles decimal commas', () => {
    const r = parseInput('café 2,50', ctx('es'));
    expect(r.amount).toBe(2.5);
    expect(r.categoryId).toBe('dining');
  });
  it('parses income', () => {
    const r = parseInput('cobré la nómina 2400', ctx('es'));
    expect(r.type).toBe('income');
    expect(r.categoryId).toBe('salary');
    expect(r.amount).toBe(2400);
  });
  it('parses dates', () => {
    expect(parseInput('pagué 80 de luz ayer', ctx('es')).occurredAt).toBe('2026-09-09');
    expect(parseInput('gasolina 40 el lunes pasado', ctx('es')).occurredAt).toBe('2026-09-07');
    expect(parseInput('cena 30 el 3 de septiembre', ctx('es')).occurredAt).toBe('2026-09-03');
  });
  it('utilities vs transport', () => {
    expect(parseInput('pagué 80 de luz', ctx('es')).categoryId).toBe('utilities');
    expect(parseInput('40 de gasolina', ctx('es')).categoryId).toBe('transport');
  });
  it('parses a goal', () => {
    const r = parseInput('meta: ahorrar 500 para un viaje para diciembre', ctx('es'));
    expect(r.kind).toBe('goal');
    expect(r.amount).toBe(500);
    expect(r.goalName).toBe('Viaje');
    expect(r.targetDate).toBe('2026-12-31');
  });
  it('parses "quiero ahorrar"', () => {
    const r = parseInput('quiero ahorrar 2000 para un fondo de emergencia', ctx('es'));
    expect(r.kind).toBe('goal');
    expect(r.goalName).toBe('Fondo de emergencia');
  });
  it('parses a contribution', () => {
    const r = parseInput('añadí 100 al viaje', ctx('es', { goals }));
    expect(r.kind).toBe('contribution');
    expect(r.goalId).toBe('g1');
    expect(r.amount).toBe(100);
  });
});

describe('French', () => {
  it('parses an expense', () => {
    const r = parseInput("j'ai dépensé 12 euros pour le déjeuner", ctx('fr'));
    expect(r.amount).toBe(12);
    expect(r.type).toBe('expense');
    expect(r.categoryId).toBe('dining');
    expect(r.note).toBe('Déjeuner');
  });
  it('parses income', () => {
    const r = parseInput("j'ai reçu mon salaire 2400", ctx('fr'));
    expect(r.type).toBe('income');
    expect(r.categoryId).toBe('salary');
  });
  it('parses dates', () => {
    expect(parseInput('courses 65 hier', ctx('fr')).occurredAt).toBe('2026-09-09');
    expect(parseInput('essence 40 lundi dernier', ctx('fr')).occurredAt).toBe('2026-09-07');
    expect(parseInput('dîner 30 le 3 septembre', ctx('fr')).occurredAt).toBe('2026-09-03');
  });
  it('parses a goal', () => {
    const r = parseInput('objectif : économiser 500 pour un voyage avant décembre', ctx('fr'));
    expect(r.kind).toBe('goal');
    expect(r.amount).toBe(500);
    expect(r.goalName).toBe('Voyage');
    expect(r.targetDate).toBe('2026-12-31');
  });
  it('parses "je veux économiser"', () => {
    const r = parseInput("je veux économiser 1500 pour un nouvel ordinateur", ctx('fr'));
    expect(r.kind).toBe('goal');
    expect(r.goalName).toBe('Ordinateur');
  });
  it('parses a contribution', () => {
    const r = parseInput('ajouté 100 au voyage', ctx('fr', { goals: [{ ...goals[0], name: 'Voyage au Japon' }] }));
    expect(r.kind).toBe('contribution');
    expect(r.amount).toBe(100);
  });
});

describe('Italian', () => {
  it('parses an expense', () => {
    const r = parseInput('ho speso 12 euro per il pranzo', ctx('it'));
    expect(r.amount).toBe(12);
    expect(r.categoryId).toBe('dining');
    expect(r.note).toBe('Pranzo');
  });
  it('parses groceries with "spesa"', () => {
    const r = parseInput('spesa 65,30', ctx('it'));
    expect(r.amount).toBe(65.3);
    expect(r.categoryId).toBe('groceries');
  });
  it('parses income', () => {
    const r = parseInput('ricevuto lo stipendio 2400', ctx('it'));
    expect(r.type).toBe('income');
    expect(r.categoryId).toBe('salary');
  });
  it('parses dates', () => {
    expect(parseInput('cena 30 ieri sera', ctx('it')).occurredAt).toBe('2026-09-09');
    expect(parseInput('benzina 40 lunedì scorso', ctx('it')).occurredAt).toBe('2026-09-07');
    expect(parseInput('cena 30 il 3 settembre', ctx('it')).occurredAt).toBe('2026-09-03');
  });
  it('parses a goal', () => {
    const r = parseInput('obiettivo: risparmiare 500 per un viaggio entro dicembre', ctx('it'));
    expect(r.kind).toBe('goal');
    expect(r.amount).toBe(500);
    expect(r.goalName).toBe('Viaggio');
    expect(r.targetDate).toBe('2026-12-31');
  });
  it('parses a contribution', () => {
    const r = parseInput('aggiunto 100 al viaggio', ctx('it', { goals: [{ ...goals[0], name: 'Viaggio in Giappone' }] }));
    expect(r.kind).toBe('contribution');
  });
});

describe('German', () => {
  it('parses an expense', () => {
    const r = parseInput('12 euro für mittagessen ausgegeben', ctx('de'));
    expect(r.amount).toBe(12);
    expect(r.type).toBe('expense');
    expect(r.categoryId).toBe('dining');
    expect(r.note).toBe('Mittagessen');
  });
  it('parses decimal comma and thousands', () => {
    expect(parseInput('miete 1.200,50 bezahlt', ctx('de')).amount).toBe(1200.5);
  });
  it('parses income', () => {
    const r = parseInput('gehalt bekommen 2400', ctx('de'));
    expect(r.type).toBe('income');
    expect(r.categoryId).toBe('salary');
  });
  it('parses dates', () => {
    expect(parseInput('einkauf 65 gestern', ctx('de')).occurredAt).toBe('2026-09-09');
    expect(parseInput('tanken 40 letzten montag', ctx('de')).occurredAt).toBe('2026-09-07');
    expect(parseInput('abendessen 30 am 3. september', ctx('de')).occurredAt).toBe('2026-09-03');
  });
  it('parses a goal', () => {
    const r = parseInput('ziel: 500 für eine reise bis dezember sparen', ctx('de'));
    expect(r.kind).toBe('goal');
    expect(r.amount).toBe(500);
    expect(r.goalName).toBe('Reise');
    expect(r.targetDate).toBe('2026-12-31');
  });
  it('parses "ich will sparen"', () => {
    const r = parseInput('ich will 2000 für einen notgroschen sparen', ctx('de'));
    expect(r.kind).toBe('goal');
    expect(r.goalName).toBe('Notgroschen');
  });
  it('parses a contribution', () => {
    const r = parseInput('100 zur reise hinzugefügt', ctx('de', { goals: [{ ...goals[0], name: 'Reise nach Japan' }] }));
    expect(r.kind).toBe('contribution');
    expect(r.amount).toBe(100);
  });
});

describe('Chinese', () => {
  it('parses an expense', () => {
    const r = parseInput('午饭花了12块', ctx('zh'));
    expect(r.kind).toBe('transaction');
    expect(r.amount).toBe(12);
    expect(r.type).toBe('expense');
    expect(r.categoryId).toBe('dining');
  });
  it('parses CJK numerals', () => {
    const r = parseInput('打车花了三十五块', ctx('zh'));
    expect(r.amount).toBe(35);
    expect(r.categoryId).toBe('transport');
  });
  it('parses income', () => {
    const r = parseInput('发工资了8000', ctx('zh'));
    expect(r.type).toBe('income');
    expect(r.categoryId).toBe('salary');
    expect(r.amount).toBe(8000);
  });
  it('parses dates', () => {
    expect(parseInput('昨天买菜花了80', ctx('zh')).occurredAt).toBe('2026-09-09');
    expect(parseInput('上周一加油200', ctx('zh')).occurredAt).toBe('2026-09-07');
    expect(parseInput('9月3日晚饭150', ctx('zh')).occurredAt).toBe('2026-09-03');
  });
  it('parses a goal', () => {
    const r = parseInput('目标：年底前存5000块去日本旅行', ctx('zh'));
    expect(r.kind).toBe('goal');
    expect(r.amount).toBe(5000);
    expect(r.targetDate).toBe('2026-12-31');
    expect(r.goalName).toContain('日本旅行');
  });
  it('parses "想存"', () => {
    const r = parseInput('想存3000买电脑', ctx('zh'));
    expect(r.kind).toBe('goal');
    expect(r.amount).toBe(3000);
  });
  it('parses a contribution', () => {
    const r = parseInput('往日本旅行里存了200', ctx('zh', { goals: [{ ...goals[0], name: '日本旅行' }] }));
    expect(r.kind).toBe('contribution');
    expect(r.amount).toBe(200);
  });
  it('learns the leftover phrase', () => {
    expect(learnableWords('在小明家花了50', 'zh')).toEqual(['小明家']);
  });
});

describe('Japanese', () => {
  it('parses an expense', () => {
    const r = parseInput('ランチに1200円使った', ctx('ja'));
    expect(r.amount).toBe(1200);
    expect(r.type).toBe('expense');
    expect(r.categoryId).toBe('dining');
  });
  it('parses kanji numerals', () => {
    const r = parseInput('タクシー代二千五百円', ctx('ja'));
    expect(r.amount).toBe(2500);
    expect(r.categoryId).toBe('transport');
  });
  it('parses income', () => {
    const r = parseInput('給料が25万円入った', ctx('ja'));
    expect(r.type).toBe('income');
    expect(r.categoryId).toBe('salary');
    expect(r.amount).toBe(250000);
  });
  it('parses dates', () => {
    expect(parseInput('昨日スーパーで3000円', ctx('ja')).occurredAt).toBe('2026-09-09');
    expect(parseInput('先週の月曜日にガソリン5000円', ctx('ja')).occurredAt).toBe('2026-09-07');
    expect(parseInput('9月3日に家賃8万円払った', ctx('ja')).occurredAt).toBe('2026-09-03');
  });
  it('parses a goal', () => {
    const r = parseInput('目標：12月までに旅行のために5万円貯めたい', ctx('ja'));
    expect(r.kind).toBe('goal');
    expect(r.amount).toBe(50000);
    expect(r.targetDate).toBe('2026-12-31');
    expect(r.goalName).toBe('旅行');
  });
  it('parses a contribution', () => {
    const r = parseInput('日本旅行に1万円入れた', ctx('ja', { goals: [{ ...goals[0], name: '日本旅行' }] }));
    expect(r.kind).toBe('contribution');
    expect(r.amount).toBe(10000);
  });
});

describe('Korean', () => {
  it('parses an expense', () => {
    const r = parseInput('점심에 12000원 썼어', ctx('ko'));
    expect(r.amount).toBe(12000);
    expect(r.type).toBe('expense');
    expect(r.categoryId).toBe('dining');
  });
  it('parses 만/천 numerals', () => {
    const r = parseInput('택시비 2만5천원', ctx('ko'));
    expect(r.amount).toBe(25000);
    expect(r.categoryId).toBe('transport');
  });
  it('parses income', () => {
    const r = parseInput('월급 300만원 받았어', ctx('ko'));
    expect(r.type).toBe('income');
    expect(r.categoryId).toBe('salary');
    expect(r.amount).toBe(3000000);
  });
  it('parses dates', () => {
    expect(parseInput('어제 마트에서 8만원', ctx('ko')).occurredAt).toBe('2026-09-09');
    expect(parseInput('지난주 월요일에 주유 5만원', ctx('ko')).occurredAt).toBe('2026-09-07');
    expect(parseInput('9월 3일에 월세 50만원 냈어', ctx('ko')).occurredAt).toBe('2026-09-03');
  });
  it('parses a goal', () => {
    const r = parseInput('목표: 연말까지 여행을 위해 100만원 모으기', ctx('ko'));
    expect(r.kind).toBe('goal');
    expect(r.amount).toBe(1000000);
    expect(r.targetDate).toBe('2026-12-31');
    expect(r.goalName).toBe('여행');
  });
  it('parses "모으고 싶어"', () => {
    const r = parseInput('노트북 사려고 150만원 모으고 싶어', ctx('ko'));
    expect(r.kind).toBe('goal');
    expect(r.goalName).toBe('노트북');
  });
  it('parses a contribution', () => {
    const r = parseInput('일본여행에 5만원 넣었어', ctx('ko', { goals: [{ ...goals[0], name: '일본여행' }] }));
    expect(r.kind).toBe('contribution');
    expect(r.amount).toBe(50000);
  });
});

describe('number words: "and one", French 71-99, Chinese zero', () => {
  it.each([
    ['fr', 'vingt et un euros', '21 euros'],
    ['fr', 'trente et un', '31'],
    ['fr', 'cent un', '101'],
    ['fr', 'soixante-quinze euros', '75 euros'],
    ['fr', 'soixante-douze', '72'],
    ['fr', 'quatre-vingt-quinze', '95'],
    ['fr', 'quatre-vingt-onze', '91'],
    ['fr', 'quatre-vingt-dix-sept', '97'],
    ['fr', 'soixante et onze', '71'],
    ['fr', 'un million', '1000000'],
    ['es', 'treinta y un euros', '31 euros'],
    ['es', 'ciento un euros', '101 euros'],
    ['it', 'cento e uno', '101'],
    ['it', 'dodici e cinquanta', '12.50'],
    ['it', 'mille e cinquecento', '1500'],
    ['de', 'zwei hundert ein und zwanzig', '221'],
    ['de', 'fünf und zwanzig', '25'],
    ['zh', '一百零五', '105'],
    ['zh', '一千零五', '1005'],
    ['zh', '两百零八', '208'],
    ['zh', '两百五', '250'],
  ])('%s: %s -> %s', (lang, input, expected) => {
    expect(getPack(lang).numberWords(input)).toBe(expected);
  });
});

describe('head counts and elisions', () => {
  it('"2 personas" / "2 personnes" is a head count, not the amount', () => {
    expect(parseInput('cena para 2 personas 40', ctx('es'))).toMatchObject({ amount: 40, categoryId: 'dining' });
    expect(parseInput('dîner pour 2 personnes 40', ctx('fr'))).toMatchObject({ amount: 40, categoryId: 'dining' });
  });
  it('sees the keyword behind a French elision', () => {
    expect(parseInput("j'ai payé 30 d'essence", ctx('fr')).categoryId).toBe('transport');
    expect(parseInput("40 d'électricité", ctx('fr')).categoryId).toBe('utilities');
    expect(parseInput("20 à l'épicerie", ctx('fr')).categoryId).toBe('groceries');
    expect(parseInput("lunch at trader joe's 12", ctx('en')).categoryId).toBe('groceries');
  });
});

describe('Chinese, Japanese and Korean details', () => {
  it('"花了" is the verb spent, not flowers', () => {
    expect(parseInput('花了50', ctx('zh'))).toMatchObject({ amount: 50, categoryId: 'other_expense' });
    expect(parseInput('花了两百', ctx('zh'))).toMatchObject({ amount: 200, categoryId: 'other_expense' });
    expect(parseInput('买花50', ctx('zh')).categoryId).toBe('shopping');
    expect(parseInput('一百零五块午饭', ctx('zh'))).toMatchObject({ amount: 105, categoryId: 'dining' });
  });
  it('trims saving verbs and pronouns from Chinese and Japanese goal names', () => {
    expect(parseInput('目标：年底前存5000去旅行', ctx('zh'))).toMatchObject({ kind: 'goal', amount: 5000, goalName: '旅行' });
    expect(parseInput('我想存10000买房', ctx('zh'))).toMatchObject({ kind: 'goal', amount: 10000, goalName: '买房' });
    expect(parseInput('目標：12月までに旅行のために500ドル貯める', ctx('ja'))).toMatchObject({ kind: 'goal', amount: 500, goalName: '旅行' });
  });
  it('"貯めたい" is a goal, not a past saving', () => {
    expect(parseInput('家のために10万円貯めたい', ctx('ja'))).toMatchObject({ kind: 'goal', amount: 100000, goalName: '家' });
    expect(parseInput('50万円貯めたい', ctx('ja'))).toMatchObject({ kind: 'goal', amount: 500000 });
  });
  it('keeps the meal when the day phrase names a time of day', () => {
    expect(parseInput('今日の昼ごはん1200円', ctx('ja'))).toMatchObject({ amount: 1200, categoryId: 'dining', occurredAt: TODAY });
    expect(parseInput('昨日の夜ご飯2000円', ctx('ja'))).toMatchObject({ amount: 2000, categoryId: 'dining', occurredAt: '2026-09-09' });
    expect(parseInput('어제 점심 12000원', ctx('ko'))).toMatchObject({ amount: 12000, categoryId: 'dining', occurredAt: '2026-09-09' });
    expect(parseInput('오늘 저녁 30000원', ctx('ko'))).toMatchObject({ amount: 30000, categoryId: 'dining', occurredAt: TODAY });
  });
  it('Korean 불 marks dollars only after a number', () => {
    expect(parseInput('환불 45000원', ctx('ko'))).toMatchObject({ amount: 45000, type: 'income', categoryId: 'other_income' });
    expect(parseInput('10불 냈어', ctx('ko'))).toMatchObject({ amount: 10, type: 'expense' });
  });
});
