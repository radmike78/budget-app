import { BIG_AMOUNT, RECENT_WINDOW, flavorFor, personaLine, remember, sampleLine, situationFor, toneFor, wherePhrase, type PersonaEvent, type PersonaPrefs } from '@/lib/personas';
import { FLAVORS_EN, LINES_EN } from '@/lib/personas/lines.en';
import { contributionEvent, transactionEvent } from '@/lib/personas/context';
import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';
import type { Goal, MonthStats, Settings } from '@/types';

const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
const first = () => 0;
const prefs = (over: Partial<PersonaPrefs> = {}): PersonaPrefs => ({ voice: 'roaster', attitude: 'spicy', language: 'en', ...over });
const spend = (over: Partial<PersonaEvent> = {}): PersonaEvent => ({ kind: 'transaction', amount: 20, type: 'expense', categoryId: 'dining', categoryName: 'Dining out', note: 'Starbucks', plan: 150, spent: 107, overallPlan: null, overallSpent: 0, ...over });

describe('when the voice stays quiet', () => {
  it('plain says nothing, whatever the situation', () => {
    expect(personaLine(spend(), prefs({ voice: 'plain' }), money)).toBeNull();
  });
  it('speaks English only for now', () => {
    for (const language of ['es', 'fr', 'de', 'it', 'ja', 'ko', 'zh']) expect(personaLine(spend(), prefs({ language }), money)).toBeNull();
    expect(personaLine(spend(), prefs({ language: 'en' }), money)).not.toBeNull();
  });
  it('never jokes about necessities, by id or by name', () => {
    for (const id of ['rent', 'utilities', 'groceries', 'health', 'debt', 'savings', 'other_expense']) {
      expect(toneFor(id, null)).toBe('protected');
      expect(personaLine(spend({ categoryId: id, categoryName: 'X', plan: null }), prefs(), money)).toBeNull();
    }
    for (const name of ['Medical', 'Pharmacy', 'Daycare', 'Rent', 'Car insurance', 'Student loan', 'Electric bill', 'Taxes', 'Emergency', 'Vet']) {
      expect(toneFor('custom_1', name)).toBe('protected');
      expect(personaLine(spend({ categoryId: 'custom_1', categoryName: name, plan: null }), prefs(), money)).toBeNull();
    }
  });
  it('says nothing past a category plan or past the overall plan', () => {
    expect(situationFor(spend({ plan: 150, spent: 151 }))).toBeNull();
    expect(personaLine(spend({ plan: 150, spent: 160 }), prefs(), money)).toBeNull();
    expect(personaLine(spend({ overallPlan: 1000, overallSpent: 1000.01 }), prefs(), money)).toBeNull();
    expect(personaLine(spend({ overallPlan: 1000, overallSpent: 1000 }), prefs(), money)).not.toBeNull();
  });
  it('a contribution without a goal gets nothing', () => {
    expect(personaLine({ ...spend(), kind: 'contribution', goal: null }, prefs(), money)).toBeNull();
  });
});

describe('situations', () => {
  it('tells free, under, close apart', () => {
    expect(situationFor(spend({ plan: null }))).toBe('spend_free');
    expect(situationFor(spend({ plan: 150, spent: 60 }))).toBe('spend_under');
    expect(situationFor(spend({ plan: 150, spent: 112.5 }))).toBe('spend_close');
    expect(situationFor(spend({ plan: 150, spent: 150 }))).toBe('spend_close');
    expect(situationFor(spend({ type: 'income', categoryId: 'salary', categoryName: 'Salary' }))).toBe('income');
    expect(situationFor({ ...spend(), kind: 'contribution', goal: { name: 'Trip', current: 650, target: 1000 } })).toBe('contribution');
  });
  it('custom and transport categories are teased gently and never spicy', () => {
    expect(toneFor('transport', 'Transportation')).toBe('neutral');
    expect(toneFor('custom_2', 'Pets')).toBe('neutral');
    const line = personaLine(spend({ categoryId: 'custom_2', categoryName: 'Pets', note: 'Chewy' }), prefs({ attitude: 'spicy' }), money, [], first);
    expect(line?.key).toMatch(/:playful:/);
  });
  it('big amounts are always talked to nicely', () => {
    const line = personaLine(spend({ amount: BIG_AMOUNT, note: 'Apple Store', categoryId: 'shopping', categoryName: 'Shopping', plan: null }), prefs({ attitude: 'spicy' }), money, [], first);
    expect(line?.key).toMatch(/:nice:/);
  });
});

