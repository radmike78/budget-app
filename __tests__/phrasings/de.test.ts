/**
 * German: the many everyday ways people in Germany, Austria and Switzerland say the
 * same thing to the app, casual "du" and neutral, with verb-final word order and
 * separable verbs ("ich gebe … aus"). TODAY is Wednesday 2026-09-16; the one open
 * goal is "Trip to Japan" (g1). Category names are the German ones the app shows.
 */
import { de } from '@/i18n/locales/de';
import { parseOne, runCases, type Case } from './harness';

const labels = de.s.categoryNames as Record<string, string>;
const ex = (amount: number, categoryId?: string, more: Record<string, unknown> = {}) => ({ kind: 'transaction', type: 'expense', amount, ...(categoryId ? { categoryId } : {}), ...more });
const inc = (amount: number, categoryId?: string) => ({ kind: 'transaction', type: 'income', amount, ...(categoryId ? { categoryId } : {}) });
const spent = (question: Record<string, unknown>) => ({ kind: 'question', question: { ask: 'spent', type: 'expense', ...question } });
const left = (question: Record<string, unknown>) => ({ kind: 'question', question: { ask: 'left', ...question } });
const earned = (question: Record<string, unknown>) => ({ kind: 'question', question: { ask: 'spent', type: 'income', ...question } });
const goal = (amount: number, goalKind = 'saving') => ({ kind: 'goal', amount, goalKind });
const contribution = (amount: number) => ({ kind: 'contribution', amount, goalId: 'g1' });
const reminder = { kind: 'reminder' };

const expenses: Case[] = [
  ['Ich habe 12 Euro für Mittagessen ausgegeben', ex(12, 'dining')],
  ['Mittagessen 12', ex(12, 'dining')],
  ['12 Euro Mittagessen', ex(12, 'dining')],
  ['Hab 12 fürs Mittagessen bezahlt', ex(12, 'dining')],
  ['Mittagessen hat 12 Euro gekostet', ex(12, 'dining')],
  ['Das Mittagessen hat mich 12 Euro gekostet', ex(12, 'dining')],
  ['Hab mir Mittagessen für 12 geholt', ex(12, 'dining')],
  ['Mittagessen war 12', ex(12, 'dining')],
  ['Beim Bäcker 4,50 gelassen', ex(4.5, 'groceries')],
  ['4 Euro beim Bäcker', ex(4, 'groceries')],
  ['Brötchen 3,20', ex(3.2, 'groceries')],
  ['Einkauf bei Rewe 85', ex(85, 'groceries')],
  ['Wocheneinkauf 85 Euro', ex(85, 'groceries')],
  ['Lebensmittel für 85 eingekauft', ex(85, 'groceries')],
  ['Bei Aldi 85 Euro gelassen', ex(85, 'groceries')],
  ['Hab für 40 Euro getankt', ex(40, 'transport')],
  ['Getankt 40', ex(40, 'transport')],
  ['Tanken 40 Euro', ex(40, 'transport')],
  ['40 Euro Sprit', ex(40, 'transport')],
  ['Für 40 vollgetankt', ex(40, 'transport')],
  ['Netflix hat 15,99 abgebucht', ex(15.99, 'subscriptions')],
  ['Stromrechnung 120 bezahlt', ex(120, 'utilities')],
  ['Strom 120', ex(120, 'utilities')],
  ['Miete 1500 überwiesen', ex(1500, 'rent')],
  ['Habe die Miete bezahlt, 1500', ex(1500, 'rent')],
  ['Kaffee 3,50', ex(3.5, 'dining')],
  ['Ein Kaffee für drei fünfzig', ex(3.5, 'dining')],
  ['Gestern 23 Euro für ein Uber ausgegeben', ex(23, 'transport', { occurredAt: '2026-09-15' })],
  ['Abendessen gestern Abend 60', ex(60, 'dining', { occurredAt: '2026-09-15' })],
  ['200 Euro für Schuhe verprasst', ex(200, 'shopping')],
  ['200 für neue Schuhe rausgehauen', ex(200, 'shopping')],
  ['Hab mir Schuhe für 200 gegönnt', ex(200, 'shopping')],
  ['300 für die Autoreparatur', ex(300, 'transport')],
  ['Werkstatt 300 Euro', ex(300, 'transport')],
  ['Kinokarten 30', ex(30, 'entertainment')],
  ['Kino 30', ex(30, 'entertainment')],
  ['Lieferando 35', ex(35, 'dining')],
  ['Essen bestellt für 35', ex(35, 'dining')],
  ['Zuzahlung beim Arzt 10', ex(10, 'health')],
  ['Apotheke 15', ex(15, 'health')],
  ['Handyrechnung 80', ex(80, 'utilities')],
  ['Kreditkartenrechnung 200 bezahlt', ex(200, 'debt')],
  ['Kreditrate 350', ex(350, 'debt')],
  ['Friseur 40', ex(40)],
  ['Hundert Euro für Lebensmittel', ex(100, 'groceries')],
  ['Fünfzehn Euro fürs Parken', ex(15, 'transport')],
  ['20 Euro für Getränke', ex(20, 'dining')],
  ['Bier 24', ex(24, 'dining')],
  ['Spotify 11,99', ex(11.99, 'subscriptions')],
  ['Amazon Bestellung 64', ex(64, 'shopping')],
  ['Döner 7', ex(7, 'dining')],
  ['Schnell nen Döner für 7 geholt', ex(7, 'dining')],
  ['Deutschlandticket 58', ex(58, 'transport')],
  ['Zugticket nach Berlin 39', ex(39, 'transport')],
  ['Bahnfahrt 39', ex(39, 'transport')],
  ['Fitnessstudio 30 abgebucht', ex(30, 'health')],
  ['dm 12', ex(12, 'shopping')],
  ['Tierarzt 80', ex(80, 'health')],
  ['Für Pizza 18 Euro gezahlt', ex(18, 'dining')],
  ['60 Euro im Restaurant gelassen', ex(60, 'dining')],
  ['Zahnarzt hat 120 gekostet', ex(120, 'health')],
  ['Hab 50 Euro für Klamotten geshoppt', ex(50, 'shopping')],
  ['Mittagessen in der Mensa 4,20', ex(4.2, 'dining')],
  ['Parkhaus 6 Euro', ex(6, 'transport')],
  ['Konzertkarten 90', ex(90, 'entertainment')],
  ['Ich gebe 12 Euro für Mittagessen aus', ex(12, 'dining')],
  // Austria
  ['Jause 6', ex(6, 'dining')],
  ['Semmeln 3', ex(3, 'groceries')],
  ['Billa 45', ex(45, 'groceries')],
  ['Beim Hofer 45 Euro eingekauft', ex(45, 'groceries')],
  ['Jahreskarte für die Öffis 365', ex(365, 'transport')],
  // Switzerland
  ['Hab 5 Franken für einen Kaffee bezahlt', ex(5, 'dining')],
  ['Kafi 4.50', ex(4.5, 'dining')],
  ['Migros 60', ex(60, 'groceries')],
  ['Coop 60 Franken', ex(60, 'groceries')],
  ['Zugbillett nach Bern 24.80', ex(24.8, 'transport')],
];

