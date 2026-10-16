/**
 * What an unspent plan does when a period ends. Pure: no React Native.
 *
 * - reset: every period starts from the limit again (the default).
 * - carry: whatever was not spent is added to the next period's plan. Spending
 *   past the plan never takes from the next one; this is a plan, not a debt.
 * - ask:   the app asks once per period whether to carry the leftover over.
 */
import type { Category, Period } from '@/types';

export interface PastPeriod {
  period: Period;
  /** Spent in this category during that period. */
  spent: number;
}

export interface CarryState {
  /** Added to the category's limit for the current period. */
  amount: number;
  /** In "ask" mode: the leftover waiting for an answer, or null when there is nothing to ask. */
  pendingLeftover: number | null;
}

const NONE: CarryState = { amount: 0, pendingLeftover: null };

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * @param past      earlier periods, oldest first, ending with the one just before `current`.
 * @param decisions answers already given in "ask" mode, keyed by the period start they apply to.
 */
export function carryInto(cat: Pick<Category, 'monthlyLimit' | 'rollover' | 'rolloverSince'>, current: Period, past: PastPeriod[], decisions: Map<string, number>): CarryState {
  const limit = cat.monthlyLimit ?? 0;
  const mode = cat.rollover ?? 'reset';
  if (limit <= 0 || mode === 'reset') return NONE;
  const since = cat.rolloverSince;
  const usable = past.filter((p) => p.period.start < current.start && (!since || p.period.start >= since));

  if (mode === 'carry') {
    // A plan changed part-way restarts carrying from that period, starting with what had carried until then
    // (saved as the decision for `since`), so a new plan never rewrites what earlier periods left over.
    let carry = since ? Math.max(0, decisions.get(since) ?? 0) : 0;
    for (const p of usable) carry = Math.max(0, limit + carry - p.spent);
    return carry > 0 ? { amount: round2(carry), pendingLeftover: null } : NONE;
  }

  if (usable.length === 0) return NONE;

  const decided = decisions.get(current.start);
  if (decided != null) return { amount: round2(Math.max(0, decided)), pendingLeftover: null };
  const prev = usable[usable.length - 1];
  const prevCarry = decisions.get(prev.period.start) ?? 0;
  const leftover = round2(Math.max(0, limit + prevCarry - prev.spent));
  return { amount: 0, pendingLeftover: leftover > 0 ? leftover : null };
}

/** The plan a category actually has this period: its limit plus anything carried in. */
export function effectivePlan(cat: Pick<Category, 'monthlyLimit'>, carry: CarryState | undefined): number | null {
  if (cat.monthlyLimit == null || cat.monthlyLimit <= 0) return null;
  return round2(cat.monthlyLimit + (carry?.amount ?? 0));
}

/** Buckets expense rows into the given periods (a row outside every period is ignored). */
export function bucketByPeriod(rows: { categoryId: string | null; occurredAt: string; total: number }[], periods: Period[]): Map<string, PastPeriod[]> {
  const out = new Map<string, PastPeriod[]>();
  const ids = new Set(rows.map((r) => r.categoryId).filter((c): c is string => !!c));
  for (const id of ids) out.set(id, periods.map((period) => ({ period, spent: 0 })));
  for (const r of rows) {
    if (!r.categoryId) continue;
    const list = out.get(r.categoryId)!;
    const hit = list.find((p) => r.occurredAt >= p.period.start && r.occurredAt <= p.period.end);
    if (hit) hit.spent = round2(hit.spent + r.total);
  }
  return out;
}
