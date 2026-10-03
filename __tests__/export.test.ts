import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';
import { buildBackup, isBackupPayload, summaryText, transactionsToCsv } from '@/lib/export';
import { base64ToBytes, bytesToBase64, decryptBackup, encryptBackup } from '@/lib/backupCrypto';
import { validateBackup } from '@/lib/validate';
import { de } from '@/i18n/locales/de';
import type { Debt, Goal, ImportRecord, RecurringRule, Reminder, Settings, Transaction } from '@/types';

const tx: Transaction[] = [
  { id: 't1', amount: 12, type: 'expense', categoryId: 'dining', note: 'Lunch, with "Sam"', rawInput: 'spent 12 on lunch', occurredAt: '2026-09-02', createdAt: '2026-09-02T12:00:00.000Z', isRecurringInstance: false, recurringRuleId: null },
  { id: 't2', amount: 2400, type: 'income', categoryId: 'salary', note: null, rawInput: 'got paid 2400', occurredAt: '2026-09-01', createdAt: '2026-09-01T09:00:00.000Z', isRecurringInstance: true, recurringRuleId: 'r1' },
];

describe('transactionsToCsv', () => {
  it('quotes fields and sorts by date', () => {
    const csv = transactionsToCsv(tx, DEFAULT_CATEGORIES);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe('date,type,amount,category,note,recurring,original_input,id');
    expect(lines[1]).toBe('2026-09-01,income,2400.00,Salary,,yes,got paid 2400,t2');
    expect(lines[2]).toBe('2026-09-02,expense,12.00,Dining out,"Lunch, with ""Sam""",no,spent 12 on lunch,t1');
  });
});

describe('summaryText', () => {
  it('lists months and categories', () => {
    const text = summaryText(tx, DEFAULT_CATEGORIES, [], 'USD', '2026-09-10T00:00:00.000Z');
    expect(text).toContain('September 2026');
    expect(text).toContain('In: $2,400.00   Out: $12.00   Net: $2,388.00');
    expect(text).toContain('Dining out: $12.00');
  });

  it('writes goal lines in the locale, with the date spelled out', () => {
    const goals: Goal[] = [{ id: 'g1', name: 'Trip', kind: 'saving', targetAmount: 500, currentAmount: 120, targetDate: '2026-12-24', createdAt: '2026-09-01T00:00:00.000Z', completed: false }];
    const en = summaryText([], DEFAULT_CATEGORIES, goals, 'USD', '2026-09-10T00:00:00.000Z');
    expect(en).toContain('  Trip: $120.00 of $500.00 by December 24');
    const german = summaryText([], DEFAULT_CATEGORIES, goals, 'EUR', '2026-09-10T00:00:00.000Z', de);
    expect(german).toContain('Trip: 120,00 € von 500,00 € bis 24. Dezember');
    expect(german).not.toContain(' of ');
  });
});