const incomes: Case[] = [
  ['Gehalt bekommen 2400', inc(2400, 'salary')],
  ['Gehalt ist da, 2400', inc(2400, 'salary')],
  ['Lohn 2400', inc(2400, 'salary')],
  ['Der Lohn ist eingegangen, 2400', inc(2400, 'salary')],
  ['2400 Gehalt', inc(2400, 'salary')],
  ['Habe 2400 Gehalt bekommen', inc(2400, 'salary')],
  ['Zahltag 2400', inc(2400, 'salary')],
  ['2400 Lohn ist reingekommen', inc(2400, 'salary')],
  ['Gehalt wurde überwiesen, 2400', inc(2400, 'salary')],
  ['Weihnachtsgeld 1200', inc(1200, 'salary')],
  ['Habe 300 mit Freelancing verdient', inc(300, 'freelance')],
  ['300 von einem Kunden bekommen', inc(300, 'freelance')],
  ['Fahrrad für 150 verkauft', inc(150)],
  ['Alte Lampe auf Kleinanzeigen für 50 vertickt', inc(50)],
  ['100 von Mama bekommen', inc(100, 'gift_income')],
  ['Mama hat mir 100 gegeben', inc(100)],
  ['100 zum Geburtstag bekommen', inc(100, 'gift_income')],
  ['Erstattung von Amazon 30', inc(30)],
  ['Tom hat mir 40 zurückgezahlt', inc(40)],
  ['Tom hat mir 40 überwiesen', inc(40)],
  ['85 Trinkgeld bekommen', inc(85)],
  // A bare "Trinkgeld" is one given, at the table; "bekommen" makes it income.
  ['Trinkgeld 85 heute', ex(85, 'dining')],
  ['Bonus 500', inc(500)],
  ['Steuererstattung 900', inc(900)],
  ['900 vom Finanzamt zurückbekommen', inc(900)],
  ['Kindergeld 250', inc(250)],
  ['50 Euro Cashback bekommen', inc(50)],
  ['Rente ist da, 1100', inc(1100)],
];

const spendingQuestions: Case[] = [
  ['Wie viel habe ich für Kaffee ausgegeben?', spent({ target: 'Kaffee', fallbackCategoryId: 'dining' })],
  ['Was habe ich diese Woche für Kaffee ausgegeben?', spent({ target: 'Kaffee', period: 'week' })],
  ['Wie viel ging für Kaffee drauf?', spent({ target: 'Kaffee' })],
  ['Was haben mich Lebensmittel diesen Monat gekostet?', spent({ categoryId: 'groceries', period: 'month' })],
  ['Wie viel haben Lebensmittel diesen Monat gekostet?', spent({ categoryId: 'groceries', period: 'month' })],
  ['Ausgaben für Sprit diesen Monat', spent({ target: 'Sprit', period: 'month', fallbackCategoryId: 'transport' })],
  ['Wie viel wurde für Essen gehen ausgegeben?', spent({ categoryId: 'dining' })],
  ['Was habe ich bisher ausgegeben?', spent({ target: null })],
  ['Ausgaben für Kaffee diese Woche', spent({ target: 'Kaffee', period: 'week' })],
  ['Wie viel Geld habe ich letzte Woche ausgegeben?', spent({ target: null, period: 'lastWeek' })],
  ['Wie viel für Uber diesen Monat?', spent({ target: 'Uber', period: 'month' })],
  ['Wie viel Kaffee diese Woche?', spent({ target: 'Kaffee', period: 'week' })],
  ['Summe Kaffee diesen Monat', spent({ target: 'Kaffee', period: 'month' })],
  ['Kaffee gesamt diesen Monat', spent({ target: 'Kaffee', period: 'month' })],
  ['Wie viel habe ich für Essen auswärts verprasst?', spent({ target: 'Essen auswärts' })],
  ['Sag mir, wie viel ich für Sprit ausgegeben habe', spent({ target: 'Sprit' })],
  ['Wie viel gebe ich für Kaffee aus?', spent({ target: 'Kaffee' })],
  ['Wie viel habe ich bei Rewe ausgegeben?', spent({ target: 'Rewe' })],
  ['Wie viel ist für Lebensmittel draufgegangen?', spent({ categoryId: 'groceries' })],
  ['Wie viel habe ich heute ausgegeben?', spent({ target: null, period: 'today' })],
  ['Was habe ich gestern ausgegeben?', spent({ target: null, period: 'yesterday' })],
  ['Wie hoch sind meine Ausgaben diesen Monat?', spent({ target: null, period: 'month' })],
  ['Meine Ausgaben diesen Monat', spent({ target: null, period: 'month' })],
  ['Was hat mich Essen gehen gekostet?', spent({ categoryId: 'dining' })],
  ['Wie viel habe ich seit dem Zahltag ausgegeben?', spent({ target: null, period: 'budget' })],
  ['Wie viel habe ich seit dem letzten Gehalt ausgegeben?', spent({ target: null, period: 'budget' })],
  ['Ausgaben in dieser Gehaltsperiode', spent({ target: null, period: 'budget' })],
  ['Wie viel habe ich seit Monatsanfang ausgegeben?', spent({ target: null, period: 'month' })],
  ['Hab ich viel für Kaffee ausgegeben?', spent({ target: 'Kaffee' })],
  ['Wie viel Geld ist diesen Monat für Sprit weg?', spent({ target: 'Sprit', period: 'month' })],
  ['Wie viel habe ich für Freizeit ausgegeben?', spent({ categoryId: 'entertainment' })],
  ['Was haben mich die Abos gekostet?', spent({ categoryId: 'subscriptions' })],
  ['Wie viel habe ich letztes Jahr für Urlaub ausgegeben?', spent({ target: 'Urlaub', period: 'lastYear' })],
  ['Wie viel ging letzten Monat für Miete drauf?', spent({ categoryId: 'rent', period: 'lastMonth' })],
  ['Was gebe ich so im Monat für Essen aus?', spent({ categoryIds: ['groceries', 'dining'], period: 'month' })],
  ['Wieviel hab ich für Sprit gezahlt?', spent({ target: 'Sprit' })],
  ['Was ging diese Woche fürs Essen drauf?', spent({ categoryIds: ['groceries', 'dining'], period: 'week' })],
  ['Wie viel hab ich diese Gehaltsperiode ausgegeben?', spent({ target: null, period: 'budget' })],
  ['Wie viel habe ich ausgegeben, seit ich Gehalt bekommen habe?', spent({ target: null, period: 'budget' })],
  ['Wie viel habe ich für Lebensmittel ausgegeben?', spent({ categoryId: 'groceries', periodDefaulted: true })],
  ['Was hat mich Starbucks diese Woche gekostet?', spent({ target: 'Starbucks', period: 'week' })],
  ['Was kostet mich der Sprit im Monat?', spent({ target: 'Sprit', period: 'month' })],
  ['Wie viel kostet mich das Deutschlandticket?', spent({ target: 'Deutschlandticket', fallbackCategoryId: 'transport' })],
];

