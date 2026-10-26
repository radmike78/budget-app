/**
 * Bytes to text for a file the person chose (a CSV export). UTF-8 first, with the byte-order mark dropped;
 * a file that is plainly not UTF-8 (an old bank export in Windows-1252) is read byte for byte instead.
 * Pure, so the tests cover it; no React Native imports.
 */
export function decodeTextBytes(bytes: Uint8Array): string {
  const start = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0;
  if (bytes.length >= 2 && ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff))) return decodeUtf16(bytes);
  const utf8 = decodeUtf8(bytes, start);
  if (utf8.bad === 0 || utf8.bad < bytes.length / 200) return utf8.text;
  let s = '';
  for (let i = start; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i]);
  return s;
}

function decodeUtf8(b: Uint8Array, start: number): { text: string; bad: number } {
  const out: string[] = [];
  let bad = 0;
  let i = start;
  while (i < b.length) {
    const c = b[i];
    if (c < 0x80) { out.push(String.fromCharCode(c)); i += 1; continue; }
    let n = 0;
    let cp = 0;
    if ((c & 0xe0) === 0xc0) { n = 1; cp = c & 0x1f; } else if ((c & 0xf0) === 0xe0) { n = 2; cp = c & 0x0f; } else if ((c & 0xf8) === 0xf0) { n = 3; cp = c & 0x07; } else { bad += 1; out.push('�'); i += 1; continue; }
    if (i + n >= b.length + 0 && i + n > b.length - 1 + 1) { bad += 1; out.push('�'); i += 1; continue; }
    let ok = true;
    for (let k = 1; k <= n; k += 1) {
      const cc = b[i + k];
      if (cc === undefined || (cc & 0xc0) !== 0x80) { ok = false; break; }
      cp = (cp << 6) | (cc & 0x3f);
    }
    if (!ok) { bad += 1; out.push('�'); i += 1; continue; }
    out.push(String.fromCodePoint(cp));
    i += n + 1;
  }
  return { text: out.join(''), bad };
}

function decodeUtf16(b: Uint8Array): string {
  const little = b[0] === 0xff;
  let s = '';
  for (let i = 2; i + 1 < b.length; i += 2) s += String.fromCharCode(little ? b[i] | (b[i + 1] << 8) : (b[i] << 8) | b[i + 1]);
  return s;
}
