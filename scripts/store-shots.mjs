/**
 * Draft store screenshots: eight captioned frames at Apple's 6.9-inch size
 * (1320×2868), the same eight at Google's phone size (1080×1920), and Google's
 * feature graphic (1024×500). The app screens are captured from the web build
 * with the sample data loaded, then placed in a frame with a caption.
 *
 *   npm run build:web && node scripts/store-shots.mjs dist out/store
 *
 * These are drafts for deciding what the listing says and shows. The frames
 * submitted to the stores should hold screens captured on a device, since the
 * web build has no status bar and draws text with the browser's fonts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fullScenario, playwright, restoreScenario, serve } from './lib/shots.mjs';

/** The full sample plus a card payment this period, so the Debts total is not an empty row. */
const storeScenario = (base) => {
  const s = fullScenario(base);
  const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - 2);
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { ...s, transactions: [...s.transactions, { id: 'store-visa', amount: 120, type: 'expense', categoryId: 'debt', note: 'Visa payment', rawInput: null, occurredAt: day, createdAt: `${day}T12:00:00.000Z`, isRecurringInstance: false, recurringRuleId: null, fingerprint: null, importId: null }] };
};

const dist = path.resolve(process.argv[2] || 'dist');
const out = path.resolve(process.argv[3] || 'out/store');
for (const d of ['raw', 'apple', 'google']) fs.mkdirSync(path.join(out, d), { recursive: true });
const { server, origin } = await serve(dist);
const FONT = pathToFileURL(path.resolve('node_modules/@expo-google-fonts/fraunces/700Bold/Fraunces_700Bold.ttf')).href;

/** What each frame shows and says. The order is the listing order: the first three carry the page. */
const SCENES = [
  { id: '01-say', title: 'Just say it.', sub: 'It checks with you before anything is saved.' },
  { id: '02-today', title: 'One number: what’s left.', sub: 'Until payday, or until the month ends.' },
  { id: '03-multi', title: 'Three things, one sentence.', sub: 'Each becomes its own entry.' },
  { id: '04-ask', title: 'Ask what you spent.', sub: 'Answered in plain words, out loud if you like.' },
  { id: '05-split', title: 'Needs, debts and wants.', sub: 'See where it goes. Nothing is judged.' },
  { id: '06-goals', title: 'Goals with an honest pace.', sub: 'Saving up or paying down.' },
  { id: '07-debts', title: 'A plan to clear your debts.', sub: 'Smallest first or highest rate first, worked out.' },
  { id: '08-private', title: 'No bank linking. No account.', sub: 'Your money stays on your phone.' },
];

// ---------- 1. the app screens, at the 6.9-inch iPhone's point size ----------
const PHONE = { viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'light', locale: 'en-US', acceptDownloads: true };
const browser = await playwright.chromium.launch({ headless: true });
{
  const context = await browser.newContext(PHONE);
  const page = await context.newPage();
  page.on('dialog', (d) => d.accept());
  const goto = async (r) => { await page.goto(origin + r, { waitUntil: 'load' }); await page.waitForTimeout(1300); };
  const raw = (id) => path.join(out, 'raw', `${id}.png`);
  const shot = async (id) => { await page.evaluate(() => (document.activeElement instanceof HTMLElement ? document.activeElement.blur() : null)); await page.waitForTimeout(900); await page.screenshot({ path: raw(id), animations: 'disabled' }); console.log('  screen', id); };
  const say = async (text) => {
    await goto('/');
    const box = page.getByRole('textbox').first();
    await box.click(); await box.fill(text); await page.keyboard.press('Enter');
    await page.waitForTimeout(1200);
  };
  /** Brings a piece of text to the top of the screen's scroller, a little below the header. */
  const scrollTo = async (text, offset = 90) => {
    await page.getByText(text, { exact: false }).first().evaluate((el, off) => {
      let s = el.parentElement;
      while (s && !(['auto', 'scroll'].includes(getComputedStyle(s).overflowY) && s.scrollHeight > s.clientHeight)) s = s.parentElement;
      if (s) s.scrollTop += el.getBoundingClientRect().top - s.getBoundingClientRect().top - off;
    }, offset);
  };

  await restoreScenario(page, { origin, out: path.join(out, 'raw'), name: 'store', transform: storeScenario });
  // Answer last period's roll-over question, as anyone would on the first look, so Today reads cleanly.
  await goto('/');
  await page.getByRole('button', { name: /Add it to this period/ }).first().click().catch(() => {});
  await page.waitForTimeout(900);

  await say('coffee 6.50 at Blue Bottle');
  await shot('01-say');
  await page.getByRole('button', { name: /Cancel/ }).first().click(); await page.waitForTimeout(500);

  await goto('/');
  await shot('02-today');

  await say('lunch 12, parking 4 and 30 on a sweater');
  await shot('03-multi');
  await page.getByRole('button', { name: /Cancel/ }).first().click(); await page.waitForTimeout(500);

  await say('how much did I spend on groceries this month?');
  await shot('04-ask');

  await goto('/budget');
  await scrollTo('Where it goes', 110);
  await shot('05-split');

  await goto('/goals');
  await shot('06-goals');

  await goto('/debts');
  // A plan with something extra going in is the one worth showing.
  await page.getByPlaceholder('200').first().fill('200');
  await page.waitForTimeout(700);
  await scrollTo('Pay-off plan', 100);
  await shot('07-debts');

  await goto('/settings/about');
  await shot('08-private');
  await context.close();
}