const leftQuestions: Case[] = [
  ['Wie viel habe ich noch?', left({ target: null })],
  ['Wie viel bleibt mir noch?', left({ target: null })],
  ['Was ist noch übrig für Lebensmittel?', left({ categoryId: 'groceries' })],
  ['Wie viel kann ich noch ausgeben?', left({ target: null })],
  ['Liege ich im Budget?', left({ target: null })],
  ['Bin ich noch im Budget?', left({ target: null })],
  ['Bin ich im Budget für Essen gehen?', left({ categoryId: 'dining' })],
  ['Wie sieht mein Budget aus?', left({ target: null })],
  ['Wie stehe ich diesen Monat da?', left({ target: null })],
  ['Wie viel ist noch übrig?', left({ target: null })],
  ['Was bleibt bis zum Zahltag?', left({ target: null })],
  ['Wie viel habe ich bis zum Zahltag noch?', left({ target: null })],
  ['Wie viel Geld habe ich übrig?', left({ target: null })],
  ['Wie viel kann ich heute noch ausgeben?', left({ target: null })],
  ['Was kann ich noch für Essen gehen ausgeben?', left({ categoryId: 'dining' })],
  ['Wie viel ist noch im Lebensmittel-Budget?', left({ categoryId: 'groceries' })],
  ['Wie viel Budget habe ich noch für Lebensmittel?', left({ categoryId: 'groceries' })],
  ['Was ist mein Restbudget?', left({ target: null })],
  ['Wie viel ist noch frei für Freizeit?', left({ categoryId: 'entertainment' })],
  ['Ist noch was übrig für Essen gehen?', left({ categoryId: 'dining' })],
  ['Hab ich noch Geld für Essen gehen?', left({ categoryId: 'dining' })],
  ['Wie viel darf ich diese Woche noch ausgeben?', left({ target: null })],
  ['Wie ist mein Kontostand?', left({ target: null })],
  ['Wie viel Geld habe ich?', left({ target: null })],
  ['Sag mir, wie viel ich noch habe', left({ target: null })],
  ['Wie viel kann ich bis zum Zahltag noch ausgeben?', left({ target: null })],
  ['Wie läuft es mit dem Budget?', left({ target: null })],
  ['Was ist im Budget für Lebensmittel noch drin?', left({ categoryId: 'groceries' })],
  ['Wie viel habe ich noch für Essen?', left({ categoryIds: ['groceries', 'dining'] })],
  ['Was bleibt mir diesen Monat?', left({ target: null })],
  ['Reicht das Geld bis zum Zahltag?', left({ target: null })],
  ['Wie viel ist im Budget für Lebensmittel übrig?', left({ categoryId: 'groceries' })],
];

const incomeQuestions: Case[] = [
  ['Wie viel habe ich diesen Monat verdient?', earned({ period: 'month' })],
  ['Was habe ich letzten Monat verdient?', earned({ period: 'lastMonth' })],
  ['Wie viel Einkommen diesen Monat?', earned({ period: 'month' })],
  ['Wie viel kam diese Woche rein?', earned({ period: 'week' })],
  ['Was ist mein Einkommen diesen Monat?', earned({ period: 'month' })],
  ['Wie viel habe ich dieses Jahr mit Freelancing verdient?', earned({ period: 'year' })],
  ['Einnahmen diesen Monat', earned({ period: 'month' })],
  ['Wie viel Gehalt habe ich bekommen?', earned({})],
  ['Wie viel habe ich diesen Monat eingenommen?', earned({ period: 'month' })],
  ['Wie viel Geld ist diesen Monat reingekommen?', earned({ period: 'month' })],
  ['Wie hoch waren meine Einnahmen letzten Monat?', earned({ period: 'lastMonth' })],
];

const goals: Case[] = [
  ['Ich will 3000 für eine Reise sparen', goal(3000)],
  ['Ich möchte bis Juni 3000 für Japan sparen', goal(3000)],
  ['Sparziel 3000 für Japan', goal(3000)],
  ['Ziel: 3000 für ein Auto', goal(3000)],
  ['Ich spare auf ein Auto, 5000', goal(5000)],
  ['Ich will 1000 für Notfälle zurücklegen', goal(1000)],
  ['Neues Sparziel: 1200 für einen Laptop', goal(1200)],
  ['Ich muss bis Dezember 500 für Weihnachten sparen', goal(500)],
  ['Hilf mir, 2000 für Urlaub zu sparen', goal(2000)],
  ['Ich möchte 2000 für ein neues Fahrrad auf die Seite legen', goal(2000)],
  ['Ich will 10000 als Notgroschen ansparen', goal(10000)],
  ['Ich will meine Kreditkarte abbezahlen, 2000', goal(2000, 'debt')],
  ['Ich schulde 2000 auf der Visa', goal(2000, 'debt')],
  ['Ich möchte meinen Kredit bis Ende des Jahres tilgen, 8000', goal(8000, 'debt')],
  ['Ich will den Dispo loswerden, 1500', goal(1500, 'debt')],
  ['Ich will 5000 Schulden in 12 Monaten abbezahlen', goal(5000, 'debt')],
  ['Ich habe 3000 Schulden auf der Kreditkarte und will sie abbezahlen', goal(3000, 'debt')],
];

const contributions: Case[] = [
  ['100 für Japan zurückgelegt', contribution(100)],
  ['Ich habe 100 für Japan gespart', contribution(100)],
  ['100 in die Japan Kasse gelegt', contribution(100)],
  ['Habe 100 aufs Japan Sparkonto überwiesen', contribution(100)],
  ['100 aufs Sparkonto für Japan überwiesen', contribution(100)],
  ['100 zum Japan Ziel hinzugefügt', contribution(100)],
  ['100 Euro für Japan auf die Seite gelegt', contribution(100)],
  ['100 für den Trip nach Japan gespart', contribution(100)],
  ['100 in den Japan Topf gepackt', contribution(100)],
  ['100 ins Sparschwein für Japan getan', contribution(100)],
  ['100 Euro in Japan gesteckt', contribution(100)],
  ['Hab 100 für Japan beiseitegelegt', contribution(100)],
];

const reminders: Case[] = [
  ['Erinnere mich am 1. daran, die Miete zu zahlen', reminder],
  ['Erinner mich morgen an die Stromrechnung', reminder],
  ['Denk dran, am 1. die Miete zu zahlen', reminder],
  ['Lass mich nicht vergessen, die Miete zu zahlen', reminder],
  ['Sag mir Bescheid am Freitag wegen der Kfz-Versicherung', reminder],
  ['Kannst du mich morgen an die Miete erinnern?', reminder],
  ['Erinnerung: Visa-Rechnung am 15. bezahlen', reminder],
  ['Erinnere mich jeden Freitag, die Belege einzutragen', reminder],
  ['Erinnere mich morgen um 9, das Budget zu checken', reminder],
  ['Stell mir eine Erinnerung für den 1., Miete zahlen', reminder],
  ['Nicht vergessen: Miete am 1. überweisen', reminder],
  ['Erinnere mich in zwei Wochen, die Kündigung abzuschicken', reminder],
  ['Gib mir morgen Bescheid wegen der Handyrechnung', reminder],
  ['Bitte erinnere mich am Monatsende ans Sparen', reminder],
];

// Near misses: an amount keeps a sentence an entry, and a loose word does not turn it into something else.
const staysAnEntry: Case[] = [
  ['Ausgaben 50 für Kaffee', ex(50, 'dining')],
  ['Kaffee 4 gesamt', ex(4, 'dining')],
  ['Die Stromrechnung ist da, 120', ex(120, 'utilities')],
  ['Miete wurde überwiesen, 1500', ex(1500, 'rent')],
  ['Ich schulde Tom 20 Euro', { kind: 'transaction', amount: 20 }],
  ['Einnahmen 50 vom Flohmarkt', inc(50)],
  ['Blumen zum Geburtstag 30', ex(30, 'shopping')],
  ['Flug nach Japan für 800 gebucht', ex(800, 'transport')],
  ['Ich will bis Juni 2000 Euro sparen', goal(2000)],
];

describe('German phrasings: expenses', () => runCases('de', expenses, labels));
describe('German phrasings: income', () => runCases('de', incomes, labels));
describe('German phrasings: spending questions', () => runCases('de', spendingQuestions, labels));
describe('German phrasings: what is left', () => runCases('de', leftQuestions, labels));
describe('German phrasings: income questions', () => runCases('de', incomeQuestions, labels));
describe('German phrasings: goals', () => runCases('de', goals, labels));
describe('German phrasings: contributions', () => runCases('de', contributions, labels));
describe('German phrasings: reminders', () => runCases('de', reminders, labels));
describe('German phrasings: stays an entry', () => runCases('de', staysAnEntry, labels));

