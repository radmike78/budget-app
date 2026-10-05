/**
 * Spoken questions about spending: "how much have I spent this week on Starbucks?",
 * "¿cuánto he gastado este mes en restaurantes?", "今月スターバックスでいくら使った？".
 * Pure functions, no React Native imports. Nothing here reads the database: the
 * parser only says what is being asked, and src/lib/questions.ts works out the answer.
 */
import type { Category } from '@/types';

/**
 * `budget` is the current budget period: payday to payday in pay mode, else the month.
 * `weekend` is the most recent Saturday and Sunday; `recentDays` is the last `days` days up to today.
 */
export type QuestionPeriod = 'today' | 'yesterday' | 'week' | 'lastWeek' | 'month' | 'lastMonth' | 'year' | 'lastYear' | 'all' | 'budget' | 'weekend' | 'recentDays';

export interface QuestionPack {
  /** Phrases that make the sentence a question about money out. Removed from the text. */
  lead: RegExp;
  /** Phrases that make it a question about money in. */
  incomeLead: RegExp;
  /** "the last 7 days": group 1 (or the first group that matched) is the number of days. Tried before `periods`. */
  recentDays?: RegExp;
  /** Period phrases, tried in order; the first match wins and is removed. */
  periods: { re: RegExp; period: QuestionPeriod }[];
  /** Leftover words dropped from the start and end of what remains ("on", "at", particles). */
  strip: RegExp[];
  /** Phrases that ask what is left ("what's my remaining budget", "how much do I have left"). Tried before `lead`. */
  remainingLead: RegExp;
  /** Words removed from the target of a "what's left" question ("budget", "plan", "left"). Global. */
  remainingWords: RegExp;
  /**
   * Looser spending phrasings ("coffee total this month", "spending on gas", a bare "how much coffee")
   * that are a question only when the sentence has no amount in it; "lunch 12 total" stays an entry.
   */
  weakLead?: RegExp;
  /** Everyday words that cover more than one category ("food" is groceries and eating out). The whole target must match. */
  groups: { words: string[]; ids: string[] }[];
}

export interface ParsedQuestion {
  type: 'expense' | 'income';
  /** `spent` sums entries; `left` asks what remains of this period's plan or income. */
  ask: 'spent' | 'left';
  period: QuestionPeriod;
  /** True when no period was said; the answer then uses the current budget period. */
  periodDefaulted: boolean;
  /** For `recentDays`: how many days, today included. */
  days?: number;
  /** What the user asked about, in their own casing ("Starbucks", "dining out"); null for a plain total. */
  target: string | null;
  /** Set when the target is a category name; the answer then sums that category. */
  categoryId: string | null;
  /** Set when the target is an everyday word for several categories ("food"); the answer sums them all. */
  categoryIds: string[] | null;
  /** Set when the target is a known category keyword ("coffee"); used only if no entry mentions the target. */
  fallbackCategoryId: string | null;
}

export interface QuestionContext {
  categories: Category[];
  /** Display names for default categories in the user's language (id -> name). */
  categoryLabels?: Record<string, string>;
  /** Category detection over free text, supplied by the parser. */
  detect: (text: string) => { categoryId: string; matched: string | null } | null;
  /** Restores the user's casing for a lowercased fragment. */
  restoreCase: (fragment: string) => string;
}

