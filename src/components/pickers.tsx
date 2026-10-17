import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Category, TxType } from '@/types';
import { radius, spacing, useTheme } from '@/theme';
import { addDays, daysInMonth, friendlyDate, fromDateString, isValidDateString, today } from '@/lib/dates';
import { categoryName, useDateFormat, useT } from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { Button, Chip, Field, Icon, ListItem, Row, Text } from './ui';

/** Bottom sheet container used by all pickers. */
/**
 * `scroll` wraps the contents in a scroll view (for forms): on a small phone the keyboard can otherwise cover
 * Save with no way to reach it, since the decimal pad has no return key. Sheets that hold a list of their
 * own leave it off.
 */
export function Sheet({ visible, onClose, title, children, tall, scroll }: { visible: boolean; onClose: () => void; title?: string; children: React.ReactNode; tall?: boolean; scroll?: boolean }) {
  const { colors } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // On tablets a sheet spanning the whole width reads badly; keep it a phone-sized column, centred.
  const wide = width >= 700;
  // Absolute positioning ignores alignSelf, so the side offsets do the centring.
  const side = Math.max(0, Math.round((width - 760) / 2));
  const widthStyle = wide ? { left: side, right: side, marginBottom: spacing.xl, borderBottomLeftRadius: radius.lg + 6, borderBottomRightRadius: radius.lg + 6 } : null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} onPress={onClose} accessibilityRole="button" accessibilityLabel={t.close} />
      {/* Padding on Android too: edge-to-edge (Android 15+) no longer shrinks the window for the keyboard. */}
      <KeyboardAvoidingView behavior="padding" style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={[styles.sheet, widthStyle, { backgroundColor: colors.bg, paddingBottom: insets.bottom + spacing.lg, maxHeight: tall ? '92%' : '80%' }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          {title ? <Text variant="heading" style={{ marginBottom: spacing.md }}>{title}</Text> : null}
          {scroll ? (
            <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
              {children}
            </ScrollView>
          ) : children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function CategoryPicker({ visible, onClose, onPick, kind, selectedId, categories }: {
  visible: boolean;
  onClose: () => void;
  onPick: (c: Category) => void;
  kind: TxType | 'all';
  selectedId: string | null;
  categories: Category[];
}) {
  const t = useT();
  const list = useMemo(() => categories.filter((c) => !c.archived && (kind === 'all' || c.kind === kind)), [categories, kind]);
  return (
    <Sheet visible={visible} onClose={onClose} title={t.category} tall>
      <FlatList
        data={list}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <ListItem
            title={categoryName(item, t)}
            left={<Icon glyph={item.icon} size={22} />}
            right={item.id === selectedId ? <Text color={undefined} variant="body">✓</Text> : null}
            onPress={() => { onPick(item); onClose(); }}
          />
        )}
      />
    </Sheet>
  );
}

/**
 * `future`: a deadline (months ahead). `mode` 'reminder' or 'start' (the first date of a repeating entry): today
 * or the days just after. `past`: something that has already happened (the last payday), today or earlier. Neither may be in the past; an entry's own date may be any day at all.
 */
export function DatePicker({ visible, onClose, value, onPick, future, mode, past }: { visible: boolean; onClose: () => void; value: string; onPick: (d: string) => void; future?: boolean; mode?: 'reminder' | 'start'; past?: boolean }) {
  const t = today();
  const s = useT();
  const fmt = useDateFormat();
  const quick = mode
    ? [
        { label: s.today, date: t },
        { label: s.tomorrow, date: addDays(t, 1) },
        { label: s.inAWeek, date: addDays(t, 7) },
        { label: s.inAMonth, date: addDays(t, 30) },
      ]
    : future
    ? [
        { label: s.inAMonth, date: addDays(t, 30) },
        { label: s.in3Months, date: addDays(t, 90) },
        { label: s.in6Months, date: addDays(t, 180) },
        { label: s.inAYear, date: addDays(t, 365) },
      ]
    : [
        { label: s.today, date: t },
        { label: s.yesterday, date: addDays(t, -1) },
        { label: friendlyDate(addDays(t, -2), t, fmt), date: addDays(t, -2) },
        { label: friendlyDate(addDays(t, -3), t, fmt), date: addDays(t, -3) },
      ];
  const forward = future || !!mode;
  return (
    <Sheet visible={visible} onClose={onClose} title={s.date} scroll>
      <Row style={{ flexWrap: 'wrap' }}>
        {quick.map((q) => (
          <Chip key={q.date} label={q.label} selected={value === q.date} onPress={() => { onPick(q.date); onClose(); }} />
        ))}
      </Row>
      <View style={{ height: spacing.lg }} />
      <MonthGrid value={value} earliest={forward ? t : null} latest={past ? t : null} onPick={(d) => { onPick(d); onClose(); }} />
      {value ? <Text variant="small" style={{ marginTop: spacing.md }}>{s.currently(friendlyDate(value, t, fmt))}</Text> : null}
    </Sheet>
  );
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** A month of days to tap, Sunday first like the rest of the app; days before `earliest` cannot be picked. */
function MonthGrid({ value, earliest, latest, onPick }: { value: string; earliest: string | null; latest: string | null; onPick: (d: string) => void }) {
  const { colors } = useTheme();
  const s = useT();
  const fmt = useDateFormat();
  const todayStr = today();
  const start = fromDateString(isValidDateString(value) ? value : todayStr);
  const [shown, setShown] = useState({ y: start.getFullYear(), m: start.getMonth() });
  useEffect(() => {
    const d = fromDateString(isValidDateString(value) ? value : today());
    setShown({ y: d.getFullYear(), m: d.getMonth() });
  }, [value]);
  const step = (delta: number) => setShown(({ y, m }) => ({ y: m + delta < 0 ? y - 1 : m + delta > 11 ? y + 1 : y, m: (m + delta + 12) % 12 }));
  const firstDow = new Date(shown.y, shown.m, 1).getDay();
  const count = daysInMonth(shown.y, shown.m);
  const cells: (string | null)[] = [...Array.from({ length: firstDow }, () => null), ...Array.from({ length: count }, (_, i) => `${shown.y}-${pad2(shown.m + 1)}-${pad2(i + 1)}`)];
  while (cells.length % 7) cells.push(null);
  const canGoBack = !earliest || `${shown.y}-${pad2(shown.m + 1)}` > earliest.slice(0, 7);
  const canGoOn = !latest || `${shown.y}-${pad2(shown.m + 1)}` < latest.slice(0, 7);
  return (
    <View>
      <Row style={{ justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <Pressable accessibilityRole="button" accessibilityLabel={s.previousMonth} onPress={() => step(-1)} disabled={!canGoBack} hitSlop={12} style={{ opacity: canGoBack ? 1 : 0.3, padding: spacing.xs }}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text variant="body" style={{ fontWeight: '600' }}>{fmt.monthYear(fmt.months[shown.m], shown.y)}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={s.nextMonth} onPress={() => step(1)} disabled={!canGoOn} hitSlop={12} style={{ opacity: canGoOn ? 1 : 0.3, padding: spacing.xs }}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </Pressable>
      </Row>
      <View style={{ flexDirection: 'row' }}>
        {fmt.weekdaysShort.map((w) => <Text key={w} variant="small" style={{ flex: 1, textAlign: 'center' }} maxFontSizeMultiplier={1.4} numberOfLines={1}>{w}</Text>)}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {cells.slice(row * 7, row * 7 + 7).map((d, i) => {
            if (!d) return <View key={i} style={{ flex: 1, height: 44 }} />;
            const off = (!!earliest && d < earliest) || (!!latest && d > latest);
            const selected = d === value;
            return (
              <Pressable
                key={d}
                accessibilityRole="button"
                accessibilityLabel={friendlyDate(d, todayStr, fmt)}
                accessibilityState={{ selected, disabled: off }}
                disabled={off}
                onPress={() => onPick(d)}
                style={{ flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.accent : 'transparent', borderWidth: d === todayStr && !selected ? 1 : 0, borderColor: colors.accent }}>
                  <Text variant="body" maxFontSizeMultiplier={1.4} color={selected ? colors.onAccent : off ? colors.faint : colors.text}>{Number(d.slice(8))}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const QUICK_TIMES = ['07:00', '08:00', '09:00', '12:00', '15:00', '18:00', '20:00', '21:00'];
const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/** Time of day for reminders: a few common hours plus a typed HH:MM. */
export function TimePicker({ visible, onClose, value, onPick }: { visible: boolean; onClose: () => void; value: string; onPick: (t: string) => void }) {
  const s = useT();
  const [custom, setCustom] = useState(value);
  useEffect(() => { if (visible) setCustom(value); }, [visible, value]);
  const valid = TIME_RE.test(custom);
  const normalized = valid ? custom.padStart(5, '0') : custom;
  return (
    <Sheet visible={visible} onClose={onClose} title={s.time} scroll>
      <Row style={{ flexWrap: 'wrap' }}>
        {QUICK_TIMES.map((q) => (
          <Chip key={q} label={q} selected={value === q} onPress={() => { onPick(q); onClose(); }} />
        ))}
      </Row>
      <View style={{ height: spacing.lg }} />
      <Row gap={spacing.sm} align="flex-end">
        <Field label={s.orTypeTime} placeholder="HH:MM" value={custom} onChangeText={setCustom} autoCapitalize="none" keyboardType="numbers-and-punctuation" style={{ flex: 1, marginBottom: 0 }} hint={custom && !valid ? s.timeFormatHint : undefined} />
        <Button title={s.use} disabled={!valid} onPress={() => { onPick(normalized); onClose(); }} />
      </Row>
    </Sheet>
  );
}

const EMOJI = ['🧾', '🥦', '🍽️', '🏠', '💡', '🚌', '🩺', '🎬', '🛍️', '🔁', '🏦', '🐖', '💼', '🛠️', '🎁', '➕', '🐶', '🐱', '👶', '🎓', '✈️', '🏖️', '🎮', '📚', '🚗', '⛽', '🧹', '💇', '🎵', '🏋️', '☕', '🍕', '🍺', '🎂', '💊', '🧸', '📱', '💻', '🌱', '🧳', '🎨', '⚽', '🏠', '🔧', '💐', '🧼', '🚲', '🎟️', '🍔', '🥐'];

export function EmojiPicker({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (e: string) => void }) {
  const t = useT();
  return (
    <Sheet visible={visible} onClose={onClose} title={t.pickIconTitle}>
      <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {EMOJI.map((e, i) => (
          <Pressable key={`${e}-${i}`} accessibilityRole="button" accessibilityLabel={e} onPress={() => { onPick(e); onClose(); }} style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 28 }}>{e}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: radius.lg + 6, borderTopRightRadius: radius.lg + 6, padding: spacing.lg, paddingTop: spacing.sm },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: spacing.md },
});