// Fixing the last entry by voice. Only the new amount, category or date may follow the lead; anything else is a new entry.
const fix = (correction: Record<string, unknown>) => ({ kind: 'correction', correction: { remove: false, ...correction } });
const removeLast = { kind: 'correction', correction: { remove: true, amount: null, categoryId: null, date: null } };
const corrections: Case[] = [
  // a new amount
  ['Eigentlich waren es 14', fix({ amount: 14, categoryId: null, date: null })],
  ['Eigentlich war es 14 Euro', fix({ amount: 14 })],
  ['Eigentlich 14', fix({ amount: 14 })],
  ['Eigentlich warens 14,50', fix({ amount: 14.5 })],
  ['Eigentlich waren es vierzehn', fix({ amount: 14 })],
  ['Das waren eigentlich 14 Euro', fix({ amount: 14 })],
  ['Es waren eigentlich 14', fix({ amount: 14 })],
  ['Nein, 14', fix({ amount: 14 })],
  ['Nee, 14', fix({ amount: 14 })],
  ['Sorry, 14', fix({ amount: 14 })],
  ['Ups, 14,50', fix({ amount: 14.5 })],
  ['Hoppla, 14 Euro', fix({ amount: 14 })],
  ['Nei, 14 Franken', fix({ amount: 14 })],
  ['Mach 14 draus', fix({ amount: 14 })],
  ['Mach 14 Euro daraus', fix({ amount: 14 })],
  ['Mach daraus 14', fix({ amount: 14 })],
  ['Mach das 14', fix({ amount: 14 })],
  ["Mach's 14", fix({ amount: 14 })],
  ['Ändere das auf 14', fix({ amount: 14 })],
  ['Ändere den Betrag auf 14', fix({ amount: 14 })],
  ['Änder das mal auf 14 Euro', fix({ amount: 14 })],
  ['Korrigier das auf 14', fix({ amount: 14 })],
  ['Korrigiere auf 14', fix({ amount: 14 })],
  ['Setz den Betrag auf 14', fix({ amount: 14 })],
  ['Stell das auf 14', fix({ amount: 14 })],
  ['Kannst du das auf 14 ändern?', fix({ amount: 14 })],
  ['Das sollte 14 sein', fix({ amount: 14 })],
  ['Das sollten 14 Euro sein', fix({ amount: 14 })],
  ['Das muss 14 heißen', fix({ amount: 14 })],
  ['Der Betrag ist 14', fix({ amount: 14 })],
  ['Der richtige Betrag wäre 14', fix({ amount: 14 })],
  ['Richtig wäre 14', fix({ amount: 14 })],
  ['Korrektur: 14', fix({ amount: 14 })],
  ['Ich meinte 15', fix({ amount: 15 })],
  ['Meinte 15', fix({ amount: 15 })],
  ['Ich meinte natürlich 15', fix({ amount: 15 })],
  ['Ich wollte sagen 15', fix({ amount: 15 })],
  ['Ich hab mich vertan, 15', fix({ amount: 15 })],
  ['Nicht 12, sondern 14', fix({ amount: 14 })],
  ['Nein, nicht 12 sondern 14', fix({ amount: 14 })],
  ['Das stimmt nicht, 14', fix({ amount: 14 })],
  // a new category
  ['Pack das zu Lebensmittel', fix({ categoryId: 'groceries', amount: null })],
  ['Pack das zu den Lebensmitteln', fix({ categoryId: 'groceries' })],
  ['Pack das unter Freizeit', fix({ categoryId: 'entertainment' })],
  ['Tu das zu Essen gehen', fix({ categoryId: 'dining' })],
  ['Ändere die Kategorie auf Lebensmittel', fix({ categoryId: 'groceries' })],
  ['Ändere das in Mobilität', fix({ categoryId: 'transport' })],
  ['Mach das zu Lebensmittel', fix({ categoryId: 'groceries' })],
  ['Mach daraus Freizeit', fix({ categoryId: 'entertainment' })],
  ['Das gehört zu Lebensmittel', fix({ categoryId: 'groceries' })],
  ['Das gehört eigentlich unter Freizeit', fix({ categoryId: 'entertainment' })],
  ['Das sollte unter Essen gehen laufen', fix({ categoryId: 'dining' })],
  ['Das läuft unter Freizeit', fix({ categoryId: 'entertainment' })],
  ['Das zählt als Freizeit', fix({ categoryId: 'entertainment' })],
  ['Das soll als Abo zählen', fix({ categoryId: 'subscriptions' })],
  ['Trag das als Freizeit ein', fix({ categoryId: 'entertainment' })],
  ['Buch das auf Lebensmittel um', fix({ categoryId: 'groceries' })],
  ['Verschieb das zu Gesundheit', fix({ categoryId: 'health' })],
  ['Das ist eigentlich Lebensmittel', fix({ categoryId: 'groceries' })],
  ['Eigentlich war das Essen gehen', fix({ categoryId: 'dining' })],
  ['Eigentlich Lebensmittel', fix({ categoryId: 'groceries' })],
  ['Ich meinte Lebensmittel', fix({ categoryId: 'groceries' })],
  ['Mach das Kaffee', fix({ categoryId: 'dining' })],
  ['Die Kategorie ist Miete', fix({ categoryId: 'rent' })],
  ['Kannst du das unter Lebensmittel verbuchen', fix({ categoryId: 'groceries' })],
  // a new date
  ['Das war gestern', fix({ date: '2026-09-15', amount: null, categoryId: null })],
  ['Nein, das war gestern', fix({ date: '2026-09-15' })],
  ['Das war vorgestern', fix({ date: '2026-09-14' })],
  ['Das war am Montag', fix({ date: '2026-09-14' })],
  ['Das war schon gestern', fix({ date: '2026-09-15' })],
  ['Eigentlich war es gestern', fix({ date: '2026-09-15' })],
  ['Ändere das Datum auf gestern', fix({ date: '2026-09-15' })],
  ['Verschieb das auf gestern', fix({ date: '2026-09-15' })],
  ['Ich meinte gestern', fix({ date: '2026-09-15' })],
  // more than one thing at once
  ['Ändere das auf 14 und Lebensmittel', fix({ amount: 14, categoryId: 'groceries' })],
  ['Eigentlich waren es 14 gestern', fix({ amount: 14, date: '2026-09-15' })],
  // remove it
  ['Lösch das', removeLast],
  ['Lösche das', removeLast],
  ['Lösch das bitte', removeLast],
  ['Bitte lösch das', removeLast],
  ['Lösch den letzten Eintrag', removeLast],
  ['Lösche bitte meinen letzten Eintrag', removeLast],
  ['Den letzten Eintrag löschen', removeLast],
  ['Letzten Eintrag bitte löschen', removeLast],
  ['Das löschen', removeLast],
  ['Löschen', removeLast],
  ['Entfern das', removeLast],
  ['Streich das', removeLast],
  ['Streich das wieder', removeLast],
  ['Nimm das wieder raus', removeLast],
  ['Nimm das zurück', removeLast],
  ['Weg damit', removeLast],
  ['Das kann weg', removeLast],
  ['Vergiss es', removeLast],
  ['Vergiss das', removeLast],
  ['Vergiss den letzten', removeLast],
  ['Mach das rückgängig', removeLast],
  ['Mach das bitte rückgängig', removeLast],
  ['Rückgängig', removeLast],
  ['Rückgängig machen', removeLast],
  ['Kommando zurück', removeLast],
  ['Ups, lösch das', removeLast],
  ['Nein, vergiss es', removeLast],
  ['Das war falsch, lösch das', removeLast],
  ['Kannst du das löschen?', removeLast],
  ['Könntest du den letzten Eintrag bitte entfernen', removeLast],
  ['Storniere die letzte Buchung', removeLast],
];

