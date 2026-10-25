import React from 'react';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme';
import { useDateFormat, useT } from '@/i18n';
import { friendlyDate, localDay, today } from '@/lib/dates';
import { needsBackupNudge } from '@/lib/backupNudge';
import { Button, Card, Row, Text } from './ui';

/**
 * The free month and the one-time purchase, as seen on the screens.
 *
 * `useAdding()` says whether new things may still be added. `TrialEnded` is the card that stands where an
 * add would have been once the month is over: one sentence, what still works, and a button to the purchase
 * screen. `TrialNotice` is the one quiet line in the last week, dismissed for good with a tap. Nothing here
 * is red, counts down daily, or gets in the way of reading, asking and exporting.
 */
export function useAdding(): boolean {
  const license = useAppStore((s) => s.license);
  // Until the dates are read, nothing is withheld.
  return license == null || license.state !== 'ended';
}

export function TrialEnded({ style }: { style?: object }) {
  const t = useT();
  const router = useRouter();
  return (
    <Card tone="alt" style={[{ marginTop: spacing.sm }, style]}>
      <Text variant="heading">{t.trialEnded}</Text>
      <Text variant="muted" style={{ marginTop: spacing.xs }}>{t.trialEndedBody}</Text>
      <Row style={{ marginTop: spacing.md }}>
        <Button title={t.keepUsing} onPress={() => router.push('/settings/unlock')} />
      </Row>
    </Card>
  );
}

export function TrialNotice() {
  const t = useT();
  const router = useRouter();
  const license = useAppStore((s) => s.license);
  const dismissed = useAppStore((s) => s.trialNoticeDismissed);
  const dismiss = useAppStore((s) => s.dismissTrialNotice);
  if (!license || license.state !== 'trial' || !license.endingSoon || dismissed) return null;
  return (
    <Card style={{ marginTop: spacing.md }}>
      <Text variant="body">{t.trialEndsSoon(license.daysLeft)}</Text>
      <Row style={{ marginTop: spacing.sm, justifyContent: 'flex-end' }}>
        <Button tone="ghost" small title={t.notNow} onPress={() => dismiss().catch(() => {})} />
        <Button tone="secondary" small title={t.keepUsing} onPress={() => router.push('/settings/unlock')} />
      </Row>
    </Card>
  );
}

/** One quiet line when entries are worth keeping and no copy exists, or the last one is old. */
export function BackupNotice() {
  const t = useT();
  const fmt = useDateFormat();
  const router = useRouter();
  const settings = useAppStore((s) => s.settings);
  const entries = useAppStore((s) => s.recent.length);
  const dismissedOn = useAppStore((s) => s.backupNudgeDismissedOn);
  const dismiss = useAppStore((s) => s.dismissBackupNudge);
  if (!settings) return null;
  // `recent` holds the latest ten entries, so ten of them means at least that many exist.
  const why = needsBackupNudge({ lastBackupAt: settings.lastBackupAt, entries, dismissedOn, today: today() });
  if (!why) return null;
  return (
    <Card style={{ marginTop: spacing.md }}>
      <Text variant="body">{why === 'first' ? t.backupNudgeFirst : t.backupNudgeStale(friendlyDate(localDay(settings.lastBackupAt!), today(), fmt))}</Text>
      <Row style={{ marginTop: spacing.sm, justifyContent: 'flex-end' }}>
        <Button tone="ghost" small title={t.notNow} onPress={() => dismiss().catch(() => {})} />
        <Button tone="secondary" small title={t.backupExport} onPress={() => router.push('/settings/backup')} />
      </Row>
    </Card>
  );
}
