import { useCallback, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { today } from '@/lib/dates';
import { getApiKey } from '@/lib/secrets';
import { parseEntries, type ParseResult } from '@/parser';
import { llmParse } from '@/parser/llmFallback';
import { categoryName, resolveLanguage, useMoney, useT } from '@/i18n';
import { HINT } from '@/parser';
import { cleanEntry } from '@/lib/validate';
import { getDb } from '@/db/database';
import { queryTransactions } from '@/db/repositories';
import { answerQuestion, periodRange } from '@/lib/questions';
import { speak } from '@/lib/speak';
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
  const [pending, setPending] = useState<ParseResult | null>(null);
  const [pendingMany, setPendingMany] = useState<ParseResult[] | null>(null);
  const [answer, setAnswer] = useState<SpokenAnswer | null>(null);
  const [busy, setBusy] = useState(false);

  /** Builds the plain sentence for a question and reads it aloud when the setting says so. */
  const answerFor = useCallback(async (result: ParseResult, source: EntrySource, language: string) => {
    const q = result.question;
    if (!q) return;
    const { categories, settings } = useAppStore.getState();
    const range = periodRange(q.period, today());
    const db = await getDb();
    const rows = await queryTransactions(db, { type: q.type, from: range.from, to: range.to, limit: 100000 });
    const a = answerQuestion(q, rows, range, categories);
    const period = t.periodNames[q.period] ?? q.period;
    const cat = a.categoryId ? categories.find((c) => c.id === a.categoryId) : null;
    const what = cat && !a.usedFallback ? categoryName(cat, t) : a.target;
    let text = a.count > 0 ? t.answerTotal(period, money(a.total), what, a.count, q.type === 'income') : t.answerNone(period, what, q.type === 'income');
    if (a.usedFallback && cat && a.count > 0) text = `${text} ${t.answerFallback(a.target ?? '', categoryName(cat, t))}`;
    const mode = settings?.answerMode ?? 'auto';
    const spoken = mode === 'speak' || (mode === 'auto' && source === 'voice');
    setAnswer({ text, spoken });
    if (spoken) await speak(text, language);
  }, [t, money]);

  const submit = useCallback(async (raw: string, source: EntrySource = 'typed') => {
    const text = cleanEntry(raw);
    if (!text) return;
    const { categories, goals, keywordMap, settings } = useAppStore.getState();
    const now = new Date();
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const language = resolveLanguage(settings?.language);
    const ctx = { categories, goals, keywordMap, today: today(), nowTime, language, categoryLabels: t.categoryNames };
    const entries = parseEntries(text, ctx);
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

    if (result.needsReview && settings?.smartParseEnabled) {
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
  }, [answerFor, t]);

  const dismiss = useCallback(() => { setPending(null); setPendingMany(null); }, []);
  const dismissAnswer = useCallback(() => setAnswer(null), []);

  return { pending, pendingMany, answer, busy, submit, dismiss, dismissAnswer };
}