// Sentences that sound a little like a fix but are new entries (or something else).
const notCorrections: Case[] = [
  ['Eigentlich habe ich 14 für Essen ausgegeben', ex(14, 'dining')],
  ['Eigentlich hab ich 14 Euro fürs Mittagessen bezahlt', ex(14, 'dining')],
  ['Nein, ich habe 14 für Kaffee ausgegeben', ex(14, 'dining')],
  ['Das war 12 fürs Mittagessen', ex(12, 'dining')],
  ['Es war 12 für Mittagessen', ex(12, 'dining')],
  ['Das Mittagessen war 12', ex(12, 'dining')],
  ['Mach 20 aufs Sparkonto', { kind: 'transaction', amount: 20 }],
  ['Ich packe 50 in die Japan Kasse', contribution(50)],
  ['Ich lege 50 aufs Japan Ziel', contribution(50)],
  ['Lösch-Software 20', { kind: 'transaction', amount: 20 }],
  ['Farbe zum Streichen 40', { kind: 'transaction', amount: 40 }],
  ['Vergiss nicht, die Miete zu überweisen', reminder],
  ['Gestern Kino 12', ex(12, 'entertainment')],
  ['Ich habe gestern 12 für Kino ausgegeben', ex(12, 'entertainment')],
];

describe('German phrasings: corrections', () => runCases('de', corrections, labels));
describe('German phrasings: not corrections', () => runCases('de', notCorrections, labels));

// Comparing with last time, where most of the money went, and whether something fits.
const compare = (question: Record<string, unknown>) => ({ kind: 'question', question: { ask: 'compare', type: 'expense', ...question } });
const top = (question: Record<string, unknown>) => ({ kind: 'question', question: { ask: 'top', type: 'expense', ...question } });
const afford = (price: number, question: Record<string, unknown> = {}) => ({ kind: 'question', question: { ask: 'afford', period: 'budget', price, ...question } });
const insights: Case[] = [
  // compare
  ['Habe ich mehr ausgegeben als letzten Monat?', compare({ period: 'month', target: null })],
  ['Hab ich weniger ausgegeben als letzten Monat?', compare({ period: 'month', target: null })],
  ['Habe ich diesen Monat mehr ausgegeben als letzten Monat?', compare({ period: 'month', target: null })],
  ['Habe ich diese Woche mehr ausgegeben als letzte Woche?', compare({ period: 'week', target: null })],
  ['Gebe ich mehr oder weniger aus als letzte Woche?', compare({ period: 'week', target: null })],
  ['Gebe ich mehr aus als sonst?', compare({ period: 'month', target: null })],
  ['Gebe ich diesen Monat weniger aus als im Vormonat?', compare({ period: 'month', target: null })],
  ['Wie stehe ich im Vergleich zum letzten Monat?', compare({ period: 'month', target: null })],
  ['Wie stehe ich im Vergleich zum Vormonat?', compare({ period: 'month', target: null })],
  ['Wie steh ich im Vergleich zur letzten Woche?', compare({ period: 'week', target: null })],
  ['Wie sieht diese Woche im Vergleich zur letzten aus?', compare({ period: 'week', target: null })],
  ["Wie sieht's dieses Jahr im Vergleich zum Vorjahr aus?", compare({ period: 'year', target: null })],
  ['Wie schneide ich im Vergleich zum letzten Monat ab?', compare({ period: 'month', target: null })],
  ['Ausgaben im Vergleich zum Vormonat', compare({ period: 'month', target: null })],
  ['Vergleich mit letztem Monat', compare({ period: 'month', target: null })],
  ['Wie viel mehr habe ich diese Woche ausgegeben als letzte Woche?', compare({ period: 'week', target: null })],
  ['Um wie viel weniger habe ich diesen Monat ausgegeben?', compare({ period: 'month', target: null })],
  ['Sind meine Ausgaben diesen Monat gestiegen?', compare({ period: 'month', target: null })],
  ['Sind meine Ausgaben gesunken?', compare({ period: 'month', target: null })],
  ['War ich diesen Monat sparsamer als letzten Monat?', compare({ period: 'month', target: null })],
  ['Habe ich seit dem Zahltag mehr ausgegeben als sonst?', compare({ period: 'budget', target: null })],
  ['Gebe ich mehr fürs Essen gehen aus als letzten Monat?', compare({ period: 'month', categoryId: 'dining' })],
  ['Habe ich mehr für Essen gehen ausgegeben als letzten Monat?', compare({ period: 'month', categoryId: 'dining' })],
  ['Habe ich weniger für Lebensmittel ausgegeben als letzte Woche?', compare({ period: 'week', categoryId: 'groceries' })],
  ['Gebe ich mehr für Essen aus als letzten Monat?', compare({ period: 'month', categoryIds: ['groceries', 'dining'] })],
  ['Hab ich bei Rewe mehr gelassen als letzten Monat?', compare({ period: 'month', target: 'Rewe' })],
  // top
  ['Wofür habe ich am meisten ausgegeben?', top({ target: null })],
  ['Wofür hab ich das meiste Geld ausgegeben?', top({ target: null })],
  ['Wofür gebe ich diesen Monat am meisten aus?', top({ period: 'month', periodDefaulted: false, target: null })],
  ['Wofür habe ich letzten Monat am meisten ausgegeben?', top({ period: 'lastMonth', target: null })],
  ['Wo habe ich am meisten Geld gelassen?', top({ target: null })],
  ['Wo gebe ich am meisten aus?', top({ target: null })],
  ['Wo ist das meiste Geld hingegangen?', top({ target: null })],
  ['Wo ist mein Geld hin?', top({ target: null })],
  ['Wohin ist mein ganzes Geld letzten Monat gegangen?', top({ period: 'lastMonth', target: null })],
  ['Wo ging das meiste Geld diese Woche hin?', top({ period: 'week', target: null })],
  ['Wofür geht das meiste Geld drauf?', top({ target: null })],
  ['Was ist meine größte Ausgabe?', top({ target: null })],
  ['Was ist mein größter Posten diesen Monat?', top({ period: 'month', target: null })],
  ['Was war letzte Woche meine größte Ausgabe?', top({ period: 'lastWeek', target: null })],
  ['Welche ist meine teuerste Kategorie?', top({ target: null })],
  ['Meine größten Ausgaben diesen Monat', top({ period: 'month', target: null })],
  ['Was frisst am meisten Geld?', top({ target: null })],
  ['Was kostet mich am meisten?', top({ target: null })],
  ['Was ist mein größter Geldfresser?', top({ target: null })],
  ['Top-Ausgaben dieses Jahr', top({ period: 'year', target: null })],
  // afford
  ['Kann ich mir eine Jacke für 200 leisten?', afford(200, { target: 'Jacke', fallbackCategoryId: 'shopping' })],
  ['Kann ich mir eine Jacke für 200 Euro leisten?', afford(200, { target: 'Jacke', fallbackCategoryId: 'shopping' })],
  ['Kann ich 80 fürs Abendessen ausgeben?', afford(80, { target: 'Abendessen', fallbackCategoryId: 'dining' })],
  ['Kann ich heute noch 80 fürs Abendessen ausgeben?', afford(80, { fallbackCategoryId: 'dining' })],
  ['Reicht es für einen Laptop für 1200?', afford(1200, { target: 'Laptop', fallbackCategoryId: 'shopping' })],
  ['Reicht das Geld für einen Laptop für 1200 Euro?', afford(1200, { target: 'Laptop' })],
  ['Ist es okay, 50 für Lebensmittel auszugeben?', afford(50, { categoryId: 'groceries' })],
  ['Ist es ok, 50 für Lebensmittel auszugeben?', afford(50, { categoryId: 'groceries' })],
  ['Wäre es in Ordnung, 50 für Lebensmittel auszugeben?', afford(50, { categoryId: 'groceries' })],
  ['Ist ein Abendessen für 80 drin?', afford(80, { target: 'Abendessen', fallbackCategoryId: 'dining' })],
  ['Sind 80 fürs Abendessen okay?', afford(80, { fallbackCategoryId: 'dining' })],
  ['Darf ich 50 für Kino ausgeben?', afford(50, { fallbackCategoryId: 'entertainment' })],
  ['Kann ich mir für 1200 einen Laptop kaufen?', afford(1200, { target: 'Laptop' })],
  ['Kann ich mir noch 30 für Sushi gönnen?', afford(30, { fallbackCategoryId: 'dining' })],
  ['Können wir uns einen Urlaub für 2000 leisten?', afford(2000, { target: 'Urlaub' })],
  ['Hab ich genug für ein Konzertticket für 80?', afford(80, { fallbackCategoryId: 'entertainment' })],
  ['Habe ich noch genug Geld für Schuhe für 120?', afford(120, { target: 'Schuhe', fallbackCategoryId: 'shopping' })],
  ['Geht sich eine Jacke für 200 aus?', afford(200, { target: 'Jacke' })],
  ['Liegt ein Laptop für 1200 drin?', afford(1200, { target: 'Laptop' })],
  ['Passt ein Laptop für 1200 noch ins Budget?', afford(1200, { target: 'Laptop' })],
  ['Kann ich 200 ausgeben?', afford(200, { target: null })],
  // no amount: what is left
  ['Kann ich mir Essen gehen leisten?', left({ categoryId: 'dining' })],
  ['Kann ich mir das leisten?', left({ target: null })],
  ['Kann ich mir noch was leisten?', left({})],
  ['Reicht es noch für Lebensmittel?', left({ categoryId: 'groceries' })],
  ['Geht sich das noch aus?', left({ target: null })],
  ['Hab ich noch genug Geld?', left({ target: null })],
];

