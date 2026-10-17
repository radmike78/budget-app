/**
 * Input validation at the app's trust boundaries: what the user types or says,
 * what a backup file claims to contain, and what the optional Smart Assist
 * model replies. Everything here is pure so `npm test` can throw hostile
 * input at it. Covers OWASP MASVS-CODE-4 (input validation) and the storage
 * side of MASVS-STORAGE (nothing untrusted reaches SQLite unchecked).
 */
import type { CarryDecision, Category, Debt, DebtType, Frequency, Goal, ImportRecord, KeywordMapping, RecurringRule, Reminder, ReminderRepeat, Rollover, Settings, Tier, Transaction, TxType } from '@/types';
import { TIERS } from './tiers';
import { addDays, isValidDateString } from './dates';
import { advance } from './recurring';
import { DEFAULT_CATEGORIES } from './defaultCategories';

/** A spoken entry is a sentence or two; anything longer is not an entry. */
export const MAX_ENTRY_LENGTH = 400;
export const MAX_TEXT_FIELD = 200;
export const MAX_NOTE_LENGTH = 500;
export const MAX_ROWS = 200_000;
/** Nobody has a thousand repeating entries; a file that claims to is refused rather than logged on every launch. */
export const MAX_RULES = 1000;
export { MAX_AMOUNT } from './money';
import { MAX_AMOUNT } from './money';
/** Backup files above this are refused before JSON.parse runs. */
export const MAX_BACKUP_BYTES = 50 * 1024 * 1024;
export const MIN_PASSPHRASE_LENGTH = 8;

