/**
 * The currency a sentence names out loud, when it names one without doubt: "20 euros", "£5", "1200円".
 * "$" and "dollars" are left alone (US, Canadian, Australian and Mexican money all say them), and so is "kr".
 * Pure: no React Native.
 */
const CODES: [RegExp, string][] = [
  [/€|\beuros?\b|\beuri\b|\beur\b|ユーロ|欧元|유로/iu, 'EUR'],
  [/£|\bpounds?\b|\bquid\b|\bgbp\b|英镑|ポンド|파운드/iu, 'GBP'],
  [/\byen\b|\bjpy\b|円|日元|엔/iu, 'JPY'],
  [/₩|\bwon\b|\bkrw\b|원|韓元|ウォン/iu, 'KRW'],
  [/₹|\brupees?\b|\binr\b/iu, 'INR'],
  [/\bchf\b|\bfranken\b|\bfrancs?\b|\bfranchi\b/iu, 'CHF'],
  [/\bcad\b/iu, 'CAD'],
  [/\baud\b/iu, 'AUD'],
  [/\busd\b|美元|美金|달러/iu, 'USD'],
  [/人民币|\brmb\b|\bcny\b|위안/iu, 'CNY'],
];

export function spokenCurrency(text: string): string | null {
  const found = new Set<string>();
  for (const [re, code] of CODES) if (re.test(text)) found.add(code);
  // Two different currencies in one sentence ("changed 20 euros to pounds") is not an entry's currency.
  return found.size === 1 ? [...found][0] : null;
}
