import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/store/useAppStore';
import { personaLineForTransaction } from '@/components/persona';
import { radius, spacing, useTheme } from '@/theme';
import { friendlyDate, longDate, nowIso, today } from '@/lib/dates';
import { moneyInputText, parseMoneyInput } from '@/lib/money';
import { newId } from '@/lib/ids';
import { categoryName, hintText, useDateFormat, useLocale, useMoney, useT } from '@/i18n';
import { HINT, type ParseResult } from '@/parser';
import type { GoalKind, ReminderRepeat, TxType } from '@/types';
import { CategoryPicker, DatePicker, Sheet, TimePicker } from './pickers';
import { notify } from '@/lib/dialogs';
import { reminderDateTime } from '@/lib/reminders';
import { Button, Field, Row, Segmented, Text } from './ui';

interface Draft {
  key: string;
  kind: 'transaction' | 'goal' | 'contribution' | 'reminder';
  raw: string;
  amountText: string;
  type: TxType;
  categoryId: string | null;
  originalCategoryId: string | null;
  note: string;
  date: string;
  goalName: string;
  goalKind: GoalKind;
  targetDate: string | null;
  goalId: string | null;
  reminderText: string;
  reminderTime: string;
  reminderRepeat: ReminderRepeat;
  hints: string[];
}

function toDraft(r: ParseResult, i: number, decimalComma: boolean): Draft {
  return {
    key: `${i}-${r.raw}`,
    kind: r.kind === 'unknown' || r.kind === 'question' || r.kind === 'command' || r.kind === 'correction' ? 'transaction' : r.kind,
    raw: r.raw,
    amountText: r.amount != null ? moneyInputText(r.amount, decimalComma) : '',
    type: r.type,
    categoryId: r.categoryId,
    originalCategoryId: r.categoryId,
    note: r.note ?? '',
    date: r.occurredAt,
    goalName: r.goalName ?? '',
    goalKind: r.goalKind ?? 'saving',
    targetDate: r.targetDate ?? null,
    goalId: r.goalId,
    reminderText: r.reminderText ?? '',
    reminderTime: r.reminderTime ?? '09:00',
    reminderRepeat: r.reminderRepeat ?? 'none',
    hints: r.hints,
  };
}

/**
 * One sentence (or several) can carry several expenses. This card lists each
 * one as its own editable row so the user can fix a category or amount, drop
 * a row, and save the rest together. Nothing is saved until "Save all".
 */
