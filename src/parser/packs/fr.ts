import { dayOfMonthRule, ISO_RULE, byMonthRule, byYearRule, endOfYearRule, dayMonthRule, relativeFutureRules, relativePastRules, slashRule, weekdayRule } from '../dateRules';
import { makeNumberWords } from '../numbers';
import type { LanguagePack } from '../types';
import { periodWords } from '../questionRules';
import { clockRule, dayWords, futureDayOfMonthRule, futureWeekdayRule, monthlyOnRule, repeatWords, weeklyOnRule, wordTimeRules } from '../reminderRules';

const MONTHS = { names: { janvier: 0, janv: 0, février: 1, fevrier: 1, févr: 1, fevr: 1, mars: 2, avril: 3, avr: 3, mai: 4, juin: 5, juillet: 6, juil: 6, août: 7, aout: 7, septembre: 8, sept: 8, octobre: 9, oct: 9, novembre: 10, nov: 10, décembre: 11, decembre: 11, déc: 11, dec: 11 } };
const WEEKDAYS = { names: { dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6 }, lastAfter: ['dernier'], prefixes: ['le', 'ce'] };

// 71-79 and 91-99 glue a tens word to a teen: "soixante-quinze" is 75, not 60 and 15 cents.
const TEENS: [string, number][] = [['onze', 11], ['douze', 12], ['treize', 13], ['quatorze', 14], ['quinze', 15], ['seize', 16], ['dixsept', 17], ['dixhuit', 18], ['dixneuf', 19]];
const SEVENTIES_NINETIES: Record<string, number> = Object.fromEntries(TEENS.flatMap(([t, v]) => [[`soixante${t}`, 60 + v], [`quatrevingt${t}`, 80 + v]]));

const numberWords = makeNumberWords({
  units: { zéro: 0, zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16, dixsept: 17, dixhuit: 18, dixneuf: 19, ...SEVENTIES_NINETIES },
  // Belgium and Switzerland say septante, huitante/octante and nonante.
  tens: { vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60, soixantedix: 70, quatrevingt: 80, quatrevingts: 80, quatrevingtdix: 90, septante: 70, huitante: 80, octante: 80, nonante: 90 },
  hundred: ['cent', 'cents'],
  thousand: ['mille'],
  million: ['million', 'millions'],
  connectors: ['et'],
  one: ['un', 'une'],
  pre: (t) => t
    .replace(/\b(soixante|quatre[- ]vingt)[- ](onze|douze|treize|quatorze|quinze|seize|dix[- ]sept|dix[- ]huit|dix[- ]neuf)\b/g, (_m, a: string, b: string) => a.replace(/[- ]/g, '') + b.replace(/[- ]/g, ''))
    .replace(/quatre[- ]vingt[- ]dix/g, 'quatrevingtdix')
    .replace(/quatre[- ]vingts?/g, 'quatrevingt')
    .replace(/soixante[- ]dix/g, 'soixantedix')
    .replace(/dix[- ]sept/g, 'dixsept')
    .replace(/dix[- ]huit/g, 'dixhuit')
    .replace(/dix[- ]neuf/g, 'dixneuf')
    .replace(/\b(vingt|trente|quarante|cinquante|soixante|soixantedix|quatrevingt|septante|huitante|octante|nonante|cent|mille)-(un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|dixsept|dixhuit|dixneuf|et)\b/gu, '$1 $2')
    .replace(/\b(et)-(un|une|onze)\b/gu, '$1 $2'),
});

