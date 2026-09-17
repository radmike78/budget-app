/**
 * Screenshots a voice in use: the onboarding question, the pick, and what each
 * voice says after an entry on the Today tab, with the sample scenario loaded so
 * category plans exist. Also the rules that keep it kind: nothing about rent,
 * nothing spicy about a big amount, nothing at all from the plain voice.
 *
 *   npm run build:web && node scripts/ui-persona-shots.mjs dist out/persona
 *
 * The lines themselves are picked by the app (no line repeats within 24), so
 * the words differ from run to run; the situations do not.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ALL_PROFILES, APP_NAME, playwright, restoreScenario, seed, serve } from './lib/shots.mjs';

const dist = path.resolve(process.argv[2] || 'dist');
const out = path.resolve(process.argv[3] || 'persona');
fs.mkdirSync(out, { recursive: true });
const { server, origin } = await serve(dist);
const profile = ALL_PROFILES[0];

const browser = await playwright.chromium.launch({ headless: true });
const context = await browser.newContext({ ...profile, colorScheme: 'light', locale: 'en-US', acceptDownloads: true });
const page = await context.newPage();
page.on('dialog', (d) => d.accept());
let n = 0;
const shot = async (label) => { n += 1; await page.waitForTimeout(400); await page.screenshot({ path: path.join(out, `${String(n).padStart(2, '0')}-${label}.png`) }); };
const goto = async (route) => { await page.goto(origin + route, { waitUntil: 'load' }); await page.waitForTimeout(900); };
const button = (name) => page.getByRole('button', { name }).first();
const text = (t) => page.getByText(t, { exact: true }).first();
const bodyText = async () => (await page.locator('body').innerText()).replace(/\s+/g, ' ');
const expectText = async (t) => { if (!(await bodyText()).includes(t)) throw new Error(`expected "${t}" on screen`); };
const entry = async (t) => { const input = page.getByRole('textbox').first(); await input.click(); await input.fill(t); await page.keyboard.press('Enter'); await page.waitForTimeout(700); };
const save = async (t) => { await entry(t); await button(/^Save$/).click(); await page.waitForTimeout(900); };
const line = () => page.getByTestId('persona-line').first();
const expectLine = async () => { await line().waitFor({ timeout: 3000 }); };
const expectSilence = async () => { if (await line().count()) throw new Error('the voice spoke when it should not have'); };
const pick = async (voice, attitude) => {
  await goto('/settings/voice');
  await page.getByRole('button', { name: new RegExp(`^${voice}`) }).first().click(); await page.waitForTimeout(300);
  if (attitude) { await text(attitude).click(); await page.waitForTimeout(300); }
};

const log = [];
try {
  // Onboarding asks once.
  await goto('/');
  await page.getByText(APP_NAME).first().waitFor({ timeout: 30000 });
  await text('Next').click(); await text('Next').click(); await text('Start').click(); await page.waitForTimeout(500);
  await expectText('Want a voice that talks back?');
  await shot('onboarding-question');
  await text('Yes, let me pick').click(); await page.waitForTimeout(600);
  await page.getByRole('button', { name: /^Friend/ }).first().click(); await page.waitForTimeout(300);
  await expectText('Hear it');
  await shot('onboarding-pick');
  await button(/^Done$/).click(); await page.waitForTimeout(800);

  // Load the sample months so category plans exist. The overall plan is raised so the
  // entries below stay under it: past a plan every voice goes quiet, which is its own rule.
  const roomy = (base) => { const s = seed(base); return { ...s, settings: { ...s.settings, overallLimit: 3000 } }; };
  await restoreScenario(page, { origin, out, name: profile.name, onboarded: true, transform: roomy });
  await goto('/'); await goto('/');
  await button(/Add it to this period/).click(); await page.waitForTimeout(600);

  // Friend, playful: coffee, then a restaurant with a plan.
  await pick('Friend', 'Playful');
  await shot('voice-friend');
  await goto('/');
  await save('spent 6.50 at Starbucks');
  await expectLine();
  await shot('friend-coffee');
  await save('dinner 48 at the thai place');
  await expectLine();
  await shot('friend-dinner');

  // Switch by talking: the coach greets at once.
  await entry('switch to the coach');
  await expectText('Voice: Coach');
  await shot('command-coach');
  await button(/^Done$/).click(); await page.waitForTimeout(300);
  await save('netflix 15.49');
  await expectLine();
  await shot('coach-subscription');
  await save('spent 35 on shoes');
  await expectLine();
  await shot('coach-shoes');

  // Roaster, spicy: delivery gets teased; rent never; a big amount is always met kindly.
  await entry('switch to the roaster and make it spicy');
  await expectText('Voice: Roaster · Spicy');
  await shot('command-roaster');
  await button(/^Done$/).click(); await page.waitForTimeout(300);
  await save('doordash 32');
  await expectLine();
  await shot('roaster-delivery');
  await save('rent 1400');
  await expectSilence();
  await shot('roaster-rent-silent');
  await save('spent 900 on a laptop');
  await expectLine();
  await shot('roaster-big-amount');

  // A question is answered in the same card, in plain words.
  await goto('/');
  await entry('how much have I spent this week at Starbucks?');
  await expectText('Starbucks');
  await shot('question-answer');
  await button(/^Done$/).click(); await page.waitForTimeout(300);

  // Back to plain: a greeting, then nothing more.
  await entry('plain voice');
  await expectText('Voice: Plain');
  await shot('command-plain');
  await button(/^Done$/).click(); await page.waitForTimeout(300);
  await save('spent 5 at Starbucks');
  await expectSilence();
  await shot('plain-silent');

  // Dark mode with the roaster, for the record.
  await goto('/settings');
  await text('Dark').click(); await page.waitForTimeout(400);
  await pick('Roaster', 'Playful');
  await goto('/');
  await save('movie tickets 28');
  await expectLine();
  await shot('roaster-dark');
  await goto('/settings');
  await text('System').click(); await page.waitForTimeout(300);
  log.push(`ok   persona (${n} shots)`);
} catch (e) {
  log.push(`FAIL persona: ${String(e).split('\n')[0].slice(0, 200)}`);
  await shot('99-error').catch(() => {});
}
await context.close();
await browser.close(); server.close();
console.log(log.join('\n'));
if (log.some((l) => l.startsWith('FAIL'))) process.exitCode = 1;
