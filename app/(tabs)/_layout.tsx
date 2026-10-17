import React from 'react';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useT } from '@/i18n';
import { useIsWide, useTypeScale } from '@/components/ui';
import { UndoBar } from '@/components/UndoBar';

export default function TabsLayout() {
  const { colors } = useTheme();
  const t = useT();
  const scale = useTypeScale();
  const wide = useIsWide();
  // On tablets the header and tab bar step up with the rest of the type, and the
  // title sits over the centred content column instead of hugging the left edge.
  const icon = (name: React.ComponentProps<typeof Ionicons>['name']) => ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={color} size={Math.round(size * scale)} />;
  // The label is drawn here rather than left to tabBarLabelStyle: the navigator's own
  // label box comes out shorter than the glyphs, so the web build clips the descenders
  // off "Today", "Budget" and "Settings".
  const label = (title: string) => ({ color }: { color: ColorValue }) => (
    // The tab bar has a fixed height, so the label grows with the phone's text size only so far.
    <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={{ color: color as string, fontSize: Math.round(11 * scale), lineHeight: Math.round(16 * scale), fontWeight: '600', textAlign: 'center', includeFontPadding: false }}>{title}</Text>
  );
  return (
    <>
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 20 * scale },
        headerTitleAlign: wide ? 'center' : undefined,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border, ...(wide ? { height: 64, paddingTop: 6, paddingBottom: 8 } : null) },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarIconStyle: { marginBottom: 1 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.tabToday, tabBarLabel: label(t.tabToday), headerTitle: t.appName, tabBarIcon: icon('sunny-outline') }} />
      <Tabs.Screen name="budget" options={{ title: t.tabBudget, tabBarLabel: label(t.tabBudget), tabBarIcon: icon('pie-chart-outline') }} />
      <Tabs.Screen name="goals" options={{ title: t.tabGoals, tabBarLabel: label(t.tabGoals), tabBarIcon: icon('flag-outline') }} />
      <Tabs.Screen name="history" options={{ title: t.tabHistory, tabBarLabel: label(t.tabHistory), tabBarIcon: icon('time-outline') }} />
      <Tabs.Screen name="settings" options={{ title: t.tabSettings, tabBarLabel: label(t.tabSettings), tabBarIcon: icon('settings-outline') }} />
    </Tabs>
    <UndoBar bottomOffset={wide ? 72 : 58} />
    </>
  );
}
