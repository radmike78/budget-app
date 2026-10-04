import React from 'react';
import { Pressable, View } from 'react-native';
import type { Category, MonthStats } from '@/types';
import { spacing, useTheme } from '@/theme';
import { ramp } from '@/lib/color';
import { expenseBreakdown } from '@/lib/plain';
import { FALLBACK_EXPENSE_CATEGORY_ID } from '@/lib/defaultCategories';
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
  // The "Other" category and spending with no category are both "other": giving either a
  // segment of its own would put two "Other" labels side by side with the folded remainder.
  const named = rows.filter((r) => r.category && r.category.id !== FALLBACK_EXPENSE_CATEGORY_ID);
  const top = named.slice(0, SEGMENTS - 1);
  const rest = rows.filter((r) => !top.includes(r));
  const restTotal = rest.reduce((s, r) => s + r.total, 0);
  const segments = top.map((r) => ({ key: r.category?.id ?? 'none', label: r.category ? nameOf(r.category) : otherLabel, icon: r.category?.icon ?? null, share: r.share }));
  if (restTotal > 0) segments.push({ key: 'other', label: otherLabel, icon: null, share: restTotal / stats.expenses });
  // On a dark card the faintest shade would vanish, so the run stops short of the surface.
  const shades = ramp(colors.accent, isDark ? colors.card : colors.bg, Math.max(2, segments.length), isDark ? 0.6 : 0.8);
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
            <Text variant="body">{s.icon ?? '🧾'}</Text>
            <Text variant="small" numberOfLines={1}>{s.label}</Text>
            <Text variant="body" style={{ fontWeight: '600' }}>{pct(s.share)}</Text>
          </View>
        ))}
      </Row>
    </View>
  );
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress}>{body}</Pressable> : body;
}
