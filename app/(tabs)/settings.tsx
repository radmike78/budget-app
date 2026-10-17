import React, { useState } from 'react';
import { Platform, ScrollView, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import type { Accent, AnswerMode, BudgetPeriodMode, ThemeSetting } from '@/types';
import { ACCENTS } from '@/theme';
import { Pressable } from 'react-native';
import { useVoiceSummary } from '@/components/VoicePicker';
import { hasPayRules } from '@/lib/periods';
import { useAppStore } from '@/store/useAppStore';
import { spacing, useTheme } from '@/theme';
import { CURRENCIES, currencyInfo } from '@/lib/money';
import { cancelDailyReminder, scheduleDailyReminder } from '@/lib/reminders';
import { authenticate, canUseAppLock } from '@/lib/appLock';
import { triggerOfflineModelDownload } from '@/lib/speech';
import { LANGUAGE_OPTIONS, useDateFormat, useLanguageCode, useT } from '@/i18n';
import { friendlyDate, localDay, today } from '@/lib/dates';
import { confirmDialog, notify } from '@/lib/dialogs';
import { Sheet } from '@/components/pickers';
import { Button, Card, ListItem, Row, Screen, SectionTitle, Segmented, Spacer, Text } from '@/components/ui';

function hourLabel(h: number): string {
  return `${h < 10 ? '0' : ''}${h}:00`;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const t = useT();
  const fmt = useDateFormat();
  const languageCode = useLanguageCode();
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const resetAll = useAppStore((s) => s.resetAll);
  const keywords = useAppStore((s) => s.keywords);
  const rules = useAppStore((s) => s.rules);
  const voiceSummary = useVoiceSummary();
  const [showCurrency, setShowCurrency] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [erasing, setErasing] = useState(false);
  if (!settings) return null;

  const reminderText = { title: t.reminderTitle, body: t.reminderBody, channelName: t.reminderChannelDaily };

  const toggleReminder = async (on: boolean) => {
    if (on) {
      const ok = await scheduleDailyReminder(settings.reminderHour, reminderText);
      if (!ok) {
        notify(t.notificationsOff, t.notificationsOffBody);
        return;
      }
    } else {
      await cancelDailyReminder();
    }
    await updateSettings({ reminderEnabled: on });
  };

  const toggleAppLock = async (on: boolean) => {
    if (on) {
      if (!(await canUseAppLock())) { notify(t.appLock, t.appLockUnavailable); return; }
      if (!(await authenticate(t.unlockPrompt, t.cancel))) return;
    }
    await updateSettings({ appLockEnabled: on });
  };

  const changeHour = async (delta: number) => {
    const hour = (settings.reminderHour + delta + 24) % 24;
    await updateSettings({ reminderHour: hour });
    if (settings.reminderEnabled) await scheduleDailyReminder(hour, reminderText);
  };

  const changeBudgetPeriod = async (budgetPeriod: BudgetPeriodMode) => {
    if (budgetPeriod === 'pay' && !hasPayRules(rules)) { notify(t.budgetPeriod, t.budgetPeriodNeedsIncome); return; }
    await updateSettings({ budgetPeriod });
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const languageLabel = settings.language === 'system' ? `${t.systemLanguage} (${LANGUAGE_OPTIONS.find((o) => o.code === languageCode)?.name ?? languageCode})` : LANGUAGE_OPTIONS.find((o) => o.code === settings.language)?.name ?? settings.language;

  // Last thing on the screen, behind a dialog, and genuinely final: this is the
  // answer to "can I get my data off here", so it must leave nothing behind.
  const eraseEverything = async () => {
    if (erasing) return;
    if (!(await confirmDialog(t.eraseEverythingQ, t.eraseEverythingBody, { confirmText: t.erase, cancelText: t.cancel, destructive: true }))) return;
    setErasing(true);
    try {
      await resetAll();
      notify(t.eraseEverything, t.erased);
    } catch (e) {
      notify(t.eraseEverything, t.didntWork((e as Error).message));
    } finally {
      setErasing(false);
    }
  };

  return (
    <Screen>
      <SectionTitle>{t.yourData}</SectionTitle>
      {/* The date is on the row itself: a local-first app's one real risk is a phone lost with no copy made. */}
      <ListItem title={t.backupExport} subtitle={`${t.backupExportSub} ${settings.lastBackupAt ? t.lastBackupShort(friendlyDate(localDay(settings.lastBackupAt), today(), fmt)) : t.noBackupYetShort}`} onPress={() => router.push('/settings/backup')} />
      <ListItem title={t.repeatingEntries} subtitle={t.repeatingEntriesSub} onPress={() => router.push('/recurring')} />
      <ListItem title={t.reminders} subtitle={t.remindersSub} onPress={() => router.push('/settings/reminders')} />
      <ListItem title={t.importStatement} subtitle={t.importStatementSub} onPress={() => router.push('/import')} />
      <ListItem title={t.debts} subtitle={t.debtsSub} onPress={() => router.push('/debts')} />
      <ListItem title={t.categories} subtitle={t.categoriesSub} onPress={() => router.push('/budget')} />
      <ListItem title={t.learnedWords} subtitle={t.learnedWordsSub(keywords.length)} onPress={() => router.push('/settings/keywords')} />

      <SectionTitle>{t.preferences}</SectionTitle>
      <ListItem title={t.language} subtitle={languageLabel} onPress={() => setShowLanguage(true)} />
      <ListItem title={t.currency} subtitle={`${currencyInfo(settings.currency).name} (${settings.currency})`} onPress={() => setShowCurrency(true)} />
      <Card style={{ marginBottom: spacing.sm }}>
        <Text variant="label" style={{ marginBottom: spacing.sm }}>{t.appearance}</Text>
        <Segmented<ThemeSetting> value={settings.theme} onChange={(theme) => updateSettings({ theme })} options={[{ value: 'system', label: t.themeSystem }, { value: 'light', label: t.themeLight }, { value: 'dark', label: t.themeDark }]} />
        <Text variant="label" style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>{t.accentColor}</Text>
        <Row gap={spacing.md}>
          {(Object.keys(ACCENTS) as Accent[]).map((a) => {
            const selected = settings.accent === a;
            const label = { sage: t.accentSage, ocean: t.accentOcean, plum: t.accentPlum, clay: t.accentClay }[a];
            return (
              <Pressable key={a} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} onPress={() => updateSettings({ accent: a })} style={{ alignItems: 'center' }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: ACCENTS[a][isDark ? 'dark' : 'light'], borderWidth: selected ? 3 : 0, borderColor: colors.text }} />
                <Text variant="small" style={{ marginTop: 4 }}>{label}</Text>
              </Pressable>
            );
          })}
        </Row>
      </Card>
      <Card style={{ marginBottom: spacing.sm }}>
        <Text variant="label" style={{ marginBottom: spacing.sm }}>{t.answerMode}</Text>
        <Segmented<AnswerMode> value={settings.answerMode} onChange={(answerMode) => updateSettings({ answerMode })} options={[{ value: 'text', label: t.answerText }, { value: 'speak', label: t.answerSpeak }, { value: 'auto', label: t.answerAuto }]} />
        <Text variant="small" style={{ marginTop: spacing.sm }}>{t.answerModeSub}</Text>
      </Card>
      <Card style={{ marginBottom: spacing.sm }}>
        <Text variant="label" style={{ marginBottom: spacing.sm }}>{t.budgetPeriod}</Text>
        <Segmented<BudgetPeriodMode> value={settings.budgetPeriod} onChange={changeBudgetPeriod} options={[{ value: 'month', label: t.periodMonth }, { value: 'pay', label: t.periodPay }]} />
        <Text variant="small" style={{ marginTop: spacing.sm }}>{t.budgetPeriodSub}</Text>
      </Card>
      <ListItem title={t.voice} subtitle={voiceSummary} onPress={() => router.push('/settings/voice')} />
      {Platform.OS !== 'web' ? <Card style={{ marginBottom: spacing.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text variant="body">{t.dailyReminder}</Text>
            <Text variant="small">{t.dailyReminderSub}</Text>
          </View>
          <Switch value={settings.reminderEnabled} onValueChange={toggleReminder} trackColor={{ true: colors.accent }} accessibilityLabel={t.dailyReminder} />
        </Row>
        {settings.reminderEnabled ? (
          <Row style={{ marginTop: spacing.md, justifyContent: 'space-between' }}>
            <Button tone="secondary" small title="−1h" accessibilityLabel={t.reminderEarlier} onPress={() => changeHour(-1)} />
            <Text variant="body">{hourLabel(settings.reminderHour)}</Text>
            <Button tone="secondary" small title="+1h" accessibilityLabel={t.reminderLater} onPress={() => changeHour(1)} />
          </Row>
        ) : null}
      </Card> : null}
      {Platform.OS !== 'web' ? <Card style={{ marginBottom: spacing.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text variant="body">{t.appLock}</Text>
            <Text variant="small">{t.appLockSub}</Text>
          </View>
          <Switch value={settings.appLockEnabled} onValueChange={toggleAppLock} trackColor={{ true: colors.accent }} accessibilityLabel={t.appLock} />
        </Row>
      </Card> : null}
      {Platform.OS === 'android' ? (
        <ListItem title={t.offlineVoice} subtitle={t.offlineVoiceSub} onPress={async () => notify(t.voiceModel, await triggerOfflineModelDownload(languageCode, { ready: t.voiceModelReady, status: t.voiceModelStatus, failed: t.voiceModelFailed }))} />
      ) : null}
      <ListItem title={t.smartParse} subtitle={settings.smartParseEnabled ? t.smartParseOn : t.smartParseOff} onPress={() => router.push('/settings/smart')} />

      <SectionTitle>{t.about}</SectionTitle>
      <ListItem title={t.help} subtitle={t.helpSub} onPress={() => router.push('/settings/help')} />
      <ListItem title={t.aboutApp} subtitle={t.aboutSub} onPress={() => router.push('/settings/about')} />

      <SectionTitle>{t.eraseEverything}</SectionTitle>
      <Card>
        <Text variant="muted">{t.eraseEverythingSub}</Text>
        <Spacer size={spacing.md} />
        <Button tone="danger" title={t.eraseEverything} onPress={eraseEverything} loading={erasing} />
      </Card>

      <Text variant="small" style={{ marginTop: spacing.xl, textAlign: 'center' }}>{t.appName} {version}</Text>

      <Sheet visible={showCurrency} onClose={() => setShowCurrency(false)} title={t.currency} tall>
        <ScrollView>
          {CURRENCIES.map((c) => (
            <ListItem key={c.code} title={`${c.symbol.trim()} ${c.name}`} subtitle={c.code} right={c.code === settings.currency ? <Text>✓</Text> : null} onPress={() => { updateSettings({ currency: c.code }); setShowCurrency(false); }} />
          ))}
        </ScrollView>
      </Sheet>
      <Sheet visible={showLanguage} onClose={() => setShowLanguage(false)} title={t.language}>
        <ScrollView>
          <ListItem title={t.systemLanguage} right={settings.language === 'system' ? <Text>✓</Text> : null} onPress={() => { updateSettings({ language: 'system' }); setShowLanguage(false); }} />
          {LANGUAGE_OPTIONS.map((o) => (
            <ListItem key={o.code} title={o.name} right={settings.language === o.code ? <Text>✓</Text> : null} onPress={() => { updateSettings({ language: o.code }); setShowLanguage(false); }} />
          ))}
        </ScrollView>
      </Sheet>
    </Screen>
  );
}
