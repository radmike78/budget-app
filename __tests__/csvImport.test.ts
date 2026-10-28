/**
 * CSV exports from banks and cards, in the shapes they really come in, read through the same statement
 * parser as a PDF: dates and amounts right, money in and out right, descriptions clean, duplicates flagged,
 * and never an account or card number kept.
 */
import type { ParseContext } from '@/parser';
import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';
import { en } from '@/i18n/locales/en';
import { csvAmount, csvToRows, fingerprintOf, normalizeCsvDate, parseCsv, parseStatement, type ParsedStatement, type StatementLine } from '@/statements';

const TODAY = '2026-03-20';
const ctx = (language = 'en'): ParseContext => ({ categories: DEFAULT_CATEGORIES, goals: [], keywordMap: {}, today: TODAY, language, categoryLabels: language === 'en' ? en.s.categoryNames : undefined });
const read = (csv: string, language = 'en', known?: Set<string>, region?: string) => {
  const c = csvToRows(csv, language, TODAY);
  const p = parseStatement(c.rows, ctx(language), { language, region, today: TODAY, knownFingerprints: known, period: c.period, kind: c.kind });
  return { ...p, csvWarnings: c.warnings, period: c.period };
};
const by = (p: ParsedStatement): Record<string, StatementLine> => Object.fromEntries(p.lines.map((l) => [l.description, l]));

