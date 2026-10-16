/**
 * Loads the phone's PDF reader page (assets/pdf/extractor.html) in headless Chromium and reads the bank
 * statement fixture with it, twice: as is, and with Promise.withResolvers removed, as on iOS 16.4–17.3 and
 * Android WebView before 119. Both must read the statement.
 *
 *   node scripts/check-pdf-extractor.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { playwright } from './lib/shots.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = fs.readFileSync(path.join(root, 'assets/pdf/extractor.html'), 'utf8');
const pdf = fs.readFileSync(path.join(root, '__tests__/fixtures/bank.pdf')).toString('base64');
let failed = false;
for (const mode of ['current engine', 'older engine (no Promise.withResolvers)']) {
  const pre = `<script>window.ReactNativeWebView={postMessage:(s)=>console.log('RNWV '+s)};${mode.startsWith('older') ? 'delete Promise.withResolvers;' : ''}</script>`;
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  const msgs = [];
  page.on('console', (m) => { if (m.text().startsWith('RNWV ')) { try { msgs.push(JSON.parse(m.text().slice(5))); } catch { /* not ours */ } } });
  page.on('pageerror', (e) => msgs.push({ type: 'error', message: e.message }));
  await page.setContent(base.replace('<body>', `<body>${pre}`));
  await page.waitForTimeout(1500);
  await page.evaluate((b64) => { window.__ob.addChunk(b64); window.__ob.run(300); }, pdf);
  await page.waitForTimeout(6000);
  const done = msgs.find((m) => m.type === 'done');
  const ok = done && done.items.length > 10;
  if (!ok) failed = true;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${mode}: ${ok ? `${done.items.length} text items` : JSON.stringify(msgs).slice(0, 300)}`);
  await browser.close();
}
process.exit(failed ? 1 : 0);
