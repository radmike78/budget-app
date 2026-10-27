import { create } from 'zustand';
import type { CarryDecision, Category, Debt, Goal, ImportRecord, KeywordMapping, MonthStats, Period, RecurringRule, Reminder, Settings, Transaction } from '@/types';
import type { StatementLine, Tradeline } from '@/statements';
import { getDb, resetDb, type DB } from '@/db/database';
import * as repo from '@/db/repositories';
import { addDays, nowIso, toDateString, today } from '@/lib/dates';
import { periodContaining, samePeriod, shiftPeriod } from '@/lib/periods';
import { bucketByPeriod, carryInto, type CarryState } from '@/lib/rollover';
import { isRecapDay, weekRange, weekRecap, type WeekRecap } from '@/lib/recap';
import { isReviewTime, periodReview, type PeriodReview } from '@/lib/review';
import { newId } from '@/lib/ids';
import { toCurrencyUnits } from '@/lib/money';
import { dueOccurrences, resumeFrom } from '@/lib/recurring';
import { mergeBackup, type MergeSource } from '@/lib/mergeBackup';
import { learnableWords } from '@/parser';
import { redactOrMask, redactSensitive, MAX_REMINDERS, MAX_RULES } from '@/lib/validate';
import { sweepImportCache } from '@/lib/pdfBytes';
import { setApiKey } from '@/lib/secrets';
import { cancelAllReminderNotifications, cancelDailyReminder, cancelReminderNotification, isDailyReminderScheduled, needsRearm, nextOccurrence, notificationPermissionState, scheduleDailyReminder, scheduleReminderNotification, scheduledReminderIds, type PermissionState } from '@/lib/reminders';
import { sweepExportCache } from '@/lib/files';
import { earlierDay, firstDayNeedsReset, licenseFrom, type License, trialRestartsForBuild } from '@/lib/trial';
import { onUnlocked, readStore, recordTrialStart, restore as restoreFromStore } from '@/lib/purchases';
import { Platform } from 'react-native';
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
  /**
   * The entry saved last in this session, so "make that 14" changes the one just said. '' when the last thing
   * saved was not an entry (a goal, a reminder, an import): a fix by voice must not reach back past it.
   */
  lastSavedId: string | null;
  /** Last week and the week before, for the recap card at the start of a week. */
  recap: WeekRecap | null;
  /** The expenses logged most often lately, for the one-tap row under the entry bar. */
  frequent: repo.FrequentEntry[];
  /** The look back at the period just ended, for the first days of a new one (src/lib/review.ts). */
  review: PeriodReview | null;
  /** Where the 30-day trial stands (null until read). The web build is always unlocked. */
  license: License | null;

  init: () => Promise<void>;
  /** Forgets a start that never finished, so `init` can be called again. */
  resetInit: () => void;
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
  /** `all`: schedule every reminder again (its wording changes with the app lock). */
  rearmReminders: (all?: boolean) => Promise<void>;

  /** Saves the chosen lines from a statement as entries. Returns how many were added. */
  importStatement: (lines: StatementLine[], meta: { kind: 'bank' | 'card' | 'credit_report'; periodStart: string | null; periodEnd: string | null }) => Promise<number>;
  /** Removes every entry a statement import added (the lines can be imported again afterwards). */
  removeImport: (id: string) => Promise<number>;
  saveDebt: (d: Debt) => Promise<void>;
  removeDebt: (id: string) => Promise<void>;
  /** Adds or refreshes debts from a credit report or card statement (matched by creditor name). */
  mergeTradelines: (lines: Tradeline[]) => Promise<number>;

  saveRule: (r: RecurringRule) => Promise<void>;
  removeRule: (id: string) => Promise<void>;
  runRecurringCatchUp: () => Promise<number>;
  /** Coming back to the app: what fell due meanwhile is logged and the screens move to today's period. */
  resume: () => Promise<void>;

  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  learnCategory: (rawInput: string, categoryId: string) => Promise<void>;
  forgetKeyword: (word: string) => Promise<void>;
  restoreAll: (data: Parameters<typeof repo.replaceAllData>[1]) => Promise<void>;
  /** Adds what a backup has that this phone does not; returns how many entries came in. */
  mergeRestore: (data: MergeSource) => Promise<{ added: number; skipped: number }>;
  resetAll: () => Promise<void>;
  /** Reads the trial dates and what the store knows, and moves the latest-seen day forward. */
  refreshLicense: () => Promise<void>;
  /** Asks the store once per launch, in the background, for an unlock or an earlier trial start. */
  reconcileWithStore: () => Promise<void>;
  /** After a purchase: remembers the unlock on this phone. */
  recordUnlock: () => Promise<void>;
  /** Asks the store again, for a new phone or a reinstall. */
  restoreUnlock: () => Promise<'restored' | 'none' | 'unavailable'>;
  /** Puts the ending-soon notice away for good. */
  dismissTrialNotice: () => Promise<void>;
  trialNoticeDismissed: boolean;
  /** The day "Not now" was tapped on the backup line, or null. */
  backupNudgeDismissedOn: string | null;
  dismissBackupNudge: () => Promise<void>;
}

