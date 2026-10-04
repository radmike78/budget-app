/**
 * Renders docs/PRIVACY.md into docs/privacy.html, a single self-contained page
 * with no external requests, so it can be hosted anywhere (GitHub Pages, any
 * static host) as the privacy-policy URL both stores ask for.
 *
 *   node scripts/build-privacy.js
 *
 * The Markdown file is the source. Edit that, never the HTML.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'docs/PRIVACY.md');
const OUT = path.join(ROOT, 'docs/privacy.html');

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Inline Markdown: code first, so nothing inside a span is formatted twice. */
function inline(text) {
  const code = [];
  let s = text.replace(/`([^`]+)`/g, (_m, c) => `\u0000${code.push(`<code>${escapeHtml(c)}</code>`) - 1}\u0000`);
  s = escapeHtml(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // A line the publisher still has to fill in is marked so it cannot be missed.
  s = s.replace(/\[([A-Z][A-Z \-]+)\]/g, '<mark>[$1]</mark>');
  return s.replace(/\u0000(\d+)\u0000/g, (_m, i) => code[Number(i)]);
}

function render(md) {
  const out = [];
  const lines = md.split('\n');
  let list = null;
  let para = [];

  const flushPara = () => {
    if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; }
  };
  const flushList = () => {
    if (list) { out.push(`<ul>\n${list.map((li) => `  <li>${inline(li)}</li>`).join('\n')}\n</ul>`); list = null; }
  };
  const flush = () => { flushPara(); flushList(); };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) { flush(); continue; }
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flush();
      const level = heading[1].length;
      const text = inline(heading[2]);
      const id = heading[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      out.push(level === 1 ? `<h1>${text}</h1>` : `<h${level} id="${id}">${text}</h${level}>`);
      continue;
    }
    if (/^---+$/.test(line)) { flush(); out.push('<hr>'); continue; }
    const item = line.match(/^[-*]\s+(.*)$/);
    if (item) { flushPara(); (list ??= []).push(item[1]); continue; }
    // A wrapped continuation of the list item above it.
    if (list && /^\s{2,}\S/.test(raw)) { list[list.length - 1] += ` ${line.trim()}`; continue; }
    flushList();
    para.push(line.trim());
  }
  flush();
  return out.join('\n');
}

const md = fs.readFileSync(SRC, 'utf8');
const title = (md.match(/^#\s+(.*)$/m) || [, 'Privacy Policy'])[1];
const body = render(md);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="index, follow">
<title>${escapeHtml(title)}</title>
<meta name="description" content="How OnlyBudget handles your data: it stays on your phone. No account, no server, no analytics, no bank linking.">
<style>
:root {
  --bg: #F7F6F3; --panel: #FFFFFF; --line: #E1DED8;
  --ink: #1F1F1D; --ink-soft: #5F5E5A; --ink-faint: #85837E;
  --accent: #3D6B5E; --accent-soft: #E3EEEA; --accent-ink: #2D5248;
  --mark: #F4ECDE; --mark-ink: #6B5222;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #141412; --panel: #1F1F1C; --line: #32322D;
    --ink: #EDEBE6; --ink-soft: #B5B3AA; --ink-faint: #8E8D86;
    --accent: #7FB3A2; --accent-soft: #23342E; --accent-ink: #9AC7B8;
    --mark: #3A2F18; --mark-ink: #E4C98E;
    color-scheme: dark;
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  background: var(--bg); color: var(--ink); margin: 0;
  font: 17px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  padding-inline: 20px;
  padding-block: calc(40px + env(safe-area-inset-top, 0px)) calc(72px + env(safe-area-inset-bottom, 0px));
}
main { max-width: 42rem; margin: 0 auto; }
h1 { font-size: clamp(30px, 6vw, 42px); line-height: 1.1; letter-spacing: -.02em; margin: 0 0 8px; text-wrap: balance; }
h2 { font-size: clamp(21px, 3.4vw, 26px); line-height: 1.25; letter-spacing: -.01em; margin: 44px 0 10px; text-wrap: balance; padding-top: 18px; border-top: 1px solid var(--line); }
h3 { font-size: 18px; margin: 28px 0 8px; color: var(--accent-ink); text-wrap: balance; }
p, ul { margin: 0 0 16px; }
ul { padding-left: 1.3em; }
li { margin-bottom: 9px; }
li::marker { color: var(--ink-faint); }
strong { font-weight: 650; }
a { color: var(--accent-ink); text-underline-offset: 2px; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .88em; background: var(--accent-soft); color: var(--accent-ink); padding: 2px 5px; border-radius: 5px; overflow-wrap: anywhere; }
mark { background: var(--mark); color: var(--mark-ink); padding: 2px 6px; border-radius: 5px; font-weight: 650; }
hr { border: 0; border-top: 1px solid var(--line); margin: 44px 0 20px; }
hr + p { color: var(--ink-faint); font-size: 14.5px; line-height: 1.55; }
h1 + p { font-size: 14px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 28px; }
h1 + p + p { font-size: 19px; color: var(--ink-soft); }
</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>
`;

fs.writeFileSync(OUT, html);
console.log(`Wrote ${path.relative(ROOT, OUT)} (${(html.length / 1024).toFixed(1)} KB) from ${path.relative(ROOT, SRC)}`);