describe('the lines themselves', () => {
  const situations = ['income', 'contribution', 'spend_free', 'spend_under', 'spend_close'] as const;
  it('every voice has at least eight lines per situation and attitude, short enough for a phone', () => {
    for (const set of Object.values(LINES_EN)) {
      for (const s of situations) {
        for (const a of ['nice', 'playful', 'spicy'] as const) {
          const pool = set[s][a];
          expect(pool.length).toBeGreaterThanOrEqual(8);
          expect(new Set(pool).size).toBe(pool.length);
          for (const line of pool) expect(line.length).toBeLessThanOrEqual(100);
        }
      }
    }
    for (const set of Object.values(FLAVORS_EN)) {
      for (const pools of Object.values(set)) {
        for (const a of ['nice', 'playful', 'spicy'] as const) {
          expect(pools[a].length).toBeGreaterThanOrEqual(3);
          for (const line of pools[a]) {
            expect(line.length).toBeLessThanOrEqual(100);
            expect(line).not.toMatch(/\{(left|plan|goal|current|target|pct)\}/);
          }
        }
      }
    }
  });
  it('knows what was bought', () => {
    expect(flavorFor({ type: 'expense', note: 'Starbucks', categoryId: 'dining' })).toBe('coffee');
    expect(flavorFor({ type: 'expense', note: 'latte at Peets', categoryId: null })).toBe('coffee');
    expect(flavorFor({ type: 'expense', note: 'DoorDash', categoryId: 'dining' })).toBe('delivery');
    expect(flavorFor({ type: 'expense', note: 'Korean BBQ', categoryId: 'dining' })).toBe('restaurant');
    expect(flavorFor({ type: 'expense', note: 'Netflix', categoryId: 'subscriptions' })).toBe('subscriptions');
    expect(flavorFor({ type: 'expense', note: 'Target', categoryId: 'shopping' })).toBe('shopping');
    expect(flavorFor({ type: 'expense', note: 'Gas', categoryId: 'transport' })).toBeNull();
    expect(flavorFor({ type: 'income', note: 'coffee shop wages', categoryId: 'salary' })).toBeNull();
  });
  it('never mentions a barista or a latte unless it was coffee', () => {
    const bbq = spend({ note: 'Korean BBQ', amount: 58 });
    for (const voice of ['friend', 'coach', 'roaster'] as const) {
      for (const attitude of ['nice', 'playful', 'spicy'] as const) {
        for (let i = 0; i < 40; i += 1) {
          const line = personaLine(bbq, prefs({ voice, attitude }), money, [], () => i / 40)!;
          expect(line.text).not.toMatch(/barista|latte|cup\b/i);
        }
      }
    }
    const coffeeKeys = new Set<string>();
    for (let i = 0; i < 40; i += 1) coffeeKeys.add(personaLine(spend({ note: 'Starbucks' }), prefs({ voice: 'roaster', attitude: 'playful' }), money, [], () => i / 40)!.key);
    expect([...coffeeKeys].some((k) => k.includes(':coffee:'))).toBe(true);
  });
  it('a flavoured line still says what is left when there is a plan', () => {
    const recent = Object.keys(LINES_EN.roaster.spend_under.playful).map((i) => `roaster:spend_under:playful:${i}`);
    const line = personaLine(spend({ note: 'Starbucks', plan: 150, spent: 107 }), prefs({ voice: 'roaster', attitude: 'playful' }), money, recent, first)!;
    expect(line.key).toBe('roaster:coffee:playful:0');
    expect(line.text).toBe('$20 at Starbucks? Did you buy the barista a drink too? $43 left in Dining out.');
    const free = personaLine(spend({ note: 'Starbucks', plan: null }), prefs({ voice: 'roaster', attitude: 'playful' }), money, recent.map((k) => k.replace('spend_under', 'spend_free')), first)!;
    expect(free.text).toBe('$20 at Starbucks? Did you buy the barista a drink too?');
  });
  it('fills every placeholder', () => {
    const events: PersonaEvent[] = [
      spend(), spend({ plan: null }), spend({ plan: 150, spent: 140 }), spend({ type: 'income', categoryId: 'salary', categoryName: 'Salary', note: null }),
      { ...spend(), kind: 'contribution', note: null, goal: { name: 'Vegas', current: 650, target: 1000 } },
    ];
    for (const voice of ['friend', 'coach', 'roaster'] as const) {
      for (const attitude of ['nice', 'playful', 'spicy'] as const) {
        for (const e of events) {
          for (let i = 0; i < 6; i += 1) {
            const line = personaLine(e, prefs({ voice, attitude }), money, [], () => i / 6);
            expect(line).not.toBeNull();
            expect(line!.text).not.toMatch(/[{}]/);
            expect(line!.text).not.toMatch(/undefined|NaN/);
          }
        }
      }
    }
  });
  it('uses the place the user named, the amount and what is left', () => {
    const line = personaLine(spend({ plan: 150, spent: 107 }), prefs({ voice: 'coach', attitude: 'nice' }), money, [], first);
    expect(line!.text).toBe('Logged. You are still $43 under your Dining out plan.');
    const goal = personaLine({ ...spend(), kind: 'contribution', amount: 50, goal: { name: 'Vegas', current: 650, target: 1000 } }, prefs({ voice: 'coach', attitude: 'nice' }), money, [], first);
    expect(goal!.text).toBe('$50 to Vegas. $650 of $1000, 65% there.');
  });
  it('fits the preposition to the note: a place, a thing, or the words the user used', () => {
    expect(wherePhrase({ type: 'expense', note: 'Starbucks', categoryId: 'dining', categoryName: 'Dining out' })).toBe('at Starbucks');
    expect(wherePhrase({ type: 'expense', note: 'Laptop', categoryId: 'shopping', categoryName: 'Shopping' })).toBe('on Laptop');
    expect(wherePhrase({ type: 'expense', note: 'Dinner at the thai place', categoryId: 'dining', categoryName: 'Dining out' })).toBe('at the thai place');
    expect(wherePhrase({ type: 'expense', note: 'Gift for mom', categoryId: 'shopping', categoryName: 'Shopping' })).toBe('for mom');
    expect(wherePhrase({ type: 'expense', note: null, categoryId: 'shopping', categoryName: 'Shopping' })).toBe('on Shopping');
    const line = personaLine(spend({ note: 'Dinner at the thai place', plan: null }), prefs({ voice: 'friend', attitude: 'nice' }), money, [], first)!;
    expect(line.text).not.toContain('at Dinner at');
  });
  it('does not repeat a recent line while others are available', () => {
    let recent: string[] = [];
    const seen = new Set<string>();
    const e = spend({ note: 'Lunch' });
    const total = LINES_EN.friend.spend_under.playful.length + FLAVORS_EN.friend.restaurant.playful.length;
    for (let i = 0; i < total; i += 1) {
      const line = personaLine(e, prefs({ voice: 'friend', attitude: 'playful' }), money, recent, first)!;
      expect(seen.has(line.key)).toBe(false);
      seen.add(line.key);
      recent = remember(recent, line.key);
    }
    expect(seen.size).toBe(total);
    // Every line used: the pool is reused rather than going silent, and the memory stays bounded.
    expect(personaLine(e, prefs({ voice: 'friend', attitude: 'playful' }), money, recent, first)).not.toBeNull();
    expect(recent.length).toBeLessThanOrEqual(RECENT_WINDOW);
  });
  it('the settings sample is a real line', () => {
    expect(sampleLine(prefs({ voice: 'roaster', attitude: 'playful' }), money, first)).toBe('$20 at Starbucks. Look at you being almost reasonable. $43 left.');
    expect(sampleLine(prefs({ voice: 'plain' }), money)).toBeNull();
  });
});