export const fr: LanguagePack = {
  code: 'fr',
  speechTag: 'fr-FR',
  tokenizer: 'space',
  decimalComma: true,
  numberWords,
  currencyMarkers: /€|\$|euros?|balles|dollars?|piastres?|piasses?|francs?|usd|eur|chf|cad/i,
  currencyWords: /(?<![\p{L}])(?:euros?|balles|dollars?|piastres?|piasses?|francs?|usd|eur|chf|cad|centimes?)(?![\p{L}])/giu,
  incomeVerbs: ["j'ai reçu", 'reçu', "on m'a payé", "m'a payé", "m'ont payé", "m'a payée", 'été payé', 'été payée', 'ai été payée', 'salaire', 'paie', 'paye', 'gagné', 'remboursé', 'remboursée', 'prime', "m'a rapporté", "m'ont rapporté", 'rapporté', "m'a offert", "m'ont offert", "m'a viré", "m'ont viré", "m'a fait un virement", "m'a fait un lydia", "m'a filé", "m'a passé", 'commission', 'vendu', 'pourboires', 'pourboire', 'cadeau de', "m'a donné", "m'ont donné", "m'a envoyé", "m'ont envoyé", 'virement reçu', "m'a remboursé", "m'ont remboursé", 'touché', 'encaissé', 'perçu', 'retraite', 'allocation', 'allocations', 'caf', 'bourse', 'dividendes', 'intérêts reçus'],
  expenseVerbs: ['dépensé', 'payé', 'acheté', 'dépense', 'achat', 'coûté', 'coûte', 'commandé', 'pris', 'réglé', "m'a prélevé", "m'ont prélevé", 'prélevé', 'prélevés', 'lâché', 'craqué', 'flambé', "m'est revenu", "m'est revenue", "m'en a coûté", "j'en ai eu pour", "m'a pris", 'donné', 'prêté', 'retiré', 'envoyé', 'viré', 'claqué', 'mis', 'facture', 'sorti', 'dépenses', 'achats', 'acheter', 'payer', 'dépenser', 'offert', 'cotisé'],
  keywords: {
    salary: ['salaire', 'paie', 'paye', 'fiche de paie', 'virement salaire', 'virement du salaire', 'virement de salaire', 'jour de paie', 'traitement', 'été payé', 'été payée', '13e mois', 'treizième mois'],
    freelance: ['freelance', 'free-lance', 'auto-entrepreneur', 'client', 'facture payée', 'mission', 'prestation', 'consulting', 'commission', 'cours particuliers', 'vendu', 'vente', 'vinted', 'leboncoin', 'pourboires', 'pourboire', 'malt', 'upwork', 'extra'],
    // The tokenizer splits "m'a" into "m a", so these phrases are written the way it sees them.
    gift_income: ['cadeau de', 'm a donné', 'm ont donné', 'm a offert', 'm ont offert', 'ma mère', 'mon père', 'mes parents', 'ma grand-mère', 'mon grand-père', 'ma marraine', 'mon parrain', 'argent de poche', 'anniversaire', 'de ma mère', 'de mon père', 'de mamie', 'de papi', 'étrennes'],
    other_income: ['remboursement', 'remboursé', 'remboursée', 'cashback', 'intérêts', 'dividendes', 'prime', 'bonus', 'impôts remboursés', 'crédit d\'impôt', 'gagné au', 'loterie', 'retraite', 'pension', 'bourse', 'allocation', 'allocations', 'caf', 'chômage', 'apl', 'rsa', 'prime d activité', 'aide au logement', 'sécu', 'sécurité sociale', 'ameli', 'cpam', 'revenu', 'revenus', 'pôle emploi', 'france travail', "m'a remboursé", 'lydia de', 'virement de', 'wero de', 'aide'],
    groceries: ['courses', 'dépanneur', 'dep', 'supermarché', 'marché', 'épicerie', 'carrefour', 'leclerc', 'auchan', 'intermarché', 'super u', 'lidl', 'aldi', 'monoprix', 'franprix', 'casino', 'picard', 'grand frais', 'biocoop', 'boucherie', 'fruits', 'légumes', 'pain', 'lait', 'œufs', 'oeufs', 'viande', 'poisson', 'fromage', 'alimentation', 'nourriture', 'primeur', 'boulangerie'],
    dining: ['déjeuner', 'déj', 'dej', 'dîner', 'diner', 'souper', 'petit déjeuner', 'petit-déjeuner', 'petit dej', 'petit déj', 'restos', 'restaurants', 'cafés', 'macdo', 'burger king', 'kfc', 'brunch', 'café', 'resto', 'restaurant', 'brasserie', 'bistro', 'bar', 'bière', 'bières', 'vin', 'verre', 'verres', 'apéro', 'pizza', 'burger', 'sushi', 'kebab', 'sandwich', 'tacos', 'goûter', 'snack', 'uber eats', 'deliveroo', 'just eat', 'livraison repas', 'mcdo', 'mcdonalds', 'quick', 'starbucks', 'glace', 'dessert', 'croissant', 'repas', 'plat', 'terrasse', 'cantine', 'crêpe', 'crêpes', 'boisson', 'boissons', 'soirée resto', 'traiteur'],
    rent: ['loyer', 'hypothèque', 'crédit immobilier', 'propriétaire', 'charges', 'copropriété', 'assurance habitation', 'appartement', 'caution', 'taxe foncière', 'agence immobilière'],
    utilities: ['électricité', 'edf', 'engie', 'gaz', 'eau', 'internet', 'box', 'wifi', 'forfait', 'téléphone', 'mobile', 'portable', 'free', 'orange', 'sfr', 'bouygues', 'chauffage', 'énergie', "facture d'électricité", 'facture de gaz', "facture d'eau", 'abonnement internet', 'ordures', 'taxe d\'habitation', 'fioul', 'bois de chauffage'],
    transport: ['essence', 'carburant', 'gazole', 'diesel', 'plein', 'uber', 'bolt', 'taxi', 'vtc', 'train', 'sncf', 'tgv', 'ter', 'métro', 'metro', 'bus', 'tram', 'navigo', 'ticket', 'tickets de métro', 'transport', 'transports', 'péage', 'parking', 'stationnement', 'voiture', 'assurance auto', 'garage', 'garagiste', 'mécanicien', 'réparation de la voiture', 'réparation voiture', 'pneus', 'vidange', 'contrôle technique', 'vol', 'avion', "billet d'avion", 'ryanair', 'easyjet', 'location de voiture', 'vélo', 'trottinette', 'blablacar', 'covoiturage', 'trajet', 'ouigo', 'amende de stationnement', 'lavage auto'],
    health: ['médecin', 'docteur', 'dentiste', 'pharmacie', 'ordonnance', 'médicaments', 'médicament', 'hôpital', 'clinique', 'mutuelle', 'consultation', 'thérapie', 'psy', 'psychologue', 'salle de sport', 'sport', 'gym', 'basic fit', 'yoga', 'pilates', 'vitamines', 'lunettes', 'opticien', 'lentilles', 'ostéo', 'kiné', 'vétérinaire', 'véto', 'massage', 'santé', 'analyses', 'laboratoire'],
    entertainment: ['cinéma', 'ciné', 'film', 'concert', 'billets', 'places', 'théâtre', 'spectacle', 'jeu', 'jeux', 'jeu vidéo', 'jeux vidéo', 'steam', 'playstation', 'xbox', 'nintendo', 'bowling', 'musée', 'parc', 'soirée', 'boîte', 'club', 'karaoké', 'livre', 'livres', 'loisirs', 'hobby', 'sortie', 'match', 'foot', 'stade', 'escape game', 'laser game', 'expo', 'festival', 'fête foraine'],
    shopping: ['amazon', 'vêtements', 'fringues', 'chaussures', 'baskets', 'chemise', 'pantalon', 'jean', 'robe', 'veste', 'manteau', 'shopping', 'magasin', 'boutique', 'centre commercial', 'ikea', 'meubles', 'déco', 'décoration', 'leroy merlin', 'castorama', 'bricolage', 'électronique', 'fnac', 'darty', 'boulanger', 'casque', 'écouteurs', 'téléphone neuf', 'ordinateur', 'chargeur', 'cadeau', 'cadeaux', 'jouets', 'jouet', 'maquillage', 'cosmétiques', 'coiffeur', 'coupe', 'barbier', 'ongles', 'sephora', 'zara', 'h&m', 'primark', 'commande', 'papeterie', 'fournitures', 'maison', 'ménage', 'produits ménagers', 'lessive', 'pressing', 'laverie', 'fleurs', 'plantes', 'animal', 'animaux', 'chien', 'chat', 'croquettes', 'enfants', 'bébé', 'couches', 'école', 'université', 'frais de scolarité', 'cours', 'manuel', 'manuels', 'décathlon', 'action', 'vinted'],
    subscriptions: ['abonnement', 'abonnements', 'netflix', 'spotify', 'deezer', 'canal', 'canal+', 'disney', 'disney plus', 'amazon prime', 'prime', 'apple music', 'youtube premium', 'icloud', 'google one', 'dropbox', 'chatgpt', 'claude', 'adobe', 'adhésion', 'patreon', 'journal', 'le monde', 'crunchyroll', 'twitch', 'renouvellement', 'mensualité', 'forfait mensuel', 'plan annuel', 'duolingo', 'game pass', 'ps plus', 'molotov', 'ocs'],
    debt: ['remboursement du prêt', 'remboursement de crédit', 'remboursement du crédit', 'remboursement carte', 'crédit auto', 'mensualité du crédit', 'mensualité du prêt', 'visa', 'mastercard', 'amex', 'carte de crédit', 'crédit', 'prêt', 'emprunt', 'dette', 'mensualité de prêt', 'remboursement de prêt', 'intérêts', 'agios', 'découvert', 'klarna', 'alma', 'échéance', 'traite', 'crédit conso', 'prêt étudiant'],
    savings: ['épargne', 'économies', 'virement', 'livret', 'livret a', "fonds d'urgence", 'investissement', 'investi', 'placement', 'retraite', 'actions', 'bourse', 'crypto', 'bitcoin', 'mis de côté', 'compte épargne', 'pea', 'assurance vie', 'etf', 'boursorama', 'trade republic'],
    other_expense: ['frais', 'frais bancaires', 'distributeur', 'retrait', 'espèces', 'liquide', 'don', 'association', 'église', 'impôts', 'impôt', 'taxe', 'amende', 'pv', 'contravention', 'timbres', 'la poste', 'colis', 'divers', 'autre', 'autres', 'trucs', 'prêté', 'lydia', 'paypal', 'wero', 'paylib', 'assurance', 'crèche', 'nounou', 'garde', 'éducation', 'avocat', 'notaire', 'comptable', 'mariage', 'vacances', 'voyage', 'hôtel', 'airbnb', 'auberge', 'hébergement', 'pourboire', 'cotisation'],
  },
  stopwords: ['le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd', 'en', 'à', 'au', 'aux', 'pour', 'par', 'avec', 'sans', 'et', 'ou', 'mais', 'que', 'qui', 'je', 'j', 'me', 'm', 'tu', 'te', 'on', 'nous', 'vous', 'il', 'elle', 'ils', 'elles', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'nos', 'ce', 'cet', 'cette', 'ces', "aujourd'hui", 'hier', 'demain', 'soir', 'matin', 'semaine', 'mois', 'an', 'année', 'dépensé', 'payé', 'acheté', 'dépense', 'achat', 'euros', 'euro', 'dollars', 'chaque', 'total', 'encore', 'aussi', 'alors', 'très', 'nouveau', 'nouvelle', 'plus', 'moins', 'dernier', 'dernière', 'prochain', 'prochaine', 'objectif', 'but', 'économiser', 'épargné', 'mis', 'ajouté', 'vers', 'dans', 'allé', 'aller', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'entrée', 'revenu', 'argent', 'quelque', 'chose', 'truc', 'comme', 'il', 'y', 'a', 'ai', 'ça', 'environ'],
  pastDateRules: [
    ISO_RULE,
    ...relativePastRules({
      today: ["aujourd'hui", 'ce matin', 'cet après-midi', 'cet aprem', 'ce soir', 'ce midi'],
      yesterday: ['hier', 'hier soir', 'hier matin', 'hier après-midi', 'hier midi', 'la nuit dernière'],
      dayBeforeYesterday: ['avant-hier', 'avant hier'],
      lastWeek: ['la semaine dernière', 'semaine dernière', 'la semaine passée'],
      lastMonth: ['le mois dernier', 'mois dernier', 'le mois passé'],
      daysAgo: /\bil y a (\d+|un) jours?\b/,
      weeksAgo: /\bil y a (\d+|une) semaines?\b/,
      monthsAgo: /\bil y a (\d+|un) mois\b/,
      oneWords: ['un', 'une'],
    }),
    dayMonthRule(MONTHS, { pre: ['le'], ordinal: '(?:er)?' }),
    weekdayRule(WEEKDAYS),
    slashRule(true),
    dayOfMonthRule(/\ble (\d{1,2})(?:er)?\b(?!\s?(?:h\b|€|euros?))/),
  ],
  futureDateRules: [
    ISO_RULE,
    ...relativeFutureRules({
      endOfYear: ["d'ici la fin de l'année", "avant la fin de l'année", "pour la fin de l'année", "fin d'année", "la fin de l'année", "fin de l'année", "d'ici fin d'année"],
      endOfNextYear: ["fin de l'année prochaine", "d'ici la fin de l'année prochaine"],
      endOfMonth: ["d'ici la fin du mois", 'avant la fin du mois', 'pour la fin du mois', 'fin du mois', 'la fin du mois', "d'ici fin de mois", 'fin de mois'],
      nextYear: ["l'année prochaine", "d'ici l'année prochaine", "pour l'année prochaine", "avant l'année prochaine"],
      nextMonth: ['le mois prochain', "d'ici le mois prochain", 'pour le mois prochain', 'avant le mois prochain'],
      christmas: ['pour noël', 'avant noël', "d'ici noël", 'noël'],
      inDays: /\b(?:dans|d'ici|en|sous|pendant|sur) (?:les )?(\d+|un) (?:prochains )?jours?\b/,
      inWeeks: /\b(?:dans|d'ici|en|sous|pendant|sur) (?:les )?(\d+|une) (?:prochaines )?semaines?\b/,
      inMonths: /\b(?:dans|d'ici|en|sous|pendant|sur) (?:les )?(\d+|un) (?:prochains )?mois\b/,
      inYears: /\b(?:dans|d'ici|en|sous|pendant|sur) (?:les )?(\d+|un) (?:prochaines )?ans?\b/,
      oneWords: ['un', 'une'],
      seasons: { spring: ['pour le printemps', "d'ici le printemps", 'avant le printemps'], summer: ["pour l'été", "d'ici l'été", "avant l'été", "cet été"], fall: ["pour l'automne", "d'ici l'automne", "avant l'automne"], winter: ["pour l'hiver", "d'ici l'hiver", "avant l'hiver"] },
    }),
    dayMonthRule(MONTHS, { pre: ['pour le', 'avant le', "d'ici le", 'le', 'pour'], ordinal: '(?:er)?', future: true }),
    endOfYearRule(['pour fin', "d'ici fin", 'avant fin', "d'ici la fin de", 'avant la fin de', 'pour la fin de', 'fin']),
    byMonthRule(MONTHS, ['pour', 'avant', "d'ici", 'en', "jusqu'en", 'pour fin', "d'ici fin", 'avant fin', 'pour le prochain', 'le prochain']),
    byYearRule(['pour', 'avant', "d'ici", 'en', 'courant']),
  ],
  goalLead: /^(?:objectif|but|nouvel objectif|objectif d'épargne|(?:fais|faire|crée|créer|je veux|je voudrais|fixe|fixer|mets|mettre)(?: un| une| moi un| en place un)?(?: nouvel| nouveau| nouvelle)? (?:plan|objectif|but)(?: pour| de)?)\s*:?\s*/iu,
  // "mettre 1000 de côté" may carry the amount in the middle; "je mets 100 de côté pour le Japon" stays a contribution.
  goalIntent: /(?<![\p{L}])(?:je veux économiser|je voudrais économiser|j'aimerais économiser|je veux mettre de côté|je veux épargner|je dois économiser|je veux garder|économiser|épargner|mettre (?:\d+(?:\.\d+)? ?(?:euros?|€|balles|dollars?|piastres?|piasses?)? )?(?:de l'argent |des sous |un peu )?de côté|(?:je |on )?(?:mets|met|mettons) (?:de l'argent|des sous|un peu d'argent) de côté)(?![\p{L}])/iu,
  goalPastVerbs: /(?<![\p{L}])(?:économisé|épargné|mis|ajouté|viré|transféré|déposé|versé|placé|payé|remboursé)(?![\p{L}])/iu,
  debtIntent: /(?<![\p{L}])(?:(?:je veux |je voudrais |j'aimerais |je dois |je vais |on veut |nous voulons |il faut )?(?:rembourser|solder|éponger|eponger|réduire|reduire|me débarrasser de|me debarrasser de|sortir de|finir de payer|liquider|sans dettes?)|(?:je dois|on doit|il me reste) (?:encore )?(?:\d+(?:\.\d+)? ?(?:euros?|€|balles|dollars?)? )?(?:sur|à rembourser sur|de dettes? sur|de dette sur))(?![\p{L}])/iu,
  debtWords: /(?<![\p{L}])(?:dettes?|carte de crédit|carte de credit|cartes? de crédit|visa|mastercard|amex|american express|carte bleue|crédit renouvelable|credit renouvelable|crédit conso|prêts?|prets?|crédit|credit|emprunt|hypothèque|hypotheque|découvert|decouvert)(?![\p{L}])/iu,
  // "100 dans la cagnotte Japon": a kitty or piggy bank is only ever paid into; nothing is a contribution unless a goal is found.
  contributionVerbs: /(?<![\p{L}])(?:ajout(?:é|e|er)|mis|mets|mettre|cagnotte|tirelire|économisé|épargné|vir(?:é|e)|transf(?:éré|ère|erer)|dépos(?:é|e)|vers(?:é|e)|plac(?:é|e))(?![\p{L}])/iu,
  contributionPreps: 'à|au|à la|à mon|à ma|pour|vers|dans|sur|sur mon|sur ma|dans mon|dans ma',
  forWords: "pour|pour le|pour la|pour un|pour une|pour les|pour mon|pour ma|pour mes|pour l'",
  goalWords: 'objectif|but',
  goalNouns: /^(?:cagnotte|tirelire|fonds|épargne|epargne|compte|livret|objectif|projet|économies|economies|enveloppe|budget|but)$/u,
  articles: /^(?:(?:le|la|les|un|une|des|mon|ma|mes|notre|nos|nouveau|nouvelle|nouvel)\s+|l')+/,
  leadingFiller: /^(?:(?:j'ai|je|on|a|ai|aujourd'hui|hier|bon|aussi|encore|dépensé|payé|acheté|dépense|achat|pris|en|de|du|des|pour|par|avec|à|au|aux|le|la|les|un|une|mon|ma|mes|me|se|environ|à peu près|genre|quelque)\s+|(?:j'|d'|l'|qu')(?=\p{L}))+/u,
  trailingFiller: /(?:\s+(?:aujourd'hui|hier|en|de|du|des|pour|par|avec|à|au|le|la|les|un|une|et|chaque|total|encore|aussi|s'il te plaît|merci|ça|ce|cela|environ|à peu près))+$/u,
  noteStrip: [],
  listSeparators: [',', ';', 'et', 'plus', 'puis', 'et puis', 'et aussi', 'ensuite'],
  reminder: {
    lead: /(?<![\p{L}])(?:(?:peux-tu |tu peux |pouvez-vous |s'il te plaît |stp )?(?:rappelle-moi|rappelle moi|rappelez-moi|rappelez moi|me rappeler|rappelle-nous|mets un rappel|mettre un rappel|mets-moi un rappel|crée un rappel|créer un rappel|ajoute un rappel|je veux un rappel|il me faut un rappel|rappel|préviens-moi|previens-moi|préviens moi|fais-moi penser|fais moi penser|ne me laisse pas oublier|pense-bête|programme un rappel|programmer un rappel|programme-moi un rappel|ajoute-moi un rappel|envoie-moi une notif(?:ication)?|envoie moi une notif(?:ication)?|notifie-moi|notifie moi|(?:il )?(?:faut|faudrait) (?:que je|qu'on) pense à|(?:il )?ne faut pas que j'oublie|faut pas que j'oublie|n'oublie pas de me rappeler|n'oublie pas|oublie pas de))(?![\p{L}])(?:\s+(?:(?:de|que|à|a|pour)(?![\p{L}])|d'))?\s*:?/iu,
    time: [
      clockRule(['à', 'a', 'vers', 'pour'], { suffix: 'h(?:eures?)?', hourSep: '(?:h|:)', dayParts: { 'du matin': 0, 'le matin': 0, "de l'après-midi": 12, "de l'apres-midi": 12, 'du soir': 12, 'le soir': 12 } }),
      ...wordTimeRules({ morning: ['le matin', 'dans la matinée', 'dans la matinee', 'ce matin', 'au réveil'], noon: ['à midi', 'a midi', 'midi', 'au déjeuner'], afternoon: ["dans l'après-midi", "dans l'apres-midi", "cet après-midi", "cet apres-midi", "l'après-midi"], evening: ['ce soir', 'le soir', 'dans la soirée', 'dans la soiree', 'cette nuit', 'avant de dormir'] }, { morning: 8, noon: 12, afternoon: 15, evening: 19 }),
    ],
    repeat: [
      weeklyOnRule(['tous les', 'chaque', 'le'], WEEKDAYS.names, { suffix: ['s'] }),
      monthlyOnRule(/(?<![\p{L}])(?:le |tous les )?(\d{1,2}|1er|premier) (?:de )?chaque mois(?![\p{L}])/iu, { '1er': 1, premier: 1 }),
      repeatWords(['chaque matin', 'tous les matins'], 'daily', 8),
      repeatWords(['chaque soir', 'tous les soirs', 'chaque nuit', 'toutes les nuits'], 'daily', 20),
      repeatWords(['chaque après-midi', 'tous les après-midis', 'chaque apres-midi'], 'daily', 15),
      repeatWords(['chaque jour', 'tous les jours', 'quotidiennement', 'quotidien'], 'daily'),
      repeatWords(['chaque semaine', 'toutes les semaines', 'hebdomadaire', 'une fois par semaine'], 'weekly'),
      repeatWords(['chaque mois', 'tous les mois', 'mensuellement', 'mensuel', 'une fois par mois', 'au début de chaque mois', 'en début de mois'], 'monthly'),
    ],
    day: [
      ISO_RULE,
      dayWords(['après-demain', 'apres-demain', 'après demain', 'apres demain'], 2),
      dayWords(['demain'], 1),
      dayWords(["aujourd'hui", 'ce soir', "cet après-midi", "cet apres-midi", 'ce matin'], 0),
      futureWeekdayRule(WEEKDAYS.names, { pre: ['le prochain', 'prochain', 'ce', 'le', 'pour le'], suffix: ['prochain'], nextWords: ['prochain'] }),
      dayMonthRule(MONTHS, { pre: ['le', 'pour le', 'du'], ordinal: '(?:er)?', future: true }),
    ],
    dayLate: [futureDayOfMonthRule(/(?<![\p{L}])(?:le|pour le) (\d{1,2}(?:er)?|premier)(?![\p{L}\p{N}:h])/iu, { premier: 1 })],
    strip: [/^(?:(?:de|que|à|a|pour|d'|et|s'il te plaît|s'il vous plaît|stp|il faut|je dois|que je dois|que je)\s+)+/iu, /(?:\s+(?:s'il te plaît|s'il vous plaît|stp|merci))+$/iu],
  },
  question: {
    lead: /(?<![\p{L}])(?:combien|qu'est-ce que|qu est-ce que|ce que) (?:d'argent )?(?:j'ai|j ai|ai[- ]je|on a|a[- ]t[- ]on|nous avons|avons[- ]nous|tu as|t'as|as[- ]tu|vous avez|avez[- ]vous) (?:dépensé|depense|dépensés|payé|paye|mis|claqué|claque|lâché|laissé)|(?<![\p{L}])(?:j'ai|on a|tu as|t'as|nous avons|vous avez) (?:dépensé|depense|payé|paye|claqué|claque|mis|lâché) combien|(?<![\p{L}])combien (?:d'argent )?(?:je dépense|je depense|on dépense|tu dépenses|est-ce que j'ai dépensé|est-ce que j'ai payé|est-ce que je dépense)|(?<![\p{L}])combien (?:d'argent )?(?:est parti|est partie|sont partis|est passé|est passe|part|passe|file|est allé|est allé|va|est sorti)(?= (?:en|dans|pour|au|aux|à|a|chez|sur)(?![\p{L}]))|(?<![\p{L}])combien (?:d'argent )?(?:en|pour|chez|au|aux|à|a|dans|sur|de)(?![\p{L}])|(?<![\p{L}])(?:mes |le |mon |total des )?dépenses? (?:totales?|en tout|au total)|(?<![\p{L}])combien (?:(?:ça|ca) )?(?:m'a|m'ont|me|nous a) (?:coûté|coute|couté|coûte|coûtent|coutent)|(?<![\p{L}])(?:ça|ca) (?:m'a|me|nous a) (?:coûté|coute|couté|coûte) combien/u,
    incomeLead: /(?<![\p{L}])(?:combien|qu'est-ce que|qu est-ce que|ce que) (?:d'argent )?(?:j'ai|j ai|ai[- ]je|on a|nous avons|tu as|t'as|as[- ]tu|vous avez) (?:gagné|gagne|reçu|recu|touché|touche|encaissé|encaisse|perçu|percu)|(?<![\p{L}])(?:j'ai|on a|tu as|t'as|nous avons|vous avez) (?:gagné|gagne|reçu|recu|touché|touche|encaissé|encaisse) combien|(?<![\p{L}])combien (?:d'argent )?(?:est rentré|est entré|est rentre|est entre|je gagne|on gagne|je touche|j'ai été payé|j'ai été payée|j'ai ete paye)|(?<![\p{L}])(?:mes |le |mon )?(?:revenus?|gains?|entrées?) (?:totaux|total|en tout|au total)|(?<![\p{L}])(?:c'est quoi|c est quoi|quels sont|quelles sont|quel est|quel a été) (?:mes|mon|nos|notre|les|le) (?:revenus?|rentrées|entrées|gains)/u,
    recentDays: /(?<![\p{L}])(?:(?:ces|les|sur les|depuis les|pendant les) )?(\d{1,3}) derniers jours|(?<![\p{L}])(?:depuis|sur) (\d{1,3}) jours/u,
    periods: [
      periodWords(['cette période de paie', 'cette periode de paie', 'période de paie', 'periode de paie', 'depuis la paie', 'depuis ma paie', 'depuis le jour de paie', 'depuis le dernier salaire', 'depuis mon dernier salaire', "depuis que j'ai été payé", "depuis que j'ai ete paye", 'cette période', 'cette periode', "jusqu'à la paie", "jusqu'a la paie", "jusqu'à ma paie", "jusqu'à la prochaine paie", "jusqu'au salaire", "jusqu'au prochain salaire", "jusqu'à mon prochain salaire", 'avant la paie', 'avant la prochaine paie', 'avant mon salaire', 'avant le prochain salaire'], 'budget'),
      periodWords(['le week-end dernier', 'ce week-end', 'le week-end', 'week-end dernier', 'ce weekend', 'le weekend', 'ce week end', 'le week end', 'week-end', 'weekend'], 'weekend'),
      periodWords(["aujourd'hui", 'aujourd hui', 'ce matin', 'cet après-midi', 'cet après midi', 'cet apres-midi', 'cet apres midi', 'ce soir'], 'today'),
      periodWords(['hier'], 'yesterday'),
      periodWords(['la semaine dernière', 'la semaine derniere', 'semaine dernière', 'semaine derniere', 'la semaine passée', 'la semaine passee'], 'lastWeek'),
      periodWords(['cette semaine', 'dans la semaine', 'la semaine'], 'week'),
      periodWords(['le mois dernier', 'mois dernier', 'le mois passé', 'le mois passe'], 'lastMonth'),
      periodWords(['ce mois-ci', 'ce mois ci', 'ce mois', 'dans le mois', 'le mois', 'depuis le début du mois', 'depuis le debut du mois'], 'month'),
      periodWords(["l'année dernière", "l'annee derniere", 'année dernière', 'annee derniere', "l'an dernier", 'an dernier'], 'lastYear'),
      periodWords(['cette année', 'cette annee', "dans l'année", "l'année", "l'annee", 'depuis le début de l\'année'], 'year'),
      periodWords(['en tout', 'au total', 'en tout et pour tout', "jusqu'à présent", "jusqu'a present", 'depuis le début', 'depuis le debut', 'total'], 'all'),
    ],
    strip: [
      /^(?:(?:en|pour|chez|au|aux|à|a|dans|sur|de|du|des|le|la|les|l'|mon|ma|mes|et|argent|j'ai|ai|on|je|d'|d|avec|niveau|côté|question)\s+)+/u,
      /(?:\s+(?:en tout|au total|s'il te plaît|s'il vous plaît|merci|argent|le|la|mon|ma|déjà|deja))+$/u,
      /(?<![\p{L}])(?:argent|euros|dollars)(?![\p{L}])/gu,
    ],
    // Looser phrasings, a question only when no amount was said: "total café ce mois-ci", "mes dépenses en essence".
    weakLead: /(?<![\p{L}])(?:(?:c'est quoi|c est quoi|quelles sont|quel est|montre-moi|donne-moi) )?(?:(?:mes|les|le|mon|nos|notre) )?(?:total|dépenses|depenses)(?: (?:des|du|de la|de|en|pour|au|aux|à la|chez|dans|sur))?(?![\p{L}])/u,
    remainingLead: /(?<![\p{L}])(?:combien (?:d'argent )?(?:il )?(?:me |nous )?reste(?:-t-il| t il)?|combien (?:est-ce qu'il|est ce qu'il) (?:me |nous )?reste|(?:il )?(?:me |nous )?reste combien|combien (?:je peux|puis-je|puis je|on peut|peut-on|peut on|tu peux|peux-tu|est-ce que je peux) (?:encore )?(?:dépenser|depenser|claquer)|(?:je peux|on peut|tu peux) (?:encore )?(?:dépenser|depenser|claquer) combien|(?:quel est|c'est quoi|c est quoi) (?:mon|le|notre) (?:budget|solde|reste)|(?:mon |le )?budget restant|(?:qu'est-ce qu'il|qu est ce qu il|est-ce qu'il|est ce qu'il|est ce qu il) (?:me |nous )?reste|que (?:me |nous )?reste-t-il|(?:il )?(?:me |nous )reste-t-il|il (?:me |nous )reste (?:encore )?(?:de l'argent|des sous|du budget|quelque chose|un peu)|(?:où|ou) (?:j'en suis|j en suis|en suis-je|on en est|en est-on|nous en sommes|tu en es)|(?:est-ce que |est ce que )?(?:je suis|on est|suis-je|je reste|je tiens) (?:toujours |encore |bien )?dans (?:mon |le |notre |les )?budgets?)(?![\p{L}])/u,
    remainingWords: /(?<![\p{L}])(?:budgets?|plans?|prévu|prevu|restants?|restantes?|disponibles?|encore|à dépenser|a depenser|à claquer|argent|reste|solde|de l'argent|des sous)(?![\p{L}])/gu,
    groups: [
      { words: ['nourriture', 'bouffe', 'alimentation', 'manger', 'repas', 'à manger', 'a manger'], ids: ['groceries', 'dining'] },
    ],
  },
  contextualStrings: ['euros', 'courses', 'loyer', 'salaire', 'objectif', 'Netflix', 'Uber', 'resto'],
};
