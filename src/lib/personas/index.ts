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
import { NECESSITY_WORDS } from '@/lib/tiers';
import { FLAVORS_EN, GREETINGS_EN, LEFT_SUFFIXES_EN, LINES_EN, type Flavor, type LineSet, type Situation } from './lines.en';

export type { Flavor, Situation } from './lines.en';

/** Default category ids that are never material for a joke. */
export const PROTECTED_CATEGORIES = new Set(['rent', 'utilities', 'groceries', 'health', 'debt', 'savings', 'other_expense']);
/** Default category ids the voices may tease at full strength. */
export const TEASABLE_CATEGORIES = new Set(['dining', 'entertainment', 'shopping', 'subscriptions']);
/** At or above this amount the attitude is always nice. */
export const BIG_AMOUNT = 500;
/** How many recent lines are avoided when picking the next one (kept across launches). */
export const RECENT_WINDOW = 24;

/** What was bought, read from the note; static patterns tested against user text, never built from it. */
const COFFEE_RE = /\b(starbucks|coffee|latte|espresso|cappuccino|americano|caf[eé]|dunkin|peet'?s|tim hortons|costa|caffe nero|blue bottle|philz|brew|mocha|matcha|chai)\b/i;
const DELIVERY_RE = /\b(doordash|uber ?eats|grubhub|deliveroo|postmates|just ?eat|takeout|take-?away|delivery|delivered|seamless|instacart)\b/i;
const FLAVOR_BY_CATEGORY: Record<string, Flavor> = { dining: 'restaurant', shopping: 'shopping', subscriptions: 'subscriptions', entertainment: 'entertainment' };

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

/** The kind of purchase, so the line can fit it; null when there is nothing specific to say. */
export function flavorFor(e: Pick<PersonaEvent, 'type' | 'note' | 'categoryId'>): Flavor | null {
  if (e.type !== 'expense') return null;
  const note = e.note ?? '';
  if (COFFEE_RE.test(note)) return 'coffee';
  if (DELIVERY_RE.test(note)) return 'delivery';
  return e.categoryId ? FLAVOR_BY_CATEGORY[e.categoryId] ?? null : null;
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

const PLACE_FLAVORS = new Set<Flavor>(['coffee', 'restaurant', 'delivery']);
const WHERE_RE = /\s(at|on|for|from)\s+(\S.*)$/i;

/**
 * "at {place}" in a template becomes a phrase that fits the note: "dinner at the thai
 * place" keeps its own preposition, a café is "at Starbucks", a thing is "on Laptop".
 */
export function wherePhrase(e: Pick<PersonaEvent, 'type' | 'note' | 'categoryId' | 'categoryName'>): string {
  const note = (e.note ?? '').trim();
  const m = note.match(WHERE_RE);
  if (m) return `${m[1].toLowerCase()} ${m[2]}`;
  const subject = note || e.categoryName || 'that';
  const flavor = flavorFor(e);
  return `${flavor && PLACE_FLAVORS.has(flavor) ? 'at' : 'on'} ${subject}`;
}

function fill(template: string, e: PersonaEvent, money: (n: number) => string): string {
  const place = (e.note ?? '').trim() || e.categoryName || 'that';
  const remaining = e.plan != null ? Math.max(0, e.plan - e.spent) : 0;
  const pct = e.goal && e.goal.target > 0 ? Math.min(100, Math.round((e.goal.current / e.goal.target) * 100)) : 0;
  return template
    .replace(/\{amount\}/g, money(e.amount))
    .replace(/at \{place\}/g, wherePhrase(e))
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
  const pool: { template: string; key: string }[] = set[situation][attitude].map((template, i) => ({ template, key: `${prefs.voice}:${situation}:${attitude}:${i}` }));
  // Lines that fit what was bought join the pool; with a plan, they get the useful number appended.
  const flavor = situation.startsWith('spend') ? flavorFor(e) : null;
  if (flavor) {
    const suffix = situation === 'spend_free' ? '' : LEFT_SUFFIXES_EN[Math.min(LEFT_SUFFIXES_EN.length - 1, Math.floor(random() * LEFT_SUFFIXES_EN.length))];
    for (const [i, template] of FLAVORS_EN[prefs.voice][flavor][attitude].entries()) pool.push({ template: template + suffix, key: `${prefs.voice}:${flavor}:${attitude}:${i}` });
  }
  if (pool.length === 0) return null;
  const fresh = pool.filter((p) => !recent.includes(p.key));
  const choices = fresh.length > 0 ? fresh : pool;
  const pick = choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
  return { text: fill(pick.template, e, money), key: pick.key };
}

/** The line a voice says when it is chosen. English only, like everything else here. */
export function greeting(voice: Voice, language: string, random: () => number = Math.random): string | null {
  if (language !== 'en') return null;
  const pool = GREETINGS_EN[voice];
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))] ?? null;
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
