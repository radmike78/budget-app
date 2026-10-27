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
 * `namedMonth` is a calendar month said by name ("in August"), carried as `month`; last year's when it is still to come.
 */
export type QuestionPeriod = 'today' | 'yesterday' | 'week' | 'lastWeek' | 'month' | 'lastMonth' | 'year' | 'lastYear' | 'all' | 'budget' | 'weekend' | 'recentDays' | 'namedMonth';

export interface QuestionPack {
  /** Phrases that make the sentence a question about money out. Removed from the text. */
  lead: RegExp;
  /** Phrases that make it a question about money in. */
  incomeLead: RegExp;
  /** "the last 7 days": group 1 (or the first group that matched) is the number of days. Tried before `periods`. */
  recentDays?: RegExp;
  /** Period phrases, tried in order; the first match wins and is removed. */
  periods: { re: RegExp; period: QuestionPeriod }[];
  /**
   * A month said by name ("in August"), tried before `periods`: the first group that matched is looked up in
   * `names` (0 = January). Built with `monthWords`. Packs without it never answer `namedMonth`.
   */
  months?: { re: RegExp; names: Record<string, number> };
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
  /** "did I spend more than last month?", "how does this month compare": spending so far against the same point last time. */
  compareLead?: RegExp;
  /** "the week before", "the day before": the comparison is a finished period against the one before it. */
  compareBefore?: RegExp;
  /** "what did I spend the most on?", "where did most of my money go?" */
  topLead?: RegExp;
  /** "can I afford a $200 jacket?": the one question that carries an amount. */
  affordLead?: RegExp;
  /** Words removed from the target of a compare, top or afford question ("more", "than", "most", "on it"). Global. */
  askWords?: RegExp;
  /** Everyday words that cover more than one category ("food" is groceries and eating out). The whole target must match. */
  groups: { words: string[]; ids: string[] }[];
  monthNames?: RegExp[];
}

export interface ParsedQuestion {
  type: 'expense' | 'income';
  /**
   * `spent` sums entries; `left` asks what remains of this period's plan or income; `compare` sets spending so
   * far against the same point in the period before; `top` names where most went; `afford` weighs `price`
   * against what is left.
   */
  ask: 'spent' | 'left' | 'compare' | 'top' | 'afford';
  period: QuestionPeriod;
  /** True when no period was said; the answer then uses the current budget period. */
  periodDefaulted: boolean;
  /** For `recentDays`: how many days, today included. */
  days?: number;
  /** For `namedMonth`: the month asked about, 0 = January. */
  month?: number;
  /** For `afford`: the amount being weighed. */
  price?: number;
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
  /** Finds the amount in a sentence (for "can I afford 200 for shoes"), supplied by the parser. */
  amount?: (text: string) => { amount: number | null; text: string };
}

/** What a comparison measures, for each period word that can come with it. */
const COMPARE_PERIOD: Partial<Record<QuestionPeriod, QuestionPeriod>> = {
  week: 'week', lastWeek: 'week', month: 'month', lastMonth: 'month', year: 'year', lastYear: 'year', budget: 'budget',
};
/** Periods that are over, compared whole against the one before them ("last week than the week before"). */
const WHOLE_PERIODS = new Set<QuestionPeriod>(['lastWeek', 'lastMonth', 'lastYear', 'yesterday', 'weekend', 'recentDays', 'today', 'namedMonth']);

