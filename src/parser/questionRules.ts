/**
 * Spoken questions about spending: "how much have I spent this week on Starbucks?",
 * "¿cuánto he gastado este mes en restaurantes?", "今月スターバックスでいくら使った？".
 * Pure functions, no React Native imports. Nothing here reads the database: the
 * parser only says what is being asked, and src/lib/questions.ts works out the answer.
 */
import type { Category } from '@/types';

export type QuestionPeriod = 'today' | 'yesterday' | 'week' | 'lastWeek' | 'month' | 'lastMonth' | 'year' | 'lastYear' | 'all';

export interface QuestionPack {
  /** Phrases that make the sentence a question about money out. Removed from the text. */
  lead: RegExp;
  /** Phrases that make it a question about money in. */
  incomeLead: RegExp;
  /** Period phrases, tried in order; the first match wins and is removed. */
  periods: { re: RegExp; period: QuestionPeriod }[];
  /** Leftover words dropped from the start and end of what remains ("on", "at", particles). */
  strip: RegExp[];
}

export interface ParsedQuestion {
  type: 'expense' | 'income';
  period: QuestionPeriod;
  /** What the user asked about, in their own casing ("Starbucks", "dining out"); null for a plain total. */
  target: string | null;
  /** Set when the target is a category name; the answer then sums that category. */
  categoryId: string | null;
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
export function parseQuestion(text: string, pack: QuestionPack, ctx: QuestionContext): ParsedQuestion | null {
  const expense = pack.lead.exec(text);
  const income = pack.incomeLead.exec(text);
  if (!expense && !income) return null;
  // The lead that appears first decides what is being asked about.
  const useIncome = !!income && (!expense || income.index < expense.index);
  const lead = useIncome ? income! : expense!;
  let rest = text.slice(0, lead.index) + ' ' + text.slice(lead.index + lead[0].length);

  let period: QuestionPeriod = 'month';
  for (const p of pack.periods) {
    const m = p.re.exec(rest);
    if (m) { period = p.period; rest = rest.slice(0, m.index) + ' ' + rest.slice(m.index + m[0].length); break; }
  }
  rest = stripAll(rest, pack.strip);
  if (!rest) return { type: useIncome ? 'income' : 'expense', period, target: null, categoryId: null, fallbackCategoryId: null };

  const key = rest.replace(/\s+/g, ' ').toLowerCase();
  const compact = key.replace(/\s+/g, '');
  for (const cat of ctx.categories) {
    if (cat.archived) continue;
    const names = [cat.name, ctx.categoryLabels?.[cat.id]].filter((n): n is string => !!n).map((n) => n.toLowerCase().trim());
    if (names.some((n) => n === key || n.replace(/\s+/g, '') === compact)) {
      return { type: useIncome ? 'income' : 'expense', period, target: ctx.restoreCase(rest), categoryId: cat.id, fallbackCategoryId: null };
    }
  }
  const detected = ctx.detect(rest);
  return {
    type: useIncome ? 'income' : 'expense',
    period,
    target: ctx.restoreCase(rest),
    categoryId: null,
    fallbackCategoryId: detected?.categoryId ?? null,
  };
}

/** Helper for packs: a period rule from plain phrases (longest first, so "last week" beats "week"). */
export function periodWords(phrases: string[], period: QuestionPeriod, opts: { boundary?: boolean } = { boundary: true }): { re: RegExp; period: QuestionPeriod } {
  const sorted = [...phrases].sort((a, b) => b.length - a.length).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'));
  const body = `(?:${sorted.join('|')})`;
  return { re: opts.boundary === false ? new RegExp(body, 'u') : new RegExp(`(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, 'u'), period };
}
