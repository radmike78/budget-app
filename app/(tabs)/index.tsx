import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { spacing, useTheme } from '@/theme';
import { today } from '@/lib/dates';
import { balanceSentence, categoryLineSentence, goalProgress, isWholeMonth, periodSummarySentence, topCategorySentence } from '@/lib/plain';
import { periodContaining, samePeriod } from '@/lib/periods';
import { categoryName, useLanguageCode, useLocale, useMoney, useT } from '@/i18n';
import { speak } from '@/lib/speak';
import { EntryBar } from '@/components/EntryBar';
import { ConfirmationCard } from '@/components/ConfirmationCard';
import { MultiConfirmationCard } from '@/components/MultiConfirmationCard';
import { CarryQuestions } from '@/components/CarryQuestions';
import { TransactionRow } from '@/components/TransactionRow';
import { useEntryFlow } from '@/components/useEntryFlow';
import { Button, Card, EmptyState, ProgressBar, Row, Screen, SectionTitle, Spacer, Text, useTypeScale } from '@/components/ui';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const t = useT();
  const locale = useLocale();
  const money = useMoney();
  const settings = useAppStore((s) => s.settings);
  const stats = useAppStore((s) => s.stats);
  const period = useAppStore((s) => s.period);
  const rules = useAppStore((s) => s.rules);
  const goToCurrentPeriod = useAppStore((s) => s.goToCurrentPeriod);
  const categories = useAppStore((s) => s.categories);
  const recent = useAppStore((s) => s.recent);
  const goals = useAppStore((s) => s.goals);
  const lifetime = useAppStore((s) => s.lifetime);
  const { pending, pendingMany, answer, busy, submit, dismiss, dismissAnswer, lastSource } = useEntryFlow();
  const language = useLanguageCode();
  const [toast, setToast] = useState<string | null>(null);
  const [toastLine, setToastLine] = useState<string | null>(null);

  const onSaved = (msg: string, line?: string | null) => {
    dismiss();
    setToast(msg);
    setToastLine(line ?? null);
    // The voices speak English only, and only under the same rule as answers to questions.
    const mode = settings?.answerMode ?? 'auto';
    if (line && (mode === 'speak' || (mode === 'auto' && lastSource === 'voice'))) speak(line, 'en', settings?.voiceGender ?? 'female');
  };

  // Today always shows the period that contains today, even after browsing older ones on the Budget tab.
  useFocusEffect(useCallback(() => {
    if (settings && !samePeriod(period, periodContaining(settings.budgetPeriod, rules, today()))) goToCurrentPeriod();
  }, [settings, period, rules, goToCurrentPeriod]));

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => { setToast(null); setToastLine(null); }, toastLine ? 6000 : 3500);
    return () => clearTimeout(timer);
  }, [toast, toastLine]);

  if (!settings || !stats) return null;
  const currency = settings.currency;
  const todayStr = today();
  const isCurrent = stats.period.start <= todayStr && todayStr <= stats.period.end;
  const payPeriod = settings.budgetPeriod === 'pay' && !isWholeMonth(stats.period);
  const summary = periodSummarySentence(stats, currency, isCurrent, settings.budgetPeriod, todayStr, locale);
  const top = topCategorySentence(stats, categories, currency, locale, (c) => categoryName(c, t));
  const balance = balanceSentence(settings.startingBalance, lifetime.income, lifetime.expenses, currency, locale);
  const overall = settings.overallLimit != null && settings.overallLimit > 0 ? settings.overallLimit : null;
  const activeGoals = goals.filter((g) => !g.completed).slice(0, 2);

  return (
    <Screen keyboard>
      <EntryBar onSubmit={submit} busy={busy} />
      {answer ? (
        <Card tone="accent" style={{ marginTop: spacing.md }}>
          <Text variant="heading" style={{ lineHeight: 26 }}>{answer.text}</Text>
          <Row style={{ marginTop: spacing.sm, justifyContent: 'flex-end' }}>
            <Button tone="ghost" small title={t.readAloud} onPress={() => speak(answer.text, language, settings.voiceGender)} />
            <Button tone="ghost" small title={t.done} onPress={dismissAnswer} />
          </Row>
        </Card>
      ) : null}
      {toast ? (
        <Card tone="accent" style={{ marginTop: spacing.md, paddingVertical: spacing.md }}>
          <Text variant="body">{toast}</Text>
          {toastLine ? (
            <Pressable accessibilityRole="button" accessibilityHint={t.voiceTip} onPress={() => router.push('/settings/voice')}>
              <Text variant="heading" testID="persona-line" style={{ marginTop: spacing.xs, lineHeight: 24 }}>{toastLine}</Text>
              <Text variant="small" style={{ marginTop: 2 }}>{t.voiceChangeHint}</Text>
            </Pressable>
          ) : null}
        </Card>
      ) : null}
      <CarryQuestions />

      <SectionTitle>{payPeriod ? t.thisPeriod : t.thisMonth}</SectionTitle>
      <Card>
        <Text variant="heading" style={{ lineHeight: 26 }}>{summary}</Text>
        {overall ? (
          <View style={{ marginTop: spacing.sm }}>
            <Text variant="muted">{categoryLineSentence(overall, stats.expenses, currency, locale, payPeriod)}</Text>
            <View style={{ marginTop: spacing.xs }}><ProgressBar fraction={stats.expenses / overall} tone={stats.expenses > overall ? 'warn' : 'accent'} /></View>
          </View>
        ) : null}
        {top ? <Text variant="muted" style={{ marginTop: spacing.sm }}>{top}</Text> : null}
        {balance ? <Text variant="small" style={{ marginTop: spacing.sm }}>{balance}</Text> : null}
        {stats.income > 0 || stats.expenses > 0 ? (
          <Row style={{ marginTop: spacing.lg, justifyContent: 'space-between' }}>
            <Stat label={t.inShort} value={money(stats.income, { compact: true })} color={colors.income} />
            <Stat label={t.outShort} value={money(stats.expenses, { compact: true })} color={colors.text} />
            <Stat label={t.netShort} value={money(stats.income - stats.expenses, { compact: true })} color={stats.income - stats.expenses >= 0 ? colors.income : colors.warn} />
          </Row>
        ) : null}
      </Card>

      {activeGoals.length > 0 ? (
        <>
          <SectionTitle right={<Button tone="ghost" small title={t.allGoals} onPress={() => router.push('/goals')} />}>{t.goals}</SectionTitle>
          {activeGoals.map((g) => {
            const p = goalProgress(g, currency, todayStr, locale);
            return (
              <Card key={g.id} style={{ marginBottom: spacing.sm }}>
                <Text variant="body" style={{ fontWeight: '600' }}>{g.name}</Text>
                <Text variant="muted" style={{ marginTop: 2 }}>{p.sentence}</Text>
              </Card>
            );
          })}
        </>
      ) : null}

      <SectionTitle right={recent.length > 0 ? <Button tone="ghost" small title={t.seeAll} onPress={() => router.push('/history')} /> : undefined}>{t.recent}</SectionTitle>
      {recent.length === 0 ? (
        <EmptyState title={t.nothingYet} body={t.nothingYetBody} />
      ) : (
        recent.map((tx) => <TransactionRow key={tx.id} tx={tx} onPress={() => router.push(`/entry/${tx.id}`)} />)
      )}
      <Spacer size={spacing.xl} />

      <ConfirmationCard result={pending} onCancel={dismiss} onDone={onSaved} />
      <MultiConfirmationCard results={pendingMany} onCancel={dismiss} onDone={onSaved} />
    </Screen>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  const scale = useTypeScale();
  return (
    <View>
      <Text variant="label">{label}</Text>
      <Text variant="money" color={color} style={{ fontSize: 20 * scale, marginTop: 2 }}>{value}</Text>
    </View>
  );
}
