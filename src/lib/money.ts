/**
 * Currency formatting without relying on Intl (which is uneven across Hermes
 * versions). Symbols for common currencies; everything else uses the code.
 * Separators and symbol placement follow the active locale.
 */
export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  /** Number of decimals (JPY has 0). */
  decimals: number;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', decimals: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimals: 2 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimals: 0 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2 },
  { code: 'CHF', symbol: 'CHF ', name: 'Swiss Franc', decimals: 2 },
  { code: 'SEK', symbol: 'kr ', name: 'Swedish Krona', decimals: 2 },
  { code: 'NOK', symbol: 'kr ', name: 'Norwegian Krone', decimals: 2 },
  { code: 'DKK', symbol: 'kr ', name: 'Danish Krone', decimals: 2 },
  { code: 'PLN', symbol: 'zł ', name: 'Polish Złoty', decimals: 2 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimals: 2 },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', decimals: 2 },
  { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso', decimals: 2 },
  { code: 'COP', symbol: 'CO$', name: 'Colombian Peso', decimals: 0 },
  { code: 'CLP', symbol: 'CL$', name: 'Chilean Peso', decimals: 0 },
  { code: 'ZAR', symbol: 'R ', name: 'South African Rand', decimals: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2 },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', decimals: 2 },
  { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar', decimals: 0 },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', decimals: 2 },
];

export function currencyInfo(code: string): CurrencyInfo {
  return CURRENCIES.find((c) => c.code === code) ?? { code, symbol: `${code} `, name: code, decimals: 2 };
}

export interface MoneyFormat {
  decimal: string;
  group: string;
  symbolAfter: boolean;
}

export const DEFAULT_MONEY_FORMAT: MoneyFormat = { decimal: '.', group: ',', symbolAfter: false };

function groupThousands(intPart: string, sep: string, lakhs = false): string {
  // Indian rupees group the thousands and then every two digits: 12,34,567.
  if (lakhs && intPart.length > 3) return intPart.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, sep) + sep + intPart.slice(-3);
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

/** Rounds to the units the currency has: cents for most, whole yen and won. Every store writer uses it. */
export function toCurrencyUnits(amount: number, code: string): number {
  const f = 10 ** currencyInfo(code).decimals;
  return Math.round(amount * f) / f;
}

/**
 * formatMoney(1234.5, 'USD') -> "$1,234.50"; negative -> "-$12.00".
 * With a German format: "1.234,50 €". `compact` drops ".00" on whole numbers.
 */
export function formatMoney(amount: number, code: string, opts: { compact?: boolean; format?: MoneyFormat } = {}): string {
  const info = currencyInfo(code);
  const fmt = opts.format ?? DEFAULT_MONEY_FORMAT;
  const abs = Math.abs(amount);
  const rounded = Math.round(abs * 10 ** info.decimals) / 10 ** info.decimals;
  // Decided after rounding: income minus spending can come out as -0.0000001, which is no money at all.
  const negative = amount < 0 && rounded > 0;
  let numberText: string;
  if (opts.compact && Number.isInteger(rounded)) {
    numberText = groupThousands(String(rounded), fmt.group, info.code === 'INR');
  } else {
    const fixed = rounded.toFixed(info.decimals);
    const [intPart, frac] = fixed.split('.');
    numberText = frac ? `${groupThousands(intPart, fmt.group, info.code === 'INR')}${fmt.decimal}${frac}` : groupThousands(intPart, fmt.group, info.code === 'INR');
  }
  const sign = negative ? '-' : '';
  // A no-break space: "12,50 €" is one word on a narrow label.
  if (fmt.symbolAfter) return `${sign}${numberText}\u00a0${info.symbol.trim()}`;
  return `${sign}${info.symbol}${numberText}`;
}

/**
 * An amount as it should sit in an editable field: "12" for whole numbers, otherwise
 * always two decimals ("14.20", never "14.2"), with the locale's decimal mark so that
 * what is shown is also what `parseMoneyInput` reads back.
 */
export function moneyInputText(amount: number, decimalComma = false): string {
  if (!Number.isFinite(amount)) return '';
  const text = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return decimalComma ? text.replace('.', ',') : text;
}

/** Parses user-typed money ("1,234.50", "$12", "12", "12,50") into a number or null. */
/** The largest amount anything accepts; above it a field reads as empty, and backups refuse it. */
export const MAX_AMOUNT = 1_000_000_000_000;

/**
 * Reads an amount typed into a field. Spaces, symbols and grouping are ignored; the last "." or "," followed
 * by one or two digits is the decimal mark, whatever the phone's locale ("1.234,56", "1,234.56", "1 234,50",
 * "4,50"). Three digits after it are grouping ("2,400", "2.400"), except where the locale writes the decimal
 * with that mark or the whole part is 0 ("0,005"). Null when nothing usable is there or it is past MAX_AMOUNT.
 */
export function parseMoneyInput(text: string, decimalComma = false): number | null {
  const negative = /^\s*-/.test(text);
  // A letter in an amount ("1e9", "4O") is a slip, never a number to keep part of.
  if (/\p{L}/u.test(text)) return null;
  // A separator with nothing after it ("12.50.") is a slip of the finger, not a decimal mark.
  const cleaned = text.replace(/[^0-9.,]/g, '').replace(/[.,]+$/, '');
  if (!/\d/.test(cleaned)) return null;
  // "1.2.3": groups between separators are thousands (three digits) or lakhs (two); anything else is not a number.
  const groups = cleaned.split(/[.,]/);
  if (groups.length > 2 && groups.slice(1, -1).some((g) => g.length !== 3 && g.length !== 2)) return null;
  const last = Math.max(cleaned.lastIndexOf('.'), cleaned.lastIndexOf(','));
  let intPart = cleaned;
  let frac = '';
  if (last >= 0) {
    const after = cleaned.slice(last + 1);
    const before = cleaned.slice(0, last).replace(/[.,]/g, '');
    const mark = cleaned[last];
    const isDecimal = after.length !== 3 || (decimalComma ? mark === ',' : mark === '.') && !/[.,]/.test(cleaned.slice(0, last)) || /^0*$/.test(before);
    if (isDecimal && after.length > 0) { intPart = before; frac = after; } else intPart = cleaned.replace(/[.,]/g, '');
  }
  const n = Number(`${intPart || '0'}${frac ? `.${frac}` : ''}`);
  if (!Number.isFinite(n)) return null;
  const value = Math.round(n * 100) / 100;
  if (value > MAX_AMOUNT) return null;
  return negative ? -value : value;
}
