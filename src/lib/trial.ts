/**
 * The 30-day trial and the one-time unlock, as pure arithmetic over a few dates.
 *
 * The app is free to install and complete for TRIAL_DAYS from the first day it was opened. After that,
 * everything already entered stays readable, askable and exportable; only adding new things stops until the
 * one-time purchase. The dates live in the `app_state` table (not user data, kept across Erase everything):
 *   trial.firstSeen   the first day the app was opened
 *   trial.latestSeen  the latest day it was opened, so a clock set back cannot stretch the trial
 *   license.unlocked  the product id once the unlock was bought or restored
 * On iOS the trial is also recorded with the store as a free "30-day Trial" product, so its purchase date
 * survives a reinstall and is taken as the earlier first day when the store reports one.
 */
import { addDays, daysBetween } from './dates';

export const TRIAL_DAYS = 30;
/** A quiet notice appears this many days before the trial ends. */
export const NOTICE_DAYS = 7;

export type LicenseState = 'trial' | 'ended' | 'unlocked';
export type License = {
  state: LicenseState;
  /** Whole days still free, 0 once ended or when unlocked. */
  daysLeft: number;
  /** The first day on which adding stops, '' when unlocked. */
  endsOn: string;
  /** True while the trial runs and the end is within NOTICE_DAYS. */
  endingSoon: boolean;
};

export type LicenseInput = {
  firstSeen: string | null;
  latestSeen: string | null;
  unlocked: boolean;
  today: string;
};

export const UNLOCKED: License = { state: 'unlocked', daysLeft: 0, endsOn: '', endingSoon: false };

/**
 * Works out where the trial stands. `today` is read against `latestSeen`: a clock set back to an earlier day
 * is taken as the latest day already seen, never as extra time. A missing `firstSeen` means the trial starts
 * today (the caller persists it).
 */
export function licenseFrom({ firstSeen, latestSeen, unlocked, today }: LicenseInput): License {
  if (unlocked) return UNLOCKED;
  // A first day after today can only come from a clock set ahead before the first open; taken at face value it
  // would freeze the trial (used = 0 for years). It restarts from the real today instead (the store persists that).
  const clockWasAhead = firstSeen != null && firstSeen > today;
  const start = clockWasAhead || firstSeen == null ? today : firstSeen;
  const effectiveToday = !clockWasAhead && latestSeen && latestSeen > today ? latestSeen : today;
  const used = Math.max(0, daysBetween(start, effectiveToday));
  const daysLeft = Math.max(0, TRIAL_DAYS - used);
  const endsOn = addDays(start, TRIAL_DAYS);
  if (daysLeft === 0) return { state: 'ended', daysLeft: 0, endsOn, endingSoon: false };
  return { state: 'trial', daysLeft, endsOn, endingSoon: daysLeft <= NOTICE_DAYS };
}

/** The earlier of two first days, so a store-recorded trial start wins over a later local one. */
/** True when the recorded first day lies after today, so the store should rewrite both days to today. */
/**
 * A tester's free month must not carry into the store build: the beta and the store app share a bundle id, so
 * `app_state` survives the update. The month restarts once, when a build that was not the production profile is
 * followed by one that is. Profiles come from `EXPO_PUBLIC_BUILD_PROFILE` (eas.json); a bundle with none is left alone.
 */
export function trialRestartsForBuild(storedProfile: string | null, currentProfile: string | null): boolean {
  return currentProfile === 'production' && storedProfile != null && storedProfile !== 'production';
}

export function firstDayNeedsReset(firstSeen: string | null, today: string): boolean {
  return firstSeen != null && firstSeen > today;
}

export function earlierDay(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}
