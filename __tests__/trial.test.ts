/** The trial is arithmetic over dates; these pin the edges and the clock-back rule. */
import { trialRestartsForBuild, NOTICE_DAYS, TRIAL_DAYS, earlierDay, firstDayNeedsReset, licenseFrom } from '@/lib/trial';

const day0 = '2026-11-01';

describe('the 30-day trial', () => {
  it('starts today when nothing is recorded, with the full 30 days', () => {
    const l = licenseFrom({ firstSeen: null, latestSeen: null, unlocked: false, today: day0 });
    expect(l).toMatchObject({ state: 'trial', daysLeft: TRIAL_DAYS, endsOn: '2026-12-01', endingSoon: false });
  });
  it('counts down by calendar day and ends on the thirty-first day', () => {
    expect(licenseFrom({ firstSeen: day0, latestSeen: day0, unlocked: false, today: '2026-11-02' }).daysLeft).toBe(29);
    expect(licenseFrom({ firstSeen: day0, latestSeen: day0, unlocked: false, today: '2026-11-30' })).toMatchObject({ state: 'trial', daysLeft: 1, endingSoon: true });
    expect(licenseFrom({ firstSeen: day0, latestSeen: day0, unlocked: false, today: '2026-12-01' })).toMatchObject({ state: 'ended', daysLeft: 0, endingSoon: false });
    expect(licenseFrom({ firstSeen: day0, latestSeen: day0, unlocked: false, today: '2027-06-01' }).state).toBe('ended');
  });
  it('says ending soon only inside the notice window', () => {
    expect(licenseFrom({ firstSeen: day0, latestSeen: day0, unlocked: false, today: addDaysStr(day0, TRIAL_DAYS - NOTICE_DAYS - 1) }).endingSoon).toBe(false);
    expect(licenseFrom({ firstSeen: day0, latestSeen: day0, unlocked: false, today: addDaysStr(day0, TRIAL_DAYS - NOTICE_DAYS) }).endingSoon).toBe(true);
  });
  it('a clock set back never adds days', () => {
    // Seen on day 29, then the phone's date is set back to day 2: still day 29.
    const l = licenseFrom({ firstSeen: day0, latestSeen: '2026-11-30', unlocked: false, today: '2026-11-03' });
    expect(l.daysLeft).toBe(1);
    // Seen past the end, set back before it: still ended.
    expect(licenseFrom({ firstSeen: day0, latestSeen: '2026-12-05', unlocked: false, today: '2026-11-10' }).state).toBe('ended');
  });
  it('a clock set forward is taken at its word (it only shortens the trial)', () => {
    expect(licenseFrom({ firstSeen: day0, latestSeen: day0, unlocked: false, today: '2027-01-01' }).state).toBe('ended');
  });
  it('a clock set ahead before the first open cannot freeze the trial: the month restarts from the real today', () => {
    // First opened with the phone on 2030-01-01, then the clock put right: 30 days from today, not forever.
    const l = licenseFrom({ firstSeen: '2030-01-01', latestSeen: '2030-01-01', unlocked: false, today: day0 });
    expect(l).toMatchObject({ state: 'trial', daysLeft: TRIAL_DAYS, endsOn: '2026-12-01' });
    expect(firstDayNeedsReset('2030-01-01', day0)).toBe(true);
    expect(firstDayNeedsReset(day0, day0)).toBe(false);
    expect(firstDayNeedsReset(null, day0)).toBe(false);
  });
  it('unlocked wins over everything', () => {
    expect(licenseFrom({ firstSeen: day0, latestSeen: '2027-01-01', unlocked: true, today: '2027-02-01' })).toMatchObject({ state: 'unlocked', daysLeft: 0, endsOn: '' });
  });
  it('a store-recorded trial start earlier than the local one wins', () => {
    expect(earlierDay('2026-10-01', day0)).toBe('2026-10-01');
    expect(earlierDay(null, day0)).toBe(day0);
    expect(earlierDay(day0, null)).toBe(day0);
    expect(earlierDay(null, null)).toBeNull();
  });
});

function addDaysStr(d: string, n: number): string {
  const x = new Date(`${d}T12:00:00`);
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
}

describe('a tester’s month and the store build', () => {
  it('restarts once when a build that was not production is followed by the production one', () => {
    expect(trialRestartsForBuild('preview', 'production')).toBe(true);
    expect(trialRestartsForBuild('development', 'production')).toBe(true);
    expect(trialRestartsForBuild('production', 'production')).toBe(false);
    expect(trialRestartsForBuild(null, 'production')).toBe(false);
    expect(trialRestartsForBuild('preview', 'preview')).toBe(false);
    expect(trialRestartsForBuild('production', null)).toBe(false);
  });
});
