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
