import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { longDate, monthKey, monthRange, today } from '@/lib/dates';
import { periodContaining, shiftPeriod } from '@/lib/periods';
import { getApiKey } from '@/lib/secrets';
import { parseEntries, type Correction, type ParseResult } from '@/parser';
import type { Transaction } from '@/types';
import { SMART_ASSIST } from '@/lib/features';
import { llmParse } from '@/parser/llmFallback';
import { categoryName, resolveLanguage, useDateFormat, useMoney, useT } from '@/i18n';
import { HINT } from '@/parser';
import { cleanEntry } from '@/lib/validate';
import { notify } from '@/lib/dialogs';
import { getDb } from '@/db/database';
import { getTransaction, latestSavedTransaction, queryTransactions, recentTransactions } from '@/db/repositories';
import { answerAfford, answerQuestion, answerRemaining, answerTop, compareRanges, periodRange } from '@/lib/questions';
import { compareWeeks } from '@/lib/recap';
import { speak } from '@/lib/speak';
import { greeting } from '@/lib/personas';
import type { EntrySource } from './EntryBar';

export interface SpokenAnswer {
  text: string;
  /** True when the answer was read aloud as well as shown. */
  spoken: boolean;
}

/**
 * Text and voice both land here: parse (Tier 1), optionally escalate (Tier 2),
 * then hand the result to a confirmation card. One expense goes to the single
 * card; several in one utterance go to the multi-entry card. Nothing is saved silently.
 */
