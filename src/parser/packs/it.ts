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
const units: Record<string, number> = { zero: 0, uno: 1, un: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10, undici: 11, dodici: 12, tredici: 13, quattordici: 14, quindici: 15, sedici: 16, diciassette: 17, diciotto: 18, diciannove: 19 };
for (const [t, tv] of TENS) {
  for (const [u, uv] of UNITS_G) {
    const stem = uv === 1 || uv === 8 ? t.slice(0, -1) : t; // ventuno, ventotto
    units[stem + u] = tv + uv;
  }
}
const hundreds: Record<string, number> = { duecento: 200, trecento: 300, quattrocento: 400, cinquecento: 500, seicento: 600, settecento: 700, ottocento: 800, novecento: 900 };

const numberWords = makeNumberWords({
  units,
  tens: Object.fromEntries(TENS),
  hundred: ['cento'],
  hundreds,
  thousand: ['mille', 'mila'],
  million: ['milione', 'milioni'],
  connectors: ['e'],
  connectorCents: true,
  one: ['un', 'uno', 'una'],
  pre: (t) => t.replace(/(\p{L})(cento|mille|mila)(?=\p{L})/gu, '$1 $2 ').replace(/(?<![\p{L}])(\p{L}+)(cento|mille|mila)\b/gu, (m, a: string, b: string) => (a in units || a in hundreds ? `${a} ${b}` : m)).replace(/\b(cento|mille|mila)(?=\p{L})/gu, '$1 '),
});

