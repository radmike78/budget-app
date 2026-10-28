/**
 * Statement import: bank and card statements (text and positioned PDF text),
 * credit reports, month alignment with year inference, duplicates, and the
 * pay-off planner.
 */
import fs from 'fs';
import path from 'path';
import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';
import type { ParseContext } from '@/parser';
import {
  cleanDescription, debtsFromTradelines, defaultDateOrder, detectKind, findDates, numericDateOrder, findMoney, findPeriod, fingerprintOf, guessKind, lookupMerchant, parseCreditReport, parseStatement,
  planPayoff, recommendStrategy, resolveDate, rowsFromItems, rowsFromText, toNumber,
} from '@/statements';

const TODAY = '2026-02-10';
const ctx = (language = 'en'): ParseContext => ({ categories: DEFAULT_CATEGORIES, goals: [], keywordMap: {}, today: TODAY, language });
const parse = (text: string, language = 'en', known?: Set<string>) => parseStatement(rowsFromText(text), ctx(language), { language, today: TODAY, knownFingerprints: known });

const BANK = `
FIRST NATIONAL BANK
Everyday Checking   Account number: XXXXXX4821
Statement Period: 12/20/2025 - 01/19/2026
Beginning Balance                                  2,410.55
Deposits and other credits
12/22   PAYROLL ACME CORP DIRECT DEP 123456          2,150.00     4,560.55
01/05   PAYROLL ACME CORP DIRECT DEP 123457          2,150.00     5,120.30
01/12   ZELLE FROM JOHN SMITH                           40.00     3,915.30
Withdrawals and other debits
12/23   POS PURCHASE WM SUPERCENTER #1234 SEATTLE WA    86.21     4,474.34
12/26   NETFLIX.COM 866-579-7172 CA                     15.49     4,458.85
12/30   ONLINE TRANSFER TO SAVINGS XXXX9911            500.00     3,958.85
01/02   CHASE CREDIT CRD AUTOPAY 4567                  340.00     2,970.30
01/03   SHELL OIL 57444 REDMOND WA                      48.10     2,922.20
01/08   SQ *BLUE BOTTLE COF SEATTLE WA                   6.75     5,113.55
01/09   PG&E WEB ONLINE PAYMENT                        132.40     4,981.15
01/10   ATM WITHDRAWAL 01/10 1234 MAIN ST              100.00     4,881.15
01/15   CVS/PHARMACY #08214 BELLEVUE WA                 24.99     3,890.31
Ending Balance                                     3,890.31
`;

const CARD = `
CHASE SAPPHIRE PREFERRED
Account Number: 4123 XXXX XXXX 9876
Opening/Closing Date   12/15/25 - 01/14/26
Previous Balance                    $1,240.10
New Balance                         $1,352.43
Minimum Payment Due                    $40.00
Payment Due Date                     02/09/26
Credit Limit                       $12,000.00
Purchase APR 24.99%
PAYMENTS AND OTHER CREDITS
12/20  Payment Thank You-Mobile                     -500.00
12/28  AMZN Mktp US Return                           -35.20
PURCHASES
12/17  UBER EATS   SAN FRANCISCO CA                   28.40
12/24  MACY'S #123 SEATTLE WA                        119.99
01/02  TRADER JOE'S #45 SEATTLE WA                    64.12
01/04  SPOTIFY USA                                    10.99
01/08  FLEMINGS STEAKHOUSE BELLEVUE WA               121.53
01/13  INTEREST CHARGE ON PURCHASES                    18.22
`;

const REPORT = `
EXPERIAN CREDIT REPORT
Report date: 02/01/2026
Accounts
CAPITAL ONE
Account Type: Credit Card
Status: Open
Balance: $3,450.00
Credit Limit: $5,000
Monthly Payment: $85
NAVIENT
Account Type: Student Loan
Balance: $14,200
Monthly Payment: $190
WELLS FARGO HOME MTG
Account Type: Mortgage
Balance: $310,000
Monthly Payment: $1,900
TOYOTA MOTOR CREDIT
Account Type: Auto Loan
Balance: $9,800
Monthly Payment: $320
SOFI LENDING
Account Type: Installment
Balance: $6,000
Monthly Payment: $210
Interest Rate: 9.5%
DISCOVER BANK
Account Type: Credit Card
Status: Closed
Balance: $0
`;

