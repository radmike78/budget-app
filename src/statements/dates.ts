/**
 * Dates on statements: "01/05", "01/05/2026", "1/5/26", "2026-01-05",
 * "Jan 5", "Jan 5, 2026", "5 Jan 2026", "05 ene 2026", "5 janv. 2026",
 * "2026年1月5日", "1月5日". Years are inferred from the statement period when
 * the line has none, so a December line on a January statement lands in the
 * previous year and every line goes into the right month.
 */
import { addDays, daysBetween, daysInMonth, fromDateString, isValidDateString, toDateString } from '@/lib/dates';
import type { Row, StatementPeriod } from './types';

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
  sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
  ene: 0, enero: 0, febrero: 1, marzo: 2, abr: 3, abril: 3, mayo: 4, junio: 5, julio: 6, ago: 7, agosto: 7, septiembre: 8, set: 8, octubre: 9, noviembre: 10, dic: 11, diciembre: 11,
  janv: 0, janvier: 0, févr: 1, fevr: 1, février: 1, fevrier: 1, mars: 2, avr: 3, avril: 3, mai: 4, juin: 5, juil: 6, juillet: 6, août: 7, aout: 7, septembre: 8, octobre: 9, novembre: 10, déc: 11, decembre: 11, décembre: 11,
  gen: 0, gennaio: 0, febbraio: 1, maggio: 4, mag: 4, giu: 5, giugno: 5, lug: 6, luglio: 6, settembre: 8, sett: 8, ott: 9, ottobre: 9, dicembre: 11,
  januar: 0, jänner: 0, februar: 1, märz: 2, maerz: 2, mär: 2, juni: 5, juli: 6, okt: 9, oktober: 9, dez: 11, dezember: 11,
};
const MONTH_ALT = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');

/** Locales that write day before month in numeric dates ('dmy' / 'mdy' name the order outright). */
const DAY_FIRST = new Set(['dmy', 'es', 'fr', 'it', 'de', 'pt', 'en-gb', 'en-au', 'en-nz', 'en-ie', 'en-in', 'en-za']);
/** English-speaking regions that write the month first; everywhere else English dates are day first. */
const MONTH_FIRST_REGIONS = new Set(['us', 'ca', 'ph']);

/** The order a phone's language and region suggest for "03/04": 'dmy' or 'mdy'. */
export function defaultDateOrder(language: string, region?: string | null): 'dmy' | 'mdy' {
  const lang = language.toLowerCase();
  const reg = (region ?? '').toLowerCase();
  if (lang === 'en') return reg && !MONTH_FIRST_REGIONS.has(reg) ? 'dmy' : 'mdy';
  return DAY_FIRST.has(lang) ? 'dmy' : 'mdy';
}

// Numeric dates that can only be dates (a slash, or day, month and year): "4.50" is an amount, not April 50th.
const RE_ORDER_HINT = /(?<![\d/.-])(\d{1,2})(?:\/(\d{1,2})(?:\/\d{2,4})?|[.-](\d{1,2})[.-]\d{2,4})(?![\d/.-])/g;

/**
 * Reads the order from the statement itself: "15/03" can only be day first and "03/15" only month first.
 * Null when every date fits both ways (then the phone's region decides).
 */
export function numericDateOrder(rows: Row[]): 'dmy' | 'mdy' | null {
  let dmy = 0;
  let mdy = 0;
  for (const row of rows.slice(0, 600)) {
    RE_ORDER_HINT.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = RE_ORDER_HINT.exec(row.text)) !== null) {
      const a = Number(m[1]);
      const b = Number(m[2] ?? m[3]);
      if (a > 12 && a <= 31 && b >= 1 && b <= 12) dmy += 1;
      else if (b > 12 && b <= 31 && a >= 1 && a <= 12) mdy += 1;
    }
  }
  if (dmy === mdy) return null;
  return dmy > mdy ? 'dmy' : 'mdy';
}

export interface DateHit {
  /** Month index 0..11 */
  month: number;
  day: number;
  /** Explicit year, or null when the line had none. */
  year: number | null;
  start: number;
  end: number;
  raw: string;
}

