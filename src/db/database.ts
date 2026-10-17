import * as SQLite from 'expo-sqlite';
import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';

export type DB = SQLite.SQLiteDatabase;

let dbPromise: Promise<DB> | null = null;

export function getDb(): Promise<DB> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('onlybudget.db');
      // secure_delete: a removed entry is overwritten in the file, not left in a free page for a recovery tool.
      await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA secure_delete = ON;');
      await migrate(db);
      return db;
    })();
    // A failed open is not kept: "Try again" must really try again.
    dbPromise.catch(() => { dbPromise = null; });
  }
  return dbPromise;
}

/**
 * Schema versions. Add a new entry to MIGRATIONS for every change; never edit
 * an existing one, since users' databases may be at any version.
 */
const MIGRATIONS: string[] = [
  // v1: initial schema (mirrors the product spec, plus a category `kind` and a
  // learned-keywords table for the parser).
  `
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
    monthly_limit REAL,
    is_default INTEGER DEFAULT 0,
    archived INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS recurring_rules (
    id TEXT PRIMARY KEY,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly','biweekly','monthly','yearly')),
    next_occurrence TEXT NOT NULL,
    note TEXT,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    note TEXT,
    raw_input TEXT,
    occurred_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    is_recurring_instance INTEGER DEFAULT 0,
    recurring_rule_id TEXT REFERENCES recurring_rules(id) ON DELETE SET NULL
  );
  CREATE INDEX IF NOT EXISTS idx_transactions_occurred ON transactions(occurred_at);
  CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    target_date TEXT,
    created_at TEXT NOT NULL,
    completed INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    currency TEXT DEFAULT 'USD',
    theme TEXT DEFAULT 'system',
    last_backup_at TEXT,
    starting_balance REAL,
    onboarding_done INTEGER DEFAULT 0,
    reminder_enabled INTEGER DEFAULT 0,
    reminder_hour INTEGER DEFAULT 20,
    smart_parse_enabled INTEGER DEFAULT 0
  );
  INSERT OR IGNORE INTO settings (id) VALUES (1);

  CREATE TABLE IF NOT EXISTS keyword_mappings (
    word TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE
  );
  `,
  // v2: app language ('system' follows the phone).
  `ALTER TABLE settings ADD COLUMN language TEXT DEFAULT 'system';`,
  // v3: goals can be "save up" or "pay down"; spoken reminders.
  `ALTER TABLE goals ADD COLUMN kind TEXT NOT NULL DEFAULT 'saving';
  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    due_at TEXT NOT NULL,
    repeat TEXT NOT NULL DEFAULT 'none',
    notification_id TEXT,
    created_at TEXT NOT NULL
  );`,
  // v4: optional app lock (biometrics / device passcode on open).
  `ALTER TABLE settings ADD COLUMN app_lock INTEGER DEFAULT 0;`,
  // v5: statement import (fingerprints to skip duplicates, import history) and debts for the pay-off plan.
  `ALTER TABLE transactions ADD COLUMN fingerprint TEXT;
  ALTER TABLE transactions ADD COLUMN import_id TEXT;
  CREATE INDEX IF NOT EXISTS idx_transactions_fingerprint ON transactions(fingerprint);
  CREATE TABLE IF NOT EXISTS imports (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    file_name TEXT NOT NULL,
    period_start TEXT,
    period_end TEXT,
    count INTEGER NOT NULL DEFAULT 0,
    imported_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS debts (
    id TEXT PRIMARY KEY,
    creditor TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'other',
    balance REAL NOT NULL DEFAULT 0,
    monthly_payment REAL,
    credit_limit REAL,
    apr REAL,
    source TEXT NOT NULL DEFAULT 'manual',
    updated_at TEXT NOT NULL
  );`,
  // v6: how answers to spoken questions are given (text, spoken, or spoken only when asked by voice).
  `ALTER TABLE settings ADD COLUMN answer_mode TEXT DEFAULT 'auto';`,
  // v7: the day of month a monthly rule was set on, so it returns to the 31st after a short month.
  `ALTER TABLE recurring_rules ADD COLUMN anchor_day INTEGER;`,
  // v8: budget by pay period, one overall plan, and what an unspent category plan does at period end
  // (with the answers given in "ask" mode, keyed by the period they apply to).
  `ALTER TABLE settings ADD COLUMN budget_period TEXT DEFAULT 'month';
  ALTER TABLE settings ADD COLUMN overall_limit REAL;
  ALTER TABLE categories ADD COLUMN rollover TEXT DEFAULT 'reset';
  ALTER TABLE categories ADD COLUMN rollover_since TEXT;
  CREATE TABLE IF NOT EXISTS carryovers (
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    period TEXT NOT NULL,
    amount REAL NOT NULL,
    PRIMARY KEY (category_id, period)
  );`,
  // v9: the voice that talks back after an entry, and how far it may go.
  `ALTER TABLE settings ADD COLUMN voice TEXT DEFAULT 'plain';
  ALTER TABLE settings ADD COLUMN attitude TEXT DEFAULT 'playful';`,
  // v10: male or female spoken voice.
  `ALTER TABLE settings ADD COLUMN voice_gender TEXT DEFAULT 'female';`,
  // v11: small app state that is not user data and not backed up (e.g. which voice lines were said recently).
  `CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY, value TEXT NOT NULL);`,
  // v12: accent colour family.
  `ALTER TABLE settings ADD COLUMN accent TEXT DEFAULT 'sage';`,
  // v13: how negotiable a category is, so the Budget screen can show where the money goes.
  // Existing categories are placed where they obviously belong; everything else sits in the middle.
  `ALTER TABLE categories ADD COLUMN tier TEXT;
  UPDATE categories SET tier = 'needs' WHERE id IN ('groceries', 'rent', 'utilities', 'transport', 'health', 'savings');
  UPDATE categories SET tier = 'obligations' WHERE id IN ('debt');
  UPDATE categories SET tier = 'wants' WHERE id IN ('dining', 'entertainment', 'shopping');
  UPDATE categories SET tier = 'comforts' WHERE id IN ('subscriptions', 'other_expense');`,
  // v14: the middle tier is gone. Three buckets match the 50/30/20 split people already know,
  // and none of them needs a sentence of explanation. "Other" is protected rather than called negotiable.
  `UPDATE categories SET tier = 'needs' WHERE tier = 'comforts' AND id = 'other_expense';
  UPDATE categories SET tier = 'wants' WHERE tier = 'comforts';`,
  // v15: what a goal started with, so money already saved before it was made is not read as a fast pace.
  `ALTER TABLE goals ADD COLUMN starting_amount REAL;`,
  // v16: the goal a transfer was added to, so fixing or removing that entry moves the goal's progress with it.
  `ALTER TABLE transactions ADD COLUMN goal_id TEXT;`,
];

