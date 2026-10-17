import { useAppStore } from '@/store/useAppStore';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { MAX_ENTRY_LENGTH } from '@/lib/validate';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, useTheme } from '@/theme';
import { useVoiceInput } from '@/lib/speech';
import { useT } from '@/i18n';
import { Text, useTypeScale } from './ui';

/**
 * The single prominent input: a text field and a big mic button.
 * Voice results go straight to `onSubmit`; typed text goes on return/tap.
 */
export type EntrySource = 'voice' | 'typed';

export function EntryBar({ onSubmit, busy, autoFocus }: { onSubmit: (text: string, source: EntrySource) => void; busy?: boolean; autoFocus?: boolean }) {
  const { colors } = useTheme();
  const scale = useTypeScale();
  const t = useT();
  // The example hint earns its place only until the first entries exist.
  const hasEntries = useAppStore((st) => st.recent.length > 0);
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const voice = useVoiceInput((final) => {
    setText('');
    onSubmit(final, 'voice');
  });

  useEffect(() => {
    if (voice.listening) setText(voice.transcript);
  }, [voice.listening, voice.transcript]);

  const send = () => {
    const value = text.trim();
    if (!value) return;
    setText('');
    onSubmit(value, 'typed');
  };

  const toggleMic = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (voice.listening) {
      voice.stop();
    } else {
      inputRef.current?.blur();
      await voice.start();
    }
  };

  return (
    <View>
      <View style={[styles.bar, { backgroundColor: colors.card, borderColor: voice.listening ? colors.accent : colors.border }]}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
          returnKeyType="done"
          blurOnSubmit
          autoFocus={autoFocus}
          editable={!voice.listening && !busy}
          placeholder={voice.listening ? t.listening : t.entryPlaceholder}
          placeholderTextColor={colors.faint}
          accessibilityLabel={t.entryText}
          maxLength={MAX_ENTRY_LENGTH}
          style={[styles.input, { color: colors.text, fontSize: 18 * scale }]}
        />
        {text.trim().length > 0 && !voice.listening ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t.addEntry} onPress={send} style={[styles.sendBtn, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="arrow-up" size={22} color={colors.accent} />
          </Pressable>
        ) : null}
        {voice.available ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={voice.listening ? t.stopListening : t.speakEntry}
            onPress={toggleMic}
            disabled={busy}
            style={({ pressed }) => [styles.mic, { backgroundColor: voice.listening ? colors.danger : colors.accent, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name={voice.listening ? 'stop' : 'mic'} size={28} color={colors.onAccent} />
          </Pressable>
        ) : null}
      </View>
      {voice.listening ? (
        <Text variant="small" style={{ marginTop: 6, marginLeft: 4 }}>{t.listeningHint(voice.onDevice)}</Text>
      ) : voice.error ? (
        <Pressable onPress={voice.clearError}><Text variant="small" color={colors.danger} style={{ marginTop: 6, marginLeft: 4 }}>{voice.error}</Text></Pressable>
      ) : busy ? (
        <Text variant="small" style={{ marginTop: 6, marginLeft: 4 }}>{t.checking}</Text>
      ) : (
        hasEntries ? null : <Text variant="small" style={{ marginTop: 6, marginLeft: 4 }}>{t.tryHint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, borderWidth: 1.5, paddingLeft: spacing.lg, paddingRight: 6, paddingVertical: 6, minHeight: 64, gap: 6 },
  // minWidth 0: on the web an input otherwise keeps its own width and pushes the mic off a narrow screen.
  input: { flex: 1, minWidth: 0, fontSize: 18, paddingVertical: 10, minHeight: 48 },
  mic: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