const RE_ISO = /\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/g;
const RE_NUMERIC = /(?<![\d/.-])(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?(?![\d/.-])/g;
const RE_MONTH_DAY = new RegExp(`\\b(${MONTH_ALT})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(20\\d{2}))?\\b`, 'giu');
const RE_DAY_MONTH = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\.?\\s+(?:de\\s+|di\\s+)?(${MONTH_ALT})\\.?(?:\\s+(?:de\\s+)?(20\\d{2}))?\\b`, 'giu');
const RE_CJK = /(?:(20\d{2})\s*年\s*)?(\d{1,2})\s*月\s*(\d{1,2})\s*日/g;

function push(out: DateHit[], month: number, day: number, year: number | null, start: number, end: number, raw: string): void {
  if (month < 0 || month > 11 || day < 1 || day > 31) return;
  if (year != null && (year < 1990 || year > 2100)) return;
  if (out.some((h) => start < h.end && end > h.start)) return;
  out.push({ month, day, year, start, end, raw });
}

function fullYear(y: string | undefined): number | null {
  if (!y) return null;
  const n = Number(y);
  if (y.length === 2) return 2000 + n;
  return n;
}

/** Every date-looking token in a string, left to right. */
export function findDates(text: string, language: string): DateHit[] {
  const out: DateHit[] = [];
  const dayFirst = DAY_FIRST.has(language.toLowerCase());
  let m: RegExpExecArray | null;
  RE_ISO.lastIndex = 0;
  while ((m = RE_ISO.exec(text)) !== null) push(out, Number(m[2]) - 1, Number(m[3]), Number(m[1]), m.index, m.index + m[0].length, m[0]);
  RE_CJK.lastIndex = 0;
  while ((m = RE_CJK.exec(text)) !== null) push(out, Number(m[2]) - 1, Number(m[3]), m[1] ? Number(m[1]) : null, m.index, m.index + m[0].length, m[0]);
  RE_MONTH_DAY.lastIndex = 0;
  while ((m = RE_MONTH_DAY.exec(text)) !== null) push(out, MONTHS[m[1].toLowerCase()], Number(m[2]), fullYear(m[3]), m.index, m.index + m[0].length, m[0]);
  RE_DAY_MONTH.lastIndex = 0;
  while ((m = RE_DAY_MONTH.exec(text)) !== null) push(out, MONTHS[m[2].toLowerCase()], Number(m[1]), fullYear(m[3]), m.index, m.index + m[0].length, m[0]);
  RE_NUMERIC.lastIndex = 0;
  while ((m = RE_NUMERIC.exec(text)) !== null) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    const year = fullYear(m[3]);
    // Decide month/day order: the locale's default, overridden when only one order is possible.
    let month: number;
    let day: number;
    if (a > 12 && b <= 12) { day = a; month = b; }
    else if (b > 12 && a <= 12) { month = a; day = b; }
    else if (dayFirst) { day = a; month = b; }
    else { month = a; day = b; }
    push(out, month - 1, day, year, m.index, m.index + m[0].length, m[0]);
  }
  return out.sort((x, y) => x.start - y.start);
}

/**
 * Picks the year for a month/day with no year: inside the statement period if one
 * is known, else the most recent occurrence that is not in the future.
 */
export function resolveDate(hit: DateHit, period: StatementPeriod | null, today: string): string | null {
  const make = (y: number) => {
    const d = Math.min(hit.day, daysInMonth(y, hit.month));
    const s = toDateString(new Date(y, hit.month, d));
    return isValidDateString(s) ? s : null;
  };
  if (hit.year != null) return make(hit.year);
  if (period) {
    const ys = fromDateString(period.start).getFullYear();
    const ye = fromDateString(period.end).getFullYear();
    const candidates = [...new Set([ys, ye, ys - 1, ye + 1])].map(make).filter((s): s is string => !!s);
    const lo = addDays(period.start, -45);
    const hi = addDays(period.end, 45);
    const inside = candidates.filter((s) => s >= lo && s <= hi);
    if (inside.length) return inside.sort((a, b) => Math.abs(daysBetween(period.start, a)) - Math.abs(daysBetween(period.start, b)))[0];
  }
  const ty = fromDateString(today).getFullYear();
  const thisYear = make(ty);
  if (thisYear && thisYear <= addDays(today, 7)) return thisYear;
  return make(ty - 1);
}

// Word boundaries matter: without them "to" is in "Total" and "du" is in "Due".
const PERIOD_WORDS = /\b(statement period|billing period|billing cycle|statement date|closing date|period covered|activity period|for the period|opening date|from|through|thru|to|periodo|período|du|au|dal|al|vom|bis|abrechnungszeitraum|statement closing)\b/i;
const OPEN_WORDS = /\b(opening date|opening\/closing date|from|start(?:ing)? date|previous statement|desde|du|dal|vom)\b/i;
const CLOSE_WORDS = /\b(closing date|statement date|through|to date|ending|end(?:ing)? date|hasta|au|al|bis|statement closing)\b/i;
/** "Payment Due Date 02/25/2026" is a deadline, never an end of the period. */
const DUE_BEFORE = /\bdue\b[^\d]{0,25}$/i;

function notDue(text: string, hit: DateHit): boolean {
  return !DUE_BEFORE.test(text.slice(0, hit.start));
}

/** The date nearest after the word that names it ("Closing Date 01/31/2026"), else the nearest before. */
function dateAfterWord(text: string, re: RegExp, hits: DateHit[]): DateHit | null {
  const m = re.exec(text);
  if (!m) return null;
  const at = m.index + m[0].length;
  const usable = hits.filter((h) => notDue(text, h));
  return usable.find((h) => h.start >= at) ?? [...usable].reverse().find((h) => h.end <= m.index) ?? null;
}

/**
 * The statement period from a row like "Statement Period: 01/01/2026 - 01/31/2026",
 * "Opening date 12/05/2025 Closing date 01/04/2026" or "December 5, 2025 through January 4, 2026".
 * Falls back to the closing date alone (period = the 31 days before it).
 */
export function findPeriod(rows: Row[], language: string, today: string): StatementPeriod | null {
  const dated: { row: Row; hits: DateHit[] }[] = [];
  for (const row of rows.slice(0, 120)) {
    const hits = findDates(row.text, language).filter((h) => h.year != null);
    if (hits.length) dated.push({ row, hits });
  }
  // Two explicit-year dates on a row that mentions a period (a payment due date on the same row is ignored).
  for (const { row, hits } of dated) {
    const usable = hits.filter((h) => notDue(row.text, h));
    if (usable.length >= 2 && PERIOD_WORDS.test(row.text)) {
      const a = resolveDate(usable[0], null, today);
      const b = resolveDate(usable[1], null, today);
      if (a && b && a <= b && daysBetween(a, b) <= 400) return { start: a, end: b };
    }
  }
  // Opening / closing on separate rows.
  let open: string | null = null;
  let close: string | null = null;
  for (const { row, hits } of dated) {
    const o = open ? null : dateAfterWord(row.text, OPEN_WORDS, hits);
    if (o) open = resolveDate(o, null, today);
    const c = close ? null : dateAfterWord(row.text, CLOSE_WORDS, hits);
    if (c) close = resolveDate(c, null, today);
  }
  if (open && close && open <= close) return { start: open, end: close };
  if (close) return { start: addDays(close, -31), end: close };
  return null;
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}
