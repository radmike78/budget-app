/**
 * The phone-side copy module, with expo-sqlite and the file system stood in for: what it opens, copies, closes and
 * refuses, since no device runs here.
 */
// Mock factories may only reach globals; the shared state hangs off one.
const g = globalThis as unknown as { snapMock: { calls: string[]; fileExists: boolean; snapVersion: number } };
g.snapMock = { calls: [], fileExists: true, snapVersion: 16 };
const calls = g.snapMock.calls;

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
jest.mock('expo-file-system', () => ({
  File: class { exists: boolean; modificationTime: number; constructor(...parts: string[]) { const m = (globalThis as unknown as { snapMock: { calls: string[]; fileExists: boolean } }).snapMock; m.calls.push(`file ${parts.join('/')}`); this.exists = m.fileExists; this.modificationTime = 1_700_000_000_000; } },
}));
jest.mock('expo-sqlite', () => {
  const m = () => (globalThis as unknown as { snapMock: { calls: string[]; snapVersion: number } }).snapMock;
  return {
    defaultDatabaseDirectory: '/data/SQLite',
    deleteDatabaseAsync: async (name: string) => { m().calls.push(`delete ${name}`); },
    openDatabaseAsync: async (name: string) => {
      m().calls.push(`open ${name}`);
      return {
        name,
        getFirstAsync: async () => ({ user_version: m().snapVersion }),
        closeAsync: async () => { m().calls.push(`close ${name}`); },
      };
    },
    backupDatabaseAsync: async ({ sourceDatabase, destDatabase }: { sourceDatabase: { name: string }; destDatabase: { name: string } }) => { m().calls.push(`backup ${sourceDatabase.name} -> ${destDatabase.name}`); },
  };
});

import { deleteSnapshot, restoreSnapshotInto, snapshotInfo, takeSnapshot } from '../src/db/snapshot';
import { SNAPSHOT_DB } from '../src/lib/snapshot';

const main = { name: 'main', getFirstAsync: async () => ({ user_version: 17 }), closeAsync: async () => {} } as never;

beforeEach(() => { calls.length = 0; g.snapMock.fileExists = true; g.snapMock.snapVersion = 16; });

describe('the copy on the phone', () => {
  it('replaces the older copy, copies the open database and closes the copy', async () => {
    await takeSnapshot(main);
    expect(calls).toEqual([`delete ${SNAPSHOT_DB}`, `open ${SNAPSHOT_DB}`, `backup main -> ${SNAPSHOT_DB}`, `close ${SNAPSHOT_DB}`]);
  });
  it('describes the copy by its own version and the file date, and closes it again', async () => {
    const info = await snapshotInfo();
    expect(info).toEqual({ version: 16, takenAt: '2023-11-14T22:13:20.000Z' });
    expect(calls).toContain(`close ${SNAPSHOT_DB}`);
  });
  it('answers null with no file, without opening anything', async () => {
    g.snapMock.fileExists = false;
    expect(await snapshotInfo()).toBeNull();
    expect(calls.filter((c) => c.startsWith('open'))).toEqual([]);
  });
  it('answers null for an empty file', async () => {
    g.snapMock.snapVersion = 0;
    expect(await snapshotInfo()).toBeNull();
  });
  it('writes the copy over the open database and refuses an empty copy', async () => {
    await restoreSnapshotInto(main);
    expect(calls).toEqual([`open ${SNAPSHOT_DB}`, `backup ${SNAPSHOT_DB} -> main`, `close ${SNAPSHOT_DB}`]);
    calls.length = 0; g.snapMock.snapVersion = 0;
    await expect(restoreSnapshotInto(main)).rejects.toThrow('SNAPSHOT_EMPTY');
    expect(calls).not.toContainEqual(expect.stringContaining('backup'));
    expect(calls).toContain(`close ${SNAPSHOT_DB}`);
  });
  it('deletes by name', async () => {
    await deleteSnapshot();
    expect(calls).toEqual([`delete ${SNAPSHOT_DB}`]);
  });
});