/** Word boundary that also works for scripts without spaces. */
const trimPunct = (s: string) => s.replace(/^[\s,.;:!?¿¡'"()]+|[\s,.;:!?¿¡'"()]+$/gu, '').trim();

function stripAll(text: string, rules: RegExp[]): string {
  let out = text;
  for (let pass = 0; pass < 3; pass += 1) {
    const before = out;
    for (const re of rules) out = out.replace(re, ' ');
    out = trimPunct(out.replace(/\s+/g, ' '));
    if (out === before) break;
  }
  return out;
}

/**
 * Returns the question when `text` (already normalized to lowercase) is one,
 * otherwise null. `text` must be the whole utterance: questions are never split.
 */
export function parseQuestion(input: string, pack: QuestionPack, ctx: QuestionContext): ParsedQuestion | null {
  // "the last 7 days" comes out first, so its number is not taken for an amount below.
  let text = input;
  let days: number | null = null;
  const recent = pack.recentDays?.exec(text);
  if (recent) {
    const n = Number(recent.slice(1).find((g) => g != null));
    if (Number.isInteger(n) && n >= 1 && n <= 366) {
      days = n;
      text = `${text.slice(0, recent.index)} ${text.slice(recent.index + recent[0].length)}`.replace(/\s+/g, ' ').trim();
    }
  }
  const hasDigit = /\d/.test(text);
  // "How much do I have left" is checked first: some spending leads ("多少", "は…いくら") would also match it.
  // With an amount in the sentence it is an entry, never a question ("left 5 for the tip").
  const remaining = hasDigit ? null : pack.remainingLead.exec(text);
  let expense = remaining ? null : pack.lead.exec(text);
  const income = remaining ? null : pack.incomeLead.exec(text);
  if (!remaining && !expense && !income && pack.weakLead && !hasDigit) expense = pack.weakLead.exec(text);
  if (!remaining && !expense && !income) return null;
  // The lead that appears first decides what is being asked about.
  const useIncome = !remaining && !!income && (!expense || income.index < expense.index);
  const lead = remaining ?? (useIncome ? income! : expense!);
  const type: ParsedQuestion['type'] = useIncome ? 'income' : 'expense';
  const ask: ParsedQuestion['ask'] = remaining ? 'left' : 'spent';
  let rest = text.slice(0, lead.index) + ' ' + text.slice(lead.index + lead[0].length);

  let period: QuestionPeriod = 'month';
  let periodDefaulted = true;
  if (days != null) { period = 'recentDays'; periodDefaulted = false; }
  else for (const p of pack.periods) {
    const m = p.re.exec(rest);
    if (m) { period = p.period; periodDefaulted = false; rest = rest.slice(0, m.index) + ' ' + rest.slice(m.index + m[0].length); break; }
  }
  // What is left is always about the current budget period, whatever period word came with it.
  if (remaining) { period = 'budget'; rest = rest.replace(pack.remainingWords, ' '); }
  rest = stripAll(rest, pack.strip);
  const base = { type, ask, period, periodDefaulted, categoryIds: null, ...(days != null && !remaining ? { days } : null) };
  if (!rest) return { ...base, target: null, categoryId: null, fallbackCategoryId: null };

  const key = rest.replace(/\s+/g, ' ').toLowerCase();
  const compact = key.replace(/\s+/g, '');
  for (const cat of ctx.categories) {
    if (cat.archived) continue;
    const names = [cat.name, ctx.categoryLabels?.[cat.id]].filter((n): n is string => !!n).map((n) => n.toLowerCase().trim());
    if (names.some((n) => n === key || n.replace(/\s+/g, '') === compact)) {
      return { ...base, target: ctx.restoreCase(rest), categoryId: cat.id, fallbackCategoryId: null };
    }
  }
  // An everyday word for several categories, matched only as the whole target ("food", never "food truck").
  for (const g of pack.groups) {
    if (!g.words.some((w) => w === key || w.replace(/\s+/g, '') === compact)) continue;
    const ids = g.ids.filter((id) => ctx.categories.some((c) => c.id === id && !c.archived));
    if (ids.length > 0) return { ...base, target: ctx.restoreCase(rest), categoryId: null, categoryIds: ids, fallbackCategoryId: null };
  }
  // A word that starts a category's name, or one side of it: "dining" is "Dining out", "mortgage" is "Rent / Mortgage".
  for (const cat of ctx.categories) {
    if (cat.archived) continue;
    const names = [cat.name, ctx.categoryLabels?.[cat.id]].filter((n): n is string => !!n).map((n) => n.toLowerCase().trim());
    const parts = names.flatMap((n) => n.split(/\s*[/&,]\s*/u)).map((p) => p.trim()).filter(Boolean);
    if (parts.some((p) => p === key || p.split(/\s+/u)[0] === key)) {
      return { ...base, target: ctx.restoreCase(rest), categoryId: cat.id, fallbackCategoryId: null };
    }
  }
  const detected = ctx.detect(rest);
  return { ...base, target: ctx.restoreCase(rest), categoryId: null, fallbackCategoryId: detected?.categoryId ?? null };
}

/** Helper for packs: a period rule from plain phrases (longest first, so "last week" beats "week"). */
export function periodWords(phrases: string[], period: QuestionPeriod, opts: { boundary?: boolean } = { boundary: true }): { re: RegExp; period: QuestionPeriod } {
  const sorted = [...phrases].sort((a, b) => b.length - a.length).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'));
  const body = `(?:${sorted.join('|')})`;
  return { re: opts.boundary === false ? new RegExp(body, 'u') : new RegExp(`(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, 'u'), period };
}
