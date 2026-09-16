// Copies the pdf.js worker and its standard 14 font files into public/ so the web dev server
// can serve them (public/ is copied into dist by expo export). Both are read by pdf.js from our
// own origin only (CSP: worker-src 'self', connect-src 'self').
const fs = require('fs');
const path = require('path');
const { copyStandardFonts } = require('./pdf-standard-fonts');
const src = path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'build/pdf.worker.min.mjs');
fs.copyFileSync(src, path.resolve(__dirname, '../public/pdf.worker.min.mjs'));
copyStandardFonts(path.resolve(__dirname, '../public/standard_fonts'));