// ---------- 2. the frames ----------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const frameHtml = ({ w, h, img, title, sub, phoneW, phoneTop, titleSize, subSize, padTop }) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Fraunces; src: url("${FONT}"); font-weight: 700; }
* { box-sizing: border-box; margin: 0; }
html, body { width: ${w}px; height: ${h}px; overflow: hidden; }
body { background: #3D6B5E; color: #FFFFFF; font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; position: relative; }
/* A faint lighter field behind the phone, so the frame has depth without a second colour. */
body::after { content: ""; position: absolute; left: 50%; top: ${phoneTop + 40}px; width: ${phoneW * 1.9}px; height: ${phoneW * 1.9}px; transform: translateX(-50%); border-radius: 50%; background: radial-gradient(closest-side, rgba(255,255,255,.10), rgba(255,255,255,0)); }
.copy { position: absolute; top: ${padTop}px; left: 0; right: 0; padding: 0 ${Math.round(w * 0.08)}px; text-align: center; z-index: 2; }
h1 { font-family: Fraunces, Georgia, serif; font-weight: 700; font-size: ${titleSize}px; line-height: 1.08; letter-spacing: -0.015em; text-wrap: balance; }
p { margin-top: ${Math.round(subSize * 0.7)}px; font-size: ${subSize}px; line-height: 1.35; color: rgba(255,255,255,.84); text-wrap: balance; }
.phone { position: absolute; z-index: 1; left: 50%; top: ${phoneTop}px; width: ${phoneW}px; transform: translateX(-50%); border: ${Math.round(phoneW * 0.028)}px solid #141412; border-radius: ${Math.round(phoneW * 0.15)}px; overflow: hidden; background: #F7F6F3; box-shadow: 0 ${Math.round(phoneW * 0.08)}px ${Math.round(phoneW * 0.2)}px rgba(10,24,20,.45); }
.phone img { display: block; width: 100%; height: auto; }
</style></head><body>
<div class="copy"><h1>${esc(title)}</h1><p>${esc(sub)}</p></div>
<div class="phone"><img src="${pathToFileURL(img).href}"></div>
</body></html>`;

const FORMATS = [
  // Apple 6.9-inch: 440×956 points at 3x is 1320×2868.
  { dir: 'apple', w: 440, h: 956, scale: 3, phoneW: 316, phoneTop: 232, titleSize: 40, subSize: 18, padTop: 62 },
  // Google phone: 360×640 at 3x is 1080×1920 (Play allows at most 2:1, so the iPhone frames cannot be reused).
  { dir: 'google', w: 360, h: 640, scale: 3, phoneW: 206, phoneTop: 168, titleSize: 29, subSize: 14, padTop: 40 },
];

for (const f of FORMATS) {
  const context = await browser.newContext({ viewport: { width: f.w, height: f.h }, deviceScaleFactor: f.scale });
  const page = await context.newPage();
  for (const s of SCENES) {
    const html = path.join(out, f.dir, `${s.id}.html`);
    fs.writeFileSync(html, frameHtml({ ...f, img: path.join(out, 'raw', `${s.id}.png`), title: s.title, sub: s.sub }));
    await page.goto(pathToFileURL(html).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(out, f.dir, `${s.id}.png`) });
    fs.unlinkSync(html);
  }
  console.log(`  ${f.dir}: ${SCENES.length} frames at ${f.w * f.scale}×${f.h * f.scale}`);
  await context.close();
}

// ---------- 3. Google's feature graphic, 1024×500 ----------
{
  const context = await browser.newContext({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const html = path.join(out, 'feature.html');
  fs.writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Fraunces; src: url("${FONT}"); font-weight: 700; }
* { box-sizing: border-box; margin: 0; }
html, body { width: 1024px; height: 500px; overflow: hidden; }
body { background: #3D6B5E; color: #FFFFFF; font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; position: relative; }
.copy { position: absolute; left: 76px; top: 0; bottom: 0; width: 560px; display: flex; flex-direction: column; justify-content: center; }
h1 { font-family: Fraunces, Georgia, serif; font-size: 78px; line-height: 1; letter-spacing: -0.02em; }
.tag { margin-top: 18px; font-family: Fraunces, Georgia, serif; font-size: 32px; line-height: 1.2; color: rgba(255,255,255,.92); }
.facts { margin-top: 30px; font-size: 19px; font-weight: 600; letter-spacing: .02em; color: rgba(255,255,255,.78); }
.phone { position: absolute; right: 92px; top: 46px; width: 250px; border: 7px solid #141412; border-radius: 38px; overflow: hidden; background: #F7F6F3; box-shadow: 0 24px 60px rgba(10,24,20,.45); }
.phone img { display: block; width: 100%; }
</style></head><body>
<div class="copy"><h1>OnlyBudget</h1><div class="tag">Just say what you spent.</div><div class="facts">No bank linking · No account · No subscription</div></div>
<div class="phone"><img src="${pathToFileURL(path.join(out, 'raw', '02-today.png')).href}"></div>
</body></html>`);
  await page.goto(pathToFileURL(html).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(out, 'google', 'feature-graphic.png') });
  fs.unlinkSync(html);
  console.log('  google: feature graphic at 1024×500');
  await context.close();
}

await browser.close();
server.close();
console.log(`\nDrafts in ${out}`);