/** Creditor names are compared without case or punctuation, in any script. */
const NON_ALNUM_RE = /[^\p{L}\p{N}]+/gu;

/** Changes what a goal holds by `delta` (never below zero); a goal that has been removed is left alone. */
async function moveGoal(db: DB, goalId: string, delta: number): Promise<void> {
  if (!delta) return;
  const goal = (await repo.allGoals(db)).find((g) => g.id === goalId);
  if (!goal) return;
  const currentAmount = Math.max(0, Math.round((goal.currentAmount + delta) * 100) / 100);
  // Money taken back out (a transfer removed or shrunk) reopens a goal that was done; money put in never undoes a hand-marked done.
  const completed = delta < 0 ? currentAmount >= goal.targetAmount : goal.completed || currentAmount >= goal.targetAmount;
  await repo.upsertGoal(db, { ...goal, currentAmount, completed });
}

/** The day the screens were last worked out for. */
let refreshedOn = '';
/** Each refresh takes a number; a slower, older run (a double tap on the period chevron) never writes over a newer one. */
let refreshRun = 0;

/** `init` runs once; later calls (a re-mounted root, a retry) share the same promise. */
let storeCheck: Promise<void> | null = null;
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

/** Logs every repeating entry that has fallen due. Run through `runRecurringCatchUp`, never twice at once. */
let catchUpRun: Promise<number> | null = null;
let catchUpAgain = false;
const CATCH_UP_LIMIT = 2000;
async function catchUp(): Promise<number> {
  const db = await getDb();
  const rules = await repo.allRules(db);
  const todayStr = today();
  let created = 0;
  for (const rule of rules) {
    if (!rule.active) continue;
    // A bounded amount of work per launch: whatever is left is logged next time, and the app always opens.
    if (created >= CATCH_UP_LIMIT) break;
    const { due, nextOccurrence } = dueOccurrences(rule, todayStr, Math.min(120, CATCH_UP_LIMIT - created));
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
  lastSavedId: null,
  recap: null,
  frequent: [],
  review: null,
  license: null,
  trialNoticeDismissed: false,
  backupNudgeDismissedOn: null,

  // A start that hung (the database never opened) is forgotten so Try again starts from the beginning.
  resetInit: () => {
    if (!get().ready) { initPromise = null; resetDb(); }
  },

  init: () => {
    if (!initPromise) {
      initPromise = (async () => {
        const db = await getDb();
        await get().runRecurringCatchUp();
        const [settings, rules] = await Promise.all([repo.getSettings(db), repo.allRules(db)]);
        // The iOS keychain outlives an uninstall: a fresh install must not quietly find an old Smart Assist key.
        if (!settings.onboardingDone) await setApiKey(null).catch(() => {});
        set({ period: periodContaining(settings.budgetPeriod, rules, today()) });
        await get().refresh();
        await get().refreshLicense();
        set({ ready: true });
        // The store is asked after the screens are up, once per launch, and never holds anything up.
        onUnlocked(() => { get().recordUnlock().catch(() => {}); });
        get().reconcileWithStore().catch(() => {});
        get().rearmReminders().catch(() => {});
        sweepImportCache().catch(() => {});
        sweepExportCache().catch(() => {});
      })().catch((e) => {
        initPromise = null; // a failed start may be retried
        throw e;
      });
    }
    return initPromise;
  },

  refresh: async () => {
    const run = ++refreshRun;
    const db = await getDb();
    const [settings, categories, goals, rules, keywords, recent, lifetime, reminders, debts, imports, fingerprints, carryovers, frequent] = await Promise.all([
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
      repo.frequentEntries(db, addDays(today(), -90)),
    ]);
    const keywordMap: Record<string, string> = {};
    for (const k of keywords) keywordMap[k.word] = k.categoryId;
    // Periods can change shape when the setting or the income rules change; the shown period is re-derived from its first day.
    const period = periodContaining(settings.budgetPeriod, rules, get().period.start);
    const stats = await repo.periodStats(db, period);
    const carry = await computeCarry(db, settings, rules, categories, carryovers, period);
    const todayStr = today();
    refreshedOn = todayStr;
    // Looking back only makes sense once the app was in use from the start of what it looks back on: on a new
    // phone, entries dated earlier (rent the setup logged for the 1st) are not a week or a period someone lived with it.
    // (Saved times are UTC; the day they were saved on is the phone's own.)
    const firstSavedIso = await repo.firstSavedAt(db);
    const firstSaved = firstSavedIso && !Number.isNaN(Date.parse(firstSavedIso)) ? toDateString(new Date(firstSavedIso)) : null;
    const usedSince = (date: string) => firstSaved != null && firstSaved <= date;
    const firstDay = getLocale(resolveLanguage(settings.language)).format.firstDay ?? 0;
    let recap: WeekRecap | null = null;
    if (isRecapDay(todayStr, firstDay) && usedSince(weekRange(todayStr, -1, firstDay).from)) {
      recap = weekRecap(await repo.expenseTotalsByDay(db, weekRange(todayStr, -2, firstDay).from, weekRange(todayStr, -1, firstDay).to), todayStr, firstDay);
      // "$166 more than the week before" is no comparison when the week before had one day of use.
      if (!usedSince(weekRange(todayStr, -2, firstDay).from)) recap = { ...recap, previousTotal: 0 };
    }
    const current = periodContaining(settings.budgetPeriod, rules, todayStr);
    let review: PeriodReview | null = null;
    const last = shiftPeriod(settings.budgetPeriod, rules, current, -1);
    if (isReviewTime(current, todayStr) && usedSince(last.start)) {
      const before = shiftPeriod(settings.budgetPeriod, rules, last, -1);
      const [lastStats, beforeStats] = await Promise.all([repo.periodStats(db, last), repo.periodStats(db, before)]);
      review = periodReview(lastStats, beforeStats.expenses > 0 || beforeStats.income > 0 ? beforeStats : null);
    }
    if (run !== refreshRun) return;
    set({ settings, categories, goals, rules, keywords, keywordMap, recent, period, stats, lifetime, reminders, debts, imports, fingerprints, carryovers, carry, recap, review, frequent });
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
    const t: Transaction = { ...input, amount: toCurrencyUnits(input.amount, get().settings?.currency ?? 'USD'), note: input.note ? redactSensitive(input.note) || null : null, rawInput: input.rawInput ? redactSensitive(input.rawInput) || null : null, id: newId(), createdAt: nowIso(), isRecurringInstance: false, recurringRuleId: null };
    await repo.insertTransaction(db, t);
    set({ lastSavedId: t.id });
    await get().refresh();
    return t;
  },

  updateTransaction: async (t) => {
    const db = await getDb();
    const before = await repo.getTransaction(db, t.id);
    await repo.updateTransaction(db, { ...t, amount: toCurrencyUnits(t.amount, get().settings?.currency ?? 'USD'), note: t.note ? redactSensitive(t.note) || null : null });
    // "Actually it was 50" on a transfer to a goal changes what the goal holds by the same amount.
    if (before?.goalId) await moveGoal(db, before.goalId, t.amount - before.amount);
    await get().refresh();
  },

  deleteTransaction: async (id) => {
    const db = await getDb();
    const tx = await repo.getTransaction(db, id);
    await repo.deleteTransaction(db, id);
    // A transfer to a goal that is taken back is taken out of the goal too (and the undo puts it back).
    if (tx?.goalId) await moveGoal(db, tx.goalId, -tx.amount);
    // Nothing was there to remove (a second tap on the same button): the offer to
    // put back the entry that *was* removed has to survive it.
    if (tx) set({ lastDeleted: { tx, at: Date.now() } });
    // The entry "fix that" would change is gone: there is nothing to reach back to until the next save or an undo.
    const lastId = get().lastSavedId;
    if (tx && (lastId === id || (lastId == null && (await repo.latestSavedTransaction(db))?.id === id))) set({ lastSavedId: '' });
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
    if (!(await repo.getTransaction(db, tx.id))) {
      await repo.insertTransaction(db, tx);
      if (tx.goalId) await moveGoal(db, tx.goalId, tx.amount);
    }
    // Put back, it is again the entry "make that 14" means.
    set({ lastSavedId: tx.id });
    await get().refresh();
  },

  decideCarry: async (categoryId, amount) => {
    const db = await getDb();
    await repo.upsertCarryover(db, { categoryId, period: get().period.start, amount: Math.max(0, Math.round(amount * 100) / 100) });
    await get().refresh();
  },

  saveCategory: async (c) => {
    const db = await getDb();
    const { settings, rules, carryovers, categories } = get();
    const before = categories.find((x) => x.id === c.id);
    let next = c;
    // A new plan on a carrying category keeps what has carried so far: it is saved for this period and carrying
    // goes on from here with the new plan, rather than recounting every earlier period as if it had always applied.
    if (settings && before && before.rollover === 'carry' && c.rollover === 'carry' && (before.monthlyLimit ?? 0) > 0 && before.monthlyLimit !== c.monthlyLimit) {
      const current = periodContaining(settings.budgetPeriod, rules, today());
      const carried = (await computeCarry(db, settings, rules, [before], carryovers, current))[before.id]?.amount ?? 0;
      await repo.upsertCarryover(db, { categoryId: c.id, period: current.start, amount: carried });
      next = { ...c, rolloverSince: current.start };
    }
    await repo.upsertCategory(db, next);
    await get().refresh();
  },

  removeCategory: async (id) => {
    const db = await getDb();
    await repo.deleteCategory(db, id);
    await get().refresh();
  },

  saveGoal: async (g) => {
    const db = await getDb();
    set({ lastSavedId: '' });
    // Money on a goal is never negative. A typed "-50" would otherwise be stored, and the
    // backup validator (rightly) refuses negative amounts, so every later restore would fail.
    const nonNegative = (v: number) => (Number.isFinite(v) ? Math.max(0, v) : 0);
    const units = (v: number) => toCurrencyUnits(nonNegative(v), get().settings?.currency ?? 'USD');
    await repo.upsertGoal(db, { ...g, name: redactOrMask(g.name), targetAmount: units(g.targetAmount), currentAmount: units(g.currentAmount) });
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
    const current = Math.max(0, toCurrencyUnits(goal.currentAmount + amount, get().settings?.currency ?? 'USD'));
    await repo.upsertGoal(db, { ...goal, currentAmount: current, completed: goal.completed || current >= goal.targetAmount });
    // "delete that" right after means the transfer just logged, or (with none logged) nothing to change by voice.
    let transferId = '';
    if (opts.logTransfer && amount > 0) {
      const savings = get().categories.find((c) => c.id === (goal.kind === 'debt' ? 'debt' : 'savings') && !c.archived);
      transferId = newId();
      await repo.insertTransaction(db, {
        id: transferId,
        amount,
        type: 'expense',
        categoryId: savings?.id ?? null,
        note: getLocale(get().settings?.language).s.toward(goal.name),
        rawInput: opts.rawInput ?? null,
        occurredAt: opts.occurredAt,
        createdAt: nowIso(),
        isRecurringInstance: false,
        recurringRuleId: null,
        goalId: goal.id,
      });
    }
    set({ lastSavedId: transferId });
    await get().refresh();
  },

  addReminder: async (input) => {
    const db = await getDb();
    set({ lastSavedId: '' });
    const strings = getLocale(resolveLanguage(get().settings?.language)).s;
    const rem: Reminder = { ...input, text: redactOrMask(input.text), id: newId(), createdAt: nowIso(), notificationId: null };
    // Saved first: a failure in the notification layer must not lose the reminder (rearmReminders retries later).
    await repo.upsertReminder(db, rem);
    let scheduled = true;
    try {
      const notificationId = await scheduleReminderNotification(rem, strings.reminderNotificationTitle, strings.reminderChannelReminders, get().settings?.appLockEnabled ? strings.reminderPrivateBody : null);
      if (notificationId) await repo.upsertReminder(db, { ...rem, notificationId });
    } catch {
      scheduled = false; // kept with notificationId null; rearmReminders tries again
    }
    const state = await notificationPermissionState();
    set({ notifications: state });
    await get().refresh();
    // Allowed but refused by the phone: the card says it is saved, not set.
    return state === 'granted' && !scheduled ? 'failed' : state;
  },

  removeReminder: async (id) => {
    const db = await getDb();
    const rem = get().reminders.find((r) => r.id === id);
    if (rem) await cancelReminderNotification(rem.notificationId);
    await repo.deleteReminder(db, id);
    await get().refresh();
  },

  rearmReminders: async (all = false) => {
    const db = await getDb();
    const state = await notificationPermissionState();
    set({ notifications: state });
    const strings = getLocale(resolveLanguage(get().settings?.language)).s;
    const scheduled = await scheduledReminderIds();
    let changed = false;
    // The evening nudge is lost with a move to a new phone too.
    const settings = get().settings;
    if (state === 'granted' && settings?.reminderEnabled && !(await isDailyReminderScheduled())) {
      await scheduleDailyReminder(settings.reminderHour, { title: strings.reminderTitle, body: strings.reminderBody, channelName: strings.reminderChannelDaily }).catch(() => false);
    }
    for (const rem of get().reminders) {
      if (rem.repeat === 'none' && !nextOccurrence(rem)) {
        await cancelReminderNotification(rem.notificationId);
        await repo.deleteReminder(db, rem.id);
        changed = true;
        continue;
      }
      if (state !== 'granted') continue;
      // Kept when it is still on the phone's schedule and needs no re-arming; anything else (a new phone,
      // a dated series running out, a repeat whose start date has come) is scheduled again.
      if (!all && rem.notificationId && scheduled.has(rem.notificationId) && !needsRearm(rem)) continue;
      // One the phone refuses (a trigger it cannot take) is kept and tried again next time; the rest still get armed.
      let id: string | null;
      try {
        id = await scheduleReminderNotification(rem, strings.reminderNotificationTitle, strings.reminderChannelReminders, get().settings?.appLockEnabled ? strings.reminderPrivateBody : null);
      } catch {
        continue;
      }
      if (id !== rem.notificationId) { await repo.upsertReminder(db, { ...rem, notificationId: id }); changed = true; }
    }
    if (changed) await get().refresh();
  },

  importStatement: async (lines, meta) => {
    const db = await getDb();
    set({ lastSavedId: '' });
    const importId = newId();
    // A copy: if the import fails and rolls back, the lines must not be remembered as already imported.
    const known = new Set(get().fingerprints);
    let count = 0;
    await db.withTransactionAsync(async () => {
      count = 0;
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

  removeImport: async (id) => {
    const db = await getDb();
    const removed = await repo.removeImport(db, id);
    // An entry from this import waiting on the Undo bar would otherwise come back on its own.
    if (get().lastDeleted?.tx.importId === id) set({ lastDeleted: null });
    await get().refresh();
    return removed;
  },

  saveDebt: async (d) => {
    const db = await getDb();
    // Money on a debt is never negative; a typed "-50" would otherwise make the plan run for ever
    // and the exported backup fail validation on restore.
    const nonNegative = (v: number | null | undefined): number | null => (v == null || !Number.isFinite(v) ? null : Math.max(0, v));
    await repo.upsertDebt(db, {
      ...d,
      creditor: redactOrMask(d.creditor),
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
        creditor: redactOrMask(t.creditor).slice(0, 80),
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
    // Resuming a paused rule starts from the next date ahead: what fell due while it was paused was not paid.
    const resumed = !!existing && !existing.active && r.active && existing.nextOccurrence === r.nextOccurrence && r.nextOccurrence < today();
    if (resumed) r = { ...r, nextOccurrence: resumeFrom({ ...r, anchorDay: existing.anchorDay }, today()) };
    const dateChanged = !existing || existing.nextOccurrence !== r.nextOccurrence;
    // A new rule may bring its own anchor (rent "on the 31st" first set in a 30-day month); otherwise the
    // picked date's day is the anchor, and a resumed rule keeps the one it had.
    const anchorDay = !existing && r.anchorDay != null ? r.anchorDay
      : resumed && existing?.anchorDay != null ? existing.anchorDay
      : dateChanged || existing?.anchorDay == null ? Number(r.nextOccurrence.slice(8, 10)) || null
      : existing.anchorDay;
    // The note is copied into every entry the rule logs, so it is redacted like any other note.
    await repo.upsertRule(db, { ...r, amount: toCurrencyUnits(r.amount, get().settings?.currency ?? 'USD'), note: r.note ? redactSensitive(r.note) || null : null, anchorDay });
    await get().runRecurringCatchUp();
    await get().refresh();
  },

  removeRule: async (id) => {
    const db = await getDb();
    await repo.deleteRule(db, id);
    await get().refresh();
  },

  /** Logs every due occurrence of every active rule. Returns how many entries were created. */
  runRecurringCatchUp: () => {
    // One run at a time: two overlapping runs (a launch and a save) would both log the same due dates. A rule saved
    // while a run is under way was not in that run's list, so one more run follows before the promise settles.
    if (catchUpRun) { catchUpAgain = true; return catchUpRun; }
    catchUpRun = (async () => {
      let created = await catchUp();
      while (catchUpAgain) { catchUpAgain = false; created += await catchUp(); }
      return created;
    })().finally(() => { catchUpRun = null; catchUpAgain = false; });
    return catchUpRun;
  },

  resume: async () => {
    if (!get().ready) return;
    const created = await get().runRecurringCatchUp();
    const { settings, rules, period } = get();
    const current = periodContaining(settings?.budgetPeriod ?? 'month', rules, today());
    if (!samePeriod(current, period)) await showPeriod(current);
    // A new day changes the recap, the look-back and what is safe to spend, even inside the same period.
    else if (created > 0 || refreshedOn !== today()) await get().refresh();
    get().rearmReminders().catch(() => {});
    get().refreshLicense().catch(() => {});
  },

  updateSettings: async (patch) => {
    const db = await getDb();
    const current = get().settings ?? (await repo.getSettings(db));
    const next = { ...current, ...patch };
    await repo.saveSettings(db, next);
    // A refresh already under way read the old settings: it is discarded so it cannot write them back.
    refreshRun += 1;
    set({ settings: next });
    // Apple's way of keeping a trial across reinstalls, asked once the welcome pages are done, never over them.
    if (patch.onboardingDone && !current.onboardingDone) {
      await get().refreshLicense().catch(() => {}); // the month starts now
      recordTrialStart().catch(() => {});
    }
    // Reminders already on the schedule carry their words, which the lock keeps off the lock screen.
    if (patch.appLockEnabled !== undefined && patch.appLockEnabled !== current.appLockEnabled) get().rearmReminders(true).catch(() => {});
    // The period shape or the overall plan changed: the shown period and its totals follow.
    if (patch.budgetPeriod !== undefined || patch.overallLimit !== undefined) {
      set({ period: periodContaining(next.budgetPeriod, get().rules, today()) });
      await get().refresh();
    }
  },

  learnCategory: async (rawInput, categoryId) => {
    const db = await getDb();
    const words = learnableWords(redactSensitive(rawInput), resolveLanguage(get().settings?.language));
    for (const w of words) await repo.upsertKeyword(db, w, categoryId);
    if (words.length) await get().refresh();
  },

  forgetKeyword: async (word) => {
    const db = await getDb();
    await repo.deleteKeyword(db, word);
    await get().refresh();
  },

  mergeRestore: async (data) => {
    const db = await getDb();
    const { categories, rules, goals, keywords, reminders, debts, imports, carryovers } = get();
    const here: MergeSource = { categories, transactions: await repo.allTransactions(db), recurringRules: rules, goals, keywords, reminders, debts, imports, carryovers };
    const plan = mergeBackup(here, data);
    // The per-file caps protect the phone; adding to what is here must respect them too.
    if (here.reminders.length + plan.reminders.length > MAX_REMINDERS || here.recurringRules.length + plan.recurringRules.length > MAX_RULES) throw new Error('MERGE_TOO_MANY');
    await repo.addData(db, plan);
    await get().runRecurringCatchUp();
    await get().refresh();
    // Reminders that came in carry no notification id; this schedules them on this phone.
    await get().rearmReminders().catch(() => {});
    return { added: plan.transactions.length, skipped: plan.skippedTransactions };
  },

  restoreAll: async (data) => {
    const db = await getDb();
    await repo.replaceAllData(db, data);
    // Only once the data is in (a failed restore keeps everything, alarms included): notifications for the
    // reminders just replaced would otherwise keep firing, and the evening nudge follows the restored setting.
    await cancelAllReminderNotifications().catch(() => {});
    await cancelDailyReminder().catch(() => {});
    // The undo bar and "make that 14" pointed at entries that are gone.
    set({ lastDeleted: null, lastSavedId: null });
    await get().runRecurringCatchUp();
    await get().refresh();
    // Restored reminders carry no notification id; this schedules them on this phone.
    await get().rearmReminders().catch(() => {});
  },

  resetAll: async () => {
    const db = await getDb();
    // Reminders already on the phone's schedule would outlive the data they came from,
    // and so would the evening nudge: the setting goes back to off, so must the alarm.
    await cancelAllReminderNotifications();
    await cancelDailyReminder();
    const { resetDatabase } = await import('@/db/database');
    await resetDatabase(db);
    // The Smart Assist key is the user's own credential and lives outside the database.
    await setApiKey(null).catch(() => {});
    // An export written before the erase is a full copy of what was just erased.
    await sweepExportCache().catch(() => {});
    // The voices' memory of recent lines is kept in the module as well as the table just wiped.
    const { forgetRecentLines } = await import('@/components/persona');
    forgetRecentLines();
    // Nothing erased may come back through the undo bar or be changed by "make that 14".
    set({ lastDeleted: null, lastSavedId: null });
    await get().refresh();
    await get().refreshLicense();
  },

  refreshLicense: async () => {
    // The web build is the free demo: nothing to count.
    const db = await getDb();
    if (Platform.OS === 'web') {
      set({ license: licenseFrom({ firstSeen: null, latestSeen: null, unlocked: true, today: today() }), backupNudgeDismissedOn: await repo.getAppState(db, 'backup.nudgeSeen') });
      return;
    }
    const todayStr = today();
    const [storedFirst0, storedLatest0, unlockedFlag, noticeSeen0, nudgeSeen, storedProfile] = await Promise.all([
      repo.getAppState(db, 'trial.firstSeen'),
      repo.getAppState(db, 'trial.latestSeen'),
      repo.getAppState(db, 'license.unlocked'),
      repo.getAppState(db, 'trial.noticeSeen'),
      repo.getAppState(db, 'backup.nudgeSeen'),
      repo.getAppState(db, 'trial.profile'),
    ]);
    set({ backupNudgeDismissedOn: nudgeSeen });
    let storedFirst = storedFirst0;
    let storedLatest = storedLatest0;
    let noticeSeen = noticeSeen0;
    // A beta tester's month restarts once when the store build arrives (same bundle id, same database).
    const profile = process.env.EXPO_PUBLIC_BUILD_PROFILE ?? null;
    if (trialRestartsForBuild(storedProfile, profile)) {
      storedFirst = null; storedLatest = null; noticeSeen = null;
      await repo.setAppState(db, 'trial.noticeSeen', '');
    }
    if (profile && profile !== storedProfile) await repo.setAppState(db, 'trial.profile', profile);
    // The month starts when the welcome pages are done (the terms are on them): until then nothing is written,
    // so someone who opened the app once and came back weeks later still gets the whole month.
    const onboarded = get().settings?.onboardingDone ?? (await repo.getSettings(db)).onboardingDone;
    let firstSeen = storedFirst;
    let unlocked = !!unlockedFlag;
    // A first day in the future means the clock was ahead at the first open: the month restarts from today.
    if (firstDayNeedsReset(firstSeen, todayStr)) {
      firstSeen = null;
      await repo.setAppState(db, 'trial.latestSeen', todayStr);
    }
    // The first day is written once; the latest-seen day only ever moves forward.
    if (!firstSeen) {
      firstSeen = todayStr;
      if (onboarded) await repo.setAppState(db, 'trial.firstSeen', firstSeen);
    }
    if (onboarded && (!storedLatest || storedLatest < todayStr)) await repo.setAppState(db, 'trial.latestSeen', todayStr);
    const latestSeen = storedLatest && storedLatest > todayStr && !firstDayNeedsReset(storedFirst, todayStr) ? storedLatest : todayStr;
    set({ license: licenseFrom({ firstSeen, latestSeen, unlocked, today: todayStr }), trialNoticeDismissed: !!noticeSeen });
  },

  reconcileWithStore: async () => {
    // The store's own record, read quietly once per launch: an unlock bought on another phone, or an earlier
    // trial start. Single-flight, and never allowed to undo an unlock recorded while it was waiting.
    if (Platform.OS === 'web' || get().license?.state === 'unlocked') return;
    if (!storeCheck) {
      storeCheck = (async () => {
        const known = await readStore().catch(() => null);
        if (!known) return;
        const db = await getDb();
        if (known.unlocked) { await get().recordUnlock(); return; }
        if (get().license?.state === 'unlocked') return;
        const firstSeen = await repo.getAppState(db, 'trial.firstSeen');
        const earlier = earlierDay(firstSeen, known.trialStartedOn);
        if (earlier && earlier !== firstSeen) {
          await repo.setAppState(db, 'trial.firstSeen', earlier);
          await get().refreshLicense();
        }
      })().catch(() => {});
    }
    await storeCheck;
  },

  recordUnlock: async () => {
    const db = await getDb();
    await repo.setAppState(db, 'license.unlocked', 'store');
    set({ license: licenseFrom({ firstSeen: null, latestSeen: null, unlocked: true, today: today() }) });
  },

  restoreUnlock: async () => {
    const known = await restoreFromStore().catch(() => null);
    if (!known) return 'unavailable';
    if (known.unlocked) { await get().recordUnlock(); return 'restored'; }
    // No unlock, but perhaps an earlier trial start from before a reinstall.
    const db = await getDb();
    const firstSeen = await repo.getAppState(db, 'trial.firstSeen');
    const earlier = earlierDay(firstSeen, known.trialStartedOn);
    if (earlier && earlier !== firstSeen) {
      await repo.setAppState(db, 'trial.firstSeen', earlier);
      await get().refreshLicense();
    }
    return 'none';
  },

  dismissBackupNudge: async () => {
    const db = await getDb();
    const day = today();
    await repo.setAppState(db, 'backup.nudgeSeen', day);
    set({ backupNudgeDismissedOn: day });
  },

  dismissTrialNotice: async () => {
    const db = await getDb();
    await repo.setAppState(db, 'trial.noticeSeen', '1');
    set({ trialNoticeDismissed: true });
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
