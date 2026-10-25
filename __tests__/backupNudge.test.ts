import { NUDGE_AFTER_ENTRIES, SNOOZE_DAYS, STALE_BACKUP_DAYS, needsBackupNudge } from '@/lib/backupNudge';

const today = '2026-11-20';
describe('the backup nudge', () => {
  it('waits for enough entries to be worth keeping', () => {
    expect(needsBackupNudge({ lastBackupAt: null, entries: NUDGE_AFTER_ENTRIES - 1, dismissedOn: null, today })).toBeNull();
    expect(needsBackupNudge({ lastBackupAt: null, entries: NUDGE_AFTER_ENTRIES, dismissedOn: null, today })).toBe('first');
  });
  it('says nothing after a recent backup, and speaks once it is old', () => {
    expect(needsBackupNudge({ lastBackupAt: '2026-11-01T10:00:00.000Z', entries: 50, dismissedOn: null, today })).toBeNull();
    expect(needsBackupNudge({ lastBackupAt: '2026-09-01T10:00:00.000Z', entries: 50, dismissedOn: null, today })).toBe('stale');
    expect(needsBackupNudge({ lastBackupAt: `2026-10-0${1}T10:00:00.000Z`, entries: 50, dismissedOn: null, today: '2026-11-15' })).toBe(STALE_BACKUP_DAYS <= 45 ? 'stale' : null);
  });
  it('"Not now" keeps it away for a month, then it may come back', () => {
    expect(needsBackupNudge({ lastBackupAt: null, entries: 50, dismissedOn: '2026-11-10', today })).toBeNull();
    expect(needsBackupNudge({ lastBackupAt: null, entries: 50, dismissedOn: '2026-10-01', today })).toBe('first');
    expect(SNOOZE_DAYS).toBe(30);
  });
});
