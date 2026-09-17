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
import path from 'node:path';
import { APP_NAME, PROFILES, playwright, restoreScenario, serve } from './lib/shots.mjs';

const dist = path.resolve(process.argv[2] || 'dist');
const out = path.resolve(process.argv[3] || 'scenario');
fs.mkdirSync(out, { recursive: true });
const { server, origin } = await serve(dist);

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
    await restoreScenario(page, { origin, out, name: profile.name });
    await goto('/'); await goto('/');
    await expectText('$55 less than your Dining out budget');
    await shot('1-today-pay-period');
    await goto('/budget');
    await expectText('of $1,200 plan');
    await shot('2-budget-period');
    await button(/Change the overall plan/).click(); await page.waitForTimeout(700);
    await shot('3-overall-plan-sheet');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    await goto('/category/groceries');
    await shot('4-category-rollover');
    await goto('/history');
    await text('90 days').click(); await page.waitForTimeout(600);
    await expectText("Trader Joe's");
    await shot('13-history');
    await goto('/settings');
    await shot('14-settings');
    await goto('/settings');
    await page.getByText('Budget period', { exact: false }).first().scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
    await shot('5-settings-budget-period');
    await goto('/');
    await button(/Add it to this period/).click(); await page.waitForTimeout(900);
    await goto('/budget');
    await expectText('$170 carried over'); await expectText('$55 carried over');
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
    // Accent colours and dark mode, on Today.
    for (const accent of ['Ocean', 'Plum', 'Clay']) {
      await goto('/settings');
      await page.getByRole('button', { name: accent, exact: true }).first().click(); await page.waitForTimeout(300);
      await goto('/');
      await shot(`9-today-${accent.toLowerCase()}`);
    }
    await goto('/settings');
    await page.getByRole('button', { name: 'Sage', exact: true }).first().click(); await page.waitForTimeout(200);
    await text('Dark').click(); await page.waitForTimeout(400);
    await goto('/');
    await shot('10-today-dark');
    await goto('/budget');
    await shot('11-budget-dark');
    await goto('/settings');
    await shot('12-settings-dark');
    await text('System').click(); await page.waitForTimeout(300);
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
