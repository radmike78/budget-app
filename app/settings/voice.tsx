import React from 'react';
import { spacing } from '@/theme';
import { useT } from '@/i18n';
import { VoicePicker } from '@/components/VoicePicker';
import { Screen, Text } from '@/components/ui';

export default function VoiceSettings() {
  const t = useT();
  return (
    <Screen keyboard>
      <Text variant="muted" style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>{t.voiceTip}</Text>
      <VoicePicker />
    </Screen>
  );
}
