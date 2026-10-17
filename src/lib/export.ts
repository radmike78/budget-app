/**
 * Builders for the export formats. Pure functions; file writing lives in files.ts.
 */
import type { CarryDecision, Category, Debt, Goal, ImportRecord, KeywordMapping, RecurringRule, Reminder, Settings, Transaction } from '@/types';
import type { LocaleDef } from '@/i18n/types';
import { en } from '@/i18n/locales/en';
import { localDay, longDate, monthLabel, monthKey } from './dates';
import { formatMoney } from './money';

/**
 * v2 added reminders, debts, imports and the transactions' statement fingerprints.
 * v3 adds the budget period, the overall plan, category roll-over and its answers.
 * v4 adds the voice and attitude settings, v5 the spoken voice's gender, v6 the accent colour.
 */
export const BACKUP_VERSION = 6;

export interface BackupPayload {
  app: 'onlybudget';
  version: number;
  exportedAt: string;
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

/** A cell starting with one of these would be run as a formula by spreadsheets (CSV injection). */
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(v: string | number | null | undefined): string {
  if (v == null) return '';
  let s = String(v);
  if (FORMULA_START.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function transactionsToCsv(transactions: Transaction[], categories: Category[], nameOf: (c: Category) => string = (c) => c.name): string {
  const byId = new Map(categories.map((c) => [c.id, nameOf(c)]));
  const header = ['date', 'type', 'amount', 'category', 'note', 'recurring', 'original_input', 'id'];
  const rows = [...transactions]
    .sort((a, b) => (a.occurredAt < b.occurredAt ? -1 : a.occurredAt > b.occurredAt ? 1 : a.createdAt.localeCompare(b.createdAt)))
    .map((t) => [
      t.occurredAt,
      t.type,
      t.amount.toFixed(2),
      t.categoryId ? byId.get(t.categoryId) ?? '' : '',
      t.note ?? '',
      t.isRecurringInstance ? 'yes' : 'no',
      t.rawInput ?? '',
      t.id,
    ].map(csvCell).join(','));
  return [header.join(','), ...rows].join('\n') + '\n';
}

/** A human-readable summary: totals per month, then per category. */
export function summaryText(transactions: Transaction[], categories: Category[], goals: Goal[], currency: string, generatedAt: string, locale: LocaleDef = en, nameOf: (c: Category) => string = (c) => c.name): string {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const S = locale.s;
  const money = (n: number) => formatMoney(n, currency, { format: locale.format });
  const months = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const k = monthKey(t.occurredAt);
    if (!months.has(k)) months.set(k, []);
    months.get(k)!.push(t);
  }
  const lines: string[] = [];
  lines.push(S.summaryTitle);
  lines.push(S.generated(localDay(generatedAt)));
  lines.push('');
  if (months.size === 0) lines.push(S.noEntriesYet);
  for (const k of [...months.keys()].sort().reverse()) {
    const list = months.get(k)!;
    const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    lines.push(monthLabel(k, locale.format));
    lines.push(S.inOutNet(money(income), money(expenses), money(income - expenses)));
    const perCat = new Map<string, number>();
    for (const t of list) {
      if (t.type !== 'expense') continue;
      const c = t.categoryId ? byId.get(t.categoryId) : undefined;
      const name = c ? nameOf(c) : S.uncategorized;
      perCat.set(name, (perCat.get(name) ?? 0) + t.amount);
    }
    for (const [name, total] of [...perCat.entries()].sort((a, b) => b[1] - a[1])) {
      lines.push(`  ${name}: ${money(total)}`);
    }
    lines.push('');
  }
  const openGoals = goals.filter((g) => !g.completed);
  if (openGoals.length) {
    lines.push(S.goalsHeading);
    for (const g of openGoals) {
      lines.push(S.goalLine(g.name, money(g.currentAmount), money(g.targetAmount), g.targetDate ? longDate(g.targetDate, localDay(generatedAt), locale.format) : null));
    }
    lines.push('');
  }
  lines.push(S.madeWith);
  return lines.join('\n');
}

type BackupData = Omit<BackupPayload, 'app' | 'version' | 'exportedAt'>;

export function buildBackup(data: Omit<BackupData, 'reminders' | 'debts' | 'imports' | 'carryovers'> & Partial<Pick<BackupData, 'reminders' | 'debts' | 'imports' | 'carryovers'>>, exportedAt: string): BackupPayload {
  // A scheduled notification id only means something on the phone that scheduled it.
  const reminders = (data.reminders ?? []).map((r) => ({ ...r, notificationId: null }));
  return { app: 'onlybudget', version: BACKUP_VERSION, exportedAt, ...data, reminders, debts: data.debts ?? [], imports: data.imports ?? [], carryovers: data.carryovers ?? [] };
}

export function isBackupPayload(x: unknown): x is BackupPayload {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return o.app === 'onlybudget' && typeof o.version === 'number' && Array.isArray(o.categories) && Array.isArray(o.transactions) && Array.isArray(o.goals);
}
