/**
 * Every screen and every state the app can be in, captured whole (the viewport
 * grows to the content, so nothing is cut off) at phone width, for reviewing the
 * app end to end.
 *
 *   npm run build:web && node scripts/ui-gallery.mjs dist out/gallery
 */
import fs from 'node:fs';
import path from 'node:path';
import { fullScenario as full, playwright, restoreScenario, serve } from './lib/shots.mjs';

const dist = path.resolve(process.argv[2] || 'dist');
const out = path.resolve(process.argv[3] || 'out/gallery');
fs.mkdirSync(path.join(out, 'img'), { recursive: true });
const { server, origin } = await serve(dist);

const PHONE = { viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const MAX_H = 2400;

const browser = await playwright.chromium.launch({ headless: true });
const shots = [];

async function grow(page) {
  // The app lives in a scroller, so the page itself never grows: measure the tallest
  // scroller and make the window that tall, so one frame holds the whole screen.
  const need = await page.evaluate(() => {
    let most = 0;
    for (const el of document.querySelectorAll('div')) {
      const s = getComputedStyle(el);
      if ((s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > most) most = el.scrollHeight;
    }
    return Math.max(most, document.body.scrollHeight);
  });
  const h = Math.min(Math.max(852, need + 120), MAX_H);
  await page.setViewportSize({ width: 393, height: h });
  await page.waitForTimeout(700);
}

async function capture(page, name, label, section) {
  await grow(page);
  const file = `img/${name}.png`;
  await page.screenshot({ path: path.join(out, file), animations: 'disabled' });
  shots.push({ file, name, label, section });
  await page.setViewportSize({ width: 393, height: 852 });
  await page.waitForTimeout(300);
  console.log('  ', name);
}

const run = async (scheme, fn) => {
  const context = await browser.newContext({ ...PHONE, colorScheme: scheme, locale: 'en-US', acceptDownloads: true });
  const page = await context.newPage();
  page.on('dialog', (d) => d.accept());
  await fn(page);
  await context.close();
};

// ---------- 1. first run, with nothing in it ----------
console.log('first run');
await run('light', async (page) => {
  const goto = async (r) => { await page.goto(origin + r, { waitUntil: 'load' }); await page.waitForTimeout(1100); };
  await goto('/');
  await page.getByText('OnlyBudget').first().waitFor({ timeout: 30000 });
  await capture(page, 'onboard-1', 'Welcome', 'First run');
  await page.getByText('Next', { exact: true }).first().click(); await page.waitForTimeout(600);
  await capture(page, 'onboard-2', 'What it does', 'First run');
  await page.getByText('Next', { exact: true }).first().click(); await page.waitForTimeout(600);
  await capture(page, 'onboard-3', 'Your money stays here', 'First run');
  await page.getByText('Start', { exact: true }).first().click(); await page.waitForTimeout(700);
  await capture(page, 'onboard-4', 'Want a voice?', 'First run');
  await page.getByText('No thanks', { exact: false }).first().click(); await page.waitForTimeout(900);
  await capture(page, 'empty-today', 'Today, empty', 'First run');
  await goto('/budget'); await capture(page, 'empty-budget', 'Budget, empty', 'First run');
  await goto('/goals'); await capture(page, 'empty-goals', 'Goals, empty', 'First run');
  await goto('/history'); await capture(page, 'empty-history', 'History, empty', 'First run');
});

// ---------- 2. every screen, with a few months of history ----------
const ROUTES = [
  ['today', '/', 'Today', 'The five tabs'],
  ['budget', '/budget', 'Budget', 'The five tabs'],
  ['goals', '/goals', 'Goals', 'The five tabs'],
  ['history', '/history', 'History', 'The five tabs'],
  ['settings', '/settings', 'Settings', 'The five tabs'],
  ['category', '/category/groceries', 'A category, with a plan and roll-over', 'Editors'],
  ['category-new', '/category/new?kind=expense', 'A new category', 'Editors'],
  ['entry', '/entry/seed-11', 'An entry', 'Editors'],
  ['goal-saving', '/goal/goal-japan', 'A savings goal', 'Editors'],
  ['goal-debt', '/goal/goal-card', 'A debt goal', 'Editors'],
  ['recurring-list', '/recurring', 'Repeating entries', 'Editors'],
  ['recurring-rule', '/recurring/rule-rent', 'A repeating entry', 'Editors'],
  ['debts', '/debts', 'Debts and the pay-off plan', 'Money tools'],
  ['import', '/import', 'Import a statement', 'Money tools'],
  ['settings-backup', '/settings/backup', 'Backup & export', 'Settings'],
  ['settings-reminders', '/settings/reminders', 'Reminders', 'Settings'],
  ['settings-keywords', '/settings/keywords', 'Learned words', 'Settings'],
  ['settings-voice', '/settings/voice', 'Voice', 'Settings'],
  ['settings-smart', '/settings/smart', 'Smart assist', 'Settings'],
  ['settings-help', '/settings/help', 'Help', 'Settings'],
  ['settings-about', '/settings/about', 'About', 'Settings'],
];

console.log('full app');
await run('light', async (page) => {
  const goto = async (r) => { await page.goto(origin + r, { waitUntil: 'load' }); await page.waitForTimeout(1100); };
  await restoreScenario(page, { origin, out, name: 'gallery', transform: full });
  for (const [name, route, label, section] of ROUTES) {
    await goto(route);
    await capture(page, name, label, section);
  }

  // ---------- 3. the states you only reach by using it ----------
  const entry = async (text) => {
    await goto('/');
    const box = page.getByRole('textbox').first();
    await box.click(); await box.fill(text); await page.keyboard.press('Enter');
    await page.waitForTimeout(1100);
  };
  await entry('spent 14.20 at Blue Bottle');
  await capture(page, 'state-confirm', 'What it understood, before anything is saved', 'Using it');
  await page.getByRole('button', { name: /^Save$/ }).first().click(); await page.waitForTimeout(1200);
  await capture(page, 'state-saved', 'Saved, with a line from the voice', 'Using it');

  await entry('lunch 12, parking 4 and 30 on a sweater');
  await capture(page, 'state-multi', 'Three things in one sentence', 'Using it');
  await page.getByRole('button', { name: /Cancel/ }).first().click(); await page.waitForTimeout(600);

  await entry('how much have I spent this week on Starbucks?');
  await capture(page, 'state-question', 'A question, answered and never saved', 'Using it');

  await entry('remind me to pay rent on the 1st at 9am');
  await capture(page, 'state-reminder', 'A reminder', 'Using it');
  await page.getByRole('button', { name: /Cancel/ }).first().click(); await page.waitForTimeout(600);

  await entry('save 2000 for a new laptop by December');
  await capture(page, 'state-goal', 'A goal', 'Using it');
  await page.getByRole('button', { name: /Cancel/ }).first().click(); await page.waitForTimeout(600);

  await entry('switch to the roaster and make it spicy');
  await capture(page, 'state-command', 'Changing the voice by talking', 'Using it');

  await goto('/budget');
  await page.getByRole('button', { name: /overall plan/i }).first().click(); await page.waitForTimeout(800);
  await capture(page, 'state-overall', 'Setting one plan for everything', 'Using it');
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);

  await goto('/history');
  await page.getByText('All time', { exact: true }).first().click(); await page.waitForTimeout(900);
  await capture(page, 'state-history-all', 'History, all of it', 'Using it');
});

// ---------- 4. dark mode ----------
console.log('dark');
await run('dark', async (page) => {
  const goto = async (r) => { await page.goto(origin + r, { waitUntil: 'load' }); await page.waitForTimeout(1100); };
  await restoreScenario(page, { origin, out, name: 'gallery-dark', transform: full });
  for (const [name, route, label] of [
    ['dark-today', '/', 'Today'],
    ['dark-budget', '/budget', 'Budget'],
    ['dark-goals', '/goals', 'Goals'],
    ['dark-history', '/history', 'History'],
    ['dark-settings', '/settings', 'Settings'],
    ['dark-debts', '/debts', 'Debts'],
  ]) {
    await goto(route);
    await capture(page, name, label, 'Dark mode');
  }
});

await browser.close();
server.close();
fs.writeFileSync(path.join(out, 'shots.json'), JSON.stringify(shots, null, 2));
console.log(`\n${shots.length} screens -> ${out}`);
