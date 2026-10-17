import React from 'react';
import { View } from 'react-native';
import type { Category, MonthStats, RecurringRule, Settings } from '@/types';
import { spacing, useTheme } from '@/theme';
import { daysBetween, longDate } from '@/lib/dates';
import { safeToSpend } from '@/lib/safeToSpend';
import { categoryName, useDateFormat, useMoney, useT } from '@/i18n';
import { SpendBar } from '@/components/SpendBar';
import { useCountUp } from '@/components/motion';
import { Card, Row, Text, useTypeScale } from '@/components/ui';

/**
 * The period at a glance, in numbers and key words rather than sentences
 * (the sentences are for the voice). One big number that answers "what is
 * left?", a line of in and out, the spending bar, and one short plan line.
 */
export function PeriodCard({ stats, settings, categories, rules, today, onBarPress }: {
  stats: MonthStats;
  settings: Settings;
  categories: Category[];
  rules: RecurringRule[];
  today: string;
  onBarPress?: () => void;
}) {
  const { colors } = useTheme();
  const t = useT();
  const money = useMoney();
  const fmt = useDateFormat();
  const scale = useTypeScale();
  const isCurrent = stats.period.start <= today && today <= stats.period.end;
  const overall = settings.overallLimit != null && settings.overallLimit > 0 ? settings.overallLimit : null;
  const safe = isCurrent ? safeToSpend(stats, rules, today) : null;
  const daysLeft = isCurrent ? daysBetween(today, stats.period.end) + 1 : 0;
  const until = longDate(stats.period.end, today, fmt);

  // The headline number: what is left of the plan; else what income leaves until the period ends; else what went out.
  let headline: number;
  let label: string;
  let detail: string | null = null;
  let tone = colors.text;
  if (overall) {
    const remaining = overall - stats.expenses;
    headline = Math.abs(remaining);
    // The headline already is the amount, so the label is words only: never the same number twice.
    label = remaining >= 0 ? t.ofPlanShort(money(overall, { compact: true })) : t.pastPlanLabel(money(overall, { compact: true }));
    if (remaining >= 0 && daysLeft > 0) detail = t.perDayShort(money(remaining / daysLeft, { compact: true }));
    tone = remaining >= 0 ? colors.income : colors.warn;
  } else if (safe) {
    headline = Math.abs(safe.amount);
    // No plan was set, so income is not "the plan". The shortfall counts the bills still due
    // this period, so when there are any it is "short once they are paid", and only without
    // them is it simply "more than came in".
    label = safe.amount >= 0 ? t.toSpendUntil(until) : t.shortOfIncome(safe.upcoming > 0);
    // The bills kept back are named, so "$310 to spend" with $480 in and nothing out is not a puzzle.
    const parts = [safe.perDay != null ? t.perDayShort(money(safe.perDay, { compact: true })) : null, safe.upcoming > 0 ? t.afterBillsShort(money(safe.upcoming, { compact: true })) : null].filter(Boolean);
    if (parts.length) detail = parts.join(' · ');
    tone = safe.amount >= 0 ? colors.income : colors.warn;
  } else if (stats.income > 0) {
    headline = stats.income - stats.expenses;
    label = t.leftWord;
    tone = headline >= 0 ? colors.income : colors.warn;
    headline = Math.abs(headline);
  } else {
    headline = stats.expenses;
    label = t.spentLabel;
  }
  const shown = useCountUp(headline);

  return (
    <Card>
      <Text variant="display" color={tone} style={{ fontSize: 40 * scale, lineHeight: 48 * scale }} accessibilityLabel={`${money(headline)} ${label}`}>{money(shown, { compact: true })}</Text>
      <Text variant="muted">{label}{detail ? ` · ${detail}` : ''}</Text>
      <Row gap={spacing.lg} style={{ marginTop: spacing.md }}>
        <Text variant="body"><Text variant="label">{t.inShort}</Text> {money(stats.income, { compact: true })}</Text>
        <Text variant="body"><Text variant="label">{t.outShort}</Text> {money(stats.expenses, { compact: true })}</Text>
      </Row>
      {stats.expenses > 0 ? (
        <View style={{ marginTop: spacing.md }}>
          <SpendBar stats={stats} categories={categories} nameOf={(c) => categoryName(c, t)} otherLabel={t.otherSpending} restLabel={t.spendRest} onPress={onBarPress} />
        </View>
      ) : null}
    </Card>
  );
}