describe('cells and numbers', () => {
  it('splits quoted cells, doubled quotes, embedded newlines and the delimiter the file uses', () => {
    expect(parseCsv('a,"b, c","say ""hi""","two\nlines"\n1,2,3,4')).toEqual([['a', 'b, c', 'say "hi"', 'two\nlines'], ['1', '2', '3', '4']]);
    expect(parseCsv('﻿Datum;Betrag\n01.03.2026;-12,50')).toEqual([['Datum', 'Betrag'], ['01.03.2026', '-12,50']]);
    expect(parseCsv('a\tb\n1\t2')).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('reads every amount shape as one signed number', () => {
    expect(csvAmount('1,234.56')).toBe(1234.56);
    expect(csvAmount('1.234,56')).toBe(1234.56);
    expect(csvAmount('1 234,56')).toBe(1234.56);
    expect(csvAmount('(12.50)')).toBe(-12.5);
    expect(csvAmount('12.50-')).toBe(-12.5);
    expect(csvAmount('-$12.50')).toBe(-12.5);
    expect(csvAmount('$-12.50')).toBe(-12.5);
    expect(csvAmount('12.50 CR')).toBe(12.5);
    expect(csvAmount('12.50 DR')).toBe(-12.5);
    expect(csvAmount('¥1,200')).toBe(1200);
    expect(csvAmount('1200')).toBe(1200);
    expect(csvAmount('12,5')).toBe(12.5);
    expect(csvAmount('')).toBeNull();
    expect(csvAmount('n/a')).toBeNull();
    expect(csvAmount('2026-03-05')).toBeNull();
  });
  it('rewrites compact and hyphenated dates so the date reader sees them', () => {
    expect(normalizeCsvDate('20260305')).toBe('2026-03-05');
    expect(normalizeCsvDate('05-Mar-2026')).toBe('05 Mar 2026');
    expect(normalizeCsvDate('Mar-05-2026')).toBe('Mar 05, 2026');
    expect(normalizeCsvDate('2026-03-05 09:12:33')).toBe('2026-03-05');
    expect(normalizeCsvDate('2026-03-05T09:12:33Z')).toBe('2026-03-05');
    expect(normalizeCsvDate('03/05/2026')).toBe('03/05/2026');
  });
});

describe('US bank and card exports', () => {
  const CHASE = `Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #
DEBIT,03/05/2026,BLUE BOTTLE COFFEE SEATTLE WA,-4.50,DEBIT_CARD,2130.22,
DEBIT,03/06/2026,SHELL OIL 57444 REDMOND WA,-48.10,DEBIT_CARD,2082.12,
CREDIT,03/06/2026,PAYROLL ACME CORP DIR DEP,2150.00,ACH_CREDIT,4232.12,
DEBIT,03/07/2026,Online Transfer to SAV ...4821 transaction#: 1234,-500.00,ACCT_XFER,3732.12,
DEBIT,03/09/2026,NETFLIX.COM,-15.49,DEBIT_CARD,3716.63,`;
  it('reads a Chase checking export: signs, a credit/debit column, a running balance', () => {
    const p = read(CHASE, 'en', undefined, 'US');
    expect(p.lines).toHaveLength(5);
    const l = by(p);
    expect(l['Blue Bottle Coffee Seattle']).toMatchObject({ direction: 'out', amount: 4.5, date: '2026-03-05', categoryId: 'dining' });
    expect(l['Payroll Acme Corp']).toMatchObject({ direction: 'in', amount: 2150, categoryId: 'salary' });
    expect(p.lines.find((x) => x.amount === 500)).toMatchObject({ kind: 'transfer', include: false });
    expect(l['Netflix']).toMatchObject({ categoryId: 'subscriptions' });
    expect(p.period).toEqual({ start: '2026-03-05', end: '2026-03-09' });
    expect(JSON.stringify(p)).not.toMatch(/4821|1234/);
  });
  it('reads a Bank of America export with a "Running Bal." column and month-first dates', () => {
    const csv = `Date,Description,Amount,Running Bal.
03/02/2026,WHOLEFDS SEA 10101 SEATTLE WA,"-86.21","1,200.00"
03/03/2026,Zelle payment from JOHN SMITH,"40.00","1,240.00"`;
    const l = by(read(csv, 'en', undefined, 'US'));
    expect(l['Wholefds Sea Seattle']).toMatchObject({ direction: 'out', amount: 86.21, categoryId: 'groceries', date: '2026-03-02' });
    expect(Object.values(l).find((x) => x.direction === 'in')).toMatchObject({ amount: 40 });
  });
  it('reads an Amex export where a plus is spending and the payment is negative', () => {
    const csv = `Date,Description,Amount
03/04/2026,UBER *TRIP HELP.UBER.COM,23.40
03/05/2026,STARBUCKS STORE 12345,6.75
03/06/2026,AUTOPAY PAYMENT - THANK YOU,-250.00
03/08/2026,AMAZON.COM,42.99`;
    const p = read(csv, 'en', undefined, 'US');
    const l = by(p);
    expect(Object.values(l).find((x) => x.amount === 23.4)).toMatchObject({ direction: 'out', categoryId: 'transport' });
    expect(l['Starbucks Store']).toMatchObject({ direction: 'out', amount: 6.75 });
    expect(p.lines.find((x) => x.amount === 250)).toMatchObject({ direction: 'in', include: false });
    expect(p.lines.filter((x) => x.direction === 'out')).toHaveLength(3);
  });
  it('reads a Capital One export with Debit and Credit columns and never keeps the card number', () => {
    const csv = `Transaction Date,Posted Date,Card No.,Description,Category,Debit,Credit
2026-03-05,2026-03-06,4821,TRADER JOE'S #123,Merchandise,54.32,
2026-03-07,2026-03-08,4821,CAPITAL ONE AUTOPAY PYMT,Payment/Credit,,300.00`;
    const p = read(csv);
    const l = by(p);
    expect(l["Trader Joe's"]).toMatchObject({ direction: 'out', amount: 54.32, date: '2026-03-05' });
    expect(l['Capital One Autopay Pymt']).toMatchObject({ direction: 'in', amount: 300 });
    expect(JSON.stringify(p)).not.toMatch(/4821/);
  });
  it('reads a headerless Wells Fargo export from the shape of its columns', () => {
    const csv = `"03/05/2026","-4.50","*","","BLUE BOTTLE COFFEE SEATTLE WA"
"03/06/2026","-48.10","*","","SHELL OIL 57444 REDMOND WA"
"03/06/2026","2150.00","*","","PAYROLL ACME CORP"`;
    const p = read(csv, 'en', undefined, 'US');
    expect(p.lines).toHaveLength(3);
    expect(by(p)['Payroll Acme Corp']).toMatchObject({ direction: 'in', amount: 2150 });
    expect(by(p)['Shell Oil Redmond']).toMatchObject({ direction: 'out', amount: 48.1 });
  });
  it('reads a YNAB-style export with Outflow and Inflow and currency signs', () => {
    const csv = `"Account","Flag","Date","Payee","Category Group/Category","Category Group","Category","Memo","Outflow","Inflow","Cleared"
"Checking","","03/05/2026","Blue Bottle","Fun: Coffee","Fun","Coffee","","$4.50","$0.00","Cleared"
"Checking","","03/06/2026","Acme Corp","Inflow: Ready to Assign","Inflow","Ready to Assign","","$0.00","$2,150.00","Cleared"`;
    const l = by(read(csv, 'en', undefined, 'US'));
    expect(l['Blue Bottle']).toMatchObject({ direction: 'out', amount: 4.5 });
    expect(l['Acme Corp']).toMatchObject({ direction: 'in', amount: 2150 });
  });
});

describe('UK and European exports', () => {
  it('reads a Monzo export: Money Out and Money In beat the signed Amount, and the time is dropped', () => {
    const csv = `Transaction ID,Date,Time,Type,Name,Emoji,Category,Amount,Currency,Local amount,Local currency,Notes and #tags,Address,Receipt,Description,Category split,Money Out,Money In
tx_0001,05/03/2026,09:12:33,Card payment,Pret A Manger,,Eating out,-4.50,GBP,-4.50,GBP,,,,PRET A MANGER LONDON,,-4.50,
tx_0002,06/03/2026,12:00:00,Faster payment,Acme Ltd,,Income,2150.00,GBP,2150.00,GBP,Salary,,,ACME LTD SALARY,,,2150.00`;
    const p = read(csv, 'en', undefined, 'GB');
    const l = by(p);
    expect(l['Pret A Manger London']).toMatchObject({ direction: 'out', amount: 4.5, date: '2026-03-05' });
    expect(l['Acme Ltd Salary']).toMatchObject({ direction: 'in', amount: 2150, date: '2026-03-06' });
  });
  it('reads a Revolut export with timestamps and a balance', () => {
    const csv = `Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance
CARD_PAYMENT,Current,2026-03-05 09:12:33,2026-03-06 10:00:00,Tesco Stores,-12.40,0.00,GBP,COMPLETED,987.60
TOPUP,Current,2026-03-07 08:00:00,2026-03-07 08:00:00,Payment from Jane Doe,100.00,0.00,GBP,COMPLETED,1087.60`;
    const l = by(read(csv, 'en', undefined, 'GB'));
    expect(l['Tesco Stores']).toMatchObject({ direction: 'out', amount: 12.4, date: '2026-03-05', categoryId: 'groceries' });
    expect(Object.values(l).find((x) => x.direction === 'in')).toMatchObject({ amount: 100 });
  });
  it('reads a German export with semicolons, a decimal comma and an IBAN column that is never kept', () => {
    const csv = `Buchungstag;Wertstellung;Verwendungszweck;Betrag;Währung;Saldo
05.03.2026;05.03.2026;REWE SAGT DANKE 12345;-45,67;EUR;1.234,56
06.03.2026;06.03.2026;GEHALT MAERZ ACME GMBH DE89370400440532013000;2.400,00;EUR;3.634,56`;
    const p = read(csv, 'de');
    const l = by(p);
    expect(l['Rewe Sagt Danke']).toMatchObject({ direction: 'out', amount: 45.67, date: '2026-03-05', categoryId: 'groceries' });
    expect(Object.values(l).find((x) => x.direction === 'in')).toMatchObject({ amount: 2400, categoryId: 'salary' });
    expect(JSON.stringify(p)).not.toMatch(/DE89|0532013000/);
  });
  it('reads a Swiss PostFinance export: Belastung and Gutschrift, with every salary and refund kept', () => {
    const csv = `Datum;Beschreibung;Belastung;Gutschrift;Saldo
01.03.2026;MIGROS ZUERICH;45.60;;1234.40
02.03.2026;COOP PRONTO;12.30;;1222.10
03.03.2026;SBB CFF FFS;8.80;;1213.30
04.03.2026;DENNER;23.10;;1190.20
05.03.2026;SWISSCOM;60.00;;1130.20
06.03.2026;APOTHEKE;15.50;;1114.70
07.03.2026;GUTSCHRIFT RUECKERSTATTUNG;;30.00;1144.70
08.03.2026;MANOR;80.00;;1064.70
09.03.2026;STARBUCKS;6.50;;1058.20
25.03.2026;GEHALT ACME AG;;5200.00;6258.20`;
    const p = read(csv, 'de');
    expect(p.lines).toHaveLength(10);
    expect(p.csvWarnings).toEqual([]);
    expect(p.warnings).not.toContain('directionGuessed');
    expect(p.lines.filter((x) => x.direction === 'in').map((x) => [x.date, x.amount, x.categoryId])).toEqual([['2026-03-07', 30, 'other_income'], ['2026-03-25', 5200, 'salary']]);
    expect(by(p)['Migros Zuerich']).toMatchObject({ direction: 'out', amount: 45.6, balance: 1234.4 });
    // Four lines or fewer: the balance column is still the balance, never the amount.
    const short = read(csv.split('\n').slice(0, 4).join('\n'), 'de');
    expect(short.lines.map((x) => [x.direction, x.amount])).toEqual([['out', 45.6], ['out', 12.3], ['out', 8.8]]);
  });
  it('reads a UBS export: three Beschreibung columns, Abschlussdatum, and the amounts in francs', () => {
    const csv = `Abschlussdatum;Buchungsdatum;Valutadatum;Währung;Belastung;Gutschrift;Saldo;Beschreibung1;Beschreibung2;Beschreibung3
2026-03-02;2026-03-02;2026-03-02;CHF;45.60;;1234.40;Kartenzahlung;MIGROS ZUERICH;Zuerich
2026-03-25;2026-03-25;2026-03-25;CHF;;5200.00;6434.40;Gutschrift;ACME AG LOHN;`;
    const p = read(csv, 'de');
    expect(p.csvWarnings).toEqual([]);
    expect(p.lines.map((x) => [x.date, x.direction, x.amount, x.categoryId])).toEqual([['2026-03-02', 'out', 45.6, 'groceries'], ['2026-03-25', 'in', 5200, 'salary']]);
  });
  it('an English header in words it does not know is dropped before the shape is read, and is not a skipped line', () => {
    const csv = `Txn Day,Narration,Paid,Received,Bal
2026-03-01,COFFEE SHOP,4.50,,100.00
2026-03-02,ACME PAYROLL,,1500.00,1600.00
2026-03-03,SHELL,40.00,,1560.00`;
    const p = read(csv);
    expect(p.csvWarnings).toEqual([]);
    expect(p.lines.map((x) => [x.direction, x.amount, x.balance])).toEqual([['out', 4.5, 100], ['in', 1500, 1600], ['out', 40, 1560]]);
  });
  it('reads a French export with separate Débit and Crédit columns in euros', () => {
    const csv = `Date;Libellé;Débit euros;Crédit euros;
05/03/2026;CARTE 04/03 CARREFOUR MARKET;45,67;;
06/03/2026;VIR SEPA SALAIRE ACME SAS;;2400,00;`;
    const l = by(read(csv, 'fr'));
    expect(Object.values(l).find((x) => x.direction === 'out')).toMatchObject({ amount: 45.67, date: '2026-03-05' });
    expect(Object.values(l).find((x) => x.direction === 'in')).toMatchObject({ amount: 2400 });
  });
  it('reads a Spanish export with Importe and Saldo', () => {
    const csv = `Fecha;Concepto;Importe;Saldo
05/03/2026;COMPRA MERCADONA;-45,67;1.234,56
06/03/2026;NOMINA ACME SL;2400,00;3.634,56`;
    const l = by(read(csv, 'es'));
    expect(l['Compra Mercadona']).toMatchObject({ direction: 'out', amount: 45.67, categoryId: 'groceries' });
    expect(l['Nomina Acme Sl']).toMatchObject({ direction: 'in', amount: 2400 });
  });
  it('reads an Italian export where Valuta is a currency column, not a second date', () => {
    const csv = `Data;Operazione;Dettagli;Conto o carta;Contabilizzazione;Categoria;Valuta;Importo
05/03/2026;Pagamento POS;ESSELUNGA MILANO;Conto;Contabilizzato;Spesa;EUR;-45,67
06/03/2026;Bonifico;STIPENDIO ACME SRL;Conto;Contabilizzato;Stipendio;EUR;2400,00`;
    const p = read(csv, 'it');
    expect(p.lines).toHaveLength(2);
    expect(p.lines.find((x) => x.direction === 'in')).toMatchObject({ amount: 2400, date: '2026-03-06' });
  });
});

describe('East Asian exports', () => {
  it('reads a Japanese export with 入金額 and 出金額 and whole-yen amounts', () => {
    const csv = `取引日,摘要,入金額,出金額,残高
2026/03/05,セブンイレブン,,"1,200","98,800"
2026/03/25,給与 カブシキガイシャエーシーエム,"250,000",,"348,800"`;
    const p = read(csv, 'ja');
    expect(p.lines).toHaveLength(2);
    expect(p.lines.find((x) => x.direction === 'out')).toMatchObject({ amount: 1200, date: '2026-03-05' });
    expect(p.lines.find((x) => x.direction === 'in')).toMatchObject({ amount: 250000, date: '2026-03-25' });
  });
  it('reads a Korean export with 출금액 and 입금액', () => {
    const csv = `거래일자,적요,출금액,입금액,잔액
2026-03-05,스타벅스 강남점,6500,,988500
2026-03-25,급여 (주)에이씨엠,,2500000,3488500`;
    const p = read(csv, 'ko');
    expect(p.lines.find((x) => x.direction === 'out')).toMatchObject({ amount: 6500 });
    expect(p.lines.find((x) => x.direction === 'in')).toMatchObject({ amount: 2500000 });
  });
  it('reads a Chinese export with 收入 and 支出', () => {
    const csv = `交易日期,交易摘要,收入,支出,余额
2026-03-05,美团外卖,,35.00,9865.00
2026-03-10,工资 ACM公司,8000.00,,17865.00`;
    const p = read(csv, 'zh');
    expect(p.lines.find((x) => x.direction === 'out')).toMatchObject({ amount: 35 });
    expect(p.lines.find((x) => x.direction === 'in')).toMatchObject({ amount: 8000 });
  });
});

describe('duplicates, skipped lines and files that are not statements', () => {
  it('flags a line already in the history and leaves it unchecked', () => {
    const csv = `Date,Description,Amount
2026-03-05,BLUE BOTTLE COFFEE SEATTLE WA,-4.50
2026-03-06,SHELL OIL 57444 REDMOND WA,-48.10`;
    const known = new Set([fingerprintOf('2026-03-06', 48.1, 'out', 'SHELL OIL 57444 REDMOND WA')]);
    const p = read(csv, 'en', known);
    expect(by(p)['Shell Oil Redmond']).toMatchObject({ duplicate: true, include: false });
    expect(p.warnings).toContain('hasDuplicates');
  });
  it('skips lines with no date or amount and says so, and refuses a file with no usable columns', () => {
    const csv = `Date,Description,Amount
2026-03-05,BLUE BOTTLE,-4.50
,Opening balance,
TOTAL,,-4.50`;
    const p = read(csv);
    expect(p.lines).toHaveLength(1);
    expect(p.csvWarnings).toContain('csvLinesSkipped');
    expect(csvToRows('Name,Email\nJane,jane@example.com', 'en', TODAY)).toMatchObject({ rows: [], warnings: ['csvNoColumns'] });
    expect(csvToRows('', 'en', TODAY).warnings).toEqual(['csvNoColumns']);
  });
  it('is never thrown off by a note row above the header', () => {
    const csv = `Account activity for Checking ...4821
Date,Description,Amount
2026-03-05,BLUE BOTTLE,-4.50`;
    const p = read(csv);
    expect(p.lines).toHaveLength(1);
    expect(JSON.stringify(p)).not.toMatch(/4821/);
  });
});

describe('decodeTextBytes', () => {
  const { decodeTextBytes } = require('../src/lib/textBytes') as typeof import('../src/lib/textBytes');
  const utf8 = (s: string) => new Uint8Array(Buffer.from(s, 'utf8'));
  it('reads UTF-8 and drops the byte-order mark', () => {
    expect(decodeTextBytes(utf8('Date,Betrag\n01.03.2026,-12,50 €'))).toBe('Date,Betrag\n01.03.2026,-12,50 €');
    expect(decodeTextBytes(new Uint8Array([0xef, 0xbb, 0xbf, ...utf8('a,b')]))).toBe('a,b');
    expect(decodeTextBytes(utf8('日付,金額\n2026/03/01,1200'))).toBe('日付,金額\n2026/03/01,1200');
  });
  it('reads an old Windows-1252 export byte for byte instead of showing replacement marks', () => {
    const bytes = new Uint8Array([...utf8('Caf'), 0xe9, ...utf8(' Lyon,-4,50')]);
    expect(decodeTextBytes(bytes)).toBe('Café Lyon,-4,50');
  });
  it('reads UTF-16 with a byte-order mark, as Excel saves it', () => {
    const le = new Uint8Array([0xff, 0xfe, ...Buffer.from('a,b', 'utf16le')]);
    expect(decodeTextBytes(le)).toBe('a,b');
  });
});

describe('exports from other budget apps keep their categories', () => {
  it('reads a YNAB register export: payee, category group/category, outflow and inflow', () => {
    const csv = `"Account","Flag","Date","Payee","Category Group/Category","Category Group","Category","Memo","Outflow","Inflow","Cleared"
"Checking","","03/02/2026","Bob's Corner Market","Everyday Expenses: Groceries","Everyday Expenses","Groceries","","$54.20","$0.00","Cleared"
"Checking","","03/03/2026","Luigi's","Fun Money: Dining Out","Fun Money","Dining Out","","$31.00","$0.00","Cleared"
"Checking","","03/05/2026","Acme Corp","Inflow: Ready to Assign","Inflow","Ready to Assign","","$0.00","$2,100.00","Cleared"`;
    const p = read(csv, 'en', undefined, 'US');
    const l = by(p);
    expect(l["Bob's Corner Market"]).toMatchObject({ direction: 'out', amount: 54.2, categoryId: 'groceries' });
    expect(l["Luigi's"]).toMatchObject({ direction: 'out', amount: 31, categoryId: 'dining' });
    expect(p.lines.find((x) => x.amount === 2100)).toMatchObject({ direction: 'in' });
  });
  it('reads a Mint export with a category column and a debit/credit type column', () => {
    const csv = `"Date","Description","Original Description","Amount","Transaction Type","Category","Account Name","Labels","Notes"
"3/04/2026","Shell","SHELL OIL 57444","40.00","debit","Gas & Fuel","Checking","",""
"3/06/2026","Paycheck","ACME CORP PAYROLL","2100.00","credit","Paycheck","Checking","",""
"3/07/2026","Corner Pharmacy","CORNER PHARM 221","12.99","debit","Pharmacy","Checking","",""`;
    const p = read(csv, 'en', undefined, 'US');
    const l = by(p);
    expect(l['Shell']).toMatchObject({ direction: 'out', amount: 40, categoryId: 'transport' });
    expect(l['Paycheck']).toMatchObject({ direction: 'in', amount: 2100 });
    expect(l['Corner Pharmacy']).toMatchObject({ direction: 'out', amount: 12.99, categoryId: 'health' });
  });
  it('reads a Goodbudget export, where the envelope is the category', () => {
    const csv = `Date,Envelope,Account,Name,Notes,Amount,Status,Details
03/02/2026,Groceries,Checking,Trader Joe's,,-62.15,CLR,
03/04/2026,Entertainment,Checking,AMC Theatres,,-28.00,CLR,`;
    const l = by(read(csv, 'en', undefined, 'US'));
    expect(l["Trader Joe's"]).toMatchObject({ direction: 'out', amount: 62.15, categoryId: 'groceries' });
    expect(l['AMC Theatres']).toMatchObject({ direction: 'out', amount: 28, categoryId: 'entertainment' });
  });
  it('a card payment seen from the bank side is a debt payment, whatever the file calls it', () => {
    const csv = `Date,Merchant,Category,Amount
2026-03-06,Chase Card Autopay Payment Thank You,Credit Card Payment,-250.00
2026-03-07,Whole Foods,Groceries,-80.00
2026-03-08,Uber,Transport,-14.00
2026-03-09,Shell,Transport,-30.00`;
    const p = read(csv, 'en', undefined, 'US');
    expect(p.lines.find((x) => x.amount === 250)).toMatchObject({ direction: 'out', categoryId: 'debt', include: true });
    expect(by(p)['Whole Foods']).toMatchObject({ categoryId: 'groceries' });
  });
});

describe('dates the description could confuse', () => {
  it('keeps a line whose description starts with a month word, dated by the number in front', () => {
    const p = read('Date,Description,Amount\n03/15/26,MAY DEPT STORE,-20.00\n03/20/26,DEC HARDWARE,-30.00\n03/18/26,COFFEE,-4.00');
    expect(p.lines.map((l) => l.date).sort()).toEqual(['2026-03-15', '2026-03-18', '2026-03-20']);
    expect(p.warnings).toEqual([]);
  });
  it("an all-ambiguous file follows the phone's region for its span as well as its lines", () => {
    const csv = 'Date,Description,Amount\n03/04/2026,A,-1.00\n05/04/2026,B,-2.00\n07/04/2026,C,-3.00';
    const gb = csvToRows(csv, 'en', TODAY, 'GB');
    expect(gb.period).toEqual({ start: '2026-04-03', end: '2026-04-07' });
    const us = csvToRows(csv, 'en', TODAY, 'US');
    expect(us.period).toEqual({ start: '2026-03-04', end: '2026-07-04' });
  });
});

describe('what was typed by hand before the import', () => {
  it('a line matching an entry already here by day, amount and direction is marked already in the history', () => {
    const csv = `Date,Description,Amount
2026-03-04,CHIPOTLE ONLINE,-12.00
2026-03-05,STARBUCKS,-4.50`;
    const c = csvToRows(csv, 'en', TODAY);
    const known = new Set(['2026-03-04|12.00|out']);
    const p = parseStatement(c.rows, ctx(), { language: 'en', region: 'US', today: TODAY, period: c.period, kind: c.kind, knownEntries: known });
    expect(p.lines.find((l) => l.amount === 12)).toMatchObject({ duplicate: true, include: false });
    expect(p.lines.find((l) => l.amount === 4.5)).toMatchObject({ duplicate: false, include: true });
    expect(c.kind).toBe('bank');
  });
});
