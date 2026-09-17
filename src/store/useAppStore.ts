import { create } from 'zustand';
import type { CarryDecision, Category, Debt, Goal, ImportRecord, KeywordMapping, MonthStats, Period, RecurringRule, Reminder, Settings, Transaction } from '@/types';
import type { StatementLine, Tradeline } from '@/statements';
import { getDb, type DB } from '@/db/database';
import * as repo from '@/db/repositories';
import { addDays, nowIso, today } from '@/lib/dates';
import { periodContaining, samePeriod, shiftPeriod } from '@/lib/periods';
import { bucketByPeriod, carryInto, type CarryState } from '@/lib/rollover';
import { isRecapDay, weekRange, weekRecap, type WeekRecap } from '@/lib/recap';
import { newId } from '@/lib/ids';
import { dueOccurrences } from '@/lib/recurring';
import { learnableWords } from '@/parser';
import { redactSensitive } from '@/lib/validate';
import { sweepImportCache } from '@/lib/pdfBytes';
import { cancelAllReminderNotifications, cancelReminderNotification, nextOccurrence, notificationPermissionState, scheduleReminderNotification, type PermissionState } from '@/lib/reminders';
import { getLocale, resolveLanguage } from '@/i18n';

interface AppState {
  ready: boolean;
  settings: Settings | null;
  categories: Category[];
  goals: Goal[];
  reminders: Reminder[];
  debts: Debt[];
  imports: ImportRecord[];
  /** Fingerprints of every imported statement line, to flag duplicates before import. */
  fingerprints: Set<string>;
  /** Last known notification permission; null until checked. */
  notifications: PermissionState | null;
  rules: RecurringRule[];
  keywords: KeywordMapping[];
  keywordMap: Record<string, string>;
  recent: Transaction[];
  /** The budget period the Today and Budget screens show. */
  period: Period;
  stats: MonthStats | null;
  lifetime: { income: number; expenses: number };
  /** Per category: what is carried into the shown period, and any "carry it over?" question waiting. */
  carry: Record<string, CarryState>;
  /** Answers given in "ask" mode. */
  carryovers: CarryDecision[];
  /** The entry removed most recently, kept so it can be put back. */
  lastDeleted: { tx: Transaction; at: number } | null;
  /** Last week and the week before, for the recap card at the start of a week. */
  recap: WeekRecap | null;

  init: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Moves the shown period by `delta` (negative = earlier), or back to the one containing today. */
  shiftPeriod: (delta: number) => Promise<void>;
  goToCurrentPeriod: () => Promise<void>;

  addTransaction: (input: Omit<Transaction, 'id' | 'createdAt' | 'isRecurringInstance' | 'recurringRuleId'>) => Promise<Transaction>;
  updateTransaction: (t: Transaction) => Promise<void>;
  /** Removes the entry at once; `undoDelete` puts it back until the next removal. */
  deleteTransaction: (id: string) => Promise<void>;
  undoDelete: () => Promise<void>;
  /** Answers "carry over what was left?" for a category in the shown period. */
  decideCarry: (categoryId: string, amount: number) => Promise<void>;

  saveCategory: (c: Category) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;

  saveGoal: (g: Goal) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  contributeToGoal: (goalId: string, amount: number, opts: { logTransfer: boolean; occurredAt: string; rawInput?: string | null }) => Promise<void>;

  /** Saves and schedules. Returns the permission state so the UI can explain when notifications are off. */
  addReminder: (input: Omit<Reminder, 'id' | 'createdAt' | 'notificationId'>) => Promise<PermissionState>;
  removeReminder: (id: string) => Promise<void>;
  /** Re-schedules what needs it (monthly reminders, ones saved while notifications were off) and drops past one-offs. */
  rearmReminders: () => Promise<void>;

  /** Saves the chosen lines from a statement as entries. Returns how many were added. */
  importStatement: (lines: StatementLine[], meta: { kind: 'bank' | 'card' | 'credit_report'; periodStart: string | null; periodEnd: string | null }) => Promise<number>;
  saveDebt: (d: Debt) => Promise<void>;
  removeDebt: (id: string) => Promise<void>;
  /** Adds or refreshes debts from a credit report or card statement (matched by creditor name). */
  mergeTradelines: (lines: Tradeline[]) => Promise<number>;

