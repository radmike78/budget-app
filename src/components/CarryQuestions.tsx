import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme';
import { categoryName, useMoney, useT } from '@/i18n';
import { Button, Card, Row, Text } from '@/components/ui';

/**
 * One quiet card per category set to "Ask me" that has a leftover from the
 * previous period and no answer yet for the shown period.
 */
export function CarryQuestions() {
  const t = useT();
  const money = useMoney();
  const categories = useAppStore((s) => s.categories);
  const carry = useAppStore((s) => s.carry);
  const decide = useAppStore((s) => s.decideCarry);
  const pending = categories.filter((c) => carry[c.id]?.pendingLeftover != null);
  if (pending.length === 0) return null;
  return (
    <>
      {pending.map((c) => {
        const leftover = carry[c.id].pendingLeftover as number;
        return (
          <Card key={c.id} tone="accent" style={{ marginTop: spacing.sm, paddingVertical: spacing.md }}>
            <Text variant="body">{t.askCarryTiny(money(leftover, { compact: true }), categoryName(c, t))}</Text>
            <Row style={{ marginTop: spacing.sm }}>
              <Button tone="secondary" small title={t.carryIt} onPress={() => decide(c.id, leftover)} />
              <Button tone="ghost" small title={t.startFresh} onPress={() => decide(c.id, 0)} />
            </Row>
          </Card>
        );
      })}
    </>
  );
}
