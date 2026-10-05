import type { Accent, Attitude, CarryDecision, Category, CategoryTotal, Debt, DebtType, Goal, ImportRecord, KeywordMapping, MonthStats, Period, RecurringRule, Reminder, ReminderRepeat, Rollover, Settings, Tier, Transaction, TxType, Voice } from '@/types';
import { TIERS } from '@/lib/tiers';
import type { DB } from './database';
import { isValidDateString, monthKey, monthRange } from '@/lib/dates';

// ---------- row mappers ----------

type TxRow = {
  id: string; amount: number; type: TxType; category_id: string | null; note: string | null; raw_input: string | null;
  occurred_at: string; created_at: string; is_recurring_instance: number; recurring_rule_id: string | null;
  fingerprint?: string | null; import_id?: string | null;
};
const toTx = (r: TxRow): Transaction => ({
  id: r.id, amount: r.amount, type: r.type, categoryId: r.category_id, note: r.note, rawInput: r.raw_input,
  occurredAt: r.occurred_at, createdAt: r.created_at, isRecurringInstance: r.is_recurring_instance === 1, recurringRuleId: r.recurring_rule_id,
  fingerprint: r.fingerprint ?? null, importId: r.import_id ?? null,
});

type CatRow = { id: string; name: string; icon: string | null; kind: TxType; monthly_limit: number | null; is_default: number; archived: number; sort_order: number; rollover?: string | null; rollover_since?: string | null; tier?: string | null };
const ROLLOVERS: Rollover[] = ['reset', 'carry', 'ask'];
const toRollover = (v: unknown): Rollover => ((ROLLOVERS as unknown[]).includes(v) ? (v as Rollover) : 'reset');
const toCat = (r: CatRow): Category => ({
  id: r.id, name: r.name, icon: r.icon, kind: r.kind, monthlyLimit: r.monthly_limit, isDefault: r.is_default === 1, archived: r.archived === 1, sortOrder: r.sort_order,
  rollover: toRollover(r.rollover), rolloverSince: r.rollover_since && isValidDateString(r.rollover_since) ? r.rollover_since : null,
  tier: TIERS.includes(r.tier as Tier) ? (r.tier as Tier) : null,
});

type RuleRow = { id: string; amount: number; type: TxType; category_id: string | null; frequency: RecurringRule['frequency']; next_occurrence: string; note: string | null; active: number; anchor_day: number | null };
const toRule = (r: RuleRow): RecurringRule => ({
  id: r.id, amount: r.amount, type: r.type, categoryId: r.category_id, frequency: r.frequency, nextOccurrence: r.next_occurrence, note: r.note, active: r.active === 1, anchorDay: r.anchor_day ?? null,
});

type GoalRow = { id: string; name: string; kind: string | null; target_amount: number; current_amount: number; target_date: string | null; created_at: string; completed: number };
const toGoal = (r: GoalRow): Goal => ({
  id: r.id, name: r.name, kind: r.kind === 'debt' ? 'debt' : 'saving', targetAmount: r.target_amount, currentAmount: r.current_amount, targetDate: r.target_date, createdAt: r.created_at, completed: r.completed === 1,
});

