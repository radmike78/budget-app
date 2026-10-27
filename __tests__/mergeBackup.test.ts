/**
 * A backup added to what is on the phone: only what is new comes in, the phone's own rows always win, a
 * category with the same name is the same category, and an entry already here (by id or fingerprint) is
 * never doubled.
 */
import { mergeBackup, type MergeSource } from '@/lib/mergeBackup';
import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';
import type { Category, Transaction } from '@/types';

const tx = (over: Partial<Transaction>): Transaction => ({ id: 't', amount: 10, type: 'expense', categoryId: 'groceries', note: null, rawInput: null, occurredAt: '2026-10-01', createdAt: '2026-10-01T10:00:00.000Z', isRecurringInstance: false, recurringRuleId: null, fingerprint: null, importId: null, goalId: null, ...over });
const cat = (over: Partial<Category>): Category => ({ id: 'c', name: 'Dog', icon: null, kind: 'expense', monthlyLimit: null, isDefault: false, archived: false, sortOrder: 50, ...over });
const empty = (): MergeSource => ({ categories: [...DEFAULT_CATEGORIES], transactions: [], recurringRules: [], goals: [], keywords: [], reminders: [], debts: [], imports: [], carryovers: [] });

describe('mergeBackup', () => {
  it('adds only the entries that are not here, by id and by fingerprint', () => {
    const here = { ...empty(), transactions: [tx({ id: 'a' }), tx({ id: 'b', fingerprint: 'fp-b' })] };
    const incoming = { ...empty(), transactions: [tx({ id: 'a', amount: 999 }), tx({ id: 'b2', fingerprint: 'fp-b' }), tx({ id: 'c', amount: 3 })] };
    const plan = mergeBackup(here, incoming);
    expect(plan.transactions.map((t) => t.id)).toEqual(['c']);
    expect(plan.skippedTransactions).toBe(2);
  });
  it('treats a category with the same name and kind as the same one, and points entries at it', () => {
    const here = { ...empty(), categories: [...DEFAULT_CATEGORIES, cat({ id: 'dog-here', name: 'Dog' })] };
    const incoming = { ...empty(), categories: [...DEFAULT_CATEGORIES, cat({ id: 'dog-there', name: 'dog ' }), cat({ id: 'bike', name: 'Bike', sortOrder: 3 })], transactions: [tx({ id: 'x', categoryId: 'dog-there' }), tx({ id: 'y', categoryId: 'bike' })], keywords: [{ word: 'kibble', categoryId: 'dog-there' }], carryovers: [{ categoryId: 'dog-there', period: '2026-09-01', amount: 5 }] };
    const plan = mergeBackup(here, incoming);
    expect(plan.categoryMap).toEqual({ 'dog-there': 'dog-here' });
    expect(plan.categories.map((c) => c.id)).toEqual(['bike']);
    expect(plan.categories[0].sortOrder).toBeGreaterThan(Math.max(...here.categories.map((c) => c.sortOrder)));
    expect(plan.transactions.map((t) => t.categoryId)).toEqual(['dog-here', 'bike']);
    expect(plan.keywords).toEqual([{ word: 'kibble', categoryId: 'dog-here' }]);
    expect(plan.carryovers).toEqual([{ categoryId: 'dog-here', period: '2026-09-01', amount: 5 }]);
  });
  it('drops links to rules, imports and goals that are nowhere, and keeps the ones that come in', () => {
    const rule = { id: 'r1', amount: 1000, type: 'expense' as const, categoryId: 'rent', frequency: 'monthly' as const, nextOccurrence: '2026-11-01', anchorDay: 1, note: null, active: true };
    const incoming = { ...empty(), recurringRules: [rule], transactions: [tx({ id: 'p', recurringRuleId: 'r1', isRecurringInstance: true }), tx({ id: 'q', recurringRuleId: 'gone', isRecurringInstance: true }), tx({ id: 's', importId: 'imp-gone' }), tx({ id: 'u', goalId: 'goal-gone' })] };
    const plan = mergeBackup(empty(), incoming);
    expect(plan.recurringRules).toHaveLength(1);
    const byId = Object.fromEntries(plan.transactions.map((t) => [t.id, t]));
    expect(byId.p).toMatchObject({ recurringRuleId: 'r1', isRecurringInstance: true });
    expect(byId.q).toMatchObject({ recurringRuleId: null, isRecurringInstance: false });
    expect(byId.s.importId).toBeNull();
    expect(byId.u.goalId).toBeNull();
  });
  it('leaves goals, reminders, debts and words that are already here alone, and never carries a notification id', () => {
    const goal = { id: 'g', name: 'Trip', kind: 'saving' as const, targetAmount: 500, currentAmount: 100, targetDate: null, createdAt: '2026-09-01T00:00:00.000Z', completed: false };
    const reminder = { id: 'rem', text: 'Rent', date: '2026-11-01', time: '09:00', repeat: 'monthly' as const, notificationId: 'phone-b', createdAt: '2026-09-01T00:00:00.000Z' };
    const here = { ...empty(), goals: [goal], keywords: [{ word: 'kibble', categoryId: 'groceries' }] };
    const incoming = { ...empty(), goals: [{ ...goal, currentAmount: 400 }, { ...goal, id: 'g2', name: 'Car' }], reminders: [reminder], keywords: [{ word: 'kibble', categoryId: 'dining' }, { word: 'lead', categoryId: 'shopping' }] };
    const plan = mergeBackup(here, incoming);
    expect(plan.goals.map((g) => g.id)).toEqual(['g2']);
    expect(plan.reminders[0].notificationId).toBeNull();
    expect(plan.keywords).toEqual([{ word: 'lead', categoryId: 'shopping' }]);
  });
  it('a backup of this very phone adds nothing', () => {
    const here = { ...empty(), transactions: [tx({ id: 'a' }), tx({ id: 'b' })], carryovers: [{ categoryId: 'groceries', period: '2026-09-01', amount: 5 }] };
    const plan = mergeBackup(here, { ...here });
    expect(plan.transactions).toEqual([]);
    expect(plan.categories).toEqual([]);
    expect(plan.carryovers).toEqual([]);
    expect(plan.skippedTransactions).toBe(2);
  });
});