// Entries near those words stay entries: an amount without a question lead is something bought.
const insightsStayEntries: Case[] = [
  ['Jacke für 200 gekauft', ex(200, 'shopping')],
  ['200 für eine Jacke ausgegeben', ex(200, 'shopping')],
  ['Hab mir eine Jacke für 200 gegönnt', ex(200, 'shopping')],
  ['Mehr Kaffee 4', ex(4, 'dining')],
  ['Noch mehr Brötchen 3', ex(3, 'groceries')],
  ['Das teuerste Essen 45', ex(45, 'dining')],
  ['Mein größter Einkauf 120', { kind: 'transaction', amount: 120 }],
  ['Laptop 1200', ex(1200, 'shopping')],
  ['Habe 50 mehr für Lebensmittel ausgegeben', ex(50, 'groceries')],
  ['Abendessen 80, war okay', ex(80, 'dining')],
  ['Kaffee 4 im Vergleich zu gestern teuer', ex(4, 'dining')],
];

describe('German phrasings: comparing, the most, affording', () => runCases('de', insights, labels));
describe('German phrasings: entries near those words stay entries', () => runCases('de', insightsStayEntries, labels));

// Money put aside: into the savings category, or into the one open goal when it is named ("der Japan-Topf").
// An amount said per period ("200 im Monat") is a pace, so the goal's total is still asked for.
const pacedGoal = { kind: 'goal', amount: null, goalKind: 'saving' };
const putAside: Case[] = [
  ['200 zurückgelegt', ex(200, 'savings')],
  ['300 aufs Sparkonto geschoben', ex(300, 'savings')],
  ['50 gespart', ex(50, 'savings')],
  ['100 in den Notgroschen gesteckt', ex(100, 'savings')],
  ['Heute 50 auf die hohe Kante gelegt', ex(50, 'savings', { occurredAt: '2026-09-16' })],
  ['200 rübergeschoben', ex(200, 'savings')],
  ['200 aufs Tagesgeld überwiesen', ex(200, 'savings')],
  ['50 in den Sparplan eingezahlt', ex(50, 'savings')],
  ['Hab 100 in den ETF gesteckt', ex(100, 'savings')],
  ['200 Euro gespart diesen Monat', ex(200, 'savings')],
  ['Sparen 200', ex(200, 'savings')],
  ['Zurückgelegt 200', ex(200, 'savings')],
  ['100 für später beiseitegelegt', ex(100, 'savings')],
  ['100 für die Reise beiseitegelegt', { kind: 'transaction', type: 'expense', amount: 100, note: 'Reise' }],
  ['20 in den Japan-Topf getan', contribution(20)],
  ['50 Euro in die Japan Kasse geworfen', contribution(50)],
  ['200 fürs Japan Ziel zurückgelegt', contribution(200)],
  ['Hab 30 in die Japan-Reisekasse gebuttert', contribution(30)],
  ['50 ins Japan Sparschwein gesteckt', contribution(50)],
  ['Ich will 200 im Monat für ein Auto zurücklegen', { ...pacedGoal, goalName: 'Auto' }],
  ['Ich will 50 pro Woche sparen', pacedGoal],
  ['Jeden Monat 100 fürs Fahrrad zur Seite legen', { ...pacedGoal, goalName: 'Fahrrad' }],
  ['Ich möchte monatlich 150 für den Urlaub ansparen', { ...pacedGoal, goalName: 'Urlaub' }],
  ['Ich will 5000 für ein Auto zurücklegen', goal(5000)],
];

// Casual spending: slang verbs, bare nouns, Austrian and Swiss everyday words.
const casualSpending: Case[] = [
  ['40 verballert', ex(40)],
  ['200 rausgehauen', ex(200)],
  ['60 hingeblättert', ex(60)],
  ['Hab 40 verbraten', ex(40)],
  ['30 Euro verpulvert', ex(30)],
  ['Hat mich 30 gekostet', ex(30)],
  ['Beim Aldi 85 gelassen', ex(85, 'groceries')],
  ['Hab beim Rewe 60 geblecht', ex(60, 'groceries')],
  ['Vollgetankt 60', ex(60, 'transport')],
  ['Tanken 50', ex(50, 'transport')],
  ['Kaffee 3', ex(3, 'dining')],
  ['Mittag 12', ex(12, 'dining')],
  ['Strom bezahlt 80', ex(80, 'utilities')],
  ['Miete überwiesen 900', ex(900, 'rent')],
  ['Ne Runde Bier 24', ex(24, 'dining')],
  ['Dem Taxi 20 gegeben', ex(20, 'transport')],
  ['Döner 6', ex(6, 'dining')],
  ['Kita 300', ex(300, 'other_expense')],
  ['Zahnarzt 70', ex(70, 'health')],
  ['Parkschein 3', ex(3, 'transport')],
  ['Maut 8', ex(8, 'transport')],
  ['Beim Dealer 20 fürn Döner', ex(20, 'dining')],
  ['Bahnticket 49', ex(49, 'transport')],
  ['Deutschlandticket 49', ex(49, 'transport')],
  ['Pizza bestellt 22', ex(22, 'dining')],
  ['Lieferando gestern 28', ex(28, 'dining', { occurredAt: '2026-09-15' })],
  ['Gestern Abend in der Kneipe 45 gelassen', ex(45, 'dining', { occurredAt: '2026-09-15' })],
  ['Hab heute 15 für Mittagessen hingelegt', ex(15, 'dining', { occurredAt: '2026-09-16' })],
  ['Rossmann 18', ex(18, 'shopping')],
  ['Kinoabend 25', ex(25, 'entertainment')],
  ['Playstation Spiel 70', ex(70, 'entertainment')],
  ['Für die Katze Futter 20', ex(20, 'shopping')],
  ['Haftpflicht 60 abgebucht', ex(60, 'other_expense')],
  ['Rundfunkbeitrag 55', ex(55, 'utilities')],
  ['Nen Zehner Trinkgeld gegeben', ex(10)],
  ['Glühwein aufm Weihnachtsmarkt 8', ex(8, 'dining')],
  ['Leberkassemmel 3,50', ex(3.5)],
  ['Brotzeit 9', ex(9, 'dining')],
  ['Apéro mit Kollegen 35', ex(35, 'dining')],
  ['Leasingrate 320', ex(320, 'transport')],
  ['Schlüsseldienst 150, so ein Mist', ex(150, 'other_expense')],
  ['Kurz beim Bäcker 2,80', ex(2.8, 'groceries')],
];

