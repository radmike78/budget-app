/**
 * Shared harness for the phrasing tests: many everyday ways of saying the same
 * thing, each with what the parser must make of it. Not a test file itself.
 */
import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';
import { parseEntries } from '@/parser';
import type { Goal } from '@/types';

export type Expect = Record<string, unknown>;
export type Case = [text: string, expected: Expect];

export const TODAY = '2026-09-16'; // a Wednesday
export const GOALS = [
  { id: 'g1', name: 'Trip to Japan', kind: 'saving', targetAmount: 3000, savedAmount: 0, targetDate: null, completed: false, createdAt: '2026-01-01' },
] as unknown as Goal[];

function matches(actual: unknown, expected: unknown): boolean {
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    return !!actual && typeof actual === 'object' && Object.entries(expected).every(([k, v]) => matches((actual as Record<string, unknown>)[k], v));
  }
  if (Array.isArray(expected)) return Array.isArray(actual) && expected.length === actual.length && expected.every((v, i) => matches(actual[i], v));
  return actual === expected;
}

/** Parses one phrasing the way the app does (with the language's category names) and returns the single result. */
/** The repeating entries a probe may name ("pause netflix"), lower-cased as the app hands them to the parser. */
export const RULE_NAMES = ['netflix', 'gym', 'rent / mortgage', 'spotify'];

export function parseOne(text: string, language: string, categoryLabels?: Record<string, string>, goals: Goal[] = GOALS, ruleNames: string[] = RULE_NAMES) {
  return parseEntries(text, { categories: DEFAULT_CATEGORIES, goals, keywordMap: {}, today: TODAY, nowTime: '12:00', language, categoryLabels, ruleNames });
}

/** Runs every case; a failure names the phrasing and shows what came back. */
export function runCases(language: string, cases: Case[], categoryLabels?: Record<string, string>) {
  it.each(cases)('%s', (text, expected) => {
    const r = parseOne(text, language, categoryLabels);
    const got = r[0] as unknown as Record<string, unknown>;
    const summary = { n: r.length, kind: got.kind, type: got.type, amount: got.amount, categoryId: got.categoryId, note: got.note, goalId: got.goalId, goalKind: got.goalKind, question: got.question };
    if (r.length !== 1 || !matches(got, expected)) throw new Error(`"${text}"\n want ${JSON.stringify(expected)}\n got  ${JSON.stringify(summary)}`);
  });
}
