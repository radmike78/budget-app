import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { spacing, useTheme } from '@/theme';
import { longDate, nowIso, today } from '@/lib/dates';
import { newId } from '@/lib/ids';
import { moneyInputText, parseMoneyInput } from '@/lib/money';
import { goalPlanSentence, goalProgress } from '@/lib/plain';
import type { GoalKind } from '@/types';
import { useDateFormat, useLocale, useMoney, useT } from '@/i18n';
import { confirmDialog } from '@/lib/dialogs';
import { DatePicker } from '@/components/pickers';
import { Button, Card, Field, ProgressBar, Row, Screen, Segmented, Text } from '@/components/ui';

export default function GoalEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const t = useT();
  const locale = useLocale();
  const money = useMoney();
  const fmt = useDateFormat();
  const goals = useAppStore((s) => s.goals);
  const currency = useAppStore((s) => s.settings?.currency ?? 'USD');
  const save = useAppStore((s) => s.saveGoal);
  const remove = useAppStore((s) => s.removeGoal);
  const contribute = useAppStore((s) => s.contributeToGoal);
  const existing = goals.find((g) => g.id === id);
  const isNew = !existing;
  const decimalComma = locale.format.decimal === ',';

  const [name, setName] = useState(existing?.name ?? '');
  const [kind, setKind] = useState<GoalKind>(existing?.kind ?? 'saving');
  const [target, setTarget] = useState(existing ? moneyInputText(existing.targetAmount, locale.format.decimal === ',') : '');
  const [current, setCurrent] = useState(existing ? moneyInputText(existing.currentAmount, locale.format.decimal === ',') : '0');
  const [targetDate, setTargetDate] = useState<string | null>(existing?.targetDate ?? null);
  const [showDate, setShowDate] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [logTransfer, setLogTransfer] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Settled when the editor opens, so a double tap upserts one goal rather than making two.
  const newGoalId = useRef(newId());

  const onSave = async () => {
    const targetValue = parseMoneyInput(target, decimalComma);
    const currentValue = parseMoneyInput(current, decimalComma) ?? 0;
    if (!name.trim()) { setError(t.giveGoalName); return; }
    if (targetValue == null || targetValue <= 0) { setError(target.trim() && targetValue == null ? t.amountUnreadable : t.enterTarget); return; }
    if (current.trim() && parseMoneyInput(current, decimalComma) == null) { setError(t.amountUnreadable); return; }
    if (saving) return;
    setSaving(true);
    try {
      // "Mark done" is an answer, not a calculation: editing the name later must not undo it.
      const completed = currentValue >= targetValue || (existing?.completed ?? false);
      await save({ id: existing?.id ?? newGoalId.current, name: name.trim(), kind, targetAmount: targetValue, currentAmount: currentValue, targetDate, createdAt: existing?.createdAt ?? nowIso(), completed });
      router.back();
    } catch (e) {
      setError(t.didntWork((e as Error).message));
    } finally {
      setSaving(false);
    }
  };

  const onAdd = async () => {
    const a = parseMoneyInput(addAmount, decimalComma);
    if (!existing || a == null || a <= 0 || saving) return;
    setSaving(true);
    try {
      await contribute(existing.id, a, { logTransfer, occurredAt: today() });
      setAddAmount('');
      setCurrent(moneyInputText(Math.round((existing.currentAmount + a) * 100) / 100, decimalComma));
    } catch (e) {
      setError(t.didntWork((e as Error).message));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!existing) return;
    if (await confirmDialog(t.removeGoalQ(existing.name), t.removeGoalBody, { confirmText: t.remove, cancelText: t.keep, destructive: true })) { await remove(existing.id); router.back(); }
  };

  const progress = existing ? goalProgress(existing, currency, today(), locale) : null;
  const targetPreview = parseMoneyInput(target, decimalComma);
  const plan = targetPreview != null && targetPreview > 0 ? goalPlanSentence(targetPreview, parseMoneyInput(current, decimalComma) ?? 0, targetDate, kind, currency, today(), locale) : null;

  return (
    <Screen keyboard>
      {existing && progress ? (
        <Card style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
          <Text variant="body">{t.goalShort(money(existing.currentAmount, { compact: true }), money(existing.targetAmount, { compact: true }), money(progress.remaining, { compact: true }))}{progress.status !== 'no_date' && progress.status !== 'no_pace' ? ` · ${{ ahead: t.paceAhead, behind: t.paceBehind, on_track: t.paceOnTrack, done: t.paceDone }[progress.status]}` : ''}</Text>
          <View style={{ marginTop: spacing.md }}><ProgressBar fraction={progress.fraction} /></View>
          {!existing.completed ? (
            <>
              <Row style={{ marginTop: spacing.lg }} align="flex-end">
                <Field label={kind === 'debt' ? t.logPayment : t.addMoney} value={addAmount} onChangeText={setAddAmount} keyboardType="decimal-pad" placeholder="50" style={{ flex: 1, marginBottom: 0 }} />
                <Button title={t.add} onPress={onAdd} loading={saving} disabled={!parseMoneyInput(addAmount, decimalComma)} />
              </Row>
              <Row style={{ marginTop: spacing.sm }}>
                <Button tone="ghost" small title={`${logTransfer ? '✓ ' : ''}${kind === 'debt' ? t.alsoLogPaymentShort : t.alsoLogTransferShort}`} onPress={() => setLogTransfer(!logTransfer)} />
              </Row>
            </>
          ) : null}
        </Card>
      ) : null}

      <View style={{ marginBottom: spacing.lg, marginTop: existing ? 0 : spacing.sm }}>
        <Segmented value={kind} onChange={setKind} options={[{ value: 'saving', label: t.goalKindSaving }, { value: 'debt', label: t.goalKindDebt }]} />
      </View>
      <Field label={t.nameLabel} value={name} onChangeText={setName} placeholder={t.goalNamePlaceholder} autoFocus={isNew} />
      <Field label={t.targetAmount} value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="500" />
      {existing ? <Field label={kind === 'debt' ? t.paidSoFar : t.savedSoFar} value={current} onChangeText={setCurrent} keyboardType="decimal-pad" /> : null}
      <Text variant="label" style={{ marginBottom: 6 }}>{t.targetDate}</Text>
      <Row style={{ marginBottom: spacing.lg }}>
        <Button tone="secondary" small title={targetDate ? longDate(targetDate, today(), fmt) : t.noDate} onPress={() => setShowDate(true)} />
        {targetDate ? <Button tone="ghost" small title={t.clear} onPress={() => setTargetDate(null)} /> : null}
      </Row>
      {plan ? <Text variant="muted" style={{ marginBottom: spacing.lg }}>{plan}</Text> : null}
      {error ? <Text variant="small" color={colors.danger} style={{ marginBottom: spacing.sm }}>{error}</Text> : null}
      <Button title={isNew ? t.setGoal : t.save} onPress={onSave} loading={saving} />
      {existing ? (
        <Row style={{ marginTop: spacing.md }}>
          <Button tone="secondary" title={existing.completed ? t.markActive : t.markDone} style={{ flex: 1 }} onPress={async () => { await save({ ...existing, completed: !existing.completed }); router.back(); }} />
          <Button tone="danger" title={t.remove} style={{ flex: 1 }} onPress={onDelete} />
        </Row>
      ) : null}
      {existing ? <Text variant="small" style={{ marginTop: spacing.lg }}>{t.goalMeta(money(existing.targetAmount), longDate(existing.createdAt.slice(0, 10), today(), fmt))}</Text> : null}
      <DatePicker visible={showDate} onClose={() => setShowDate(false)} value={targetDate ?? today()} onPick={setTargetDate} future />
    </Screen>
  );
}
