import React from 'react';
import { spacing } from '@/theme';
import { useT } from '@/i18n';
import { Card, Screen, Text } from '@/components/ui';

/** Plain instructions for every part of the app, in the user's language. */
export default function Help() {
  const t = useT();
  return (
    <Screen>
      <Text variant="muted" style={{ marginTop: spacing.sm, marginBottom: spacing.md }}>{t.helpIntro}</Text>
      {t.helpTopics.map(([title, body]) => (
        <Card key={title} style={{ marginBottom: spacing.sm }}>
          <Text variant="heading">{title}</Text>
          <Text variant="muted" style={{ marginTop: spacing.xs }}>{body}</Text>
        </Card>
      ))}
    </Screen>
  );
}