export function MultiConfirmationCard({ results, onDone, onCancel }: { results: ParseResult[] | null; onDone: (message: string, line?: string | null) => void; onCancel: () => void }) {
  const { colors } = useTheme();
  const t = useT();
  const locale = useLocale();
  const money = useMoney();
  const fmt = useDateFormat();
  const categories = useAppStore((s) => s.categories);
  const goals = useAppStore((s) => s.goals);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const saveGoal = useAppStore((s) => s.saveGoal);
  const contributeToGoal = useAppStore((s) => s.contributeToGoal);
  const learnCategory = useAppStore((s) => s.learnCategory);
  const addReminder = useAppStore((s) => s.addReminder);

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [pickingCat, setPickingCat] = useState<number | null>(null);
  const [pickingDate, setPickingDate] = useState<number | null>(null);
  const [pickingTargetDate, setPickingTargetDate] = useState<number | null>(null);
  const [pickingTime, setPickingTime] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!results) return;
    setDrafts(results.map((r, i) => toDraft(r, i, locale.format.decimal === ',')));
    setError(null);
  }, [results]);

  const decimalComma = locale.format.decimal === ',';
  const rawText = useMemo(() => {
    if (!results || results.length === 0) return '';
    const first = results[0].raw;
    const same = results.every((r) => r.raw === first);
    return same ? first : results.map((r) => r.raw).join(' · ');
  }, [results]);

  const update = (i: number, patch: Partial<Draft>) => setDrafts((d) => d.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const remove = (i: number) => {
    const next = drafts.filter((_, j) => j !== i);
    if (next.length === 0) { onCancel(); return; }
    setDrafts(next);
  };
  const changeType = (i: number, next: TxType) => {
    const row = drafts[i];
    const cat = categories.find((c) => c.id === row.categoryId);
    let categoryId = row.categoryId;
    if (cat && cat.kind !== next) {
      const fallback = categories.find((c) => !c.archived && c.kind === next && c.id === (next === 'income' ? 'other_income' : 'other_expense'));
      categoryId = fallback?.id ?? categories.find((c) => !c.archived && c.kind === next)?.id ?? null;
    }
    update(i, { type: next, categoryId });
  };

  const saveAll = async () => {
    const amounts = drafts.map((d) => (d.kind === 'reminder' ? 1 : parseMoneyInput(d.amountText, decimalComma)));
    if (amounts.some((a) => a == null || a <= 0)) { setError(t.enterAmount); return; }
    if (drafts.some((d) => d.kind === 'reminder' && !d.reminderText.trim())) { setError(t.giveReminderText); return; }
    if (drafts.some((d) => d.kind === 'reminder' && d.reminderRepeat === 'none' && reminderDateTime(d.date, d.reminderTime) <= new Date())) { setError(t.reminderInPast); return; }
    if (drafts.some((d) => d.kind === 'goal' && !d.goalName.trim())) { setError(t.giveGoalName); return; }
    setSaving(true);
    setError(null);
    let out = 0;
    let inc = 0;
    let blocked: 'denied' | 'unsupported' | null = null;
    let biggest: { amount: number; type: 'income' | 'expense'; categoryId: string | null; note: string | null; occurredAt: string } | null = null;
    const saveOne = async (d: Draft, amount: number) => {
      if (d.kind === 'reminder') {
        const state = await addReminder({ text: d.reminderText.trim(), date: d.date, time: d.reminderTime, repeat: d.reminderRepeat });
        if (state !== 'granted') blocked = state;
        return;
      }
      if (d.kind === 'goal') {
        await saveGoal({ id: newId(), name: d.goalName.trim(), kind: d.goalKind, targetAmount: amount, currentAmount: 0, targetDate: d.targetDate, createdAt: nowIso(), completed: false });
        return;
      }
      if (d.kind === 'contribution' && d.goalId) {
        await contributeToGoal(d.goalId, amount, { logTransfer: true, occurredAt: d.date, rawInput: d.raw });
        out += amount;
        return;
      }
      await addTransaction({ amount, type: d.type, categoryId: d.categoryId, note: d.note.trim() || null, rawInput: d.raw, occurredAt: d.date });
      if (d.categoryId && d.categoryId !== d.originalCategoryId && d.raw) await learnCategory(d.raw, d.categoryId);
      if (d.type === 'income') inc += amount; else out += amount;
      if (d.type === 'expense' && (!biggest || amount > biggest.amount)) biggest = { amount, type: d.type, categoryId: d.categoryId, note: d.note.trim() || null, occurredAt: d.date };
    };
    const savedKeys = new Set<string>();
    try {
      for (let i = 0; i < drafts.length; i++) {
        await saveOne(drafts[i], amounts[i] as number);
        savedKeys.add(drafts[i].key);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onDone(t.toastLoggedMany(drafts.length, out > 0 ? money(out, { compact: true }) : null, inc > 0 ? money(inc, { compact: true }) : null), biggest ? await personaLineForTransaction(biggest, t) : null);
      if (blocked) notify(t.notificationsNeeded, blocked === 'unsupported' ? t.remindersUnsupported : t.notificationsNeededBody);
    } catch (e) {
      // What was saved stays saved and leaves the list, so trying again cannot log it twice.
      setDrafts((list) => list.filter((d) => !savedKeys.has(d.key)));
      setError(t.didntWork((e as Error).message));
    } finally {
      setSaving(false);
    }
  };

  if (!results) return null;
  const catRow = pickingCat != null ? drafts[pickingCat] : null;
  const dateRow = pickingDate != null ? drafts[pickingDate] : null;
  const targetRow = pickingTargetDate != null ? drafts[pickingTargetDate] : null;

  return (
    <Sheet visible={!!results} onClose={onCancel} tall>
      <Row style={{ justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <Text variant="heading">{t.multiTitle(drafts.length)}</Text>
        <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel={t.cancel} hitSlop={12} style={{ minHeight: 44, justifyContent: 'center' }}><Text variant="muted">{t.cancel}</Text></Pressable>
      </Row>
      <Text variant="small" numberOfLines={2}>"{rawText}"</Text>
      <Text variant="muted" style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>{t.multiIntro}</Text>

      <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled">
        {drafts.map((d, i) => {
          const category = categories.find((c) => c.id === d.categoryId) ?? null;
          const goal = d.goalId ? goals.find((g) => g.id === d.goalId) : null;
          const catLabel = category ? `${category.icon ?? ''} ${categoryName(category, t)}`.trim() : t.pickCategory;
          const unsure = d.hints.includes(HINT.unsureCategory);
          const title = d.kind === 'reminder' ? t.newReminder : d.kind === 'goal' ? t.newGoal : d.kind === 'contribution' ? t.addTo(goal?.name ?? '') : d.note || (d.type === 'income' ? t.moneyIn : t.moneyOut);
          return (
            <View key={d.key} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Row style={{ justifyContent: 'space-between', marginBottom: spacing.xs }}>
                <Text variant="body" style={{ fontWeight: '600', flex: 1 }} numberOfLines={1}>{title}</Text>
                <Pressable onPress={() => remove(i)} accessibilityRole="button" accessibilityLabel={t.remove} hitSlop={8}>
                  <Text variant="muted">{t.remove}</Text>
                </Pressable>
              </Row>
              {d.kind !== 'reminder' ? <Field
                label={d.kind === 'goal' ? t.targetAmount : t.amount}
                value={d.amountText}
                onChangeText={(v) => update(i, { amountText: v })}
                keyboardType="decimal-pad"
                placeholder={decimalComma ? '0,00' : '0.00'}
                inputStyle={{ fontSize: 22, fontWeight: '700' }}
                style={{ marginBottom: spacing.md }}
              /> : null}
              {d.kind === 'reminder' ? (
                <>
                  <Field label={t.reminderWhat} value={d.reminderText} onChangeText={(v) => update(i, { reminderText: v })} placeholder={t.reminderExample} style={{ marginBottom: spacing.md }} />
                  <Row style={{ marginBottom: spacing.md, flexWrap: 'wrap' }}>
                    <Button tone="secondary" small title={friendlyDate(d.date, today(), fmt)} onPress={() => setPickingDate(i)} />
                    <Button tone="secondary" small title={d.reminderTime} onPress={() => setPickingTime(i)} />
                  </Row>
                  <View style={{ marginBottom: spacing.xs }}>
                    <Segmented value={d.reminderRepeat} onChange={(v) => update(i, { reminderRepeat: v })} options={[{ value: 'none', label: t.repeatOnce }, { value: 'daily', label: t.repeatDaily }, { value: 'weekly', label: t.repeatWeekly }, { value: 'monthly', label: t.repeatMonthly }]} />
                  </View>
                </>
              ) : d.kind === 'goal' ? (
                <>
                  <View style={{ marginBottom: spacing.md }}>
                    <Segmented value={d.goalKind} onChange={(v) => update(i, { goalKind: v })} options={[{ value: 'saving', label: t.goalKindSaving }, { value: 'debt', label: t.goalKindDebt }]} />
                  </View>
                  <Field label={t.goalName} value={d.goalName} onChangeText={(v) => update(i, { goalName: v })} placeholder={t.goalNamePlaceholder} style={{ marginBottom: spacing.sm }} />
                  <Text variant="label" style={{ marginBottom: 6 }}>{t.targetDate}</Text>
                  <Row style={{ marginBottom: spacing.sm, flexWrap: 'wrap' }}>
                    <Button tone="secondary" small title={d.targetDate ? longDate(d.targetDate, today(), fmt) : t.noDate} onPress={() => setPickingTargetDate(i)} />
                    {d.targetDate ? <Button tone="ghost" small title={t.clear} onPress={() => update(i, { targetDate: null })} /> : null}
                  </Row>
                </>
              ) : d.kind === 'contribution' ? (
                <Row style={{ marginBottom: spacing.sm }}>
                  <Button tone="secondary" small title={friendlyDate(d.date, today(), fmt)} onPress={() => setPickingDate(i)} />
                </Row>
              ) : (
                <>
                  <View style={{ marginBottom: spacing.md }}>
                    <Segmented value={d.type} onChange={(v) => changeType(i, v)} options={[{ value: 'expense', label: t.moneyOut }, { value: 'income', label: t.moneyIn }]} />
                  </View>
                  <Row style={{ marginBottom: spacing.md, flexWrap: 'wrap' }}>
                    <Button tone="secondary" small title={catLabel} onPress={() => setPickingCat(i)} />
                    <Button tone="secondary" small title={friendlyDate(d.date, today(), fmt)} onPress={() => setPickingDate(i)} />
                  </Row>
                  {unsure && d.categoryId === d.originalCategoryId ? (
                    <Text variant="small" style={{ marginBottom: spacing.sm }}>{hintText(HINT.unsureCategory, t)}</Text>
                  ) : null}
                  <Field label={t.note} value={d.note} onChangeText={(v) => update(i, { note: v })} placeholder={t.optional} style={{ marginBottom: spacing.xs }} />
                </>
              )}
            </View>
          );
        })}
      </ScrollView>

      {error ? <Text variant="small" color={colors.danger} style={{ marginVertical: spacing.sm }}>{error}</Text> : null}
      <Button title={t.saveAll} onPress={saveAll} loading={saving} style={{ marginTop: spacing.md }} />

      <CategoryPicker
        visible={catRow != null}
        onClose={() => setPickingCat(null)}
        onPick={(c) => { if (pickingCat != null) update(pickingCat, { categoryId: c.id }); }}
        kind={catRow?.type ?? 'expense'}
        selectedId={catRow?.categoryId ?? null}
        categories={categories}
      />
      <DatePicker
        visible={dateRow != null}
        onClose={() => setPickingDate(null)}
        value={dateRow?.date ?? today()}
        onPick={(day) => { if (pickingDate != null) update(pickingDate, { date: day }); }}
        mode={dateRow?.kind === 'reminder' ? 'reminder' : undefined}
      />
      <DatePicker
        visible={targetRow != null}
        onClose={() => setPickingTargetDate(null)}
        value={targetRow?.targetDate ?? today()}
        onPick={(day) => { if (pickingTargetDate != null) update(pickingTargetDate, { targetDate: day }); }}
        future
      />
      <TimePicker
        visible={pickingTime != null}
        onClose={() => setPickingTime(null)}
        value={pickingTime != null ? drafts[pickingTime]?.reminderTime ?? '09:00' : '09:00'}
        onPick={(tm) => { if (pickingTime != null) update(pickingTime, { reminderTime: tm }); }}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, marginBottom: spacing.md },
});
