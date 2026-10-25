import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme';
import { notify } from '@/lib/dialogs';
import { buyUnlock, unlockPrice } from '@/lib/purchases';
import { useT } from '@/i18n';
import { Button, Card, Row, Screen, SectionTitle, Text } from '@/components/ui';

/** The one place money is mentioned: where the free month stands, one price, one Buy, one Restore. */
export default function Unlock() {
  const t = useT();
  const license = useAppStore((s) => s.license);
  const recordUnlock = useAppStore((s) => s.recordUnlock);
  const restoreUnlock = useAppStore((s) => s.restoreUnlock);
  const [price, setPrice] = useState<string | null>(null);
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);

  useEffect(() => {
    let live = true;
    unlockPrice().then((p) => { if (live) setPrice(p); }).catch(() => {});
    return () => { live = false; };
  }, []);

  if (!license) return null;
  const status = license.state === 'unlocked' ? t.unlockStatusUnlocked : license.state === 'ended' ? t.unlockStatusEnded : t.unlockStatusTrial(license.daysLeft);

  const buy = async () => {
    setBusy('buy');
    try {
      const result = await buyUnlock();
      if (result === 'bought') { await recordUnlock(); notify(t.purchaseRow, t.purchaseDone); }
      else if (result === 'pending') notify(t.purchaseRow, t.purchasePending);
      else if (result === 'failed') notify(t.purchaseRow, price ? t.purchaseFailed : t.storeUnavailable);
    } finally {
      setBusy(null);
    }
  };
  const restore = async () => {
    setBusy('restore');
    try {
      notify(t.purchaseRow, (await restoreUnlock()) ? t.restoredOk : t.nothingToRestore);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen>
      <Card style={{ marginTop: spacing.sm }}>
        <Text variant="heading">{status}</Text>
        {license.state !== 'unlocked' ? <Text variant="muted" style={{ marginTop: spacing.xs }}>{t.trialTerms}</Text> : null}
      </Card>
      <SectionTitle>{t.unlockTitle}</SectionTitle>
      <Card>
        <Text variant="muted">{t.unlockBody}</Text>
        {license.state !== 'unlocked' && Platform.OS !== 'web' ? (
          <Row style={{ marginTop: spacing.md }}>
            <Button title={price ? t.buyFor(price) : t.buy} onPress={buy} loading={busy === 'buy'} disabled={busy != null} />
            <Button tone="ghost" title={t.restorePurchase} onPress={restore} loading={busy === 'restore'} disabled={busy != null} />
          </Row>
        ) : null}
      </Card>
    </Screen>
  );
}