type SettingsRow = { currency: string; theme: Settings['theme']; last_backup_at: string | null; starting_balance: number | null; onboarding_done: number; reminder_enabled: number; reminder_hour: number; smart_parse_enabled: number; language: string | null; app_lock: number | null; answer_mode: string | null; budget_period?: string | null; overall_limit?: number | null; voice?: string | null; attitude?: string | null; voice_gender?: string | null; accent?: string | null };
const ACCENTS: Accent[] = ['sage', 'ocean', 'plum', 'clay'];
export const toAccent = (v: unknown): Accent => ((ACCENTS as unknown[]).includes(v) ? (v as Accent) : 'sage');
const VOICES: Voice[] = ['plain', 'friend', 'coach', 'roaster'];
const ATTITUDES: Attitude[] = ['nice', 'playful', 'spicy'];
export const toVoice = (v: unknown): Voice => ((VOICES as unknown[]).includes(v) ? (v as Voice) : 'plain');
export const toAttitude = (v: unknown): Attitude => ((ATTITUDES as unknown[]).includes(v) ? (v as Attitude) : 'playful');
const toSettings = (r: SettingsRow): Settings => ({
  currency: r.currency, theme: r.theme, lastBackupAt: r.last_backup_at, startingBalance: r.starting_balance, onboardingDone: r.onboarding_done === 1,
  reminderEnabled: r.reminder_enabled === 1, reminderHour: r.reminder_hour, smartParseEnabled: r.smart_parse_enabled === 1, language: r.language ?? 'system', appLockEnabled: r.app_lock === 1, answerMode: r.answer_mode === 'text' || r.answer_mode === 'speak' ? r.answer_mode : 'auto',
  budgetPeriod: r.budget_period === 'pay' ? 'pay' : 'month', overallLimit: typeof r.overall_limit === 'number' && r.overall_limit > 0 ? r.overall_limit : null,
  voice: toVoice(r.voice), attitude: toAttitude(r.attitude), voiceGender: r.voice_gender === 'male' ? 'male' : 'female', accent: toAccent(r.accent),
});

// ---------- transactions ----------

