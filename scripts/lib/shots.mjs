/**
 * Shared pieces of the screenshot scripts: a static server for the web build with
 * the COOP/COEP headers, Playwright lookup, device profiles, and the sample
 * scenario that goes in through the app's own backup restore.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

export const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
/** Serves a web build with the COOP/COEP headers the SQLite worker needs. Returns { server, origin }. */
export async function serve(dist) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let file = path.join(dist, decodeURIComponent(url.pathname));
    if (!file.startsWith(dist)) { res.writeHead(403); res.end(); return; }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}

export function loadPlaywright() {
  try { return createRequire(import.meta.url)('playwright'); } catch { return createRequire(import.meta.url)(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
}
export const playwright = loadPlaywright();
const { devices } = playwright;

export const APP_NAME = process.env.APP_NAME || 'OnlyBudget';
export const ALL_PROFILES = [
  { name: 'iphone-15', ...devices['iPhone 15'] },
  { name: 'ipad-landscape', ...devices['iPad (gen 7) landscape'] },
];
const only = (process.env.PROFILES || '').split(',').map((s) => s.trim()).filter(Boolean);
export const PROFILES = only.length ? ALL_PROFILES.filter((p) => only.includes(p.name)) : ALL_PROFILES;

// ---- the sample scenario, relative to today ----
const pad = (n) => String(n).padStart(2, '0');
const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysFromToday = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return dateStr(d); };
/** Payday k periods back from the next one: P(1) started the current period 5 days ago. */
const P = (k, plus = 0) => daysFromToday(9 - 14 * k + plus);
let n = 0;
const tx = (amount, type, categoryId, note, occurredAt, extra = {}) => ({ id: `seed-${++n}`, amount, type, categoryId, note, rawInput: null, occurredAt, createdAt: `${occurredAt}T12:00:00.000Z`, isRecurringInstance: false, recurringRuleId: null, fingerprint: null, importId: null, ...extra });
const pay = (k) => tx(2000, 'income', 'salary', 'Salary', P(k), { isRecurringInstance: true, recurringRuleId: 'rule-pay' });
export function seed(base) {
  const categories = base.categories.map((c) => {
    if (c.id === 'groceries') return { ...c, monthlyLimit: 300, rollover: 'carry', rolloverSince: P(6) };
    if (c.id === 'dining') return { ...c, monthlyLimit: 150, rollover: 'ask', rolloverSince: P(2) };
    if (c.id === 'entertainment') return { ...c, monthlyLimit: 60, rollover: 'reset', rolloverSince: null };
    return c;
  });
  const transactions = [
    pay(1), pay(2), pay(3),
    // Groceries, oldest period first: 250, 280, 300, 240, 260 of a 300 plan -> $170 carried into today's period.
    tx(120.4, 'expense', 'groceries', 'Groceries', P(6, 3)), tx(129.6, 'expense', 'groceries', 'Groceries', P(6, 10)),
    tx(140, 'expense', 'groceries', 'Groceries', P(5, 2)), tx(140, 'expense', 'groceries', 'Groceries', P(5, 9)),
    tx(160, 'expense', 'groceries', 'Costco', P(4, 1)), tx(140, 'expense', 'groceries', 'Groceries', P(4, 8)),
    tx(110, 'expense', 'groceries', 'Groceries', P(3, 2)), tx(130, 'expense', 'groceries', 'Groceries', P(3, 9)),
    tx(130, 'expense', 'groceries', 'Groceries', P(2, 4)), tx(130, 'expense', 'groceries', 'Groceries', P(2, 11)),
    tx(84.2, 'expense', 'groceries', "Trader Joe's", P(1, 2)),
    // Dining out: 95 of 150 last period -> the app asks about the $55 left.
    tx(58, 'expense', 'dining', 'Korean BBQ', P(2, 5)), tx(37, 'expense', 'dining', 'Pizza night', P(2, 9)),
    tx(9.87, 'expense', 'dining', 'Starbucks', P(1, 1)), tx(24.5, 'expense', 'dining', 'Lunch', P(1, 4)),
    tx(32, 'expense', 'entertainment', 'Movie tickets', P(1, 3)),
    tx(40, 'expense', 'transport', 'Gas', P(1, 2)),
    tx(96.4, 'expense', 'utilities', 'Electric bill', P(1, 1)),
    tx(1400, 'expense', 'rent', 'Rent', P(2, 4)),
  ];
  return {
    ...base,
    settings: { ...base.settings, currency: 'USD', budgetPeriod: 'pay', overallLimit: 1200, startingBalance: null },
    categories,
    transactions,
    recurringRules: [{ id: 'rule-pay', amount: 2000, type: 'income', categoryId: 'salary', frequency: 'biweekly', nextOccurrence: P(0), anchorDay: null, note: 'Salary', active: true }],
    goals: [], keywords: [], reminders: [], debts: [], imports: [], carryovers: [],
  };
}


/**
 * Runs onboarding without a voice (unless `onboarded`), exports the app's own empty backup, layers the
 * scenario on top and restores it, so the session has exactly what a real history produces.
 */
export async function restoreScenario(page, { origin, out, name, transform = seed, onboarded = false }) {
  const goto = async (route) => { await page.goto(origin + route, { waitUntil: 'load' }); await page.waitForTimeout(900); };
  const text = (t) => page.getByText(t, { exact: true }).first();
  const button = (n) => page.getByRole('button', { name: n }).first();
  if (!onboarded) {
    await goto('/');
    await page.getByText(APP_NAME).first().waitFor({ timeout: 30000 });
    await text('Next').click(); await text('Next').click(); await text('Start').click(); await page.waitForTimeout(400);
    await page.getByText('No thanks', { exact: false }).first().click(); await page.waitForTimeout(600);
  }
  await goto('/settings/backup');
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), button(/Full backup/).click()]);
  const file = path.join(out, `${name}-seed.json`);
  await download.saveAs(file);
  fs.writeFileSync(file, JSON.stringify(transform(JSON.parse(fs.readFileSync(file, 'utf8')))));
  const [chooser] = await Promise.all([page.waitForEvent('filechooser', { timeout: 10000 }), button(/Restore from a backup file/).click()]);
  await chooser.setFiles(file);
  await page.waitForTimeout(2500);
}
