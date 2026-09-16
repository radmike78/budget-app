// pdf.js needs the "standard 14" font files (Foxit/Liberation, shipped with pdfjs-dist) to read
// text set in non-embedded fonts. Shared by the web build scripts and the native extractor build.
const fs = require('fs');
const path = require('path');

const FONT_DIR = path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'standard_fonts');
const isFont = (name) => /\.(pfb|ttf)$/i.test(name);

/** Font file names (no licence texts). */
function listStandardFonts() {
  return fs.readdirSync(FONT_DIR).filter(isFont).sort();
}

/** Copies the font files into `dest` (created if missing). Returns the number of files copied. */
function copyStandardFonts(dest) {
  fs.mkdirSync(dest, { recursive: true });
  const names = listStandardFonts();
  for (const name of names) fs.copyFileSync(path.join(FONT_DIR, name), path.join(dest, name));
  return names.length;
}

module.exports = { FONT_DIR, listStandardFonts, copyStandardFonts };
