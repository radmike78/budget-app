import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import type { Attitude, Voice, VoiceGender } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { radius, spacing, useTheme } from '@/theme';
import { useLanguageCode, useT } from '@/i18n';
import { formatMoney } from '@/lib/money';
import { sampleLine } from '@/lib/personas';
import { speak } from '@/lib/speak';
import { Button, Card, Row, Segmented, Text } from '@/components/ui';

/**
 * Spoken voice (female or male), the persona, and how far it may go. Used by
 * onboarding and by Settings → Voice; every change is saved as it is made.
 */
export function VoicePicker({ compact = false }: { compact?: boolean }) {
  const { colors } = useTheme();
  const t = useT();
  const languageCode = useLanguageCode();
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [seed, setSeed] = useState(0);
  const voice = settings?.voice ?? 'plain';
  const attitude = settings?.attitude ?? 'playful';
  const gender = settings?.voiceGender ?? 'female';
  const currency = settings?.currency ?? 'USD';

  const personas: { value: Voice; label: string; desc: string }[] = [
    { value: 'friend', label: t.voiceFriend, desc: t.voiceDescFriend },
    { value: 'coach', label: t.voiceCoach, desc: t.voiceDescCoach },
    { value: 'roaster', label: t.voiceRoaster, desc: t.voiceDescRoaster },
    { value: 'plain', label: t.voicePlain, desc: t.voiceDescPlain },
  ];
  const example = useMemo(
    () => sampleLine({ voice, attitude, language: languageCode }, (n) => formatMoney(n, currency, { compact: true })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [voice, attitude, languageCode, currency, seed],
  );

  return (
    <View>
      <Text variant="label" style={{ marginBottom: spacing.sm }}>{t.voiceGender}</Text>
      <Segmented<VoiceGender> value={gender} onChange={(voiceGender) => updateSettings({ voiceGender })} options={[{ value: 'female', label: t.voiceFemale }, { value: 'male', label: t.voiceMale }]} />

      <Text variant="label" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>{t.voice}</Text>
      {personas.map((p) => {
        const selected = voice === p.value;
        return (
          <Pressable key={p.value} accessibilityRole="button" accessibilityState={{ selected }} aria-selected={selected} onPress={() => updateSettings({ voice: p.value })}>
            <View style={{ borderWidth: 2, borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.accentSoft : colors.card, borderRadius: radius.md, paddingVertical: compact ? spacing.sm : spacing.md, paddingHorizontal: spacing.md, marginBottom: spacing.sm }}>
              <Text variant="body" style={{ fontWeight: '600' }}>{p.label}</Text>
              <Text variant="small" style={{ marginTop: 2 }}>{p.desc}</Text>
            </View>
          </Pressable>
        );
      })}

      {voice !== 'plain' ? (
        <View style={{ marginTop: spacing.md }}>
          <Text variant="label" style={{ marginBottom: spacing.sm }}>{t.attitude}</Text>
          <Segmented<Attitude> value={attitude} onChange={(a) => updateSettings({ attitude: a })} options={[{ value: 'nice', label: t.attitudeNice }, { value: 'playful', label: t.attitudePlayful }, { value: 'spicy', label: t.attitudeSpicy }]} />
          {example ? (
            <Card tone="accent" style={{ marginTop: spacing.md }}>
              <Text variant="small">{t.voiceExample}</Text>
              <Text variant="body" style={{ marginTop: 2, fontStyle: 'italic' }}>{example}</Text>
              <Row style={{ marginTop: spacing.sm, justifyContent: 'flex-end' }}>
                <Button tone="ghost" small title={t.voiceAnother} onPress={() => setSeed((n) => n + 1)} />
                <Button tone="secondary" small title={t.voiceHear} onPress={() => speak(example, languageCode, gender)} />
              </Row>
            </Card>
          ) : null}
          {languageCode !== 'en' ? <Text variant="small" style={{ marginTop: spacing.sm }}>{t.voiceEnglishOnly}</Text> : null}
        </View>
      ) : null}
      <Text variant="small" style={{ marginTop: spacing.md }}>{t.voiceSub}</Text>
    </View>
  );
}

/** "Roaster · Spicy · Male" for list rows. */
export function useVoiceSummary(): string {
  const t = useT();
  const settings = useAppStore((s) => s.settings);
  if (!settings) return '';
  const voice = { plain: t.voicePlain, friend: t.voiceFriend, coach: t.voiceCoach, roaster: t.voiceRoaster }[settings.voice];
  const attitude = { nice: t.attitudeNice, playful: t.attitudePlayful, spicy: t.attitudeSpicy }[settings.attitude];
  const gender = settings.voiceGender === 'male' ? t.voiceMale : t.voiceFemale;
  return settings.voice === 'plain' ? `${voice} · ${gender}` : `${voice} · ${attitude} · ${gender}`;
}
