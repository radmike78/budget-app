import React, { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { spacing, useTheme } from '@/theme';
import { getApiKey, setApiKey } from '@/lib/secrets';
import { confirmDialog } from '@/lib/dialogs';
import { LLM_MODEL } from '@/parser/llmFallback';
import { useT } from '@/i18n';
import { Button, Card, Field, Row, Screen, SectionTitle, Text } from '@/components/ui';

export default function SmartParsing() {
  const { colors } = useTheme();
  const t = useT();
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [key, setKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getApiKey().then((k) => { setHasKey(!!k); });
  }, []);
  if (!settings) return null;

  // Turning it on sends phrases to a third party, so it is asked for in so many words first; turning it off is one tap.
  const toggle = async (on: boolean) => {
    if (!on) { await updateSettings({ smartParseEnabled: false }); return; }
    const allowed = await confirmDialog(t.smartConsentTitle, t.smartConsentBody, { confirmText: t.allow, cancelText: t.dontAllow });
    if (allowed) await updateSettings({ smartParseEnabled: true });
  };

  const saveKey = async () => {
    await setApiKey(key.trim() || null);
    setHasKey(!!key.trim());
    setKey('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Screen keyboard>
      <Card style={{ marginTop: spacing.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text variant="body">{t.useSmart}</Text>
            <Text variant="small">{t.useSmartSub}</Text>
            {settings.smartParseEnabled && !hasKey ? <Text variant="small" style={{ marginTop: spacing.xs }}>{t.smartNeedsKey}</Text> : null}
          </View>
          <Switch value={settings.smartParseEnabled} onValueChange={toggle} trackColor={{ true: colors.accent }} accessibilityLabel={t.useSmart} />
        </Row>
      </Card>

      <SectionTitle>{t.howItWorks}</SectionTitle>
      <Card>
        <Text variant="muted">{t.smartHow1(LLM_MODEL)}</Text>
        <Text variant="muted" style={{ marginTop: spacing.sm }}>{t.smartHow2}</Text>
      </Card>

      <SectionTitle>{t.yourApiKey}</SectionTitle>
      <Card>
        <Text variant="small" style={{ marginBottom: spacing.md }}>{hasKey ? t.keySaved : t.noKey}</Text>
        <Field value={key} onChangeText={setKey} placeholder={hasKey ? t.pasteNewKey : 'sk-ant-…'} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="off" importantForAutofill="no" textContentType="none" />
        <Row>
          <Button title={t.saveKey} onPress={saveKey} disabled={!key.trim()} />
          {hasKey ? <Button tone="ghost" title={t.removeKey} onPress={async () => { await setApiKey(null); setHasKey(false); }} /> : null}
        </Row>
        {saved ? <Text variant="small" style={{ marginTop: spacing.sm }}>{t.saved}</Text> : null}
      </Card>
    </Screen>
  );
}