describe('money and dates on statements', () => {
  it('reads every common money format', () => {
    expect(toNumber('1,234.56')).toBe(1234.56);
    expect(toNumber('1.234,56')).toBe(1234.56);
    expect(toNumber('1 234,56')).toBe(1234.56);
    expect(toNumber('1,234')).toBe(1234);
    expect(toNumber('12.50')).toBe(12.5);
    const m = findMoney('12/05 STORE (45.00) 1,000.00 CR $-3.10 20.00-');
    expect(m.map((x) => [x.value, x.negative, x.credit])).toEqual([[45, true, false], [1000, false, true], [3.1, true, false], [20, true, false]]);
    expect(findMoney('Check 2026 posted 01/05').length).toBe(0);
  });
  it('reads dates in several formats and locales', () => {
    expect(findDates('12/22 PAYROLL', 'en')[0]).toMatchObject({ month: 11, day: 22, year: null });
    // a description that starts with a month word never steals the numeric date in front of it
    expect(findDates('03/15  MAY DEPT STORE  20.00', 'en')).toMatchObject([{ month: 2, day: 15, year: null }]);
    expect(findDates('03/20  DEC HARDWARE  30.00', 'en')).toMatchObject([{ month: 2, day: 20, year: null }]);
    expect(findDates('03/15/26,MAY DEPT STORE', 'en')).toMatchObject([{ month: 2, day: 15, year: 2026 }]);
    expect(findDates('15/03/25;MARS CHOCOLAT', 'fr')).toMatchObject([{ month: 2, day: 15, year: 2025 }]);
    expect(findDates('15 Mar 2026 COFFEE', 'en')).toMatchObject([{ month: 2, day: 15, year: 2026 }]);
    expect(findDates('22/12/2025 NOMINA', 'es')[0]).toMatchObject({ month: 11, day: 22, year: 2025 });
    expect(findDates('Jan 5, 2026', 'en')[0]).toMatchObject({ month: 0, day: 5, year: 2026 });
    expect(findDates('5 janv. 2026', 'fr')[0]).toMatchObject({ month: 0, day: 5, year: 2026 });
    expect(findDates('2026-01-05', 'en')[0]).toMatchObject({ month: 0, day: 5, year: 2026 });
    expect(findDates('2026年1月5日', 'zh')[0]).toMatchObject({ month: 0, day: 5, year: 2026 });
    expect(findDates('13/01', 'en')[0]).toMatchObject({ month: 0, day: 13 });
  });
  it('reads day-first dates on an English statement from the UK or Australia', () => {
    // The statement shows its order itself: 15/03 can only be the 15th of March, so 03/04 is the 3rd of April.
    const uk = parseStatement(rowsFromText('Statement period 01/03/2026 to 31/03/2026\n03/03 TESCO STORES 3021 12.40\n15/03 PRET A MANGER 4.50'), ctx('en'), { language: 'en', today: TODAY });
    expect(uk.period).toEqual({ start: '2026-03-01', end: '2026-03-31' });
    expect(uk.lines.map((l) => l.date)).toEqual(['2026-03-03', '2026-03-15']);
    // Nothing on the page decides it: the phone's region does.
    const rows = rowsFromText('03/04 TESCO STORES 3021 12.40');
    expect(parseStatement(rows, ctx('en'), { language: 'en', region: 'GB', today: TODAY }).lines[0].date).toBe('2025-04-03');
    expect(parseStatement(rows, ctx('en'), { language: 'en', region: 'US', today: TODAY }).lines[0].date).toBe('2025-03-04');
    expect(parseStatement(rows, ctx('en'), { language: 'en', today: TODAY }).lines[0].date).toBe('2025-03-04');
    // "Call us 24/7" in a footer says nothing about the order of the dates.
    expect(numericDateOrder(rowsFromText('Questions? Call us 24/7 at the number on your card\n03/05 COFFEE 4.50\n03/09 GAS 30.00'))).toBeNull();
    expect(numericDateOrder(rowsFromText('24/7 support\n03/05 COFFEE 4.50\n03/15 GAS 30.00'))).toBe('mdy');
    // Amounts never count as dates when reading the order.
    expect(numericDateOrder(rowsFromText('01/05 COFFEE 4.50\n01/06 LUNCH 12.25'))).toBeNull();
    expect(defaultDateOrder('en', 'AU')).toBe('dmy');
    expect(defaultDateOrder('de', 'US')).toBe('dmy');
    expect(defaultDateOrder('ja', 'JP')).toBe('mdy');
  });
  it('reads yen and won amounts, which have no cents', () => {
    expect(findMoney('01/05 ローソン 980円').map((m) => m.value)).toEqual([980]);
    expect(findMoney('01/05 ローソン 980円 12,345円').map((m) => m.value)).toEqual([980, 12345]);
    expect(findMoney('01/05 스타벅스 ₩4500').map((m) => m.value)).toEqual([4500]);
    expect(findMoney('01/05 STORE 4500').length).toBe(0);
    expect(findMoney('CHF 4500').map((m) => m.value)).toEqual([4500]);
  });
  it('a reference number next to a currency code is not money', () => {
    expect(findMoney('PAYPAL INST XFER REF 1234567 USD 50.00').map((m) => [m.value, m.decimals])).toEqual([[50, true]]);
    expect(findMoney('REF 12345678 USD').length).toBe(0);
    expect(findMoney('VENMO PAYMENT 2,000,123 15.00').map((m) => m.value)).toEqual([2000123, 15]);
    const p = parse(`Statement Period: 03/01/2026 - 03/31/2026
Checking account summary
03/05 PAYPAL INST XFER REF 1234567 USD 50.00
03/06 VENMO PAYMENT 2,000,123 15.00
03/07 STORE 2,500 3,100.00`);
    expect(p.lines.map((l) => [l.amount, l.balance])).toEqual([[50, null], [15, null], [2500, 3100]]);
  });
  it('puts a December line on a January statement into the previous year', () => {
    const period = { start: '2025-12-20', end: '2026-01-19' };
    expect(resolveDate({ month: 11, day: 22, year: null, start: 0, end: 5, raw: '12/22' }, period, TODAY)).toBe('2025-12-22');
    expect(resolveDate({ month: 0, day: 5, year: null, start: 0, end: 5, raw: '01/05' }, period, TODAY)).toBe('2026-01-05');
    expect(resolveDate({ month: 5, day: 1, year: null, start: 0, end: 5, raw: '06/01' }, null, TODAY)).toBe('2025-06-01');
  });
  it('finds the statement period in several phrasings', () => {
    expect(findPeriod(rowsFromText('Statement Period: 12/20/2025 - 01/19/2026'), 'en', TODAY)).toEqual({ start: '2025-12-20', end: '2026-01-19' });
    expect(findPeriod(rowsFromText('Opening/Closing Date 12/15/25 - 01/14/26'), 'en', TODAY)).toEqual({ start: '2025-12-15', end: '2026-01-14' });
    expect(findPeriod(rowsFromText('December 5, 2025 through January 4, 2026'), 'en', TODAY)).toEqual({ start: '2025-12-05', end: '2026-01-04' });
    expect(findPeriod(rowsFromText('Statement Date: 01/31/2026'), 'en', TODAY)).toEqual({ start: '2025-12-31', end: '2026-01-31' });
  });
});

