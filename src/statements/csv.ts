/**
 * CSV exports from a bank or card, turned into the same rows the statement parser reads from a PDF, so the
 * review step, the categories, the duplicate check and the one-go take-back all work the same way.
 *
 * Nothing here is executed or sent anywhere: the file is text, split into cells, and only a date, a
 * description and the amounts of each line are kept. Column roles come from the header when there is one
 * (in eight languages) and from the cells' shape when there is not. Every amount is rewritten as a plain
 * signed number with two decimals, so "1.234,56", "(12.50)", "12.50 CR" and "¥1,200" all read the same.
 */
import type { Row, StatementKind, StatementPeriod } from './types';
import { defaultDateOrder, findDates, numericDateOrder, resolveDate } from './dates';

/** A CSV bigger than this is not a statement anyone exported by hand. */
export const MAX_CSV_BYTES = 5 * 1024 * 1024;
/** Lines past this are ignored: a year of daily spending is well under it. */
export const MAX_CSV_LINES = 20000;
/** No export has more columns than this, or a longer cell; the rest is dropped before any parsing. */
export const MAX_CSV_COLUMNS = 64;
const MAX_CSV_CELL = 400;

type Role = 'date' | 'desc' | 'amount' | 'in' | 'out' | 'balance' | 'sign' | 'category' | 'skip';

