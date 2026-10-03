/**
 * How negotiable a category is. The app records the answer and shows the split;
 * it never tells anyone what to cut. Pure, so `npm test` covers it.
 *
 * The order of TIERS is the order they are shown in, which is also priority
 * order: what keeps the lights on, what you owe, and everything else. These are
 * the three buckets of the 50/30/20 rule, which is the split most people already
 * know, so none of them needs explaining.
 *
 * These ids are stored and never change. What a person reads comes from the
 * locale tables, so `obligations` is shown as "Debts".
 */
import type { Category, MonthStats, Tier } from '@/types';

export const TIERS: Tier[] = ['needs', 'obligations', 'wants'];

/**
 * Words in a custom category name that make it a necessity. A static pattern
 * tested against user text, never built from it.
 */
export const NECESSITY_WORDS = /rent|mortgage|medic|doctor|dentist|pharm|hospital|health|therap|child|daycare|school|tuition|insur|utilit|electric|water|gas bill|grocer|debt|loan|emergenc|tax|vet\b|baby|diaper/i;

/** Tier for each default category. Anything missing goes through `defaultTierFor`. */
const DEFAULT_TIERS: Record<string, Tier> = {
  groceries: 'needs',
  rent: 'needs',
  utilities: 'needs',
  transport: 'needs',
  health: 'needs',
  // Paying yourself is treated as a need, not a leftover.
  savings: 'needs',
  debt: 'obligations',
  subscriptions: 'wants',
  // "Other" is the absence of information, not a choice. The app will not call money
  // it cannot identify negotiable, so the catch-all is protected like a necessity.
  other_expense: 'needs',
  dining: 'wants',
  entertainment: 'wants',
  shopping: 'wants',
};

/**
 * The tier a category starts on, so nobody has to set one up. A custom category
 * whose name reads like a necessity starts on `needs`; anything else a person
 * chose to create and name starts on `wants`, which they can change in one tap.
 */
export function defaultTierFor(category: Pick<Category, 'id' | 'name' | 'kind'>): Tier {
  const known = DEFAULT_TIERS[category.id];
  if (known) return known;
  if (NECESSITY_WORDS.test(category.name)) return 'needs';
  return 'wants';
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
 * This period's spending split by tier, always all three in order. Spending with
 * no category counts as `needs`, the same as "Other": the app does not know what
 * it was, so it will not claim that money is negotiable.
 */
export function tierTotals(stats: MonthStats, categories: Category[]): TierTotal[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const sums = new Map<Tier, number>(TIERS.map((t) => [t, 0]));
  for (const row of stats.byCategory) {
    const cat = row.categoryId ? byId.get(row.categoryId) : undefined;
    if (cat && cat.kind !== 'expense') continue;
    const tier = cat ? tierOf(cat) : 'needs';
    sums.set(tier, (sums.get(tier) ?? 0) + row.total);
  }
  const spent = TIERS.reduce((s, t) => s + (sums.get(t) ?? 0), 0);
  return TIERS.map((tier) => {
    const total = Math.round((sums.get(tier) ?? 0) * 100) / 100;
    return { tier, total, share: spent > 0 ? total / spent : 0 };
  });
}

