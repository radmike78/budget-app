/** Tiny hex colour helpers for derived shades. Pure: no React Native. */

function parse(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');

/** Mixes `hex` toward `toward` by `amount` (0 = hex, 1 = toward). */
export function mix(hex: string, toward: string, amount: number): string {
  const a = parse(hex);
  const b = parse(toward);
  return `#${a.map((c, i) => toHex(c + (b[i] - c) * amount)).join('')}`;
}

/** A light-to-dark run of one hue for showing magnitude: index 0 is the strongest. */
export function ramp(accent: string, surface: string, steps: number, reach = 0.8): string[] {
  return Array.from({ length: steps }, (_, i) => mix(accent, surface, steps === 1 ? 0 : (i / (steps - 1)) * reach));
}