describe('bank statement', () => {
  const p = parse(BANK);
  it('is recognised with its period and account', () => {
    expect(p.kind).toBe('bank');
    expect(p.period).toEqual({ start: '2025-12-20', end: '2026-01-19' });
    expect(JSON.stringify(p)).not.toMatch(/4821/);
  });
  it('separates deposits from withdrawals using the section headings and balances', () => {
    const byDesc = Object.fromEntries([...p.lines].reverse().map((l) => [l.description, l]));
    expect(byDesc['Payroll Acme Corp']).toMatchObject({ direction: 'in', kind: 'income', categoryId: 'salary', amount: 2150, date: '2025-12-22', month: '2025-12' });
    expect(byDesc['Wm Supercenter Seattle']).toMatchObject({ direction: 'out', categoryId: 'groceries', amount: 86.21 });
    expect(byDesc['Netflix']).toMatchObject({ categoryId: 'subscriptions' });
    expect(byDesc['Online Transfer To Savings']).toMatchObject({ kind: 'transfer', include: false });
    expect(byDesc['Chase Credit Crd Autopay']).toMatchObject({ categoryId: 'debt' });
    expect(byDesc['Shell Oil Redmond']).toMatchObject({ categoryId: 'transport' });
    expect(byDesc['Blue Bottle Cof Seattle']).toMatchObject({ categoryId: 'dining' });
    expect(byDesc['Pg&e Online Payment']).toMatchObject({ categoryId: 'utilities' });
    expect(byDesc['Cvs/Pharmacy Bellevue']).toMatchObject({ categoryId: 'health' });
    expect(byDesc['Zelle From John Smith']).toMatchObject({ direction: 'in', categoryId: 'other_income' });
  });
  it('aligns every line to the right month and marks partial months', () => {
    expect(p.months.map((m) => [m.month, m.income, m.expenses, m.partial])).toEqual([['2025-12', 2150, 101.7, true], ['2026-01', 2190, 652.24, true]]);
  });
  it('flags lines that are already in the history', () => {
    const known = new Set([fingerprintOf('2026-01-03', 48.1, 'out', 'SHELL OIL 57444 REDMOND WA')]);
    const again = parse(BANK, 'en', known);
    const shell = again.lines.find((l) => l.description === 'Shell Oil Redmond')!;
    expect(shell.duplicate).toBe(true);
    expect(shell.include).toBe(false);
    expect(again.warnings).toContain('hasDuplicates');
  });
});

