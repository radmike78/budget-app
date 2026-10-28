import { dayOfMonthRule, ISO_RULE, byMonthRule, byYearRule, endOfYearRule, dayMonthRule, relativeFutureRules, relativePastRules, slashRule, weekdayRule } from '../dateRules';
import { makeNumberWords } from '../numbers';
import type { LanguagePack } from '../types';
import { periodWords } from '../questionRules';
import { clockRule, dayWords, futureDayOfMonthRule, futureWeekdayRule, monthlyOnRule, repeatWords, weeklyOnRule, wordTimeRules } from '../reminderRules';

const MONTHS = { names: { gennaio: 0, gen: 0, febbraio: 1, feb: 1, marzo: 2, mar: 2, aprile: 3, apr: 3, maggio: 4, mag: 4, giugno: 5, giu: 5, luglio: 6, lug: 6, agosto: 7, ago: 7, settembre: 8, set: 8, sett: 8, ottobre: 9, ott: 9, novembre: 10, nov: 10, dicembre: 11, dic: 11 } };
const WEEKDAYS = { names: { domenica: 0, lunedì: 1, lunedi: 1, martedì: 2, martedi: 2, mercoledì: 3, mercoledi: 3, giovedì: 4, giovedi: 4, venerdì: 5, venerdi: 5, sabato: 6 }, lastAfter: ['scorso', 'scorsa'], prefixes: ['il', 'la', 'questo', 'questa'] };

// Italian glues tens and units together ("venticinque"); build the table programmatically.
const TENS: [string, number][] = [['venti', 20], ['trenta', 30], ['quaranta', 40], ['cinquanta', 50], ['sessanta', 60], ['settanta', 70], ['ottanta', 80], ['novanta', 90]];
const UNITS_G: [string, number][] = [['uno', 1], ['due', 2], ['tre', 3], ['tré', 3], ['quattro', 4], ['cinque', 5], ['sei', 6], ['sette', 7], ['otto', 8], ['nove', 9]];
// "una ventina", "una cinquantina": roughly that many, said as a number of its own.
const units: Record<string, number> = { zero: 0, uno: 1, un: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10, undici: 11, dodici: 12, tredici: 13, quattordici: 14, quindici: 15, sedici: 16, diciassette: 17, diciotto: 18, diciannove: 19, decina: 10, dozzina: 12, ventina: 20, trentina: 30, quarantina: 40, cinquantina: 50, sessantina: 60, settantina: 70, ottantina: 80, novantina: 90 };
for (const [t, tv] of TENS) {
  for (const [u, uv] of UNITS_G) {
    const stem = uv === 1 || uv === 8 ? t.slice(0, -1) : t; // ventuno, ventotto
    units[stem + u] = tv + uv;
  }
}
const hundreds: Record<string, number> = { duecento: 200, trecento: 300, quattrocento: 400, cinquecento: 500, seicento: 600, settecento: 700, ottocento: 800, novecento: 900 };

const baseNumberWords = makeNumberWords({
  units,
  tens: Object.fromEntries(TENS),
  // "un centone", "due centoni": a hundred, said the everyday way.
  hundred: ['cento', 'centone', 'centoni', 'centinaio'],
  hundreds,
  thousand: ['mille', 'mila'],
  million: ['milione', 'milioni'],
  connectors: ['e'],
  connectorCents: true,
  one: ['un', 'uno', 'una'],
  pre: (t) => t.replace(/(?<![\p{L}])un[ao]? (?=(?:decina|dozzina|ventina|trentina|quarantina|cinquantina|sessantina|settantina|ottantina|novantina|centinaio)(?![\p{L}]))/gu, '').replace(/(\p{L})(cento|mille|mila)(?=\p{L})/gu, '$1 $2 ').replace(/(?<![\p{L}])(\p{L}+)(cento|mille|mila)\b/gu, (m, a: string, b: string) => (a in units || a in hundreds ? `${a} ${b}` : m)).replace(/\b(cento|mille|mila)(?!n[ei](?![\p{L}]))(?=\p{L})/gu, '$1 '),
});

/**
 * Dictation writes "dodici e cinquanta" as "12 e 50" and "un euro e venti" as "un euro e 20": the first is one
 * amount with cents (an Italian list says "pranzo 12 e caffè 2", never two bare numbers around "e"), the second
 * needs "un" read as 1 before a currency word so the cents merge. A clock time ("alle 9 e 30") is left alone.
 */
const numberWords = (text: string): string => baseNumberWords(text)
  .replace(/(?<![\p{L}])un(?= (?:euro|euri|dollar[oi]|franc[oi])(?![\p{L}]))/gu, '1')
  .replace(/(?<!(?:alle|ore|le|dalle) )(?<![\d.,])(\d{1,4}) e (\d{2})(?![\d.,:])(?! ?(?:euro|euri|€|cent|centesim[oi]|anni|giorni|mesi|settimane|ore|minuti|persone|volte)(?![\p{L}]))/gu, '$1.$2');

/**
 * "ristoranti" is "ristorante", "pizze" is "pizza": the singular a plural may stand for. "spese" is spending itself,
 * never "spesa" (groceries), and "altri" (more) is never "altro" (the Other category).
 */
const NOT_PLURALS = new Set(['spese', 'altri', 'altre', 'tutti', 'tutte', 'questi', 'queste', 'quelli', 'quelle', 'miei', 'nostri', 'vostri']);
function singularForms(word: string): string[] {
  const out: string[] = [];
  if (word.length < 4 || NOT_PLURALS.has(word)) return out;
  if (word.endsWith('chi') || word.endsWith('ghi')) out.push(word.slice(0, -1) + 'o');
  else if (word.endsWith('che') || word.endsWith('ghe')) out.push(word.slice(0, -2) + 'a');
  else if (word.endsWith('ci')) out.push(word.slice(0, -2) + 'co', word.slice(0, -1) + 'o', word.slice(0, -1) + 'e');
  else if (word.endsWith('i')) out.push(word.slice(0, -1) + 'o', word.slice(0, -1) + 'e');
  else if (word.endsWith('e')) out.push(word.slice(0, -1) + 'a');
  return out;
}

/** One regex per month, full and short forms, for "quanto ho speso ad agosto". */
const monthNames = (forms: string[]) => forms.map((alts) => new RegExp(`(?<![\\p{L}])(?:${alts})(?![\\p{L}])`, 'iu'));