/** Word boundary that also works for scripts without spaces. */
const trimPunct = (s: string) => s.replace(/^[\s,.;:!?¿¡'"()]+|[\s,.;:!?¿¡'"()]+$/gu, '').trim();

function stripAll(text: string, rules: RegExp[]): string {
  let out = text;
  for (let pass = 0; pass < 3; pass += 1) {
    const before = out;
    for (const re of rules) {
      out = out.replace(re, ' ');
      // A leading rule needs a space after each word; a lone leftover word ("to", "over") has none.
      if (re.source.startsWith('^')) out = `${out.trim()} `.replace(re, ' ').trim();
    }
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
  // "can I afford a $200 jacket?" is the one question with an amount in it; the amount is the price, taken out
  // before the lead is read again ("is 80 ok for dinner" reads as "is ok for dinner"). Without an amount,
  // "can I afford to eat out?" asks what is left.
  let price: number | null = null;
  let affordLead: RegExpExecArray | null = null;
  let affordAsLeft: RegExpExecArray | null = null;
  if (pack.affordLead) {
    const found = /\d/.test(text) ? ctx.amount?.(text) : null;
    if (found && found.amount != null && found.amount > 0) {
      const again = pack.affordLead.exec(found.text);
      if (again) { price = found.amount; text = found.text; affordLead = again; }
    } else if (!/\d/.test(text)) affordAsLeft = pack.affordLead.exec(text);
  }
  const hasDigit = /\d/.test(text);
  // Without an amount: comparing first ("how am I doing compared to last month"), then "how much do I have
  // left", as some spending leads ("多少", "は…いくら") would also match it, then "the most", which also holds
  // spending words. With an amount in the sentence it is an entry, never a question ("left 5 for the tip").
  const compare = affordLead || hasDigit ? null : pack.compareLead?.exec(text) ?? null;
  const remaining = affordLead || compare || hasDigit ? null : pack.remainingLead.exec(text) ?? affordAsLeft;
  const top = affordLead || remaining || compare || hasDigit ? null : pack.topLead?.exec(text) ?? null;
  const special = affordLead ?? remaining ?? compare ?? top;
  let expense = special ? null : pack.lead.exec(text);
  const income = special ? null : pack.incomeLead.exec(text);
  if (!special && !expense && !income && pack.weakLead && !hasDigit) expense = pack.weakLead.exec(text);
  if (!special && !expense && !income) return null;
  // The lead that appears first decides what is being asked about.
  const useIncome = !special && !!income && (!expense || income.index < expense.index);
  const lead = special ?? (useIncome ? income! : expense!);
  const type: ParsedQuestion['type'] = useIncome ? 'income' : 'expense';
  const ask: ParsedQuestion['ask'] = affordLead ? 'afford' : remaining ? 'left' : compare ? 'compare' : top ? 'top' : 'spent';
  let rest = text.slice(0, lead.index) + ' ' + text.slice(lead.index + lead[0].length);

  let period: QuestionPeriod = 'month';
  let periodDefaulted = true;
  let month: number | null = null;
  // "in August" names a calendar month; read before the target is cut, so the name never becomes the target.
  let named = days == null ? pack.months?.re.exec(rest) ?? null : null;
  let namedIdx = named ? pack.months!.names[(named.slice(1).find((g) => g != null) ?? '').toLowerCase()] : undefined;
  // A pack may list one regex per month instead ("agosto|ago", "8月"): the earliest match in the sentence wins.
  if (!named && days == null && pack.monthNames) {
    for (let i = 0; i < pack.monthNames.length; i += 1) {
      const m = pack.monthNames[i].exec(rest);
      if (m && (!named || m.index < named.index)) { named = m; namedIdx = i; }
    }
  }
  if (days != null) { period = 'recentDays'; periodDefaulted = false; }
  else if (named && namedIdx != null) {
    period = 'namedMonth'; month = namedIdx; periodDefaulted = false;
    rest = rest.slice(0, named.index) + ' ' + rest.slice(named.index + named[0].length);
  } else for (const p of pack.periods) {
    const m = p.re.exec(rest);
    if (m) { period = p.period; periodDefaulted = false; rest = rest.slice(0, m.index) + ' ' + rest.slice(m.index + m[0].length); break; }
  }
  // What is left, and whether something fits in it, are always about the current budget period.
  if (remaining || affordLead) { period = 'budget'; rest = rest.replace(pack.remainingWords, ' '); }
  // A comparison is between this week, month, year or pay period so far and the same point in the one before;
  // "than last month" names the one before, so it means this month.
  if (compare) {
    // "last week than the week before" keeps last week whole; "than last week" means this week against last.
    const before = pack.compareBefore ? pack.compareBefore.exec(rest) : null;
    if (before) rest = rest.replace(pack.compareBefore!, ' ');
    if (!(WHOLE_PERIODS.has(period) && (before || !(period in COMPARE_PERIOD)))) period = COMPARE_PERIOD[period] ?? 'budget';
    // "this week than last week" names both sides: neither is the thing asked about.
    for (const p of pack.periods) rest = rest.replace(new RegExp(p.re.source, `${p.re.flags.replace('g', '')}g`), ' ');
  }
  if (affordLead || compare || top) rest = pack.askWords ? rest.replace(pack.askWords, ' ') : rest;
  rest = stripAll(rest, pack.strip);
  const base = { type, ask, period, periodDefaulted, categoryIds: null, ...(days != null && ask === 'spent' ? { days } : null), ...(month != null ? { month } : null), ...(price != null ? { price } : null) };
  if (!rest) return { ...base, target: null, categoryId: null, fallbackCategoryId: null };

  const key = rest.replace(/\s+/g, ' ').toLowerCase();
  const compact = key.replace(/\s+/g, '');
  for (const cat of ctx.categories) {
    if (cat.archived) continue;
    const names = [cat.name, ctx.categoryLabels?.[cat.id]].filter((n): n is string => typeof n === 'string' && !!n).map((n) => n.toLowerCase().trim());
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
    const names = [cat.name, ctx.categoryLabels?.[cat.id]].filter((n): n is string => typeof n === 'string' && !!n).map((n) => n.toLowerCase().trim());
    const parts = names.flatMap((n) => n.split(/\s*[/&,]\s*/u)).map((p) => p.trim()).filter(Boolean);
    if (parts.some((p) => p === key || p.split(/\s+/u)[0] === key)) {
      return { ...base, target: ctx.restoreCase(rest), categoryId: cat.id, fallbackCategoryId: null };
    }
  }
  const detected = ctx.detect(rest);
  return { ...base, target: ctx.restoreCase(rest), categoryId: null, fallbackCategoryId: detected?.categoryId ?? null };
}

/**
 * Helper for packs: months by name for `QuestionPack.months`. A full name counts anywhere ("spending in august",
 * "august spending"); a short form or an ambiguous one ("may") only after one of `pre` ("in may"). A day number
 * after the name ("august 3") is a date, not a period, and is left alone.
 */
export function monthWords(names: Record<string, number>, pre: string[], withPreOnly: Record<string, number> = {}): { re: RegExp; names: Record<string, number> } {
  const esc = (list: string[]) => [...list].sort((a, b) => b.length - a.length).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')).join('|');
  const lead = pre.length ? `(?:(?:${esc(pre)})\\s+)` : '';
  const tail = '(?![\\p{L}\\p{N}])(?!\\s*\\d)';
  const full = Object.keys(names).length ? `(?<![\\p{L}\\p{N}])${lead}?(${esc(Object.keys(names))})${tail}` : null;
  const short = Object.keys(withPreOnly).length && lead ? `(?<![\\p{L}\\p{N}])${lead}(${esc(Object.keys(withPreOnly))})${tail}` : null;
  return { re: new RegExp([full, short].filter(Boolean).join('|'), 'u'), names: { ...names, ...withPreOnly } };
}

/** Helper for packs: a period rule from plain phrases (longest first, so "last week" beats "week"). */
export function periodWords(phrases: string[], period: QuestionPeriod, opts: { boundary?: boolean } = { boundary: true }): { re: RegExp; period: QuestionPeriod } {
  const sorted = [...phrases].sort((a, b) => b.length - a.length).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'));
  const body = `(?:${sorted.join('|')})`;
  return { re: opts.boundary === false ? new RegExp(body, 'u') : new RegExp(`(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, 'u'), period };
}