// C0/C1 controls, zero-width and bidi-override characters (Trojan Source), BOM.
const CONTROL_CHARS = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F\\u200B-\\u200F\\u202A-\\u202E\\u2066-\\u2069\\uFEFF]', 'g');
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
/** Ids that would read as something else: a route ("new") or a built-in property of every object ("constructor"). */
const isReservedId = (v: string): boolean => v === 'new' || v in Object.prototype;
const DEFAULT_CATEGORY_IDS = new Set(DEFAULT_CATEGORIES.map((c) => c.id));
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/;
const FREQUENCIES: Frequency[] = ['weekly', 'biweekly', 'monthly', 'yearly'];
const REPEATS: ReminderRepeat[] = ['none', 'daily', 'weekly', 'monthly'];
const DEBT_TYPES: DebtType[] = ['credit_card', 'personal_loan', 'student_loan', 'auto_loan', 'mortgage', 'line_of_credit', 'other'];
const DEBT_SOURCES: Debt['source'][] = ['credit_report', 'card_statement', 'manual'];
const ROLLOVERS: Rollover[] = ['reset', 'carry', 'ask'];
const IMPORT_KINDS: ImportRecord['kind'][] = ['bank', 'card', 'credit_report'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
/** Statement fingerprints are two short hashes; anything else is not one. */
const FINGERPRINT_RE = /^[A-Za-z0-9]{1,64}$/;
/** Percent per year; nothing real is above this. */
const MAX_APR = 1000;

/**
 * Trims, caps and strips control and bidi-override characters from free text.
 * Letters, digits, punctuation and emoji in every script pass through untouched.
 */
export function cleanText(input: unknown, max = MAX_TEXT_FIELD): string {
  if (typeof input !== 'string') return '';
  return input.replace(CONTROL_CHARS, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Same for a typed or spoken entry: newlines are kept (they separate sentences). */
export function cleanEntry(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(CONTROL_CHARS, '').trim().slice(0, MAX_ENTRY_LENGTH);
}

// Card numbers (13-19 digits, plain or in groups of 4 / 4-6-5), account and routing numbers
// (8+ contiguous digits), IBANs, and masked forms like "XXXX1234" or "ending in 1234".
const CARD_GROUPED_RE = /\b\d{4}(?:[ .-]\d{4}){2,4}\b|\b\d{4}[ .-]\d{6}[ .-]\d{4,5}\b/g;
// US social security numbers and e-mail addresses: never part of an entry, never sent anywhere.
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
const LONG_DIGITS_RE = /\b\d{8,19}\b/g;
const IBAN_RE = /\b[A-Z]{2}\d{2}(?:[ -]?[A-Z0-9]{4}){2,7}(?:[ -]?[A-Z0-9]{1,4})?\b/gi;
const MASKED_RE = /(?:[xX*•·#]{2,}\s?[-]?\s?\d{2,6}\b)|(?:\b(?:ending(?: in)?|last four|acct|account|card|a\/c|iban|routing|no\.?)\s*(?:number|#|no\.?)?\s*:?\s*[xX*•·]*\s?\d{4,}\b)/gi;

/**
 * Removes bank account, card, routing and IBAN numbers from free text so they
 * are never stored. Amounts, dates and short numbers ("Phillips 66", "2 coffees") stay.
 */
export function redactSensitive(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(EMAIL_RE, ' ')
    .replace(IBAN_RE, ' ')
    .replace(CARD_GROUPED_RE, ' ')
    .replace(SSN_RE, ' ')
    .replace(LONG_DIGITS_RE, ' ')
    .replace(MASKED_RE, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * For text that must keep a value (a goal's name, a reminder, a creditor): the redacted text, or when nothing but
 * a number was there, that number masked down to its last four digits.
 */
export function redactOrMask(input: string): string {
  return redactSensitive(input) || input.replace(/\d(?=\d{4})/g, '•');
}

export class BackupValidationError extends Error {
  constructor(public readonly reason: string) {
    super(`Invalid backup: ${reason}`);
    this.name = 'BackupValidationError';
  }
}

export interface ValidBackupData {
  settings: Settings;
  categories: Category[];
  transactions: Transaction[];
  recurringRules: RecurringRule[];
  goals: Goal[];
  keywords: KeywordMapping[];
  reminders: Reminder[];
  debts: Debt[];
  imports: ImportRecord[];
  carryovers: CarryDecision[];
}

const fail = (reason: string): never => { throw new BackupValidationError(reason); };
const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
function assertObj(x: unknown, what: string): asserts x is Record<string, unknown> {
  if (!isObj(x)) fail(what);
}
const id = (v: unknown, what: string): string => (typeof v === 'string' && ID_RE.test(v) && !isReservedId(v) ? v : fail(`${what} id`));
const optId = (v: unknown, what: string): string | null => (v == null || v === '' ? null : id(v, what));
const money = (v: unknown, what: string): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n) || n < 0 || n > MAX_AMOUNT) fail(`${what} amount`);
  return Math.round(n * 100) / 100;
};
const bool = (v: unknown): boolean => v === true || v === 1 || v === '1' || v === 'true';
const day = (v: unknown, what: string): string => (typeof v === 'string' && DATE_RE.test(v) && isValidDateString(v) ? v : fail(`${what} date`));
const optDay = (v: unknown, what: string): string | null => (v == null || v === '' ? null : day(v, what));
const optMoney = (v: unknown, what: string): number | null => (v == null || v === '' ? null : money(v, what));
const oneOf = <T extends string>(v: unknown, values: readonly T[], what: string): T => (values.find((x) => x === v) ?? fail(what)) as T;
const stamp = (v: unknown, fallback: string): string => (typeof v === 'string' && ISO_RE.test(v) ? v : fallback);
const txType = (v: unknown, what: string): TxType => (v === 'income' || v === 'expense' ? v : fail(`${what} type`));
const text = (v: unknown, max: number, what: string, required = false): string => {
  const s = cleanText(v, max);
  if (required && !s) fail(what);
  return s;
};
const list = (v: unknown, what: string): unknown[] => {
  if (v == null) return [];
  if (!Array.isArray(v)) fail(`${what} list`);
  const arr = v as unknown[];
  if (arr.length > MAX_ROWS) fail(`${what} too many rows`);
  return arr;
};

/**
 * Turns an untrusted parsed JSON value into clean, typed backup data, or throws
 * BackupValidationError naming the first problem. Every row is rebuilt from
 * scratch, so unknown fields, prototype keys and wrong types never reach SQLite.
 */
export function validateBackup(payload: unknown, now: string): ValidBackupData {
  assertObj(payload, 'not an object');
  const o = payload;
  if (o.app !== 'onlybudget') fail('app');
  if (typeof o.version !== 'number' || !Number.isInteger(o.version) || o.version < 1 || o.version > 10) fail('version');
  const s = o.settings;
  assertObj(s, 'settings');

  const categories: Category[] = [];
  const seenCat = new Set<string>();
  for (const raw of list(o.categories, 'categories')) {
    assertObj(raw, 'category');
    const cid = id(raw.id, 'category');
    if (seenCat.has(cid)) fail('duplicate category id');
    seenCat.add(cid);
    const limit = raw.monthlyLimit == null ? null : money(raw.monthlyLimit, 'category limit');
    const rollover = raw.rollover == null ? 'reset' : oneOf(raw.rollover, ROLLOVERS, 'category rollover');
    // An unknown or missing tier is dropped; the app falls back to the category's default.
    const tier = TIERS.includes(raw.tier as Tier) ? (raw.tier as Tier) : null;
    categories.push({
      rollover,
      tier,
      rolloverSince: rollover !== 'reset' && typeof raw.rolloverSince === 'string' && isValidDateString(raw.rolloverSince) ? raw.rolloverSince : null,
      id: cid,
      name: text(raw.name, 60, 'category name', true),
      icon: raw.icon == null ? null : text(raw.icon, 8, 'category icon') || null,
      kind: txType(raw.kind, 'category'),
      monthlyLimit: limit,
      // Only the app's own categories are defaults (their names are translated by id).
      isDefault: bool(raw.isDefault) && DEFAULT_CATEGORY_IDS.has(cid),
      archived: bool(raw.archived),
      sortOrder: typeof raw.sortOrder === 'number' && Number.isFinite(raw.sortOrder) ? Math.trunc(raw.sortOrder) : categories.length,
    });
  }
  if (categories.length === 0) fail('no categories');
  const catRef = (v: unknown, what: string): string | null => {
    const c = optId(v, what);
    return c && seenCat.has(c) ? c : null;
  };

  const recurringRules: RecurringRule[] = [];
  const seenRule = new Set<string>();
  const ruleList = list(o.recurringRules, 'recurring rules');
  if (ruleList.length > MAX_RULES) fail('recurring rules too many rows');
  // An active rule a long way behind would log every missed date on each launch: it restarts within the last year.
  const today = now.slice(0, 10);
  const yearAgo = isValidDateString(today) ? addDays(today, -366) : null;
  for (const raw of ruleList) {
    assertObj(raw, 'recurring rule');
    const rid = id(raw.id, 'recurring rule');
    if (seenRule.has(rid)) fail('duplicate rule id');
    seenRule.add(rid);
    const frequency = FREQUENCIES.find((f) => f === raw.frequency);
    if (!frequency) fail('rule frequency');
    const anchorDay = typeof raw.anchorDay === 'number' && Number.isInteger(raw.anchorDay) && raw.anchorDay >= 1 && raw.anchorDay <= 31 ? raw.anchorDay : null;
    const active = raw.active == null ? true : bool(raw.active);
    let nextOccurrence = day(raw.nextOccurrence, 'rule next');
    if (nextOccurrence < '2000-01-01') fail('rule next date');
    if (active && yearAgo && nextOccurrence < yearAgo) {
      const anchor = anchorDay ?? Number(nextOccurrence.slice(8, 10));
      for (let guard = 0; nextOccurrence < yearAgo && guard < 2000; guard += 1) nextOccurrence = advance(nextOccurrence, frequency as Frequency, anchor);
    }
    recurringRules.push({
      id: rid,
      amount: money(raw.amount, 'rule'),
      type: txType(raw.type, 'rule'),
      categoryId: catRef(raw.categoryId, 'rule category'),
      frequency: frequency as Frequency,
      nextOccurrence,
      // The day the rule was set on, so a monthly rule on the 31st keeps returning to the 31st after a restore.
      anchorDay,
      note: redactSensitive(text(raw.note, MAX_NOTE_LENGTH, 'rule note')) || null,
      active,
    });
  }

  // Older backups (version 1) carry no imports, debts or reminders; `list` treats a missing table as empty.
  const imports: ImportRecord[] = [];
  const seenImport = new Set<string>();
  for (const raw of list(o.imports, 'imports')) {
    assertObj(raw, 'import');
    const iid = id(raw.id, 'import');
    if (seenImport.has(iid)) fail('duplicate import id');
    seenImport.add(iid);
    const count = typeof raw.count === 'number' ? raw.count : typeof raw.count === 'string' ? Number(raw.count) : 0;
    if (!Number.isFinite(count) || count < 0 || count > MAX_ROWS) fail('import count');
    imports.push({
      id: iid,
      kind: oneOf(raw.kind, IMPORT_KINDS, 'import kind'),
      // The app never keeps a statement's file name (it often carries an account number).
      fileName: '',
      periodStart: optDay(raw.periodStart, 'import period'),
      periodEnd: optDay(raw.periodEnd, 'import period'),
      count: Math.trunc(count),
      importedAt: stamp(raw.importedAt, now),
    });
  }

  const transactions: Transaction[] = [];
  const seenTx = new Set<string>();
  for (const raw of list(o.transactions, 'transactions')) {
    assertObj(raw, 'transaction');
    const tid = id(raw.id, 'transaction');
    if (seenTx.has(tid)) fail('duplicate transaction id');
    seenTx.add(tid);
    const ruleId = optId(raw.recurringRuleId, 'transaction rule');
    const importId = optId(raw.importId, 'transaction import');
    const fingerprint = raw.fingerprint == null || raw.fingerprint === '' ? null : typeof raw.fingerprint === 'string' && FINGERPRINT_RE.test(raw.fingerprint) ? raw.fingerprint : fail('transaction fingerprint');
    transactions.push({
      id: tid,
      amount: money(raw.amount, 'transaction'),
      type: txType(raw.type, 'transaction'),
      categoryId: catRef(raw.categoryId, 'transaction category'),
      note: text(raw.note, MAX_NOTE_LENGTH, 'note') || null,
      rawInput: text(raw.rawInput, MAX_ENTRY_LENGTH, 'raw input') || null,
      occurredAt: day(raw.occurredAt, 'transaction'),
      createdAt: stamp(raw.createdAt, now),
      isRecurringInstance: bool(raw.isRecurringInstance),
      recurringRuleId: ruleId && seenRule.has(ruleId) ? ruleId : null,
      fingerprint,
      importId: importId && seenImport.has(importId) ? importId : null,
    });
  }

  const goals: Goal[] = [];
  const seenGoal = new Set<string>();
  for (const raw of list(o.goals, 'goals')) {
    assertObj(raw, 'goal');
    const gid = id(raw.id, 'goal');
    if (seenGoal.has(gid)) fail('duplicate goal id');
    seenGoal.add(gid);
    goals.push({
      id: gid,
      name: text(raw.name, 80, 'goal name', true),
      kind: raw.kind === 'debt' ? 'debt' : 'saving',
      targetAmount: money(raw.targetAmount, 'goal target'),
      currentAmount: money(raw.currentAmount ?? 0, 'goal current'),
      targetDate: optDay(raw.targetDate, 'goal'),
      createdAt: stamp(raw.createdAt, now),
      completed: bool(raw.completed),
      startingAmount: raw.startingAmount == null ? null : money(raw.startingAmount, 'goal start'),
    });
  }

  const keywords: KeywordMapping[] = [];
  const seenWord = new Set<string>();
  for (const raw of list(o.keywords, 'keywords')) {
    assertObj(raw, 'keyword');
    const word = cleanText(raw.word, 40).toLowerCase();
    const cat = catRef(raw.categoryId, 'keyword category');
    if (!word || !cat || seenWord.has(word)) continue;
    seenWord.add(word);
    keywords.push({ word, categoryId: cat });
  }

  const reminders: Reminder[] = [];
  const seenReminder = new Set<string>();
  for (const raw of list(o.reminders, 'reminders')) {
    assertObj(raw, 'reminder');
    const rid = id(raw.id, 'reminder');
    if (seenReminder.has(rid)) fail('duplicate reminder id');
    seenReminder.add(rid);
    reminders.push({
      id: rid,
      text: text(raw.text, MAX_TEXT_FIELD, 'reminder text', true),
      date: day(raw.date, 'reminder'),
      time: typeof raw.time === 'string' && TIME_RE.test(raw.time) ? raw.time : fail('reminder time'),
      repeat: oneOf(raw.repeat ?? 'none', REPEATS, 'reminder repeat'),
      // A notification id belongs to the phone that scheduled it; reminders are re-armed after a restore.
      notificationId: null,
      createdAt: stamp(raw.createdAt, now),
    });
  }

  const debts: Debt[] = [];
  const seenDebt = new Set<string>();
  for (const raw of list(o.debts, 'debts')) {
    assertObj(raw, 'debt');
    const did = id(raw.id, 'debt');
    if (seenDebt.has(did)) fail('duplicate debt id');
    seenDebt.add(did);
    const aprRaw = raw.apr == null || raw.apr === '' ? null : Number(raw.apr);
    if (aprRaw != null && (!Number.isFinite(aprRaw) || aprRaw < 0 || aprRaw > MAX_APR)) fail('debt apr');
    debts.push({
      id: did,
      creditor: text(raw.creditor, 80, 'debt creditor', true),
      type: oneOf(raw.type ?? 'other', DEBT_TYPES, 'debt type'),
      balance: money(raw.balance ?? 0, 'debt balance'),
      monthlyPayment: optMoney(raw.monthlyPayment, 'debt payment'),
      creditLimit: optMoney(raw.creditLimit, 'debt limit'),
      apr: aprRaw == null ? null : Math.round(aprRaw * 100) / 100,
      source: oneOf(raw.source ?? 'manual', DEBT_SOURCES, 'debt source'),
      updatedAt: stamp(raw.updatedAt, now),
    });
  }

  const theme = s.theme === 'light' || s.theme === 'dark' ? s.theme : 'system';
  const hour = typeof s.reminderHour === 'number' && Number.isInteger(s.reminderHour) && s.reminderHour >= 0 && s.reminderHour <= 23 ? s.reminderHour : 20;
  const balanceRaw = s.startingBalance == null ? NaN : Number(s.startingBalance);
  const settings: Settings = {
    currency: typeof s.currency === 'string' && /^[A-Z]{3}$/.test(s.currency) ? s.currency : 'USD',
    theme,
    lastBackupAt: typeof s.lastBackupAt === 'string' && ISO_RE.test(s.lastBackupAt) ? s.lastBackupAt : null,
    startingBalance: Number.isFinite(balanceRaw) && Math.abs(balanceRaw) <= MAX_AMOUNT ? Math.round(balanceRaw * 100) / 100 : null,
    onboardingDone: true,
    // Nothing schedules the daily reminder after a restore, so the switch starts off.
    reminderEnabled: false,
    reminderHour: hour,
    // Security-sensitive switches never come from a file: the user turns them on by hand.
    smartParseEnabled: false,
    appLockEnabled: false,
    language: typeof s.language === 'string' && /^(?:[a-z]{2}(?:-[A-Za-z]{2,4})?|system)$/.test(s.language) ? s.language : 'system',
    answerMode: s.answerMode === 'text' || s.answerMode === 'speak' ? s.answerMode : 'auto',
    budgetPeriod: s.budgetPeriod === 'pay' ? 'pay' : 'month',
    overallLimit: s.overallLimit == null ? null : optMoney(s.overallLimit, 'overall plan'),
    voice: s.voice === 'friend' || s.voice === 'coach' || s.voice === 'roaster' ? s.voice : 'plain',
    attitude: s.attitude === 'nice' || s.attitude === 'spicy' ? s.attitude : 'playful',
    voiceGender: s.voiceGender === 'male' ? 'male' : 'female',
    accent: s.accent === 'ocean' || s.accent === 'plum' || s.accent === 'clay' ? s.accent : 'sage',
  };

  const carryovers: CarryDecision[] = [];
  const seenCarry = new Set<string>();
  for (const raw of list(o.carryovers ?? [], 'carryovers')) {
    assertObj(raw, 'carryover');
    const cid = catRef(raw.categoryId, 'carryover category');
    if (!cid || typeof raw.period !== 'string' || !isValidDateString(raw.period)) continue;
    const key = `${cid}|${raw.period}`;
    if (seenCarry.has(key)) continue;
    seenCarry.add(key);
    carryovers.push({ categoryId: cid, period: raw.period, amount: money(raw.amount, 'carryover amount') });
  }

  return { settings, categories, transactions, recurringRules, goals, keywords, reminders, debts, imports, carryovers };
}

/** Shape the Smart Assist model is asked for; everything is re-checked here. */
export interface AssistReply {
  amount: number | null;
  type: TxType;
  category: string | null;
  note: string | null;
  kind: 'transaction' | 'goal';
  goal_name: string | null;
  goal_kind: 'saving' | 'debt' | null;
  target_date: string | null;
}

/** Returns a clean reply or null when the model's JSON is not what was asked for. */
export function validateAssistReply(raw: unknown): AssistReply | null {
  if (!isObj(raw)) return null;
  const type = raw.type === 'income' ? 'income' : raw.type === 'expense' ? 'expense' : null;
  if (!type) return null;
  const kind = raw.kind === 'goal' ? 'goal' : raw.kind === 'transaction' ? 'transaction' : null;
  if (!kind) return null;
  const n = typeof raw.amount === 'number' ? raw.amount : typeof raw.amount === 'string' ? Number(raw.amount) : NaN;
  const amount = Number.isFinite(n) && Math.abs(n) <= MAX_AMOUNT && n !== 0 ? Math.round(Math.abs(n) * 100) / 100 : null;
  const target = typeof raw.target_date === 'string' && DATE_RE.test(raw.target_date) && isValidDateString(raw.target_date) ? raw.target_date : null;
  return {
    amount,
    type,
    category: cleanText(raw.category, 60) || null,
    note: cleanText(raw.note, MAX_NOTE_LENGTH) || null,
    kind,
    goal_name: cleanText(raw.goal_name, 80) || null,
    goal_kind: raw.goal_kind === 'debt' ? 'debt' : raw.goal_kind === 'saving' ? 'saving' : null,
    target_date: target,
  };
}