export function useEntryFlow() {
  const t = useT();
  const money = useMoney();
  const fmt = useDateFormat();
  const [pending, setPending] = useState<ParseResult | null>(null);
  const [pendingMany, setPendingMany] = useState<ParseResult[] | null>(null);
  // The callbacks below outlive a render, so they read the open card through refs.
  const pendingRef = useRef<ParseResult | null>(null);
  const pendingManyRef = useRef<ParseResult[] | null>(null);
  useEffect(() => { pendingRef.current = pending; }, [pending]);
  useEffect(() => { pendingManyRef.current = pendingMany; }, [pendingMany]);
  const [answer, setAnswer] = useState<SpokenAnswer | null>(null);
  const [busy, setBusy] = useState(false);
  /** How the entry on the card came in, so a spoken entry can get a spoken reply. */
  const [lastSource, setLastSource] = useState<EntrySource>('typed');

  /** Builds the plain sentence for a question and reads it aloud when the setting says so. */
  const answerFor = useCallback(async (result: ParseResult, source: EntrySource, language: string) => {
    const q = result.question;
    if (!q) return;
    const { categories, settings, rules } = useAppStore.getState();
    const todayStr = today();
    // The budget period: payday to payday in pay mode, else the month. With no period said, a question means this one.
    const current = periodContaining(settings?.budgetPeriod ?? 'month', rules, todayStr);
    const month = monthRange(monthKey(todayStr));
    const isPayPeriod = current.start !== month.start || current.end !== month.end;
    const nameOf = (id: string) => { const c = categories.find((x) => x.id === id); return c ? categoryName(c, t) : id; };
    let text: string;

    if (q.ask === 'compare') {
      // The period so far against the same point in the one before, so half a month never meets a whole one.
      const kind = q.period === 'budget' && !isPayPeriod ? 'month' : q.period;
      const previous = shiftPeriod(settings?.budgetPeriod ?? 'month', rules, current, -1);
      const r = compareRanges(kind, todayStr, current, previous, fmt.firstDay ?? 0);
      const db = await getDb();
      const rows = await queryTransactions(db, { type: 'expense', from: r.before.from, to: r.now.to, limit: 100000 });
      const spentQ = { ...q, ask: 'spent' as const };
      const now = answerQuestion(spentQ, rows, r.now, categories);
      const before = answerQuestion(spentQ, rows, r.before, categories);
      const cat = now.categoryId ? categories.find((c) => c.id === now.categoryId) : null;
      const what = now.categoryIds ? now.target : cat && !now.usedFallback ? categoryName(cat, t) : now.target;
      const periodName = t.periodNames[kind] ?? kind;
      const prev = t.comparePrev[kind] ?? kind;
      text = t.answerCompare(periodName, money(now.total), what, compareWeeks(now.total, before.total), money(Math.abs(now.total - before.total)), prev);
    } else if (q.ask === 'top') {
      const period = q.periodDefaulted && isPayPeriod ? 'budget' : q.period;
      const range = periodRange(period, todayStr, current, q.days, fmt.firstDay ?? 0);
      const db = await getDb();
      const rows = await queryTransactions(db, { type: 'expense', from: range.from, to: range.to, limit: 100000 });
      const periodName = period === 'recentDays' ? t.periodLastDays(q.days ?? 7) : period === 'budget' && !isPayPeriod ? t.periodNames.month : (t.periodNames[period] ?? period);
      const top = answerTop(rows, range);
      text = top ? t.answerTop(periodName, top.categoryId ? nameOf(top.categoryId) : t.otherSpending, money(top.amount), money(top.total)) : t.answerNone(periodName, null, false);
    } else if (q.ask === 'afford') {
      await useAppStore.getState().goToCurrentPeriod();
      const { stats, carry } = useAppStore.getState();
      if (!stats) return;
      const a = answerAfford(q, { stats, categories, carry, overallLimit: settings?.overallLimit ?? null, rules, today: todayStr });
      const until = longDate(stats.period.end, todayStr, fmt);
      const price = money(q.price ?? 0);
      if (a.kind === 'unknown') text = t.answerAffordUnknown(price);
      else {
        const what = a.categoryIds ? (a.categoryIds.length === 1 ? nameOf(a.categoryIds[0]) : q.target) : null;
        text = a.after >= 0 ? t.answerAffordFits(price, money(a.after), what, until) : t.answerAffordShort(price, money(-a.after), what, until);
      }
    } else if (q.ask === 'left') {
      // What is left is always about now, so the screens move to the current period with the answer.
      await useAppStore.getState().goToCurrentPeriod();
      const { stats, carry } = useAppStore.getState();
      if (!stats) return;
      const r = answerRemaining(q, { stats, categories, carry, overallLimit: settings?.overallLimit ?? null, rules, today: todayStr });
      const until = longDate(stats.period.end, todayStr, fmt);
      const m = (n: number) => money(Math.abs(n));
      switch (r.kind) {
        case 'overall': text = r.left >= 0 ? t.answerLeft(m(r.left), m(r.plan), null, until) : t.answerPast(m(r.left), m(r.plan), null); break;
        case 'income': text = r.left >= 0 ? t.answerIncomeLeft(m(r.left), until, r.billsDue > 0) : t.answerIncomeShort(m(r.left), r.billsDue > 0); break;
        case 'plans': text = r.left >= 0 ? t.answerPlansLeft(m(r.left), m(r.plan), until) : t.answerPast(m(r.left), m(r.plan), null); break;
        case 'nothing': text = t.answerNothingSet(m(r.spent)); break;
        case 'category': {
          const what = r.ids.length === 1 ? nameOf(r.ids[0]) : (q.target ?? r.ids.map(nameOf).join(', '));
          text = r.left >= 0 ? t.answerLeft(m(r.left), m(r.plan), what, until) : t.answerPast(m(r.left), m(r.plan), what);
          break;
        }
        case 'categoryNoPlan': text = t.answerNoPlanFor(r.ids.length === 1 ? nameOf(r.ids[0]) : (q.target ?? r.ids.map(nameOf).join(', ')), r.spent > 0 ? m(r.spent) : null); break;
        case 'unknown': default: text = t.answerNoCategory(q.target ?? ''); break;
      }
    } else {
      const period = q.periodDefaulted && isPayPeriod ? 'budget' : q.period;
      const range = periodRange(period, todayStr, current, q.days, fmt.firstDay ?? 0);
      const db = await getDb();
      const rows = await queryTransactions(db, { type: q.type, from: range.from, to: range.to, limit: 100000 });
      const a = answerQuestion(q, rows, range, categories);
      const periodName = period === 'recentDays' ? t.periodLastDays(q.days ?? 7) : period === 'budget' && !isPayPeriod ? t.periodNames.month : (t.periodNames[period] ?? period);
      const cat = a.categoryId ? categories.find((c) => c.id === a.categoryId) : null;
      const what = a.categoryIds ? a.target : cat && !a.usedFallback ? categoryName(cat, t) : a.target;
      text = a.count > 0 ? t.answerTotal(periodName, money(a.total), what, a.count, q.type === 'income') : t.answerNone(periodName, what, q.type === 'income');
      if (a.usedFallback && cat && a.count > 0) text = `${text} ${t.answerFallback(a.target ?? '', categoryName(cat, t))}`;
    }
    const mode = settings?.answerMode ?? 'auto';
    const spoken = mode === 'speak' || (mode === 'auto' && source === 'voice');
    setAnswer({ text, spoken });
    if (spoken) await speak(text, language, settings?.voiceGender ?? 'female');
  }, [t, money, fmt]);

  /** Shows a short spoken-style reply under the bar, read aloud under the same rule as answers. */
  const reply = useCallback(async (text: string, source: EntrySource, language: string) => {
    const settings = useAppStore.getState().settings;
    const mode = settings?.answerMode ?? 'auto';
    const spoken = mode === 'speak' || (mode === 'auto' && source === 'voice');
    setAnswer({ text, spoken });
    if (spoken) await speak(text, language, settings?.voiceGender ?? 'female');
  }, []);

  /**
   * "actually it was 14", "make that dining", "delete that". With a card open, the card
   * changes and nothing is saved until Save. Otherwise the entry saved last opens in a card
   * with the change made, so it is still the person who saves it; "delete that" removes it at
   * once and the undo bar can put it back, like removing any entry.
   */
  /** Removes a saved entry, or opens it in the card with the new value filled in, so the person still saves it. */
  const applyToSaved = useCallback(async (tx: Transaction, fix: Correction, result: ParseResult, source: EntrySource, language: string) => {
    const { categories } = useAppStore.getState();
    const catKind = fix.categoryId ? categories.find((c) => c.id === fix.categoryId)?.kind ?? null : null;
    const cat = categories.find((c) => c.id === tx.categoryId) ?? null;
    const what = tx.note ?? (cat ? categoryName(cat, t) : null);
    if (fix.remove) {
      await useAppStore.getState().deleteTransaction(tx.id);
      await reply(t.correctionRemoved(money(tx.amount), what), source, language);
      return;
    }
    setAnswer(null);
    setPendingMany(null);
    setPending({
      kind: 'transaction',
      raw: result.raw,
      amount: fix.amount ?? tx.amount,
      type: catKind ?? tx.type,
      typeConfidence: 1,
      categoryId: fix.categoryId ?? tx.categoryId,
      categoryConfidence: 1,
      note: tx.note,
      occurredAt: fix.date ?? tx.occurredAt,
      dateExplicit: true,
      goalName: null, goalKind: 'saving', targetDate: null, goalId: null,
      reminderText: null, reminderTime: null, reminderRepeat: 'none',
      question: null, command: null, correction: null,
      editOf: tx,
      confidence: 1,
      needsReview: false,
      hints: [],
    });
  }, [t, money, reply]);

  const applyCorrection = useCallback(async (result: ParseResult, source: EntrySource, language: string) => {
    const fix = result.correction!;
    const open = pendingRef.current;
    const { categories } = useAppStore.getState();
    const catKind = fix.categoryId ? categories.find((c) => c.id === fix.categoryId)?.kind ?? null : null;
    if (pendingManyRef.current) { await reply(t.correctionOnCard, source, language); return; }
    // "the uber was 32": the entry named, not the last one. An open card counts only when it is that entry.
    const labelOf = (categoryId: string | null) => { const c = categories.find((x) => x.id === categoryId); return c ? categoryName(c, t).toLowerCase() : ''; };
    const names = (note: string | null, categoryId: string | null) => `${(note ?? '').toLowerCase()} ${labelOf(categoryId)}`;
    const isMeant = (note: string | null, categoryId: string | null) => !fix.target || fix.target.split(' ').every((w) => names(note, categoryId).includes(w));
    if (open && (open.kind === 'transaction' || open.kind === 'unknown') && isMeant(open.note, open.categoryId)) {
      setAnswer(null);
      if (fix.remove) { setPending(null); await reply(t.correctionCancelled, source, language); return; }
      setPending({
        ...open,
        raw: open.raw,
        amount: fix.amount ?? open.amount,
        categoryId: fix.categoryId ?? open.categoryId,
        type: catKind ?? open.type,
        occurredAt: fix.date ?? open.occurredAt,
        dateExplicit: open.dateExplicit || fix.date != null,
        hints: [],
        needsReview: false,
      });
      return;
    }
    if (open && !fix.target) {
      // A goal, contribution or reminder card is changed on the card; "never mind" still closes it.
      if (fix.remove) { setPending(null); await reply(t.correctionCancelled, source, language); return; }
      await reply(t.correctionOnCard, source, language);
      return;
    }
    const db = await getDb();
    if (fix.target) {
      // The newest entry whose note or category says those words ("spotify", "uber"); a plain substring test, never a RegExp.
      const found = (await recentTransactions(db, 200)).filter((x) => isMeant(x.note, x.categoryId)).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
      if (!found) { await reply(t.correctionNoMatch(fix.target), source, language); return; }
      await applyToSaved(found, fix, result, source, language);
      return;
    }
    const lastId = useAppStore.getState().lastSavedId;
    // '' means the last thing saved was not an entry (a goal, a reminder, an import): nothing to reach back to.
    if (lastId === '') { await reply(t.correctionNothing, source, language); return; }
    // Only the entry saved last; once it is gone, "fix that" never reaches for an older one the person did not mean.
    // (No id at all is a fresh launch, where the newest entry they saved is the one.)
    const tx = lastId ? await getTransaction(db, lastId) : await latestSavedTransaction(db);
    if (!tx) { await reply(t.correctionNothing, source, language); return; }
    await applyToSaved(tx, fix, result, source, language);
  }, [t, reply, applyToSaved]);


  const submitInner = useCallback(async (raw: string, source: EntrySource = 'typed') => {
    const text = cleanEntry(raw);
    if (!text) return;
    setLastSource(source);
    const { categories, goals, keywordMap, settings } = useAppStore.getState();
    const now = new Date();
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const language = resolveLanguage(settings?.language);
    const ctx = { categories, goals, keywordMap, today: today(), nowTime, language, categoryLabels: t.categoryNames, currency: settings?.currency };
    const entries = parseEntries(text, ctx);
    if (entries.length === 1 && entries[0].kind === 'correction' && entries[0].correction) {
      await applyCorrection(entries[0], source, language);
      return;
    }
    if (entries.length === 1 && entries[0].kind === 'command' && entries[0].command) {
      // A settings change, never an entry: applied at once, then the chosen voice says hello.
      setPending(null);
      setPendingMany(null);
      const cmd = entries[0].command;
      await useAppStore.getState().updateSettings({ ...(cmd.voice ? { voice: cmd.voice } : null), ...(cmd.attitude ? { attitude: cmd.attitude } : null), ...(cmd.gender ? { voiceGender: cmd.gender } : null) });
      const next = useAppStore.getState().settings;
      if (!next) return;
      const names = { plain: t.voicePlain, friend: t.voiceFriend, coach: t.voiceCoach, roaster: t.voiceRoaster };
      const attitudes = { nice: t.attitudeNice, playful: t.attitudePlayful, spicy: t.attitudeSpicy };
      const summary = next.voice === 'plain' ? `${names[next.voice]} · ${next.voiceGender === 'male' ? t.voiceMale : t.voiceFemale}` : `${names[next.voice]} · ${attitudes[next.attitude]} · ${next.voiceGender === 'male' ? t.voiceMale : t.voiceFemale}`;
      const hello = greeting(next.voice, language);
      const text = hello ? `${t.voiceSwitched(summary)} ${hello}` : t.voiceSwitched(summary);
      const mode = next.answerMode;
      const spoken = mode === 'speak' || (mode === 'auto' && source === 'voice');
      setAnswer({ text, spoken });
      if (spoken) await speak(hello ?? text, language, next.voiceGender);
      return;
    }
    if (entries.length === 1 && entries[0].kind === 'question') {
      // A question is answered, never saved: nothing reaches the confirmation card.
      setPending(null);
      setPendingMany(null);
      await answerFor(entries[0], source, language);
      return;
    }
    setAnswer(null);
    if (entries.length > 1) {
      // Several expenses in one go: each becomes its own row on the card.
      setPending(null);
      setPendingMany(entries.map((e) => (e.kind === 'unknown' ? { ...e, kind: 'transaction' as const } : e)));
      return;
    }
    let result = entries[0];

    if (SMART_ASSIST && result.needsReview && settings?.smartParseEnabled) {
      setBusy(true);
      try {
        const key = await getApiKey();
        if (key) {
          const assist = await llmParse(text, categories, key, ctx.today, ctx.language);
          if (assist) {
            result = {
              ...result,
              ...assist,
              kind: assist.kind ?? (result.kind === 'unknown' ? 'transaction' : result.kind),
              hints: [],
              needsReview: assist.amount == null,
            };
            if (result.amount == null) result.hints = [HINT.stillNoAmount];
          } else {
            result.hints = [...result.hints, HINT.assistUnavailable];
          }
        }
      } finally {
        setBusy(false);
      }
    }
    if (result.kind === 'unknown') result = { ...result, kind: 'transaction' };
    setPendingMany(null);
    setPending(result);
  }, [answerFor, applyCorrection, t]);

  // The typed text is already gone from the bar, so a failure has to say so instead of vanishing.
  const submit = useCallback(async (raw: string, source: EntrySource = 'typed') => {
    try {
      await submitInner(raw, source);
    } catch (e) {
      setBusy(false);
      notify(t.didntWork((e as Error).message));
    }
  }, [submitInner, t]);

  const dismiss = useCallback(() => { setPending(null); setPendingMany(null); }, []);
  const dismissAnswer = useCallback(() => setAnswer(null), []);

  return { pending, pendingMany, answer, busy, submit, dismiss, dismissAnswer, lastSource };
}
