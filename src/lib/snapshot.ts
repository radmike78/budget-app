/**
 * The copy of the database made just before a schema migration, so an update that goes wrong can be undone from
 * Settings. Pure: which versions call for a copy, and the file's name. The platform work is in `src/db/snapshot.ts`.
 */

/** The copy lives beside the database, in the app's own directory, so it is protected and never backed up by the OS. */
export const SNAPSHOT_DB = 'onlybudget.before-update.db';

/**
 * A copy is made when a database that has been used (version above zero) is about to move to a newer schema.
 * A fresh install has nothing to keep, and a database already at the current version is not touched.
 */
export function needsSnapshot(storedVersion: number, targetVersion: number): boolean {
  return Number.isInteger(storedVersion) && storedVersion > 0 && storedVersion < targetVersion;
}

/** The copy's own date, from the file's modification time (seconds or milliseconds), as an ISO instant. */
export function snapshotTakenAt(modificationTime: number | undefined | null, now: number = Date.now()): string {
  const ms = typeof modificationTime === 'number' && modificationTime > 0 ? (modificationTime < 1e12 ? modificationTime * 1000 : modificationTime) : now;
  return new Date(Math.min(ms, now)).toISOString();
}
