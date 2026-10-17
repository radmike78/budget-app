/**
 * Dependency audit for what actually ships. `npm audit --omit=dev` flags Expo's and Metro's build tooling,
 * which never reaches a phone; this exports the Android bundle with source maps and fails only when a package
 * with a high or critical advisory is in it. Tooling-only advisories are listed for information.
 *
 *   node scripts/audit-shipped.mjs
 */
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LEVELS = new Set(['high', 'critical']);

// 1. The advisories themselves (an entry whose `via` is only names is a dependant, not a vulnerable package).
const auditRun = spawnSync('npm', ['audit', '--omit=dev', '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
let audit;
try {
  audit = JSON.parse(auditRun.stdout);
} catch {
  console.error('npm audit produced no JSON:', auditRun.stderr.slice(0, 500));
  process.exit(2);
}
const flagged = Object.entries(audit.vulnerabilities ?? {})
  .filter(([, v]) => LEVELS.has(v.severity) && v.via.some((x) => typeof x === 'object'))
  .map(([name, v]) => ({ name, severity: v.severity, titles: v.via.filter((x) => typeof x === 'object').map((x) => x.title) }));

if (flagged.length === 0) {
  console.log('No high or critical advisories.');
  process.exit(0);
}

// 2. What the phone gets: every module in the Android bundle, by package name.
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'onlybudget-audit-'));
try {
  execSync(`npx expo export --platform android --source-maps --output-dir "${out}"`, { stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1' } });
  const shipped = new Set();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.map')) {
        for (const src of JSON.parse(fs.readFileSync(p, 'utf8')).sources ?? []) {
          const m = /node_modules\/((?:@[^/]+\/)?[^/]+)/.exec(src.replace(/\\/g, '/'));
          if (m) shipped.add(m[1]);
        }
      }
    }
  };
  walk(out);

  const inBundle = flagged.filter((f) => shipped.has(f.name));
  const toolingOnly = flagged.filter((f) => !shipped.has(f.name));
  for (const f of toolingOnly) console.log(`info  ${f.severity} ${f.name} (build tooling only): ${f.titles.join('; ')}`);
  for (const f of inBundle) console.error(`FAIL  ${f.severity} ${f.name} ships in the bundle: ${f.titles.join('; ')}`);
  console.log(`${shipped.size} packages in the Android bundle; ${inBundle.length} with a high or critical advisory.`);
  process.exit(inBundle.length ? 1 : 0);
} finally {
  fs.rmSync(out, { recursive: true, force: true });
}
