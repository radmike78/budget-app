/**
 * Builds a PersonaEvent from what the store knows after a save. Pure.
 */
import type { Category, Goal, MonthStats, Settings } from '@/types';
import type { CarryState } from '@/lib/rollover';
import { effectivePlan } from '@/lib/rollover';
import type { PersonaEvent } from './index';

export interface StateSlice {
  categories: Category[];
  stats: MonthStats | null;
  carry: Record<string, CarryState>;
  settings: Settings | null;
}

export interface SavedEntry {
  amount: number;
  type: 'income' | 'expense';
  categoryId: string | null;
  note: string | null;
  occurredAt: string;
}

/** After a transaction was saved and the store refreshed. `nameOf` gives the category's display name. */
export function transactionEvent(state: StateSlice, saved: SavedEntry, nameOf: (c: Category) => string): PersonaEvent {
  const cat = saved.categoryId ? state.categories.find((c) => c.id === saved.categoryId) ?? null : null;
  const stats = state.stats;
  const inPeriod = !!stats && saved.occurredAt >= stats.period.start && saved.occurredAt <= stats.period.end;
  const spentInCategory = inPeriod && cat ? stats.byCategory.find((b) => b.categoryId === cat.id)?.total ?? 0 : 0;
  const plan = cat && inPeriod ? effectivePlan(cat, state.carry[cat.id]) : null;
  const overallPlan = state.settings?.overallLimit ?? null;
  return {
    kind: 'transaction',
    amount: saved.amount,
    type: saved.type,
    categoryId: cat?.id ?? null,
    categoryName: cat ? nameOf(cat) : null,
    note: saved.note,
    plan,
    spent: spentInCategory,
    overallPlan: inPeriod ? overallPlan : null,
    overallSpent: inPeriod && stats ? stats.expenses : 0,
  };
}

/** After money was added to a goal (the goal already carries the new amount). */
export function contributionEvent(amount: number, goal: Goal): PersonaEvent {
  return {
    kind: 'contribution', amount, type: 'expense', categoryId: null, categoryName: null, note: null,
    plan: null, spent: 0, overallPlan: null, overallSpent: 0,
    goal: { name: goal.name, current: goal.currentAmount, target: goal.targetAmount },
  };
}