describe('card statement', () => {
  const p = parse(CARD);
  it('is recognised, with the card as a tradeline', () => {
    expect(p.kind).toBe('card');
    expect(p.period).toEqual({ start: '2025-12-15', end: '2026-01-14' });
    expect(p.tradelines[0]).toMatchObject({ creditor: 'Chase Sapphire Preferred', type: 'credit_card', balance: 1352.43, monthlyPayment: 40, creditLimit: 12000, apr: 24.99, consumer: true });
  });
  it('reads unsigned payments and refunds on a card statement with no sections as credits', () => {
    const plain = CARD.replace('PAYMENTS AND OTHER CREDITS\n', '').replace('PURCHASES\n', '').replace('-500.00', '500.00').replace('-35.20', '35.20');
    const byDesc = Object.fromEntries(parse(plain).lines.map((l) => [l.description, l]));
    expect(byDesc['Payment Thank You-Mobile']).toMatchObject({ kind: 'payment', include: false });
    expect(byDesc['AMZN Mktp US Return']).toMatchObject({ kind: 'refund', direction: 'in' });
    expect(byDesc['Spotify']).toMatchObject({ direction: 'out' });
  });
  it('treats payments as excluded, refunds as income, purchases and interest as expenses', () => {
    const byDesc = Object.fromEntries(p.lines.map((l) => [l.description, l]));
    expect(byDesc['Payment Thank You-Mobile']).toMatchObject({ kind: 'payment', include: false, direction: 'in' });
    expect(byDesc['AMZN Mktp US Return']).toMatchObject({ kind: 'refund', direction: 'in', categoryId: 'other_income', include: true });
    expect(byDesc['Uber Eats San Francisco']).toMatchObject({ direction: 'out', categoryId: 'dining', date: '2025-12-17' });
    expect(byDesc["Macy's Seattle"]).toMatchObject({ categoryId: 'shopping' });
    expect(byDesc["Trader Joe's Seattle"]).toMatchObject({ categoryId: 'groceries', date: '2026-01-02' });
    expect(byDesc['Spotify']).toMatchObject({ categoryId: 'subscriptions' });
    expect(byDesc['Flemings Steakhouse Bellevue']).toMatchObject({ categoryId: 'dining' });
    expect(byDesc['Interest Charge On Purchases']).toMatchObject({ kind: 'interest', categoryId: 'debt' });
    expect(p.warnings).not.toContain('directionGuessed');
  });
});

describe('positioned PDF text (real pdf.js output)', () => {
  it('uses the header row to tell deposits from withdrawals', () => {
    const items = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/bank-items.json'), 'utf8'));
    const p = parseStatement(rowsFromItems(items), ctx(), { language: 'en', today: TODAY });
    expect(p.kind).toBe('bank');
    expect(p.lines.map((l) => [l.date, l.direction, l.amount, l.kind, l.balance])).toEqual([
      ['2025-12-22', 'in', 2150, 'income', 4560.55],
      ['2025-12-23', 'out', 86.21, 'expense', 4474.34],
      ['2025-12-30', 'out', 500, 'transfer', 3974.34],
      ['2026-01-03', 'out', 48.1, 'expense', 3926.24],
      ['2026-01-12', 'in', 40, 'income', 3966.24],
    ]);
  });
});