  saveRule: (r: RecurringRule) => Promise<void>;
  removeRule: (id: string) => Promise<void>;
  runRecurringCatchUp: () => Promise<number>;

  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  learnCategory: (rawInput: string, categoryId: string) => Promise<void>;
  forgetKeyword: (word: string) => Promise<void>;
  restoreAll: (data: Parameters<typeof repo.replaceAllData>[1]) => Promise<void>;
  resetAll: () => Promise<void>;
}

/** Creditor names are compared without case or punctuation, in any script. */
const NON_ALNUM_RE = /[^\p{L}\p{N}]+/gu;

/** `init` runs once; later calls (a re-mounted root, a retry) share the same promise. */
let initPromise: Promise<void> | null = null;

/** How many earlier periods a carry-over can accumulate across. */
const CARRY_LOOKBACK = 24;

async function computeCarry(db: DB, settings: Settings, rules: RecurringRule[], categories: Category[], carryovers: CarryDecision[], period: Period): Promise<Record<string, CarryState>> {
  const rolling = categories.filter((c) => c.kind === 'expense' && !c.archived && (c.rollover ?? 'reset') !== 'reset' && (c.monthlyLimit ?? 0) > 0);
  if (rolling.length === 0) return {};
  // Earlier periods back to the oldest "since" date, oldest first.
  const oldest = rolling.reduce<string | null>((min, c) => (c.rolloverSince && (!min || c.rolloverSince < min) ? c.rolloverSince : min), null);
  const past: Period[] = [];
  let p = period;
  for (let i = 0; i < CARRY_LOOKBACK; i += 1) {
    p = shiftPeriod(settings.budgetPeriod, rules, p, -1);
    if (p.start >= period.start) break;
    past.unshift(p);
    if (oldest && p.start <= oldest) break;
  }
  if (past.length === 0) return {};
  const rows = await repo.expenseTotalsByDay(db, past[0].start, addDays(period.start, -1));
  const spent = bucketByPeriod(rows, past);
  const decisions = new Map<string, number>();
  const out: Record<string, CarryState> = {};
  for (const c of rolling) {
    decisions.clear();
    for (const d of carryovers) if (d.categoryId === c.id) decisions.set(d.period, d.amount);
    out[c.id] = carryInto(c, period, spent.get(c.id) ?? past.map((pp) => ({ period: pp, spent: 0 })), decisions);
  }
  return out;
}

