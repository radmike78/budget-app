import React, { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Platform, Pressable, View } from 'react-native';
import { Stack, router, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Each weight from its own entry point: the package root requires all eighteen (1.4 MB) into the bundle.
import { useFonts } from 'expo-font';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme';
import { configureNotificationHandler } from '@/lib/reminders';
import { useT } from '@/i18n';
import { Button, Text, useIsWide, useTypeScale } from '@/components/ui';
import { LockGate } from '@/components/LockGate';

SplashScreen.preventAutoHideAsync().catch(() => {});
const START_TIMEOUT_MS = 20_000;
configureNotificationHandler();

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  const t = useT();
  const typeScale = useTypeScale();
  const wide = useIsWide();
  const ready = useAppStore((s) => s.ready);
  const onboardingDone = useAppStore((s) => s.settings?.onboardingDone ?? false);
  const init = useAppStore((s) => s.init);
  const [error, setError] = useState<string | null>(null);
  // If the font cannot load, the system face is used; the app never waits on it for more than a moment.
  const [fontsLoaded, fontError] = useFonts({ Fraunces_600SemiBold, Fraunces_700Bold });
  const fontsReady = fontsLoaded || !!fontError;

  // A start that hangs (a database that never opens) shows the error screen with Try again rather than a spinner for ever.
  const start = React.useCallback(() => {
    setError(null);
    const timer = setTimeout(() => { if (!useAppStore.getState().ready) setError(t.screenError); }, START_TIMEOUT_MS);
    init().catch((e: Error) => setError(e.message)).finally(() => clearTimeout(timer));
  }, [init, t.screenError]);
  useEffect(() => { start(); }, [start]);

  // Back from the background (perhaps days later): log what fell due and move to today's period.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => { if (state === 'active') useAppStore.getState().resume().catch(() => {}); });
    return () => sub.remove();
  }, []);

  // The splash also goes when opening fails, or the error screen would sit under it and the app look frozen.
  useEffect(() => {
    if ((ready && fontsReady) || error) SplashScreen.hideAsync().catch(() => {});
  }, [ready, fontsReady, error]);

  // iOS modal screens otherwise close only by a swipe nobody is told about.
  const modalClose = Platform.OS === 'ios'
    ? { headerLeft: () => <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={12}><Text variant="body" color={colors.accent}>{t.cancel}</Text></Pressable> }
    : null;

  let body: React.ReactNode;
  if (error) {
    body = (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg }}>
        <Text variant="heading">{t.openError}</Text>
        <Text variant="muted" style={{ marginTop: 8, textAlign: 'center' }}>{error}</Text>
        <View style={{ marginTop: 16 }}><Button title={t.tryAgain} onPress={start} /></View>
      </View>
    );
  } else if (!ready || !fontsReady) {
    body = (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  } else {
    body = (
      <LockGate>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600', fontSize: 17 * typeScale },
          headerTitleAlign: wide ? 'center' : undefined,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Protected guard={!onboardingDone}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={onboardingDone}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="entry/[id]" options={{ title: t.editEntry, presentation: 'modal', ...modalClose }} />
          <Stack.Screen name="category/[id]" options={{ title: t.category, presentation: 'modal', ...modalClose }} />
          <Stack.Screen name="goal/[id]" options={{ title: t.goalTitle, presentation: 'modal', ...modalClose }} />
          <Stack.Screen name="recurring/index" options={{ title: t.repeatingEntries }} />
          <Stack.Screen name="recurring/[id]" options={{ title: t.repeatingEntry, presentation: 'modal', ...modalClose }} />
          <Stack.Screen name="settings/help" options={{ title: t.help }} />
          <Stack.Screen name="settings/voice" options={{ title: t.voice }} />
          <Stack.Screen name="settings/about" options={{ title: t.aboutApp }} />
          <Stack.Screen name="settings/backup" options={{ title: t.backupExport }} />
          <Stack.Screen name="settings/smart" options={{ title: t.smartParse }} />
          <Stack.Screen name="settings/keywords" options={{ title: t.learnedWords }} />
          <Stack.Screen name="settings/reminders" options={{ title: t.reminders }} />
          <Stack.Screen name="import/index" options={{ title: t.importStatement }} />
          <Stack.Screen name="debts/index" options={{ title: t.debts }} />
        </Stack.Protected>
      </Stack>
      </LockGate>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {body}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** A screen that throws while drawing shows this instead of closing the app. */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const { colors } = useTheme();
  const t = useT();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg }}>
      <Text variant="heading" style={{ textAlign: 'center' }}>{t.screenError}</Text>
      <View style={{ marginTop: 16 }}><Button title={t.tryAgain} onPress={retry} /></View>
    </View>
  );
}
