import { dayOfMonthRule, ISO_RULE, byMonthRule, byYearRule, endOfYearRule, dayMonthRule, relativeFutureRules, relativePastRules, slashRule, weekdayRule } from '../dateRules';
import { makeNumberWords } from '../numbers';
import type { LanguagePack } from '../types';
import { periodWords } from '../questionRules';
import { clockRule, dayWords, futureDayOfMonthRule, futureWeekdayRule, monthlyOnRule, repeatWords, weeklyOnRule, wordTimeRules } from '../reminderRules';

const MONTHS = { names: { januar: 0, jänner: 0, jan: 0, februar: 1, feb: 1, märz: 2, maerz: 2, mär: 2, april: 3, apr: 3, mai: 4, juni: 5, jun: 5, juli: 6, jul: 6, august: 7, aug: 7, september: 8, sep: 8, sept: 8, oktober: 9, okt: 9, november: 10, nov: 10, dezember: 11, dez: 11 } };
const WEEKDAYS = { names: { sonntag: 0, montag: 1, dienstag: 2, mittwoch: 3, donnerstag: 4, freitag: 5, samstag: 6, sonnabend: 6 }, lastBefore: ['letzten', 'letzte', 'vorigen', 'am letzten', 'vergangenen'], prefixes: ['am', 'diesen', 'den'] };

const UNITS: Record<string, number> = { null: 0, eins: 1, ein: 1, eine: 1, einen: 1, einem: 1, zwei: 2, zwo: 2, drei: 3, vier: 4, fünf: 5, fuenf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, zwölf: 12, zwoelf: 12, dreizehn: 13, vierzehn: 14, fünfzehn: 15, fuenfzehn: 15, sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19 };
const TENS: Record<string, number> = { zwanzig: 20, dreißig: 30, dreissig: 30, vierzig: 40, fünfzig: 50, fuenfzig: 50, sechzig: 60, siebzig: 70, achtzig: 80, neunzig: 90 };
const PARTS = [...Object.keys(UNITS), ...Object.keys(TENS), 'hundert', 'tausend', 'und'].sort((a, b) => b.length - a.length);

/** "zweihundertfünfundzwanzig" -> "zwei hundert fünf und zwanzig" (only when every piece is a number word). */
function splitCompound(word: string): string {
  const w = word.toLowerCase();
  if (!/(hundert|tausend|und)/.test(w) || w === 'und') return word;
  const out: string[] = [];
  let i = 0;
  while (i < w.length) {
    const part = PARTS.find((p) => w.startsWith(p, i));
    if (!part) return word;
    out.push(part);
    i += part.length;
  }
  return out.join(' ');
}

const numberWords = makeNumberWords({
  units: UNITS,
  tens: TENS,
  hundred: ['hundert'],
  thousand: ['tausend'],
  million: ['million', 'millionen'],
  connectors: ['und'],
  one: ['ein', 'eine', 'einen', 'einem'],
  pre: (t) => t.split(/\s+/).map(splitCompound).join(' '),
});

/**
 * "bis Juni", "bis Juni 2027". Germans put the amount right after the date ("bis Juni 3000 für Japan
 * sparen"), so only a 20xx number not followed by a currency word is read as the year.
 */
const byMonthBase = byMonthRule(MONTHS, ['bis', 'bis ende', 'bis zum', 'im', 'vor', 'spätestens', 'bis spätestens', 'bis nächsten', 'bis nächstes', 'nächsten', 'nächstes']);
const byMonthUntilRule = {
  re: new RegExp(byMonthBase.re.source.replace('(\\d{4})', '(20\\d{2})(?![\\d.,]|\\s?(?:€|euro|eur|franken|chf|dollar))'), byMonthBase.re.flags),
  resolve: byMonthBase.resolve,
};

