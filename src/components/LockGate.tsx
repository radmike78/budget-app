import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, Modal, Platform, StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { useAppStore } from '@/store/useAppStore';
import { spacing, useTheme } from '@/theme';
import { authenticateWithReason } from '@/lib/appLock';
import { useT } from '@/i18n';
import { Button, Text } from './ui';

/** Re-lock when the app has been in the background longer than this. */
const RELOCK_AFTER_MS = 30_000;

/**
 * Covers the app while locked and while it is in the app switcher, so amounts
 * never show in screenshots or the task list when the lock is on.
 */
export function LockGate({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const t = useT();
  const enabled = useAppStore((s) => s.settings?.appLockEnabled ?? false);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const ready = useAppStore((s) => s.ready);
  const [locked, setLocked] = useState(enabled);
  const [covered, setCovered] = useState(false);
  const [busy, setBusy] = useState(false);
  const backgroundedAt = useRef<number | null>(null);

  const unlock = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await authenticateWithReason(t.unlockPrompt, t.cancel);
      if (result === 'ok') setLocked(false);
      else if (result === 'unavailable') {
        // The phone has no passcode or biometrics any more: the lock has nothing left to ask, so it turns off.
        setLocked(false);
        await updateSettings({ appLockEnabled: false });
      }
    } finally {
      setBusy(false);
    }
  }, [busy, t, updateSettings]);

  // Locked when the app opens with the lock on; turning it on in Settings has just asked, so it does not lock again.
  const wasEnabled = useRef<boolean | null>(null);
  useEffect(() => {
    if (!enabled) { setLocked(false); setCovered(false); wasEnabled.current = ready ? false : wasEnabled.current; return; }
    if (wasEnabled.current === false) { wasEnabled.current = true; return; }
    wasEnabled.current = true;
    setLocked(true);
  }, [enabled, ready]);

  useEffect(() => {
    if (ready && enabled && locked) unlock().catch(() => {});
    // Only on first readiness / lock transitions; unlock is stable per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, enabled, locked]);

  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        setCovered(false);
        const away = backgroundedAt.current ? Date.now() - backgroundedAt.current : 0;
        backgroundedAt.current = null;
        if (away > RELOCK_AFTER_MS) setLocked(true);
      } else {
        if (state === 'background' && backgroundedAt.current == null) backgroundedAt.current = Date.now();
        setCovered(true);
      }
    });
    return () => sub.remove();
  }, [enabled]);

  const show = enabled && (locked || covered);
  const cover = (
    <View style={[StyleSheet.absoluteFill, styles.cover, { backgroundColor: colors.bg }]} accessibilityViewIsModal>
      <Text variant="heading">{t.lockedTitle}</Text>
      {locked ? <View style={{ marginTop: spacing.lg }}><Button title={t.unlock} onPress={unlock} loading={busy} /></View> : null}
    </View>
  );
  // On iOS the cover is a window of its own above everything: a Modal is refused while a sheet or modal
  // screen is already presented, which would leave an open card visible in the app switcher. Android
  // stacks Modals, so one there sits above sheets too.
  return (
    <View style={{ flex: 1 }}>
      {children}
      {Platform.OS === 'ios'
        ? (show ? <FullWindowOverlay>{cover}</FullWindowOverlay> : null)
        : <Modal visible={show} animationType="none" statusBarTranslucent presentationStyle="fullScreen" onRequestClose={() => {}}>{cover}</Modal>}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
});
