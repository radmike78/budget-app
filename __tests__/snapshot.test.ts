import { SNAPSHOT_DB, needsSnapshot, snapshotTakenAt } from '../src/lib/snapshot';

describe('the copy made before an update', () => {
  it('is made only when a used database moves to a newer schema', () => {
    expect(needsSnapshot(0, 17)).toBe(false); // a fresh install
    expect(needsSnapshot(17, 17)).toBe(false); // already current
    expect(needsSnapshot(18, 17)).toBe(false); // a newer file than the app (never copied over)
    expect(needsSnapshot(16, 17)).toBe(true);
    expect(needsSnapshot(1, 17)).toBe(true);
    expect(needsSnapshot(NaN, 17)).toBe(false);
    expect(needsSnapshot(2.5, 17)).toBe(false);
  });
  it('lives beside the database under a fixed name', () => {
    expect(SNAPSHOT_DB).toMatch(/^onlybudget\.[a-z-]+\.db$/);
  });
  it('dates the copy from the file, in seconds or milliseconds, never in the future', () => {
    const now = Date.UTC(2026, 9, 28, 12, 0, 0);
    const taken = Date.UTC(2026, 9, 27, 21, 20, 0);
    expect(snapshotTakenAt(taken / 1000, now)).toBe('2026-10-27T21:20:00.000Z');
    expect(snapshotTakenAt(taken, now)).toBe('2026-10-27T21:20:00.000Z');
    expect(snapshotTakenAt(undefined, now)).toBe('2026-10-28T12:00:00.000Z');
    expect(snapshotTakenAt(0, now)).toBe('2026-10-28T12:00:00.000Z');
    expect(snapshotTakenAt(now + 86_400_000, now)).toBe('2026-10-28T12:00:00.000Z');
  });
});