export const it: LanguagePack = {
  code: 'it',
  speechTag: 'it-IT',
  tokenizer: 'space',
  decimalComma: true,
  numberWords,
  currencyMarkers: /€|\$|euro|euri|dollari|dollaro|usd|eur|chf|franchi/i,
  currencyWords: /(?<![\p{L}])(?:euro|euri|dollari|dollaro|usd|eur|chf|franchi|centesimi|centesimo)(?![\p{L}])/giu,
  incomeVerbs: ['ho ricevuto', 'ricevuto', 'ricevuti', 'preso lo stipendio', 'presa lo stipendio', 'arrivato lo stipendio', 'entrato lo stipendio', 'stipendio accreditato', 'stipendio arrivato', 'stipendio entrato', 'di stipendio', 'busta paga', 'mi hanno pagato', 'mi ha pagato', 'sono stato pagato', 'guadagnato', 'guadagnati', 'incassato', 'incassati', 'rimborso', 'rimborsato', 'rimborsati', 'entrata', 'entrate', 'bonus', 'premio', 'commissione', 'venduto', 'venduti', 'mance', 'regalo da', 'mi ha regalato', 'mi hanno regalato', 'mi ha dato', 'mi hanno dato', 'mi ha mandato', 'mi hanno mandato', 'bonifico ricevuto', 'pensione', 'accredito', 'accreditato', 'mi ha restituito', 'mi hanno restituito', 'restituito', 'mi ha ridato', 'mi hanno ridato', 'mi ha reso', 'mi è entrato', 'mi e entrato', 'mi sono entrati', 'sono stata pagata', 'mi hanno accreditato', 'tredicesima', 'quattordicesima', 'borsa di studio', 'dividendi', 'mi è entrata', 'mi e entrata', 'mi hanno fatto un bonifico', 'mi ha fatto un bonifico', 'arrivato un bonifico', 'arrivato il bonifico', 'ricevuto un bonifico', 'bonifico in entrata', 'mi hanno rimborsato', 'mi ha rimborsato', 'venduta', 'vendute', 'vinto', 'vinti'],
  expenseVerbs: ['ho speso', 'speso', 'spesi', 'ho pagato', 'pagato', 'pagati', 'ho comprato', 'comprato', 'comprati', 'spesa', 'acquisto', 'acquistato', 'costato', 'costa', 'costati', 'ordinato', 'preso', 'presi', 'donato', 'prestato', 'prelevato', 'mandato', 'inviato', 'bolletta', 'ho dato', 'dato', 'messo', 'speso per', 'pago', 'compro', 'spendo', 'offerto', 'versato', 'addebitato', 'addebitati', 'sborsato', 'sborsati', 'tirato fuori', 'buttato', 'buttati', 'giocato', 'giocati', 'lasciato', 'lasciati', 'cacciato', 'cacciati', 'scalato', 'scalati', 'costata', 'costate', 'fregato', 'fregati', 'accantonato', 'accantonati', 'risparmiato', 'risparmiati', 'messo da parte', 'messi da parte', 'messo via', 'messi via'],
  keywords: {
    salary: ['stipendio', 'busta paga', 'mi hanno pagato', 'sono stato pagato', 'sono stata pagata', 'paga', 'salario', 'mensilità', 'tredicesima', 'quattordicesima'],
    freelance: ['freelance', 'partita iva', 'cliente', 'un cliente mi ha dato', 'il cliente mi ha dato', 'cliente mi ha dato', 'cliente mi ha pagato', 'clienti mi hanno pagato', 'clienti mi hanno dato','fattura pagata', 'fattura incassata', 'lavoretto', 'lavoro extra', 'consulenza', 'commissione', 'ripetizioni', 'venduto', 'vendita', 'vinted', 'subito', 'mance', 'upwork', 'fiverr'],
    gift_income: ['regalo da', 'mi ha regalato', 'mi hanno regalato', 'mi ha dato', 'mi hanno dato', 'soldi di compleanno', 'da mia madre', 'da mio padre', 'da mamma', 'da papà', 'dalla nonna', 'dal nonno', 'paghetta'],
    other_income: ['rimborso', 'rimborsato', 'cashback', 'interessi', 'dividendi', 'bonus', 'premio', 'rimborso 730', 'rimborso tasse', 'vinto', 'lotteria', 'gratta e vinci', 'pensione', 'borsa di studio', 'sussidio', 'naspi', 'disoccupazione', 'assegno unico', 'mi ha restituito', 'restituito', 'bonifico da', 'satispay da', 'paypal da'],
    groceries: ['carta igienica', 'carta da cucina', 'spesa', 'supermercato', 'supermarket', 'mercato', 'alimentari', 'esselunga', 'coop', 'conad', 'carrefour', 'lidl', 'eurospin', 'pam', 'despar', 'md', 'iper', 'ipercoop', 'penny', 'frutta', 'verdura', 'pane', 'latte', 'uova', 'carne', 'pesce', 'formaggio', 'macellaio', 'macelleria', 'panificio', 'panetteria', 'panettiere', 'fornaio', 'forno', 'fruttivendolo', 'pescheria', 'salumeria', 'cibo per casa', 'generi alimentari'],
    dining: ['pranzo', 'cena', 'colazione', 'merenda', 'brunch', 'caffè', 'caffe', 'bar', 'ristorante', 'trattoria', 'osteria', 'pizzeria', 'pizza', 'aperitivo', 'aperitivi', 'apericena', 'birra', 'birre', 'vino', 'drink', 'cocktail', 'panino', 'gelato', 'dolce', 'sushi', 'kebab', 'hamburger', 'mangiato', 'mangiare fuori', 'delivery', 'glovo', 'deliveroo', 'just eat', 'uber eats', 'mcdonald', 'mcdonalds', 'burger king', 'starbucks', 'tavola calda', 'cornetto', 'brioche', 'spuntino', 'pausa pranzo', 'mensa', 'bevande', 'spritz', 'pizzata', 'cena fuori', 'cinese', 'giapponese', 'ristorante cinese', 'ristorante giapponese', 'kebabbaro', 'paninoteca', 'pub', 'birreria', 'enoteca', 'pasticceria', 'caffetteria', 'giro di birre', 'pizza al taglio', 'poke', 'ramen'],
    rent: ['affitto', 'mutuo', 'padrone di casa', 'proprietario', 'condominio', 'spese condominiali', 'appartamento', 'assicurazione casa', 'caparra', 'canone di locazione', 'imu', 'agenzia immobiliare'],
    utilities: ['bolletta', 'bollette', 'luce', 'elettricità', 'enel', 'gas', 'acqua', 'internet', 'wifi', 'fibra', 'telefono', 'cellulare', 'tim', 'vodafone', 'wind', 'windtre', 'iliad', 'fastweb', 'ho mobile', 'riscaldamento', 'energia', 'tari', 'rifiuti', 'canone rai', 'utenze', 'bolletta della luce', 'bolletta del gas', 'bolletta dell\'acqua', 'ricarica telefonica', 'ricarica', 'ricarica del telefono'],
    transport: ['abbonamento dei mezzi', 'abbonamento del bus', 'abbonamento della metro', 'abbonamento del treno', 'mezzi pubblici', 'mezzi', 'benzina', 'carburante', 'gasolio', 'diesel', 'pieno', 'uber', 'taxi', 'treno', 'trenitalia', 'italo', 'metro', 'metropolitana', 'autobus', 'bus', 'pullman', 'tram', 'biglietto', 'biglietti', 'abbonamento trasporti', 'abbonamento atm', 'pedaggio', 'autostrada', 'telepass', 'parcheggio', 'macchina', 'auto', 'assicurazione auto', 'bollo', 'bollo auto', 'meccanico', 'gomme', 'tagliando', 'revisione', 'volo', 'aereo', 'ryanair', 'easyjet', 'biglietto aereo', 'noleggio auto', 'bici', 'bicicletta', 'monopattino', 'blablacar', 'viaggio in treno', 'autolavaggio', 'multa parcheggio', 'car sharing', 'enjoy', 'share now'],
    health: ['medico', 'dottore', 'dottoressa', 'dentista', 'farmacia', 'ricetta', 'medicine', 'medicina', 'farmaci', 'farmaco', 'ospedale', 'clinica', 'visita', 'visita medica', 'ticket sanitario', 'ticket', 'terapia', 'psicologo', 'psicologa', 'palestra', 'sport', 'yoga', 'pilates', 'vitamine', 'integratori', 'occhiali', 'ottico', 'lenti', 'osteopata', 'fisioterapia', 'fisioterapista', 'veterinario', 'massaggio', 'salute', 'analisi', 'esami', 'nutrizionista'],
    entertainment: ['biglietti del concerto', 'biglietto del concerto', 'biglietti per il concerto', 'biglietto del cinema', 'biglietti del cinema', 'biglietto per il cinema', 'cinema', 'film', 'concerto', 'biglietti concerto', 'teatro', 'spettacolo', 'gioco', 'giochi', 'videogioco', 'videogiochi', 'steam', 'playstation', 'xbox', 'nintendo', 'bowling', 'museo', 'mostra', 'parco', 'parco divertimenti', 'gardaland', 'serata', 'discoteca', 'karaoke', 'libro', 'libri', 'fumetti', 'hobby', 'uscita', 'partita', 'calcio', 'stadio', 'escape room', 'divertimento', 'sagra', 'festival', 'biliardo', 'calcetto'],
    shopping: ['carta regalo', 'amazon', 'vestiti', 'abbigliamento', 'scarpe', 'sneakers', 'camicia', 'maglietta', 'pantaloni', 'jeans', 'vestito', 'giacca', 'cappotto', 'shopping', 'negozio', 'centro commerciale', 'ikea', 'mobili', 'arredamento', 'decorazioni', 'leroy merlin', 'brico', 'bricolage', 'ferramenta', 'elettronica', 'mediaworld', 'unieuro', 'cuffie', 'auricolari', 'telefono nuovo', 'computer', 'caricatore', 'caricabatterie', 'regalo', 'regali', 'giocattoli', 'giocattolo', 'trucco', 'trucchi', 'cosmetici', 'parrucchiere', 'parrucchiera', 'taglio', 'barbiere', 'unghie', 'estetista', 'sephora', 'zara', 'h&m', 'oviesse', 'ordine', 'ordine online', 'cartoleria', 'casa', 'pulizie', 'detersivi', 'lavanderia', 'tintoria', 'fiori', 'piante', 'animale', 'animali', 'cane', 'gatto', 'crocchette', 'bambini', 'bimbo', 'bimba', 'pannolini', 'scuola', 'università', 'tasse universitarie', 'corso', 'lezione', 'libri di testo', 'decathlon', 'tiger', 'zalando', 'lavatrice', 'lavastoviglie', 'frigorifero', 'frigo', 'forno', 'aspirapolvere', 'elettrodomestico', 'elettrodomestici', 'televisore', 'tablet', 'stampante'],
    subscriptions: ['abbonamento', 'abbonamenti', 'netflix', 'spotify', 'dazn', 'sky', 'now tv', 'now', 'disney', 'disney plus', 'amazon prime', 'prime', 'apple music', 'youtube premium', 'icloud', 'google one', 'dropbox', 'chatgpt', 'claude', 'adobe', 'iscrizione', 'patreon', 'giornale', 'corriere', 'repubblica', 'crunchyroll', 'twitch', 'rinnovo', 'canone mensile', 'piano mensile', 'piano annuale', 'duolingo', 'game pass', 'ps plus', 'tessera', 'quota'],
    debt: ['carta di credito', 'carta', 'prestito', 'finanziamento', 'rata', 'rate', 'debito', 'debiti', 'interessi', 'scoperto', 'klarna', 'scalapay', 'rata del prestito', 'rata dell\'auto', 'cessione del quinto', 'prestito personale'],
    savings: ['risparmio', 'risparmi', 'bonifico', 'conto deposito', 'fondo emergenza', 'fondo di emergenza', 'investimento', 'investito', 'investimenti', 'pensione integrativa', 'fondo pensione', 'azioni', 'borsa', 'crypto', 'bitcoin', 'messo da parte', 'conto risparmio', 'etf', 'pac', 'buoni postali', 'salvadanaio', 'trade republic', 'moneyfarm', 'messi da parte', 'da parte', 'messo via', 'messi via', 'risparmiato', 'risparmiati', 'accantonato', 'accantonati', 'fondo', 'fondo emergenze', 'fondo emergenza', 'emergenze', 'per le emergenze', 'gruzzolo', 'tesoretto', 'libretto'],
    other_expense: ['commissione', 'commissioni', 'bancomat', 'prelievo', 'contanti', 'donazione', 'beneficenza', 'chiesa', 'offerta', 'tasse', 'imposta', 'imposte', 'f24', 'multa', 'francobolli', 'poste', 'spedizione', 'pacco', 'varie', 'altro', 'altre', 'roba', 'prestato', 'satispay', 'paypal', 'assicurazione', 'assicurazione vita', 'asilo', 'nido', 'babysitter', 'istruzione', 'avvocato', 'notaio', 'commercialista', 'matrimonio', 'vacanza', 'vacanze', 'viaggio', 'hotel', 'albergo', 'airbnb', 'ostello', 'b&b', 'alloggio', 'regalo di nozze', 'mancia', 'sigarette', 'sigaretta', 'tabaccaio', 'tabacchi', 'tabaccheria', 'tabacco'],
  },
  stopwords: ['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'di', 'del', 'della', 'dei', 'delle', 'degli', 'dello', 'a', 'al', 'alla', 'ai', 'alle', 'in', 'nel', 'nella', 'per', 'con', 'senza', 'e', 'o', 'ma', 'che', 'chi', 'io', 'mi', 'me', 'tu', 'ti', 'noi', 'ci', 'voi', 'vi', 'mio', 'mia', 'miei', 'mie', 'tuo', 'tua', 'suo', 'sua', 'nostro', 'nostra', 'questo', 'questa', 'questi', 'queste', 'oggi', 'ieri', 'domani', 'sera', 'mattina', 'settimana', 'mese', 'anno', 'speso', 'pagato', 'comprato', 'acquisto', 'euro', 'euri', 'dollari', 'ogni', 'totale', 'ancora', 'anche', 'allora', 'molto', 'nuovo', 'nuova', 'più', 'meno', 'ultimo', 'ultima', 'prossimo', 'prossima', 'obiettivo', 'meta', 'risparmiare', 'risparmiato', 'messo', 'aggiunto', 'verso', 'dentro', 'andato', 'andare', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci', 'voce', 'uscita', 'entrata', 'stipendio', 'soldi', 'qualcosa', 'cosa', 'come', 'fa', 'ho', 'hai', 'ha', 'hanno', 'sono', 'siamo', 'è', 'circa'],
  pastDateRules: [
    ISO_RULE,
    ...relativePastRules({
      today: ['oggi', 'stamattina', 'stasera', 'stanotte', 'oggi pomeriggio', 'questa mattina', 'questa sera', 'a pranzo oggi'],
      yesterday: ['ieri', 'ieri sera', 'ieri mattina', 'ieri pomeriggio', 'ieri notte', 'ierisera'],
      dayBeforeYesterday: ["l'altro ieri", "l'altroieri", 'altro ieri', "ieri l'altro"],
      lastWeek: ['la settimana scorsa', 'settimana scorsa', 'la scorsa settimana'],
      lastMonth: ['il mese scorso', 'mese scorso', 'lo scorso mese'],
      daysAgo: /\b(\d+|un) giorn[oi] fa\b/,
      weeksAgo: /\b(\d+|una) settiman[ae] fa\b/,
      monthsAgo: /\b(\d+|un) mes[ei] fa\b/,
      oneWords: ['un', 'una'],
    }),
    dayMonthRule(MONTHS, { pre: ['il', "l'", 'lo scorso'] }),
    weekdayRule(WEEKDAYS),
    slashRule(true),
    dayOfMonthRule(/\bil (\d{1,2})\b(?!\s?(?:€|euro|euri))/),
    // "affitto 900 il primo", "il primo del mese": the first of the month, said as a word.
    { re: /\bil (primo)(?: del mese)?\b/iu, resolve: (m, t) => dayOfMonthRule(/x/).resolve(['', '1'] as unknown as RegExpMatchArray, t) },
  ],
  futureDateRules: [
    ISO_RULE,
    ...relativeFutureRules({
      endOfYear: ['entro fine anno', "entro la fine dell'anno", 'per fine anno', 'fine anno', 'a fine anno', "entro l'anno", "fine dell'anno"],
      endOfNextYear: ["entro la fine dell'anno prossimo", "fine dell'anno prossimo", 'entro fine anno prossimo'],
      endOfMonth: ['entro fine mese', 'fine mese', 'a fine mese', 'per fine mese', 'entro la fine del mese', 'entro il mese'],
      nextYear: ["l'anno prossimo", "entro l'anno prossimo", "per l'anno prossimo", "il prossimo anno", "entro il prossimo anno"],
      nextMonth: ['il mese prossimo', 'entro il mese prossimo', 'per il mese prossimo', 'il prossimo mese', 'entro il prossimo mese'],
      christmas: ['per natale', 'entro natale', 'prima di natale', 'natale'],
      inDays: /\b(?:tra|fra|in|entro|nei prossimi|durante i prossimi) (\d+|un) giorn[oi]\b/,
      inWeeks: /\b(?:tra|fra|in|entro|nelle prossime|durante le prossime) (\d+|una) settiman[ae]\b/,
      inMonths: /\b(?:tra|fra|in|entro|nei prossimi|durante i prossimi) (\d+|un) mes[ei]\b/,
      inYears: /\b(?:tra|fra|in|entro|nei prossimi|durante i prossimi) (\d+|un) ann[oi]\b/,
      oneWords: ['un', 'una'],
      seasons: { spring: ['per la primavera', 'entro la primavera', 'prima della primavera'], summer: ["per l'estate", "entro l'estate", "prima dell'estate", "quest'estate"], fall: ["per l'autunno", "entro l'autunno", "prima dell'autunno"], winter: ["per l'inverno", "entro l'inverno", "prima dell'inverno"] },
    }),
    dayMonthRule(MONTHS, { pre: ['entro il', 'per il', 'prima del', 'il', 'entro', 'per', "entro l'", "l'"], future: true }),
    endOfYearRule(['entro fine', 'entro la fine del', 'per fine', 'a fine', 'entro il']),
    byMonthRule(MONTHS, ['entro', 'per', 'prima di', 'a', 'entro fine', 'per fine', 'entro il prossimo', 'il prossimo', 'per il prossimo']),
    byYearRule(['entro', 'per', 'prima del', 'nel']),
  ],
  goalLead: /^(?:obiettivo|meta|nuovo obiettivo|obiettivo di risparmio|(?:fai|fare|crea|creare|voglio|vorrei|fissa|fissare|imposta|impostare)(?: un| una)?(?: nuovo| nuova)? (?:piano|obiettivo|meta)(?: per| di)?)\s*:?\s*/iu,
  goalIntent: /(?<![\p{L}])(?:sto risparmiando|stiamo risparmiando|sto mettendo da parte|stiamo mettendo da parte|sto mettendo via|voglio risparmiare|vorrei risparmiare|devo risparmiare|voglio mettere da parte|voglio mettere via|vorrei mettere da parte|risparmiare|mettere da parte|mettere via|accantonare)(?![\p{L}])/iu,
  goalPastVerbs: /(?<![\p{L}])(?:risparmiato|risparmiati|messo|messi|aggiunto|aggiunti|trasferito|trasferiti|versato|versati|spostato|spostati|depositato|depositati|accantonato|pagato|estinto|ripagato)(?![\p{L}])/iu,
  // "200 al mese per una macchina": the amount is the pace, not the goal's total.
  goalPronoun: /^(?:quello|questo|lì|li|l'obiettivo|all'obiettivo|il mio obiettivo)$/iu,
  repeatOf: { yearly: /(?:anno|annual)/iu, biweekly: /(?:due settimane|2 settimane|quindici giorni|15 giorni)/iu, weekly: /(?:settimana|settimanal)/iu, monthly: /(?:\bmese\b|\bmesi\b|mensil)/iu },
  multiply: { each: /(?:ciascuno|ciascuna|l'uno|l'una|a testa|per (?:persona|unità|unita|pezzo)|al pezzo|cadauno|cadauna)/u, half: /(?:la metà di|la meta di|metà di)/u },
  perPeriod: /(?<![\p{L}])(?:(?:al|a|ogni|per|per ogni|a ogni) (?:mese|settimana|anno|giorno|stipendio|busta paga)|all'anno|mensil(?:e|i|mente)|settimanal(?:e|i|mente)|annual(?:e|i|mente)|ogni (?:due|2) (?:settimane|mesi)|ogni (?:quindici|15) giorni|tutti i mesi|tutte le settimane)(?![\p{L}])/u,
  // "2 caffè 8": a small number right before a word of its own is a count; these words keep it money ("12 di pranzo").
  countStop: /^(?:di|del|della|dello|dei|degli|delle|dell'|d'|per|a|al|alla|allo|ai|alle|all'|in|nel|nella|nello|nell'|su|sul|sulla|sull'|da|dal|dalla|dall'|con|e|ed|o|euro|euri|eur|centesimi|mila|mille|k|totale|tondi|tondo|precisi|spaccati|netti|lordi|più|meno|circa|ieri|oggi|stasera|stamattina|domani|fa|ogni|il|lo|la|i|gli|le|un|uno|una|ancora|anche|solo|appena|già|gia|non|che|come|quasi|tipo)$/iu,
  debtIntent: /(?<![\p{L}])(?:(?:voglio |vorrei |devo |ho intenzione di |vogliamo |dobbiamo |intendo )?(?:estinguere|ripagare|saldare|ridurre|azzerare|liberarmi d[ai]|uscire d[ai]|finire di pagare|senza debiti)|(?:devo|dobbiamo)(?: ancora)?(?= [€$]?\d| (?:sulla|sul|sullo|sulle|sui) )|(?:ho|abbiamo) (?:ancora )?(?:un )?debit[oi](?: di)?)(?![\p{L}])/iu,
  debtWords: /(?<![\p{L}])(?:debit[oi]|carta di credito|carte di credito|carta(?! (?:igienica|regalo|fedeltà|fedelta|da))|visa|mastercard|amex|american express|prestit[oi]|mutuo|finanziamento|scoperto|rate)(?![\p{L}])/iu,
  contributionVerbs: /^(?=(?:(?:altri|altre|ancora) )?[€$]?\d[\d.,]*\s+(?:(?:euro|euri|€)\s+)?(?:nel|nella|nello|sul|sulla|sullo|al|alla|allo|per|verso|in)\s)|(?<![\p{L}])(?:aggiung(?:i|o|ere)|aggiunt[oi]|mess[oi]|metto|metti|mettere|risparmiat[oi]|trasferit[oi]|trasferisco|trasferisci|versat[oi]|verso|versa|spostat[oi]|sposto|deposit(?:o|a|ato|ati)|accantonat[oi])(?![\p{L}])/iu,
  contributionPreps: 'a|al|alla|allo|per|verso|in|nel|nella|nello|su|sul|sulla|sullo|per il|per la|per lo',
  forWords: 'per|per il|per la|per un|per una|per lo|per le|per i|per gli|per mio|per mia|per i miei',
  goalWords: 'obiettivo|meta',
  goalNouns: /^(?:salvadanaio|fondo|risparmi|risparmio|conto|obiettivo|cassa|gruzzolo|tesoretto|budget|soldi)$/u,
  articles: /^(?:(?:il|lo|la|i|gli|le|un|uno|una|mio|mia|nostro|nostra|nuovo|nuova)\s+|l'|un')+/,
  leadingFiller: /^(?:(?:e|ed|ho|hai|ha|hanno|sono|siamo|è|mi è|mi sono|ci sono|mi hanno|mi ha|oggi|ieri|beh|anche|ancora|speso|pagato|comprato|spesa|acquisto|preso|in|di|del|della|dei|delle|per|con|a|al|alla|su|sul|sulla|sullo|sui|sulle|il|lo|la|i|gli|le|un|uno|una|mio|mia|mi|ci|circa|più o meno|tipo|quasi|un altro|un'altra)\s+|(?:l'|d'|un'|dell'|all'|sull')(?=\p{L}))+/u,
  trailingFiller: /(?:\s+(?:oggi|ieri|in|di|del|della|per|con|a|al|alla|il|lo|la|i|gli|le|un|uno|una|e|ogni|totale|ancora|anche|per favore|grazie|questo|questa|quello|circa|più o meno|tondi|tondo|precisi|spaccati|netti|in tutto|in totale))+$/u,
  // "ho messo da parte 200", "ho messo via 150": the saving verb has already said what happened.
  noteStrip: [/(?<![\p{L}])(?:da parte|mess[oi] via|metto via|mettere via)(?![\p{L}])/giu, /(?<![\p{L}])(?:allo|dallo|con lo|a|da|con|col) (?:ultimo |scorso |prossimo )?stipendio(?![\p{L}])/giu, /(?<![\p{L}])via(?![\p{L}])\s*$/u],
  singularForms,
  listSeparators: [',', ';', 'e', 'ed', 'più', 'poi', 'e poi', 'e anche', 'anche'],
  reminder: {
    lead: /(?<![\p{L}])(?:(?:puoi |potresti |per favore )?(?:ricordamelo|ricordamela|ricordameli|ricordami|ricordarmi|ricordaci|ricordatemi|mi ricordi|ricordati|devo ricordarmi|ricordiamoci|segnati(?= (?:di|che) )|metti un promemoria|mettere un promemoria|mettimi un promemoria|crea un promemoria|aggiungi un promemoria|voglio un promemoria|ho bisogno di un promemoria|promemoria|avvisami|avvisarmi|avvertimi|avvertirmi|non farmi dimenticare|non farmi dimenticarmi|non farmi scordare|non farmi scordarmi|non lasciarmi dimenticare|non lasciarmi scordare|non far(?:mi)? scordare|fammi ricordare|fammi ricordarmi|fammi un promemoria))(?![\p{L}])(?:\s+(?:di|che|per|a|su)(?![\p{L}]))?\s*:?/iu,
    time: [
      // "alle 8 e mezza", "alle 9 e un quarto", "alle 9 meno un quarto": the minutes said in words.
      {
        re: /(?<![\p{L}])(?:alle|alle ore|all'|verso le|per le|entro le)\s*(\d{1,2}) (?:e (mezz[ao]|un quarto|tre quarti)|meno (un quarto|venti|dieci|cinque))(?![\p{L}])/iu,
        resolve: (m) => {
          const past: Record<string, number> = { mezza: 30, mezzo: 30, 'un quarto': 15, 'tre quarti': 45 };
          const before: Record<string, number> = { 'un quarto': 15, venti: 20, dieci: 10, cinque: 5 };
          let h = Number(m[1]);
          let minute = 0;
          if (m[2]) minute = past[m[2].toLowerCase()] ?? 0;
          else { h -= 1; minute = 60 - (before[m[3].toLowerCase()] ?? 0); }
          if (h >= 1 && h <= 6) h += 12;
          return h >= 0 && h <= 23 ? { hour: h, minute, explicit: false } : null;
        },
      },
      // "alle 9 e 30" is how dictation writes half past nine, as well as "9:30" and "9.30".
      clockRule(['alle', 'alle ore', "all'", 'verso le', 'per le', 'entro le'], { hourSep: ':|\\.|\\s?e\\s', dayParts:{ 'di mattina': 0, 'del mattino': 0, 'di pomeriggio': 12, 'del pomeriggio': 12, 'di sera': 12, 'della sera': 12, 'di notte': 12 } }),
      ...wordTimeRules({ morning: ['di mattina', 'la mattina', 'in mattinata', 'stamattina', 'appena sveglio'], noon: ['a mezzogiorno', 'mezzogiorno', 'a pranzo', "all'ora di pranzo"], afternoon: ['nel pomeriggio', 'di pomeriggio', 'oggi pomeriggio', 'il pomeriggio'], evening: ['stasera', 'di sera', 'la sera', 'in serata', 'stanotte', 'prima di dormire'] }, { morning: 8, noon: 12, afternoon: 15, evening: 19 }),
    ],
    repeat: [
      weeklyOnRule(['ogni', 'tutti i', 'il', 'tutte le', 'la'], WEEKDAYS.names),
      monthlyOnRule(/(?<![\p{L}])(?:il |ogni )?(\d{1,2}|primo) di ogni mese(?![\p{L}])/iu, { primo: 1 }),
      repeatWords(['ogni mattina', 'tutte le mattine'], 'daily', 8),
      repeatWords(['ogni sera', 'tutte le sere', 'ogni notte', 'tutte le notti'], 'daily', 20),
      repeatWords(['ogni pomeriggio', 'tutti i pomeriggi'], 'daily', 15),
      repeatWords(['ogni giorno', 'tutti i giorni', 'giornalmente', 'quotidianamente'], 'daily'),
      repeatWords(['ogni settimana', 'tutte le settimane', 'settimanalmente', 'una volta a settimana'], 'weekly'),
      repeatWords(['ogni mese', 'tutti i mesi', 'mensilmente', 'una volta al mese', 'a inizio mese', "all'inizio di ogni mese"], 'monthly'),
    ],
    day: [
      ISO_RULE,
      dayWords(['dopodomani', 'dopo domani'], 2),
      dayWords(['domani'], 1),
      dayWords(['oggi', 'stasera', 'stamattina', 'oggi pomeriggio', 'stanotte'], 0),
      futureWeekdayRule(WEEKDAYS.names, { pre: ['il prossimo', 'prossimo', 'questo', 'il', 'la prossima', 'la'], suffix: ['prossimo', 'prossima'], nextWords: ['prossimo', 'prossima'] }),
      dayMonthRule(MONTHS, { pre: ['il', 'per il', 'entro il', "l'"], future: true }),
    ],
    // "il 20:30" is a time, "per il 20: pagare la tari" a day with the task after a colon.
    dayLate: [futureDayOfMonthRule(/(?<![\p{L}])(?:il|per il|entro il) (\d{1,2}|primo)(?![\p{L}\p{N}]|:\d)/iu, { primo: 1 })],
    strip: [/^(?:(?:di|che|per|a|su|e|per favore|devo|dovrei|bisogna|che devo)\s+)+/iu, /(?:\s+(?:per favore|grazie))+$/iu],
  },
  question: {
    lead: /(?<![\p{L}])(?:quanto|quanti soldi|cosa|che cosa) (?:ho|abbiamo|avevo) (?:speso|pagato|spesi|sborsato|tirato fuori|buttato|cacciato|sganciato)|(?<![\p{L}])quanto (?:ho|abbiamo) (?:messo|dato|finito per spendere)|(?<![\p{L}])quanto (?:sono|siamo) andat[oaie] a spendere|(?<![\p{L}])a quanto (?:sono|ammontano|arrivano|stanno) (?:le mie |le nostre |le )?spese|(?<![\p{L}])quanto (?:spendo|spendiamo|(?:mi |ci )?(?:è|e) costat[oaie]|(?:mi |ci )?sono costat[ie]|(?:mi |ci )costa(?:no)?)|(?<![\p{L}])quanto (?:se n'|se ne |ne )?(?:è|e|sono) andat[oaie]|(?<![\p{L}])quanto (?:soldi )?(?:per|in|da|a|al|alla|alle|ai|con|su|di|nel|nella)(?![\p{L}])|(?<![\p{L}])(?:le mie |le |il totale delle )?spese (?:totali|in totale|complessive)|(?<![\p{L}])quanto se ne è andato/u,
    incomeLead: /(?<![\p{L}])(?:quanto|quanti soldi) (?:ho|abbiamo) (?:guadagnato|incassato|ricevuto|preso|guadagnati)|(?<![\p{L}])quanto (?:mi|ci) hanno (?:pagato|dato|versato)|(?<![\p{L}])quante entrate(?: (?:ho|abbiamo) avuto)?|(?<![\p{L}])(?:quali sono |a quanto ammontano )(?:le mie |le nostre |le )?entrate|(?<![\p{L}])quanto (?:è entrato|e entrato|mi è entrato|mi e entrato|guadagno)|(?<![\p{L}])(?:le mie |le )?entrate (?:totali|in totale)|(?<![\p{L}])(?:il mio )?reddito (?:totale|in totale)/u,
    recentDays: /(?<![\p{L}])(?:(?:negli|nei|gli|i) )?(?:ultimi|scorsi) (\d{1,3}) giorni|(?<![\p{L}])(?:(?:negli|nei) )?(\d{1,3}) giorni (?:scorsi|passati)/u,
    periods: [
      periodWords(['in questo periodo di paga', 'questo periodo di paga', 'periodo di paga', 'fino allo stipendio', 'fino al prossimo stipendio', 'prima dello stipendio', 'dallo stipendio', "dall'ultimo stipendio", 'dall ultimo stipendio', 'da quando ho preso lo stipendio', 'da quando mi hanno pagato', 'questo periodo'], 'budget'),
      periodWords(['lo scorso weekend', 'questo weekend', 'nel weekend', 'il weekend', 'questo fine settimana', 'nel fine settimana', 'il fine settimana', 'weekend'], 'weekend'),
      periodWords(['oggi', 'stamattina', 'questo pomeriggio', 'stasera'], 'today'),
      periodWords(['ieri'], 'yesterday'),
      periodWords(['la settimana scorsa', 'settimana scorsa', 'la scorsa settimana', 'la settimana passata'], 'lastWeek'),
      periodWords(['questa settimana', 'nella settimana', 'la settimana', 'in settimana'], 'week'),
      periodWords(['il mese scorso', 'mese scorso', 'lo scorso mese', 'il mese passato'], 'lastMonth'),
      periodWords(['questo mese', 'nel mese', 'il mese', 'in questo mese', 'finora questo mese', 'al mese', 'fino a fine mese', 'fino alla fine del mese'], 'month'),
      periodWords(["l'anno scorso", "l anno scorso", 'anno scorso', "lo scorso anno", "l'anno passato"], 'lastYear'),
      periodWords(["quest'anno", "quest anno", "questo anno", "nell'anno", "l'anno", "in questo anno"], 'year'),
      periodWords(['in totale', 'in tutto', 'complessivamente', 'finora', 'fino ad ora', "dall'inizio", 'da sempre', 'totale'], 'all'),
    ],
    strip: [
      /^(?:(?:più o meno|circa|all'incirca|un|uno|una|mi dici|dimmi|mi sai dire|sai dirmi|puoi dirmi|potresti dirmi|vorrei sapere|fammi sapere|fammi vedere|mostrami|per|in|da|a|al|alla|alle|ai|agli|con|col|coi|su|di|del|della|dei|delle|nel|nella|il|lo|la|i|gli|le|mio|mia|miei|mie|e|soldi|ho|abbiamo|già|gia|speso|pagato)\s+)+/u,
      /(?:\s+(?:più o meno|circa|in totale|finora|per favore|grazie|soldi|già|gia|speso|pagato|il|la|mio|mia|(?:ho|abbiamo) (?:fatto|messo|preso|comprato|speso|pagato|bevuto|mangiato)))+$/u,
      /^(?:per|in|da|a|al|alla|con|col|su|di|del|della|nel|nella|il|lo|la|i|le|e|ho|abbiamo)$/u,
      /(?<![\p{L}])(?:soldi|euro|euri|dollari)(?![\p{L}])/gu,
    ],
    remainingLead: /(?<![\p{L}])(?:quanto (?:mi |ci )?(?:resta|rimane|avanza)|quanto (?:mi |ci )?(?:è|e) (?:rimast|avanzat)[oa]|cosa (?:mi |ci )?(?:è|e) rimast[oa]|quanto (?:ho|abbiamo) ancora|quanti soldi (?:mi |ci )?(?:ho|abbiamo|hai)(?! (?:\p{L}+[aiu]t[oiae]|speso|spesi|preso|presi|messo|messi|perso|persi|fatto|fatti|speso)(?![\p{L}]))|quanto (?:ho|abbiamo) (?:ancora )?a disposizione|(?<!\d.*)(?:(?:ho|abbiamo) ancora (?:dei |degli |del |un po' di |qualche )?(?:soldi|budget|margine|spazio)|c'(?:è|e) ancora (?:qualcosa|spazio|margine|budget|dei soldi|soldi)|(?:mi |ci )?(?:è|e) rimasto qualcosa|(?:mi |ci )?(?:resta|rimane|avanza) (?:ancora )?qualcosa|come (?:sto|stiamo|sono|siamo) (?:mess[oaie]|andando|combinat[oaie])|(?:sto|stiamo|sono|siamo|vado|andiamo) (?:bene|a posto|ok|okay|mess[oaie] bene)(?= (?:con|col|coi|per|su|sul|sulla|sui|sulle|a|in|nel|nella)(?![\p{L}])|\s*$)|come (?:va|procede|sta andando)(?= (?:il|col|con|coi|questo|questa)(?![\p{L}]))|(?:sono|siamo|sto|stiamo) (?:ancora )?(?:nel|dentro il|entro il|sotto il|nei limiti del|in) budget)(?!.*\d)|(?:qual è|qual e|quale è|com'è|com e) (?:il mio|il nostro|il) saldo|quanti soldi (?:mi |ci )?(?:restano|rimangono|avanzano)|quanto (?:posso|possiamo) (?:ancora )?spendere|(?:qual è|qual e|quale è|quale e|com'è|com e) (?:il mio|il nostro|il) budget|(?:il mio |il )?budget (?:rimanente|residuo|restante)|cosa (?:mi |ci )?(?:resta|rimane))(?![\p{L}])/u,
    remainingWords: /(?<![\p{L}])(?:budget|piano|piani|rimanente|residuo|restante|disponibile|disponibili|a disposizione|ancora|da spendere|soldi|resta|rimane|qualcosa|spazio|margine)(?![\p{L}])/gu,
    weakLead: /(?<![\p{L}])(?:(?:quali sono |a quanto ammontano |dimmi |fammi vedere )?(?:le mie |le nostre |le )?spese(?: totali| in totale| fatte)?(?: (?:per|di|in|su|al|alla|nel|nella|da|dal|dalla|del|della))?|(?:qual è |qual e |dimmi )?(?:il mio |il )?totale(?: speso| spese| delle spese)?(?: (?:per|di|del|della|dei|delle|in|su|al|alla|da))?|quant[oaie](?! (?:è|e|sono|costa|costano|fa|fanno|ho|hai|mi|ci|posso|vale|volte|tempo|basta)(?![\p{L}])))(?![\p{L}])/u,
    groups: [
      { words: ['cibo', 'mangiare', 'pasti', 'cibo e bevande', 'da mangiare'], ids: ['groceries', 'dining'] },
    ],
    monthNames: monthNames(['gennaio|gen', 'febbraio|feb', 'marzo|mar', 'aprile|apr', 'maggio|mag', 'giugno|giu', 'luglio|lug', 'agosto|ago', 'settembre|sett|set', 'ottobre|ott', 'novembre|nov', 'dicembre|dic']),
    // "ho speso più del mese scorso?", "sto spendendo di più o di meno?", "come sto rispetto al mese scorso?".
    // A bare "più o meno" means "roughly" ("quanto ho speso più o meno questo mese"), so it compares only
    // when a base follows it; "per cosa ho speso di più" asks where most went (topLead), not a comparison.
    compareBefore: /(?<![\p{L}])(?:(?:la settimana|il mese|l'anno|l’anno|il giorno|il weekend|il fine settimana|il periodo) (?:prima|precedente)|quell[ao] prima|precedente)(?![\p{L}])/iu,
    compareLead: /(?:(?<!(?:cosa|dove|cui|che|categoria|categorie) )(?<![\p{L}])(?:(?:ho|abbiamo|hai|avete) speso|(?:sto|stiamo|stai|state) spendendo|spendo|spendiamo|spendi)(?: [^\s]+){0,4}? (?:di (?:più|meno)(?: o di (?:più|meno))?|in (?:più|meno)|(?<!(?:più|meno) o )(?:più|meno)(?! o (?:più|meno)(?![\p{L}])(?! (?:(?:del|dello|della|dei|degli|delle|di|rispetto|in confronto|che)(?![\p{L}])|dell'))))(?![\p{L}])|(?<![\p{L}])(?:rispetto (?:a|al|allo|alla|ai|agli|alle)(?![\p{L}])|rispetto all'|in confronto (?:a|al|allo|alla|ai|agli|alle)(?![\p{L}])|in confronto all'|confrontat[oaie] (?:con|col)(?![\p{L}])|paragonat[oaie] (?:a|al|alla|allo)(?![\p{L}])|(?:più|meno) (?:del|di|che) (?:solito|prima)(?![\p{L}])|(?:sono|sto|siamo|stiamo|vado|andiamo) (?:mess[oaie] )?(?:meglio|peggio)(?: o (?:meglio|peggio))? (?:del|della|di|rispetto|che|in confronto)(?![\p{L}])|(?:le mie |le nostre |le )?spese (?:sono |stanno )?(?:aumentat[ei]|diminuit[ei]|salit[ei]|sces[ei]|calat[ei]|in aumento|in calo)(?![\p{L}])))|(?<![\p{L}])(?:vs\.?|versus|rispetto a)(?![\p{L}])/u,
    // "per cosa ho speso di più?", "dove sono finiti i miei soldi?", "qual è la mia spesa più grande?".
    // "what was my biggest expense": the single largest entry; the plural, and "what did I spend the most on", stay the biggest category.
    biggestLead: /(?<![\p{L}])(?:(?:qual (?:è|e|era|è stata|e stata) )?(?:la mia|la nostra|la) (?:spesa|uscita) (?:singola )?(?:più|piu) (?:grande|grossa|alta|cara)(?![\p{L}])|(?:qual (?:è|e|era|è stato|e stato) )?(?:il mio|il nostro|il) (?:acquisto|pagamento) (?:più|piu) (?:grande|grosso|caro|alto)(?![\p{L}])|(?:la mia|la nostra|la) (?:spesa|uscita) (?:maggiore|massima)(?![\p{L}])|la cosa (?:più|piu) cara che ho (?:comprato|pagato|preso)|(?:qual (?:è|e) )?la (?:spesa|cosa) (?:più|piu) cara)(?![\p{L}])/u,
    oweLead: /(?<![\p{L}])(?:quanto (?:devo|dobbiamo|ho di debiti|abbiamo di debiti|devo ancora pagare|mi resta da pagare)|quanti debiti ho|cosa devo|quanto sono indebitat[oa]|i miei debiti (?:in totale|totali)|il mio debito totale)(?![\p{L}])/u,
    planLead: /(?<![\p{L}])(?:(?:imposta|impostare|impostami|metti|mettere|mettimi|fissa|fissare|cambia|cambiare|alza|alzare|abbassa|abbassare|porta|portare) (?:il |un |una |la |il mio |la mia |mio |mia )?(?=(?:\p{L}+ )?(?:budget|piano|limite|tetto)(?![\p{L}]))|(?:un |il |mio |la )?(?:budget|piano|limite|tetto) (?:mensile |settimanale )?(?:di|per|a|su)(?![\p{L}])|(?:budget|piano|limite|tetto) (?:\p{L}+ )?(?:a|su)(?![\p{L}]))/u,
    planWords: /(?<![\p{L}])(?:budget|piano|limite|tetto|di|per|a|al|su|il|un|una|la|mio|mia|mese|settimana|mensile|settimanale|ogni|è|sia|imposta|impostami|metti|mettimi|fissa|porta)(?![\p{L}])/gu,
    owedLead: /(?<![\p{L}])(\p{L}+(?: \p{L}+)?) (?:mi|ci) deve(?![\p{L}])/u,
    dueLead: /(?<![\p{L}])(?:quando (?:scade|scadono|devo pagare|dobbiamo pagare|si paga|si pagano|pago|paghiamo|arriva|arrivano|tocca|toccano|c'è|c'e|ci sono|parte|partono|è|e|sono|mi tocca pagare|va pagato|va pagata|vanno pagati|vanno pagate) (?:il |lo |la |l'|i |gli |le |mio |mia |miei |mie |nostro |nostra |prossimo |prossima )?(?=\p{L}+)|quando (?:è|e|sono|scade|scadono) (?:il |lo |la |l'|i |gli |le |mio |mia )?\p{L}+(?: \p{L}+)? (?:in scadenza|da pagare|dovuto|dovuta)|(?:quali|che) (?:bollette|pagamenti|rate|abbonamenti|spese fisse|scadenze|addebiti|fatture) (?:arrivano|arriva|scadono|scade|devo pagare|dobbiamo pagare|ci sono|c'è|c'e|mancano|restano|sono in arrivo|sono in scadenza|sono previsti|sono previste|sono da pagare|ho (?:da|in) (?:pagare|scadenza|arrivo)|mi aspettano|mi toccano)|cosa (?:devo|dobbiamo|c'è da|c'e da|ho da|ho ancora da|mi resta da|resta da|manca da) pagare|cosa (?:scade|arriva|c'è in arrivo|c'e in arrivo|è in arrivo|e in arrivo|è previsto|e previsto|è in scadenza|e in scadenza|mi aspetta|tocca pagare|devo ancora pagare)|(?:le |i |gli |mie |miei |mio |mia )?(?:prossime|prossimi|prossima|prossimo) (?:bollette|pagamenti|rate|scadenze|addebiti|spese|fatture|bolletta|pagamento|rata|scadenza|addebito)|(?:bollette|pagamenti|rate|scadenze|addebiti|fatture) (?:in arrivo|in scadenza|da pagare|previsti|previste|in sospeso|che arrivano|che scadono)|(?:qualcosa|niente) (?:da pagare|in scadenza|in arrivo)|(?:cosa |che cosa )?(?:mi )?resta da pagare|in arrivo|in scadenza)(?:(?<=\s)|(?![\p{L}]))/u,
    rulesLead: /(?<![\p{L}])(?:quanto (?:è|e|costa|costano|pago|paghiamo|mi costa|mi costano|viene|vengono|spendo|spendiamo|sono|mi viene|mi vengono|vale|pago di|pago per|spendo di|spendo per|pago in|spendo in|ho di) (?:il |lo |la |l'|i |gli |le |mio |mia |miei |mie |nostro |nostra |di |per |in )?(?:affitto|mutuo|abbonament[oi]|bollett[ae]|rat[ae]|spese fisse|spese ricorrenti|assicurazione|palestra|telefono|cellulare|internet|luce|acqua|gas|auto|macchina|canone|canoni|uscite fisse|voci ricorrenti)|(?:quali|cosa|che cosa|che) (?:sono|ho|abbiamo|ho come|c'è|c'e|ci sono|tengo|ho attiv[io]) (?:i miei |le mie |i |le |gli |di |come )?(?:abbonamenti|bollette|rate|spese fisse|spese ricorrenti|uscite fisse|uscite ricorrenti|voci ricorrenti|pagamenti (?:fissi|ricorrenti|mensili)|canoni|addebiti (?:fissi|ricorrenti|mensili))|(?:elenca|elencami|mostra|mostrami|dimmi|leggi|leggimi|fammi vedere|fai vedere|lista|listami) (?:i miei |le mie |i |le |gli |tutti i miei |tutte le mie |tutti i |tutte le )?(?:abbonamenti|bollette|rate|spese fisse|spese ricorrenti|uscite fisse|uscite ricorrenti|voci ricorrenti|pagamenti (?:fissi|ricorrenti|mensili)|canoni|addebiti (?:fissi|ricorrenti|mensili))|cosa pago (?:ogni mese|al mese|mensilmente|tutti i mesi|di fisso|in abbonamenti|di abbonamenti)|quanto pago (?:ogni mese|al mese|mensilmente|tutti i mesi|di fisso|di (?:affitto|mutuo|abbonamenti|bollette|luce|gas|acqua|internet|telefono|assicurazione|palestra)|per (?:affitto|mutuo|abbonamenti|bollette|luce|gas|acqua|internet|telefono|assicurazione|palestra)|in (?:abbonamenti|bollette|spese fisse|rate))|(?:i miei |le mie |i |le )?(?:abbonamenti|bollette|spese fisse|rate|canoni) (?:al mese|ogni mese|mensili|mensile|in totale|totali|tutti insieme|tutte insieme))(?:(?<=\s)|(?![\p{L}]))/u,
    dueWords: /(?<![\p{L}])(?:bollett[ae]|pagament[oi]|rat[ae]|abbonament[oi]|spese fisse|spese ricorrenti|uscite fisse|uscite ricorrenti|voci ricorrenti|scadenz[ae]|addebit[oi]|fattur[ae]|canon[ei]|in arrivo|in scadenza|da pagare|in sospeso|previst[oiae]|prossim[oiae]|scade|scadono|arriva|arrivano|tocca|toccano|resta|restano|manca|mancano|parte|partono|al mese|ogni mese|tutti i mesi|mensil(?:e|i|mente)|a settimana|ogni settimana|settimanal[ei]|all'anno|ogni anno|annual[ei]|in totale|total[ei]|tutti insieme|tutte insieme|di fisso|quando|quanto|quali|cosa|che cosa|che|è|e|sono|costa|costano|pago|paghiamo|mi costa|mi costano|viene|vengono|mi viene|mi vengono|spendo|spendiamo|vale|devo|dobbiamo|ho|abbiamo|c'è|c'e|ci sono|tengo|il|lo|la|l'|i|gli|le|mio|mia|miei|mie|nostro|nostra|di|per|in|da|come|tutti|tutte|qualcosa|niente|mi|si|va|vanno)(?![\p{L}])/gu,
    savedLead: /(?<![\p{L}])(?:quanto (?:ho|abbiamo|avevo|sono riuscit[oa] a|siamo riusciti a) (?:messo da parte|messo via|risparmiato|accantonato|messo nel|messo sul|messo in|versato|accumulato|mettere da parte|risparmiare|accantonare)|quanto (?:ho|abbiamo|c'è|c'e|ci sono|tengo|ho messo) (?:nel |nella |sul |sulla |per |in |per il |per la |nel mio |nella mia )?(?=\p{L}+(?: \p{L}+)? ?(?:fondo|salvadanaio|obiettivo|risparmi|cassa)(?![\p{L}]))|quanto (?:ho|c'è|c'e) (?:nei |sui |di )?(?:miei )?risparmi|(?:a che punto|come) (?:sono|siamo|va|sto|stiamo|procede|è messo|e messo|è messa|e messa) (?:con |il mio |la mia |l'|il |la )?(?:obiettivo|fondo|salvadanaio|risparmio|risparmi|\p{L}+ (?:obiettivo|fondo|salvadanaio))|quanto (?:mi )?manca (?:per |al |alla |all'|a )(?:il |la |l'|mio |mia )?(?:obiettivo|traguardo|\p{L}+)|(?:i miei |i )?risparmi (?:di questo mese|questo mese|questa settimana|quest'anno|finora|in totale|totali))(?:(?<=\s)|(?![\p{L}]))/u,
    savedWords: /(?<![\p{L}])(?:messo da parte|messo via|mettere da parte|risparmiat[oa]|risparmiare|risparmio|risparmi|accantonat[oa]|accantonare|messo nel|messo sul|messo in|messo|versat[oa]|accumulat[oa]|fondo|fondi|salvadanaio|obiettivo|obiettivi|traguardo|cassa|nel|nella|sul|sulla|per|in|a|al|alla|all'|il|lo|la|l'|i|gli|le|mio|mia|miei|mie|dei|nei|sui|di|finora|in totale|totali|a che punto|come|sono|siamo|va|sto|stiamo|procede|sta andando|è messo|e messo|è messa|e messa|con|manca|mi|riuscit[oa]|riusciti)(?![\p{L}])/gu,
    averageLead: /(?<![\p{L}])(?:(?:qual è |qual e |quanto è |quanto e |quanto fa )?(?:la mia |la nostra |la )?(?:spesa|media) (?:media |giornaliera |settimanale )?(?:al giorno|giornaliera|ogni giorno|a settimana|settimanale|ogni settimana|in media|media)|quanto (?:spendo|spendiamo|pago|paghiamo|sto spendendo) (?:in media |mediamente |di media )?(?:per \p{L}+(?: \p{L}+)? |in \p{L}+(?: \p{L}+)? |di \p{L}+(?: \p{L}+)? )?(?:al giorno|ogni giorno|giornalmente|a settimana|ogni settimana|settimanalmente|alla settimana)(?: in media| mediamente| di media)?|in media quanto|mediamente quanto|quanto (?:spendo|spendiamo) (?:in media|mediamente|di media)|media (?:giornaliera|settimanale|al giorno|a settimana|delle spese|di spesa)|spesa media)(?![\p{L}])/u,
    perWeek: /(?<![\p{L}])(?:a settimana|alla settimana|ogni settimana|settimanal(?:e|mente))(?![\p{L}])/u,
    averageWords: /(?<![\p{L}])(?:in media|mediamente|di media|media|medio|al giorno|ogni giorno|giornalier[ao]|giornalmente|a settimana|alla settimana|ogni settimana|settimanal[ei]?|settimanalmente|spesa|spese|spendo|spendiamo|pago|paghiamo|sto spendendo|quanto|qual è|qual e|fa|la|il|mia|mio|nostra|nostro|per|in|di|a|al|delle)(?![\p{L}])/gu,
    countLead: /(?<![\p{L}])(?:quante volte (?:ho|abbiamo|sono|siamo|avevo|ci sono)|quante volte|ogni quanto|con che frequenza|quanti (?:caffè|caffe|pranzi|cene|pasti|ordini|acquisti|viaggi|uber|taxi|movimenti|registrazioni|voci|spese|giri)(?![\p{L}])|quante (?:cene|spese|uscite|volte|corse|colazioni|pizze|birre)(?![\p{L}])|quant[ei] (?=\p{L}+ (?:ho|abbiamo|questo|questa|quest'|il|la|in|da|durante))|numero di (?:volte|movimenti|acquisti|ordini|spese|voci))(?![\p{L}])/u,
    countWords: /(?<![\p{L}])(?:quante volte|volte|volta|ogni quanto|frequenza|con che|quant[ei]|numero di|ho|abbiamo|sono|siamo|avevo|ci sono|stat[oa]|andat[oa]|mangiato|ordinato|comprato|pagato|preso|fatto|bevuto|registrato|segnato|movimenti|registrazioni|voci|spese|acquisti|ordini|al|alla|allo|ai|agli|alle|a|in|da|dal|dalla|il|lo|la|l'|i|gli|le|mio|mia|un|una|fuori|ristorante)(?![\p{L}])/gu,
    lastLead: /(?<![\p{L}])(?:(?:qual è|qual e|qual era|qual è stata|qual e stata|qual è stato|qual e stato|cos'è|cos'era|cos è) (?:la mia |il mio |la |il |l'|la nostra |il nostro )?(?:ultima|ultimo) (?:voce|spesa|movimento|registrazione|cosa(?: che ho (?:segnato|registrato|inserito|aggiunto|messo|detto))?|uscita|entrata)?|cosa (?:ho|abbiamo) (?:segnato|registrato|inserito|aggiunto|messo|salvato) (?:per ultimo|per ultima|alla fine|da ultimo)|(?:l'|la )?ultima cosa che (?:ho|abbiamo) (?:segnato|registrato|inserito|aggiunto|messo|detto|salvato)|(?:mostra|mostrami|fammi vedere|dimmi|leggi|leggimi) (?:la mia |il mio |la |il |l')?(?:ultima|ultimo) (?:voce|spesa|movimento|registrazione|uscita)?|(?:la mia |la |l')?ultima (?:voce|spesa|registrazione))(?![\p{L}])/u,
    topLead: /(?<![\p{L}])(?:(?:(?:per|in|su|con|a) )?(?:che )?cosa|dove|(?:in|su|per) cui|(?:in|su|per) quale categoria)(?: [^\s]+){0,3}? (?:speso|spes[oi]|spendo|spendiamo|spendi|spendendo|pagato|pago|costa|costano|costato|costati|buttato|va|vanno|finisce|finiscono)(?: [^\s]+){0,3}? (?:di più|più|maggiormente|la maggior parte|il grosso)(?![\p{L}])|(?<![\p{L}])(?:cosa|che cosa) (?:mi|ci) (?:costa|costano|è costato|e costato|sono costati) (?:di )?più(?![\p{L}])|(?<![\p{L}])dove (?:sono|è|e) (?:finit[ioa]|andat[ioa])(?: a finire)?(?: (?:tutti |tutto )?(?:i |le |lo |la |il )?(?:miei |mie |nostri |nostre |mio |mia )?(?:soldi|spese|risparmi|euro|stipendio|paga|busta paga|guadagni)(?![\p{L}]))?|(?<![\p{L}])dove (?:se ne )?(?:vanno|va|finiscono|finisce|sono andati|sono finiti|è andata|è andato|e andato|è finita|è finito)(?: a finire)? (?:(?:la maggior parte|il grosso|la parte più grande) (?:dei|delle|di) |tutti |tutto )?(?:i |le |lo |la |il )?(?:miei |mie |nostri |nostre |mio |mia )?(?:soldi|spese|risparmi|euro|stipendio|paga|busta paga|guadagni)(?![\p{L}])|(?<![\p{L}])(?:qual è |qual e |quale è |quale e |qual'è |quali sono |dimmi )?(?:la mia |la nostra |la |le mie |le nostre |le )?(?:spes[ae]|uscit[ae]|categori[ae]|voc[ei]) (?:più (?:grand[ei]|gross[ae]|alt[ae]|car[ae]|costos[ae]|pesant[ei]|important[ei])|maggior[ei]|principal[ei])(?![\p{L}])/u,
    // "posso permettermi una giacca da 200?": read with the amount already taken out ("posso permettermi una giacca da").
    affordLead: /(?<![\p{L}])(?:(?:posso|possiamo|potrei|potremmo|riesco a|riusciamo a|riuscirei a) (?:ancora )?(?:permettermi|permetterci|permettermel[oaie]|permettercel[oaie]|spendere|comprare|comprarmi|prendere|prendermi|fare)|(?:me|ce) (?:lo|la|li|le) (?:posso|possiamo|potrei) (?:ancora )?permettere|(?:mi|ci) (?:posso|possiamo) (?:ancora )?permettere|ce la (?:faccio|facciamo|fai|farei|faremmo)(?: (?:con|a (?:comprare|prendere|spendere)|se (?:spendo|compro|prendo)))?|(?:va|vanno|andrebbe|andrebbero) bene (?:se (?:spendo|spendiamo|compro|compriamo|prendo|prendiamo)|spendere|per)|(?:va|vanno|andrebbe|andrebbero) bene$|(?:è|e) (?:ok|okay|un problema)(?: se (?:spendo|spendiamo|compro|compriamo|prendo|prendiamo)| spendere)|(?:ho|abbiamo) (?:ancora )?(?:abbastanza|abbastanza soldi|i soldi|margine|spazio) per|c'(?:è|e) (?:ancora )?(?:spazio|margine|posto) per|(?:rientra|rientrano|ci sta|ci stanno|sta|stanno|resto|restiamo|sto|stiamo) (?:ancora )?nel (?:mio |nostro )?budget(?: se (?:spendo|compro|prendo))?|(?:ci (?:sta|stanno|starebbe|starebbero)|rientr(?:a|ano|erebbe|erebbero))(?=.* (?:nel|dentro il|entro il) (?:mio |nostro )?budget(?![\p{L}]))|(?:sto|stiamo) (?:ancora )?(?:dentro|nei limiti) (?:il|del) budget se (?:spendo|compro|prendo))(?![\p{L}])/u,
    askWords: /(?<![\p{L}])(?:di più o di meno|più o meno|di più|di meno|in più|in meno|più|meno|o|rispetto|in confronto|confrontat[oaie]|paragonat[oaie]|del solito|di solito|di prima|troppo|poco|precedente|la maggior parte|la parte più grande|il grosso|maggiormente|grand[ei]|gross[ae]|maggior[ei]|principal[ei]|i miei soldi|miei soldi|i nostri soldi|soldi|tutti|permettermi|permetterci|permettermel[oaie]|permettere|spendere|comprare|comprarmi|prendere|prendermi|spendo|spendiamo|spendendo|speso|spesi|sto|stiamo|stai|come|va|vado|andando|procede|mess[oaie]|sono|siamo|meglio|peggio|un|uno|una|qualcosa|anche|ancora|quanto)(?![\p{L}])|(?<![\p{L}])un'|(?<![\p{L}])(?:del|dello|della|dei|degli|delle|di|che|da|a|al|alla|allo|ai|alle|con|col|per|se|in|nel|nella|nello|nei|negli|nelle|sul|sulla|dentro il|entro il|dell'|all')\s*$/gu,
  },
  // Fixing the last entry by voice. "cancellalo", "lascia stare" remove it; "in realtà erano 14", "no, 14",
  // "cambialo in trasporti", "era ieri" change it. Only a new amount, category or date may follow the lead.
  correction: {
    remove: /(?:^(?:(?:oh|ops|oops|scusa|scusami|aspetta|ah|ehm|mmm|uff|ok|okay|no|anzi|niente|in realtà|ho sbagliato|mi sono sbagliat[oa]|errore|sbagliato)[, ]+)*(?:(?:puoi|potresti|per favore|mi)[, ]+)?(?:(?:(?:cancell|elimin|annull|scart|ignor|lev|dimentic)(?:a|are|alo|ala|arlo|arla)|togli|toglilo|toglila|togliere|toglierlo|toglierla|rimuovi|rimuovilo|rimuovila|rimuovere|rimuoverlo|rimuoverla|butta via|buttalo via|buttala via|buttalo|buttala|non contarl[oa]|non lo contare|non la contare)(?: (?:quello|quella|questo|questa|quest'ultim[oa]|quell'ultim[oa]|l'? ?ultim[oa]|la voce|la spesa|l'entrata|l'inserimento|il movimento|la transazione|l'ultima cosa))?(?: (?:spesa|voce|cosa|entrata|uscita|inserimento|movimento|transazione|registrazione|operazione|acquisto|importo))?(?: (?:che ho (?:detto|inserito|aggiunto|messo|registrato|segnato|scritto)|di prima|di poco fa|appena (?:inserit[oa]|aggiunt[oa]|segnat[oa]|registrat[oa])))?|lascia stare|lascia perdere|lasciamo stare|lasciamo perdere|lascia correre|non importa|non fa niente|fa niente|niente|scordatelo|dimenticatelo|non (?:lo|la) segnare|non segnarl[oa]|annulla tutto)(?:[, ]+(?:per favore|grazie|dai))?$)|^(?:annulla(?:re|lo|la)?)$/u,
    // "togli l'uber", "cancella quella di spotify": removing a named entry. No digit may follow the verb,
    // so "cancella netflix 15,99" stays a new entry.
    notTail: /\s+(?:e )?non [€$]?\d[\d.,]*(?: ?(?:euro|euri|€))?$/u,
    removeTarget: /^(?:(?:oh|ops|oops|scusa|scusami|aspetta|ok|okay|no|anzi|niente|ho sbagliato)[, ]+)*(?:(?:puoi|potresti|per favore)[, ]+)?(?:cancella|elimina|togli|rimuovi|annulla|dimentica|scorda|leva|scarta|ignora|butta via)(?: (?:pure|anche))?(?: (?:quello|quella|quell'ultim[oa]|la voce|la spesa|l'entrata|l'uscita|il movimento|la cosa|l'inserimento)(?: (?:di|del|della|dello|dei|degli|delle|con|per|su|sul|sulla)(?![\p{L}])| dell')?)?\s*(?<target>[^\d]+?)(?:[, ]+(?:per favore|grazie|dai))?$/u,
    // "cambia il pranzo a 15", "quell'uber era 32 non 23", "il pranzo era ieri": a named entry and its new value.
    targetLeads: [
      /^(?:(?:oh|ops|scusa|scusami|aspetta|ok|okay|no|anzi|ho sbagliato)[, ]+)*(?:cambia|correggi|modifica|aggiorna|sposta|metti|segna|porta)(?: (?:il|la|lo|i|le|gli|quel|quella|quello|quei|quelle)| l'| quell')?\s*(?<target>[^\d]+?) (?:a|in|con|come|su|sotto|nel|nella|nei|negli|nelle|sul|sulla|al|alla) (?<rest>.+)$/u,
      /^(?:(?:no|anzi|scusa|scusami|aspetta|ho sbagliato)[, ]+)*(?:(?:quel|quella|quello|il|la|lo|i|le|gli)\s|l'|quell')?(?<target>[^\d]+?) (?:era|erano|è|sono|costava|costavano|faceva|facevano|fa|fanno|veniva|venivano|è stato|è stata) (?<rest>[€$]?\d[\d.,]*(?: ?(?:euro|euri|€))?)(?: e)? non [€$]?\d[\d.,]*(?: ?(?:euro|euri|€))?$/u,
      /^(?:(?:no|anzi|scusa|scusami|aspetta|ho sbagliato)[, ]+)*(?:(?:quel|quella|quello|il|la|lo|i|le|gli)\s|l'|quell')?(?<target>[^\d]+?) (?:era|è stato|è stata|erano|l'ho (?:fatt|pres|pagat|comprat)[oa]|risale a) (?<rest>(?:di )?(?:ieri|l'altro ?ieri|altro ieri|altroieri|stamattina|stasera|ieri sera|ieri mattina|lunedì|lunedi|martedì|martedi|mercoledì|mercoledi|giovedì|giovedi|venerdì|venerdi|sabato|domenica|la settimana scorsa|settimana scorsa|il \d{1,2}|\d+ giorni fa)(?: (?:scors[oa]|sera|mattina|pomeriggio))?)$/u,
    ],
    lead: /^(?:(?:oh|ops|oops|scusa|scusami|aspetta|ah|ehm|mmm|ok|okay|no|anzi|ho sbagliato|mi sono sbagliat[oa]|errore|pardon)[, ]+)*(?:(?:in realtà|in realta|veramente|a dire il vero|invece)[, ]+(?:(?:era|erano|è|sono|fa|fanno|costava|costavano|veniva|venivano)(?: (?:di|solo|circa))?(?=\s|$))?|(?:no|scusa|scusami|anzi|ops|oops|aspetta|un attimo|un momento|ehm|ehi|mmm|ah|ho sbagliato|mi sono sbagliat[oa]|errore|pardon)[, ]+(?:(?:era|erano|è|sono|fa|fanno|costava|costavano|veniva|venivano)(?: (?:di|solo|circa))?(?=\s|$)|(?=[€$]?\d|(?:ieri|oggi|l'altro ?ieri|altro ieri|altroieri|stamattina|stasera|lunedì|lunedi|martedì|martedi|mercoledì|mercoledi|giovedì|giovedi|venerdì|venerdi|sabato|domenica)(?![\p{L}])))|(?:l'importo|la cifra|la somma|il prezzo|il totale|la categoria|la data|il giorno) (?:giusto |giusta |corrett[oa] )?(?:era|erano|è|sono|doveva essere)(?=\s|$)|(?:volevo dire|intendevo dire|intendevo|cioè|doveva essere|dovevano essere|dovrebbe essere|dovrebbero essere)(?=[, ]|$)|(?:fai|facciamo|diciamo|fallo|falla|mettici)[, ]+(?=[€$]?\d)|(?:no|scusa|scusami|anzi|aspetta|ho sbagliato|mi sono sbagliat[oa])[, ]+(?:metti|mettici|segna|scrivi|fai|facciamo|diciamo)[, ]+(?=[€$]?\d)|(?:era|erano|costava|costavano|veniva|venivano|fa|fanno|ho detto|avevo detto|dicevo)(?= [€$]?\d[\d.,]*(?: ?(?:euro|euri|€))?$)|(?:era|erano|è stato|è stata|è stati|è successo|l'ho (?:fatt|pres|pagat|comprat)[oa])(?: di)?(?= (?:ieri|oggi|l'altro ?ieri|altro ieri|altroieri|stamattina|stasera|ieri sera|lunedì|lunedi|martedì|martedi|mercoledì|mercoledi|giovedì|giovedi|venerdì|venerdi|sabato|domenica|il \d|l'\d|la settimana scorsa|settimana scorsa|il mese scorso|\d+ giorni fa)(?![\p{L}]))|(?:(?:cambia|correggi|modifica|aggiorna|sposta|metti|segna|registra)l[oa]|(?:cambia|correggi|modifica|aggiorna)(?! (?:il|la|lo|i|le|gli|quel|quella|quello) (?!(?:importo|cifra|somma|prezzo|totale|categoria|data|giorno|in|a|con|come|su|sotto|nel|nella|al|alla)(?![\p{L}])|ultim))(?! (?:l'|quell')(?!importo|ultim))(?: (?:quello|quella|questo|questa|l'? ?ultim[oa](?: (?:spesa|voce|entrata|inserimento|movimento|cosa))?))?|(?:sposta|metti|segna) (?:quello|quella|questo|questa|l'? ?ultim[oa](?: (?:spesa|voce|entrata|inserimento|movimento|cosa))?))(?: (?:l'|la |il )?(?:importo|cifra|somma|prezzo|totale|categoria|data|giorno))?(?: (?:in|a|con|come|su|sotto|nella|nel|nei|negli|nelle|sui|sulla|sul|alla|al|ai|alle|tra|fra|per|tra le|fra le|tra i|fra i))?(?=\s|$))[, ]*/u,
  },
  contextualStrings: ['euro', 'spesa', 'affitto', 'stipendio', 'obiettivo', 'Netflix', 'Uber', 'pranzo'],
};
