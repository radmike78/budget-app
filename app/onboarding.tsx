import React, { useEffect, useRef, useState } from 'react';
import { FlatList, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import { spacing, useTheme } from '@/theme';
import { CURRENCIES, MAX_AMOUNT, parseMoneyInput } from '@/lib/money';
import { latestOnOrBefore } from '@/lib/recurring';
import { notify } from '@/lib/dialogs';
import { daysInMonth, friendlyDate, fromDateString, today } from '@/lib/dates';
import { newId } from '@/lib/ids';
import type { Frequency } from '@/types';
import { LANGUAGE_OPTIONS, deviceCurrency, deviceLanguage, getLocale, useDateFormat, useLanguageCode, useLocale, useT } from '@/i18n';
import { DatePicker, Sheet } from '@/components/pickers';
import { Button, Card, CONTENT_MAX_WIDTH, Field, ListItem, Row, Segmented, Text, useTypeScale } from '@/components/ui';
import { VoicePicker } from '@/components/VoicePicker';

const ALL_PAGES = ['why', 'setup', 'money', 'how', 'voice', 'pick'] as const;
// The voices' lines exist in English only, so other languages are not offered a voice that would stay quiet.
const PAGES_WITHOUT_VOICE = ['why', 'setup', 'money', 'how'] as const;

export default function Onboarding() {
  const { colors } = useTheme();
  const t = useT();
  const locale = useLocale();
  const PAGES: readonly string[] = useLanguageCode() === 'en' ? ALL_PAGES : PAGES_WITHOUT_VOICE;
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
  // A field that has text but no amount it can read: said beside the field, and the page waits.
  const [unreadable, setUnreadable] = useState<'balance' | 'pay' | 'rent' | null>(null);
  const readable = (text: string) => !text.trim() || parseMoneyInput(text, locale.format.decimal === ',') != null;
  const { width } = useWindowDimensions();

  // Follow the phone's own currency (a UK phone in English is pounds, not dollars), else the language's,
  // until the user picks one explicitly.
  useEffect(() => {
    if (currencyTouched) return;
    const phone = deviceCurrency();
    setCurrency(phone && CURRENCIES.some((c) => c.code === phone) ? phone : locale.defaultCurrency);
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
  const saveMoney = async (): Promise<{ paid: boolean; logged: number }> => {
    const decimalComma = locale.format.decimal === ',';
    const pay = parseMoneyInput(payText, decimalComma);
    const rent = parseMoneyInput(rentText, decimalComma);
    const todayStr = today();
    // What the setup logs at once (this period's pay, rent already paid this month) is already in the
    // balance the person just gave, so it is taken back out of it below.
    let logged = 0;
    if (pay != null && pay > 0 && pay <= MAX_AMOUNT) {
      // A payday typed long ago would log every paycheck since; only the latest one up to today counts.
      // A payday still ahead is the next one: nothing is logged before it comes.
      const first = lastPayday > todayStr ? lastPayday : latestOnOrBefore(lastPayday, payFrequency, todayStr);
      // Monthly pay keeps the day it was given: paid on the 31st, so the 30th in a short month and the 31st after.
      const anchorDay = payFrequency === 'monthly' ? Number(lastPayday.slice(8, 10)) : undefined;
      await saveRule({ id: newId(), amount: pay, type: 'income', categoryId: 'salary', frequency: payFrequency, nextOccurrence: first, anchorDay, note: t.payNote, active: true });
      if (first <= todayStr) logged += pay;
    }
    if (rent != null && rent > 0 && rent <= MAX_AMOUNT) {
      const day = Math.min(31, Math.max(1, Math.round(Number(rentDayText) || 1)));
      const now = fromDateString(todayStr);
      const y = now.getFullYear();
      const m = now.getMonth();
      const date = `${y}-${String(m + 1).padStart(2, '0')}-${String(Math.min(day, daysInMonth(y, m))).padStart(2, '0')}`;
      // The anchor is the day said, so rent "on the 31st" set in a 30-day month comes back to the 31st.
      await saveRule({ id: newId(), amount: rent, type: 'expense', categoryId: 'rent', frequency: 'monthly', nextOccurrence: date, anchorDay: day, note: t.rentNote, active: true });
      if (date <= todayStr) logged -= rent;
    }
    return { paid: pay != null && pay > 0 && pay <= MAX_AMOUNT, logged };
  };

  // One tap only: a second tap while saving would set up pay and rent twice.
  const finishing = useRef(false);
  const [finishingNow, setFinishingNow] = useState(false);
  const finish = async (voiceWanted: boolean) => {
    if (finishing.current) return;
    finishing.current = true;
    setFinishingNow(true);
    try {
      const { paid, logged } = await saveMoney();
      const given = parseMoneyInput(balance, locale.format.decimal === ',');
      await updateSettings({ ...(paid ? { budgetPeriod: 'pay' as const } : null), currency, startingBalance: given == null ? null : Math.round((given - logged) * 100) / 100, onboardingDone: true, ...(voiceWanted ? null : { voice: 'plain' as const }) });
    } catch (e) {
      finishing.current = false;
      setFinishingNow(false);
      notify(t.didntWork((e as Error).message));
    }
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
          <Field label={t.startingBalance} value={balance} onChangeText={(v) => { setBalance(v); setUnreadable(null); }} keyboardType="decimal-pad" placeholder={t.startingBalancePlaceholder} hint={t.startingBalanceHint} error={unreadable === 'balance' ? t.amountUnreadable : null} />
          <Row>
            <Button tone="ghost" title={t.back} onPress={() => go(0)} />
            <Button title={t.next} onPress={() => (readable(balance) ? go(2) : setUnreadable('balance'))} style={{ flex: 1 }} />
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
          <Field label={t.takeHomePay} value={payText} onChangeText={(v) => { setPayText(v); setUnreadable(null); }} keyboardType="decimal-pad" placeholder={t.optional} error={unreadable === 'pay' ? t.amountUnreadable : null} />
          <View style={{ marginBottom: spacing.lg }}>
            <Segmented value={payFrequency} onChange={setPayFrequency} options={[{ value: 'weekly', label: t.frequency.weekly }, { value: 'biweekly', label: t.frequency.biweekly }, { value: 'monthly', label: t.frequency.monthly }]} />
          </View>
          <Text variant="label" style={{ marginBottom: 6 }}>{t.lastPayday}</Text>
          <Row style={{ marginBottom: spacing.lg }}>
            <Button tone="secondary" small title={friendlyDate(lastPayday, today(), fmt)} onPress={() => setShowPayday(true)} />
          </Row>
          <Field label={t.rentOrMortgage} value={rentText} onChangeText={(v) => { setRentText(v); setUnreadable(null); }} keyboardType="decimal-pad" placeholder={t.optional} error={unreadable === 'rent' ? t.amountUnreadable : null} />
          <Field label={t.rentDueDay} value={rentDayText} onChangeText={setRentDayText} keyboardType="number-pad" placeholder="1" />
          <Row>
            <Button tone="ghost" title={t.back} onPress={() => go(1)} />
            <Button title={t.next} onPress={() => (!readable(payText) ? setUnreadable('pay') : !readable(rentText) ? setUnreadable('rent') : go(3))} style={{ flex: 1 }} />
          </Row>
          {/* On its own line: three buttons side by side do not fit in German on a small phone. */}
          <View style={{ marginTop: spacing.sm, alignItems: 'center' }}>
            <Button tone="ghost" small title={t.skip} onPress={() => { setPayText(''); setRentText(''); setUnreadable(null); go(3); }} />
          </View>
          <DatePicker visible={showPayday} onClose={() => setShowPayday(false)} value={lastPayday} onPick={setLastPayday} past />
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
          <View style={{ marginTop: spacing.md }}><Button tone="secondary" title={t.onboardVoiceNo} onPress={() => finish(false)} loading={finishingNow} /></View>
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
            <Button title={t.done} onPress={() => finish(true)} style={{ flex: 1 }} loading={finishingNow} />
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
          <Button title={t.start} onPress={() => (PAGES.includes('voice') ? go(4) : finish(false))} style={{ flex: 1 }} loading={!PAGES.includes('voice') && finishingNow} />
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
