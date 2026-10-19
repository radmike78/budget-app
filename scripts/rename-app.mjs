/**
 * Rename the app everywhere in one go, before the first store upload (the Android package and the iOS bundle
 * identifier can never change once a build is on a store).
 *
 *   npm run rename -- "New Name" com.example.newname            # does it
 *   npm run rename -- "New Name" com.example.newname --dry-run  # only reports what would change
 *
 * It replaces, in every tracked text file:
 *   app.onlybudget  → the identifier given          (app.json bundleIdentifier and package)
 *   OnlyBudget      → the display name              (app.json, locale appName and sentences, docs, listing, manifest)
 *   onlybudget      → the slug of the new name      (app.json slug and scheme, file names, database name, deploy manifests)
 * then rebuilds docs/privacy.html. Backups made before the rename will not open afterwards (the format carries
 * the slug), which is fine before launch and the reason to do this now rather than later. Things no script can
 * decide are printed at the end for a human: the tagline, the store subtitle and keywords, the icon.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const [name, id] = args.filter((a) => !a.startsWith('--'));
if (!name || !id) {
  console.error('usage: npm run rename -- "New Name" com.example.newname [--dry-run]');
  process.exit(2);
}
if (!/^[A-Za-z][A-Za-z0-9 ]{1,29}$/.test(name)) {
  console.error('The name must be 2–30 letters, digits and spaces, starting with a letter (Apple allows 30 characters).');
  process.exit(2);
}
if (!/^[a-z][a-z0-9]*(\.[a-z][a-z0-9_]*)+$/.test(id)) {
  console.error('The identifier must look like com.example.appname: lower-case labels joined by dots, two at least.');
  process.exit(2);
}
const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
if (slug.length < 2) { console.error('The name needs at least two letters or digits for the slug.'); process.exit(2); }
if (name === 'OnlyBudget' && id === 'app.onlybudget') { console.log('Nothing to do: that is the current name.'); process.exit(0); }

const OLD = { id: 'app.onlybudget', name: 'OnlyBudget', slug: 'onlybudget' };
const NEW = { id, name, slug };
const SKIP = new Set(['docs/privacy.html']); // generated: rebuilt below
const BINARY = /\.(png|jpe?g|gif|webp|ico|ttf|otf|woff2?|wasm|pdf|zip|jar|keystore|p8|p12|mp3|mp4|db)$/i;

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);

// latin1 keeps every byte as it was (one test file holds raw control bytes on purpose); the new name may hold any
// character, so it is carried through as its UTF-8 bytes read the same way.
const asBytes = (s) => Buffer.from(s, 'utf8').toString('latin1');
const steps = [[OLD.id, asBytes(NEW.id)], [OLD.name, asBytes(NEW.name)], [OLD.slug, asBytes(NEW.slug)]];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let touched = 0;
let total = 0;
for (const rel of files) {
  if (SKIP.has(rel) || BINARY.test(rel)) continue;
  const abs = path.join(root, rel);
  if (!fs.statSync(abs).isFile()) continue;
  const before = fs.readFileSync(abs, 'latin1');
  let after = before;
  let n = 0;
  for (const [from, to] of steps) {
    after = after.replace(new RegExp(esc(from), 'g'), () => { n++; return to; });
  }
  if (n === 0) continue;
  touched++;
  total += n;
  console.log(`${dry ? 'would change' : 'changed'}  ${String(n).padStart(4)}  ${rel}`);
  if (!dry) fs.writeFileSync(abs, after, 'latin1');
}
console.log(`${total} replacements in ${touched} files${dry ? ' (dry run, nothing written)' : ''}.`);

if (!dry) {
  execFileSync('node', ['scripts/build-privacy.js'], { cwd: root, stdio: 'inherit' });
}

console.log(`
Now by hand:
  - The tagline "Only a budget. Nothing else." plays on the old name: \`tagline\` in src/i18n/locales/*.ts,
    the subtitle and description in store/listing.md, and public/manifest.webmanifest.
  - The icon (assets/icon.png and friends, public/icons) carries no text, but check it still suits the name.
  - Keywords in store/listing.md, and the title line of docs/PRIVACY.md if the publisher name differs.
  - Run: npm test && npm run typecheck && npm run build:web
  - A backup exported before the rename will not restore (its format carries the old slug); export a new one.
`);
