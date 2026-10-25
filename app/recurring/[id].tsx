import React, { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Frequency, TxType } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { spacing, useTheme } from '@/theme';
import { friendlyDate, today } from '@/lib/dates';
import { newId } from '@/lib/ids';
import { moneyInputText, parseMoneyInput } from '@/lib/money';
import { categoryName, useDateFormat, useLanguageCode, useLocale, useT } from '@/i18n';
import { detectCategory } from '@/parser';
import { confirmDialog, notify } from '@/lib/dialogs';
import { CategoryPicker, DatePicker } from '@/components/pickers';
import { TrialEnded, useAdding } from '@/components/TrialGate';
import { Button, Chip, Field, Row, Screen, Segmented, Text } from '@/components/ui';

const FREQUENCIES: Frequency[] = ['weekly', 'biweekly', 'monthly', 'yearly'];

export default function RecurringEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const t = useT();
  const locale = useLocale();
  const fmt = useDateFormat();
  const rules = useAppStore((s) => s.rules);
  const goals = useAppStore((s) => s.goals);
  const keywordMap = useAppStore((s) => s.keywordMap);
  const language = useLanguageCode();
  const categories = useAppStore((s) => s.categories);
  const save = useAppStore((s) => s.saveRule);
  const remove = useAppStore((s) => s.removeRule);
  const existing = rules.find((r) => r.id === id);
  const isNew = !existing;
  const adding = useAdding();

  const [amount, setAmount] = useState(existing ? moneyInputText(existing.amount, locale.format.decimal === ',') : '');
  const [type, setType] = useState<TxType>(existing?.type ?? 'expense');
  // 'rent' when it still exists, otherwise the first expense category the user has kept.
  // A new rule has no category until one is picked or its note names one ("Netflix" is a subscription):
  // a default like Rent would quietly file every subscription as a need.
  const [picked, setPicked] = useState<string | null>(existing ? existing.categoryId : null);
  const [frequency, setFrequency] = useState<Frequency>(existing?.frequency ?? 'monthly');
  const [next, setNext] = useState(existing?.nextOccurrence ?? today());
  const [note, setNote] = useState(existing?.note ?? '');
  const [showCat, setShowCat] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Settled when the editor opens, so a double tap upserts one rule rather than making two.
  const newRuleId = useRef(newId());
  const guessed = useMemo(() => {
    if (existing || picked || !note.trim()) return null;
    const match = detectCategory(note.toLowerCase(), { categories, goals, keywordMap, today: today(), language });
    return match && match.kind === type ? match.categoryId : null;
  }, [existing, picked, note, categories, goals, keywordMap, language, type]);
  const categoryId = picked ?? guessed;
  const setCategoryId = setPicked;
  const category = categories.find((c) => c.id === categoryId);

  const changeType = (nextType: TxType) => {
    setType(nextType);
    if (category && category.kind !== nextType) setCategoryId(categories.find((c) => !c.archived && c.kind === nextType)?.id ?? null);
  };

  const persist = async (rule: Parameters<typeof save>[0]) => {
    if (saving) return;
    setSaving(true);
    try {
      await save(rule);
      router.back();
    } catch (e) {
      notify(t.didntWork((e as Error).message));
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    const a = parseMoneyInput(amount, locale.format.decimal === ',');
    if (a == null || a <= 0) { setError(t.enterAmount); return; }
    await persist({ id: existing?.id ?? newRuleId.current, amount: a, type, categoryId, frequency, nextOccurrence: next, note: note.trim() || null, active: existing?.active ?? true });
  };

  const onDelete = async () => {
    if (!existing) return;
    if (await confirmDialog(t.removeRecurringQ, t.removeRecurringBody, { confirmText: t.remove, cancelText: t.keep, destructive: true })) { await remove(existing.id); router.back(); }
  };

  if (isNew && !adding) return <Screen><TrialEnded /></Screen>;

  return (
    <Screen keyboard>
      <Field label={t.amount} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" inputStyle={{ fontSize: 28, fontWeight: '700' }} autoFocus={isNew} style={{ marginTop: spacing.sm }} />
      <View style={{ marginBottom: spacing.lg }}>
        <Segmented value={type} onChange={changeType} options={[{ value: 'expense', label: t.moneyOut }, { value: 'income', label: t.moneyIn }]} />
      </View>
      <Text variant="label" style={{ marginBottom: 6 }}>{t.howOften}</Text>
      <Row style={{ flexWrap: 'wrap', marginBottom: spacing.lg }}>
        {FREQUENCIES.map((f) => <Chip key={f} label={t.frequency[f]} selected={frequency === f} onPress={() => setFrequency(f)} />)}
      </Row>
      <Text variant="label" style={{ marginBottom: 6 }}>{t.category} · {isNew ? t.firstDate : t.nextDateLabel}</Text>
      <Row style={{ marginBottom: spacing.lg, flexWrap: 'wrap' }}>
        <Button tone="secondary" small title={category ? `${category.icon ?? ''} ${categoryName(category, t)}`.trim() : t.pickCategory} onPress={() => setShowCat(true)} />
        <Button tone="secondary" small title={friendlyDate(next, today(), fmt)} onPress={() => setShowDate(true)} />
      </Row>
      <Text variant="small" style={{ marginBottom: spacing.lg }}>{t.firstDateHint}</Text>
      <Field label={t.note} value={note} onChangeText={setNote} placeholder={t.recurringNotePlaceholder} />
      {error ? <Text variant="small" color={colors.danger} style={{ marginBottom: spacing.sm }}>{error}</Text> : null}
      <Button title={isNew ? t.startRepeating : t.save} onPress={onSave} loading={saving} />
      {existing ? (
        <Row style={{ marginTop: spacing.md }}>
          <Button tone="secondary" title={existing.active ? t.pause : t.resume} style={{ flex: 1 }} disabled={saving} onPress={() => persist({ ...existing, active: !existing.active })} />
          <Button tone="danger" title={t.remove} style={{ flex: 1 }} onPress={onDelete} />
        </Row>
      ) : null}
      <CategoryPicker visible={showCat} onClose={() => setShowCat(false)} onPick={(c) => setCategoryId(c.id)} kind={type} selectedId={categoryId} categories={categories} />
      <DatePicker visible={showDate} onClose={() => setShowDate(false)} value={next} onPick={setNext} mode={isNew ? 'start' : undefined} />
    </Screen>
  );
}
