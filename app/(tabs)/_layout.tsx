import React from 'react';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
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
        tabBarLabelStyle: { fontSize: Math.round(11 * scale), fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.tabToday, headerTitle: t.appName, tabBarIcon: icon('sunny-outline') }} />
      <Tabs.Screen name="budget" options={{ title: t.tabBudget, tabBarIcon: icon('pie-chart-outline') }} />
      <Tabs.Screen name="goals" options={{ title: t.tabGoals, tabBarIcon: icon('flag-outline') }} />
      <Tabs.Screen name="history" options={{ title: t.tabHistory, tabBarIcon: icon('time-outline') }} />
      <Tabs.Screen name="settings" options={{ title: t.tabSettings, tabBarIcon: icon('settings-outline') }} />
    </Tabs>
    <UndoBar bottomOffset={wide ? 72 : 58} />
    </>
  );
}
