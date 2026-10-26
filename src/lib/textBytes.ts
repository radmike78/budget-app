/**
 * Bytes to text for a file the person chose (a CSV export). UTF-8 first, with the byte-order mark dropped;
 * UTF-16 when it starts with that mark (Excel saves it so); a file that is plainly not UTF-8 (an old bank
 * export in Windows-1252) is read byte for byte instead, so names keep their accents rather than
 * replacement marks. Pure, so the tests cover it; no React Native imports.
 */
export function decodeTextBytes(bytes: Uint8Array): string {
  if (bytes.length >= 2 && ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff))) return decodeUtf16(bytes);
  const start = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0;
  const utf8 = decodeUtf8(bytes, start);
  if (utf8.bad === 0 || utf8.bad < bytes.length / 200) return utf8.text;
  return latin1(bytes, start);
}

const CHUNK = 8192;

function latin1(b: Uint8Array, start: number): string {
  const parts: string[] = [];
  for (let i = start; i < b.length; i += CHUNK) parts.push(String.fromCharCode.apply(null, Array.from(b.subarray(i, Math.min(i + CHUNK, b.length)))));
  return parts.join('');
}

/** A strict UTF-8 decoder: overlong forms, surrogates and code points past U+10FFFF count as bad bytes. */
function decodeUtf8(b: Uint8Array, start: number): { text: string; bad: number } {
  const parts: string[] = [];
  let units: number[] = [];
  const flush = () => { if (units.length) { parts.push(String.fromCharCode.apply(null, units)); units = []; } };
  const push = (cp: number) => {
    if (cp < 0x10000) units.push(cp);
    else { const v = cp - 0x10000; units.push(0xd800 + (v >> 10), 0xdc00 + (v & 0x3ff)); }
    if (units.length >= CHUNK) flush();
  };
  let bad = 0;
  let i = start;
  while (i < b.length) {
    const c = b[i];
    if (c < 0x80) { push(c); i += 1; continue; }
    let n = 0;
    let cp = 0;
    let min = 0;
    if ((c & 0xe0) === 0xc0) { n = 1; cp = c & 0x1f; min = 0x80; } else if ((c & 0xf0) === 0xe0) { n = 2; cp = c & 0x0f; min = 0x800; } else if ((c & 0xf8) === 0xf0) { n = 3; cp = c & 0x07; min = 0x10000; } else { bad += 1; push(0xfffd); i += 1; continue; }
    let ok = i + n < b.length;
    for (let k = 1; ok && k <= n; k += 1) {
      const cc = b[i + k];
      if ((cc & 0xc0) !== 0x80) ok = false;
      else cp = (cp << 6) | (cc & 0x3f);
    }
    if (!ok || cp < min || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) { bad += 1; push(0xfffd); i += 1; continue; }
    push(cp);
    i += n + 1;
  }
  flush();
  return { text: parts.join(''), bad };
}

function decodeUtf16(b: Uint8Array): string {
  const little = b[0] === 0xff;
  const parts: string[] = [];
  let units: number[] = [];
  for (let i = 2; i + 1 < b.length; i += 2) {
    units.push(little ? b[i] | (b[i + 1] << 8) : (b[i] << 8) | b[i + 1]);
    if (units.length >= CHUNK) { parts.push(String.fromCharCode.apply(null, units)); units = []; }
  }
  if (units.length) parts.push(String.fromCharCode.apply(null, units));
  return parts.join('');
}
