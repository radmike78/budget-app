import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import { radius, spacing, useTheme } from '@/theme';
import { useT } from '@/i18n';
import { Button, CONTENT_MAX_WIDTH, Text } from '@/components/ui';

/** How long the "Undo" offer stays on screen after an entry is removed. */
export const UNDO_WINDOW_MS = 6000;

/**
 * A small bar above the tab bar after an entry is removed: "Entry removed. Undo".
 * There is no confirmation dialog before a removal; this is the safety net instead.
 */
export function UndoBar({ bottomOffset = 0 }: { bottomOffset?: number }) {
  const { colors } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const lastDeleted = useAppStore((s) => s.lastDeleted);
  const undo = useAppStore((s) => s.undoDelete);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastDeleted) { setVisible(false); return; }
    setVisible(true);
    // Someone using a screen reader would not otherwise know the bar appeared.
    AccessibilityInfo.announceForAccessibility?.(t.entryRemovedUndo);
    const timer = setTimeout(() => setVisible(false), UNDO_WINDOW_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastDeleted]);

  if (!visible || !lastDeleted) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + bottomOffset, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, paddingLeft: spacing.lg, paddingRight: spacing.xs, paddingVertical: spacing.xs, maxWidth: CONTENT_MAX_WIDTH - spacing.xl, marginHorizontal: spacing.lg }}>
        <Text variant="body" style={{ flexShrink: 1 }}>{t.entryRemovedUndo}</Text>
        <Button tone="secondary" small title={t.undo} onPress={() => { setVisible(false); undo(); }} style={{ marginLeft: spacing.sm }} />
      </View>
    </View>
  );
}
