import React, { useEffect, useRef, useState } from 'react';
import { FlatList, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import { spacing, useTheme } from '@/theme';
import { CURRENCIES, parseMoneyInput } from '@/lib/money';
import { daysInMonth, friendlyDate, fromDateString, today } from '@/lib/dates';
import { newId } from '@/lib/ids';
import type { Frequency } from '@/types';
import { LANGUAGE_OPTIONS, deviceLanguage, getLocale, useDateFormat, useLocale, useT } from '@/i18n';
import { DatePicker, Sheet } from '@/components/pickers';
import { Button, Card, CONTENT_MAX_WIDTH, Field, ListItem, Row, Segmented, Text, useTypeScale } from '@/components/ui';
import { VoicePicker } from '@/components/VoicePicker';

const PAGES = ['why', 'setup', 'money', 'how', 'voice', 'pick'] as const;

export default function Onboarding() {
  const { colors } = useTheme();
  const t = useT();
  const locale = useLocale();
  const insets = useSafeAreaInsets();
  const updateSettings = useAppStore((s) => s.updateSettings);
  const settings = useAppStore((s) => s.settings);
  const [page, setPage] = useState(0);
  const [currency, setCurrency] = useState(settings?.currency ?? locale.defaultCurrency);
  const [currencyTouched, setCurrencyTouched] = useState(false);
  const [balance, setBalance] = useState('');
  const [showCurrency, setShowCurrency] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  // Pay and rent, all optional: with them, Today has a real "safe to spend" from the first minute.
  const fmt = useDateFormat();
  const saveRule = useAppStore((s) => s.saveRule);
  const [payText, setPayText] = useState('');
  const [payFrequency, setPayFrequency] = useState<Frequency>('biweekly');
  const [lastPayday, setLastPayday] = useState(today());
  const [showPayday, setShowPayday] = useState(false);
  const [rentText, setRentText] = useState('');
  const [rentDayText, setRentDayText] = useState('1');
  const listRef = useRef<FlatList<string>>(null);
  const { width } = useWindowDimensions();

  // Follow the locale's default currency until the user picks one explicitly.
  useEffect(() => {
    if (!currencyTouched) setCurrency(locale.defaultCurrency);
  }, [locale, currencyTouched]);

  const go = (i: number) => {
    setPage(i);
    listRef.current?.scrollToIndex({ index: i, animated: true });
  };

  /**
   * Pay becomes a repeating income from the last payday, so this period's pay is already counted and the
   * screens follow paydays. Rent becomes a monthly bill on its day this month: logged if that day has passed,
   * counted as still due if not. Both are ordinary repeating entries the person can change or stop.
   */
  const saveMoney = async () => {
    const decimalComma = locale.format.decimal === ',';
    const pay = parseMoneyInput(payText, decimalComma);
    const rent = parseMoneyInput(rentText, decimalComma);
    if (pay != null && pay > 0) {
      await saveRule({ id: newId(), amount: pay, type: 'income', categoryId: 'salary', frequency: payFrequency, nextOccurrence: lastPayday > today() ? today() : lastPayday, note: t.payNote, active: true });
    }
    if (rent != null && rent > 0) {
      const day = Math.min(31, Math.max(1, Math.round(Number(rentDayText) || 1)));
      const now = fromDateString(today());
      const y = now.getFullYear();
      const m = now.getMonth();
      const date = `${y}-${String(m + 1).padStart(2, '0')}-${String(Math.min(day, daysInMonth(y, m))).padStart(2, '0')}`;
      await saveRule({ id: newId(), amount: rent, type: 'expense', categoryId: 'rent', frequency: 'monthly', nextOccurrence: date, note: t.rentNote, active: true });
    }
    return pay != null && pay > 0;
  };

  const finish = async (voiceWanted: boolean) => {
    const paid = await saveMoney();
    await updateSettings({ ...(paid ? { budgetPeriod: 'pay' as const } : null), currency, startingBalance: parseMoneyInput(balance, locale.format.decimal === ','), onboardingDone: true, ...(voiceWanted ? null : { voice: 'plain' as const }) });
  };

  const languageName = settings?.language && settings.language !== 'system'
    ? LANGUAGE_OPTIONS.find((o) => o.code === settings.language)?.name ?? settings.language
    : `${t.systemLanguage} (${getLocale(deviceLanguage()).name})`;

  // Pages centre their content vertically inside the list's measured height.
  const [pageHeight, setPageHeight] = useState(0);
  const typeScale = useTypeScale();
  const renderPage = (key: string) => {
    if (key === 'why') {
      return (
        <View style={{ width, minHeight: pageHeight, padding: spacing.xl, justifyContent: 'center' }}>
        <View style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }}>
          <Text variant="display">{t.onboardHeadline}</Text>
          <Text variant="muted" style={{ marginTop: spacing.xl, fontSize: 17 * typeScale, lineHeight: 24 * typeScale }}>{t.onboardBody}</Text>
          <View style={{ marginTop: spacing.xxl }}><Button title={t.next} onPress={() => go(1)} /></View>
          <View style={{ marginTop: spacing.md, alignItems: 'center' }}><Button tone="ghost" small title={`${t.language}: ${languageName}`} onPress={() => setShowLanguage(true)} /></View>
        </View>
        </View>
      );
    }
    if (key === 'setup') {
      return (
        <View style={{ width, minHeight: pageHeight, padding: spacing.xl, justifyContent: 'center' }}>
        <View style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }}>
          <Text variant="title">{t.quickSetup}</Text>
          <Text variant="muted" style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>{t.quickSetupBody}</Text>
          <Text variant="label" style={{ marginBottom: 6 }}>{t.language}</Text>
          <Row style={{ marginBottom: spacing.lg }}>
            <Button tone="secondary" title={languageName} onPress={() => setShowLanguage(true)} />
          </Row>
          <Text variant="label" style={{ marginBottom: 6 }}>{t.currency}</Text>
          <Row style={{ marginBottom: spacing.lg }}>
            <Button tone="secondary" title={currency} onPress={() => setShowCurrency(true)} />
          </Row>
          <Field label={t.startingBalance} value={balance} onChangeText={setBalance} keyboardType="decimal-pad" placeholder={t.startingBalancePlaceholder} hint={t.startingBalanceHint} />
          <Row>
            <Button tone="ghost" title={t.back} onPress={() => go(0)} />
            <Button title={t.next} onPress={() => go(2)} style={{ flex: 1 }} />
          </Row>
        </View>
        </View>
      );
    }
    if (key === 'money') {
      return (
        <View style={{ width, height: pageHeight || undefined }}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }}>
          <Text variant="title">{t.moneySetupTitle}</Text>
          <Text variant="muted" style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>{t.moneySetupBody}</Text>
          <Field label={t.takeHomePay} value={payText} onChangeText={setPayText} keyboardType="decimal-pad" placeholder={t.optional} />
          <View style={{ marginBottom: spacing.lg }}>
            <Segmented value={payFrequency} onChange={setPayFrequency} options={[{ value: 'weekly', label: t.frequency.weekly }, { value: 'biweekly', label: t.frequency.biweekly }, { value: 'monthly', label: t.frequency.monthly }]} />
          </View>
          <Text variant="label" style={{ marginBottom: 6 }}>{t.lastPayday}</Text>
          <Row style={{ marginBottom: spacing.lg }}>
            <Button tone="secondary" small title={friendlyDate(lastPayday, today(), fmt)} onPress={() => setShowPayday(true)} />
          </Row>
          <Field label={t.rentOrMortgage} value={rentText} onChangeText={setRentText} keyboardType="decimal-pad" placeholder={t.optional} />
          <Field label={t.rentDueDay} value={rentDayText} onChangeText={setRentDayText} keyboardType="number-pad" placeholder="1" />
          <Row>
            <Button tone="ghost" title={t.back} onPress={() => go(1)} />
            <Button tone="ghost" title={t.skip} onPress={() => { setPayText(''); setRentText(''); go(3); }} />
            <Button title={t.next} onPress={() => go(3)} style={{ flex: 1 }} />
          </Row>
          <DatePicker visible={showPayday} onClose={() => setShowPayday(false)} value={lastPayday} onPick={setLastPayday} />
        </View>
        </ScrollView>
        </View>
      );
    }
    if (key === 'voice') {
      return (
        <View style={{ width, minHeight: pageHeight, padding: spacing.xl, justifyContent: 'center' }}>
        <View style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }}>
          <Text variant="title">{t.onboardVoiceTitle}</Text>
          <Text variant="muted" style={{ marginTop: spacing.sm }}>{t.onboardVoiceBody}</Text>
          <Card style={{ marginTop: spacing.lg }}>
            {[[t.voiceFriend, t.voiceDescFriend], [t.voiceCoach, t.voiceDescCoach], [t.voiceRoaster, t.voiceDescRoaster]].map(([name, desc], i) => (
              <View key={name} style={{ marginTop: i === 0 ? 0 : spacing.sm }}>
                <Text variant="body" style={{ fontWeight: '600' }}>{name}</Text>
                <Text variant="small">{desc}</Text>
              </View>
            ))}
          </Card>
          <View style={{ marginTop: spacing.xxl }}><Button title={t.onboardVoiceYes} onPress={() => { if (settings?.voice === 'plain') updateSettings({ voice: 'friend' }); go(5); }} /></View>
          <View style={{ marginTop: spacing.md }}><Button tone="secondary" title={t.onboardVoiceNo} onPress={() => finish(false)} /></View>
          <View style={{ marginTop: spacing.md, alignItems: 'flex-start' }}><Button tone="ghost" title={t.back} onPress={() => go(3)} /></View>
        </View>
        </View>
      );
    }
    if (key === 'pick') {
      return (
        <View style={{ width, height: pageHeight || undefined }}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }}>
          <Text variant="title" style={{ marginBottom: spacing.lg }}>{t.voice}</Text>
          <VoicePicker compact />
          <Row style={{ marginTop: spacing.xl }}>
            <Button tone="ghost" title={t.back} onPress={() => go(4)} />
            <Button title={t.done} onPress={() => finish(true)} style={{ flex: 1 }} />
          </Row>
        </View>
        </ScrollView>
        </View>
      );
    }
    return (
      <View style={{ width, minHeight: pageHeight, padding: spacing.xl, justifyContent: 'center' }}>
        <View style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }}>
        <Text variant="title">{t.justSayIt}</Text>
        <Card style={{ marginTop: spacing.lg }}>
          {t.examples.map((e, i) => <Text key={e} variant="body" style={{ marginTop: i === 0 ? 0 : spacing.sm }}>{e}</Text>)}
        </Card>
        <Text variant="muted" style={{ marginTop: spacing.lg }}>{t.onboardLearn}</Text>
        <Row style={{ marginTop: spacing.xxl }}>
          <Button tone="ghost" title={t.back} onPress={() => go(2)} />
          <Button title={t.start} onPress={() => go(4)} style={{ flex: 1 }} />
        </Row>
      </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <FlatList
        ref={listRef}
        data={[...PAGES]}
        keyExtractor={(k) => k}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        onLayout={(e) => setPageHeight(e.nativeEvent.layout.height)}
        renderItem={({ item }) => renderPage(item)}
        getItemLayout={(_d, index) => ({ length: width, offset: width * index, index })}
        keyboardShouldPersistTaps="handled"
      />
      <Row style={{ justifyContent: 'center', paddingBottom: spacing.lg }}>
        {PAGES.map((p, i) => <View key={p} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i === page ? colors.accent : colors.border }} />)}
      </Row>
      <Sheet visible={showCurrency} onClose={() => setShowCurrency(false)} title={t.currency} tall>
        <ScrollView>
          {CURRENCIES.map((c) => (
            <ListItem key={c.code} title={`${c.symbol.trim()} ${c.name}`} subtitle={c.code} onPress={() => { setCurrency(c.code); setCurrencyTouched(true); setShowCurrency(false); }} />
          ))}
        </ScrollView>
      </Sheet>
      <Sheet visible={showLanguage} onClose={() => setShowLanguage(false)} title={t.language}>
        <ScrollView>
          <ListItem title={t.systemLanguage} onPress={() => { updateSettings({ language: 'system' }); setShowLanguage(false); }} />
          {LANGUAGE_OPTIONS.map((o) => (
            <ListItem key={o.code} title={o.name} onPress={() => { updateSettings({ language: o.code }); setShowLanguage(false); }} />
          ))}
        </ScrollView>
      </Sheet>
    </View>
  );
}