export async function insertTransaction(db: DB, t: Transaction): Promise<void> {
  await db.runAsync(
    `INSERT INTO transactions (id, amount, type, category_id, note, raw_input, occurred_at, created_at, is_recurring_instance, recurring_rule_id, fingerprint, import_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [t.id, t.amount, t.type, t.categoryId, t.note, t.rawInput, t.occurredAt, t.createdAt, t.isRecurringInstance ? 1 : 0, t.recurringRuleId, t.fingerprint ?? null, t.importId ?? null],
  );
}

/** Every fingerprint of an imported line, so a re-imported statement adds nothing twice. */
export async function allFingerprints(db: DB): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ fingerprint: string }>('SELECT fingerprint FROM transactions WHERE fingerprint IS NOT NULL');
  return new Set(rows.map((r) => r.fingerprint));
}

// ---------- imports & debts ----------

type ImportRow = { id: string; kind: string; file_name: string; period_start: string | null; period_end: string | null; count: number; imported_at: string };
const toImport = (r: ImportRow): ImportRecord => ({ id: r.id, kind: r.kind === 'card' || r.kind === 'credit_report' ? r.kind : 'bank', fileName: r.file_name, periodStart: r.period_start, periodEnd: r.period_end, count: r.count, importedAt: r.imported_at });

export async function allImports(db: DB): Promise<ImportRecord[]> {
  const rows = await db.getAllAsync<ImportRow>('SELECT * FROM imports ORDER BY imported_at DESC');
  return rows.map(toImport);
}

export async function insertImport(db: DB, r: ImportRecord): Promise<void> {
  await db.runAsync('INSERT INTO imports (id, kind, file_name, period_start, period_end, count, imported_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [r.id, r.kind, r.fileName, r.periodStart, r.periodEnd, r.count, r.importedAt]);
}

const DEBT_TYPES: DebtType[] = ['credit_card', 'personal_loan', 'student_loan', 'auto_loan', 'mortgage', 'line_of_credit', 'other'];
type DebtRow = { id: string; creditor: string; type: string; balance: number; monthly_payment: number | null; credit_limit: number | null; apr: number | null; source: string; updated_at: string };
const toDebt = (r: DebtRow): Debt => ({
  id: r.id, creditor: r.creditor, type: (DEBT_TYPES as string[]).includes(r.type) ? (r.type as DebtType) : 'other', balance: r.balance, monthlyPayment: r.monthly_payment, creditLimit: r.credit_limit, apr: r.apr,
  source: r.source === 'credit_report' || r.source === 'card_statement' ? r.source : 'manual', updatedAt: r.updated_at,
});

export async function allDebts(db: DB): Promise<Debt[]> {
  const rows = await db.getAllAsync<DebtRow>('SELECT * FROM debts ORDER BY balance DESC');
  return rows.map(toDebt);
}

export async function upsertDebt(db: DB, d: Debt): Promise<void> {
  await db.runAsync(
    `INSERT INTO debts (id, creditor, type, balance, monthly_payment, credit_limit, apr, source, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET creditor = excluded.creditor, type = excluded.type, balance = excluded.balance, monthly_payment = excluded.monthly_payment, credit_limit = excluded.credit_limit, apr = excluded.apr, source = excluded.source, updated_at = excluded.updated_at`,
    [d.id, d.creditor, d.type, d.balance, d.monthlyPayment, d.creditLimit, d.apr, d.source, d.updatedAt],
  );
}

export async function deleteDebt(db: DB, id: string): Promise<void> {
  await db.runAsync('DELETE FROM debts WHERE id = ?', [id]);
}

export async function updateTransaction(db: DB, t: Transaction): Promise<void> {
  await db.runAsync(
    `UPDATE transactions SET amount = ?, type = ?, category_id = ?, note = ?, occurred_at = ? WHERE id = ?`,
    [t.amount, t.type, t.categoryId, t.note, t.occurredAt, t.id],
  );
}

export async function deleteTransaction(db: DB, id: string): Promise<void> {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

export async function getTransaction(db: DB, id: string): Promise<Transaction | null> {
  const row = await db.getFirstAsync<TxRow>('SELECT * FROM transactions WHERE id = ?', [id]);
  return row ? toTx(row) : null;
}

/** When the first entry was saved (not the date it is for), or null on a new phone. */
export async function firstSavedAt(db: DB): Promise<string | null> {
  const row = await db.getFirstAsync<{ first: string | null }>('SELECT MIN(created_at) AS first FROM transactions');
  return row?.first ?? null;
}

/** The entry saved most recently (by when it was saved, not the date it is for), for "make that 14". */
export async function latestSavedTransaction(db: DB): Promise<Transaction | null> {
  const row = await db.getFirstAsync<TxRow>('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 1');
  return row ? toTx(row) : null;
}

export async function recentTransactions(db: DB, limit = 10): Promise<Transaction[]> {
  const rows = await db.getAllAsync<TxRow>('SELECT * FROM transactions ORDER BY occurred_at DESC, created_at DESC LIMIT ?', [limit]);
  return rows.map(toTx);
}

export async function allTransactions(db: DB): Promise<Transaction[]> {
  const rows = await db.getAllAsync<TxRow>('SELECT * FROM transactions ORDER BY occurred_at DESC, created_at DESC');
  return rows.map(toTx);
}

export interface TransactionQuery {
  search?: string;
  type?: TxType | null;
  categoryId?: string | null;
  from?: string | null;
  to?: string | null;
  limit?: number;
  offset?: number;
}

/** `%` and `_` typed in a search box are letters to the person typing, not wildcards. */
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** The WHERE clause shared by the list and its totals, so both always describe the same rows. */
function filterTransactions(q: TransactionQuery): { where: string; params: (string | number)[] } {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (q.search && q.search.trim()) {
    where.push("(LOWER(COALESCE(note, '')) LIKE ? ESCAPE '\\' OR LOWER(COALESCE(raw_input, '')) LIKE ? ESCAPE '\\' OR CAST(amount AS TEXT) LIKE ? ESCAPE '\\')");
    const like = `%${escapeLike(q.search.trim().toLowerCase())}%`;
    params.push(like, like, like);
  }
  if (q.type) { where.push('type = ?'); params.push(q.type); }
  if (q.categoryId) { where.push('category_id = ?'); params.push(q.categoryId); }
  if (q.from) { where.push('occurred_at >= ?'); params.push(q.from); }
  if (q.to) { where.push('occurred_at <= ?'); params.push(q.to); }
  return { where: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

export async function queryTransactions(db: DB, q: TransactionQuery): Promise<Transaction[]> {
  const { where, params } = filterTransactions(q);
  const sql = `SELECT * FROM transactions ${where} ORDER BY occurred_at DESC, created_at DESC LIMIT ? OFFSET ?`;
  const rows = await db.getAllAsync<TxRow>(sql, [...params, q.limit ?? 200, q.offset ?? 0]);
  return rows.map(toTx);
}

/**
 * How many entries match a query and what they add up to, counted in SQL over
 * every match. The History screen shows these, so its one line stays true however
 * many rows the list itself has loaded.
 */
export async function queryTransactionTotals(db: DB, q: TransactionQuery): Promise<{ count: number; income: number; expenses: number }> {
  const { where, params } = filterTransactions(q);
  const sql = `SELECT type, SUM(amount) AS total, COUNT(*) AS n FROM transactions ${where} GROUP BY type`;
  const rows = await db.getAllAsync<{ type: TxType; total: number; n: number }>(sql, params);
  return {
    count: rows.reduce((s, r) => s + r.n, 0),
    income: rows.find((r) => r.type === 'income')?.total ?? 0,
    expenses: rows.find((r) => r.type === 'expense')?.total ?? 0,
  };
}

export async function monthStats(db: DB, month: string): Promise<MonthStats> {
  const { start, end } = monthRange(month);
  return periodStats(db, { start, end });
}

/** Income, spending and spending per category inside one budget period. */
export async function periodStats(db: DB, period: Period): Promise<MonthStats> {
  const { start, end } = period;
  const totals = await db.getAllAsync<{ type: TxType; total: number }>(
    'SELECT type, SUM(amount) AS total FROM transactions WHERE occurred_at BETWEEN ? AND ? GROUP BY type',
    [start, end],
  );
  const byCategoryRows = await db.getAllAsync<{ category_id: string | null; total: number; count: number }>(
    'SELECT category_id, SUM(amount) AS total, COUNT(*) AS count FROM transactions WHERE occurred_at BETWEEN ? AND ? AND type = \'expense\' GROUP BY category_id',
    [start, end],
  );
  const byCategory: CategoryTotal[] = byCategoryRows.map((r) => ({ categoryId: r.category_id, total: r.total, count: r.count }));
  return {
    month: monthKey(start),
    period: { start, end },
    income: totals.find((t) => t.type === 'income')?.total ?? 0,
    expenses: totals.find((t) => t.type === 'expense')?.total ?? 0,
    byCategory,
  };
}

/** Spending per category and day in a range, for working out carry-overs across past periods. */
export async function expenseTotalsByDay(db: DB, from: string, to: string): Promise<{ categoryId: string | null; occurredAt: string; total: number }[]> {
  const rows = await db.getAllAsync<{ category_id: string | null; occurred_at: string; total: number }>(
    "SELECT category_id, occurred_at, SUM(amount) AS total FROM transactions WHERE type = 'expense' AND occurred_at BETWEEN ? AND ? GROUP BY category_id, occurred_at",
    [from, to],
  );
  return rows.map((r) => ({ categoryId: r.category_id, occurredAt: r.occurred_at, total: r.total }));
}

// ---------- carry-over answers ----------

export async function allCarryovers(db: DB): Promise<CarryDecision[]> {
  return db.getAllAsync<CarryDecision>('SELECT category_id AS categoryId, period, amount FROM carryovers');
}

export async function upsertCarryover(db: DB, d: CarryDecision): Promise<void> {
  await db.runAsync('INSERT INTO carryovers (category_id, period, amount) VALUES (?, ?, ?) ON CONFLICT(category_id, period) DO UPDATE SET amount = excluded.amount', [d.categoryId, d.period, d.amount]);
}

export async function lifetimeTotals(db: DB): Promise<{ income: number; expenses: number }> {
  const totals = await db.getAllAsync<{ type: TxType; total: number }>('SELECT type, SUM(amount) AS total FROM transactions GROUP BY type');
  return {
    income: totals.find((t) => t.type === 'income')?.total ?? 0,
    expenses: totals.find((t) => t.type === 'expense')?.total ?? 0,
  };
}

// ---------- categories ----------

export async function allCategories(db: DB): Promise<Category[]> {
  const rows = await db.getAllAsync<CatRow>('SELECT * FROM categories ORDER BY sort_order ASC, name ASC');
  return rows.map(toCat);
}

export async function upsertCategory(db: DB, c: Category): Promise<void> {
  await db.runAsync(
    `INSERT INTO categories (id, name, icon, kind, monthly_limit, is_default, archived, sort_order, rollover, rollover_since, tier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, icon = excluded.icon, kind = excluded.kind, monthly_limit = excluded.monthly_limit, archived = excluded.archived, sort_order = excluded.sort_order, rollover = excluded.rollover, rollover_since = excluded.rollover_since, tier = excluded.tier`,
    [c.id, c.name, c.icon, c.kind, c.monthlyLimit, c.isDefault ? 1 : 0, c.archived ? 1 : 0, c.sortOrder, c.rollover ?? 'reset', c.rolloverSince ?? null, c.tier ?? null],
  );
}

export async function deleteCategory(db: DB, id: string): Promise<void> {
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

export async function countTransactionsInCategory(db: DB, id: string): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM transactions WHERE category_id = ?', [id]);
  return row?.n ?? 0;
}

// ---------- recurring rules ----------

export async function allRules(db: DB): Promise<RecurringRule[]> {
  const rows = await db.getAllAsync<RuleRow>('SELECT * FROM recurring_rules ORDER BY next_occurrence ASC');
  return rows.map(toRule);
}

export async function upsertRule(db: DB, r: RecurringRule): Promise<void> {
  await db.runAsync(
    `INSERT INTO recurring_rules (id, amount, type, category_id, frequency, next_occurrence, note, active, anchor_day) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET amount = excluded.amount, type = excluded.type, category_id = excluded.category_id, frequency = excluded.frequency, next_occurrence = excluded.next_occurrence, note = excluded.note, active = excluded.active, anchor_day = excluded.anchor_day`,
    [r.id, r.amount, r.type, r.categoryId, r.frequency, r.nextOccurrence, r.note, r.active ? 1 : 0, r.anchorDay ?? null],
  );
}

export async function deleteRule(db: DB, id: string): Promise<void> {
  await db.runAsync('DELETE FROM recurring_rules WHERE id = ?', [id]);
}

// ---------- goals ----------

export async function allGoals(db: DB): Promise<Goal[]> {
  const rows = await db.getAllAsync<GoalRow>('SELECT * FROM goals ORDER BY completed ASC, created_at DESC');
  return rows.map(toGoal);
}

export async function upsertGoal(db: DB, g: Goal): Promise<void> {
  await db.runAsync(
    `INSERT INTO goals (id, name, kind, target_amount, current_amount, target_date, created_at, completed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, kind = excluded.kind, target_amount = excluded.target_amount, current_amount = excluded.current_amount, target_date = excluded.target_date, completed = excluded.completed`,
    [g.id, g.name, g.kind ?? 'saving', g.targetAmount, g.currentAmount, g.targetDate, g.createdAt, g.completed ? 1 : 0],
  );
}

export async function deleteGoal(db: DB, id: string): Promise<void> {
  await db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
}

// ---------- reminders ----------

type ReminderRow = { id: string; text: string; due_at: string; repeat: string; notification_id: string | null; created_at: string };
const REPEATS: ReminderRepeat[] = ['none', 'daily', 'weekly', 'monthly'];
const toReminder = (r: ReminderRow): Reminder => ({
  id: r.id, text: r.text, date: r.due_at.slice(0, 10), time: r.due_at.slice(11, 16) || '09:00',
  repeat: (REPEATS as string[]).includes(r.repeat) ? (r.repeat as ReminderRepeat) : 'none', notificationId: r.notification_id, createdAt: r.created_at,
});

export async function allReminders(db: DB): Promise<Reminder[]> {
  const rows = await db.getAllAsync<ReminderRow>('SELECT * FROM reminders ORDER BY due_at ASC');
  return rows.map(toReminder);
}

export async function upsertReminder(db: DB, r: Reminder): Promise<void> {
  await db.runAsync(
    `INSERT INTO reminders (id, text, due_at, repeat, notification_id, created_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET text = excluded.text, due_at = excluded.due_at, repeat = excluded.repeat, notification_id = excluded.notification_id`,
    [r.id, r.text, `${r.date}T${r.time}`, r.repeat, r.notificationId, r.createdAt],
  );
}

export async function deleteReminder(db: DB, id: string): Promise<void> {
  await db.runAsync('DELETE FROM reminders WHERE id = ?', [id]);
}

// ---------- settings ----------

export async function getSettings(db: DB): Promise<Settings> {
  const row = await db.getFirstAsync<SettingsRow>('SELECT * FROM settings WHERE id = 1');
  if (!row) throw new Error('settings row missing');
  return toSettings(row);
}

export async function saveSettings(db: DB, s: Settings): Promise<void> {
  await db.runAsync(
    `UPDATE settings SET currency = ?, theme = ?, last_backup_at = ?, starting_balance = ?, onboarding_done = ?, reminder_enabled = ?, reminder_hour = ?, smart_parse_enabled = ?, language = ?, app_lock = ?, answer_mode = ?, budget_period = ?, overall_limit = ?, voice = ?, attitude = ?, voice_gender = ?, accent = ? WHERE id = 1`,
    [s.currency, s.theme, s.lastBackupAt, s.startingBalance, s.onboardingDone ? 1 : 0, s.reminderEnabled ? 1 : 0, s.reminderHour, s.smartParseEnabled ? 1 : 0, s.language ?? 'system', s.appLockEnabled ? 1 : 0, s.answerMode ?? 'auto', s.budgetPeriod === 'pay' ? 'pay' : 'month', s.overallLimit ?? null, toVoice(s.voice), toAttitude(s.attitude), s.voiceGender === 'male' ? 'male' : 'female', toAccent(s.accent)],
  );
}

// ---------- learned keywords ----------

export async function allKeywords(db: DB): Promise<KeywordMapping[]> {
  return db.getAllAsync<KeywordMapping>('SELECT word, category_id AS categoryId FROM keyword_mappings');
}

export async function upsertKeyword(db: DB, word: string, categoryId: string): Promise<void> {
  await db.runAsync('INSERT INTO keyword_mappings (word, category_id) VALUES (?, ?) ON CONFLICT(word) DO UPDATE SET category_id = excluded.category_id', [word, categoryId]);
}

export async function deleteKeyword(db: DB, word: string): Promise<void> {
  await db.runAsync('DELETE FROM keyword_mappings WHERE word = ?', [word]);
}

// ---------- small app state (not user data, not backed up) ----------

export async function getAppState(db: DB, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_state WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function setAppState(db: DB, key: string, value: string): Promise<void> {
  await db.runAsync('INSERT INTO app_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, value]);
}

// ---------- backup / restore ----------

export async function replaceAllData(
  db: DB,
  data: { settings: Settings; categories: Category[]; transactions: Transaction[]; recurringRules: RecurringRule[]; goals: Goal[]; keywords: KeywordMapping[]; reminders?: Reminder[]; debts?: Debt[]; imports?: ImportRecord[]; carryovers?: CarryDecision[] },
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM transactions; DELETE FROM recurring_rules; DELETE FROM goals; DELETE FROM keyword_mappings; DELETE FROM categories; DELETE FROM reminders; DELETE FROM imports; DELETE FROM debts; DELETE FROM carryovers;');
    for (const c of data.categories) {
      await db.runAsync('INSERT INTO categories (id, name, icon, kind, monthly_limit, is_default, archived, sort_order, rollover, rollover_since, tier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [c.id, c.name, c.icon, c.kind, c.monthlyLimit, c.isDefault ? 1 : 0, c.archived ? 1 : 0, c.sortOrder, c.rollover ?? 'reset', c.rolloverSince ?? null, c.tier ?? null]);
    }
    for (const d of data.carryovers ?? []) {
      await db.runAsync('INSERT OR REPLACE INTO carryovers (category_id, period, amount) VALUES (?, ?, ?)', [d.categoryId, d.period, d.amount]);
    }
    for (const r of data.recurringRules) {
      await db.runAsync('INSERT INTO recurring_rules (id, amount, type, category_id, frequency, next_occurrence, note, active, anchor_day) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.amount, r.type, r.categoryId, r.frequency, r.nextOccurrence, r.note, r.active ? 1 : 0, r.anchorDay ?? null]);
    }
    for (const r of data.imports ?? []) {
      await db.runAsync('INSERT INTO imports (id, kind, file_name, period_start, period_end, count, imported_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.kind, r.fileName, r.periodStart, r.periodEnd, r.count, r.importedAt]);
    }
    for (const t of data.transactions) {
      await db.runAsync('INSERT INTO transactions (id, amount, type, category_id, note, raw_input, occurred_at, created_at, is_recurring_instance, recurring_rule_id, fingerprint, import_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [t.id, t.amount, t.type, t.categoryId, t.note, t.rawInput, t.occurredAt, t.createdAt, t.isRecurringInstance ? 1 : 0, t.recurringRuleId, t.fingerprint ?? null, t.importId ?? null]);
    }
    for (const g of data.goals) {
      await db.runAsync('INSERT INTO goals (id, name, kind, target_amount, current_amount, target_date, created_at, completed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [g.id, g.name, g.kind === 'debt' ? 'debt' : 'saving', g.targetAmount, g.currentAmount, g.targetDate, g.createdAt, g.completed ? 1 : 0]);
    }
    for (const k of data.keywords) {
      await db.runAsync('INSERT OR IGNORE INTO keyword_mappings (word, category_id) VALUES (?, ?)', [k.word, k.categoryId]);
    }
    for (const r of data.reminders ?? []) {
      // Notification ids are never restored: the store re-arms every reminder afterwards.
      await db.runAsync('INSERT INTO reminders (id, text, due_at, repeat, notification_id, created_at) VALUES (?, ?, ?, ?, NULL, ?)',
        [r.id, r.text, `${r.date}T${r.time}`, r.repeat, r.createdAt]);
    }
    for (const d of data.debts ?? []) {
      await db.runAsync('INSERT INTO debts (id, creditor, type, balance, monthly_payment, credit_limit, apr, source, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [d.id, d.creditor, d.type, d.balance, d.monthlyPayment, d.creditLimit, d.apr, d.source, d.updatedAt]);
    }
    const s = data.settings;
    await db.runAsync(
      'UPDATE settings SET currency = ?, theme = ?, last_backup_at = ?, starting_balance = ?, onboarding_done = 1, reminder_enabled = ?, reminder_hour = ?, smart_parse_enabled = ?, language = ?, app_lock = ?, answer_mode = ?, budget_period = ?, overall_limit = ?, voice = ?, attitude = ?, voice_gender = ?, accent = ? WHERE id = 1',
      [s.currency, s.theme, s.lastBackupAt, s.startingBalance, s.reminderEnabled ? 1 : 0, s.reminderHour, s.smartParseEnabled ? 1 : 0, s.language ?? 'system', s.appLockEnabled ? 1 : 0, s.answerMode ?? 'auto', s.budgetPeriod === 'pay' ? 'pay' : 'month', s.overallLimit ?? null, toVoice(s.voice), toAttitude(s.attitude), s.voiceGender === 'male' ? 'male' : 'female', toAccent(s.accent)],
    );
  });
}
