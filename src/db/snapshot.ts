import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { File } from 'expo-file-system';
import { SNAPSHOT_DB, snapshotTakenAt } from '@/lib/snapshot';

export interface SnapshotInfo {
  /** The schema version the copy is at. */
  version: number;
  /** When the copy was made, as an ISO instant. */
  takenAt: string;
}

/** The copy's file, through expo-file-system; null on the web, where the database lives in the browser. */
function snapshotFile(): File | null {
  if (Platform.OS === 'web') return null;
  return new File(SQLite.defaultDatabaseDirectory, SNAPSHOT_DB);
}

/** Copies the open database into the snapshot file, replacing an older copy. Best effort: the caller never waits on a failure. */
export async function takeSnapshot(db: SQLite.SQLiteDatabase): Promise<void> {
  if (Platform.OS === 'web') return;
  await SQLite.deleteDatabaseAsync(SNAPSHOT_DB).catch(() => {});
  const dest = await SQLite.openDatabaseAsync(SNAPSHOT_DB);
  try {
    await SQLite.backupDatabaseAsync({ sourceDatabase: db, destDatabase: dest });
  } finally {
    await dest.closeAsync().catch(() => {});
  }
}

/** What copy is on the phone, or null. */
export async function snapshotInfo(): Promise<SnapshotInfo | null> {
  const file = snapshotFile();
  if (!file || !file.exists) return null;
  const snap = await SQLite.openDatabaseAsync(SNAPSHOT_DB);
  try {
    const row = await snap.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const version = row?.user_version ?? 0;
    if (!version) return null;
    return { version, takenAt: snapshotTakenAt(file.modificationTime) };
  } finally {
    await snap.closeAsync().catch(() => {});
  }
}

/**
 * Puts the copy back over the open database. The caller closes that connection afterwards and opens the database
 * again, which runs the migrations once more on what the copy holds.
 */
export async function restoreSnapshotInto(db: SQLite.SQLiteDatabase): Promise<void> {
  if (Platform.OS === 'web') throw new Error('SNAPSHOT_UNAVAILABLE');
  const snap = await SQLite.openDatabaseAsync(SNAPSHOT_DB);
  try {
    const row = await snap.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    if (!row?.user_version) throw new Error('SNAPSHOT_EMPTY');
    await SQLite.backupDatabaseAsync({ sourceDatabase: snap, destDatabase: db });
  } finally {
    await snap.closeAsync().catch(() => {});
  }
}

/** Removes the copy. Nothing happens when there is none. */
export async function deleteSnapshot(): Promise<void> {
  if (Platform.OS === 'web') return;
  await SQLite.deleteDatabaseAsync(SNAPSHOT_DB).catch(() => {});
}
