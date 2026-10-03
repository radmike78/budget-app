import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';
import { TIERS, defaultTierFor, tierOf, tierTotals } from '@/lib/tiers';
import { buildBackup } from '@/lib/export';
import { validateBackup } from '@/lib/validate';
import type { Category, MonthStats, Settings } from '@/types';

const NOW = '2026-09-17T00:00:00.000Z';
const SETTINGS: Settings = { currency: 'USD', theme: 'system', lastBackupAt: null, startingBalance: null, onboardingDone: true, reminderEnabled: false, reminderHour: 20, smartParseEnabled: false, appLockEnabled: false, language: 'system', answerMode: 'auto', budgetPeriod: 'month', overallLimit: null, voice: 'plain', attitude: 'playful', voiceGender: 'female', accent: 'sage' };

const stats = (byCategory: { categoryId: string | null; total: number }[]): MonthStats => ({
  month: '2026-09',
  period: { start: '2026-09-01', end: '2026-09-30' },
  income: 3000,
  expenses: byCategory.reduce((s, r) => s + r.total, 0),
  byCategory: byCategory.map((r) => ({ ...r, count: 1 })),
});

describe('default tiers', () => {
  it('places every default expense category somewhere sensible', () => {
    const tierFor = (id: string) => tierOf(DEFAULT_CATEGORIES.find((c) => c.id === id)!);
    expect(tierFor('rent')).toBe('needs');
    expect(tierFor('groceries')).toBe('needs');
    expect(tierFor('utilities')).toBe('needs');
    expect(tierFor('health')).toBe('needs');
    expect(tierFor('transport')).toBe('needs');
    // Paying yourself is a need, not a leftover.
    expect(tierFor('savings')).toBe('needs');
    expect(tierFor('debt')).toBe('obligations');
    expect(tierFor('subscriptions')).toBe('wants');
    // "Other" is unidentified money, so it is protected rather than called negotiable.
    expect(tierFor('other_expense')).toBe('needs');
    expect(tierFor('dining')).toBe('wants');
    expect(tierFor('entertainment')).toBe('wants');
    expect(tierFor('shopping')).toBe('wants');
  });

  it('reads a custom category that sounds like a necessity as one', () => {
    const custom = (name: string) => defaultTierFor({ id: 'custom-1', name, kind: 'expense' });
    expect(custom('Childcare')).toBe('needs');
    expect(custom('Car insurance')).toBe('needs');
    expect(custom('Prescriptions pharmacy')).toBe('needs');
    expect(custom('Student loan')).toBe('needs');
    // A category a person chose to create and name starts as a want; one tap moves it.
    expect(custom('Golf')).toBe('wants');
    expect(custom('Record shop')).toBe('wants');
  });

  it('uses the stored tier when there is one, and ignores a bad value', () => {
    const base = { id: 'dining', name: 'Dining out', kind: 'expense' as const };
    expect(tierOf({ ...base, tier: 'needs' })).toBe('needs');
    expect(tierOf({ ...base, tier: null })).toBe('wants');
    expect(tierOf({ ...base, tier: 'nonsense' as never })).toBe('wants');
  });
});

describe('tierTotals', () => {
  const cats = DEFAULT_CATEGORIES;

  it('always returns all three tiers in priority order', () => {
    expect(tierTotals(stats([]), cats).map((r) => r.tier)).toEqual(TIERS);
    expect(TIERS).toEqual(['needs', 'obligations', 'wants']);
  });

  it('adds spending up by tier and gives each a share of the period', () => {
    const rows = tierTotals(stats([
      { categoryId: 'rent', total: 1200 },
      { categoryId: 'groceries', total: 300 },
      { categoryId: 'debt', total: 150 },
      { categoryId: 'subscriptions', total: 50 },
      { categoryId: 'dining', total: 200 },
      { categoryId: 'shopping', total: 100 },
    ]), cats);
    const by = Object.fromEntries(rows.map((r) => [r.tier, r.total]));
    expect(by).toEqual({ needs: 1500, obligations: 150, wants: 350 });
    expect(rows.find((r) => r.tier === 'needs')!.share).toBeCloseTo(0.75);
    expect(rows.reduce((s, r) => s + r.share, 0)).toBeCloseTo(1);
  });

  it('protects spending with no category instead of calling it negotiable', () => {
    const rows = tierTotals(stats([{ categoryId: null, total: 40 }]), cats);
    expect(rows.find((r) => r.tier === 'needs')!.total).toBe(40);
    expect(rows.find((r) => r.tier === 'wants')!.total).toBe(0);
  });

  it('leaves income out of the split', () => {
    const rows = tierTotals(stats([{ categoryId: 'salary', total: 2000 }, { categoryId: 'rent', total: 1000 }]), cats);
    expect(rows.reduce((s, r) => s + r.total, 0)).toBe(1000);
  });

  it('has no share to give when nothing was spent', () => {
    expect(tierTotals(stats([]), cats).every((r) => r.total === 0 && r.share === 0)).toBe(true);
  });

  it('follows a category that was moved to another tier', () => {
    const moved: Category[] = cats.map((c) => (c.id === 'dining' ? { ...c, tier: 'needs' } : c));
    const rows = tierTotals(stats([{ categoryId: 'dining', total: 90 }]), moved);
    expect(rows.find((r) => r.tier === 'needs')!.total).toBe(90);
    expect(rows.find((r) => r.tier === 'wants')!.total).toBe(0);
  });
});

describe('a backup keeps the tier', () => {
  it('survives a round trip, and a bad value falls back to the default', () => {
    const cats: Category[] = DEFAULT_CATEGORIES.map((c) => (c.id === 'dining' ? { ...c, tier: 'needs' } : c));
    const payload = buildBackup({ settings: SETTINGS, categories: cats, transactions: [], recurringRules: [], goals: [], keywords: [] }, NOW);
    const restored = validateBackup(JSON.parse(JSON.stringify(payload)), NOW);
    expect(restored.categories.find((c) => c.id === 'dining')!.tier).toBe('needs');

    const bad = JSON.parse(JSON.stringify(payload));
    bad.categories.find((c: Category) => c.id === 'dining').tier = 'luxury';
    const after = validateBackup(bad, NOW).categories.find((c) => c.id === 'dining')!;
    expect(after.tier).toBeNull();
    expect(tierOf(after)).toBe('wants');
  });
});
