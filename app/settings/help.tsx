import { Platform } from 'react-native';
import React from 'react';
import { spacing } from '@/theme';
import { useT } from '@/i18n';
import { Card, Screen, Text } from '@/components/ui';

/** Plain instructions for every part of the app, in the user's language. */
/** Topics about rows the web build does not have (daily reminder, app lock) and the free month it never has. Same order in every locale. */
const WEB_HIDDEN_TOPICS = new Set([16, 17, 19]);

export default function Help() {
  const t = useT();
  return (
    <Screen>
      <Text variant="muted" style={{ marginTop: spacing.sm, marginBottom: spacing.md }}>{t.helpIntro}</Text>
      {t.helpTopics.filter((_topic, i) => Platform.OS !== 'web' || !WEB_HIDDEN_TOPICS.has(i)).map(([title, body]) => (
        <Card key={title} style={{ marginBottom: spacing.sm }}>
          <Text variant="heading">{title}</Text>
          <Text variant="muted" style={{ marginTop: spacing.xs }}>{body}</Text>
        </Card>
      ))}
    </Screen>
  );
}