/** Header words, in the eight app languages plus what common exports use. Longer, more specific words first. */
const HEADER_ROLES: { re: RegExp; role: Role }[] = [
  // German and Swiss exports (PostFinance, UBS, Raiffeisen, Sparkasse) say Gutschrift/Belastung or Haben/Soll.
  { re: /^(?:money in|paid in|deposits?|credits?|credit amount|inflow|amount credited|cash in|haben|eingang|eing[äa]nge|gutschrift(?:en)?|einnahmen|zugang|abonos?|ingresos?|cr[ée]dits?|entrate|accrediti|avere|入金|入金額|예금|입금|입금액|收入|存入|贷方)$/i, role: 'in' },
  { re: /^(?:money out|paid out|withdrawals?|debits?|debit amount|outflow|amount debited|cash out|charges?|soll|ausgang|ausg[äa]nge|lastschrift(?:en)?|belastung(?:en)?|abbuchung(?:en)?|ausgaben|abgang|cargos?|retiros?|d[ée]bits?|uscite|addebiti|dare|出金|出金額|인출|출금|출금액|支出|取出|借方)$/i, role: 'out' },
  { re: /^(?:amount|transaction amount|credit\/debit amount|debit\/credit amount|amt|value|sum|importe|monto|cantidad|montant|betrag|umsatz|importo|金額|금액|거래금액|金额|交易金额)$/i, role: 'amount' },
  { re: /^(?:balance|running balance|closing balance|available balance|balance after transaction|saldo|solde|kontostand|残高|잔액|余额|馀额)$/i, role: 'balance' },
  { re: /^(?:date|transaction date|trans date|posting date|post date|posted date|booking date|booked at|value date|date posted|started date|completed date|fecha|fecha operaci[oó]n|fecha valor|date d'op[ée]ration|date de valeur|datum|buchungstag|buchungsdatum|abschlussdatum|valutadatum|wertstellung|valuta|data|data operazione|data valuta|日付|取引日|利用日|거래일|거래일자|日期|交易日期|记账日期)$/i, role: 'date' },
  { re: /^(?:description|details|transaction details|transaction description|narrative|memo|payee|merchant|name|counterparty|beneficiary|reference|particulars|text|descripci[oó]n|concepto|libell[ée]|intitul[ée]|verwendungszweck|buchungstext|avisierungstext|beschreibung ?\d?|empf[äa]nger|zahlungsempf[äa]nger|auftraggeber ?\/? ?empf[äa]nger|beg[üu]nstigter|descrizione|dettagli|operazione|causale|摘要|内容|利用店名|적요|내용|거래내용|交易摘要|交易说明|商户)$/i, role: 'desc' },
  // Another app's export (YNAB, Mint, Monarch, Goodbudget, EveryDollar): its category lands in this app's category.
  { re: /^(?:category|categories|category group\/category|category group|subcategory|envelope|budget category|budget|categor[ií]a|cat[ée]gorie|kategorie|カテゴリ|カテゴリー|分類|분류|카테고리|分类|类别)$/i, role: 'category' },
  { re: /^(?:type|transaction type|cr\/dr|dr\/cr|d\/c|c\/d|debit\/credit|credit\/debit|direction|flow|indicator|tipo|type d'op[ée]ration|soll\/haben|art|区分|입출금구분|借贷)$/i, role: 'sign' },
];

const CREDIT_WORDS = /(?:^|[\s_/-])(?:cr|c|credit|credits|deposit|in|income|inflow|received|refund|haben|gutschrift|abono|ingreso|cr[ée]dit|entrata|accredito|avere|入金|입금|收入|存入|贷)(?:$|[\s_/-])/i;
const DEBIT_WORDS = /(?:^|[\s_/-])(?:dr|d|debit|debits|withdrawal|out|expense|outflow|sent|purchase|charge|fee|soll|lastschrift|cargo|retiro|d[ée]bit|uscita|addebito|dare|出金|출금|支出|取出|借)(?:$|[\s_/-])/i;
/** A whole column of such flags is a direction column, whatever its header says ("Details" on a Chase export). */
const FLAG_CELL = /^(?:(?:cr|dr|c|d|credit|debit|deposit|withdrawal|in|out|inflow|outflow)|[a-z_]*(?:credit|debit)[a-z_]*)$/i;

/** Splits CSV text into cells: quotes, doubled quotes, embedded newlines, and the delimiter the file uses. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const delimiter = detectDelimiter(src);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i += 1; } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === delimiter) { row.push(cell); cell = ''; continue; }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      if (rows.length >= MAX_CSV_LINES) break;
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows.map((r) => r.slice(0, MAX_CSV_COLUMNS).map((c) => c.trim().slice(0, MAX_CSV_CELL)));
}

function detectDelimiter(src: string): string {
  const head = src.split(/\r?\n/).slice(0, 5).join('\n');
  const counts: [string, number][] = [[',', 0], [';', 0], ['\t', 0], ['|', 0]];
  let quoted = false;
  for (const ch of head) {
    if (ch === '"') quoted = !quoted;
    if (quoted) continue;
    for (const c of counts) if (ch === c[0]) c[1] += 1;
  }
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ',';
}

/** "1.234,56", "(12.50)", "12.50-", "12.50 CR", "¥1,200", "-$12.50" → a signed number, or null when it is not one. */
export function csvAmount(cell: string): number | null {
  let s = cell.replace(/[\s ]/g, '');
  if (!s) return null;
  let negative = false;
  let positive = false;
  if (/^\(.*\)$/.test(s)) { negative = true; s = s.slice(1, -1); }
  if (/(?:CR|Cr|cr|H|h)$/.test(s) && /\d/.test(s)) { positive = true; s = s.replace(/(?:CR|Cr|cr|H|h)$/, ''); }
  if (/(?:DR|Dr|dr|S|s)$/.test(s) && /\d/.test(s)) { negative = true; s = s.replace(/(?:DR|Dr|dr|S|s)$/, ''); }
  if (/^[-−–]/.test(s)) { negative = true; s = s.slice(1); }
  if (/[-−–]$/.test(s)) { negative = true; s = s.slice(0, -1); }
  if (/^\+/.test(s)) { positive = true; s = s.slice(1); }
  s = s.replace(/^(?:[$€£¥₹₩]|円|원|元|USD|EUR|GBP|CAD|AUD|CHF|MXN|BRL|JPY|CNY|KRW|R\$|C\$|A\$)/i, '').replace(/(?:[$€£¥₹₩]|円|원|元|USD|EUR|GBP|CAD|AUD|CHF|MXN|BRL|JPY|CNY|KRW)$/i, '');
  if (/^[-−–]/.test(s)) { negative = true; s = s.slice(1); }
  if (!/^\d[\d.,]*$/.test(s)) return null;
  // Two digits after the last separator are decimals; three are a thousands group; one digit is a decimal too ("12,5").
  const m = s.match(/^(.*?)([.,])(\d{1,2})$/);
  const intPart = (m ? m[1] : s).replace(/[.,]/g, '');
  if (!/^\d+$/.test(intPart) || intPart.length > 13) return null;
  const n = Number(m ? `${intPart}.${m[3].padEnd(2, '0')}` : intPart);
  if (!Number.isFinite(n)) return null;
  const value = Math.round(n * 100) / 100;
  return negative && !positive ? -value : value;
}

/** A date cell in one of the shapes exports use, rewritten so the statement date reader recognises it. */
export function normalizeCsvDate(cell: string): string {
  const s = cell.trim().replace(/\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?(?:\s?[+-]\d{2}:?\d{2}|Z)?$/i, '').replace(/T\d{2}:\d{2}.*$/, '');
  let m = s.match(/^(20\d{2})(\d{2})(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[-/. ]([A-Za-z]{3,9})[-/. ](\d{2,4})$/);
  if (m) return `${m[1]} ${m[2]} ${m[3].length === 2 ? `20${m[3]}` : m[3]}`;
  m = s.match(/^([A-Za-z]{3,9})[-/. ](\d{1,2})[-/. ,]+(\d{4})$/);
  if (m) return `${m[1]} ${m[2]}, ${m[3]}`;
  return s;
}

function looksLikeDate(cell: string, language: string): boolean {
  const n = normalizeCsvDate(cell);
  if (!n || n.length > 24) return false;
  const hits = findDates(n, language);
  return hits.length > 0 && hits[0].start === 0 && hits[0].end >= n.length - 1;
}

interface Plan {
  date: number;
  desc: number[];
  amount: number | null;
  inCol: number | null;
  outCol: number | null;
  balance: number | null;
  sign: number | null;
  category: number | null;
  headerRow: number;
}

function planFromHeader(header: string[]): Plan | null {
  const roles: Role[] = header.map((h) => {
    const key = h.toLowerCase().replace(/[\s_.:() ]+/g, ' ').replace(/^"|"$/g, '').trim()
      .replace(/ ?(?:in )?(?:eur|euros?|usd|gbp|chf|jpy|cny|krw|cad|aud|dollars?|pounds?)$/u, '').trim();
    for (const r of HEADER_ROLES) if (r.re.test(key)) return r.role;
    return 'skip';
  });
  const first = (role: Role) => roles.indexOf(role);
  const date = first('date');
  if (date < 0) return null;
  const amount = first('amount');
  const inCol = first('in');
  const outCol = first('out');
  if (amount < 0 && (inCol < 0 || outCol < 0)) return null;
  const desc = roles.map((r, i) => (r === 'desc' ? i : -1)).filter((i) => i >= 0);
  return { date, desc, amount: amount >= 0 ? amount : null, inCol: inCol >= 0 ? inCol : null, outCol: outCol >= 0 ? outCol : null, balance: first('balance') >= 0 ? first('balance') : null, sign: first('sign') >= 0 ? first('sign') : null, category: first('category') >= 0 ? first('category') : null, headerRow: 0 };
}

/** Moves a "description" column whose cells are all credit/debit flags over to the sign role. */
function refineByContent(plan: Plan, data: string[][]): Plan {
  const sample = data.slice(0, 60);
  const flagsOnly = (col: number) => {
    const cells = sample.map((r) => (r[col] ?? '').trim()).filter(Boolean);
    return cells.length > 0 && cells.every((c) => FLAG_CELL.test(c));
  };
  const desc = plan.desc.filter((col) => !flagsOnly(col));
  const flagCol = plan.desc.find((col) => flagsOnly(col));
  return { ...plan, desc, sign: plan.sign ?? (flagCol != null && plan.inCol == null ? flagCol : null) };
}

/** A row with no date and no number in it: a title, a note or a header the role list does not know. */
function hasNoData(row: string[], language: string): boolean {
  return !row.some((c) => c && (csvAmount(c) != null || looksLikeDate(c, language)));
}

/**
 * No usable header: dates are where most cells are dates, amounts where most are numbers, words are the description.
 * Each column is scored over its filled cells only, so a sparse money-in column (two salaries and a refund among
 * forty blank cells) is numeric all the same. The caller drops title and header rows first, so they never dilute it.
 */
function planFromShape(rows: string[][], language: string): Plan | null {
  if (!rows.length) return null;
  const width = Math.max(...rows.map((r) => r.length));
  const sample = rows.slice(0, 60);
  const score = (fn: (c: string) => boolean) => Array.from({ length: width }, (_v, col) => {
    const cells = sample.map((r) => r[col] ?? '').filter((c) => c !== '');
    return cells.length ? cells.filter(fn).length / cells.length : 0;
  });
  const dateScore = score((c) => looksLikeDate(c, language));
  const numScore = score((c) => csvAmount(c) != null && !looksLikeDate(c, language));
  const date = dateScore.findIndex((s) => s >= 0.8);
  if (date < 0) return null;
  const numeric = numScore.map((s, i) => (s >= 0.8 && i !== date ? i : -1)).filter((i) => i >= 0);
  if (!numeric.length) return null;
  const textCols = Array.from({ length: width }, (_v, i) => i).filter((i) => i !== date && !numeric.includes(i));
  const avgLen = (col: number) => sample.reduce((a, r) => a + (r[col]?.length ?? 0), 0) / sample.length;
  const desc = textCols.filter((i) => avgLen(i) >= 3).sort((a, b) => avgLen(b) - avgLen(a)).slice(0, 2).sort((a, b) => a - b);
  // One number is the amount; two are amount and balance; three are out, in and balance.
  const plan: Plan = { date, desc, amount: null, inCol: null, outCol: null, balance: null, sign: null, category: null, headerRow: -1 };
  if (numeric.length === 1) plan.amount = numeric[0];
  else if (numeric.length === 2) { plan.amount = numeric[0]; plan.balance = numeric[1]; }
  else { plan.outCol = numeric[0]; plan.inCol = numeric[1]; plan.balance = numeric[2]; }
  return plan;
}

export interface CsvRows {
  rows: Row[];
  /** The span of the dated lines, for the parser's year inference and partial-month flags. */
  period: StatementPeriod | null;
  /** 'card' when the export is plainly from a card (charges positive, payments negative, or a card column in the header); else undefined, and the parser reads the rows. */
  kind?: StatementKind;
  warnings: string[];
}

/** Column x positions on the synthetic rows: far enough apart for the parser's nearest-column lookup. */
const X = { date: 0, desc: 40, out: 400, in: 520, amount: 640, balance: 760 };

/**
 * Turns CSV text into statement rows: a header row the parser can read ("Date  Description  Money out  Money in
 * Balance") and one row per line, date first. Signed amounts keep their sign; an unsigned amount column with a
 * CR/DR column, or with no negatives at all, is split into money in and money out.
 */
export function csvToRows(text: string, language: string, today: string): CsvRows {
  const warnings: string[] = [];
  const grid = parseCsv(text).filter((r) => r.some((c) => c));
  if (!grid.length) return { rows: [], period: null, warnings: ['csvNoColumns'] };
  // The header is the first row with words and no dates or numbers in it; exports sometimes put notes above it.
  let plan: Plan | null = null;
  for (let i = 0; i < Math.min(grid.length, 10) && !plan; i += 1) {
    const r = grid[i];
    if (r.filter((c) => c).length < 2 || r.some((c) => looksLikeDate(c, language))) continue;
    const p = planFromHeader(r);
    if (p) { plan = { ...p, headerRow: i }; }
  }
  let data = plan ? grid.slice(plan.headerRow + 1) : grid;
  if (!plan) {
    // A header in words the role list does not know, or a title above the data: rows with no date and no number
    // are not lines, and left in they would dilute the shape scores (a sparse credit column with "Gutschrift" on
    // top reads as mostly text) and be reported as skipped lines.
    let lead = 0;
    while (lead < Math.min(data.length, 10) && hasNoData(data[lead], language)) lead += 1;
    data = data.slice(lead);
    plan = planFromShape(data.filter((r) => r.length >= 2), language);
  }
  if (!plan) return { rows: [], period: null, warnings: ['csvNoColumns'] };
  plan = refineByContent(plan, data);

  // Decide how a single amount column is signed, from the data itself.
  const amountOf = (r: string[], col: number | null) => (col == null ? null : csvAmount(r[col] ?? ''));
  let splitUnsigned = false;
  let cardStyle = false;
  if (plan.amount != null && plan.inCol == null && plan.sign == null) {
    const signed = data.map((r) => ({ v: amountOf(r, plan!.amount), d: plan!.desc.map((i) => r[i] ?? '').join(' ') })).filter((x): x is { v: number; d: string } => x.v != null && x.v !== 0);
    const negatives = signed.filter((x) => x.v < 0);
    // Only positives: charges as a card prints them; payments and refunds are money in.
    if (!negatives.length && signed.length) {
      splitUnsigned = true;
      // With no payment or refund line to go by, every line is read as money out: worth a look in the review.
      if (!signed.some((x) => CARD_CREDIT.test(x.d))) warnings.push('directionGuessed');
    }
    // Mostly positives, and what is negative reads as a payment or refund: a card export (Amex, Discover), where
    // a plus is spending. A bank export is the other way round, and keeps its signs.
    else if (signed.length >= 3 && negatives.length && negatives.length <= signed.length / 2 && negatives.filter((x) => CARD_CREDIT.test(x.d)).length >= Math.ceil(negatives.length * 0.6)) cardStyle = true;
  }

  const rows: Row[] = [];
  const cellsOf = (parts: { x: number; str: string }[]) => ({ page: 1, y: -rows.length, cells: parts, text: parts.map((p) => p.str).join('  ') });
  const header: { x: number; str: string }[] = [{ x: X.date, str: 'Date' }, { x: X.desc, str: 'Description' }, { x: X.out, str: 'Money out' }, { x: X.in, str: 'Money in' }];
  if (plan.balance != null) header.push({ x: X.balance, str: 'Balance' });
  rows.push(cellsOf(header));

  const dateOrderRows: Row[] = [];
  let dropped = 0;
  for (const r of data) {
    const rawDate = normalizeCsvDate(r[plan.date] ?? '');
    if (!rawDate || !looksLikeDate(rawDate, language)) { dropped += 1; continue; }
    const partsOfDesc = plan.desc.map((i) => (r[i] ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean);
    const description = partsOfDesc.filter((d, i) => !partsOfDesc.some((o, j) => j !== i && o.length >= d.length && o.toLowerCase().includes(d.toLowerCase()) && (o.length > d.length || j < i))).join(' ');
    const fmt = (v: number) => `${v < 0 ? '-' : ''}${Math.abs(v).toFixed(2)}`;
    const parts: { x: number; str: string }[] = [{ x: X.date, str: rawDate }, { x: X.desc, str: description || 'Transaction' }];
    if (plan.inCol != null && plan.outCol != null) {
      const inV = amountOf(r, plan.inCol);
      const outV = amountOf(r, plan.outCol);
      if (inV == null && outV == null) { dropped += 1; continue; }
      if (outV != null && outV !== 0) parts.push({ x: X.out, str: fmt(Math.abs(outV)) });
      if (inV != null && inV !== 0) parts.push({ x: X.in, str: fmt(Math.abs(inV)) });
      if (parts.length === 2) { dropped += 1; continue; }
    } else {
      const v = amountOf(r, plan.amount);
      if (v == null || v === 0) { dropped += 1; continue; }
      if (plan.sign != null) {
        const flag = (r[plan.sign] ?? '').trim();
        const credit = CREDIT_WORDS.test(flag) ? true : DEBIT_WORDS.test(flag) ? false : v > 0;
        parts.push({ x: credit ? X.in : X.out, str: fmt(Math.abs(v)) });
      } else if (splitUnsigned) {
        const credit = CARD_CREDIT.test(description);
        parts.push({ x: credit ? X.in : X.out, str: fmt(v) });
      } else if (cardStyle) {
        parts.push({ x: v < 0 ? X.in : X.out, str: fmt(Math.abs(v)) });
      } else {
        // A bank export: a minus is money out, a plus is money in.
        parts.push({ x: v < 0 ? X.out : X.in, str: fmt(Math.abs(v)) });
      }
    }
    if (plan.balance != null) {
      const b = amountOf(r, plan.balance);
      if (b != null) parts.push({ x: X.balance, str: fmt(b) });
    }
    const row: Row = cellsOf(parts);
    const fileCategory = plan.category != null ? (r[plan.category] ?? '').replace(/\s+/g, ' ').trim() : '';
    if (fileCategory) row.category = fileCategory;
    rows.push(row);
    dateOrderRows.push(row);
  }
  if (rows.length === 1) return { rows: [], period: null, warnings: ['csvNoColumns'] };
  if (dropped > 0) warnings.push('csvLinesSkipped');

  // The span of the lines: the statement's "period", which the parser uses for years and partial months.
  const order = numericDateOrder(dateOrderRows) ?? defaultDateOrder(language);
  let start: string | null = null;
  let end: string | null = null;
  for (const row of dateOrderRows) {
    const hit = findDates(row.cells[0].str, order)[0];
    const d = hit ? resolveDate(hit, null, today) : null;
    if (!d) continue;
    if (!start || d < start) start = d;
    if (!end || d > end) end = d;
  }
  const headerText = plan.headerRow != null ? (grid[plan.headerRow] ?? []).join(' ') : '';
  const kind: StatementKind | undefined = cardStyle || /\b(card|tarjeta|carte|karte|carta|カード|카드|信用卡)\b/iu.test(headerText) ? 'card' : 'bank';
  return { rows, period: start && end ? { start, end } : null, kind, warnings };
}

/**
 * Payments onto a card and money back, as their descriptions read on a card export ("AUTOPAY PAYMENT - THANK YOU",
 * "INTERNET PAYMENT", "CAPITAL ONE AUTOPAY PYMT"). Deliberately not a bare "payment"/"pagamento": every purchase on
 * an Italian or Spanish export is a "Pagamento POS".
 */
const CARD_CREDIT = /\b(autopay|auto ?pay|thank you|pymt|payment received|online payment|internet payment|mobile payment|electronic payment|payment - thank|pago recibido|paiement re[cç]u|zahlung erhalten|zahlungseingang|pagamento ricevuto|refund|reembolso|remboursement|erstattung|rimborso|cashback|statement credit|返金|払戻|환불|退款|還款|还款)\b/iu;