async function migrate(db: DB): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  for (let i = version; i < MIGRATIONS.length; i += 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[i]);
      await db.execAsync(`PRAGMA user_version = ${i + 1}`);
    });
    version = i + 1;
  }
  await seedDefaultCategories(db);
}

async function seedDefaultCategories(db: DB): Promise<void> {
  const count = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM categories');
  if ((count?.n ?? 0) > 0) return;
  for (const c of DEFAULT_CATEGORIES) {
    // Seeding runs after every migration, so the tier column is always there to fill.
    await db.runAsync(
      'INSERT OR IGNORE INTO categories (id, name, icon, kind, monthly_limit, is_default, archived, sort_order, tier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [c.id, c.name, c.icon, c.kind, c.monthlyLimit, c.isDefault ? 1 : 0, c.archived ? 1 : 0, c.sortOrder, c.tier ?? null],
    );
  }
}

/**
 * Wipes every table and puts the settings row back to its defaults, so the app is
 * as it was on the day it was installed, onboarding included: the currency goes back
 * to a default, so it has to be asked again (a yen user would otherwise land on "$").
 */
export async function resetDatabase(db: DB): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM transactions; DELETE FROM recurring_rules; DELETE FROM goals; DELETE FROM keyword_mappings; DELETE FROM categories; DELETE FROM reminders; DELETE FROM imports; DELETE FROM debts; DELETE FROM carryovers; DELETE FROM app_state;');
    await db.execAsync("UPDATE settings SET currency='USD', theme='system', last_backup_at=NULL, starting_balance=NULL, reminder_enabled=0, reminder_hour=20, smart_parse_enabled=0, language='system', app_lock=0, answer_mode='auto', budget_period='month', overall_limit=NULL, voice='plain', attitude='playful', voice_gender='female', accent='sage', onboarding_done=0 WHERE id=1");
  });
  // Nothing erased may linger in the write-ahead log or in pages the file still holds.
  await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE); VACUUM;').catch(() => {});
  await seedDefaultCategories(db);
}
