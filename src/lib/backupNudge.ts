/**
 * When to say, once and quietly, that a backup would be wise. Data loss is the thing people leave manual
 * budgeting apps over, and a local-first app's one real risk is a phone lost with no copy made. The line
 * appears on Today when there are entries worth keeping and no backup yet, or when the last backup is old;
 * "Not now" puts it away for SNOOZE_DAYS.
 */
import { daysBetween, localDay } from './dates';

/** Entries before the first nudge: a person trying the app for a day is not asked to make a backup. */
export const NUDGE_AFTER_ENTRIES = 10;
/** A backup older than this, with entries since, is worth a word. */
export const STALE_BACKUP_DAYS = 45;
export const SNOOZE_DAYS = 30;

export type NudgeInput = {
  /** ISO timestamp of the last backup, or null. */
  lastBackupAt: string | null;
  /** How many entries the person has (any count at or above NUDGE_AFTER_ENTRIES is enough). */
  entries: number;
  /** The day "Not now" was last tapped, or null. */
  dismissedOn: string | null;
  today: string;
};

export function needsBackupNudge({ lastBackupAt, entries, dismissedOn, today }: NudgeInput): 'first' | 'stale' | null {
  if (entries < NUDGE_AFTER_ENTRIES) return null;
  if (dismissedOn && daysBetween(dismissedOn, today) < SNOOZE_DAYS) return null;
  if (!lastBackupAt) return 'first';
  return daysBetween(localDay(lastBackupAt), today) >= STALE_BACKUP_DAYS ? 'stale' : null;
}
