/**
 * Screenshots the budget-period, roll-over, overall-plan and undo screens with
 * a few months of realistic sample data, at phone and tablet sizes.
 *
 * The scenario is a biweekly salary, five earlier pay periods of groceries (so
 * Groceries carries $170 into the current period), a Dining out limit set to
 * "Ask me" with $55 left last period, an Entertainment limit that resets, and
 * an overall plan of $1,200. Dates are computed from today, so the numbers on
 * screen stay the same whenever it runs. The data goes in through the app's
 * own backup restore, so what you see is exactly what a real history produces.
 *
 *   npm run build:web && node scripts/ui-scenario-shots.mjs dist out/scenario
 *
 * APP_NAME (default OnlyBudget) is the text waited for on first load, and
 * PROFILES (comma-separated, e.g. iphone-15,ipad-landscape) limits the devices.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const dist = path.resolve(process.argv[2] || 'dist');
const out = path.resolve(process.argv[3] || 'scenario');
fs.mkdirSync(out, { recursive: true });
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
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
const origin = `http://127.0.0.1:${server.address().port}`;
let playwright;
try { playwright = createRequire(import.meta.url)('playwright'); } catch { playwright = createRequire(import.meta.url)(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const { devices } = playwright;

const APP_NAME = process.env.APP_NAME || 'OnlyBudget';
const ALL_PROFILES = [
  { name: 'iphone-15', ...devices['iPhone 15'] },
  { name: 'ipad-landscape', ...devices['iPad (gen 7) landscape'] },
];
const only = (process.env.PROFILES || '').split(',').map((s) => s.trim()).filter(Boolean);
const PROFILES = only.length ? ALL_PROFILES.filter((p) => only.includes(p.name)) : ALL_PROFILES;

// ---- the scenario, relative to today ----
const pad = (n) => String(n).padStart(2, '0');
const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysFromToday = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return dateStr(d); };
/** Payday k periods back from the next one: P(1) started the current period 5 days ago. */
const P = (k, plus = 0) => daysFromToday(9 - 14 * k + plus);
let n = 0;
const tx = (amount, type, categoryId, note, occurredAt, extra = {}) => ({ id: `seed-${++n}`, amount, type, categoryId, note, rawInput: null, occurredAt, createdAt: `${occurredAt}T12:00:00.000Z`, isRecurringInstance: false, recurringRuleId: null, fingerprint: null, importId: null, ...extra });
const pay = (k) => tx(2000, 'income', 'salary', 'Salary', P(k), { isRecurringInstance: true, recurringRuleId: 'rule-pay' });
function seed(base) {
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

const browser = await playwright.chromium.launch({ headless: true });
const log = [];
for (const profile of PROFILES) {
  const context = await browser.newContext({ ...profile, colorScheme: 'light', locale: 'en-US', acceptDownloads: true });
  const page = await context.newPage();
  page.on('dialog', (d) => d.accept());
  const shot = async (label) => { await page.waitForTimeout(400); await page.screenshot({ path: path.join(out, `${profile.name}-${label}.png`) }); };
  const goto = async (route) => { await page.goto(origin + route, { waitUntil: 'load' }); await page.waitForTimeout(900); };
  const button = (name) => page.getByRole('button', { name }).first();
  const text = (t) => page.getByText(t, { exact: true }).first();
  const expectText = async (t) => { const b = (await page.locator('body').innerText()).replace(/\s+/g, ' '); if (!b.includes(t)) throw new Error(`expected "${t}" on screen`); };
  try {
    await goto('/');
    await page.getByText(APP_NAME).first().waitFor({ timeout: 30000 });
    await text('Next').click(); await text('Next').click(); await text('Start').click(); await page.waitForTimeout(400);
    await page.getByText('No thanks', { exact: false }).first().click(); await page.waitForTimeout(600);
    // The app's own export gives the category list; the scenario is layered on top and restored.
    await goto('/settings/backup');
    const [download] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), button(/Full backup/).click()]);
    const file = path.join(out, `${profile.name}-seed.json`);
    await download.saveAs(file);
    fs.writeFileSync(file, JSON.stringify(seed(JSON.parse(fs.readFileSync(file, 'utf8')))));
    const [chooser] = await Promise.all([page.waitForEvent('filechooser', { timeout: 10000 }), button(/Restore from a backup file/).click()]);
    await chooser.setFiles(file);
    await page.waitForTimeout(2500);
    await goto('/'); await goto('/');
    await expectText('$55 left in Dining out');
    await shot('1-today-pay-period');
    await goto('/budget');
    await expectText('of your $1,200 plan');
    await shot('2-budget-period');
    await button(/Change the overall plan/).click(); await page.waitForTimeout(700);
    await shot('3-overall-plan-sheet');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    await goto('/category/groceries');
    await shot('4-category-rollover');
    await goto('/settings');
    await page.getByText('Budget period', { exact: false }).first().scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
    await shot('5-settings-budget-period');
    await goto('/');
    await button(/Carry it over/).click(); await page.waitForTimeout(900);
    await goto('/budget');
    await expectText('Includes $170 carried over'); await expectText('Includes $55 carried over');
    await shot('6-budget-after-carry');
    await goto('/');
    await text("Trader Joe's").click(); await page.waitForTimeout(900);
    await button(/Remove entry/).click(); await page.waitForTimeout(700);
    await expectText('Entry removed');
    await shot('7-undo-bar');
    await button(/^Undo$/).click(); await page.waitForTimeout(700);
    await goto('/budget');
    await page.getByRole('button', { name: /Previous period/ }).first().click(); await page.waitForTimeout(700);
    await shot('8-budget-previous-period');
    log.push(`ok   ${profile.name}`);
  } catch (e) {
    log.push(`FAIL ${profile.name}: ${String(e).split('\n')[0].slice(0, 200)}`);
    await shot('99-error').catch(() => {});
  }
  await context.close();
}
await browser.close(); server.close();
console.log(log.join('\n'));
if (log.some((l) => l.startsWith('FAIL'))) process.exitCode = 1;