describe('other locales and formats', () => {
  it('reads a German statement with decimal commas and day-first dates', () => {
    const text = `
Kontoauszug Girokonto DE12 3456 7890
Abrechnungszeitraum 01.01.2026 bis 31.01.2026
Buchung  Verwendungszweck  Betrag  Saldo
03.01.2026  GEHALT MUSTER GMBH  2.500,00  3.100,00
05.01.2026  REWE SAGT DANKE  -54,30  3.045,70
09.01.2026  STADTWERKE STROM  -89,00  2.956,70
`;
    const p = parse(text, 'de');
    expect(p.kind).toBe('bank');
    expect(p.lines.map((l) => [l.date, l.direction, l.amount, l.categoryId])).toEqual([
      ['2026-01-03', 'in', 2500, 'salary'],
      ['2026-01-05', 'out', 54.3, 'groceries'],
      ['2026-01-09', 'out', 89, 'utilities'],
    ]);
  });
  it('uses parentheses and CR markers when there are no headings', () => {
    const text = `
Statement Date: 01/31/2026
Checking summary
01/04  MERCADONA 1234  (42.10)
01/06  TRANSFERENCIA NOMINA  1,800.00 CR
`;
    const p = parse(text, 'es');
    expect(p.lines.map((l) => [l.direction, l.amount])).toEqual([['out', 42.1], ['in', 1800]]);
  });
  it('cleans statement noise out of descriptions', () => {
    expect(cleanDescription('POS PURCHASE SQ *BLUE BOTTLE COF SEATTLE WA 01/05')).toBe('Blue Bottle Cof Seattle');
    expect(cleanDescription('AMZN Mktp US*2K4R83 AMZN.COM/BILL WA')).toBe('AMZN Mktp US AMZN');
    expect(cleanDescription('CHECKCARD 0105 STARBUCKS #12345 XXXXXXXXXXXX1234')).toBe('Starbucks');
    expect(guessKind('ONLINE TRANSFER TO SAVINGS', 'out', 'bank').kind).toBe('transfer');
    expect(guessKind('PAYMENT - THANK YOU', 'in', 'card').kind).toBe('payment');
  });
  it('tells a credit report from a statement', () => {
    expect(detectKind(rowsFromText(REPORT))).toBe('credit_report');
    expect(detectKind(rowsFromText(CARD))).toBe('card');
    expect(detectKind(rowsFromText(BANK))).toBe('bank');
  });
});

describe('credit report and pay-off plan', () => {
  const tl = parseCreditReport(rowsFromText(REPORT));
  it('finds every account with its type, balance and payment', () => {
    expect(tl.map((x) => [x.creditor, x.type, x.balance, x.monthlyPayment, x.consumer])).toEqual([
      ['CAPITAL ONE', 'credit_card', 3450, 85, true],
      ['NAVIENT', 'student_loan', 14200, 190, true],
      ['WELLS FARGO HOME MTG', 'mortgage', 310000, 1900, false],
      ['TOYOTA MOTOR CREDIT', 'auto_loan', 9800, 320, false],
      ['SOFI LENDING', 'personal_loan', 6000, 210, true],
      ['DISCOVER BANK', 'credit_card', 0, null, true],
    ]);
    expect(tl.find((x) => x.creditor === 'SOFI LENDING')!.apr).toBe(9.5);
    expect(tl.find((x) => x.creditor === 'DISCOVER BANK')!.status).toBe('closed');
  });
  it('plans consumer debt only, never the mortgage or the car', () => {
    const debts = debtsFromTradelines(tl);
    expect(debts.map((d) => d.name)).toEqual(['CAPITAL ONE', 'NAVIENT', 'SOFI LENDING']);
    expect(recommendStrategy(debts)).toEqual({ strategy: 'snowball', reason: 'rates_unknown' });
    const snow = planPayoff(debts, 200, 'snowball');
    expect(snow.rows.map((r) => r.name)).toEqual(['CAPITAL ONE', 'SOFI LENDING', 'NAVIENT']);
    expect(snow.monthlyTotal).toBe(685);
    expect(snow.truncated).toBe(false);
    expect(snow.totalMonths).toBeLessThan(60);
  });
  it('avalanche puts the highest rate first and costs less interest than snowball', () => {
    const debts = [
      { id: 'a', name: 'Card A', balance: 5000, apr: 27.9, minPayment: 100 },
      { id: 'b', name: 'Card B', balance: 1200, apr: 18.9, minPayment: 35 },
      { id: 'c', name: 'Loan', balance: 8000, apr: 8.5, minPayment: 250 },
    ];
    expect(recommendStrategy(debts)).toEqual({ strategy: 'avalanche', reason: 'rates_known' });
    const av = planPayoff(debts, 300, 'avalanche');
    const sn = planPayoff(debts, 300, 'snowball');
    expect(av.rows[0].name).toBe('Card A');
    expect(sn.rows[0].name).toBe('Card B');
    expect(av.totalInterest).toBeLessThan(sn.totalInterest);
    expect(av.totalMonths).toBeLessThanOrEqual(sn.totalMonths + 1);
  });
  it('never loops forever on hopeless input', () => {
    const p = planPayoff([{ id: 'x', name: 'X', balance: 100000, apr: 99, minPayment: 10 }], 0, 'avalanche');
    expect(p.truncated).toBe(true);
  });
});

