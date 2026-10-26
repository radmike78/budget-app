/**
 * Feature switches for a release. Pure constants, no imports, so tests and scripts can read them.
 *
 * SMART_ASSIST — the optional Smart parsing assist (Settings → Smart parsing, `src/parser/llmFallback.ts`).
 * Held back for 1.0 so the app has no network feature at all and both store privacy forms say "no data
 * collected". The code, the consent dialog, the key storage and their tests stay in place. Turning it back
 * on for a later release: flip this to true, then put the Smart parsing sentence back into the "No ads"
 * commitment in every locale, and update `store/listing.md` and `docs/PRIVACY.md` (section "Smart parsing").
 */
// Switching it on also means adding `https://api.anthropic.com` back to `connect-src` in deploy/nginx/default.conf,
// scripts/postbuild-web.js and the CSP test in __tests__/security.test.ts.
export const SMART_ASSIST = false;
