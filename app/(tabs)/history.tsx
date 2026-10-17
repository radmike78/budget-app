import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Transaction, TxType } from '@/types';
import { getDb } from '@/db/database';
import { queryTransactionTotals, queryTransactions } from '@/db/repositories';
import { useAppStore } from '@/store/useAppStore';
import { spacing, useTheme } from '@/theme';
import { addDays, monthKey, monthRange, shiftMonthKey, today } from '@/lib/dates';
import { categoryName, useMoney, useT } from '@/i18n';
import { CategoryPicker } from '@/components/pickers';
import { TransactionRow } from '@/components/TransactionRow';
import { Button, CONTENT_MAX_WIDTH, Chip, ChipRow, EmptyState, Field, Text } from '@/components/ui';

type Range = 'month' | 'last_month' | '90d' | 'all';

/** Entries loaded at a time. "Show more" adds another page; the totals above always count them all. */
const PAGE = 100;

export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const t = useT();
  const money = useMoney();
  const insets = useSafeAreaInsets();
  const categories = useAppStore((s) => s.categories);
  const recent = useAppStore((s) => s.recent); // changes whenever data changes; used to re-query
  const [search, setSearch] = useState('');
  const [type, setType] = useState<TxType | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [range, setRange] = useState<Range>('month');
  const [showCat, setShowCat] = useState(false);
  const [rows, setRows] = useState<Transaction[]>([]);
  // Counted in SQL over every match, so the one line under the filters is true
  // whether the list below it holds a page or everything.
  const [totals, setTotals] = useState({ count: 0, income: 0, expenses: 0 });
  const [shown, setShown] = useState(PAGE);
  // Queries can finish out of order while typing; only the latest one may set the rows.
  const requestId = useRef(0);

  const ranges: { value: Range; label: string }[] = [
    { value: 'month', label: t.rangeThisMonth },
    { value: 'last_month', label: t.rangeLastMonth },
    { value: '90d', label: t.range90d },
    { value: 'all', label: t.rangeAll },
  ];

  // Typed search waits a beat before querying: every keystroke would otherwise scan the whole table twice.
  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(search), 150);
    return () => clearTimeout(timer);
  }, [search]);
  // "This month" and "90 days" follow the calendar when the screen is still open at midnight or comes back days later.
  const [day, setDay] = useState(today());
  useFocusEffect(useCallback(() => { setDay(today()); }, []));
  const bounds = useMemo(() => {
    const now = day;
    if (range === 'month') return monthRange(monthKey(now));
    if (range === 'last_month') return monthRange(shiftMonthKey(monthKey(now), -1));
    if (range === '90d') return { start: addDays(now, -90), end: now };
    return { start: null, end: null };
  }, [range, day]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    const db = await getDb();
    const query = { search: searchQuery, type, categoryId, from: bounds.start, to: bounds.end };
    const [list, sums] = await Promise.all([
      queryTransactions(db, { ...query, limit: shown }),
      queryTransactionTotals(db, query),
    ]);
    if (id === requestId.current) { setRows(list); setTotals(sums); }
  }, [searchQuery, type, categoryId, bounds, shown]);

  useEffect(() => { load(); }, [load, recent]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  // A new filter starts at the first page again.
  useEffect(() => { setShown(PAGE); }, [search, type, categoryId, range]);

  const category = categories.find((c) => c.id === categoryId);
  // A category deleted while it was the filter would leave an empty list behind a chip that says "Any category".
  useEffect(() => { if (categoryId && !category) setCategoryId(null); }, [categoryId, category]);

  // A category of the other kind would leave an empty list, so the filter drops with the type.
  const changeType = (next: TxType | null) => {
    setType(next);
    if (next && category && category.kind !== next) setCategoryId(null);
  };

  const header = (
    <View style={{ paddingTop: spacing.sm }}>
      <Field placeholder={t.searchPlaceholder} value={search} onChangeText={setSearch} autoCorrect={false} autoCapitalize="none" clearButtonMode="while-editing" style={{ marginBottom: spacing.sm }} />
      <ChipRow style={{ marginBottom: spacing.sm }}>
        {ranges.map((r) => <Chip key={r.value} label={r.label} selected={range === r.value} onPress={() => setRange(r.value)} />)}
      </ChipRow>
      <ChipRow style={{ marginBottom: spacing.md }}>
        <Chip label={t.all} selected={type === null} onPress={() => changeType(null)} />
        <Chip label={t.moneyOut} selected={type === 'expense'} onPress={() => changeType('expense')} />
        <Chip label={t.moneyIn} selected={type === 'income'} onPress={() => changeType('income')} />
        <Chip label={category ? `${category.icon ?? ''} ${categoryName(category, t)}`.trim() : t.anyCategory} selected={!!categoryId} onPress={() => (categoryId ? setCategoryId(null) : setShowCat(true))} />
      </ChipRow>
      <Text variant="small" style={{ marginBottom: spacing.md }}>{t.historySummary(totals.count, money(totals.income, { compact: true }), money(totals.expenses, { compact: true }))}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={rows}
        keyExtractor={(tx) => tx.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => <TransactionRow tx={item} onPress={() => router.push(`/entry/${item.id}`)} />}
        ListEmptyComponent={<EmptyState title={t.noMatches} body={t.noMatchesBody} />}
        ListFooterComponent={rows.length < totals.count ? <Button tone="secondary" title={t.showMore} onPress={() => setShown((n) => n + PAGE)} style={{ marginTop: spacing.md }} /> : null}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
      <CategoryPicker visible={showCat} onClose={() => setShowCat(false)} onPick={(c) => setCategoryId(c.id)} kind={type ?? 'all'} selectedId={categoryId} categories={categories} />
    </View>
  );
}
