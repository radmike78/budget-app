/**
 * The voice that talks back after an entry. Pure: no React Native.
 *
 * Rules, in order, and all of them are tested:
 * - Plain says nothing. The other voices add exactly one line after a save.
 * - Lines exist in English only for now; any other app language gets nothing.
 * - Necessities are never joked about: rent, bills, groceries, health, childcare,
 *   debt and the like get no line at all, whatever the voice or attitude.
 * - Past a category plan or past the overall plan there is no line either: the
 *   plain sentence already says what happened, and a joke there is shame.
 * - Big amounts are talked to gently: at or above BIG_AMOUNT the attitude drops to nice.
 * - Categories the app cannot judge (transport, custom ones) never get spicy.
 * - A line that was said recently is not said again while others are available.
 */
import type { Attitude, TxType, Voice } from '@/types';
import { LINES_EN, type LineSet, type Situation } from './lines.en';

export type { Situation } from './lines.en';

/** Default category ids that are never material for a joke. */
export const PROTECTED_CATEGORIES = new Set(['rent', 'utilities', 'groceries', 'health', 'debt', 'savings', 'other_expense']);
/** Default category ids the voices may tease at full strength. */
export const TEASABLE_CATEGORIES = new Set(['dining', 'entertainment', 'shopping', 'subscriptions']);
/** Words in a custom category name that make it a necessity. Static pattern tested against user text, never built from it. */
const NECESSITY_WORDS = /rent|mortgage|medic|doctor|dentist|pharm|hospital|health|therap|child|daycare|school|tuition|insur|utilit|electric|water|gas bill|grocer|debt|loan|emergenc|tax|vet\b|baby|diaper/i;
/** At or above this amount the attitude is always nice. */
export const BIG_AMOUNT = 500;
/** How many recent lines are avoided when picking the next one. */
export const RECENT_WINDOW = 8;

export interface PersonaEvent {
  kind: 'transaction' | 'contribution';
  amount: number;
  type: TxType;
  categoryId: string | null;
  /** Category name as shown to the user, or null. */
  categoryName: string | null;
  /** What the user typed or said, cleaned; used as the place ("Starbucks"). */
  note: string | null;
  /** The category's effective plan this period and what is spent in it, including this entry. */
  plan: number | null;
  spent: number;
  /** The overall plan and total spending this period, including this entry. */
  overallPlan: number | null;
  overallSpent: number;
  /** For contributions. */
  goal?: { name: string; current: number; target: number } | null;
}

export interface PersonaPrefs {
  voice: Voice;
  attitude: Attitude;
  /** App language code ('en', 'es', ...). */
  language: string;
}

export interface PersonaLine {
  text: string;
  /** Identifies the template so it can be kept out of the next few picks. */
  key: string;
}

export type Tone = 'teasable' | 'neutral' | 'protected';

/** How freely a category may be talked about. Custom categories are judged by their name. */
export function toneFor(categoryId: string | null, categoryName: string | null): Tone {
  if (categoryId && PROTECTED_CATEGORIES.has(categoryId)) return 'protected';
  if (categoryName && NECESSITY_WORDS.test(categoryName)) return 'protected';
  if (categoryId && TEASABLE_CATEGORIES.has(categoryId)) return 'teasable';
  return 'neutral';
}

/** Which situation an event is in, or null when the voice must stay quiet. */
export function situationFor(e: PersonaEvent): Situation | null {
  if (e.kind === 'contribution') return e.goal ? 'contribution' : null;
  if (e.type === 'income') return 'income';
  if (toneFor(e.categoryId, e.categoryName) === 'protected') return null;
  if (e.overallPlan != null && e.overallSpent > e.overallPlan) return null;
  if (e.plan == null || e.plan <= 0) return 'spend_free';
  const remaining = e.plan - e.spent;
  if (remaining < 0) return null;
  return remaining <= e.plan * 0.25 ? 'spend_close' : 'spend_under';
}

function fill(template: string, e: PersonaEvent, money: (n: number) => string): string {
  const place = (e.note ?? '').trim() || e.categoryName || 'that';
  const remaining = e.plan != null ? Math.max(0, e.plan - e.spent) : 0;
  const pct = e.goal && e.goal.target > 0 ? Math.min(100, Math.round((e.goal.current / e.goal.target) * 100)) : 0;
  return template
    .replace(/\{amount\}/g, money(e.amount))
    .replace(/\{place\}/g, place)
    .replace(/\{category\}/g, e.categoryName ?? 'that')
    .replace(/\{left\}/g, money(remaining))
    .replace(/\{plan\}/g, money(e.plan ?? 0))
    .replace(/\{goal\}/g, e.goal?.name ?? '')
    .replace(/\{current\}/g, money(e.goal?.current ?? 0))
    .replace(/\{target\}/g, money(e.goal?.target ?? 0))
    .replace(/\{pct\}/g, String(pct));
}

/**
 * The one line to show after a save, or null for silence.
 * `random` is injectable so tests are deterministic.
 */
export function personaLine(e: PersonaEvent, prefs: PersonaPrefs, money: (n: number) => string, recent: string[] = [], random: () => number = Math.random): PersonaLine | null {
  if (prefs.voice === 'plain') return null;
  if (prefs.language !== 'en') return null;
  const situation = situationFor(e);
  if (!situation) return null;
  let attitude = prefs.attitude;
  if (e.amount >= BIG_AMOUNT) attitude = 'nice';
  if (attitude === 'spicy' && situation.startsWith('spend') && toneFor(e.categoryId, e.categoryName) !== 'teasable') attitude = 'playful';
  const set: LineSet = LINES_EN[prefs.voice];
  const pool = set[situation][attitude];
  if (!pool || pool.length === 0) return null;
  const keys = pool.map((_, i) => `${prefs.voice}:${situation}:${attitude}:${i}`);
  const fresh = keys.map((k, i) => i).filter((i) => !recent.includes(keys[i]));
  const choices = fresh.length > 0 ? fresh : keys.map((_, i) => i);
  const idx = choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
  return { text: fill(pool[idx], e, money), key: keys[idx] };
}

/** Keeps the last few line keys so the same joke does not come back too soon. */
export function remember(recent: string[], key: string): string[] {
  return [...recent.filter((k) => k !== key), key].slice(-RECENT_WINDOW);
}

/** A sample line for the settings screen: $20 at Starbucks with $43 left of a $150 dining plan. */
export function sampleLine(prefs: PersonaPrefs, money: (n: number) => string, random: () => number = Math.random): string | null {
  const e: PersonaEvent = { kind: 'transaction', amount: 20, type: 'expense', categoryId: 'dining', categoryName: 'Dining out', note: 'Starbucks', plan: 150, spent: 107, overallPlan: null, overallSpent: 0 };
  return personaLine(e, prefs, money, [], random)?.text ?? null;
}
