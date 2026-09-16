import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { spacing, useTheme } from '@/theme';
import { monthLabel, today } from '@/lib/dates';
import { categoryLineSentence, isWholeMonth, periodSummarySentence } from '@/lib/plain';
import { periodLabel } from '@/lib/periods';
import { effectivePlan } from '@/lib/rollover';
import { monthlyEquivalent } from '@/lib/recurring';
import { parseMoneyInput } from '@/lib/money';
import { categoryName, useDateFormat, useLocale, useMoney, useT } from '@/i18n';
import { Sheet } from '@/components/pickers';
import { CarryQuestions } from '@/components/CarryQuestions';
import { Button, Card, Field, Icon, ListItem, ProgressBar, Row, Screen, SectionTitle, Text } from '@/components/ui';

export default function BudgetScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const t = useT();
  const locale = useLocale();
  const fmt = useDateFormat();
  const money = useMoney();
  const settings = useAppStore((s) => s.settings);
  const stats = useAppStore((s) => s.stats);
  const shiftPeriod = useAppStore((s) => s.shiftPeriod);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const categories = useAppStore((s) => s.categories);
  const carry = useAppStore((s) => s.carry);
  const rules = useAppStore((s) => s.rules);
  const [showOverall, setShowOverall] = useState(false);
  const [overallText, setOverallText] = useState('');

  const totals = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of stats?.byCategory ?? []) if (b.categoryId) m.set(b.categoryId, b.total);
    return m;
  }, [stats]);

  if (!settings || !stats) return null;
  const currency = settings.currency;
  const todayStr = today();
  const period = stats.period;
  const isCurrent = period.start <= todayStr && todayStr <= period.end;
  const payPeriod = settings.budgetPeriod === 'pay' && !isWholeMonth(period);
  const expenseCats = categories.filter((c) => c.kind === 'expense' && !c.archived).sort((a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0) || a.sortOrder - b.sortOrder);
  const incomeCats = categories.filter((c) => c.kind === 'income' && !c.archived);
  const archived = categories.filter((c) => c.archived);
  const planned = expenseCats.reduce((s, c) => s + (effectivePlan(c, carry[c.id]) ?? 0), 0);
  const activeRules = rules.filter((r) => r.active);
  const recurringOut = activeRules.filter((r) => r.type === 'expense').reduce((s, r) => s + monthlyEquivalent(r), 0);
  const overall = settings.overallLimit != null && settings.overallLimit > 0 ? settings.overallLimit : null;

  const openOverall = () => { setOverallText(overall != null ? String(overall) : ''); setShowOverall(true); };
  const saveOverall = async () => {
    const value = overallText.trim() ? parseMoneyInput(overallText, locale.format.decimal === ',') : null;
    await updateSettings({ overallLimit: value != null && value > 0 ? value : null });
    setShowOverall(false);
  };

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', marginTop: spacing.sm }}>
        <Pressable accessibilityRole="button" accessibilityLabel={payPeriod ? t.previousPeriod : t.previousMonth} onPress={() => shiftPeriod(-1)} hitSlop={12}><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable>
        <Text variant="heading">{payPeriod ? periodLabel(period, todayStr, fmt) : monthLabel(stats.month, fmt)}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={payPeriod ? t.nextPeriod : t.nextMonth} onPress={() => shiftPeriod(1)} hitSlop={12} disabled={isCurrent} style={{ opacity: isCurrent ? 0.3 : 1 }}><Ionicons name="chevron-forward" size={24} color={colors.text} /></Pressable>
      </Row>

      <Card style={{ marginTop: spacing.md }}>
        <Text variant="body">{periodSummarySentence(stats, currency, isCurrent, settings.budgetPeriod, todayStr, locale)}</Text>
        {overall ? (
          <View style={{ marginTop: spacing.sm }}>
            <Text variant="small">{categoryLineSentence(overall, stats.expenses, currency, locale, payPeriod)}</Text>
            <View style={{ marginTop: spacing.xs }}><ProgressBar fraction={stats.expenses / overall} tone={stats.expenses > overall ? 'warn' : 'accent'} /></View>
          </View>
        ) : null}
        {planned > 0 ? <Text variant="small" style={{ marginTop: spacing.sm }}>{t.plannedAcross(money(planned, { compact: true }))}</Text> : null}
        <Row style={{ marginTop: spacing.sm, justifyContent: 'flex-end' }}>
          <Button tone="ghost" small title={overall ? t.changeOverallPlan : t.setOverallPlan} onPress={openOverall} />
        </Row>
      </Card>
      <CarryQuestions />

      <SectionTitle right={<Button tone="ghost" small title={t.add} onPress={() => router.push('/category/new?kind=expense')} />}>{t.spending}</SectionTitle>
      {expenseCats.map((c) => {
        const spent = totals.get(c.id) ?? 0;
        const plan = effectivePlan(c, carry[c.id]);
        const carried = carry[c.id]?.amount ?? 0;
        const fraction = plan ? spent / plan : 0;
        return (
          <Pressable key={c.id} accessibilityRole="button" onPress={() => router.push(`/category/${c.id}`)}>
            <Card style={{ marginBottom: spacing.sm, paddingVertical: spacing.md }}>
              <Row>
                <Icon glyph={c.icon} size={22} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text variant="body" style={{ fontWeight: '600' }}>{categoryName(c, t)}</Text>
                    <Text variant="money">{money(spent, { compact: true })}</Text>
                  </Row>
                  <Text variant="small">{categoryLineSentence(plan, spent, currency, locale, payPeriod)}</Text>
                  {carried > 0 ? <Text variant="small">{t.carriedOver(money(carried, { compact: true }))}</Text> : null}
                </View>
              </Row>
              {plan ? <View style={{ marginTop: spacing.sm }}><ProgressBar fraction={fraction} tone={fraction > 1 ? 'warn' : 'accent'} /></View> : null}
            </Card>
          </Pressable>
        );
      })}

      <SectionTitle right={<Button tone="ghost" small title={t.add} onPress={() => router.push('/category/new?kind=income')} />}>{t.incomeSection}</SectionTitle>
      {incomeCats.map((c) => (
        <ListItem key={c.id} title={categoryName(c, t)} left={<Icon glyph={c.icon} size={22} />} onPress={() => router.push(`/category/${c.id}`)} />
      ))}

      <SectionTitle right={<Button tone="ghost" small title={t.manage} onPress={() => router.push('/recurring')} />}>{t.repeating}</SectionTitle>
      <Card>
        {activeRules.length === 0 ? (
          <Text variant="muted">{t.repeatingEmpty}</Text>
        ) : (
          <Text variant="body">{t.repeatingSummary(activeRules.length, money(recurringOut, { compact: true }))}</Text>
        )}
      </Card>

      {archived.length > 0 ? (
        <>
          <SectionTitle>{t.archived}</SectionTitle>
          {archived.map((c) => (
            <ListItem key={c.id} title={categoryName(c, t)} subtitle={t.archivedHint} left={<Icon glyph={c.icon} size={22} />} onPress={() => router.push(`/category/${c.id}`)} />
          ))}
        </>
      ) : null}

      <Sheet visible={showOverall} onClose={() => setShowOverall(false)} title={t.overallPlan}>
        <Field label={payPeriod ? t.thisPeriod : t.thisMonth} value={overallText} onChangeText={setOverallText} keyboardType="decimal-pad" placeholder={t.overallPlanPlaceholder} hint={t.overallPlanSub} autoFocus />
        <Button title={t.save} onPress={saveOverall} />
      </Sheet>
    </Screen>
  );
}
