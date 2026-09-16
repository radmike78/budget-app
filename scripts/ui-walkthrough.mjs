/**
 * Drives the web build through the flows the screenshot script skips (edit, delete, category
 * correction, learned words, questions, goals, reminders, categories, repeating entries, search,
 * debts, PDF import, backup and restore, language and theme) and logs every console error, page
 * error and step outcome. Usage: npm run build:web && node scripts/ui-walkthrough.mjs dist out/walk
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const dist = path.resolve(process.argv[2] || 'dist');
const out = path.resolve(process.argv[3] || 'walk');
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

const browser = await playwright.chromium.launch({ headless: true });
const context = await browser.newContext({ ...devices['iPhone 15'], colorScheme: 'light', locale: 'en-US', acceptDownloads: true });
const page = await context.newPage();
const log = [];
const issues = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') issues.push(`console.${m.type()}: ${m.text().slice(0, 300)}`); });
page.on('pageerror', (e) => issues.push(`pageerror: ${String(e).slice(0, 300)}`));
page.on('dialog', (d) => { log.push(`dialog(${d.type()}): ${d.message().slice(0, 120)}`); d.accept(); });
let n = 0;
const shot = async (label) => { n += 1; await page.waitForTimeout(300); await page.screenshot({ path: path.join(out, `${String(n).padStart(2, '0')}-${label}.png`) }); };
const step = async (name, fn) => {
  try { await fn(); log.push(`ok   ${name}`); } catch (e) { log.push(`FAIL ${name}: ${String(e).split('\n')[0].slice(0, 200)}`); await shot(`fail-${name.replace(/[^a-z0-9]+/gi, '-')}`).catch(() => {}); }
};
const text = (t, exact = true) => page.getByText(t, { exact }).first();
const button = (name) => page.getByRole('button', { name }).first();
const goto = async (route) => { await page.goto(origin + route, { waitUntil: 'load' }); await page.waitForTimeout(700); };
const entry = async (t) => { const input = page.getByRole('textbox').first(); await input.click(); await input.fill(t); await page.keyboard.press('Enter'); await page.waitForTimeout(700); };
const bodyText = async () => (await page.locator('body').innerText()).replace(/\s+/g, ' ');
const expectText = async (t) => { const b = await bodyText(); if (!b.includes(t)) throw new Error(`expected "${t}" on screen`); };
const expectNoText = async (t) => { const b = await bodyText(); if (b.includes(t)) throw new Error(`did not expect "${t}" on screen`); };

await step('onboarding', async () => {
  await goto('/');
  await page.getByText('OnlyBudget').first().waitFor({ timeout: 30000 });
  await text('Next').click(); await text('Next').click(); await text('Start').click(); await page.waitForTimeout(600);
  await expectText('Nothing here yet');
});
await step('add and save an expense', async () => {
  await entry('spent 12 on lunch');
  await button(/^Save$/).click(); await page.waitForTimeout(600);
  await expectText('Lunch'); await expectText('$12');
});
await step('edit the entry amount and note', async () => {
  await text('Lunch').click(); await page.waitForTimeout(800);
  const boxes = page.getByRole('textbox');
  await boxes.nth(0).fill('15');
  await button(/Save changes/).click(); await page.waitForTimeout(800);
  await expectText('$15');
  await shot('after-edit');
});
await step('cancel on the confirmation card leaves nothing behind', async () => {
  await entry('coffee 4');
  await button(/^Cancel$/).click(); await page.waitForTimeout(400);
  await expectNoText('Coffee');
});
await step('delete the entry', async () => {
  await text('Lunch').click(); await page.waitForTimeout(800);
  await button(/Remove entry/).click(); await page.waitForTimeout(800);
  await expectNoText('Lunch');
});
await step('income and category correction', async () => {
  await entry('got paid 2400'); await button(/^Save$/).click(); await page.waitForTimeout(500);
  await entry('spent 40 at Blorp Emporium');
  await expectText('Not sure about the category');
  await page.getByRole('button', { name: /Other/ }).first().click(); await page.waitForTimeout(500);
  await page.getByText('Shopping', { exact: true }).last().click(); await page.waitForTimeout(400);
  await button(/^Save$/).click(); await page.waitForTimeout(600);
  await expectText('Blorp Emporium');
});
await step('learned word applies next time', async () => {
  await entry('blorp emporium 12');
  await expectText('Shopping');
  await button(/^Cancel$/).click();
});
await step('multi entry: remove one row then save', async () => {
  await entry('Spent $9.87 at Starbucks and $58 at Korean BBQ');
  await expectText('2 entries');
  await page.getByText('Remove', { exact: true }).nth(1).click(); await page.waitForTimeout(300);
  await button(/^Save$|^Save all$/).click(); await page.waitForTimeout(600);
  await expectText('Starbucks'); await expectNoText('Korean BBQ');
});
await step('question typed shows an answer card', async () => {
  await entry('how much have I spent this week on Starbucks?');
  await expectText("This week you've spent $9.87 on Starbucks");
  await shot('answer');
  await button(/^Done$/).click(); await page.waitForTimeout(300);
  await expectNoText("across 1 entry");
});
await step('question about a category and about nothing', async () => {
  await entry('how much did I spend dining out this month');
  await expectText('on Dining out');
  await button(/^Done$/).click();
  await entry('how much did I spend at Zizzle today');
  await expectText('Nothing logged for Zizzle today');
  await button(/^Done$/).click();
});
await step('goal, then contribution', async () => {
  await entry('goal: save 3000 for a trip to Japan by June');
  await button(/Set goal/).click(); await page.waitForTimeout(600);
  await expectText('Trip to Japan');
  await entry('add 100 to the trip goal');
  await shot('contribution-card');
  await button(/^Save$|^Add$/).click(); await page.waitForTimeout(700);
  await goto('/goals');
  await expectText('Trip to Japan');
  await shot('goals');
  const b = await bodyText();
  if (!/\$100/.test(b)) throw new Error('goal progress does not show $100: ' + b.slice(0, 300));
});
await step('goal editor: add money and remove goal', async () => {
  await text('Trip to Japan').click(); await page.waitForTimeout(800);
  await shot('goal-editor');
  const boxes = page.getByRole('textbox');
  await boxes.nth(0).fill('50');
  await button(/^Add$/).click(); await page.waitForTimeout(600);
  await expectText('$2,850 away');
  await button(/^Remove$/).click(); await page.waitForTimeout(800);
  await expectNoText('Trip to Japan');
});
await step('reminder saved and listed', async () => {
  await goto('/');
  await entry('remind me to pay rent on the 1st at 9am');
  await button(/Set reminder/).click(); await page.waitForTimeout(700);
  await goto('/settings/reminders');
  await expectText('Pay rent');
  await page.getByText('Remove', { exact: true }).first().click({ force: true }); await page.waitForTimeout(600);
  await expectNoText('Pay rent');
});
await step('new category with a limit, then archive and delete', async () => {
  await goto('/budget');
  await page.getByRole('button', { name: /^Add$/ }).first().click(); await page.waitForTimeout(800);
  const boxes = page.getByRole('textbox');
  await boxes.nth(0).fill('Pets'); await boxes.nth(1).fill('80');
  await button(/Add category/).click(); await page.waitForTimeout(800);
  await goto('/budget');
  await expectText('Pets');
  await shot('budget-with-pets');
  await text('Pets').click(); await page.waitForTimeout(800);
  await button(/^Delete$/).click(); await page.waitForTimeout(800);
  await goto('/budget');
  await expectNoText('Pets');
});
await step('repeating entry', async () => {
  await goto('/recurring/new');
  await shot('recurring-new');
  const boxes = page.getByRole('textbox');
  await boxes.nth(0).fill('15.49');
  await boxes.nth(1).fill('Netflix').catch(() => {});
  await button(/Start repeating/).click(); await page.waitForTimeout(800);
  await goto('/recurring');
  await expectText('Netflix');
  await shot('recurring-list');
});
await step('history search', async () => {
  await goto('/history');
  const box = page.getByRole('textbox').first();
  await box.fill('starbucks'); await page.waitForTimeout(600);
  await expectText('Starbucks'); await expectNoText('Salary');
  await box.fill('zzzz'); await page.waitForTimeout(600);
  await expectText('No entries match');
  await shot('history-search');
});
await step('debts: add, plan, edit, remove', async () => {
  await goto('/debts');
  await button(/Add a debt/).click(); await page.waitForTimeout(600);
  const boxes = page.getByRole('textbox');
  await boxes.nth(0).fill('Visa'); await boxes.nth(1).fill('2400'); await boxes.nth(2).fill('60'); await boxes.nth(3).fill('24');
  await button(/^Save$/).click(); await page.waitForTimeout(700);
  await expectText('Visa');
  await shot('debts');
  const b = await bodyText();
  if (!/month/i.test(b)) throw new Error('no pay-off plan text');
  await button(/^Remove$/).click(); await page.waitForTimeout(700);
  await expectText('No debts listed');
});
await step('import a statement PDF and review', async () => {
  await goto('/import');
  const [chooser] = await Promise.all([page.waitForEvent('filechooser', { timeout: 10000 }), button(/Choose a PDF/).click()]);
  await chooser.setFiles(path.resolve('__tests__/fixtures/bank.pdf'));
  await page.waitForTimeout(4000);
  await shot('import-review');
  const b = await bodyText();
  if (/\d{4}[- ]?\d{4}[- ]?\d{4}/.test(b) || /ending in \d/i.test(b)) throw new Error('an account or card number is visible on the review screen');
  await button(/^Add \d+ entries$/).click(); await page.waitForTimeout(1200);
  await shot('import-done');
  await goto('/history');
  await shot('history-after-import');
});
await step('backup export and restore', async () => {
  await goto('/settings/backup');
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), button(/Full backup/).click()]);
  const file = path.join(out, 'backup.json');
  await download.saveAs(file);
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  log.push(`backup has ${json.transactions?.length ?? '?'} transactions, ${json.categories?.length ?? '?'} categories, keys: ${Object.keys(json).join(',')}`);
  if (JSON.stringify(json).includes('apiKey') || JSON.stringify(json).includes('sk-ant')) throw new Error('backup contains a secret');
  if (!json.reminders || !json.debts) log.push('NOTE backup has no reminders/debts arrays');
  const [chooser] = await Promise.all([page.waitForEvent('filechooser', { timeout: 10000 }), button(/Restore from a backup file/).click()]);
  await chooser.setFiles(file);
  await page.waitForTimeout(2500);
  await shot('after-restore');
  await goto('/history');
  await expectText('Starbucks');
});
await step('encrypted backup with a short passphrase is refused', async () => {
  await goto('/settings/backup');
  await button(/Encrypted backup/).click(); await page.waitForTimeout(500);
  const boxes = page.getByRole('textbox');
  await boxes.nth(0).fill('short'); await boxes.nth(1).fill('short');
  await button(/Create encrypted backup/).click(); await page.waitForTimeout(500);
  await expectText('at least 8 characters');
  await shot('encrypted-short');
});
await step('switch language to Spanish and back', async () => {
  await goto('/settings');
  await text('Language').click(); await page.waitForTimeout(500);
  await text('Español').click(); await page.waitForTimeout(800);
  await shot('spanish-settings');
  await goto('/');
  await shot('spanish-today');
  const b = await bodyText();
  if (!/Hoy|Presupuesto|Ajustes/.test(b)) throw new Error('tabs not in Spanish');
  await goto('/settings');
  await text('Idioma').click(); await page.waitForTimeout(500);
  await text('English').click(); await page.waitForTimeout(800);
});
await step('dark theme and answer mode setting', async () => {
  await goto('/settings');
  await text('Dark').click(); await page.waitForTimeout(500);
  await shot('dark-settings');
  await text('Read aloud').click(); await page.waitForTimeout(300);
  await goto('/settings');
  await text('System').click(); await page.waitForTimeout(300);
});
await step('about, smart assist, learned words screens open', async () => {
  for (const r of ['/settings/about', '/settings/smart', '/settings/keywords']) { await goto(r); await shot(r.replace(/\//g, '_')); }
});
await step('budget month navigation', async () => {
  await goto('/budget');
  await page.getByRole('button', { name: /Previous month/ }).first().click(); await page.waitForTimeout(500);
  await shot('budget-prev-month');
  await expectText('August');
});

await context.close(); await browser.close(); server.close();
console.log(log.join('\n'));
console.log('--- issues (' + issues.length + ')');
console.log([...new Set(issues)].slice(0, 40).join('\n'));
