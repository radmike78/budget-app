/**
 * How negotiable a category is. The app records the answer and shows the split;
 * it never tells anyone what to cut. Pure, so `npm test` covers it.
 *
 * The order of TIERS is the order they are shown in, which is also priority
 * order: what keeps the lights on, what you owe, what makes life easier, the rest.
 */
import type { Category, MonthStats, Tier } from '@/types';

export const TIERS: Tier[] = ['needs', 'obligations', 'comforts', 'wants'];

/** The two tiers a person can realistically move money out of. */
export const FLEXIBLE_TIERS: Tier[] = ['comforts', 'wants'];

/**
 * Words in a custom category name that make it a necessity. A static pattern
 * tested against user text, never built from it.
 */
export const NECESSITY_WORDS = /rent|mortgage|medic|doctor|dentist|pharm|hospital|health|therap|child|daycare|school|tuition|insur|utilit|electric|water|gas bill|grocer|debt|loan|emergenc|tax|vet\b|baby|diaper/i;

/** Tier for each default category. Anything missing falls back to `comforts`, the neutral middle. */
const DEFAULT_TIERS: Record<string, Tier> = {
  groceries: 'needs',
  rent: 'needs',
  utilities: 'needs',
  transport: 'needs',
  health: 'needs',
  // Paying yourself is treated as a need, not a leftover.
  savings: 'needs',
  debt: 'obligations',
  subscriptions: 'comforts',
  other_expense: 'comforts',
  dining: 'wants',
  entertainment: 'wants',
  shopping: 'wants',
};

/**
 * The tier a category starts on, so nobody has to set one up. A custom category
 * whose name reads like a necessity starts on `needs`; everything else starts in
 * the middle, where it accuses no one.
 */
export function defaultTierFor(category: Pick<Category, 'id' | 'name' | 'kind'>): Tier {
  const known = DEFAULT_TIERS[category.id];
  if (known) return known;
  if (NECESSITY_WORDS.test(category.name)) return 'needs';
  return 'comforts';
}

/** The tier in use, falling back to the default when a category has never been set. */
export function tierOf(category: Pick<Category, 'id' | 'name' | 'kind' | 'tier'>): Tier {
  return category.tier && TIERS.includes(category.tier) ? category.tier : defaultTierFor(category);
}

export interface TierTotal {
  tier: Tier;
  total: number;
  /** Share of this period's spending, 0 to 1. Zero when nothing was spent. */
  share: number;
}

/**
 * This period's spending split by tier, always all four in order. Spending with
 * no category counts as `comforts`, the same as "Other": the app does not know
 * what it was, so it neither protects nor blames it.
 */
export function tierTotals(stats: MonthStats, categories: Category[]): TierTotal[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const sums = new Map<Tier, number>(TIERS.map((t) => [t, 0]));
  for (const row of stats.byCategory) {
    const cat = row.categoryId ? byId.get(row.categoryId) : undefined;
    if (cat && cat.kind !== 'expense') continue;
    const tier = cat ? tierOf(cat) : 'comforts';
    sums.set(tier, (sums.get(tier) ?? 0) + row.total);
  }
  const spent = TIERS.reduce((s, t) => s + (sums.get(t) ?? 0), 0);
  return TIERS.map((tier) => {
    const total = Math.round((sums.get(tier) ?? 0) * 100) / 100;
    return { tier, total, share: spent > 0 ? total / spent : 0 };
  });
}

/** What was spent on comforts and wants together: the honest answer to "where could I cut?". */
export function flexibleTotal(totals: TierTotal[]): number {
  return Math.round(totals.filter((t) => FLEXIBLE_TIERS.includes(t.tier)).reduce((s, t) => s + t.total, 0) * 100) / 100;
}
