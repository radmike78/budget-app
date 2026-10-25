/**
 * The app ships empty. Sample data exists only in the screenshot tooling under
 * scripts/, and it only ever enters a browser session through the backup
 * restore screen. These checks keep it that way.
 */
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';

const ROOT = path.resolve(__dirname, '..');
function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(rel));
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) out.push(rel);
  }
  return out;
}
const APP_SOURCES = [...sourceFiles('src'), ...sourceFiles('app')];
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

describe('no seeded information in the app', () => {
  it('app code never imports the screenshot or scenario scripts', () => {
    for (const f of APP_SOURCES) expect(read(f)).not.toMatch(/from\s+['"][^'"]*scripts\//);
  });
  it('app code carries none of the scenario markers', () => {
    for (const f of APP_SOURCES) {
      const src = read(f);
      expect(src).not.toMatch(/seed-\d|rule-pay|ui-scenario-shots|lib\/shots/);
    }
  });
  it('the database migrations create tables and default categories only, never entries', () => {
    const db = read('src/db/database.ts');
    const inserts = db.match(/INSERT[^;]*/gi) ?? [];
    for (const ins of inserts) expect(ins).toMatch(/INTO (categories|settings)\b/);
    expect(db).not.toMatch(/INTO (transactions|goals|recurring_rules|reminders|debts|imports|carryovers)\b/i);
  });
  it('default categories have no limits, roll-over or spending baked in', () => {
    for (const c of DEFAULT_CATEGORIES) {
      expect(c.monthlyLimit).toBeNull();
      expect(c.rollover ?? 'reset').toBe('reset');
      expect(c.rolloverSince ?? null).toBeNull();
    }
  });
  it('the shipped build steps do not run the UI tooling', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    for (const name of ['build:web', 'postinstall', 'android', 'ios', 'start']) {
      expect(pkg.scripts[name]).not.toMatch(/ui-(screenshots|walkthrough|scenario-shots|persona-shots|sweep-shots)|scripts\/lib\/shots/);
    }
  });
});

describe('release switches', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { SMART_ASSIST } = require('@/lib/features') as typeof import('@/lib/features');
  it('1.0 ships with Smart parsing held back, so no network feature is reachable and the privacy forms say nothing is collected', () => {
    expect(SMART_ASSIST).toBe(false);
    // The only call into the assist module, the Settings row and the About section all sit behind the flag.
    expect(read('src/components/useEntryFlow.ts')).toMatch(/if \(SMART_ASSIST && result\.needsReview && settings\?\.smartParseEnabled\)/);
    expect(read('app/(tabs)/settings.tsx')).toMatch(/\{SMART_ASSIST \? <ListItem title=\{t\.smartParse\}/);
    expect(read('app/settings/about.tsx')).toMatch(/\{SMART_ASSIST \? \(\s*<>\s*<SectionTitle>\{t\.smartSection\}/);
    expect(read('app/settings/smart.tsx')).toMatch(/if \(!SMART_ASSIST\) \{/);
    // The listing and the policy match the flag.
    expect(read('store/listing.md')).toMatch(/\*\*Data Not Collected\.\*\*/);
    expect(read('store/listing.md')).toMatch(/collect or share user data\? \*\*No\.\*\*/);
    expect(read('docs/PRIVACY.md')).toMatch(/switched off in the code\s+for this release/);
    expect(read('docs/PRIVACY.md')).not.toMatch(/api\.anthropic\.com/);
  });
  it('the locales no longer promise the Smart parsing exception in the About commitments', () => {
    for (const l of ['en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh']) {
      const src = read(`src/i18n/locales/${l}.ts`);
      const commitments = src.slice(src.indexOf('commitments: ['), src.indexOf('],', src.indexOf('commitments: [')));
      expect(commitments).not.toMatch(/Anthropic/);
    }
  });
});

describe('the free month and the purchase', () => {
  const walkTs = (dir: string): string[] => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walkTs(path.join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(dir, e.name)] : []));
  it('only the purchase module talks to the store, and the web build is never gated', () => {
    const importers = [...walkTs('src'), ...walkTs('app')].filter((f) => /from 'expo-iap'/.test(read(f)));
    expect(importers).toEqual(['src/lib/purchases.ts']);
    expect(read('src/lib/purchases.web.ts')).toMatch(/unlocked: true/);
  });
  it('erasing everything keeps the trial dates and the unlock', () => {
    expect(read('src/db/database.ts')).toMatch(/DELETE FROM app_state WHERE key NOT IN \('trial\.firstSeen', 'trial\.latestSeen', 'license\.unlocked'\)/);
  });
  it('after the month only adding is gated: the bar, new goals, new repeating entries, imports and new debts', () => {
    for (const f of ['app/(tabs)/index.tsx', 'app/goal/[id].tsx', 'app/recurring/[id].tsx', 'app/import/index.tsx', 'app/debts/index.tsx']) expect(read(f)).toMatch(/useAdding\(\)/);
    // Editing an entry, history, backups and the budget never ask.
    for (const f of ['app/entry/[id].tsx', 'app/(tabs)/history.tsx', 'app/settings/backup.tsx', 'app/(tabs)/budget.tsx']) expect(read(f)).not.toMatch(/useAdding|TrialEnded/);
  });
  it('the terms are stated before the trial is a day old, and the listing matches', () => {
    expect(read('app/onboarding.tsx')).toMatch(/t\.trialTerms/);
    expect(read('store/listing.md')).toMatch(/Free to install, with a 30-day trial/);
    expect(read('docs/PRIVACY.md')).toMatch(/## The purchase/);
  });
});
