import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { getDb } from '@/db/database';
import { allTransactions } from '@/db/repositories';
import { useAppStore } from '@/store/useAppStore';
import { spacing, useTheme } from '@/theme';
import { localDay, longDate, nowIso, today } from '@/lib/dates';
import { buildBackup, summaryText, transactionsToCsv } from '@/lib/export';
import { BackupValidationError, MAX_BACKUP_BYTES, MIN_PASSPHRASE_LENGTH, validateBackup } from '@/lib/validate';
import { decryptBackup, encryptBackup, isEncryptedBackupFile } from '@/lib/backupCrypto';
import { pickTextFile, shareTextFile, timestampForFilename } from '@/lib/files';
import { categoryName, useLocale, useDateFormat, useT } from '@/i18n';
import { confirmDialog } from '@/lib/dialogs';
import { Sheet } from '@/components/pickers';
import { Button, Card, Field, Screen, SectionTitle, Text } from '@/components/ui';

export default function Backup() {
  const { colors } = useTheme();
  const t = useT();
  const fmt = useDateFormat();
  const locale = useLocale();
  const settings = useAppStore((s) => s.settings);
  const categories = useAppStore((s) => s.categories);
  const goals = useAppStore((s) => s.goals);
  const rules = useAppStore((s) => s.rules);
  const keywords = useAppStore((s) => s.keywords);
  const reminders = useAppStore((s) => s.reminders);
  const debts = useAppStore((s) => s.debts);
  const carryovers = useAppStore((s) => s.carryovers);
  const imports = useAppStore((s) => s.imports);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const restoreAll = useAppStore((s) => s.restoreAll);
  const mergeRestore = useAppStore((s) => s.mergeRestore);
  const lifetime = useAppStore((s) => s.lifetime);
  const [askRestore, setAskRestore] = useState<{ tx: number; goals: number } | null>(null);
  const chooseRestore = useRef<((choice: 'add' | 'replace' | null) => void) | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null);
  const [askPass, setAskPass] = useState<null | { mode: 'encrypt' } | { mode: 'decrypt'; file: unknown }>(null);
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  if (!settings) return null;

  const nameOf = (c: Parameters<typeof categoryName>[0]) => categoryName(c, t);

  const run = async (label: string, fn: () => Promise<string>) => {
    setBusy(label);
    setStatus(null);
    try {
      const text = await fn();
      setStatus(text ? { text, error: false } : null); // '' is a share sheet dismissed: nothing to report
    } catch (e) {
      const code = (e as Error).message;
      const msg = code === 'SHARING_UNAVAILABLE' ? t.sharingUnavailable : code === 'MERGE_TOO_MANY' ? t.mergeTooMany : t.didntWork(code);
      setStatus({ text: msg, error: true });
    } finally {
      setBusy(null);
    }
  };

  const snapshot = async () => {
    const db = await getDb();
    const transactions = await allTransactions(db);
    return buildBackup({ settings, categories, transactions, recurringRules: rules, goals, keywords, reminders, debts, imports, carryovers }, nowIso());
  };

  const exportCsv = () => run('csv', async () => {
    const db = await getDb();
    const tx = await allTransactions(db);
    await shareTextFile(`onlybudget-entries-${timestampForFilename()}.csv`, transactionsToCsv(tx, categories, nameOf));
    return t.csvReady;
  });

  const exportSummary = () => run('summary', async () => {
    const db = await getDb();
    const tx = await allTransactions(db);
    await shareTextFile(`onlybudget-summary-${timestampForFilename()}.txt`, summaryText(tx, categories, goals, settings.currency, nowIso(), locale, nameOf));
    return t.summaryReady;
  });

  const exportBackup = () => run('backup', async () => {
    const payload = await snapshot();
    const shared = await shareTextFile(`onlybudget-backup-${timestampForFilename()}.json`, JSON.stringify(payload, null, 2));
    if (!shared) return '';
    await updateSettings({ lastBackupAt: nowIso() });
    return t.backupReady;
  });

  const exportEncrypted = () => run('encrypted', async () => {
    if (pass.length < MIN_PASSPHRASE_LENGTH) throw new Error(t.passphraseShort);
    if (pass !== pass2) throw new Error(t.passphraseMismatch);
    const payload = await snapshot();
    const file = await encryptBackup(JSON.stringify(payload), pass, (n) => Crypto.getRandomBytes(n));
    const shared = await shareTextFile(`onlybudget-backup-${timestampForFilename()}.onlybudget.json`, JSON.stringify(file));
    setAskPass(null); setPass(''); setPass2('');
    if (!shared) return '';
    await updateSettings({ lastBackupAt: nowIso() });
    return t.encryptedReady;
  });

  /** Returns the message to show; a declined confirmation is a normal outcome, not an error. */
  const applyRestore = async (payload: unknown): Promise<string> => {
    let data: ReturnType<typeof validateBackup>;
    try {
      data = validateBackup(payload, nowIso());
    } catch (e) {
      if (e instanceof BackupValidationError) throw new Error(t.notBackupFile);
      throw e;
    }
    // With nothing here yet there is nothing to keep; otherwise the person picks between adding and replacing.
    const empty = lifetime.income === 0 && lifetime.expenses === 0 && goals.length === 0;
    let choice: 'add' | 'replace' | null = 'replace';
    if (empty) {
      const ok = await confirmDialog(t.replaceEverythingQ, t.replaceEverythingBody(data.transactions.length, data.goals.length), { confirmText: t.restore, cancelText: t.cancel, destructive: true });
      if (!ok) return t.cancelled;
    } else {
      choice = await new Promise<'add' | 'replace' | null>((resolve) => { chooseRestore.current = resolve; setAskRestore({ tx: data.transactions.length, goals: data.goals.length }); });
      chooseRestore.current = null;
      setAskRestore(null);
      if (!choice) return t.cancelled;
      if (choice === 'replace') {
        await new Promise((r) => setTimeout(r, 400)); // the choice sheet is closing
        const ok = await confirmDialog(t.replaceEverythingQ, t.replaceEverythingBody(data.transactions.length, data.goals.length), { confirmText: t.restore, cancelText: t.cancel, destructive: true });
        if (!ok) return t.cancelled;
      }
    }
    if (choice === 'add') {
      const { added } = await mergeRestore(data);
      return added ? t.merged(added) : t.mergedNothing;
    }
    // The switches a file may not set keep whatever this phone already has (the daily reminder stays scheduled or not as it is).
    // The file just restored is itself a backup of everything now on the phone, made when it was exported.
    const exportedAt = (payload as { exportedAt?: unknown }).exportedAt;
    const lastBackupAt = typeof exportedAt === 'string' && !Number.isNaN(Date.parse(exportedAt)) && Date.parse(exportedAt) <= Date.now() ? new Date(exportedAt).toISOString() : data.settings.lastBackupAt;
    await restoreAll({ ...data, settings: { ...data.settings, lastBackupAt, smartParseEnabled: settings.smartParseEnabled, appLockEnabled: settings.appLockEnabled, reminderEnabled: settings.reminderEnabled } });
    return t.restored(data.transactions.length);
  };

  /** The passphrase never outlives the sheet it was typed into. */
  const closePassphrase = () => { setAskPass(null); setPass(''); setPass2(''); };

  const parseFile = (text: string): unknown => {
    if (text.length > MAX_BACKUP_BYTES) throw new Error(t.notBackupFile);
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(t.notBackupFile);
    }
  };

  const restore = () => run('restore', async () => {
    const picked = await pickTextFile(MAX_BACKUP_BYTES);
    if (!picked) return t.noFileChosen;
    const parsed = parseFile(picked.text);
    if (isEncryptedBackupFile(parsed)) {
      setAskPass({ mode: 'decrypt', file: parsed });
      return t.enterPassphraseToContinue;
    }
    return applyRestore(parsed);
  });

  const decryptAndRestore = () => run('restore', async () => {
    if (!askPass || askPass.mode !== 'decrypt') return '';
    let json: string;
    try {
      json = await decryptBackup(askPass.file as Parameters<typeof decryptBackup>[0], pass);
    } catch {
      setPass('');
      throw new Error(t.wrongPassphrase);
    }
    setAskPass(null); setPass('');
    // The passphrase sheet is a Modal: an alert shown while it is still closing can be swallowed on iOS.
    await new Promise((r) => setTimeout(r, 400));
    return applyRestore(parseFile(json));
  });

  return (
    <Screen>
      <Text variant="muted" style={{ marginTop: spacing.sm }}>{t.backupIntro(settings.lastBackupAt ? longDate(localDay(settings.lastBackupAt), today(), fmt) : null)}</Text>

      <SectionTitle>{t.exportSection}</SectionTitle>
      <Card style={{ gap: spacing.sm }}>
        <Button title={t.exportCsv} tone="secondary" onPress={exportCsv} loading={busy === 'csv'} />
        <Button title={t.exportSummary} tone="secondary" onPress={exportSummary} loading={busy === 'summary'} />
      </Card>

      <SectionTitle>{t.backupSection}</SectionTitle>
      <Card style={{ gap: spacing.sm }}>
        <Button title={t.encryptedBackup} onPress={() => { setPass(''); setPass2(''); setAskPass({ mode: 'encrypt' }); }} loading={busy === 'encrypted'} />
        <Button tone="secondary" title={t.fullBackup} onPress={exportBackup} loading={busy === 'backup'} />
        <Text variant="small">{t.encryptedHint}</Text>
      </Card>

      <SectionTitle>{t.restoreSection}</SectionTitle>
      <Card style={{ gap: spacing.sm }}>
        <Button title={t.restoreButton} tone="secondary" onPress={restore} loading={busy === 'restore'} />
        <Text variant="small">{t.restoreHint}</Text>
      </Card>

      {status ? <Text variant="body" color={status.error ? colors.danger : colors.text} style={{ marginTop: spacing.lg }}>{status.text}</Text> : null}

      <Sheet visible={!!askRestore} onClose={() => chooseRestore.current?.(null)} title={t.restoreChoiceTitle}>
        <Text variant="muted">{askRestore ? t.restoreChoiceBody(askRestore.tx, askRestore.goals) : ''}</Text>
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Button title={t.restoreAdd} onPress={() => chooseRestore.current?.('add')} />
          <Button tone="secondary" title={t.restoreReplace} onPress={() => chooseRestore.current?.('replace')} />
          <Button tone="ghost" title={t.cancel} onPress={() => chooseRestore.current?.(null)} />
        </View>
      </Sheet>
      <Sheet visible={!!askPass} onClose={closePassphrase} title={askPass?.mode === 'encrypt' ? t.choosePassphrase : t.enterPassphrase} scroll>
        <Field label={t.passphrase} value={pass} onChangeText={setPass} secureTextEntry autoCapitalize="none" autoFocus />
        {askPass?.mode === 'encrypt' ? <Field label={t.repeatPassphrase} value={pass2} onChangeText={setPass2} secureTextEntry autoCapitalize="none" /> : null}
        <View>
          <Button title={askPass?.mode === 'encrypt' ? t.createEncrypted : t.unlockRestore} onPress={askPass?.mode === 'encrypt' ? exportEncrypted : decryptAndRestore} loading={busy != null} />
        </View>
        {status && askPass ? <Text variant="small" color={status.error ? colors.danger : colors.text} style={{ marginTop: spacing.sm }}>{status.text}</Text> : null}
      </Sheet>
    </Screen>
  );
}