export const it: LanguagePack = {
  code: 'it',
  speechTag: 'it-IT',
  tokenizer: 'space',
  decimalComma: true,
  numberWords,
  currencyMarkers: /€|\$|euro|euri|dollari|dollaro|usd|eur|chf|franchi/i,
  currencyWords: /(?<![\p{L}])(?:euro|euri|dollari|dollaro|usd|eur|chf|franchi|centesimi|centesimo)(?![\p{L}])/giu,
  incomeVerbs: ['ho ricevuto', 'ricevuto', 'ricevuti', 'stipendio', 'busta paga', 'mi hanno pagato', 'mi ha pagato', 'sono stato pagato', 'guadagnato', 'guadagnati', 'incassato', 'incassati', 'rimborso', 'rimborsato', 'rimborsati', 'entrata', 'entrate', 'bonus', 'premio', 'commissione', 'venduto', 'venduti', 'mance', 'regalo da', 'mi ha regalato', 'mi hanno regalato', 'mi ha dato', 'mi hanno dato', 'mi ha mandato', 'mi hanno mandato', 'bonifico ricevuto', 'pensione', 'accredito', 'accreditato', 'mi ha restituito', 'mi hanno restituito', 'restituito', 'mi ha ridato', 'mi hanno ridato', 'mi ha reso', 'mi è entrato', 'mi e entrato', 'mi sono entrati', 'sono stata pagata', 'mi hanno accreditato', 'tredicesima', 'quattordicesima', 'borsa di studio', 'dividendi'],
  expenseVerbs: ['ho speso', 'speso', 'spesi', 'ho pagato', 'pagato', 'pagati', 'ho comprato', 'comprato', 'comprati', 'spesa', 'acquisto', 'acquistato', 'costato', 'costa', 'costati', 'ordinato', 'preso', 'presi', 'donato', 'prestato', 'prelevato', 'mandato', 'inviato', 'bolletta', 'ho dato', 'dato', 'messo', 'speso per', 'pago', 'compro', 'spendo', 'offerto', 'versato', 'addebitato', 'addebitati', 'sborsato', 'sborsati', 'tirato fuori', 'buttato', 'buttati'],
  keywords: {
    salary: ['stipendio', 'busta paga', 'mi hanno pagato', 'sono stato pagato', 'sono stata pagata', 'paga', 'salario', 'mensilità', 'tredicesima', 'quattordicesima'],
    freelance: ['freelance', 'partita iva', 'cliente', 'fattura pagata', 'fattura incassata', 'lavoretto', 'lavoro extra', 'consulenza', 'commissione', 'ripetizioni', 'venduto', 'vendita', 'vinted', 'subito', 'mance', 'upwork', 'fiverr'],
    gift_income: ['regalo da', 'mi ha regalato', 'mi hanno regalato', 'mi ha dato', 'mi hanno dato', 'soldi di compleanno', 'da mia madre', 'da mio padre', 'da mamma', 'da papà', 'dalla nonna', 'dal nonno', 'paghetta'],
    other_income: ['rimborso', 'rimborsato', 'cashback', 'interessi', 'dividendi', 'bonus', 'premio', 'rimborso 730', 'rimborso tasse', 'vinto', 'lotteria', 'gratta e vinci', 'pensione', 'borsa di studio', 'sussidio', 'naspi', 'disoccupazione', 'assegno unico', 'mi ha restituito', 'restituito', 'bonifico da', 'satispay da', 'paypal da'],
    groceries: ['carta igienica', 'carta da cucina', 'spesa', 'supermercato', 'supermarket', 'mercato', 'alimentari', 'esselunga', 'coop', 'conad', 'carrefour', 'lidl', 'eurospin', 'pam', 'despar', 'md', 'iper', 'ipercoop', 'penny', 'frutta', 'verdura', 'pane', 'latte', 'uova', 'carne', 'pesce', 'formaggio', 'macellaio', 'macelleria', 'panificio', 'panetteria', 'fruttivendolo', 'pescheria', 'salumeria', 'cibo per casa', 'generi alimentari'],
    dining: ['pranzo', 'cena', 'colazione', 'merenda', 'brunch', 'caffè', 'caffe', 'bar', 'ristorante', 'trattoria', 'osteria', 'pizzeria', 'pizza', 'aperitivo', 'aperitivi', 'apericena', 'birra', 'birre', 'vino', 'drink', 'cocktail', 'panino', 'gelato', 'dolce', 'sushi', 'kebab', 'hamburger', 'mangiato', 'mangiare fuori', 'delivery', 'glovo', 'deliveroo', 'just eat', 'uber eats', 'mcdonald', 'mcdonalds', 'burger king', 'starbucks', 'tavola calda', 'cornetto', 'brioche', 'spuntino', 'pausa pranzo', 'mensa', 'bevande', 'spritz', 'pizzata', 'cena fuori'],
    rent: ['affitto', 'mutuo', 'padrone di casa', 'proprietario', 'condominio', 'spese condominiali', 'appartamento', 'assicurazione casa', 'caparra', 'canone di locazione', 'imu', 'agenzia immobiliare'],
    utilities: ['bolletta', 'bollette', 'luce', 'elettricità', 'enel', 'gas', 'acqua', 'internet', 'wifi', 'fibra', 'telefono', 'cellulare', 'tim', 'vodafone', 'wind', 'windtre', 'iliad', 'fastweb', 'ho mobile', 'riscaldamento', 'energia', 'tari', 'rifiuti', 'canone rai', 'utenze', 'bolletta della luce', 'bolletta del gas', 'bolletta dell\'acqua', 'ricarica telefonica'],
    transport: ['abbonamento dei mezzi', 'abbonamento del bus', 'abbonamento della metro', 'abbonamento del treno', 'mezzi pubblici', 'mezzi', 'benzina', 'carburante', 'gasolio', 'diesel', 'pieno', 'uber', 'taxi', 'treno', 'trenitalia', 'italo', 'metro', 'metropolitana', 'autobus', 'bus', 'pullman', 'tram', 'biglietto', 'biglietti', 'abbonamento trasporti', 'abbonamento atm', 'pedaggio', 'autostrada', 'telepass', 'parcheggio', 'macchina', 'auto', 'assicurazione auto', 'bollo', 'bollo auto', 'meccanico', 'gomme', 'tagliando', 'revisione', 'volo', 'aereo', 'ryanair', 'easyjet', 'biglietto aereo', 'noleggio auto', 'bici', 'bicicletta', 'monopattino', 'blablacar', 'viaggio in treno', 'autolavaggio', 'multa parcheggio', 'car sharing', 'enjoy', 'share now'],
    health: ['medico', 'dottore', 'dottoressa', 'dentista', 'farmacia', 'ricetta', 'medicine', 'medicina', 'farmaci', 'farmaco', 'ospedale', 'clinica', 'visita', 'visita medica', 'ticket sanitario', 'ticket', 'terapia', 'psicologo', 'psicologa', 'palestra', 'sport', 'yoga', 'pilates', 'vitamine', 'integratori', 'occhiali', 'ottico', 'lenti', 'osteopata', 'fisioterapia', 'fisioterapista', 'veterinario', 'massaggio', 'salute', 'analisi', 'esami', 'nutrizionista'],
    entertainment: ['biglietti del concerto', 'biglietto del concerto', 'biglietti per il concerto', 'biglietto del cinema', 'biglietti del cinema', 'biglietto per il cinema', 'cinema', 'film', 'concerto', 'biglietti concerto', 'teatro', 'spettacolo', 'gioco', 'giochi', 'videogioco', 'videogiochi', 'steam', 'playstation', 'xbox', 'nintendo', 'bowling', 'museo', 'mostra', 'parco', 'parco divertimenti', 'gardaland', 'serata', 'discoteca', 'karaoke', 'libro', 'libri', 'fumetti', 'hobby', 'uscita', 'partita', 'calcio', 'stadio', 'escape room', 'divertimento', 'sagra', 'festival', 'biliardo', 'calcetto'],
    shopping: ['carta regalo', 'amazon', 'vestiti', 'abbigliamento', 'scarpe', 'sneakers', 'camicia', 'maglietta', 'pantaloni', 'jeans', 'vestito', 'giacca', 'cappotto', 'shopping', 'negozio', 'centro commerciale', 'ikea', 'mobili', 'arredamento', 'decorazioni', 'leroy merlin', 'brico', 'bricolage', 'ferramenta', 'elettronica', 'mediaworld', 'unieuro', 'cuffie', 'auricolari', 'telefono nuovo', 'computer', 'caricatore', 'caricabatterie', 'regalo', 'regali', 'giocattoli', 'giocattolo', 'trucco', 'trucchi', 'cosmetici', 'parrucchiere', 'parrucchiera', 'taglio', 'barbiere', 'unghie', 'estetista', 'sephora', 'zara', 'h&m', 'oviesse', 'ordine', 'ordine online', 'cartoleria', 'casa', 'pulizie', 'detersivi', 'lavanderia', 'tintoria', 'fiori', 'piante', 'animale', 'animali', 'cane', 'gatto', 'crocchette', 'bambini', 'bimbo', 'bimba', 'pannolini', 'scuola', 'università', 'tasse universitarie', 'corso', 'lezione', 'libri di testo', 'decathlon', 'tiger', 'zalando'],
    subscriptions: ['abbonamento', 'abbonamenti', 'netflix', 'spotify', 'dazn', 'sky', 'now tv', 'now', 'disney', 'disney plus', 'amazon prime', 'prime', 'apple music', 'youtube premium', 'icloud', 'google one', 'dropbox', 'chatgpt', 'claude', 'adobe', 'iscrizione', 'patreon', 'giornale', 'corriere', 'repubblica', 'crunchyroll', 'twitch', 'rinnovo', 'canone mensile', 'piano mensile', 'piano annuale', 'duolingo', 'game pass', 'ps plus', 'tessera', 'quota'],
    debt: ['carta di credito', 'carta', 'prestito', 'finanziamento', 'rata', 'rate', 'debito', 'debiti', 'interessi', 'scoperto', 'klarna', 'scalapay', 'rata del prestito', 'rata dell\'auto', 'cessione del quinto', 'prestito personale'],
    savings: ['risparmio', 'risparmi', 'bonifico', 'conto deposito', 'fondo emergenza', 'fondo di emergenza', 'investimento', 'investito', 'investimenti', 'pensione integrativa', 'fondo pensione', 'azioni', 'borsa', 'crypto', 'bitcoin', 'messo da parte', 'conto risparmio', 'etf', 'pac', 'buoni postali', 'salvadanaio', 'trade republic', 'moneyfarm'],
    other_expense: ['commissione', 'commissioni', 'bancomat', 'prelievo', 'contanti', 'donazione', 'beneficenza', 'chiesa', 'offerta', 'tasse', 'imposta', 'imposte', 'f24', 'multa', 'francobolli', 'poste', 'spedizione', 'pacco', 'varie', 'altro', 'altre', 'roba', 'prestato', 'satispay', 'paypal', 'assicurazione', 'assicurazione vita', 'asilo', 'nido', 'babysitter', 'istruzione', 'avvocato', 'notaio', 'commercialista', 'matrimonio', 'vacanza', 'vacanze', 'viaggio', 'hotel', 'albergo', 'airbnb', 'ostello', 'b&b', 'alloggio', 'regalo di nozze', 'mancia'],
  },
  stopwords: ['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'di', 'del', 'della', 'dei', 'delle', 'degli', 'dello', 'a', 'al', 'alla', 'ai', 'alle', 'in', 'nel', 'nella', 'per', 'con', 'senza', 'e', 'o', 'ma', 'che', 'chi', 'io', 'mi', 'me', 'tu', 'ti', 'noi', 'ci', 'voi', 'vi', 'mio', 'mia', 'miei', 'mie', 'tuo', 'tua', 'suo', 'sua', 'nostro', 'nostra', 'questo', 'questa', 'questi', 'queste', 'oggi', 'ieri', 'domani', 'sera', 'mattina', 'settimana', 'mese', 'anno', 'speso', 'pagato', 'comprato', 'acquisto', 'euro', 'euri', 'dollari', 'ogni', 'totale', 'ancora', 'anche', 'allora', 'molto', 'nuovo', 'nuova', 'più', 'meno', 'ultimo', 'ultima', 'prossimo', 'prossima', 'obiettivo', 'meta', 'risparmiare', 'risparmiato', 'messo', 'aggiunto', 'verso', 'dentro', 'andato', 'andare', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci', 'voce', 'uscita', 'entrata', 'soldi', 'qualcosa', 'cosa', 'come', 'fa', 'ho', 'hai', 'ha', 'circa'],
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
  debtIntent: /(?<![\p{L}])(?:(?:voglio |vorrei |devo |ho intenzione di |vogliamo |dobbiamo |intendo )?(?:estinguere|ripagare|saldare|ridurre|azzerare|liberarmi d[ai]|uscire d[ai]|finire di pagare|senza debiti)|(?:devo|dobbiamo)(?: ancora)?(?= [€$]?\d| (?:sulla|sul|sullo|sulle|sui) )|(?:ho|abbiamo) (?:ancora )?(?:un )?debit[oi](?: di)?)(?![\p{L}])/iu,
  debtWords: /(?<![\p{L}])(?:debit[oi]|carta di credito|carte di credito|carta(?! (?:igienica|regalo|fedeltà|fedelta|da))|visa|mastercard|amex|american express|prestit[oi]|mutuo|finanziamento|scoperto|rate)(?![\p{L}])/iu,
  contributionVerbs: /^(?=(?:(?:altri|altre|ancora) )?[€$]?\d[\d.,]*\s+(?:(?:euro|euri|€)\s+)?(?:nel|nella|nello|sul|sulla|sullo|al|alla|allo|per|verso|in)\s)|(?<![\p{L}])(?:aggiung(?:i|o|ere)|aggiunt[oi]|mess[oi]|metto|metti|mettere|risparmiat[oi]|trasferit[oi]|trasferisco|trasferisci|versat[oi]|verso|versa|spostat[oi]|sposto|deposit(?:o|a|ato|ati)|accantonat[oi])(?![\p{L}])/iu,
  contributionPreps: 'a|al|alla|allo|per|verso|in|nel|nella|nello|su|sul|sulla|sullo|per il|per la|per lo',
  forWords: 'per|per il|per la|per un|per una|per lo|per le|per i|per gli|per mio|per mia|per i miei',
  goalWords: 'obiettivo|meta',
  goalNouns: /^(?:salvadanaio|fondo|risparmi|risparmio|conto|obiettivo|cassa|gruzzolo|tesoretto|budget|soldi)$/u,
  articles: /^(?:(?:il|lo|la|i|gli|le|un|uno|una|mio|mia|nostro|nostra|nuovo|nuova)\s+|l'|un')+/,
  leadingFiller: /^(?:(?:e|ed|ho|hai|ha|oggi|ieri|beh|anche|ancora|speso|pagato|comprato|spesa|acquisto|preso|in|di|del|della|dei|delle|per|con|a|al|alla|su|sul|sulla|sullo|sui|sulle|il|lo|la|i|gli|le|un|uno|una|mio|mia|mi|ci|circa|più o meno|tipo|quasi|un altro|un'altra)\s+|(?:l'|d'|un'|dell'|all'|sull')(?=\p{L}))+/u,
  trailingFiller: /(?:\s+(?:oggi|ieri|in|di|del|della|per|con|a|al|alla|il|lo|la|i|gli|le|un|uno|una|e|ogni|totale|ancora|anche|per favore|grazie|questo|questa|quello|circa|più o meno))+$/u,
  noteStrip: [],
  listSeparators: [',', ';', 'e', 'ed', 'più', 'poi', 'e poi', 'e anche', 'anche'],
  reminder: {
    lead: /(?<![\p{L}])(?:(?:puoi |potresti |per favore )?(?:ricordamelo|ricordamela|ricordameli|ricordami|ricordarmi|ricordaci|ricordatemi|mi ricordi|ricordati|devo ricordarmi|ricordiamoci|segnati(?= (?:di|che) )|metti un promemoria|mettere un promemoria|mettimi un promemoria|crea un promemoria|aggiungi un promemoria|voglio un promemoria|ho bisogno di un promemoria|promemoria|avvisami|avvisarmi|avvertimi|avvertirmi|non farmi dimenticare|non lasciarmi dimenticare|fammi ricordare|fammi ricordarmi))(?![\p{L}])(?:\s+(?:di|che|per|a|su)(?![\p{L}]))?\s*:?/iu,
    time: [
      clockRule(['alle', 'alle ore', "all'", 'verso le', 'per le', 'entro le'], { dayParts: { 'di mattina': 0, 'del mattino': 0, 'di pomeriggio': 12, 'del pomeriggio': 12, 'di sera': 12, 'della sera': 12, 'di notte': 12 } }),
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
    dayLate: [futureDayOfMonthRule(/(?<![\p{L}])(?:il|per il|entro il) (\d{1,2}|primo)(?![\p{L}\p{N}:])/iu, { primo: 1 })],
    strip: [/^(?:(?:di|che|per|a|su|e|per favore|devo|dovrei|bisogna|che devo)\s+)+/iu, /(?:\s+(?:per favore|grazie))+$/iu],
  },
  question: {
    lead: /(?<![\p{L}])(?:quanto|quanti soldi|cosa|che cosa) (?:ho|abbiamo|avevo) (?:speso|pagato|spesi|sborsato)|(?<![\p{L}])quanto (?:ho|abbiamo) (?:messo|dato)|(?<![\p{L}])quanto (?:spendo|spendiamo|(?:mi |ci )?(?:è|e) costat[oaie]|(?:mi |ci )?sono costat[ie]|(?:mi |ci )costa(?:no)?)|(?<![\p{L}])quanto (?:se n'|se ne |ne )?(?:è|e|sono) andat[oaie]|(?<![\p{L}])quanto (?:soldi )?(?:per|in|da|a|al|alla|alle|ai|con|su|di|nel|nella)(?![\p{L}])|(?<![\p{L}])(?:le mie |le |il totale delle )?spese (?:totali|in totale|complessive)|(?<![\p{L}])quanto se ne è andato/u,
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
    remainingLead: /(?<![\p{L}])(?:quanto (?:mi |ci )?(?:resta|rimane|avanza)|quanto (?:mi |ci )?(?:è|e) (?:rimast|avanzat)[oa]|cosa (?:mi |ci )?(?:è|e) rimast[oa]|quanto (?:ho|abbiamo) ancora|quanti soldi (?:mi |ci )?(?:ho|abbiamo|hai)(?! (?:\p{L}+[aiu]t[oiae]|speso|spesi|preso|presi|messo|messi|perso|persi|fatto|fatti|speso)(?![\p{L}]))|(?<!\d.*)(?:(?:ho|abbiamo) ancora (?:dei |degli |un po' di |qualche )?soldi|c'(?:è|e) ancora (?:qualcosa|spazio|margine|budget|dei soldi|soldi)|(?:mi |ci )?(?:è|e) rimasto qualcosa|come (?:sto|stiamo|sono|siamo) (?:mess[oaie]|andando|combinat[oaie])|come (?:va|procede|sta andando)(?= (?:il|col|con|coi|questo|questa)(?![\p{L}]))|(?:sono|siamo|sto|stiamo) (?:ancora )?(?:nel|dentro il|entro il|sotto il|nei limiti del|in) budget)(?!.*\d)|(?:qual è|qual e|quale è|com'è|com e) (?:il mio|il nostro|il) saldo|quanti soldi (?:mi |ci )?(?:restano|rimangono|avanzano)|quanto (?:posso|possiamo) (?:ancora )?spendere|(?:qual è|qual e|quale è|quale e|com'è|com e) (?:il mio|il nostro|il) budget|(?:il mio |il )?budget (?:rimanente|residuo|restante)|cosa (?:mi |ci )?(?:resta|rimane))(?![\p{L}])/u,
    remainingWords: /(?<![\p{L}])(?:budget|piano|piani|rimanente|residuo|restante|disponibile|disponibili|a disposizione|ancora|da spendere|soldi|resta|rimane|qualcosa|spazio|margine)(?![\p{L}])/gu,
    weakLead: /(?<![\p{L}])(?:(?:quali sono |a quanto ammontano |dimmi |fammi vedere )?(?:le mie |le nostre |le )?spese(?: totali| in totale| fatte)?(?: (?:per|di|in|su|al|alla|nel|nella|da|dal|dalla|del|della))?|(?:qual è |qual e |dimmi )?(?:il mio |il )?totale(?: speso| spese| delle spese)?(?: (?:per|di|del|della|dei|delle|in|su|al|alla|da))?|quant[oaie](?! (?:è|e|sono|costa|costano|fa|fanno|ho|hai|mi|ci|posso|vale|volte|tempo|basta)(?![\p{L}])))(?![\p{L}])/u,
    groups: [
      { words: ['cibo', 'mangiare', 'pasti', 'cibo e bevande', 'da mangiare'], ids: ['groceries', 'dining'] },
    ],
    // "ho speso più del mese scorso?", "sto spendendo di più o di meno?", "come sto rispetto al mese scorso?".
    // A bare "più o meno" means "roughly" ("quanto ho speso più o meno questo mese"), so it compares only
    // when a base follows it; "per cosa ho speso di più" asks where most went (topLead), not a comparison.
    compareLead: /(?<!(?:cosa|dove|cui|che|categoria|categorie) )(?<![\p{L}])(?:(?:ho|abbiamo|hai|avete) speso|(?:sto|stiamo|stai|state) spendendo|spendo|spendiamo|spendi)(?: [^\s]+){0,4}? (?:di (?:più|meno)(?: o di (?:più|meno))?|in (?:più|meno)|(?<!(?:più|meno) o )(?:più|meno)(?! o (?:più|meno)(?![\p{L}])(?! (?:(?:del|dello|della|dei|degli|delle|di|rispetto|in confronto|che)(?![\p{L}])|dell'))))(?![\p{L}])|(?<![\p{L}])(?:rispetto (?:a|al|allo|alla|ai|agli|alle)(?![\p{L}])|rispetto all'|in confronto (?:a|al|allo|alla|ai|agli|alle)(?![\p{L}])|in confronto all'|confrontat[oaie] (?:con|col)(?![\p{L}])|paragonat[oaie] (?:a|al|alla|allo)(?![\p{L}])|(?:più|meno) (?:del|di|che) (?:solito|prima)(?![\p{L}])|(?:le mie |le nostre |le )?spese (?:sono |stanno )?(?:aumentat[ei]|diminuit[ei]|salit[ei]|sces[ei]|calat[ei]|in aumento|in calo)(?![\p{L}]))/u,
    // "per cosa ho speso di più?", "dove sono finiti i miei soldi?", "qual è la mia spesa più grande?".
    topLead: /(?<![\p{L}])(?:(?:(?:per|in|su|con|a) )?(?:che )?cosa|dove|(?:in|su|per) cui|(?:in|su|per) quale categoria)(?: [^\s]+){0,3}? (?:speso|spes[oi]|spendo|spendiamo|spendi|spendendo|pagato|pago|costa|costano|costato|costati|buttato|va|vanno|finisce|finiscono)(?: [^\s]+){0,3}? (?:di più|più|maggiormente|la maggior parte|il grosso)(?![\p{L}])|(?<![\p{L}])(?:cosa|che cosa) (?:mi|ci) (?:costa|costano|è costato|e costato|sono costati) (?:di )?più(?![\p{L}])|(?<![\p{L}])dove (?:sono|è|e) (?:finit[ioa]|andat[ioa])|(?<![\p{L}])dove (?:se ne )?(?:vanno|va|finiscono|finisce|sono andati|è andata|è finita)(?: a finire)? (?:(?:la maggior parte|il grosso|la parte più grande) (?:dei|delle|di) |tutti )?(?:i |le )?(?:miei |mie |nostri |nostre )?(?:soldi|spese|risparmi|euro)(?![\p{L}])|(?<![\p{L}])(?:qual è |qual e |quale è |quale e |qual'è |quali sono |dimmi )?(?:la mia |la nostra |la |le mie |le nostre |le )?(?:spes[ae]|uscit[ae]|categori[ae]|voc[ei]) (?:più (?:grand[ei]|gross[ae]|alt[ae]|car[ae]|costos[ae]|pesant[ei]|important[ei])|maggior[ei]|principal[ei])(?![\p{L}])/u,
    // "posso permettermi una giacca da 200?": read with the amount already taken out ("posso permettermi una giacca da").
    affordLead: /(?<![\p{L}])(?:(?:posso|possiamo|potrei|potremmo|riesco a|riusciamo a|riuscirei a) (?:ancora )?(?:permettermi|permetterci|permettermel[oaie]|permettercel[oaie]|spendere|comprare|comprarmi|prendere|prendermi|fare)|(?:me|ce) (?:lo|la|li|le) (?:posso|possiamo|potrei) (?:ancora )?permettere|(?:mi|ci) (?:posso|possiamo) (?:ancora )?permettere|ce la (?:faccio|facciamo|fai|farei|faremmo)(?: (?:con|a (?:comprare|prendere|spendere)|se (?:spendo|compro|prendo)))?|(?:va|vanno|andrebbe|andrebbero) bene (?:se (?:spendo|spendiamo|compro|compriamo|prendo|prendiamo)|spendere|per)|(?:va|vanno|andrebbe|andrebbero) bene$|(?:è|e) (?:ok|okay|un problema)(?: se (?:spendo|spendiamo|compro|compriamo|prendo|prendiamo)| spendere)|(?:ho|abbiamo) (?:ancora )?(?:abbastanza|abbastanza soldi|i soldi|margine|spazio) per|c'(?:è|e) (?:ancora )?(?:spazio|margine|posto) per|(?:rientra|rientrano|ci sta|ci stanno|sta|stanno|resto|restiamo|sto|stiamo) (?:ancora )?nel (?:mio |nostro )?budget(?: se (?:spendo|compro|prendo))?|(?:sto|stiamo) (?:ancora )?(?:dentro|nei limiti) (?:il|del) budget se (?:spendo|compro|prendo))(?![\p{L}])/u,
    askWords: /(?<![\p{L}])(?:di più o di meno|più o meno|di più|di meno|in più|in meno|più|meno|o|rispetto|in confronto|confrontat[oaie]|paragonat[oaie]|del solito|di solito|di prima|troppo|poco|precedente|la maggior parte|la parte più grande|il grosso|maggiormente|grand[ei]|gross[ae]|maggior[ei]|principal[ei]|i miei soldi|miei soldi|i nostri soldi|soldi|tutti|permettermi|permetterci|permettermel[oaie]|permettere|spendere|comprare|comprarmi|prendere|prendermi|spendo|spendiamo|spendendo|speso|spesi|sto|stiamo|stai|come|va|vado|andando|procede|mess[oa]|un|uno|una|qualcosa|anche|ancora|quanto)(?![\p{L}])|(?<![\p{L}])un'|(?<![\p{L}])(?:del|dello|della|dei|degli|delle|di|che|da|a|al|alla|allo|ai|alle|con|col|per|se|dell'|all')\s*$/gu,
  },
  // Fixing the last entry by voice. "cancellalo", "lascia stare" remove it; "in realtà erano 14", "no, 14",
  // "cambialo in trasporti", "era ieri" change it. Only a new amount, category or date may follow the lead.
  correction: {
    remove: /^(?:(?:oh|ops|oops|scusa|scusami|aspetta|ah|ehm|mmm|uff|ok|okay|no|anzi|niente|in realtà|ho sbagliato|mi sono sbagliat[oa]|errore|sbagliato)[, ]+)*(?:(?:puoi|potresti|per favore|mi)[, ]+)?(?:(?:(?:cancell|elimin|annull|scart|ignor|lev|dimentic)(?:a|are|alo|ala|arlo|arla)|togli|toglilo|toglila|togliere|toglierlo|toglierla|rimuovi|rimuovilo|rimuovila|rimuovere|rimuoverlo|rimuoverla|butta via|buttalo via|buttala via|buttalo|buttala|non contarl[oa]|non lo contare|non la contare)(?: (?:quello|quella|questo|questa|quest'ultim[oa]|quell'ultim[oa]|l'? ?ultim[oa]|la voce|la spesa|l'entrata|l'inserimento|il movimento|la transazione|l'ultima cosa))?(?: (?:spesa|voce|cosa|entrata|uscita|inserimento|movimento|transazione|registrazione|operazione|acquisto|importo))?(?: (?:che ho (?:detto|inserito|aggiunto|messo|registrato|segnato|scritto)|di prima|di poco fa|appena (?:inserit[oa]|aggiunt[oa]|segnat[oa]|registrat[oa])))?|lascia stare|lascia perdere|lasciamo stare|lasciamo perdere|lascia correre|non importa|non fa niente|fa niente|niente|scordatelo|dimenticatelo|non (?:lo|la) segnare|non segnarl[oa]|annulla tutto)(?:[, ]+(?:per favore|grazie|dai))?$/u,
    lead: /^(?:(?:oh|ops|oops|scusa|scusami|aspetta|ah|ehm|mmm|ok|okay|no|anzi|ho sbagliato|mi sono sbagliat[oa]|errore|pardon)[, ]+)*(?:(?:in realtà|in realta|veramente|a dire il vero|invece)[, ]+(?:(?:era|erano|è|sono|fa|fanno|costava|costavano|veniva|venivano)(?: (?:di|solo|circa))?(?=\s|$))?|(?:no|scusa|scusami|anzi|ops|oops|aspetta|ho sbagliato|mi sono sbagliat[oa]|errore|pardon)[, ]+(?:(?:era|erano|è|sono|fa|fanno|costava|costavano|veniva|venivano)(?: (?:di|solo|circa))?(?=\s|$)|(?=[€$]?\d|(?:ieri|oggi|l'altro ?ieri|altro ieri|altroieri|stamattina|stasera|lunedì|lunedi|martedì|martedi|mercoledì|mercoledi|giovedì|giovedi|venerdì|venerdi|sabato|domenica)(?![\p{L}])))|(?:l'importo|la cifra|la somma|il prezzo|il totale|la categoria|la data|il giorno) (?:giusto |giusta |corrett[oa] )?(?:era|erano|è|sono|doveva essere)(?=\s|$)|(?:volevo dire|intendevo dire|intendevo|cioè|doveva essere|dovevano essere|dovrebbe essere|dovrebbero essere)(?=[, ]|$)|(?:fai|facciamo|diciamo|fallo|falla|mettici)[, ]+(?=[€$]?\d)|(?:era|erano|è stato|è stata|è stati|è successo|l'ho (?:fatt|pres|pagat|comprat)[oa])(?= (?:ieri|oggi|l'altro ?ieri|altro ieri|altroieri|stamattina|stasera|ieri sera|lunedì|lunedi|martedì|martedi|mercoledì|mercoledi|giovedì|giovedi|venerdì|venerdi|sabato|domenica|il \d|l'\d|la settimana scorsa|settimana scorsa|il mese scorso|\d+ giorni fa)(?![\p{L}]))|(?:(?:cambia|correggi|modifica|aggiorna|sposta|metti|segna|registra)l[oa]|(?:cambia|correggi|modifica|aggiorna)(?: (?:quello|quella|questo|questa|l'? ?ultim[oa](?: (?:spesa|voce|entrata|inserimento|movimento|cosa))?))?|(?:sposta|metti|segna) (?:quello|quella|questo|questa|l'? ?ultim[oa](?: (?:spesa|voce|entrata|inserimento|movimento|cosa))?))(?: (?:l'|la |il )?(?:importo|cifra|somma|prezzo|totale|categoria|data|giorno))?(?: (?:in|a|con|come|su|sotto|nella|nel|nei|negli|nelle|sui|sulla|sul|alla|al|ai|alle|tra|fra|per|tra le|fra le|tra i|fra i))?(?=\s|$))[, ]*/u,
  },
  contextualStrings: ['euro', 'spesa', 'affitto', 'stipendio', 'obiettivo', 'Netflix', 'Uber', 'pranzo'],
};