// Two coffees for eight: a small count before a word is not the money.
const counted: Case[] = [
  ['2 Kaffee 8', ex(8, 'dining', { note: '2 Kaffee' })],
  ['3 Bier 12', ex(12, 'dining', { note: '3 Bier' })],
  ['Zwei Döner 14', ex(14, 'dining')],
  ['4 Tickets fürs Kino 48', ex(48, 'entertainment')],
  ['2 Pizzen bestellt 24', ex(24, 'dining')],
];

const moreIncome: Case[] = [
  ['Gehalt ist da 2400', inc(2400, 'salary')],
  ['Lohn gekommen 2400', inc(2400, 'salary')],
  ['Gehalt eingegangen 2400', inc(2400, 'salary')],
  ['Lohn ist drauf 2400', inc(2400, 'salary')],
  ['2400 überwiesen bekommen', inc(2400)],
  ['Hab 2400 Netto bekommen', inc(2400, 'salary')],
  ['Kunde hat 500 gezahlt', inc(500, 'freelance')],
  ['Kundin hat 300 überwiesen', inc(300, 'freelance')],
  ['Trinkgeld 85', ex(85, 'dining')],
  ['Fahrrad verkauft 120', inc(120)],
  ['32 zurückbekommen', inc(32)],
  ['Oma hat 50 geschenkt', inc(50, 'gift_income')],
  ['Opa hat mir 100 zugesteckt', inc(100, 'gift_income')],
  ['Weihnachtsgeld 1000', inc(1000, 'salary')],
  ['Urlaubsgeld 800', inc(800, 'salary')],
  ['Kindergeld 250', inc(250, 'other_income')],
  ['Bürgergeld 500', inc(500, 'other_income')],
  ['Elterngeld 1200', inc(1200, 'other_income')],
  ['Wohngeld 180', inc(180, 'other_income')],
  ['Rückerstattung 32', inc(32, 'other_income')],
  ['Pfand 4,50 zurück', inc(4.5, 'other_income')],
  ['Nebenjob 400', inc(400, 'freelance')],
  ['Honorar 800 reingekommen', inc(800, 'freelance')],
  ['Vom Finanzamt 300 zurück', inc(300, 'other_income')],
  ['Hab 60 kassiert fürs Babysitten', inc(60)],
  ['Überstunden ausgezahlt 350', inc(350, 'salary')],
  ['Nebenkostenrückzahlung 240', inc(240, 'other_income')],
];

const moreQuestions: Case[] = [
  ['Wie viel hab ich diese Woche ausgegeben', spent({ target: null, period: 'week' })],
  ['Was ist noch übrig', left({ target: null })],
  ['Wie viel bleibt für Lebensmittel', left({ categoryId: 'groceries' })],
  ['Hab ich mehr ausgegeben als letzten Monat', compare({ period: 'month', target: null })],
  ['Wo ist mein Geld hin', top({ target: null })],
  ['Größte Ausgabe', top({ target: null })],
  ['Kann ich mir Schuhe für 80 leisten', afford(80, { target: 'Schuhe', fallbackCategoryId: 'shopping' })],
  ['Wie viel hab ich diesen Monat verdient', earned({ period: 'month' })],
  ['Was hab ich am Wochenende ausgegeben', spent({ target: null, period: 'weekend' })],
  ['Wie viel ging in den letzten 10 Tagen drauf', spent({ target: null, period: 'recentDays', days: 10 })],
  ['Was hab ich diesen Monat für Döner ausgegeben', spent({ target: 'Döner', period: 'month', fallbackCategoryId: 'dining' })],
  ['Wie viel Kohle hab ich noch', left({ target: null })],
  ['Wie viel hab ich noch bis zum Ersten', left({ target: null })],
  ['Was bleibt mir noch diese Woche', left({ target: null })],
  ['Was hab ich für Sprit gelatzt', spent({ target: 'Sprit', fallbackCategoryId: 'transport' })],
  ['Wie viel hab ich bei Lidl gelassen', spent({ target: 'Lidl', fallbackCategoryId: 'groceries' })],
  ['Was kam letzten Monat rein', earned({ period: 'lastMonth', target: null })],
  ['Wie viel ist diesen Monat für Abos weggegangen', spent({ categoryId: 'subscriptions', period: 'month' })],
  ["Reicht's noch für Essen gehen", left({ categoryId: 'dining' })],
  ['Wie viel darf ich noch für Freizeit ausgeben', left({ categoryId: 'entertainment' })],
  ['Wie viel geb ich für Essen aus', spent({ categoryIds: ['groceries', 'dining'] })],
  ['Wo ist das ganze Geld geblieben', top({ target: null })],
  ['Was war mein größter Posten letzten Monat', top({ period: 'lastMonth', target: null })],
  ['Hab ich diese Woche weniger ausgegeben als letzte', compare({ period: 'week', target: null })],
  ['Was hab ich dieses Jahr eingenommen', earned({ period: 'year' })],
  ['Wie viel hab ich für Restaurants hingeblättert', spent({ target: 'Restaurants', fallbackCategoryId: 'dining' })],
  ['Was hab ich seit Zahltag verballert', spent({ target: null, period: 'budget' })],
];

// Fixing an entry by name: "das Uber weg", "ändere das Uber auf 32", "Mittagessen auf 15 ändern".
const named = (target: string, correction: Record<string, unknown>) => ({ kind: 'correction', correction: { remove: false, target, ...correction } });
const removeNamed = (target: string) => ({ kind: 'correction', correction: { remove: true, target, amount: null, categoryId: null, date: null } });
const moreCorrections: Case[] = [
  ['Nee, waren 14', fix({ amount: 14, categoryId: null, date: null })],
  ['Nee, 14 Euro waren das', fix({ amount: 14 })],
  ['Ne, das war Freizeit', fix({ categoryId: 'entertainment', amount: null })],
  ['Pack das in Restaurants', fix({ categoryId: 'dining' })],
  ['Pack das zu Essen gehen', fix({ categoryId: 'dining' })],
  ['Das war gestern', fix({ date: '2026-09-15' })],
  ['Das war am Dienstag', fix({ date: '2026-09-15' })],
  ['Nein, das war vorgestern', fix({ date: '2026-09-14' })],
  ['Lösch das', removeLast],
  ['Das Uber weg', removeNamed('uber')],
  ['Lösch den Döner', removeNamed('döner')],
  ['Vergiss das mit dem Spotify', removeNamed('spotify')],
  ['Nimm das Netflix wieder raus', removeNamed('netflix')],
  ['Den Kaffee von heute löschen', removeNamed('kaffee von heute')],
  ['Mittagessen auf 15 ändern', named('mittagessen', { amount: 15, categoryId: null })],
  ['Das Uber war 32 nicht 23', named('uber', { amount: 32 })],
  ['Nee, das Uber war 32', named('uber', { amount: 32 })],
  ['Das Uber war eigentlich 32', named('uber', { amount: 32 })],
  ['Ändere das Uber auf 32', named('uber', { amount: 32 })],
  ['Mach das Mittagessen 15', fix({ amount: 15, categoryId: 'dining' })],
  ['Das Uber auf Mobilität umbuchen', named('uber', { categoryId: 'transport', amount: null })],
];