describe('events from the store', () => {
  const settings = { overallLimit: 1200 } as Settings;
  const stats: MonthStats = { month: '2026-09', period: { start: '2026-09-11', end: '2026-09-24' }, income: 2000, expenses: 300, byCategory: [{ categoryId: 'dining', total: 107, count: 3 }] };
  const dining = { ...DEFAULT_CATEGORIES.find((c) => c.id === 'dining')!, monthlyLimit: 150 };
  it('reads the effective plan and spending for the period', () => {
    const e = transactionEvent({ categories: [dining], stats, carry: { dining: { amount: 55, pendingLeftover: null } }, settings }, { amount: 20, type: 'expense', categoryId: 'dining', note: 'Starbucks', occurredAt: '2026-09-16' }, (c) => c.name);
    expect(e).toMatchObject({ plan: 205, spent: 107, overallPlan: 1200, overallSpent: 300, categoryName: 'Dining out', note: 'Starbucks' });
  });
  it('an entry outside the shown period is treated as free spending', () => {
    const e = transactionEvent({ categories: [dining], stats, carry: {}, settings }, { amount: 20, type: 'expense', categoryId: 'dining', note: null, occurredAt: '2026-08-01' }, (c) => c.name);
    expect(e.plan).toBeNull();
    expect(e.overallPlan).toBeNull();
  });
  it('a contribution carries the goal after the add', () => {
    const goal: Goal = { id: 'g', name: 'Vegas', kind: 'saving', targetAmount: 1000, currentAmount: 650, targetDate: null, createdAt: '2026-01-01T00:00:00Z', completed: false };
    expect(contributionEvent(50, goal).goal).toEqual({ name: 'Vegas', current: 650, target: 1000 });
  });
});
