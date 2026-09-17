import React from 'react';
import { Pressable, View } from 'react-native';
import type { Category, MonthStats } from '@/types';
import { spacing, useTheme } from '@/theme';
import { ramp } from '@/lib/color';
import { expenseBreakdown } from '@/lib/plain';
import { Row, Text } from '@/components/ui';

/** How many categories get their own segment; the rest fold into "Other". */
const SEGMENTS = 3;

/**
 * One bar for the period's spending: the biggest categories as segments of one
 * hue, darkest first, with a 2px gap between them and the names underneath.
 * Magnitude is the job here, so colour follows size and identity comes from
 * the labels, never from colour alone.
 */
export function SpendBar({ stats, categories, nameOf, otherLabel, onPress }: {
  stats: MonthStats;
  categories: Category[];
  nameOf: (c: Category) => string;
  otherLabel: string;
  onPress?: () => void;
}) {
  const { colors, isDark } = useTheme();
  if (stats.expenses <= 0) return null;
  const rows = expenseBreakdown(stats, categories);
  const top = rows.slice(0, SEGMENTS - 1);
  const rest = rows.slice(SEGMENTS - 1);
  const restTotal = rest.reduce((s, r) => s + r.total, 0);
  const segments = top.map((r) => ({ key: r.category?.id ?? 'none', label: r.category ? nameOf(r.category) : otherLabel, icon: r.category?.icon ?? null, share: r.share }));
  if (restTotal > 0) segments.push({ key: 'other', label: otherLabel, icon: null, share: restTotal / stats.expenses });
  const shades = ramp(colors.accent, isDark ? colors.card : colors.bg, Math.max(2, segments.length));
  const pct = (share: number) => `${Math.round(share * 100)}%`;
  const body = (
    <View accessibilityRole="image" accessibilityLabel={segments.map((s) => `${s.label} ${pct(s.share)}`).join(', ')}>
      <Row gap={2} style={{ height: 10, borderRadius: 5, overflow: 'hidden' }}>
        {segments.map((s, i) => (
          <View key={s.key} style={{ flex: Math.max(s.share, 0.02), height: 10, backgroundColor: shades[i] }} />
        ))}
      </Row>
      <Row gap={spacing.md} align="flex-start" style={{ marginTop: spacing.sm }}>
        {segments.map((s) => (
          <View key={s.key} style={{ flex: 1 }}>
            <Text variant="small" numberOfLines={1}>{s.icon ? `${s.icon} ` : ''}{s.label}</Text>
            <Text variant="body" style={{ fontWeight: '600', marginTop: 2 }}>{pct(s.share)}</Text>
          </View>
        ))}
      </Row>
    </View>
  );
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress}>{body}</Pressable> : body;
}
