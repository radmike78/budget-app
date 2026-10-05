import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Rollover, Tier, TxType } from '@/types';
import { getDb } from '@/db/database';
import { countTransactionsInCategory } from '@/db/repositories';
import { useAppStore } from '@/store/useAppStore';
import { spacing, useTheme } from '@/theme';
import { newId } from '@/lib/ids';
import { moneyInputText, parseMoneyInput } from '@/lib/money';
import { categoryName, useLocale, useT } from '@/i18n';
import { confirmDialog } from '@/lib/dialogs';
import { EmojiPicker } from '@/components/pickers';
import { defaultTierFor, tierOf } from '@/lib/tiers';
import { Button, Field, Row, Screen, Segmented, Text } from '@/components/ui';

export default function CategoryEditor() {
  const { id, kind: kindParam } = useLocalSearchParams<{ id: string; kind?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const t = useT();
  const locale = useLocale();
  const categories = useAppStore((s) => s.categories);
  const save = useAppStore((s) => s.saveCategory);
  const remove = useAppStore((s) => s.removeCategory);
  const period = useAppStore((s) => s.period);
  const payMode = useAppStore((s) => s.settings?.budgetPeriod === 'pay');
  const isNew = id === 'new';
  const existing = categories.find((c) => c.id === id);

  const [name, setName] = useState(existing ? categoryName(existing, t) : '');
  const [icon, setIcon] = useState(existing?.icon ?? '🧾');
  const [kind, setKind] = useState<TxType>(existing?.kind ?? (kindParam === 'income' ? 'income' : 'expense'));
  const [limit, setLimit] = useState(existing?.monthlyLimit != null ? moneyInputText(existing.monthlyLimit, locale.format.decimal === ',') : '');
  const [rollover, setRollover] = useState<Rollover>(existing?.rollover ?? 'reset');
  // A new category follows its name ("Daycare" starts on Needs) until the control is touched.
  const [tier, setTier] = useState<Tier | null>(existing ? tierOf(existing) : null);
  const effectiveTier: Tier = tier ?? defaultTierFor({ id: '', name, kind });
  const [showEmoji, setShowEmoji] = useState(false);
  const [usage, setUsage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!existing) return;
    getDb().then((db) => countTransactionsInCategory(db, existing.id)).then(setUsage);
  }, [existing]);

  const [saving, setSaving] = useState(false);
  // Settled when the editor opens, so a double tap upserts one category rather than making two.
  const newCategoryId = useRef(newId());

  const onSave = async () => {
    if (!name.trim()) { setError(t.giveName); return; }
    if (saving) return;
    setSaving(true);
    const limitValue = limit.trim() ? parseMoneyInput(limit, locale.format.decimal === ',') : null;
    // A default category keeps its translated name unless the user actually changed it.
    const renamed = existing?.isDefault && name.trim() === categoryName(existing, t) ? existing.name : name.trim();
    const monthlyLimit = kind === 'expense' && limitValue && limitValue > 0 ? limitValue : null;
    const nextRollover: Rollover = monthlyLimit ? rollover : 'reset';
    // Carrying over starts with the period it was switched on in; earlier periods never add anything.
    const rolloverSince = nextRollover === 'reset' ? null : (existing?.rollover ?? 'reset') !== 'reset' && existing?.rolloverSince ? existing.rolloverSince : period.start;
    await save({
      id: existing?.id ?? newCategoryId.current,
      name: renamed,
      icon,
      kind,
      monthlyLimit,
      rollover: nextRollover,
      rolloverSince,
      tier: kind === 'expense' ? effectiveTier : null,
      isDefault: existing?.isDefault && renamed === existing.name ? true : false,
      archived: existing?.archived ?? false,
      sortOrder: existing?.sortOrder ?? 50,
    }).then(() => router.back(), (e: Error) => setError(t.didntWork(e.message))).finally(() => setSaving(false));
  };

  const toggleArchive = async () => {
    if (!existing) return;
    await save({ ...existing, archived: !existing.archived });
    router.back();
  };

  const onDelete = async () => {
    if (!existing) return;
    if (await confirmDialog(t.deleteCategoryQ(categoryName(existing, t)), usage ? t.deleteCategoryUsed(usage) : t.cannotUndo, { confirmText: t.delete, cancelText: t.cancel, destructive: true })) { await remove(existing.id); router.back(); }
  };

  return (
    <Screen keyboard>
      <Row style={{ marginTop: spacing.sm, marginBottom: spacing.lg }} align="flex-end">
        <Button tone="secondary" title={icon || '🧾'} onPress={() => setShowEmoji(true)} accessibilityLabel={t.pickIcon} />
        <Field label={t.nameLabel} value={name} onChangeText={setName} placeholder={t.categoryNamePlaceholder} style={{ flex: 1, marginBottom: 0 }} autoFocus={isNew} />
      </Row>
      {!existing ? (
        <View style={{ marginBottom: spacing.lg }}>
          <Segmented value={kind} onChange={setKind} options={[{ value: 'expense', label: t.spendingKind }, { value: 'income', label: t.incomeKind }]} />
        </View>
      ) : null}
      {kind === 'expense' ? (
        <Field label={payMode ? t.periodLimit : t.monthlyLimit} value={limit} onChangeText={setLimit} keyboardType="decimal-pad" placeholder={t.limitPlaceholder} hint={t.limitHint} />
      ) : null}
      {kind === 'expense' ? (
        <View style={{ marginBottom: spacing.lg }}>
          <Text variant="label" style={{ marginBottom: 6 }}>{t.tierLabel}</Text>
          <Segmented<Tier> value={effectiveTier} onChange={setTier} options={[{ value: 'needs', label: t.tierNeeds }, { value: 'obligations', label: t.tierObligations }, { value: 'wants', label: t.tierWants }]} />
          <Text variant="small" style={{ marginTop: 6 }}>{t.tierHint}</Text>
        </View>
      ) : null}
      {kind === 'expense' && limit.trim() ? (
        <View style={{ marginBottom: spacing.lg }}>
          <Text variant="label" style={{ marginBottom: 6 }}>{t.rollover}</Text>
          <Segmented<Rollover> value={rollover} onChange={setRollover} options={[{ value: 'reset', label: t.rolloverReset }, { value: 'carry', label: t.rolloverCarry }, { value: 'ask', label: t.rolloverAsk }]} />
          <Text variant="small" style={{ marginTop: 6 }}>{t.rolloverHint}</Text>
        </View>
      ) : null}
      {usage != null ? <Text variant="small" style={{ marginBottom: spacing.md }}>{t.entryUses(usage)}</Text> : null}
      {error ? <Text variant="small" color={colors.danger} style={{ marginBottom: spacing.sm }}>{error}</Text> : null}
      <Button title={isNew ? t.addCategory : t.save} onPress={onSave} loading={saving} />
      {existing ? (
        <Row style={{ marginTop: spacing.md }}>
          <Button tone="secondary" title={existing.archived ? t.restore : t.archive} onPress={toggleArchive} style={{ flex: 1 }} />
          <Button tone="danger" title={t.delete} onPress={onDelete} style={{ flex: 1 }} />
        </Row>
      ) : null}
      <EmojiPicker visible={showEmoji} onClose={() => setShowEmoji(false)} onPick={setIcon} />
    </Screen>
  );
}
