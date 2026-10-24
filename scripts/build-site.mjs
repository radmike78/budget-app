/**
 * Packages the public pages for the company's GitHub Pages site, a separate public repository
 * (mradsoftware.github.io) that holds no source code, so the policy URL outlives any change to
 * this repository's name, owner or visibility.
 *
 *   npm run build:site     → out/site/
 *
 * Push the contents of out/site to the root of that repository. Its workflow turns Pages on and
 * publishes on every push, so the addresses are:
 *   https://mradsoftware.github.io/privacy.html   (the privacy policy, PRIVACY_URL in the app)
 *   https://mradsoftware.github.io/               (the support page, the stores' support URL)
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'out/site');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, '.github/workflows'), { recursive: true });

for (const f of ['privacy.html', 'support.html']) fs.copyFileSync(path.join(root, 'docs', f), path.join(out, f));
fs.copyFileSync(path.join(root, 'docs/support.html'), path.join(out, 'index.html'));
fs.writeFileSync(path.join(out, '.nojekyll'), '');
fs.writeFileSync(path.join(out, 'README.md'), '# mradsoftware.github.io\n\nPublic pages for MRAD Software Solutions LLC apps: privacy policies and support. Generated from the app repositories (`npm run build:site`); edit there, not here.\n');
fs.writeFileSync(path.join(out, '.github/workflows/pages.yml'), `name: Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
        with:
          enablement: true
      - uses: actions/upload-pages-artifact@v3
        with:
          path: .
      - id: deployment
        uses: actions/deploy-pages@v4
`);
console.log(`Wrote ${path.relative(root, out)}: ${fs.readdirSync(out).join(', ')} (+ .github/workflows/pages.yml)`);
