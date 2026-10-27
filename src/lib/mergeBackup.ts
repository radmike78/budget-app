/**
 * Adds a backup to what is already on the phone instead of replacing it: the first step toward a second
 * device or a partner's phone, and a restore that can never lose what was entered since the file was made.
 * Pure: it works out what is new and hands back only that; `addData` writes it.
 *
 * Rules: a row whose id is already here is left alone (the phone's copy wins). A category with the same
 * name and kind as one already here is the same category, and everything that pointed at it is pointed at
 * the one here. An entry whose fingerprint is already here (the same statement line imported on both
 * phones) is not added twice. The settings are never touched.
 */
import type { CarryDecision, Category, Debt, Goal, ImportRecord, KeywordMapping, RecurringRule, Reminder, Transaction } from '@/types';

export interface MergeSource {
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

export interface MergePlan extends MergeSource {
  /** Incoming category id → the id it becomes on this phone (only where they differ). */
  categoryMap: Record<string, string>;
  /** Entries left out because they were already here, by id or by fingerprint. */
  skippedTransactions: number;
}

const nameKey = (c: Category) => `${c.kind}|${c.name.toLowerCase().replace(/\s+/g, ' ').trim()}`;

export function mergeBackup(here: MergeSource, incoming: MergeSource): MergePlan {
  const categoryMap: Record<string, string> = {};
  const hereIds = new Set(here.categories.map((c) => c.id));
  const hereByName = new Map<string, Category>();
  for (const c of here.categories) if (!c.archived) hereByName.set(nameKey(c), c);
  let sortOrder = here.categories.reduce((m, c) => Math.max(m, c.sortOrder), 0);
  const categories: Category[] = [];
  for (const c of incoming.categories) {
    if (hereIds.has(c.id)) continue;
    const same = hereByName.get(nameKey(c));
    if (same) { categoryMap[c.id] = same.id; continue; }
    sortOrder += 1;
    categories.push({ ...c, sortOrder });
    hereIds.add(c.id);
    hereByName.set(nameKey(c), c);
  }
  const cat = (id: string | null): string | null => (id == null ? null : hereIds.has(categoryMap[id] ?? id) ? (categoryMap[id] ?? id) : null);

  const ruleIds = new Set(here.recurringRules.map((r) => r.id));
  const recurringRules = incoming.recurringRules.filter((r) => !ruleIds.has(r.id)).map((r) => ({ ...r, categoryId: cat(r.categoryId) }));
  for (const r of recurringRules) ruleIds.add(r.id);

  const goalIds = new Set(here.goals.map((g) => g.id));
  const goals = incoming.goals.filter((g) => !goalIds.has(g.id));
  const addedGoals = new Set(goals.map((g) => g.id));
  for (const g of goals) goalIds.add(g.id);
  // A transfer keeps its goal only when that goal came in with it, or the goal here is plainly the same one
  // (same id, name and kind); a file must never move a goal of this phone that happens to share an id.
  const hereGoal = new Map(here.goals.map((g) => [g.id, g]));
  const fileGoal = new Map(incoming.goals.map((g) => [g.id, g]));
  const goalLinkOk = (id: string) => addedGoals.has(id) || (hereGoal.has(id) && fileGoal.has(id) && hereGoal.get(id)!.kind === fileGoal.get(id)!.kind && hereGoal.get(id)!.name.trim().toLowerCase() === fileGoal.get(id)!.name.trim().toLowerCase());

  const importIds = new Set(here.imports.map((i) => i.id));
  const imports = incoming.imports.filter((i) => !importIds.has(i.id));
  for (const i of imports) importIds.add(i.id);

  const txIds = new Set(here.transactions.map((t) => t.id));
  const fingerprints = new Set(here.transactions.map((t) => t.fingerprint).filter((f): f is string => !!f));
  // Each phone logs a repeating rule's instances with its own ids: the same rule on the same day is the same entry.
  const instances = new Set(here.transactions.filter((t) => t.isRecurringInstance && t.recurringRuleId).map((t) => `${t.recurringRuleId}|${t.occurredAt}`));
  const transactions: Transaction[] = [];
  let skippedTransactions = 0;
  for (const t of incoming.transactions) {
    const instanceKey = t.isRecurringInstance && t.recurringRuleId ? `${t.recurringRuleId}|${t.occurredAt}` : null;
    if (txIds.has(t.id) || (t.fingerprint && fingerprints.has(t.fingerprint)) || (instanceKey && instances.has(instanceKey))) { skippedTransactions += 1; continue; }
    txIds.add(t.id);
    if (t.fingerprint) fingerprints.add(t.fingerprint);
    if (instanceKey) instances.add(instanceKey);
    transactions.push({
      ...t,
      categoryId: cat(t.categoryId),
      recurringRuleId: t.recurringRuleId && ruleIds.has(t.recurringRuleId) ? t.recurringRuleId : null,
      isRecurringInstance: !!(t.recurringRuleId && ruleIds.has(t.recurringRuleId)) && t.isRecurringInstance,
      importId: t.importId && importIds.has(t.importId) ? t.importId : null,
      goalId: t.goalId && goalLinkOk(t.goalId) ? t.goalId : null,
    });
  }

  const words = new Set(here.keywords.map((k) => k.word));
  const keywords = incoming.keywords.filter((k) => !words.has(k.word)).map((k) => ({ ...k, categoryId: cat(k.categoryId) })).filter((k): k is KeywordMapping => !!k.categoryId);

  const reminderIds = new Set(here.reminders.map((r) => r.id));
  const reminders = incoming.reminders.filter((r) => !reminderIds.has(r.id)).map((r) => ({ ...r, notificationId: null }));

  const debtIds = new Set(here.debts.map((d) => d.id));
  const debts = incoming.debts.filter((d) => !debtIds.has(d.id));

  const carryKeys = new Set(here.carryovers.map((c) => `${c.categoryId}|${c.period}`));
  const carryovers: CarryDecision[] = [];
  for (const c of incoming.carryovers) {
    const id = cat(c.categoryId);
    if (!id || carryKeys.has(`${id}|${c.period}`)) continue;
    carryKeys.add(`${id}|${c.period}`);
    carryovers.push({ ...c, categoryId: id });
  }

  return { categories, transactions, recurringRules, goals, keywords, reminders, debts, imports, carryovers, categoryMap, skippedTransactions };
}
