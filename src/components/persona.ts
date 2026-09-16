/**
 * Glue between the confirmation cards and the voice engine. Keeps the short
 * memory of recent lines so the same joke does not come straight back.
 */
import { useAppStore } from '@/store/useAppStore';
import { resolveLanguage, type Strings } from '@/i18n';
import { categoryName } from '@/i18n';
import { formatMoney } from '@/lib/money';
import { personaLine, remember } from '@/lib/personas';
import { contributionEvent, transactionEvent, type SavedEntry } from '@/lib/personas/context';
import type { Goal } from '@/types';

let recent: string[] = [];

function lineFor(build: () => ReturnType<typeof transactionEvent>): string | null {
  const { settings } = useAppStore.getState();
  if (!settings || settings.voice === 'plain') return null;
  const money = (n: number) => formatMoney(n, settings.currency, { compact: true });
  const line = personaLine(build(), { voice: settings.voice, attitude: settings.attitude, language: resolveLanguage(settings.language) }, money, recent);
  if (!line) return null;
  recent = remember(recent, line.key);
  return line.text;
}

/** Call after the store has refreshed with the saved entry. */
export function personaLineForTransaction(saved: SavedEntry, t: Strings): string | null {
  return lineFor(() => transactionEvent(useAppStore.getState(), saved, (c) => categoryName(c, t)));
}

export function personaLineForContribution(amount: number, goalId: string): string | null {
  const goal: Goal | undefined = useAppStore.getState().goals.find((g) => g.id === goalId);
  if (!goal) return null;
  return lineFor(() => contributionEvent(amount, goal));
}

/** Test/reset hook. */
export function forgetRecentLines(): void {
  recent = [];
}