describe('backup round trip', () => {
  const settings: Settings = { currency: 'USD', theme: 'system', lastBackupAt: null, startingBalance: null, onboardingDone: true, reminderEnabled: false, reminderHour: 20, smartParseEnabled: false, appLockEnabled: false, language: 'system', answerMode: 'auto', budgetPeriod: 'month', overallLimit: null, voice: 'plain', attitude: 'playful', voiceGender: 'female', accent: 'sage' };
  const payload = buildBackup({ settings, categories: DEFAULT_CATEGORIES, transactions: tx, recurringRules: [], goals: [], keywords: [] }, '2026-09-10T00:00:00.000Z');

  it('validates payloads', () => {
    expect(isBackupPayload(payload)).toBe(true);
    expect(isBackupPayload({ app: 'other' })).toBe(false);
  });

  it('base64 helpers round trip', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
    expect(bytesToBase64(new Uint8Array([104, 105]))).toBe('aGk=');
  });

  it('carries reminders, debts, imports and statement fingerprints through validation', () => {
    const NOW = '2026-09-10T00:00:00.000Z';
    const reminders: Reminder[] = [{ id: 'rem1', text: 'Pay the rent', date: '2026-10-01', time: '09:00', repeat: 'monthly', notificationId: 'onlybudget-reminder-rem1', createdAt: NOW }];
    const debts: Debt[] = [{ id: 'd1', creditor: 'Visa', type: 'credit_card', balance: 1200.5, monthlyPayment: 60, creditLimit: 5000, apr: 19.99, source: 'card_statement', updatedAt: NOW }];
    const imports: ImportRecord[] = [{ id: 'imp1', kind: 'bank', fileName: '', periodStart: '2026-08-01', periodEnd: '2026-08-31', count: 2, importedAt: NOW }];
    const imported: Transaction[] = [
      { ...tx[0], id: 't3', fingerprint: 'a1b2c3d4e5f6a7b8', importId: 'imp1' },
      { ...tx[0], id: 't4', fingerprint: 'ffffffffffffffff', importId: 'no_such_import' },
    ];
    const full = buildBackup({ settings, categories: DEFAULT_CATEGORIES, transactions: imported, recurringRules: [], goals: [], keywords: [], reminders, debts, imports }, NOW);
    expect(full.version).toBe(6);
    // The notification id belongs to the phone that made the backup.
    expect(full.reminders[0].notificationId).toBeNull();

    const data = validateBackup(JSON.parse(JSON.stringify(full)), NOW);
    expect(data.reminders).toEqual([{ ...reminders[0], notificationId: null }]);
    expect(data.debts).toEqual(debts);
    expect(data.imports).toEqual(imports);
    expect(data.transactions.map((t) => [t.fingerprint, t.importId])).toEqual([['a1b2c3d4e5f6a7b8', 'imp1'], ['ffffffffffffffff', null]]);
    expect(data.settings.reminderEnabled).toBe(false);
  });

  it('still accepts a version 1 backup without the newer tables', () => {
    const old = { ...payload, version: 1 } as Record<string, unknown>;
    delete old.reminders; delete old.debts; delete old.imports;
    const data = validateBackup(old, '2026-09-10T00:00:00.000Z');
    expect(data.transactions).toHaveLength(2);
    expect(data.transactions[0].fingerprint).toBeNull();
    expect(data.reminders).toEqual([]);
    expect(data.debts).toEqual([]);
    expect(data.imports).toEqual([]);
  });

  it('rejects bad rows in the newer tables', () => {
    const NOW = '2026-09-10T00:00:00.000Z';
    const bad = [
      { reminders: [{ id: 'r', text: 'x', date: '2026-01-01', time: '25:00', repeat: 'none' }] },
      { reminders: [{ id: 'r', text: '', date: '2026-01-01', time: '09:00', repeat: 'none' }] },
      { reminders: [{ id: 'r', text: 'x', date: '2026-01-01', time: '09:00', repeat: 'hourly' }] },
      { debts: [{ id: 'd', creditor: 'X', type: 'payday', balance: 1 }] },
      { debts: [{ id: 'd', creditor: 'X', type: 'other', balance: -1 }] },
      { debts: [{ id: 'd', creditor: 'X', type: 'other', balance: 1, apr: 1e9 }] },
      { imports: [{ id: 'i', kind: 'email', fileName: '', count: 1, importedAt: NOW }] },
      { transactions: [{ ...tx[0], fingerprint: "'; DROP TABLE transactions; --" }] },
    ];
    for (const patch of bad) expect(() => validateBackup({ ...payload, ...patch }, NOW)).toThrow(/Invalid backup/);
  });

  it('encrypts and decrypts with the right passphrase', () => {
    let seed = 1;
    const random = (n: number) => new Uint8Array(Array.from({ length: n }, () => (seed = (seed * 16807) % 2147483647) & 255));
    const json = JSON.stringify(payload);
    const file = encryptBackup(json, 'correct horse', random);
    expect(file.ciphertext).not.toContain('onlybudget');
    expect(decryptBackup(file, 'correct horse')).toBe(json);
    expect(() => decryptBackup(file, 'wrong')).toThrow();
  });
});

describe('backup keeps the anchor day of repeating rules', () => {
  const NOW = '2026-09-17T00:00:00.000Z';
  it('restores anchorDay and drops a bad one', () => {
    const settings: Settings = { currency: 'USD', theme: 'system', lastBackupAt: null, startingBalance: null, onboardingDone: true, reminderEnabled: false, reminderHour: 20, smartParseEnabled: false, appLockEnabled: false, language: 'system', answerMode: 'auto', budgetPeriod: 'month', overallLimit: null, voice: 'plain', attitude: 'playful', voiceGender: 'female', accent: 'sage' };
    const rule: RecurringRule = { id: 'r1', amount: 1400, type: 'expense', categoryId: 'rent', frequency: 'monthly', nextOccurrence: '2026-02-28', anchorDay: 31, note: 'Rent', active: true };
    const payload = buildBackup({ settings, categories: DEFAULT_CATEGORIES, transactions: [], recurringRules: [rule], goals: [], keywords: [] }, NOW);
    const restored = validateBackup(JSON.parse(JSON.stringify(payload)), NOW);
    expect(restored.recurringRules[0].anchorDay).toBe(31);
    const bad = JSON.parse(JSON.stringify(payload)); bad.recurringRules[0].anchorDay = 99;
    expect(validateBackup(bad, NOW).recurringRules[0].anchorDay).toBeNull();
  });
});
