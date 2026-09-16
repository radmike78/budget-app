/**
 * Converts spoken number words into digits so the amount regex can find them:
 *   "twelve dollars"            -> "12 dollars"
 *   "two hundred and fifty"     -> "250"
 *   "twenty-five fifty"         -> "25.50"  (a second group of tens after a finished number is cents)
 *   "a hundred bucks"           -> "100 bucks"
 *   "2.4k" / "2k"               -> "2400" / "2000"
 */

const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const SCALES: Record<string, number> = { hundred: 100, thousand: 1000, grand: 1000, million: 1_000_000 };

function isNumberWord(w: string): boolean {
  return w in UNITS || w in TENS || w in SCALES;
}

/**
 * Parses a run of number words into a value. Returns null if the run is not a
 * valid number. A tens word (or a unit/teen) that cannot extend the number so
 * far, as in "twelve fifty" or "nine ninety nine", starts a cents group: 12.5, 9.99.
 */
function wordsToNumber(words: string[]): number | null {
  let total = 0;
  let current = 0;
  let sawAny = false;
  let lastKind: 'none' | 'unit' | 'teen' | 'tens' | 'scale' = 'none';
  for (let idx = 0; idx < words.length; idx += 1) {
    const w = words[idx];
    if (w === 'and') continue;
    if (w === 'a' || w === 'an') {
      current = current === 0 ? 1 : current;
      continue;
    }
    const cannotExtend = sawAny && (
      (w in TENS && current % 100 !== 0) ||
      (w in UNITS && UNITS[w] >= 10 && current % 100 !== 0) ||
      (w in UNITS && UNITS[w] < 10 && (lastKind === 'unit' || lastKind === 'teen'))
    );
    if (cannotExtend) {
      const cents = wordsToNumber(words.slice(idx));
      if (cents == null || cents < 0 || cents > 99 || !Number.isInteger(cents)) return null;
      return total + current + cents / 100;
    }
    if (w in UNITS) {
      current += UNITS[w];
      sawAny = true;
      lastKind = UNITS[w] >= 10 ? 'teen' : 'unit';
    } else if (w in TENS) {
      current += TENS[w];
      sawAny = true;
      lastKind = 'tens';
    } else if (w === 'hundred') {
      current = (current === 0 ? 1 : current) * 100;
      sawAny = true;
      lastKind = 'scale';
    } else if (w in SCALES) {
      total += (current === 0 ? 1 : current) * SCALES[w];
      current = 0;
      sawAny = true;
      lastKind = 'scale';
    } else {
      return null;
    }
  }
  return sawAny ? total + current : null;
}

export function replaceNumberWords(text: string): string {
  // "2.4k" / "2k" / "1,5k" -> thousands
  let out = text.replace(/\b(\d+(?:[.,]\d+)?)k\b/gi, (_, n: string) => String(Math.round(parseFloat(n.replace(',', '.')) * 1000)));

  // Only a hyphen between two number words ("twenty-five") is a separator; "t-mobile", "7-eleven" and "2026-08-30" keep theirs.
  out = out.replace(/\b([a-z]+)-([a-z]+)\b/gi, (m, a: string, b: string) => (isNumberWord(a.toLowerCase()) && isNumberWord(b.toLowerCase()) ? `${a} ${b}` : m));
  const words = out.split(/\s+/).filter(Boolean);
  // Work on word indices, then rebuild.
  const result: string[] = [];
  let i = 0;
  while (i < words.length) {
    if (/\d-[a-z]|[a-z]-\d/i.test(words[i])) { result.push(words[i]); i += 1; continue; }
    const w = words[i].toLowerCase().replace(/[^a-z]/g, '');
    const startsRun = isNumberWord(w) || ((w === 'a' || w === 'an') && i + 1 < words.length && ['hundred', 'thousand', 'grand', 'million'].includes(words[i + 1].toLowerCase()));
    if (!startsRun) {
      result.push(words[i]);
      i += 1;
      continue;
    }
    // Extend the run as far as it stays a valid number phrase.
    let j = i;
    const run: string[] = [];
    while (j < words.length) {
      const cw = words[j].toLowerCase().replace(/[^a-z]/g, '');
      if (isNumberWord(cw) || cw === 'and' || ((cw === 'a' || cw === 'an') && run.length === 0)) {
        // "and" is only allowed inside a run that continues with a number word.
        if (cw === 'and') {
          const next = j + 1 < words.length ? words[j + 1].toLowerCase().replace(/[^a-z]/g, '') : '';
          if (!isNumberWord(next)) break;
        }
        run.push(cw);
        j += 1;
      } else {
        break;
      }
    }
    const value = wordsToNumber(run);
    if (value === null) {
      result.push(words[i]);
      i += 1;
      continue;
    }
    // Preserve trailing punctuation of the last word in the run (e.g. "twelve.")
    const trailing = words[j - 1].match(/[^a-z]+$/i)?.[0] ?? '';
    result.push((Number.isInteger(value) ? String(value) : value.toFixed(2)) + trailing);
    i = j;
  }
  out = result.join(' ');
  return out.replace(/\s+/g, ' ').trim();
}
