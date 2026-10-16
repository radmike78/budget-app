import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { spacing, useTheme } from '@/theme';
import { monthLabel, today } from '@/lib/dates';
import { isWholeMonth } from '@/lib/plain';
import { periodLabel } from '@/lib/periods';
import { effectivePlan } from '@/lib/rollover';
import { tierTotals } from '@/lib/tiers';
import { monthlyEquivalent } from '@/lib/recurring';
import { moneyInputText, parseMoneyInput } from '@/lib/money';
import { categoryName, useDateFormat, useLocale, useMoney, useT } from '@/i18n';
import { Sheet } from '@/components/pickers';
import { CarryQuestions } from '@/components/CarryQuestions';
import { PeriodCard } from '@/components/PeriodCard';
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

  const tiers = useMemo(() => (stats ? tierTotals(stats, categories) : []), [stats, categories]);

  if (!settings || !stats) return null;
  const currency = settings.currency;
  const todayStr = today();
  const period = stats.period;
  const isCurrent = period.start <= todayStr && todayStr <= period.end;
  const payPeriod = settings.budgetPeriod === 'pay' && !isWholeMonth(period);
  const expenseCats = categories.filter((c) => c.kind === 'expense' && !c.archived).sort((a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0) || a.sortOrder - b.sortOrder);
  const incomeCats = categories.filter((c) => c.kind === 'income' && !c.archived);
  const archived = categories.filter((c) => c.archived);
  const activeRules = rules.filter((r) => r.active);
  const recurringOut = activeRules.filter((r) => r.type === 'expense').reduce((s, r) => s + monthlyEquivalent(r), 0);
  const overall = settings.overallLimit != null && settings.overallLimit > 0 ? settings.overallLimit : null;
  const tierNames = { needs: t.tierNeeds, obligations: t.tierObligations, wants: t.tierWants };

  const openOverall = () => { setOverallText(overall != null ? moneyInputText(overall, locale.format.decimal === ',') : ''); setShowOverall(true); };
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

      <View style={{ marginTop: spacing.md }}>
        <PeriodCard stats={stats} settings={settings} categories={categories} rules={rules} today={todayStr} />
        <Row style={{ marginTop: spacing.xs, justifyContent: 'flex-end' }}>
          <Button tone="ghost" small title={overall ? t.changeOverallPlan : t.setOverallPlan} onPress={openOverall} />
        </Row>
      </View>
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
                    <Text variant="body" style={{ fontWeight: '600', flex: 1 }} numberOfLines={1}>{categoryName(c, t)}</Text>
                    <Text variant="money">{money(spent, { compact: true })}</Text>
                  </Row>
                  {plan ? <Text variant="small">{spent <= plan ? t.planShort(money(spent, { compact: true }), money(plan, { compact: true }), money(plan - spent, { compact: true })) : t.pastPlanShort(money(spent - plan, { compact: true }), money(plan, { compact: true }))}{carried > 0 ? ` · ${t.carriedShort(money(carried, { compact: true }))}` : ''}</Text> : null}
                </View>
              </Row>
              {plan ? <View style={{ marginTop: spacing.sm }}><ProgressBar fraction={fraction} tone={fraction > 1 ? 'warn' : 'accent'} /></View> : null}
            </Card>
          </Pressable>
        );
      })}

      {stats.expenses > 0 ? (
        <>
          <SectionTitle>{t.whereItGoes}</SectionTitle>
          <Card>
            {tiers.map((row, i) => (
              <View key={row.tier} style={{ marginTop: i === 0 ? 0 : spacing.md }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>{tierNames[row.tier]}</Text>
                  <Text variant="money">{money(row.total, { compact: true })}</Text>
                </Row>
                <View style={{ marginTop: spacing.xs }}><ProgressBar fraction={row.share} /></View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

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

      <Sheet visible={showOverall} onClose={() => setShowOverall(false)} title={t.overallPlan} scroll>
        <Field label={payPeriod ? t.thisPeriod : t.thisMonth} value={overallText} onChangeText={setOverallText} keyboardType="decimal-pad" placeholder={t.overallPlanPlaceholder} hint={t.overallPlanSub} autoFocus />
        <Button title={t.save} onPress={saveOverall} />
      </Sheet>
    </Screen>
  );
}
