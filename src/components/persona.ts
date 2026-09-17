/**
 * Glue between the confirmation cards and the voice engine. Keeps the short
 * memory of recent lines so the same joke does not come straight back.
 */
import { useAppStore } from '@/store/useAppStore';
import { getDb } from '@/db/database';
import { getAppState, setAppState } from '@/db/repositories';
import { resolveLanguage, type Strings } from '@/i18n';
import { categoryName } from '@/i18n';
import { formatMoney } from '@/lib/money';
import { personaLine, remember } from '@/lib/personas';
import { contributionEvent, transactionEvent, type SavedEntry } from '@/lib/personas/context';
import type { Goal } from '@/types';

const RECENT_KEY = 'persona_recent';
/** Keys of the lines said most recently; loaded once per launch, saved after every pick. */
let recent: string[] | null = null;

async function loadRecent(): Promise<string[]> {
  if (recent) return recent;
  try {
    const raw = await getAppState(await getDb(), RECENT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    recent = Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string').slice(-64) : [];
  } catch {
    recent = [];
  }
  return recent;
}

async function lineFor(build: () => ReturnType<typeof transactionEvent>): Promise<string | null> {
  const { settings } = useAppStore.getState();
  if (!settings || settings.voice === 'plain') return null;
  const money = (n: number) => formatMoney(n, settings.currency, { compact: true });
  const line = personaLine(build(), { voice: settings.voice, attitude: settings.attitude, language: resolveLanguage(settings.language) }, money, await loadRecent());
  if (!line) return null;
  recent = remember(recent ?? [], line.key);
  getDb().then((db) => setAppState(db, RECENT_KEY, JSON.stringify(recent))).catch(() => {});
  return line.text;
}

/** Call after the store has refreshed with the saved entry. */
export function personaLineForTransaction(saved: SavedEntry, t: Strings): Promise<string | null> {
  return lineFor(() => transactionEvent(useAppStore.getState(), saved, (c) => categoryName(c, t)));
}

export async function personaLineForContribution(amount: number, goalId: string): Promise<string | null> {
  const goal: Goal | undefined = useAppStore.getState().goals.find((g) => g.id === goalId);
  if (!goal) return null;
  return lineFor(() => contributionEvent(amount, goal));
}

/** Test/reset hook. */
export function forgetRecentLines(): void {
  recent = null;
}
