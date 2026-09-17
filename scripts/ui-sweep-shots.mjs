/**
 * Every screen, at phone and tablet size, in light and dark mode, with the
 * sample scenario plus a goal, a reminder, two debts, a keyword and a rent rule,
 * so nothing is empty. For looking at the whole app in one pass.
 *
 *   npm run build:web && node scripts/ui-sweep-shots.mjs dist out/sweep
 *
 * PROFILES (comma-separated) limits the devices; SCHEMES=light limits the modes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PROFILES, playwright, restoreScenario, seed, serve } from './lib/shots.mjs';

const dist = path.resolve(process.argv[2] || 'dist');
const out = path.resolve(process.argv[3] || 'sweep');
fs.mkdirSync(out, { recursive: true });
const { server, origin } = await serve(dist);
const SCHEMES = (process.env.SCHEMES || 'light,dark').split(',');

const pad = (n) => String(n).padStart(2, '0');
const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysFromToday = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return dateStr(d); };
const full = (base) => {
  const s = seed(base);
  return {
    ...s,
    goals: [
      { id: 'goal-japan', name: 'Trip to Japan', kind: 'saving', targetAmount: 3000, currentAmount: 1150, targetDate: daysFromToday(280), createdAt: `${daysFromToday(-60)}T12:00:00.000Z`, completed: false },
      { id: 'goal-card', name: 'Visa card', kind: 'debt', targetAmount: 1800, currentAmount: 600, targetDate: null, createdAt: `${daysFromToday(-30)}T12:00:00.000Z`, completed: false },
      { id: 'goal-bike', name: 'New bike', kind: 'saving', targetAmount: 400, currentAmount: 400, targetDate: null, createdAt: `${daysFromToday(-120)}T12:00:00.000Z`, completed: true },
    ],
    reminders: [{ id: 'rem-rent', text: 'Pay rent', date: daysFromToday(3), time: '09:00', repeat: 'monthly', notificationId: null, createdAt: `${daysFromToday(-10)}T12:00:00.000Z` }],
    debts: [
      { id: 'debt-visa', creditor: 'Chase Visa', type: 'credit_card', balance: 1800, monthlyPayment: 60, creditLimit: 5000, apr: 24.99, source: 'manual', updatedAt: `${daysFromToday(-2)}T12:00:00.000Z` },
      { id: 'debt-car', creditor: 'Toyota Financial', type: 'auto_loan', balance: 9400, monthlyPayment: 310, creditLimit: null, apr: 6.5, source: 'manual', updatedAt: `${daysFromToday(-2)}T12:00:00.000Z` },
    ],
    keywords: [{ word: 'costco', categoryId: 'groceries' }],
    recurringRules: [
      ...s.recurringRules,
      { id: 'rule-rent', amount: 1400, type: 'expense', categoryId: 'rent', frequency: 'monthly', nextOccurrence: daysFromToday(6), anchorDay: null, note: 'Rent', active: true },
      { id: 'rule-netflix', amount: 15.49, type: 'expense', categoryId: 'subscriptions', frequency: 'monthly', nextOccurrence: daysFromToday(12), anchorDay: null, note: 'Netflix', active: true },
    ],
  };
};

const ROUTES = [
  ['today', '/'], ['budget', '/budget'], ['goals', '/goals'], ['history', '/history'], ['settings', '/settings'],
  ['category', '/category/groceries'], ['entry', '/entry/seed-11'], ['goal', '/goal/goal-japan'], ['goal-debt', '/goal/goal-card'], ['goal-new', '/goal/new'],
  ['recurring', '/recurring'], ['recurring-rule', '/recurring/rule-rent'], ['debts', '/debts'], ['import', '/import'],
  ['settings-about', '/settings/about'], ['settings-backup', '/settings/backup'], ['settings-help', '/settings/help'], ['settings-keywords', '/settings/keywords'],
  ['settings-reminders', '/settings/reminders'], ['settings-smart', '/settings/smart'], ['settings-voice', '/settings/voice'],
];

const browser = await playwright.chromium.launch({ headless: true });
const log = [];
for (const profile of PROFILES) {
  for (const scheme of SCHEMES) {
    const context = await browser.newContext({ ...profile, colorScheme: scheme, locale: 'en-US', acceptDownloads: true });
    const page = await context.newPage();
    page.on('dialog', (d) => d.accept());
    const tag = `${profile.name}-${scheme}`;
    let n = 0;
    const shot = async (label) => { n += 1; await page.waitForTimeout(400); await page.screenshot({ path: path.join(out, `${tag}-${pad(n)}-${label}.png`) }); };
    const goto = async (route) => { await page.goto(origin + route, { waitUntil: 'load' }); await page.waitForTimeout(900); };
    const button = (name) => page.getByRole('button', { name }).first();
    const text = (t) => page.getByText(t, { exact: true }).first();
    try {
      await restoreScenario(page, { origin, out, name: tag, transform: full });
      await goto('/'); await goto('/');
      for (const [label, route] of ROUTES) { await goto(route); await shot(label); }
      // A few states that only exist mid-flow.
      await goto('/');
      const input = page.getByRole('textbox').first();
      await input.click(); await input.fill('spent 12.40 on lunch at the deli'); await page.keyboard.press('Enter'); await page.waitForTimeout(800);
      await shot('confirmation');
      await button(/^Save$/).click(); await page.waitForTimeout(900);
      await shot('after-save');
      await input.click(); await input.fill('coffee 4.50 and gas 40 and got paid 500'); await page.keyboard.press('Enter'); await page.waitForTimeout(800);
      await shot('multi-confirmation');
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      await goto('/');
      await text('Lunch at the deli').click(); await page.waitForTimeout(900);
      await button(/Remove entry/).click(); await page.waitForTimeout(700);
      await shot('undo-bar');
      await button(/^Undo$/).click(); await page.waitForTimeout(500);
      await goto('/budget');
      await button(/Change the overall plan/).click(); await page.waitForTimeout(700);
      await shot('overall-plan-sheet');
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      await goto('/history');
      await button(/Any category/).click(); await page.waitForTimeout(600);
      await shot('category-picker');
      log.push(`ok   ${tag} (${n} shots)`);
    } catch (e) {
      log.push(`FAIL ${tag}: ${String(e).split('\n')[0].slice(0, 200)}`);
      await shot('99-error').catch(() => {});
    }
    await context.close();
  }
}
await browser.close(); server.close();
console.log(log.join('\n'));
if (log.some((l) => l.startsWith('FAIL'))) process.exitCode = 1;