async function showPeriod(period: Period): Promise<void> {
  useAppStore.setState({ period });
  await useAppStore.getState().refresh();
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  settings: null,
  categories: [],
  reminders: [],
  debts: [],
  imports: [],
  fingerprints: new Set<string>(),
  notifications: null,
  goals: [],
  rules: [],
  keywords: [],
  keywordMap: {},
  recent: [],
  period: periodContaining('month', [], today()),
  stats: null,
  lifetime: { income: 0, expenses: 0 },
  carry: {},
  carryovers: [],
  lastDeleted: null,
  recap: null,

  init: () => {
    if (!initPromise) {
      initPromise = (async () => {
        const db = await getDb();
        await get().runRecurringCatchUp();
        const [settings, rules] = await Promise.all([repo.getSettings(db), repo.allRules(db)]);
        set({ period: periodContaining(settings.budgetPeriod, rules, today()) });
        await get().refresh();
        set({ ready: true });
        get().rearmReminders().catch(() => {});
        sweepImportCache().catch(() => {});
      })().catch((e) => {
        initPromise = null; // a failed start may be retried
        throw e;
      });
    }
    return initPromise;
  },

  refresh: async () => {
    const db = await getDb();
    const [settings, categories, goals, rules, keywords, recent, lifetime, reminders, debts, imports, fingerprints, carryovers] = await Promise.all([
      repo.getSettings(db),
      repo.allCategories(db),
      repo.allGoals(db),
      repo.allRules(db),
      repo.allKeywords(db),
      repo.recentTransactions(db, 10),
      repo.lifetimeTotals(db),
      repo.allReminders(db),
      repo.allDebts(db),
      repo.allImports(db),
      repo.allFingerprints(db),
      repo.allCarryovers(db),
    ]);
    const keywordMap: Record<string, string> = {};
    for (const k of keywords) keywordMap[k.word] = k.categoryId;
    // Periods can change shape when the setting or the income rules change; the shown period is re-derived from its first day.
    const period = periodContaining(settings.budgetPeriod, rules, get().period.start);
    const stats = await repo.periodStats(db, period);
    const carry = await computeCarry(db, settings, rules, categories, carryovers, period);
    const todayStr = today();
    const recap = isRecapDay(todayStr) ? weekRecap(await repo.expenseTotalsByDay(db, weekRange(todayStr, -2).from, weekRange(todayStr, -1).to), todayStr) : null;
    set({ settings, categories, goals, rules, keywords, keywordMap, recent, period, stats, lifetime, reminders, debts, imports, fingerprints, carryovers, carry, recap });
  },

  shiftPeriod: async (delta) => {
    const { settings, rules, period } = get();
    await showPeriod(shiftPeriod(settings?.budgetPeriod ?? 'month', rules, period, delta));
  },

  goToCurrentPeriod: async () => {
    const { settings, rules, period } = get();
    const current = periodContaining(settings?.budgetPeriod ?? 'month', rules, today());
    if (!samePeriod(current, period)) await showPeriod(current);
  },

  addTransaction: async (input) => {
    const db = await getDb();
    const t: Transaction = { ...input, note: input.note ? redactSensitive(input.note) || null : null, rawInput: input.rawInput ? redactSensitive(input.rawInput) || null : null, id: newId(), createdAt: nowIso(), isRecurringInstance: false, recurringRuleId: null };
    await repo.insertTransaction(db, t);
    await get().refresh();
    return t;
  },

  updateTransaction: async (t) => {
    const db = await getDb();
    await repo.updateTransaction(db, { ...t, note: t.note ? redactSensitive(t.note) || null : null });
    await get().refresh();
  },

  deleteTransaction: async (id) => {
    const db = await getDb();
    const tx = await repo.getTransaction(db, id);
    await repo.deleteTransaction(db, id);
    set({ lastDeleted: tx ? { tx, at: Date.now() } : null });
    await get().refresh();
  },

  undoDelete: async () => {
    const last = get().lastDeleted;
    if (!last) return;
    set({ lastDeleted: null });
    const db = await getDb();
    // Same id and dates as before, so history and any statement fingerprint are exactly as they were.
    // A category or repeating rule removed in the meantime would break the foreign key, so those references drop.
    const cats = new Set(get().categories.map((c) => c.id));
    const ruleIds = new Set(get().rules.map((x) => x.id));
    const tx = {
      ...last.tx,
      categoryId: last.tx.categoryId && cats.has(last.tx.categoryId) ? last.tx.categoryId : null,
      recurringRuleId: last.tx.recurringRuleId && ruleIds.has(last.tx.recurringRuleId) ? last.tx.recurringRuleId : null,
    };
    if (!(await repo.getTransaction(db, tx.id))) await repo.insertTransaction(db, tx);
    await get().refresh();
  },

  decideCarry: async (categoryId, amount) => {
    const db = await getDb();
    await repo.upsertCarryover(db, { categoryId, period: get().period.start, amount: Math.max(0, Math.round(amount * 100) / 100) });
    await get().refresh();
  },

  saveCategory: async (c) => {
    const db = await getDb();
    await repo.upsertCategory(db, c);
    await get().refresh();
  },

  removeCategory: async (id) => {
    const db = await getDb();
    await repo.deleteCategory(db, id);
    await get().refresh();
  },

  saveGoal: async (g) => {
    const db = await getDb();
    await repo.upsertGoal(db, { ...g, name: redactSensitive(g.name) || g.name });
    await get().refresh();
  },

  removeGoal: async (id) => {
    const db = await getDb();
    await repo.deleteGoal(db, id);
    await get().refresh();
  },

  contributeToGoal: async (goalId, amount, opts) => {
    const db = await getDb();
    const goal = get().goals.find((g) => g.id === goalId);
    if (!goal) return;
    const current = Math.max(0, goal.currentAmount + amount);
    await repo.upsertGoal(db, { ...goal, currentAmount: current, completed: goal.completed || current >= goal.targetAmount });
    if (opts.logTransfer && amount > 0) {
      const savings = get().categories.find((c) => c.id === (goal.kind === 'debt' ? 'debt' : 'savings') && !c.archived);
      await repo.insertTransaction(db, {
        id: newId(),
        amount,
        type: 'expense',
        categoryId: savings?.id ?? null,
        note: getLocale(get().settings?.language).s.toward(goal.name),
        rawInput: opts.rawInput ?? null,
        occurredAt: opts.occurredAt,
        createdAt: nowIso(),
        isRecurringInstance: false,
        recurringRuleId: null,
      });
    }
    await get().refresh();
  },

  addReminder: async (input) => {
    const db = await getDb();
    const strings = getLocale(resolveLanguage(get().settings?.language)).s;
    const rem: Reminder = { ...input, text: redactSensitive(input.text) || input.text, id: newId(), createdAt: nowIso(), notificationId: null };
    // Saved first: a failure in the notification layer must not lose the reminder (rearmReminders retries later).
    await repo.upsertReminder(db, rem);
    try {
      const notificationId = await scheduleReminderNotification(rem, strings.reminderNotificationTitle, strings.reminderChannelReminders);
      if (notificationId) await repo.upsertReminder(db, { ...rem, notificationId });
    } catch {
      // kept with notificationId null
    }
    const state = await notificationPermissionState();
    set({ notifications: state });
    await get().refresh();
    return state;
  },

  removeReminder: async (id) => {
    const db = await getDb();
    const rem = get().reminders.find((r) => r.id === id);
    if (rem) await cancelReminderNotification(rem.notificationId);
    await repo.deleteReminder(db, id);
    await get().refresh();
  },

  rearmReminders: async () => {
    const db = await getDb();
    const state = await notificationPermissionState();
    set({ notifications: state });
    const strings = getLocale(resolveLanguage(get().settings?.language)).s;
    let changed = false;
    for (const rem of get().reminders) {
      if (rem.repeat === 'none' && !nextOccurrence(rem)) {
        await cancelReminderNotification(rem.notificationId);
        await repo.deleteReminder(db, rem.id);
        changed = true;
        continue;
      }
      if (state !== 'granted') continue;
      if (rem.notificationId && rem.repeat !== 'monthly') continue;
      const id = await scheduleReminderNotification(rem, strings.reminderNotificationTitle, strings.reminderChannelReminders);
      if (id !== rem.notificationId) { await repo.upsertReminder(db, { ...rem, notificationId: id }); changed = true; }
    }
    if (changed) await get().refresh();
  },

  importStatement: async (lines, meta) => {
    const db = await getDb();
    const importId = newId();
    const known = get().fingerprints;
    let count = 0;
    await db.withTransactionAsync(async () => {
      for (const l of lines) {
        if (!l.include || known.has(l.fingerprint)) continue;
        const type = l.direction === 'in' ? 'income' : 'expense';
        await repo.insertTransaction(db, {
          id: newId(), amount: l.amount, type, categoryId: l.categoryId, note: redactSensitive(l.description) || null, rawInput: null, occurredAt: l.date,
          createdAt: nowIso(), isRecurringInstance: false, recurringRuleId: null, fingerprint: l.fingerprint, importId,
        });
        known.add(l.fingerprint);
        count += 1;
      }
      // The file name is not kept either (it often carries an account number).
      await repo.insertImport(db, { id: importId, kind: meta.kind, fileName: '', periodStart: meta.periodStart, periodEnd: meta.periodEnd, count, importedAt: nowIso() });
    });
    await get().refresh();
    return count;
  },

  saveDebt: async (d) => {
    const db = await getDb();
    // Money on a debt is never negative; a typed "-50" would otherwise make the plan run for ever
    // and the exported backup fail validation on restore.
    const nonNegative = (v: number | null | undefined): number | null => (v == null || !Number.isFinite(v) ? null : Math.max(0, v));
    await repo.upsertDebt(db, {
      ...d,
      creditor: redactSensitive(d.creditor) || d.creditor,
      balance: nonNegative(d.balance) ?? 0,
      monthlyPayment: nonNegative(d.monthlyPayment),
      creditLimit: nonNegative(d.creditLimit),
      updatedAt: nowIso(),
    });
    await get().refresh();
  },

  removeDebt: async (id) => {
    const db = await getDb();
    await repo.deleteDebt(db, id);
    await get().refresh();
  },

  mergeTradelines: async (lines) => {
    const db = await getDb();
    const existing = get().debts;
    const norm = (s: string) => s.toLowerCase().replace(NON_ALNUM_RE, ' ').trim();
    let n = 0;
    // Each existing debt takes at most one tradeline per import, so two accounts with the same
    // creditor (two cards from one bank) stay two debts instead of both landing on the first.
    const taken = new Set<string>();
    for (const t of lines) {
      if (t.balance == null && t.monthlyPayment == null) continue;
      const key = norm(t.creditor);
      // A name that normalises to nothing matches nothing, so unrelated debts never merge into one.
      const match = key ? existing.find((d) => { if (taken.has(d.id)) return false; const k = norm(d.creditor); return !!k && (k === key || (t.source === 'card_statement' && d.source === 'card_statement' && k.slice(-4) === key.slice(-4))); }) : undefined;
      if (match) taken.add(match.id);
      await repo.upsertDebt(db, {
        id: match?.id ?? newId(),
        creditor: (redactSensitive(t.creditor) || t.creditor).slice(0, 80),
        type: t.type,
        balance: t.balance ?? match?.balance ?? 0,
        monthlyPayment: t.monthlyPayment ?? match?.monthlyPayment ?? null,
        creditLimit: t.creditLimit ?? match?.creditLimit ?? null,
        apr: t.apr ?? match?.apr ?? null,
        source: t.source,
        updatedAt: nowIso(),
      });
      n += 1;
    }
    await get().refresh();
    return n;
  },

  saveRule: async (r) => {
    const db = await getDb();
    // The date the user picked is the anchor day, so a rule set for the 31st returns to the 31st after February.
    // Editing only the amount while the next date sits on the 28th must not move the anchor.
    const existing = get().rules.find((x) => x.id === r.id);
    const dateChanged = !existing || existing.nextOccurrence !== r.nextOccurrence;
    const anchorDay = dateChanged || existing.anchorDay == null ? Number(r.nextOccurrence.slice(8, 10)) || null : existing.anchorDay;
    await repo.upsertRule(db, { ...r, anchorDay });
    await get().runRecurringCatchUp();
    await get().refresh();
  },

  removeRule: async (id) => {
    const db = await getDb();
    await repo.deleteRule(db, id);
    await get().refresh();
  },

  /** Logs every due occurrence of every active rule. Returns how many entries were created. */
  runRecurringCatchUp: async () => {
    const db = await getDb();
    const rules = await repo.allRules(db);
    const todayStr = today();
    let created = 0;
    for (const rule of rules) {
      if (!rule.active) continue;
      const { due, nextOccurrence } = dueOccurrences(rule, todayStr);
      if (due.length === 0) continue;
      await db.withTransactionAsync(async () => {
        for (const date of due) {
          await repo.insertTransaction(db, {
            id: newId(),
            amount: rule.amount,
            type: rule.type,
            categoryId: rule.categoryId,
            note: rule.note,
            rawInput: null,
            occurredAt: date,
            createdAt: nowIso(),
            isRecurringInstance: true,
            recurringRuleId: rule.id,
          });
          created += 1;
        }
        await repo.upsertRule(db, { ...rule, nextOccurrence });
      });
    }
    return created;
  },

  updateSettings: async (patch) => {
    const db = await getDb();
    const current = get().settings ?? (await repo.getSettings(db));
    const next = { ...current, ...patch };
    await repo.saveSettings(db, next);
    set({ settings: next });
    // The period shape or the overall plan changed: the shown period and its totals follow.
    if (patch.budgetPeriod !== undefined || patch.overallLimit !== undefined) {
      set({ period: periodContaining(next.budgetPeriod, get().rules, today()) });
      await get().refresh();
    }
  },

  learnCategory: async (rawInput, categoryId) => {
    const db = await getDb();
    const words = learnableWords(rawInput, resolveLanguage(get().settings?.language));
    for (const w of words) await repo.upsertKeyword(db, w, categoryId);
    if (words.length) await get().refresh();
  },

  forgetKeyword: async (word) => {
    const db = await getDb();
    await repo.deleteKeyword(db, word);
    await get().refresh();
  },

  restoreAll: async (data) => {
    const db = await getDb();
    // Notifications scheduled for the reminders being replaced would otherwise keep firing.
    await cancelAllReminderNotifications();
    await repo.replaceAllData(db, data);
    await get().runRecurringCatchUp();
    await get().refresh();
    // Restored reminders carry no notification id; this schedules them on this phone.
    await get().rearmReminders().catch(() => {});
  },

  resetAll: async () => {
    const db = await getDb();
    const { resetDatabase } = await import('@/db/database');
    await resetDatabase(db);
    await get().refresh();
  },
}));

export function useSettings(): Settings {
  const s = useAppStore((st) => st.settings);
  if (!s) throw new Error('settings not loaded');
  return s;
}

export function useCategory(id: string | null | undefined): Category | undefined {
  return useAppStore((st) => (id ? st.categories.find((c) => c.id === id) : undefined));
}