const moreReminders: Case[] = [
  ['Erinner mich an die Miete am 1.', { ...reminder, occurredAt: '2026-10-01' }],
  ['Ich darf den Strom am Freitag nicht vergessen', { ...reminder, occurredAt: '2026-09-18' }],
  ['Sag mir um 20 Uhr Bescheid, Belege eintragen', { ...reminder, reminderTime: '20:00' }],
  ['Jeden Montag ans Budget erinnern', { ...reminder, reminderRepeat: 'weekly' }],
  ['Erinner mich jeden Monat am 15. an die Kreditrate', { ...reminder, reminderRepeat: 'monthly' }],
  ['Erinnerung morgen um 8 Uhr: Rechnung zahlen', { ...reminder, occurredAt: '2026-09-17', reminderTime: '08:00' }],
  ['Erinnere mich Montag an die GEZ', { ...reminder, occurredAt: '2026-09-21' }],
  ['Nicht vergessen Freitag Miete', { ...reminder, occurredAt: '2026-09-18' }],
  ['Mach mir eine Erinnerung für Sonntag 18 Uhr', { ...reminder, occurredAt: '2026-09-20', reminderTime: '18:00' }],
  ['Erinner mich nächste Woche an die Versicherung', reminder],
];

// Dictation writes "vier fünfzig" as "4 50", and people say a Fuffi or a Hunni.
const dictated: Case[] = [
  ['Vier fünfzig Kaffee', ex(4.5, 'dining')],
  ['Kaffee 4 50', ex(4.5, 'dining')],
  ['Kaffee vier fünfzig', ex(4.5, 'dining')],
  ['Zwanzig Euro Mittagessen', ex(20, 'dining')],
  ['Hundert für Lebensmittel', ex(100, 'groceries')],
  ['Zwölfhundert Miete', ex(1200, 'rent')],
  ['12 Euro 50 Mittagessen', ex(12.5, 'dining')],
  ['Mittagessen 12,50', ex(12.5, 'dining')],
  ['Mittag 12 Euro 50', ex(12.5, 'dining')],
  ['Fünf Euro fünfzig Kaffee', ex(5.5, 'dining')],
  ['Tausend Euro Miete', ex(1000, 'rent')],
  ['Dreihundertfünfzig Kreditrate', ex(350, 'debt')],
  ['Zweieinhalb Euro Brötchen', ex(2.5, 'groceries')],
  ['Anderthalb Euro für ein Brötchen', ex(1.5, 'groceries')],
  ['N Fuffi getankt', ex(50, 'transport')],
  ['N Hunni für Klamotten', ex(100, 'shopping')],
  ['Fürn Zehner Pommes', ex(10, 'dining')],
  ['Fuffi fürs Tanken', ex(50, 'transport')],
  ['Hunni Lebensmittel', ex(100, 'groceries')],
  ['Nen Zwanni fürs Kino', ex(20, 'entertainment')],
];

// With a digit in the sentence a loose question word never makes it a question, and plain plurals stay entries.
const stillEntries: Case[] = [
  ['Mittag 12 gesamt', ex(12, 'dining')],
  ['Einkauf 85 diese Woche', ex(85, 'groceries')],
  ['Kaffee 3 heute', ex(3, 'dining', { occurredAt: '2026-09-16' })],
  ['Tanken 60 letzten Monat', ex(60, 'transport')],
  ['Ausgaben 30 Kino', ex(30, 'entertainment')],
  ['Mehr Bier 12', ex(12, 'dining')],
  ['Noch ein Kaffee 3', ex(3, 'dining')],
  ['Übrig gebliebene Pizza 8', ex(8, 'dining')],
  ['Das Mittagessen waren 15', ex(15, 'dining')],
  ['Restaurants 40', ex(40, 'dining')],
  ['Tickets 30', ex(30, 'entertainment')],
  ['Geschenk für Oma 30', ex(30, 'other_expense')],
  ['Trinkgeld 5 gegeben', ex(5)],
  ['Netto 45', ex(45, 'groceries')],
  ['Reise nach Wien 300', ex(300, 'other_expense')],
  ['Vergiss nicht, die Miete zu überweisen', reminder],
];

describe('German phrasings: money put aside', () => runCases('de', putAside, labels));
describe('German phrasings: casual spending', () => runCases('de', casualSpending, labels));
describe('German phrasings: counted things', () => runCases('de', counted, labels));
describe('German phrasings: more income', () => runCases('de', moreIncome, labels));
describe('German phrasings: more questions', () => runCases('de', moreQuestions, labels));
describe('German phrasings: corrections by name and more', () => runCases('de', moreCorrections, labels));
describe('German phrasings: more reminders', () => runCases('de', moreReminders, labels));
describe('German phrasings: dictation and slang amounts', () => runCases('de', dictated, labels));
describe('German phrasings: still entries', () => runCases('de', stillEntries, labels));

/** Misreads a reviewer reproduced: a tip given, "nein warte", a terse question, the verb left in a salary note. */
const reviewedMisreads: Case[] = [
  ['Trinkgeld 10', ex(10, 'dining')],
  ['Trinkgeld 5 gegeben', ex(5, 'dining')],
  ['85 Trinkgeld bekommen', inc(85)],
  ['nein warte, 15', { kind: 'correction', correction: { amount: 15 } }],
  ['ähm 15', { kind: 'correction', correction: { amount: 15 } }],
  ['warte, 15', { kind: 'correction', correction: { amount: 15 } }],
  ['passt das noch mit den Lebensmitteln', left({ fallbackCategoryId: 'groceries' })],
  ['auswärts gegessen 25', ex(25, 'dining')],
  ['1500 Gehalt bekommen', inc(1500, 'salary')],
];

describe('German phrasings: reviewed misreads', () => runCases('de', reviewedMisreads, labels));

/** "Abendessen 40 plus 8 Trinkgeld": the tip is the second entry, and it is spending too. */
describe('German phrasings: a tip after the meal', () => {
  it('splits into two dining entries', () => {
    const r = parseOne('Abendessen 40 plus 8 Trinkgeld', 'de', labels);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject(ex(40, 'dining'));
    expect(r[1]).toMatchObject(ex(8, 'dining'));
  });
});

/**
 * Waiting on the parser core: "am" read as a.m. after a number, digit-and-scale runs ("2 tausend"), a named month as
 * a question period (`question.monthNames` is already in the pack) and a bare "es waren 15 nicht 54" read as a fix
 * through `notTail`. Un-skip once the core change is merged.
 */
describe.skip('after core merge', () => {
  const pending: Case[] = [
    ['50 am Zahltag', ex(50)],
    ['30 am Kiosk', ex(30)],
    ['15 am Automaten', ex(15)],
    ['20 am Bahnhof ausgegeben', ex(20)],
    ['100 am Automaten abgehoben', ex(100)],
    ['12 am Imbiss', ex(12, 'dining')],
    ['2 tausend Miete', ex(2000, 'rent')],
    ['wie viel habe ich im August ausgegeben', spent({ period: 'namedMonth', month: 7 })],
    ['es waren 15 nicht 54', { kind: 'correction', correction: { amount: 15 } }],
  ];
  runCases('de', pending, labels);
});