describe('review fixes', () => {
  it('a payment due date on the period row is never the end of the period', () => {
    expect(findPeriod(rowsFromText('Closing Date 01/31/2026    Payment Due Date 02/25/2026'), 'en', TODAY)).toEqual({ start: '2025-12-31', end: '2026-01-31' });
    expect(findPeriod(rowsFromText('Payment Due Date: 02/25/2026   Statement Closing Date: 01/31/2026'), 'en', TODAY)).toEqual({ start: '2025-12-31', end: '2026-01-31' });
    expect(findPeriod(rowsFromText('Statement Period 01/01/2026 to 01/31/2026  Payment Due 02/25/2026'), 'en', TODAY)).toEqual({ start: '2026-01-01', end: '2026-01-31' });
    expect(findPeriod(rowsFromText('Total interest charged in 2026: $0.00\nOpening date 01/01/2026\nClosing date 01/31/2026'), 'en', TODAY)).toEqual({ start: '2026-01-01', end: '2026-01-31' });
  });

  it('joins a description wrapped onto the next line when the amount sits there', () => {
    const p = parse(`Statement Period: 01/01/2026 - 01/31/2026
Withdrawals
01/05   POS PURCHASE BLUE BOTTLE
        SEATTLE WA                                     4.50
01/06   AMAZON MKTP                                   25.00
        ORDER 112-3456789
01/07   SHELL OIL                                     48.10
01/08   SOMETHING WITHOUT AN AMOUNT
Ending Balance                                     3,890.31`);
    expect(p.lines.map((l) => [l.date, l.description, l.amount])).toEqual([
      ['2026-01-05', 'Blue Bottle Seattle', 4.5],
      ['2026-01-06', 'Amazon Mktp', 25],
      ['2026-01-07', 'Shell Oil', 48.1],
    ]);
  });

  it('on a card statement the last number of a line is the billed amount, not a balance', () => {
    const p = parse(`CHASE FREEDOM
Opening/Closing Date 12/15/25 - 01/14/26
New Balance $1,352.43
Minimum Payment Due $40.00
Credit Limit $12,000.00  Available Credit $10,647.57
Purchase APR 24.99%
PURCHASES
01/06  FOREIGN TX 12.50 EUR             13.80
01/07  UBER EATS                        28.40`);
    expect(p.kind).toBe('card');
    expect(p.lines.map((l) => [l.amount, l.balance])).toEqual([[13.8, null], [28.4, null]]);
    expect(p.tradelines[0]).toMatchObject({ balance: 1352.43, monthlyPayment: 40, creditLimit: 12000, apr: 24.99 });
  });

  it('"paid or paying as agreed" is an open account', () => {
    const tl = parseCreditReport(rowsFromText(`CAPITAL ONE
Account Type: Credit Card
Status: Paid or Paying as Agreed
Balance: $3,450
Monthly Payment: $85
CHASE CARD
Status: Paid, Closed/Never late
Balance: $0`));
    expect(tl.map((t) => [t.creditor, t.status])).toEqual([['CAPITAL ONE', 'open'], ['CHASE CARD', 'closed']]);
    expect(debtsFromTradelines(tl).map((d) => d.name)).toEqual(['CAPITAL ONE']);
  });

  it('reads label: value pairs separated by a single space', () => {
    const tl = parseCreditReport(rowsFromText('CAPITAL ONE\nBalance: $3,450 Monthly Payment: $85 Credit Limit: $5,000\nAccount Type: Credit Card Status: Open'));
    expect(tl).toHaveLength(1);
    expect(tl[0]).toMatchObject({ balance: 3450, monthlyPayment: 85, creditLimit: 5000, type: 'credit_card', status: 'open' });
    const two = parseCreditReport(rowsFromText('NAVIENT\nPay Status: Current Account Balance: $14,200  Monthly Payment: $190'));
    expect(two[0]).toMatchObject({ balance: 14200, monthlyPayment: 190, status: 'open' });
  });

  it('merchant phrases match at word edges only', () => {
    const cat = (s: string) => lookupMerchant(s.toLowerCase())?.categoryId ?? null;
    expect(cat('ESPRESSO VIVACE SEATTLE')).toBe('dining');
    expect(cat('HYATT REGENCY BELLEVUE')).toBeNull();
    expect(cat('SPRING GARDEN CHINESE')).toBeNull();
    expect(cat('BREWERS CAFE')).toBe('dining');
    expect(cat('TWO BROTHERS AUTO REPAIR')).toBeNull();
    expect(guessKind('TWO BROTHERS AUTO REPAIR', 'out', 'bank').kind).toBe('expense');
    expect(cat('RELEASE THE HOUNDS PET STORE')).toBeNull();
    expect(cat('RISOTTO HOUSE')).toBeNull();
    expect(cat('CABELAS OUTDOOR')).toBeNull();
    expect(cat('BARTELL DRUGS')).toBeNull();
    expect(cat('COOPERS HAWK WINERY')).toBeNull();
    expect(cat('MOBILE PHONE REPAIR')).toBeNull();
    expect(cat('HONEST CO')).toBeNull();
    // Real matches still work, including apostrophes, punctuation, CJK and run-together names.
    expect(cat("MACY'S #123")).toBe('shopping');
    expect(cat('ROTH IRA CONTRIBUTION')).toBe('savings');
    expect(cat('EXXONMOBIL 12345')).toBe('transport');
    expect(cat('T-MOBILE *BILL')).toBe('utilities');
    expect(cat('ESSO STATION')).toBe('transport');
    expect(cat('SQ *BLUE BOTTLE')).toBe('dining');
    expect(cat('沃尔玛超市')).toBe('groceries');
    expect(cat('PG&E WEB ONLINE PAYMENT')).toBe('utilities');
  });

  it('skips a pending section on a card statement, which posts on the next one', () => {
    const p = parse(`CHASE FREEDOM
Opening/Closing Date 02/15/26 - 03/14/26
New Balance $500.00
Minimum Payment Due $40.00
PURCHASES
03/01  STARBUCKS                 6.50
03/02  SHELL                    40.00
Pending transactions
03/13  AMAZON                   30.00
03/14  UBER                     12.00`);
    expect(p.lines.map((l) => [l.description, l.amount])).toEqual([['Starbucks', 6.5], ['Shell', 40]]);
    expect(p.warnings).toContain('pendingSkipped');
    // The posted lines start again at the next heading; a sentence about pending transactions skips nothing.
    const first = parse(`Current account statement
Statement Period: 03/01/2026 - 03/31/2026
Pending
03/19  AMAZON                   30.00
Posted transactions
03/02  TESCO STORES             12.40
03/03  DIRECT DEBIT BRITISH GAS 60.00
Pending transactions will appear on your next statement
03/04  PRET A MANGER             4.50`);
    expect(first.lines.map((l) => [l.description, l.amount, l.categoryId])).toEqual([['Tesco Stores', 12.4, 'groceries'], ['British Gas', 60, 'utilities'], ['Pret A Manger', 4.5, 'dining']]);
    for (const heading of ['Transacciones pendientes', 'Opérations en cours', 'Transazioni in sospeso', 'Vorgemerkte Umsätze', '未決済', '미결제', '待处理']) {
      const t = parse(`Statement Period: 03/01/2026 - 03/31/2026\nChecking account summary\n03/02  STORE  12.40\n${heading}\n03/19  STORE  30.00`);
      expect(t.lines.map((l) => l.amount)).toEqual([12.4]);
    }
  });

  it('fees beat transfers, named merchants beat generic words, and UK statements read as bank statements', () => {
    expect(guessKind('WIRE TRANSFER FEE', 'out', 'bank')).toMatchObject({ kind: 'fee', categoryId: 'other_expense' });
    expect(guessKind('ONLINE TRANSFER TO SAVINGS', 'out', 'bank').kind).toBe('transfer');
    expect(guessKind('CARTE 11/01 SNCF INTERNET PARIS', 'out', 'bank')).toMatchObject({ kind: 'expense', categoryId: 'transport' });
    expect(guessKind('PAYCHECK', 'in', 'bank')).toMatchObject({ kind: 'income', categoryId: 'salary' });
    const cat = (s: string) => lookupMerchant(s.toLowerCase())?.categoryId ?? null;
    expect(cat('DIRECT DEBIT BRITISH GAS')).toBe('utilities');
    expect(cat('DD OCTOPUS ENERGY')).toBe('utilities');
    expect(cat('THAMES WATER')).toBe('utilities');
    expect(cat('AMAZON MARKETPLACE')).toBe('shopping');
    expect(cat('SQ *CITY WATER DEPT')).toBe('utilities');
    expect(cat('LIGHTBULB STORE')).toBeNull();
    expect(detectKind(rowsFromText('Current account statement\nDirect debit BRITISH GAS 60.00\nFaster payment ACME 100.00\nStanding order RENT 900.00'))).toBe('bank');
    const p = parse(`Current account statement
Statement Period: 03/01/2026 - 03/31/2026
03/02  WIRE TRANSFER FEE         25.00
03/03  DIRECT DEBIT BRITISH GAS  60.00
03/04  PAYCHECK               1,500.00`);
    expect(p.lines.map((l) => [l.description, l.direction, l.kind, l.categoryId, l.include])).toEqual([
      ['Wire Transfer Fee', 'out', 'fee', 'other_expense', true],
      ['British Gas', 'out', 'expense', 'utilities', true],
      ['Paycheck', 'in', 'income', 'salary', true],
    ]);
  });

  it('keeps reading the shapes that were already right', () => {
    // A negative running balance, and an overdraft fee that takes it further down.
    const neg = parse(`Statement Period: 03/01/2026 - 03/31/2026\nChecking account\nBeginning balance -120.00\n03/02 OVERDRAFT FEE 35.00 -155.00\n03/03 PAYROLL ACME 1,000.00 845.00`);
    expect(neg.lines.map((l) => [l.direction, l.amount, l.balance])).toEqual([['out', 35, -155], ['in', 1000, 845]]);
    // "Jan 5" with no year lands in the statement's year, across the year end.
    const noYear = parse(`Statement Period: Dec 20, 2025 - Jan 19, 2026\nChecking account   Deposits and withdrawals\nDec 22   PAYROLL ACME        2,150.00   4,560.55\nJan 5    BLUE BOTTLE            4.50    4,556.05`);
    expect(noYear.lines.map((l) => [l.date, l.direction, l.amount])).toEqual([['2025-12-22', 'in', 2150], ['2026-01-05', 'out', 4.5]]);
    // Amount, fee and balance in their own columns.
    const three = parse(`Statement Period: 03/01/2026 - 03/31/2026\nChecking account summary\nDate    Description              Amount    Fee    Balance\n03/02   ATM WITHDRAWAL           100.00    3.00   900.00\n03/03   PAYROLL ACME           1,000.00    0.00  1,900.00`);
    expect(three.lines.map((l) => [l.direction, l.amount, l.balance])).toEqual([['out', 100, 900], ['in', 1000, 1900]]);
    // Soll and Haben columns with thousands dots and spaces.
    const soll = parse(`Kontoauszug Girokonto\nAbrechnungszeitraum 01.03.2026 bis 31.03.2026\nBuchung  Verwendungszweck  Soll  Haben  Saldo\n02.03.2026  REWE SAGT DANKE  54,30    3.045,70\n03.03.2026  GEHALT MUSTER GMBH    2.500,00  5.545,70\n04.03.2026  MIETE MAERZ  1 200,00    4.345,70`, 'de');
    expect(soll.lines.map((l) => [l.direction, l.amount, l.balance])).toEqual([['out', 54.3, 3045.7], ['in', 2500, 5545.7], ['out', 1200, 4345.7]]);
    // Débit and Crédit columns on a French statement.
    const deb = parse(`Relevé de compte\nCompte courant\nPériode du 01/03/2026 au 31/03/2026\nDate         Libellé                      Débit      Crédit\n02/03/2026   CARTE 01/03 CARREFOUR        45,67\n03/03/2026   VIR SEPA SALAIRE ACME                   2 400,00\n04/03/2026   PRLV SEPA EDF                1 234,56`, 'fr');
    expect(deb.lines.map((l) => [l.date, l.direction, l.amount, l.categoryId])).toEqual([['2026-03-02', 'out', 45.67, 'groceries'], ['2026-03-03', 'in', 2400, 'salary'], ['2026-03-04', 'out', 1234.56, 'utilities']]);
    // Three identical fares on one day are three entries with three fingerprints.
    const dup = parse(`Statement Period: 03/01/2026 - 03/31/2026\nChecking account\nWithdrawals\n03/02 METRO FARE 2.90\n03/02 METRO FARE 2.90\n03/02 METRO FARE 2.90`);
    expect(dup.lines).toHaveLength(3);
    expect(new Set(dup.lines.map((l) => l.fingerprint)).size).toBe(3);
  });

  it('the web server maps every file type the app serves, including the pdf.js module worker', () => {
    const conf = fs.readFileSync(path.join(__dirname, '../deploy/nginx/default.conf'), 'utf8');
    const server = conf.slice(conf.indexOf('server {'), conf.indexOf('location '));
    // A `types` block inside `server` replaces the inherited table, so the standard mapping must be re-included first.
    expect(server.indexOf('include /etc/nginx/mime.types;')).toBeGreaterThan(0);
    expect(server.indexOf('include /etc/nginx/mime.types;')).toBeLessThan(server.indexOf('types {'));
    expect(server).toMatch(/application\/javascript\s+mjs;/);
    expect(conf).toMatch(/location ~\* \\\.\((?:[a-z0-9|?]*\|)?mjs\|/);
  });
});