export const de: LanguagePack = {
  code: 'de',
  speechTag: 'de-DE',
  tokenizer: 'space',
  decimalComma: true,
  numberWords,
  currencyMarkers: /€|\$|euros?|dollars?|chf|franken|usd|eur|kröten|mäuse|tacken/i,
  currencyWords: /(?<![\p{L}])(?:euros?|dollars?|chf|franken|usd|eur|kröten|mäuse|tacken|cents?)(?![\p{L}])/giu,
  incomeVerbs: ['gehalt', 'lohn', 'bekommen', 'erhalten', 'verdient', 'eingenommen', 'einnahme', 'einkommen', 'rückerstattung', 'erstattet', 'zurückbekommen', 'zurück bekommen', 'bonus', 'prämie', 'provision', 'verkauft', 'trinkgeld', 'geschenk von', 'hat mir gegeben', 'haben mir gegeben', 'mir geschickt', 'mir überwiesen', 'überwiesen bekommen', 'rente', 'kindergeld', 'gutschrift', 'ausgezahlt', 'auszahlung', 'wurde bezahlt', 'bezahlt worden', 'steuererstattung', 'honorar', 'gekriegt', 'reingekommen', 'eingegangen', 'gutgeschrieben', 'cashback', 'dividende', 'zinsen erhalten', 'gewonnen', 'vertickt', 'verscherbelt', 'mir zurückgezahlt', 'mir zurückgegeben', 'mir zurücküberwiesen', 'kam rein', 'gutgeschrieben bekommen'],
  expenseVerbs: ['ausgegeben', 'bezahlt', 'gezahlt', 'gekauft', 'ausgabe', 'kauf', 'gekostet', 'kostet', 'bestellt', 'geholt', 'gespendet', 'geliehen', 'verliehen', 'abgehoben', 'geschickt', 'überwiesen', 'rechnung', 'zahle', 'kaufe', 'bezahle', 'gegeben', 'verprasst', 'gebucht', 'getankt', 'gegessen', 'getrunken', 'gezockt', 'kosten', 'ausgaben', 'draufgegangen', 'hingelegt', 'gelöhnt', 'berappt', 'abgebucht', 'rausgehauen', 'verballert', 'gegönnt', 'geshoppt', 'eingekauft', 'gelassen', 'geblecht', 'abgedrückt', 'ausgeben', 'gelatzt'],
  keywords: {
    salary: ['gehalt', 'lohn', 'gehaltseingang', 'lohneingang', 'nettolohn', 'nettogehalt', 'dreizehntes', 'lohnzettel', 'monatsgehalt', 'zahltag', 'weihnachtsgeld', 'urlaubsgeld'],
    freelance: ['freelance', 'freiberuflich', 'selbstständig', 'kunde', 'kundin', 'rechnung bezahlt bekommen', 'auftrag', 'nebenjob', 'nebenverdienst', 'minijob', 'honorar', 'beratung', 'provision', 'nachhilfe', 'verkauft', 'verkauf', 'ebay', 'kleinanzeigen', 'vinted', 'trinkgeld', 'upwork', 'fiverr', 'freelancing', 'freelancer', 'kunden', 'auftraggeber', 'flohmarkt', 'vertickt', 'verscherbelt'],
    gift_income: ['geschenk von', 'geschenkt bekommen', 'hat mir gegeben', 'haben mir gegeben', 'geburtstagsgeld', 'taschengeld', 'von mama', 'von papa', 'von oma', 'von opa', 'weihnachtsgeld von', 'zum geburtstag bekommen', 'zum geburtstag geschenkt', 'zu weihnachten bekommen', 'christkindl'],
    other_income: ['rückerstattung', 'erstattung', 'erstattet', 'cashback', 'zinsen', 'dividende', 'dividenden', 'bonus', 'prämie', 'steuererstattung', 'steuerrückzahlung', 'finanzamt', 'gewonnen', 'gewinn', 'lotto', 'rente', 'pension', 'kindergeld', 'elterngeld', 'bafög', 'stipendium', 'arbeitslosengeld', 'bürgergeld', 'zurückbekommen', 'zurückgezahlt', 'paypal von', 'überweisung von', 'pfand'],
    groceries: ['einkauf', 'einkaufen', 'lebensmittel', 'supermarkt', 'markt', 'wochenmarkt', 'rewe', 'edeka', 'aldi', 'lidl', 'penny', 'netto', 'kaufland', 'norma', 'real', 'globus', 'hit', 'tegut', 'denns', 'alnatura', 'obst', 'gemüse', 'brot', 'brötchen', 'milch', 'eier', 'fleisch', 'käse', 'metzger', 'metzgerei', 'bäcker', 'bäckerei', 'bio', 'wocheneinkauf', 'getränkemarkt', 'essen für zuhause', 'lebensmitteln', 'großeinkauf', 'semmel', 'semmeln', 'weckerl', 'billa', 'hofer', 'spar', 'merkur', 'migros', 'coop', 'denner', 'volg', 'gipfeli', 'zopf'],
    dining: ['mittagessen', 'mittag', 'abendessen', 'frühstück', 'brunch', 'kaffee', 'café', 'cafe', 'restaurant', 'imbiss', 'döner', 'kebab', 'pizza', 'burger', 'sushi', 'bier', 'biere', 'wein', 'cocktail', 'cocktails', 'bar', 'kneipe', 'essen gehen', 'essen bestellt', 'lieferando', 'uber eats', 'wolt', 'mcdonalds', "mcdonald's", 'mcdonald', 'burger king', 'starbucks', 'eis', 'kuchen', 'dessert', 'snack', 'currywurst', 'pommes', 'essen', 'mensa', 'kantine', 'bäcker frühstück', 'lieferservice', 'biergarten', 'feierabendbier', 'auswärts essen', 'essen auswärts', 'getränke', 'latte', 'jause', 'kafi', 'zmittag', 'znüni', 'zvieri', 'beiz', 'beisl', 'wirtshaus', 'gasthaus', 'gasthof', 'heuriger', 'take away', 'takeaway', 'imbissbude', 'dönerbude', 'eisdiele', 'cappuccino', 'espresso', 'mittagspause'],
    rent: ['miete', 'hypothek', 'vermieter', 'nebenkosten', 'hausgeld', 'wohnung', 'kaution', 'hausratversicherung', 'wohngebäudeversicherung', 'warmmiete', 'kaltmiete', 'grundsteuer', 'baufinanzierung'],
    utilities: ['strom', 'stromrechnung', 'gas', 'gasrechnung', 'wasser', 'wasserrechnung', 'heizung', 'heizkosten', 'internet', 'wlan', 'dsl', 'telefon', 'handy', 'handyvertrag', 'handyrechnung', 'telekom', 'vodafone', 'o2', '1&1', 'congstar', 'gez', 'rundfunkbeitrag', 'müll', 'müllgebühren', 'energie', 'nebenkostenabrechnung', 'fernwärme', 'stadtwerke'],
    transport: ['benzin', 'sprit', 'tanken', 'getankt', 'diesel', 'uber', 'bolt', 'taxi', 'bahn', 'zug', 'deutsche bahn', 'db', 'ice', 's-bahn', 'u-bahn', 'bus', 'tram', 'straßenbahn', 'ticket', 'fahrkarte', 'deutschlandticket', 'monatskarte', 'maut', 'parken', 'parkplatz', 'parkticket', 'parkhaus', 'auto', 'kfz', 'kfz-versicherung', 'autoversicherung', 'werkstatt', 'reifen', 'tüv', 'ölwechsel', 'inspektion', 'flug', 'flugticket', 'flixbus', 'mietwagen', 'fahrrad', 'rad', 'roller', 'e-scooter', 'blablacar', 'fahrt', 'pendeln', 'fahrtkosten', 'waschanlage', 'autowäsche', 'carsharing', 'sixt', 'miles', 'volltanken', 'vollgetankt', 'tankstelle', 'autoreparatur', 'zugticket', 'bahnticket', 'busticket', 'bahnfahrt', 'zugfahrt', 'öffis', 'öffi', 'öffi-ticket', 'jahreskarte', 'klimaticket', 'vignette', 'pickerl', 'billett', 'zugbillett', 'halbtax', 'sbb', 'öbb', 'wiener linien', 'bvg', 'mvg', 'hvv', 'tankfüllung', 'ladesäule'],
    health: ['arzt', 'ärztin', 'zahnarzt', 'apotheke', 'rezept', 'medikamente', 'medikament', 'tabletten', 'krankenhaus', 'klinik', 'praxis', 'krankenkasse', 'krankenversicherung', 'therapie', 'therapeut', 'psychologe', 'fitnessstudio', 'fitness', 'gym', 'sport', 'yoga', 'pilates', 'vitamine', 'nahrungsergänzung', 'brille', 'optiker', 'kontaktlinsen', 'physio', 'physiotherapie', 'osteopath', 'tierarzt', 'massage', 'gesundheit', 'zuzahlung', 'heilpraktiker', 'zahnreinigung'],
    entertainment: ['kino', 'film', 'konzert', 'tickets', 'karten', 'eintritt', 'theater', 'show', 'spiel', 'spiele', 'videospiel', 'videospiele', 'steam', 'playstation', 'xbox', 'nintendo', 'bowling', 'museum', 'park', 'freizeitpark', 'party', 'club', 'disco', 'karaoke', 'buch', 'bücher', 'hobby', 'ausgehen', 'fußball', 'stadion', 'escape room', 'freizeit', 'unterhaltung', 'festival', 'schwimmbad', 'zoo', 'lasertag', 'kegeln', 'kinokarte', 'kinokarten', 'kinoticket', 'kinotickets', 'konzertkarte', 'konzertkarten', 'konzertticket', 'konzerttickets', 'theaterkarten', 'eintrittskarte', 'eintrittskarten'],
    shopping: ['amazon', 'kleidung', 'klamotten', 'schuhe', 'sneaker', 'hemd', 'hose', 'jeans', 'kleid', 'jacke', 'mantel', 'shopping', 'laden', 'geschäft', 'einkaufszentrum', 'ikea', 'möbel', 'deko', 'dekoration', 'obi', 'bauhaus', 'hornbach', 'baumarkt', 'elektronik', 'media markt', 'mediamarkt', 'saturn', 'kopfhörer', 'neues handy', 'laptop', 'ladekabel', 'geschenk', 'geschenke', 'spielzeug', 'make-up', 'kosmetik', 'drogerie', 'dm', 'rossmann', 'müller', 'friseur', 'haarschnitt', 'barbier', 'nägel', 'douglas', 'zara', 'h&m', 'primark', 'c&a', 'bestellung', 'online bestellt', 'zalando', 'otto', 'schreibwaren', 'bürobedarf', 'haushalt', 'putzmittel', 'waschmittel', 'wäsche', 'reinigung', 'blumen', 'pflanzen', 'haustier', 'hund', 'katze', 'tierfutter', 'kinder', 'baby', 'windeln', 'schule', 'uni', 'universität', 'studiengebühren', 'kurs', 'schulbuch', 'schulsachen', 'tchibo', 'action', 'neue schuhe', 'manor', 'galaxus', 'digitec'],
    subscriptions: ['abo', 'abos', 'abonnement', 'netflix', 'spotify', 'disney', 'disney plus', 'amazon prime', 'prime', 'apple music', 'youtube premium', 'icloud', 'google one', 'dropbox', 'chatgpt', 'claude', 'adobe', 'mitgliedschaft', 'patreon', 'zeitung', 'spiegel', 'zeit', 'sky', 'dazn', 'joyn', 'rtl+', 'wow', 'crunchyroll', 'twitch', 'verlängerung', 'monatsbeitrag', 'monatsabo', 'jahresabo', 'duolingo', 'game pass', 'ps plus', 'audible', 'kindle unlimited', 'readly'],
    debt: ['kreditkarte', 'kreditkartenrechnung', 'kredit', 'darlehen', 'ratenzahlung', 'rate', 'raten', 'schulden', 'zinsen', 'dispo', 'überziehung', 'klarna', 'ratenkauf', 'tilgung', 'mahngebühr', 'bafög rückzahlung', 'autokredit', 'kreditrate'],
    savings: ['sparen', 'gespart', 'ersparnisse', 'sparkonto', 'tagesgeld', 'festgeld', 'notgroschen', 'notfallfonds', 'investition', 'investiert', 'anlage', 'geldanlage', 'altersvorsorge', 'aktien', 'etf', 'etfs', 'sparplan', 'depot', 'krypto', 'bitcoin', 'zurückgelegt', 'beiseite gelegt', 'trade republic', 'scalable', 'bausparvertrag', 'riester', 'sparbuch', 'überweisung aufs sparkonto'],
    other_expense: ['gebühr', 'gebühren', 'kontogebühr', 'kontoführung', 'geldautomat', 'automat', 'bargeld', 'bar', 'spende', 'kirche', 'kirchensteuer', 'steuern', 'steuer', 'finanzamt', 'bußgeld', 'strafzettel', 'knöllchen', 'briefmarken', 'post', 'porto', 'paket', 'versand', 'sonstiges', 'andere', 'anderes', 'zeug', 'sachen', 'paypal', 'überweisung', 'versicherung', 'haftpflicht', 'lebensversicherung', 'kita', 'kindergarten', 'babysitter', 'tagesmutter', 'bildung', 'anwalt', 'notar', 'steuerberater', 'hochzeit', 'urlaub', 'reise', 'hotel', 'airbnb', 'hostel', 'unterkunft', 'ferienwohnung', 'trinkgeld', 'geschenk für', 'pfand'],
  },
  stopwords: ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'und', 'oder', 'aber', 'für', 'von', 'vom', 'mit', 'ohne', 'zu', 'zum', 'zur', 'in', 'im', 'an', 'am', 'auf', 'bei', 'nach', 'über', 'ich', 'mich', 'mir', 'wir', 'uns', 'du', 'dich', 'dir', 'mein', 'meine', 'meinen', 'unser', 'unsere', 'es', 'ist', 'war', 'bin', 'habe', 'hab', 'hat', 'haben', 'heute', 'gestern', 'morgen', 'abend', 'nacht', 'woche', 'monat', 'jahr', 'ausgegeben', 'bezahlt', 'gezahlt', 'gekauft', 'ausgabe', 'kauf', 'euro', 'euros', 'dollar', 'jeder', 'jede', 'jedes', 'gesamt', 'nochmal', 'auch', 'dann', 'sehr', 'neu', 'neue', 'neuen', 'mehr', 'weniger', 'letzte', 'letzten', 'nächste', 'nächsten', 'ziel', 'sparen', 'gespart', 'hinzugefügt', 'gelegt', 'ins', 'gegangen', 'gehen', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'eintrag', 'einnahme', 'geld', 'etwas', 'ding', 'wie', 'vor', 'noch', 'was', 'so', 'etwa', 'ungefähr', 'circa'],
  pastDateRules: [
    ISO_RULE,
    ...relativePastRules({
      today: ['heute', 'heute morgen', 'heute früh', 'heute mittag', 'heute abend', 'heute nachmittag', 'vorhin', 'eben'],
      yesterday: ['gestern', 'gestern abend', 'gestern morgen', 'gestern früh', 'gestern mittag', 'gestern nachmittag', 'gestern nacht', 'letzte nacht'],
      dayBeforeYesterday: ['vorgestern'],
      lastWeek: ['letzte woche', 'vorige woche', 'vergangene woche', 'in der letzten woche'],
      lastMonth: ['letzten monat', 'letzter monat', 'vorigen monat', 'vergangenen monat', 'im letzten monat'],
      daysAgo: /\bvor (\d+|einem|ein) tag(?:en)?\b/,
      weeksAgo: /\bvor (\d+|einer|eine) wochen?\b/,
      monthsAgo: /\bvor (\d+|einem|ein) monat(?:en)?\b/,
      oneWords: ['einem', 'ein', 'einer', 'eine'],
    }),
    dayMonthRule(MONTHS, { pre: ['am', 'den', 'vom'], ordinal: '\\.?' }),
    weekdayRule(WEEKDAYS),
    slashRule(true),
    dayOfMonthRule(/\b(?:am|den|vom) (\d{1,2})\.(?!\d)/),
  ],
  futureDateRules: [
    ISO_RULE,
    ...relativeFutureRules({
      endOfYear: ['bis ende des jahres', 'bis jahresende', 'bis zum jahresende', 'ende des jahres', 'jahresende', 'bis ende dieses jahres', 'bis ende jahr', 'bis silvester'],
      endOfNextYear: ['bis ende nächstes jahr', 'bis ende nächsten jahres', 'ende nächsten jahres'],
      endOfMonth: ['bis ende des monats', 'bis monatsende', 'ende des monats', 'monatsende', 'bis zum monatsende', 'bis ende monat', 'bis ende dieses monats'],
      nextYear: ['nächstes jahr', 'bis nächstes jahr', 'im nächsten jahr', 'bis zum nächsten jahr'],
      nextMonth: ['nächsten monat', 'bis nächsten monat', 'im nächsten monat', 'bis zum nächsten monat'],
      christmas: ['bis weihnachten', 'vor weihnachten', 'zu weihnachten', 'weihnachten'],
      inDays: /\b(?:in|innerhalb von|innerhalb|binnen|in den nächsten|in den naechsten) (\d+|einem|ein) tag(?:en)?\b/,
      inWeeks: /\b(?:in|innerhalb von|innerhalb|binnen|in den nächsten|in den naechsten) (\d+|einer|eine) wochen?\b/,
      inMonths: /\b(?:in|innerhalb von|innerhalb|binnen|in den nächsten|in den naechsten) (\d+|einem|ein) monat(?:en)?\b/,
      inYears: /\b(?:in|innerhalb von|innerhalb|binnen|in den nächsten|in den naechsten) (\d+|einem|ein) jahr(?:en)?\b/,
      oneWords: ['einem', 'ein', 'einer', 'eine'],
      seasons: { spring: ['bis zum frühling', 'bis frühling', 'vor dem frühling'], summer: ['bis zum sommer', 'bis sommer', 'vor dem sommer', 'diesen sommer'], fall: ['bis zum herbst', 'bis herbst', 'vor dem herbst'], winter: ['bis zum winter', 'bis winter', 'vor dem winter'] },
    }),
    dayMonthRule(MONTHS, { pre: ['bis zum', 'bis', 'vor dem', 'am', 'zum', 'spätestens am', 'spätestens'], ordinal: '\\.?', future: true }),
    endOfYearRule(['bis ende', 'bis zum ende von', 'ende', 'bis spätestens ende']),
    byMonthUntilRule,
    byYearRule(['bis', 'vor', 'im', 'in']),
  ],
  goalLead: /^(?:ziel|sparziel|neues ziel|neues sparziel|(?:mach|mache|erstelle|erstell|lege|leg|setze|setz|ich will|ich möchte)(?: mir| uns)?(?: einen| ein| eine)?(?: neuen| neues| neue)? (?:plan|ziel|sparziel)(?: um| für| zum)?)\s*:?\s*/iu,
  goalIntent: /(?<![\p{L}])(?:ich will|ich möchte|ich muss|ich werde|ich würde gerne|ich wollte|wir wollen|wir möchten|(?:ich|wir) (?:spare|spar|sparen) (?:auf|für)|sparen|zurücklegen|ansparen|zur seite legen|auf die seite legen|beiseite legen|beiseitelegen)(?![\p{L}])/iu,
  goalPastVerbs: /(?<![\p{L}])(?:gespart|angespart|zurückgelegt|eingezahlt|überwiesen|hinzugefügt|gelegt|beiseitegelegt|weggelegt|getan|gepackt|gesteckt|geschoben|gebucht|bezahlt|abbezahlt|getilgt)(?![\p{L}])/iu,
  debtIntent: /(?<![\p{L}])(?:(?:ich will |ich möchte |ich moechte |ich muss |ich werde |wir wollen |wir müssen |wir muessen )?(?:abbezahlen|abzahlen|tilgen|zurückzahlen|zurueckzahlen|abbauen|loswerden|begleichen|schuldenfrei|abstottern|(?:ich|wir) (?:schulde|schulden)(?: noch)?))(?![\p{L}])/iu,
  debtWords: /(?<![\p{L}])(?:schulden|kredit|kreditkarte|kreditkartenschulden|darlehen|hypothek|dispo|dispokredit|ratenkredit|studienkredit|autokredit|visa|mastercard|amex)(?![\p{L}])/iu,
  contributionVerbs: /(?<![\p{L}])(?:hinzugefügt|hinzufügen|gespart|zurückgelegt|eingezahlt|einzahlen|überwiesen|überweisen|gelegt|legen|lege|getan|tun|tue|gepackt|packen|packe|dazu|geschoben|schieben|draufgelegt|drauf gelegt|beiseitegelegt|weggelegt|gesteckt|stecke|stecken|angespart|umgebucht)(?![\p{L}])/iu,
  contributionPreps: 'zu|zum|zur|auf|aufs|in|ins|für|für die|für das|für den|für mein|für meine|für meinen|zu meinem|zu meiner|auf mein|auf meine|auf das|auf die|auf den|in mein|in meine|in meinen|in das|in die|in den',
  forWords: 'für|für die|für das|für den|für einen|für eine|für ein|für mein|für meine|für meinen|für unsere|für unser|für unseren',
  goalWords: 'ziel|sparziel',
  goalNouns: /^(?:kasse|reisekasse|urlaubskasse|sparkonto|tagesgeldkonto|konto|topf|spartopf|sparschwein|ziel|sparziel|rücklage|rücklagen|fonds|seite|reise|urlaub|trip)$/u,
  articles: /^(?:(?:der|die|das|den|dem|ein|eine|einen|einem|einer|mein|meine|meinen|unser|unsere|neue|neuen|neues)\s+)+/,
  leadingFiller: /^(?:(?:ich|wir|habe|hab|haben|hat|heute|gestern|also|auch|nochmal|ausgegeben|bezahlt|gezahlt|gekauft|ausgabe|kauf|für|von|vom|mit|zu|zum|zur|in|im|an|am|auf|bei|beim|der|die|das|den|dem|ein|eine|einen|einem|einer|mein|meine|meinen|mir|mich|uns|etwa|ungefähr|circa|ca|noch|einmal|so|mal|grad|gerade|eben)\s+)+/,
  trailingFiller: /(?:\s+(?:heute|gestern|für|von|mit|zu|zum|zur|in|im|an|am|auf|bei|der|die|das|den|ein|eine|und|jeder|jede|gesamt|nochmal|auch|bitte|danke|es|dies|ausgegeben|bezahlt|gezahlt|gekauft|gekostet|gegangen|gewesen|geholt|bestellt|etwa|ungefähr|circa|ca|rum|so))+$/,
  noteStrip: [],
  listSeparators: [',', ';', 'und', 'plus', 'dann', 'und dann', 'außerdem', 'und noch', 'sowie'],
  reminder: {
    lead: /(?<![\p{L}])(?:(?:kannst du |könntest du |koenntest du |bitte )?(?:erinnere mich|erinner mich|erinnere uns|erinnerung|stell eine erinnerung|stelle eine erinnerung|erstell eine erinnerung|erstelle eine erinnerung|mach eine erinnerung|leg eine erinnerung an|ich brauche eine erinnerung|ich will eine erinnerung|sag mir bescheid|lass mich nicht vergessen|denk für mich dran|erinnere mich bitte|erinner mich bitte|(?:stell|stelle|setz|setze|mach|leg|erstell|erstelle)(?: mir| uns)? (?:eine |einen )?(?:erinnerung|wecker)|(?:denk|denke)(?: bitte)? (?:dran|daran)|vergiss nicht|nicht vergessen|(?:sag|gib)(?: bitte)? (?:mir|uns)(?= (?:[^ ]+ ){0,3}bescheid(?![\p{L}]))|(?:kannst|könntest|koenntest|würdest|wuerdest) du (?:mich|uns)(?=[^?]*(?<![\p{L}])erinnern(?![\p{L}]))|erinnerst du (?:mich|uns)))(?![\p{L}])(?:\s+(?:daran|dran|an|zu|dass|für)(?![\p{L}]))?\s*,?\s*:?/iu,
    time: [
      clockRule(['um', 'gegen', 'so gegen', 'ab', 'bis'], { suffix: 'uhr', dayParts: { morgens: 0, früh: 0, frueh: 0, vormittags: 0, mittags: 12, nachmittags: 12, abends: 12, nachts: 12 } }),
      ...wordTimeRules({ morning: ['morgens', 'am morgen', 'in der früh', 'in der frueh', 'früh', 'frueh', 'vormittags', 'am vormittag', 'gleich morgens'], noon: ['mittags', 'am mittag', 'zur mittagszeit', 'zum mittag'], afternoon: ['nachmittags', 'am nachmittag'], evening: ['abends', 'am abend', 'heute abend', 'nachts', 'vor dem schlafen'] }, { morning: 8, noon: 12, afternoon: 15, evening: 19 }),
    ],
    repeat: [
      weeklyOnRule(['jeden', 'jede', 'jedes', 'immer am', 'immer'], WEEKDAYS.names, { suffix: ['s'] }),
      { re: /(?<![\p{L}])(montags|dienstags|mittwochs|donnerstags|freitags|samstags|sonntags)(?![\p{L}])/iu, repeat: 'weekly', weekday: (m) => ({ montags: 1, dienstags: 2, mittwochs: 3, donnerstags: 4, freitags: 5, samstags: 6, sonntags: 0 } as Record<string, number>)[m[1].toLowerCase()] ?? null },
      monthlyOnRule(/(?<![\p{L}])(?:am |jeden |immer am )?(\d{1,2}\.?|ersten|monatsersten) (?:jeden|jedes|des|im) monats?(?![\p{L}])/iu, { ersten: 1, monatsersten: 1 }),
      repeatWords(['jeden morgen', 'jeden vormittag', 'allmorgendlich'], 'daily', 8),
      repeatWords(['jeden abend', 'jede nacht', 'allabendlich'], 'daily', 20),
      repeatWords(['jeden nachmittag'], 'daily', 15),
      repeatWords(['jeden tag', 'täglich', 'taeglich', 'tagtäglich', 'alle tage'], 'daily'),
      repeatWords(['jede woche', 'wöchentlich', 'woechentlich', 'alle wochen', 'einmal die woche', 'einmal pro woche'], 'weekly'),
      repeatWords(['jeden monat', 'monatlich', 'alle monate', 'einmal im monat', 'am monatsanfang', 'jeden monatsersten', 'am ersten jeden monats'], 'monthly'),
    ],
    day: [
      ISO_RULE,
      dayWords(['übermorgen', 'uebermorgen'], 2),
      dayWords(['morgen'], 1),
      dayWords(['heute', 'heute abend', 'heute nachmittag', 'heute nacht', 'heute früh', 'heute frueh'], 0),
      futureWeekdayRule(WEEKDAYS.names, { pre: ['nächsten', 'naechsten', 'nächste', 'naechste', 'kommenden', 'am', 'diesen', 'am nächsten', 'am naechsten', 'am kommenden', 'bis'], nextWords: ['nächst', 'naechst', 'kommend'] }),
      dayMonthRule(MONTHS, { pre: ['am', 'zum', 'bis zum', 'bis'], ordinal: '\\.?', future: true }),
    ],
    dayLate: [futureDayOfMonthRule(/(?<![\p{L}])(?:am|zum|bis zum) (\d{1,2}\.|ersten)(?![\p{N}])(?!\s*(?:uhr|jeden|jedes|des))/iu, { ersten: 1 })],
    strip: [/^(?:(?:bescheid|wegen der|wegen dem|wegen des|wegen|daran|dran|an den|an die|an das|ans|an|zu|dass|um|für|bitte|ich muss|ich soll|ich sollte|dass ich|und)\s*,?\s+)+/iu, /(?:\s+(?:bitte|danke|zu erinnern|erinnern|soll|muss|sollte))+$/iu],
  },
  question: {
    lead: /(?<![\p{L}])(?:(?:wie ?viel|was) (?:geld )?(?:habe|hab|hab'|haben|hatte|hatten) (?:ich|wir)(?=[^?]*(?<![\p{L}])(?:ausgegeben|bezahlt|gezahlt|verbraten|ausgeben|verpulvert|gelassen|verprasst|verballert|rausgehauen|verbraucht|gelatzt|geblecht|hingelegt|liegen lassen)(?![\p{L}]))|(?:habe|hab|haben) (?:ich|wir) (?:viel|zu viel|so viel|echt viel)(?=[^?]*(?<![\p{L}])(?:ausgegeben|bezahlt|gezahlt|verbraten|verpulvert|gelassen|verprasst|verballert|rausgehauen)(?![\p{L}]))|(?:wie ?viel|was) (?:geld )?(?:ich|wir)(?=[^?]*(?<![\p{L}])(?:ausgegeben|bezahlt|gezahlt|verbraten|verpulvert|gelassen|verprasst|verballert|rausgehauen)(?![\p{L}]))|(?:wie ?viel|was) (?:geld )?(?:gebe|geb|geben) (?:ich|wir)(?=[^?]*(?<![\p{L}])aus(?![\p{L}]))|(?:wie ?viel|was) (?:geld )?(?:ging|geht|gingen|ist|sind|wurde|wurden|war|waren)(?=[^?]*(?<![\p{L}])(?:drauf|draufgegangen|weg|weggegangen|ausgegeben|bezahlt|gezahlt|verbraucht)(?![\p{L}]))|(?:wie ?viel|wieviel) (?:geld )?(?:ging|ist|geht) (?:für|an|in|bei|drauf|weg)|(?:wie ?viel|wieviel) (?:geld )?(?:für|fürs|bei|an|in|im|beim|auf)(?![\p{L}])|(?:meine |die |gesamte |unsere )?ausgaben (?:insgesamt|gesamt|in summe|bisher)|(?:wie hoch|was) (?:sind|waren|ist|war) (?:meine|die|unsere) (?:ausgaben|kosten)|(?:wie ?viel|was) (?:hat|haben|hatte|hatten)(?: mich| uns)?(?=[^?]*(?<![\p{L}])gekostet(?![\p{L}]))|was (?:kostet|kosten|kostete|kosteten) (?:mich|uns)|(?:wie ?viel|wieviel) (?:kostet|kosten|kostete|kosteten)(?: mich| uns)?)/u,
    incomeLead: /(?<![\p{L}])(?:(?:wie ?viel|was) (?:geld |gehalt |lohn )?(?:habe|hab|hab'|haben|hatte|hatten) (?:ich|wir)(?=[^?]*(?<![\p{L}])(?:verdient|eingenommen|bekommen|erhalten|reinbekommen|kassiert|gekriegt)(?![\p{L}]))|(?:wie ?viel|was) (?:geld |gehalt |lohn )?(?:kam|kommt|ist|sind|ging)(?=[^?]*(?<![\p{L}])(?:rein|herein|reingekommen|hereingekommen|eingegangen)(?![\p{L}]))|(?:meine |die )?einnahmen (?:insgesamt|gesamt|in summe|bisher)|(?:mein |das )?einkommen (?:insgesamt|gesamt|bisher)|wie ?viel (?:einkommen|einnahmen)|(?:wie hoch|was) (?:ist|war|sind|waren) (?:mein|meine|das|die|unser|unsere) (?:einkommen|einnahmen)|(?:meine |die )?einnahmen(?![^?]*\d)(?= (?:diese|dieses|diesen|dieser|letzte|letzten|letztes|im|in|seit|heute|gestern)(?![\p{L}])|$))/u,
    weakLead: /(?<![\p{L}])(?:(?:meine |die |unsere |gesamte )?(?:ausgaben|kosten)(?: für| fürs| bei| beim| an| im| in)?|(?:die )?(?:summe|gesamtsumme)(?: für| fürs| der| von)?|wie ?viel(?: geld)?(?: für| fürs| bei| beim| an)?|insgesamt|gesamt)(?![\p{L}])/u,
    periods: [
      periodWords(['diese gehaltsperiode', 'dieser gehaltsperiode', 'in dieser gehaltsperiode', 'gehaltsperiode', 'diese abrechnungsperiode', 'abrechnungsperiode', 'seit dem zahltag', 'seit zahltag', 'seit dem letzten zahltag', 'seit dem letzten gehalt', 'seit dem gehalt', 'seit dem letzten lohn', 'seit dem lohn', 'seit gehaltseingang', 'seit dem gehaltseingang', 'seit lohneingang', 'seit ich bezahlt wurde', 'seit ich gehalt bekommen habe', 'seit ich gehalt bekommen hab', 'seit ich lohn bekommen habe', 'seit ich lohn bekommen hab', 'seit das gehalt kam', 'seit das gehalt da ist', 'diese periode', 'in dieser periode', 'diesen zeitraum', 'diese budgetperiode', 'in dieser budgetperiode'], 'budget'),
      periodWords(['heute', 'heute morgen', 'heute nachmittag', 'heute abend', 'bis jetzt heute'], 'today'),
      periodWords(['gestern'], 'yesterday'),
      periodWords(['letzte woche', 'in der letzten woche', 'vergangene woche', 'in der vergangenen woche', 'vorige woche', 'letzter woche'], 'lastWeek'),
      periodWords(['diese woche', 'in dieser woche', 'die woche', 'in der woche', 'diese woche bisher', 'bisher diese woche', 'pro woche', 'in der woche so'], 'week'),
      periodWords(['letzten monat', 'im letzten monat', 'vergangenen monat', 'im vergangenen monat', 'vorigen monat', 'letzter monat', 'im vormonat', 'vormonat'], 'lastMonth'),
      periodWords(['diesen monat', 'in diesem monat', 'den monat', 'im monat', 'dieser monat', 'bisher diesen monat', 'diesen monat bisher', 'seit monatsanfang', 'seit anfang des monats', 'seit dem ersten', 'seit monatsbeginn', 'pro monat', 'im monat so'], 'month'),
      periodWords(['letztes jahr', 'im letzten jahr', 'vergangenes jahr', 'im vergangenen jahr', 'voriges jahr', 'im vorjahr'], 'lastYear'),
      periodWords(['dieses jahr', 'in diesem jahr', 'das jahr', 'im jahr', 'seit jahresanfang', 'seit anfang des jahres', 'seit neujahr'], 'year'),
      periodWords(['insgesamt', 'in summe', 'bisher', 'bis jetzt', 'überhaupt', 'ueberhaupt', 'seit anfang', 'alles zusammen', 'gesamt', 'jemals'], 'all'),
    ],
    strip: [
      /^(?:(?:sag|zeig|verrat) (?:mir|uns)|kannst du mir sagen|weißt du)\s*,?\s*/u,
      /(?<![\p{L}])(?:ausgegeben|bezahlt|gezahlt|verbraten|ausgeben|verpulvert|gelassen|draufgegangen|weggegangen|verprasst|verballert|rausgehauen|verbraucht|gelatzt|geblecht|hingelegt|gekostet|verdient|eingenommen|bekommen|erhalten|reinbekommen|kassiert|gekriegt|reingekommen|hereingekommen|eingegangen)(?![\p{L}])/gu,
      /^(?:(?:für|fürs|fuer|bei|beim|an|ans|in|im|ins|auf|aufs|mit|zu|zum|zur|den|die|das|der|dem|meine|meinen|mein|und|geld|habe|hab|haben|hat|ich|wir|mich|uns|schon|bereits|eigentlich|denn|so|jetzt|ist|sind|ging)\s+)+/u,
      /(?:\s+(?:insgesamt|bisher|bitte|danke|geld|schon|bereits|eigentlich|denn|so|jetzt|dieser|diese|dieses|den|die|das|habe|hab|haben|hat|aus|drauf|weg|rein|herein|gegangen|ging|ist|war))+$/u,
      /(?<![\p{L}])(?:geld|euro|euros|dollar|franken)(?![\p{L}])/gu,
      /(?<=\p{L})-(?=\s|$)/gu,
    ],
    remainingLead: /(?<![\p{L}])(?:(?:wie ?viel|wieviel) (?:geld |budget )?(?:habe ich|hab ich|haben wir|ist|sind) (?:mir |uns )?(?:noch )?(?:übrig|uebrig|frei|verfügbar|verfuegbar)|(?:wie ?viel|wieviel) (?:geld |budget )?(?:habe ich|hab ich|haben wir) noch|(?:wie ?viel|wieviel) (?:geld |budget )?(?:habe|hab|haben) (?:ich|wir)(?=[^?]*(?<![\p{L}])(?:noch|übrig|uebrig)(?![\p{L}]))(?![^?]*(?<![\p{L}])(?:ausgegeben|bezahlt|gezahlt|verdient|eingenommen|bekommen|erhalten)(?![\p{L}]))|(?:wie ?viel|wieviel) (?:geld )?(?:bleibt|bleiben) (?:mir |uns )?(?:noch)?|(?:wie ?viel|wieviel) (?:geld )?ist (?:mir |uns )?noch|(?:wie ?viel|wieviel|was) (?:geld )?(?:kann|darf|könnte|koennte|können|koennen|dürfen|duerfen) (?:ich|wir)(?=[^?]*(?<![\p{L}])ausgeben(?![\p{L}]))|(?:wie ?viel|wieviel|was) (?:geld )?ist(?=[^?]*(?<![\p{L}])(?:noch|übrig|uebrig|frei|verfügbar|verfuegbar|drin)(?![\p{L}]))|was (?:ist|bleibt) (?:mir |uns )?(?:noch )?(?:übrig|uebrig)|was (?:bleibt|bleiben)(?: mir| uns)?|(?:was ist|wie hoch ist|wie viel ist) (?:mein|das|unser) (?:rest)?budget|(?:mein |das )?restbudget|(?:mein |das )?(?:verbleibende|übrige|uebrige) budget|(?:liege|lieg|liegen|bin|sind) (?:ich|wir) (?:noch )?(?:im|in meinem|in unserem|innerhalb meines|innerhalb des) (?:budget|plan|rahmen)|wie (?:sieht|steht es um|steht's um) (?:mein|das|unser|es mit dem|es mit meinem) budget(?: aus)?|wie (?:läuft|laeuft)(?: es|'s)? mit (?:dem|meinem|unserem) budget|wie (?:stehe|steh|stehen) (?:ich|wir)|ist (?:noch )?(?:was|etwas|geld|budget) (?:übrig|uebrig|frei|da)|(?:habe|hab|haben) (?:ich|wir) noch (?:geld|was|etwas|budget)|(?:wie ist|was ist|wie hoch ist|wie sieht) (?:mein|der|unser) kontostand(?: aus)?|wie ?viel geld (?:habe|hab|haben) (?:ich|wir)(?=\s*$)|(?:wie ?viel|was) (?:geld )?(?:ich|wir) (?:noch )?(?:übrig |uebrig )?(?:habe|hab|haben)(?=\s*$)|(?:reicht|reichen) (?:das|mein|unser) geld)(?![\p{L}])/u,
    remainingWords: /(?<![\p{L}])(?:budgets?|restbudget|plans?|übrig|uebrig|frei|verfügbar|verfuegbar|noch|rest|ausgeben|geld|verbleibende|verbleibendes|drin|da|bis (?:zum )?(?:nächsten |naechsten )?(?:zahltag|gehalt|lohn|monatsende|ende des monats))(?![\p{L}])/gu,
    groups: [
      { words: ['essen', 'nahrung', 'ernährung', 'ernaehrung', 'essen und trinken', 'verpflegung', 'lebensmittel und restaurants', 'lebensmittel und essen gehen', 'futter'], ids: ['groceries', 'dining'] },
    ],
  },
  contextualStrings: ['Euro', 'Einkauf', 'Miete', 'Gehalt', 'Ziel', 'Netflix', 'Uber', 'Mittagessen'],
};
