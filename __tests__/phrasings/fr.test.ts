/**
 * French: the many everyday ways of saying the same thing (France, Belgium, Québec;
 * "tu", "on" and neutral), each with what the parser must make of it.
 */
import { fr } from '@/i18n/locales/fr';
import type { Goal } from '@/types';
import { parseOne, runCases, type Case } from './harness';

const LABELS = fr.s.categoryNames as Record<string, string>;

const expenses: Case[] = [
  ["j'ai dépensé 12 euros pour le déjeuner", { kind: 'transaction', type: 'expense', amount: 12, categoryId: 'dining' }],
  ["j'ai payé 12 € le déj", { kind: 'transaction', type: 'expense', amount: 12, categoryId: 'dining' }],
  ['déjeuner 12 euros', { kind: 'transaction', type: 'expense', amount: 12, categoryId: 'dining' }],
  ['12 balles le resto', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ["ça m'a coûté 12 euros le resto", { type: 'expense', amount: 12, categoryId: 'dining' }],
  ["le resto m'a coûté 45", { type: 'expense', amount: 45, categoryId: 'dining' }],
  ["le resto m'est revenu à 45 euros", { type: 'expense', amount: 45, categoryId: 'dining' }],
  ['resto avec les collègues, 35 euros', { type: 'expense', amount: 35, categoryId: 'dining' }],
  ['un café 3,50', { type: 'expense', amount: 3.5, categoryId: 'dining' }],
  ['café 2 euros 50', { type: 'expense', amount: 2.5, categoryId: 'dining' }],
  ['un kebab 8 balles', { type: 'expense', amount: 8, categoryId: 'dining' }],
  ['vingt balles le kebab', { type: 'expense', amount: 20, categoryId: 'dining' }],
  ['Uber Eats 25 euros', { type: 'expense', amount: 25, categoryId: 'dining' }],
  ['commandé sur Deliveroo 30 euros', { type: 'expense', amount: 30, categoryId: 'dining' }],
  ['apéro en terrasse 18 euros', { type: 'expense', amount: 18, categoryId: 'dining' }],
  ['deux bières 14 euros', { type: 'expense', amount: 14, categoryId: 'dining' }],
  ['un sandwich à midi 6 euros', { type: 'expense', amount: 6, categoryId: 'dining' }],
  ['dîner hier soir 60 euros', { type: 'expense', amount: 60, categoryId: 'dining', occurredAt: '2026-09-15' }],
  ['septante euros au resto', { type: 'expense', amount: 70, categoryId: 'dining' }],
  ['un McDo 11 euros', { type: 'expense', amount: 11, categoryId: 'dining' }],
  ["j'en ai eu pour 85 euros de courses", { type: 'expense', amount: 85, categoryId: 'groceries' }],
  ['courses chez Carrefour 85', { type: 'expense', amount: 85, categoryId: 'groceries' }],
  ['85 euros au Leclerc', { type: 'expense', amount: 85, categoryId: 'groceries' }],
  ['fait les courses, 62 euros', { type: 'expense', amount: 62, categoryId: 'groceries' }],
  ["j'ai fait des courses pour 120 euros", { type: 'expense', amount: 120, categoryId: 'groceries' }],
  ['Courses : 54,30 €', { type: 'expense', amount: 54.3, categoryId: 'groceries' }],
  ['Lidl 43 euros', { type: 'expense', amount: 43, categoryId: 'groceries' }],
  ["j'ai acheté du pain 1,20", { type: 'expense', amount: 1.2, categoryId: 'groceries' }],
  ['la boulangerie 4 euros', { type: 'expense', amount: 4, categoryId: 'groceries' }],
  ['courses 65 hier', { type: 'expense', amount: 65, categoryId: 'groceries', occurredAt: '2026-09-15' }],
  ["j'ai payé nonante euros d'épicerie", { type: 'expense', amount: 90, categoryId: 'groceries' }],
  ["j'ai dépensé 40 piastres au dépanneur", { type: 'expense', amount: 40, categoryId: 'groceries' }],
  ['épicerie 32 piasses', { type: 'expense', amount: 32, categoryId: 'groceries' }],
  ["plein d'essence 70 euros", { type: 'expense', amount: 70, categoryId: 'transport' }],
  ["j'ai fait le plein pour 70", { type: 'expense', amount: 70, categoryId: 'transport' }],
  ["70 balles d'essence", { type: 'expense', amount: 70, categoryId: 'transport' }],
  ["j'ai mis 40 euros d'essence", { type: 'expense', amount: 40, categoryId: 'transport' }],
  ['le plein 70 euros', { type: 'expense', amount: 70, categoryId: 'transport' }],
  ['hier j\'ai dépensé 23 euros en Uber', { type: 'expense', amount: 23, categoryId: 'transport', occurredAt: '2026-09-15' }],
  ['ticket de métro 2,10', { type: 'expense', amount: 2.1, categoryId: 'transport' }],
  ['pass Navigo 86,40', { type: 'expense', amount: 86.4, categoryId: 'transport' }],
  ['taxi 25 euros', { type: 'expense', amount: 25, categoryId: 'transport' }],
  ['billet de train 45 euros', { type: 'expense', amount: 45, categoryId: 'transport' }],
  ['parking 6 euros', { type: 'expense', amount: 6, categoryId: 'transport' }],
  ["j'ai lâché 300 balles chez le garagiste", { type: 'expense', amount: 300, categoryId: 'transport' }],
  ['réparation de la voiture 300 euros', { type: 'expense', amount: 300, categoryId: 'transport' }],
  ["j'ai claqué 200 balles en fringues", { type: 'expense', amount: 200, categoryId: 'shopping' }],
  ["j'ai acheté des chaussures pour 80 euros", { type: 'expense', amount: 80, categoryId: 'shopping' }],
  ['je me suis fait plaisir, une robe à 60 euros', { type: 'expense', amount: 60, categoryId: 'shopping' }],
  ['je me suis offert un jean à 60 euros', { type: 'expense', amount: 60, categoryId: 'shopping' }],
  ['commande Amazon 64 euros', { type: 'expense', amount: 64, categoryId: 'shopping' }],
  ['coiffeur 30 euros', { type: 'expense', amount: 30 }],
  ['le loyer 850', { type: 'expense', amount: 850, categoryId: 'rent' }],
  ["j'ai payé le loyer 850 euros", { type: 'expense', amount: 850, categoryId: 'rent' }],
  ["facture d'électricité 90 euros", { type: 'expense', amount: 90, categoryId: 'utilities' }],
  ['EDF 90 euros', { type: 'expense', amount: 90, categoryId: 'utilities' }],
  ['forfait téléphone 20 euros', { type: 'expense', amount: 20, categoryId: 'utilities' }],
  ['facture internet 30', { type: 'expense', amount: 30, categoryId: 'utilities' }],
  ['abonnement Netflix 13,49', { type: 'expense', amount: 13.49, categoryId: 'subscriptions' }],
  ['Spotify 10,99', { type: 'expense', amount: 10.99, categoryId: 'subscriptions' }],
  ["Netflix m'a prélevé 13,49", { type: 'expense', amount: 13.49, categoryId: 'subscriptions' }],
  ['pharmacie 15 euros', { type: 'expense', amount: 15, categoryId: 'health' }],
  ['consultation chez le médecin 25 euros', { type: 'expense', amount: 25, categoryId: 'health' }],
  ['dentiste 60', { type: 'expense', amount: 60, categoryId: 'health' }],
  ['ciné 12 euros', { type: 'expense', amount: 12, categoryId: 'entertainment' }],
  ['deux places de cinéma 24 euros', { type: 'expense', amount: 24, categoryId: 'entertainment' }],
  ['concert 45 balles', { type: 'expense', amount: 45, categoryId: 'entertainment' }],
  ["j'ai payé ma carte de crédit 200", { type: 'expense', amount: 200, categoryId: 'debt' }],
  ['mensualité du crédit auto 250', { type: 'expense', amount: 250, categoryId: 'debt' }],
  ['remboursement du prêt 300', { type: 'expense', amount: 300, categoryId: 'debt' }],
  ["j'ai retiré 50 euros au distributeur", { type: 'expense', amount: 50, categoryId: 'other_expense' }],
];

const income: Case[] = [
  ["j'ai été payé 2400", { kind: 'transaction', type: 'income', amount: 2400, categoryId: 'salary' }],
  ["j'ai été payée 2400", { type: 'income', amount: 2400, categoryId: 'salary' }],
  ["j'ai touché mon salaire 2400", { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['la paie est tombée, 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['le salaire est tombé 2400 euros', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['salaire 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['virement du salaire 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ["j'ai reçu ma paie, 2400", { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['ma paye 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['prime de 500 euros', { type: 'income', amount: 500 }],
  ["j'ai gagné 300 euros en freelance", { type: 'income', amount: 300, categoryId: 'freelance' }],
  ["une mission freelance m'a rapporté 300", { type: 'income', amount: 300, categoryId: 'freelance' }],
  ["un client m'a payé 300 euros", { type: 'income', amount: 300, categoryId: 'freelance' }],
  ["j'ai vendu mon vélo 150 euros", { type: 'income', amount: 150 }],
  ['vendu un truc sur Vinted 25 euros', { type: 'income', amount: 25 }],
  ["ma mère m'a donné 100 euros", { type: 'income', amount: 100, categoryId: 'gift_income' }],
  ["j'ai reçu 100 euros de ma mère", { type: 'income', amount: 100, categoryId: 'gift_income' }],
  ["on m'a offert 100 euros pour mon anniversaire", { type: 'income', amount: 100, categoryId: 'gift_income' }],
  ['100 euros pour mon anniversaire', { type: 'income', amount: 100, categoryId: 'gift_income' }],
  ["Amazon m'a remboursé 30 euros", { type: 'income', amount: 30 }],
  ['remboursement de la Sécu 25 euros', { type: 'income', amount: 25, categoryId: 'other_income' }],
  ["Paul m'a remboursé 40", { type: 'income', amount: 40 }],
  ["Paul m'a fait un virement de 40 euros", { type: 'income', amount: 40 }],
  ["Julie m'a envoyé 40 euros sur Lydia", { type: 'income', amount: 40 }],
  ["j'ai encaissé un chèque de 200", { type: 'income', amount: 200 }],
  ['pourboires 85 ce soir', { type: 'income', amount: 85 }],
  ["j'ai eu 85 euros de pourboires", { type: 'income', amount: 85 }],
  ["remboursement d'impôts 900", { type: 'income', amount: 900 }],
  ['les APL 250', { type: 'income', amount: 250 }],
  ['chômage 1100', { type: 'income', amount: 1100 }],
];

const spent = (q: Record<string, unknown>) => ({ kind: 'question', type: 'expense', question: { ask: 'spent', type: 'expense', ...q } });
const spendingQuestions: Case[] = [
  ["combien j'ai dépensé en café", spent({ target: 'Café', fallbackCategoryId: 'dining' })],
  ["combien j'ai dépensé en café cette semaine", spent({ target: 'Café', period: 'week' })],
  ['Combien ai-je dépensé ce mois-ci ?', spent({ target: null, period: 'month' })],
  ["qu'est-ce que j'ai dépensé hier", spent({ target: null, period: 'yesterday' })],
  ["ça m'a coûté combien, les courses ce mois-ci ?", spent({ categoryId: 'groceries', period: 'month' })],
  ["combien m'ont coûté les courses ce mois-ci", spent({ categoryId: 'groceries', period: 'month' })],
  ['combien en café cette semaine', spent({ target: 'Café', period: 'week' })],
  ['total des courses ce mois-ci', spent({ categoryId: 'groceries', period: 'month' })],
  ['mes dépenses en restaurants ce mois-ci', spent({ categoryId: 'dining', period: 'month' })],
  ['mes dépenses en resto', spent({ target: 'Resto', fallbackCategoryId: 'dining' })],
  ["combien j'ai claqué en fringues", spent({ target: 'Fringues', fallbackCategoryId: 'shopping' })],
  ["combien j'ai dépensé chez Starbucks", spent({ target: 'Starbucks' })],
  ['combien on a dépensé en courses le mois dernier', spent({ categoryId: 'groceries', period: 'lastMonth' })],
  ["combien j'ai dépensé aujourd'hui", spent({ target: null, period: 'today' })],
  ["j'ai dépensé combien cette semaine ?", spent({ target: null, period: 'week' })],
  ["j'ai dépensé combien en essence ce mois-ci", spent({ target: 'Essence', period: 'month', fallbackCategoryId: 'transport' })],
  ['combien je dépense en café', spent({ target: 'Café' })],
  ["combien d'argent j'ai dépensé la semaine dernière", spent({ target: null, period: 'lastWeek' })],
  ['combien est parti en courses', spent({ categoryId: 'groceries' })],
  ["combien j'ai dépensé en bouffe", spent({ categoryIds: ['groceries', 'dining'] })],
  ["combien j'ai dépensé pour manger ce mois-ci", spent({ categoryIds: ['groceries', 'dining'], period: 'month' })],
  ["combien j'ai dépensé depuis la paie", spent({ target: null, period: 'budget' })],
  ["combien j'ai dépensé cette période de paie", spent({ target: null, period: 'budget' })],
  ["combien j'ai dépensé depuis que j'ai été payé", spent({ target: null, period: 'budget' })],
  ['dépenses en essence cette semaine', spent({ target: 'Essence', period: 'week' })],
  ['total café ce mois-ci', spent({ target: 'Café', period: 'month' })],
  ['combien en Uber ce mois-ci', spent({ target: 'Uber', period: 'month' })],
  ["c'est quoi mes dépenses ce mois-ci", spent({ target: null, period: 'month' })],
  ["combien j'ai dépensé en tout", spent({ target: null, period: 'all' })],
  ["combien j'ai dépensé cette année", spent({ target: null, period: 'year' })],
  ["combien j'ai mis dans les restos", spent({ target: 'Restos', fallbackCategoryId: 'dining' })],
  ["combien j'ai dépensé au dépanneur", spent({ target: 'Dépanneur' })],
  ["combien tu as dépensé en Uber ce mois-ci", spent({ target: 'Uber', period: 'month' })],
  ["combien ça me coûte, Netflix", spent({ target: 'Netflix', fallbackCategoryId: 'subscriptions' })],
  ["combien j'ai dépensé en loisirs ce mois-ci", spent({ categoryId: 'entertainment', period: 'month' })],
];

const left = (q: Record<string, unknown>) => ({ kind: 'question', question: { ask: 'left', period: 'budget', ...q } });
const leftQuestions: Case[] = [
  ['combien il me reste', left({ target: null })],
  ['il me reste combien ?', left({ target: null })],
  ['il me reste combien pour les courses', left({ categoryId: 'groceries' })],
  ['combien il me reste pour les restaurants', left({ categoryId: 'dining' })],
  ['je peux encore dépenser combien ?', left({ target: null })],
  ['combien je peux encore dépenser', left({ target: null })],
  ["combien je peux dépenser aujourd'hui", left({ target: null })],
  ["où j'en suis avec mon budget", left({ target: null })],
  ["où j'en suis pour les courses", left({ categoryId: 'groceries' })],
  ['je suis dans mon budget ?', left({ target: null })],
  ['est-ce que je suis dans le budget pour les restaurants', left({ categoryId: 'dining' })],
  ["qu'est-ce qu'il me reste à dépenser", left({ target: null })],
  ["il me reste combien jusqu'à la paie", left({ target: null })],
  ["combien d'argent il me reste", left({ target: null })],
  ['il reste combien dans le budget courses', left({ categoryId: 'groceries' })],
  ["c'est quoi mon solde", left({ target: null })],
  ['combien me reste-t-il', left({ target: null })],
  ["est-ce qu'il me reste de l'argent pour les restaurants", left({ categoryId: 'dining' })],
  ['combien je peux encore dépenser en courses', left({ categoryId: 'groceries' })],
  ['combien il me reste pour la bouffe', left({ categoryIds: ['groceries', 'dining'] })],
];

const inc = (q: Record<string, unknown>) => ({ kind: 'question', type: 'income', question: { type: 'income', ...q } });
const incomeQuestions: Case[] = [
  ["combien j'ai gagné ce mois-ci", inc({ period: 'month' })],
  ["combien j'ai touché le mois dernier", inc({ period: 'lastMonth' })],
  ["qu'est-ce que j'ai gagné cette année", inc({ period: 'year' })],
  ['combien est rentré cette semaine', inc({ period: 'week' })],
  ["combien j'ai reçu ce mois-ci", inc({ period: 'month' })],
  ["c'est quoi mes revenus ce mois-ci", inc({ period: 'month' })],
  ["combien j'ai gagné en freelance cette année", inc({ period: 'year' })],
  ["j'ai gagné combien ce mois-ci", inc({ period: 'month' })],
  ["combien d'argent est rentré ce mois-ci", inc({ period: 'month' })],
];

const goals: Case[] = [
  ['je veux économiser 3000 euros pour un voyage', { kind: 'goal', amount: 3000, goalKind: 'saving' }],
  ['objectif : 3000 euros pour le Japon', { kind: 'goal', amount: 3000 }],
  ['objectif de 3000 pour le Japon', { kind: 'goal', amount: 3000 }],
  ['je voudrais mettre de côté 1000 euros pour les imprévus', { kind: 'goal', amount: 1000 }],
  ["mettre 1000 euros de côté pour un fonds d'urgence", { kind: 'goal', amount: 1000 }],
  ['nouvel objectif : 1200 pour un ordi', { kind: 'goal', amount: 1200 }],
  ['je dois économiser 500 pour Noël', { kind: 'goal', amount: 500 }],
  ["j'aimerais épargner 2000 pour les vacances", { kind: 'goal', amount: 2000 }],
  ['aide-moi à économiser 2000 pour des vacances', { kind: 'goal', amount: 2000 }],
  ["on veut économiser 10000 pour l'apport", { kind: 'goal', amount: 10000 }],
  ["je mets de l'argent de côté pour une voiture, 5000", { kind: 'goal', amount: 5000, goalKind: 'saving' }],
  ['je veux rembourser ma carte de crédit, 2000 euros', { kind: 'goal', amount: 2000, goalKind: 'debt' }],
  ['rembourser ma Visa 2000', { kind: 'goal', amount: 2000, goalKind: 'debt' }],
  ['je dois 2000 sur ma Visa', { kind: 'goal', amount: 2000, goalKind: 'debt' }],
  ['il me reste 5000 à rembourser sur mon prêt étudiant', { kind: 'goal', amount: 5000, goalKind: 'debt' }],
  ['solder mon découvert de 800 euros', { kind: 'goal', amount: 800, goalKind: 'debt' }],
  ['objectif : rembourser 3000 de prêt', { kind: 'goal', amount: 3000, goalKind: 'debt' }],
];

const reminders: Case[] = [
  ['rappelle-moi de payer le loyer le 1er', { kind: 'reminder' }],
  ['fais-moi penser à payer le loyer le 1er', { kind: 'reminder' }],
  ["n'oublie pas de me rappeler de payer EDF vendredi", { kind: 'reminder' }],
  ['mets un rappel pour payer la carte le 15', { kind: 'reminder' }],
  ["rappel : payer la facture d'eau le 15", { kind: 'reminder' }],
  ['rappelle-moi tous les vendredis de noter mes tickets', { kind: 'reminder' }],
  ['rappelle-moi demain à 9h de vérifier le budget', { kind: 'reminder' }],
  ['pense à me rappeler de payer le loyer', { kind: 'reminder' }],
  ['faut que je pense à payer le loyer lundi', { kind: 'reminder' }],
  ["n'oublie pas : payer le loyer le 1er", { kind: 'reminder' }],
  ["préviens-moi lundi pour l'assurance", { kind: 'reminder' }],
  ['rappelle-moi chaque mois de payer le loyer', { kind: 'reminder' }],
  ["tu peux me rappeler d'appeler la banque demain", { kind: 'reminder' }],
  ['programme un rappel pour vendredi : payer la cantine', { kind: 'reminder' }],
  ['envoie-moi une notif demain pour le loyer', { kind: 'reminder' }],
  ["rappelle-moi de vérifier combien j'ai dépensé", { kind: 'reminder' }],
];

describe('French: expenses', () => runCases('fr', expenses, LABELS));
describe('French: income', () => runCases('fr', income, LABELS));
describe('French: spending questions', () => runCases('fr', spendingQuestions, LABELS));
describe('French: what is left', () => runCases('fr', leftQuestions, LABELS));
describe('French: income questions', () => runCases('fr', incomeQuestions, LABELS));
describe('French: goals', () => runCases('fr', goals, LABELS));
describe('French: reminders', () => runCases('fr', reminders, LABELS));

// A French speaker names the goal in French; the harness goal is in English.
const FR_GOALS = [
  { id: 'g1', name: 'Voyage au Japon', kind: 'saving', targetAmount: 3000, savedAmount: 0, targetDate: null, completed: false, createdAt: '2026-01-01' },
] as unknown as Goal[];
const contributions: Case[] = [
  ["j'ai mis 100 euros pour le Japon", { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['mis de côté 100 pour le voyage au Japon', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ["j'ai mis 50 balles de côté pour le Japon", { kind: 'contribution', amount: 50, goalId: 'g1' }],
  ["j'ai économisé 100 pour le voyage", { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ["j'ai viré 100 sur l'épargne Japon", { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ["j'ai versé 100 euros sur le compte Japon", { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ["ajouté 100 à l'objectif Japon", { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['100 dans la cagnotte Japon', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['100 de plus dans la tirelire Japon', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ["j'ai transféré 200 vers le voyage au Japon", { kind: 'contribution', amount: 200, goalId: 'g1' }],
  ['je mets 100 pour le Japon', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['encore 100 euros mis de côté pour le Japon', { kind: 'contribution', amount: 100, goalId: 'g1' }],
];
describe('French: paying into a goal', () => {
  it.each(contributions)('%s', (text, expected) => {
    const r = parseOne(text, 'fr', LABELS, FR_GOALS);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject(expected);
  });
});

/** Fixing the last entry by voice. Only the new value may follow the lead; anything else is a new entry. */
const fix = (c: Record<string, unknown>) => ({ kind: 'correction', correction: { remove: false, ...c } });
const removeIt = { kind: 'correction', correction: { remove: true } };
const corrections: Case[] = [
  ["en fait c'était 14", fix({ amount: 14, categoryId: null, date: null })],
  ['en fait 14', fix({ amount: 14 })],
  ["en fait, c'était 14 euros", fix({ amount: 14 })],
  ['en vrai c\'est 14', fix({ amount: 14 })],
  ['finalement c\'était 14,50', fix({ amount: 14.5 })],
  ['non, 14', fix({ amount: 14 })],
  ['non 14 euros', fix({ amount: 14 })],
  ['pardon, 14', fix({ amount: 14 })],
  ['oups, 14', fix({ amount: 14 })],
  ['désolé, 14 balles', fix({ amount: 14 })],
  ["non, c'était 14", fix({ amount: 14 })],
  ["non c'est 14", fix({ amount: 14 })],
  ['mets plutôt 14', fix({ amount: 14 })],
  ['mets-le plutôt à 14', fix({ amount: 14 })],
  ['change en 14', fix({ amount: 14 })],
  ['change ça en 14', fix({ amount: 14 })],
  ['change le montant en 14', fix({ amount: 14 })],
  ['corrige à 14', fix({ amount: 14 })],
  ['remplace par 14', fix({ amount: 14 })],
  ['modifie le montant : 14', fix({ amount: 14 })],
  ['je voulais dire 15', fix({ amount: 15 })],
  ['euh je voulais dire quinze', fix({ amount: 15 })],
  ['plutôt 14', fix({ amount: 14 })],
  ['non, plutôt 14', fix({ amount: 14 })],
  ["ça aurait dû être 20", fix({ amount: 20 })],
  ['le montant c\'est 14', fix({ amount: 14 })],
  ['le bon montant est 14', fix({ amount: 14 })],
  ['mets-le dans courses', fix({ categoryId: 'groceries', amount: null })],
  ['mets-la dans les courses', fix({ categoryId: 'groceries' })],
  ['mets ça en restaurants', fix({ categoryId: 'dining' })],
  ['range ça dans les loisirs', fix({ categoryId: 'entertainment' })],
  ['classe-le en shopping', fix({ categoryId: 'shopping' })],
  ['change la catégorie en transports', fix({ categoryId: 'transport' })],
  ['change-le en courses', fix({ categoryId: 'groceries' })],
  ['mets plutôt dans resto', fix({ categoryId: 'dining' })],
  ["en fait c'était au resto", fix({ categoryId: 'dining' })],
  ['c\'était hier', fix({ date: '2026-09-15', amount: null })],
  ["en fait c'était hier", fix({ date: '2026-09-15' })],
  ["non c'était avant-hier", fix({ date: '2026-09-14' })],
  ["c'était lundi", fix({ date: '2026-09-14' })],
  ['change la date en hier', fix({ date: '2026-09-15' })],
  ['change ça en 14 et courses', fix({ amount: 14, categoryId: 'groceries' })],
  ["en fait c'était 12 au resto", fix({ amount: 12, categoryId: 'dining' })],
  ['supprime ça', removeIt],
  ['supprime', removeIt],
  ['efface le dernier', removeIt],
  ['efface la dernière', removeIt],
  ['annule ça', removeIt],
  ['annule', removeIt],
  ['annule-le', removeIt],
  ['oublie ça', removeIt],
  ['laisse tomber', removeIt],
  ['laissez tomber', removeIt],
  ['enlève la dernière dépense', removeIt],
  ['enleve ça', removeIt],
  ['retire le dernier achat', removeIt],
  ['supprime ma dernière dépense', removeIt],
  ['efface-moi ça', removeIt],
  ['oups, supprime ça', removeIt],
  ['non non, efface ça stp', removeIt],
  ['supprime cette dépense', removeIt],
  ['annule ce que je viens de dire', removeIt],
  ['vire ça', removeIt],
  ['Supprime ça !', removeIt],
  ['laisse faire', removeIt],
  ['change ça pour l\'épicerie', fix({ categoryId: 'groceries' })],
  ["mets-le dans l'épicerie", fix({ categoryId: 'groceries' })],
  ['corrige : 14', fix({ amount: 14 })],
  ["je me suis trompé, c'était 14", fix({ amount: 14 })],
  ['je me suis trompée, mets-le dans courses', fix({ categoryId: 'groceries' })],
  ['non, septante', fix({ amount: 70 })],
  ["c'était le 3", fix({ date: '2026-09-03' })],
  ["c'était la semaine dernière", fix({ date: '2026-09-09' })],
];

/** Sentences that sound a little like a correction but are new entries. */
const notCorrections: Case[] = [
  ["en fait j'ai dépensé 14 au resto", { kind: 'transaction', amount: 14, categoryId: 'dining' }],
  ["en fait j'ai payé 30 d'essence", { kind: 'transaction', amount: 30, categoryId: 'transport' }],
  ["c'était 12 pour le déjeuner", { kind: 'transaction', amount: 12, categoryId: 'dining' }],
  ["c'est 40 d'essence", { kind: 'transaction', amount: 40 }],
  ['annule Netflix 15,99', { kind: 'transaction', amount: 15.99 }],
  ['retiré 50 au distributeur', { kind: 'transaction', amount: 50 }],
  ['mets 100 pour le Japon', { kind: 'transaction', amount: 100 }],
  ['changement de pneus 300', { kind: 'transaction', amount: 300, categoryId: 'transport' }],
  ['non merci 12 le café', { kind: 'transaction', amount: 12 }],
  ["finalement j'ai acheté une veste 80", { kind: 'transaction', amount: 80, categoryId: 'shopping' }],
];

describe('French: corrections', () => runCases('fr', corrections, LABELS));
describe('French: sentences that are not corrections', () => runCases('fr', notCorrections, LABELS));

/** Comparing with last time, where most went, and whether something fits. */
const ask = (q: Record<string, unknown>) => ({ kind: 'question', question: { type: 'expense', ...q } });
const insights: Case[] = [
  // comparing
  ["est-ce que j'ai dépensé plus que le mois dernier ?", ask({ ask: 'compare', period: 'month', target: null })],
  ["j'ai dépensé plus que le mois dernier ?", ask({ ask: 'compare', period: 'month', target: null })],
  ["j'ai plus dépensé que le mois dernier", ask({ ask: 'compare', period: 'month', target: null })],
  ['je dépense plus ou moins que la semaine dernière ?', ask({ ask: 'compare', period: 'week', target: null })],
  ["par rapport au mois dernier, j'en suis où ?", ask({ ask: 'compare', period: 'month', target: null })],
  ['je dépense plus au resto que le mois dernier ?', ask({ ask: 'compare', period: 'month', target: 'Resto', fallbackCategoryId: 'dining' })],
  ["est-ce que j'ai dépensé moins en courses que le mois dernier", ask({ ask: 'compare', period: 'month', categoryId: 'groceries' })],
  ['je dépense plus que d\'habitude en courses ?', ask({ ask: 'compare', categoryId: 'groceries', period: 'month', periodDefaulted: true })],
  ['on dépense plus que la semaine dernière ?', ask({ ask: 'compare', period: 'week', target: null })],
  ["t'as dépensé plus que l'an dernier ?", ask({ ask: 'compare', period: 'year', target: null })],
  ["j'ai dépensé moins que l'année dernière", ask({ ask: 'compare', period: 'year', target: null })],
  ['ce mois-ci par rapport au mois dernier', ask({ ask: 'compare', period: 'month', target: null })],
  ['comment ce mois-ci se compare au mois dernier', ask({ ask: 'compare', period: 'month' })],
  ["mes dépenses sont en hausse ce mois-ci ?", ask({ ask: 'compare', period: 'month', target: null })],
  ['mes dépenses ont baissé cette semaine ?', ask({ ask: 'compare', period: 'week', target: null })],
  ['combien de plus j\'ai dépensé cette semaine que la semaine dernière', ask({ ask: 'compare', period: 'week', target: null })],
  ['est-ce que je dépense plus qu\'avant', ask({ ask: 'compare', target: null })],
  ['combien j\'ai dépensé en restaurants par rapport au mois dernier', ask({ ask: 'compare', period: 'month', categoryId: 'dining' })],
  ['plus ou moins que le mois dernier ?', ask({ ask: 'compare', period: 'month', target: null })],
  ["comparé au mois dernier, j'ai dépensé plus ?", ask({ ask: 'compare', period: 'month', target: null })],
  ['est-ce que je claque plus que le mois dernier en fringues', ask({ ask: 'compare', period: 'month', target: 'Fringues', fallbackCategoryId: 'shopping' })],
  // where most went
  ["où est passé la plupart de mon argent ?", ask({ ask: 'top', target: null })],
  ["où est passée la plupart de mon argent ce mois-ci", ask({ ask: 'top', period: 'month', target: null })],
  ['où est passé mon argent le mois dernier', ask({ ask: 'top', period: 'lastMonth', target: null })],
  ['où est parti tout mon argent', ask({ ask: 'top', target: null })],
  ['où va mon argent', ask({ ask: 'top', target: null })],
  ["dans quoi j'ai le plus dépensé ?", ask({ ask: 'top', target: null })],
  ["dans quoi j'ai le plus dépensé cette semaine", ask({ ask: 'top', period: 'week', target: null })],
  ["en quoi j'ai dépensé le plus", ask({ ask: 'top', target: null })],
  ["c'est quoi ma plus grosse dépense ?", ask({ ask: 'top', target: null })],
  ['quelle est ma plus grosse dépense ce mois-ci', ask({ ask: 'top', period: 'month', target: null })],
  ['quel est mon plus gros poste de dépenses', ask({ ask: 'top', target: null })],
  ["c'est quoi mes plus grosses dépenses cette année", ask({ ask: 'top', period: 'year', target: null })],
  ['où je dépense le plus ce mois-ci ?', ask({ ask: 'top', period: 'month', target: null })],
  ["où est-ce que je dépense le plus", ask({ ask: 'top', target: null })],
  ["où j'ai le plus dépensé la semaine dernière", ask({ ask: 'top', period: 'lastWeek', target: null })],
  ["où on dépense le plus", ask({ ask: 'top', target: null })],
  ["qu'est-ce qui me coûte le plus ?", ask({ ask: 'top', target: null })],
  ['sur quoi je dépense le plus', ask({ ask: 'top', target: null })],
  ['où est passé mon fric', ask({ ask: 'top', target: null })],
  ['où est passée ma paie', ask({ ask: 'top', target: null })],
  ["dans quelle catégorie j'ai le plus dépensé", ask({ ask: 'top', target: null })],
  ["c'est quoi mon plus gros poste ce mois-ci", ask({ ask: 'top', period: 'month', target: null })],
  // can I afford it
  ['est-ce que je peux me permettre une veste à 200 ?', ask({ ask: 'afford', price: 200, period: 'budget', target: 'Veste', fallbackCategoryId: 'shopping' })],
  ['je peux me permettre une veste à 200 euros', ask({ ask: 'afford', price: 200, target: 'Veste' })],
  ['je peux dépenser 80 pour le resto ?', ask({ ask: 'afford', price: 80, target: 'Resto', fallbackCategoryId: 'dining' })],
  ["j'ai assez pour un ordi à 1200 ?", ask({ ask: 'afford', price: 1200, target: 'Ordi' })],
  ["c'est ok si je mets 50 en courses ?", ask({ ask: 'afford', price: 50, categoryId: 'groceries' })],
  ["est-ce que c'est raisonnable de dépenser 300 en shopping", ask({ ask: 'afford', price: 300, categoryId: 'shopping' })],
  ['je peux encore dépenser 40 en restaurants ?', ask({ ask: 'afford', price: 40, categoryId: 'dining' })],
  ["est-ce que je peux m'acheter des baskets à 120", ask({ ask: 'afford', price: 120, target: 'Baskets', fallbackCategoryId: 'shopping' })],
  ['je peux me payer un resto à 60 ce soir ?', ask({ ask: 'afford', price: 60, target: 'Resto' })],
  ["j'ai les moyens de m'acheter un vélo à 400 ?", ask({ ask: 'afford', price: 400, target: 'Vélo', fallbackCategoryId: 'transport' })],
  ["est-ce qu'il me reste assez pour un billet à 300", ask({ ask: 'afford', price: 300, target: 'Billet' })],
  ['puis-je dépenser cinquante euros en loisirs', ask({ ask: 'afford', price: 50, categoryId: 'entertainment' })],
  ['on peut se permettre un week-end à 500 ?', ask({ ask: 'afford', price: 500 })],
  ['80 balles au resto, ça passe ?', ask({ ask: 'afford', price: 80, target: 'Resto' })],
  ['est-ce que 100 euros de courses ça rentre dans le budget', ask({ ask: 'afford', price: 100, categoryId: 'groceries' })],
  ["t'as assez pour 30 d'essence ?", ask({ ask: 'afford', price: 30, target: 'Essence', fallbackCategoryId: 'transport' })],
  // the same leads without an amount ask what is left
  ['je peux me permettre un resto ?', ask({ ask: 'left', period: 'budget', target: 'Resto' })],
  ["est-ce que je peux m'acheter des chaussures", ask({ ask: 'left', period: 'budget' })],
  ["j'ai assez pour les courses ?", ask({ ask: 'left', categoryId: 'groceries' })],
  ['combien je peux mettre au resto', ask({ ask: 'left', target: 'Resto' })],
  // a leading "en fait" or "bon" is not part of what is asked about
  ["en fait, combien j'ai dépensé en café", ask({ ask: 'spent', target: 'Café' })],
  ['en fait il me reste combien', ask({ ask: 'left', target: null })],
  ['bon, combien il me reste', ask({ ask: 'left', target: null })],
];

/** Entries near those words stay entries. */
const insightsStayEntries: Case[] = [
  ['acheté une veste à 200', { kind: 'transaction', amount: 200, categoryId: 'shopping' }],
  ['encore un café 4', { kind: 'transaction', amount: 4, categoryId: 'dining' }],
  ["j'ai dépensé 200 pour une veste", { kind: 'transaction', amount: 200, categoryId: 'shopping' }],
  ['un café de plus 3', { kind: 'transaction', amount: 3, categoryId: 'dining' }],
  ['le plus gros resto du monde 80', { kind: 'transaction', amount: 80 }],
  ["j'ai mis 50 en courses", { kind: 'transaction', amount: 50, categoryId: 'groceries' }],
  ['plus 12 de pain', { kind: 'transaction', amount: 12 }],
  ["j'ai dépensé plus de 60 au resto", { kind: 'transaction', amount: 60, categoryId: 'dining' }],
  ['courses 40 moins que prévu', { kind: 'transaction', amount: 40 }],
  ['bon, 12 au resto', { kind: 'transaction', amount: 12, categoryId: 'dining' }],
  ['efface tout', { kind: 'transaction' }],
];

describe('French: comparing, the most, affording', () => runCases('fr', insights, LABELS));
describe('French: entries near those words stay entries', () => runCases('fr', insightsStayEntries, LABELS));

/** Putting money aside: a transfer to savings, a payment into a named goal, or a plan said as a pace. */
const settingAside: Case[] = [
  ["j'ai mis 200 de côté", { kind: 'transaction', type: 'expense', amount: 200, categoryId: 'savings' }],
  ["j'ai viré 300 sur le livret", { kind: 'transaction', amount: 300, categoryId: 'savings' }],
  ["j'ai épargné 50", { kind: 'transaction', type: 'expense', amount: 50, categoryId: 'savings' }],
  ['placé 100 sur le compte épargne', { kind: 'transaction', amount: 100, categoryId: 'savings' }],
  ["économisé 50 aujourd'hui", { kind: 'transaction', amount: 50, categoryId: 'savings', occurredAt: '2026-09-16' }],
  ["j'ai mis 50 sur mon livret A", { kind: 'transaction', amount: 50, categoryId: 'savings' }],
  ['versé 200 sur le PEL', { kind: 'transaction', amount: 200, categoryId: 'savings' }],
  ["j'ai rajouté 30 à l'épargne", { kind: 'transaction', amount: 30, categoryId: 'savings' }],
  ['mets 50 de côté', { kind: 'transaction', amount: 50, categoryId: 'savings' }],
  // an amount per month or week is a pace, so the card asks for the total
  ['je veux mettre 200 par mois de côté pour une voiture', { kind: 'goal', amount: null, goalName: 'Voiture', goalKind: 'saving' }],
  ['je mets 100 par mois de côté', { kind: 'goal', amount: null, goalName: null }],
  ['économiser 100 par mois pour Noël', { kind: 'goal', amount: null, goalName: 'Noël' }],
  ['mettre 50 par semaine de côté', { kind: 'goal', amount: null }],
  ['je veux économiser 150 par mois', { kind: 'goal', amount: null }],
];
describe('French: setting money aside', () => runCases('fr', settingAside, LABELS));

const moreContributions: Case[] = [
  ['mis de côté 100 pour le voyage', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ["j'ai rajouté 20 à la cagnotte Japon", { kind: 'contribution', amount: 20, goalId: 'g1' }],
  ["j'ai remis 50 dans la cagnotte Japon", { kind: 'contribution', amount: 50, goalId: 'g1' }],
  ["j'ai mis 100 de côté pour le Japon", { kind: 'contribution', amount: 100, goalId: 'g1' }],
];
describe('French: paying into a named goal, said differently', () => {
  it.each(moreContributions)('%s', (text, expected) => {
    const r = parseOne(text, 'fr', LABELS, FR_GOALS);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject(expected);
  });
});

/** Everyday spending, the way people actually say it (France, Québec, Belgium, Switzerland). */
const everydayExpenses: Case[] = [
  ["j'ai claqué 40", { kind: 'transaction', type: 'expense', amount: 40 }],
  ["j'ai lâché 200", { kind: 'transaction', type: 'expense', amount: 200 }],
  ["ça m'a coûté 60", { kind: 'transaction', type: 'expense', amount: 60, note: null }],
  ["j'en ai eu pour 30 au Carrefour", { type: 'expense', amount: 30, categoryId: 'groceries' }],
  ["j'ai fait le plein 50", { type: 'expense', amount: 50, categoryId: 'transport' }],
  ["j'ai pris un café 2", { type: 'expense', amount: 2, categoryId: 'dining' }],
  ['resto ce midi 15', { type: 'expense', amount: 15, categoryId: 'dining', occurredAt: '2026-09-16' }],
  ["j'ai payé l'électricité 80", { type: 'expense', amount: 80, categoryId: 'utilities' }],
  ['les courses 85', { type: 'expense', amount: 85, categoryId: 'groceries' }],
  ["l'essence 40", { type: 'expense', amount: 40, categoryId: 'transport' }],
  ['une bière 5', { type: 'expense', amount: 5, categoryId: 'dining' }],
  ["j'ai filé 20 au taxi", { type: 'expense', amount: 20, categoryId: 'transport' }],
  ["j'ai réglé le loyer 900", { type: 'expense', amount: 900, categoryId: 'rent' }],
  ['la cantine des enfants 60', { type: 'expense', amount: 60, categoryId: 'dining' }],
  ["j'ai dépensé 12 en bouffe", { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['le dentiste 70', { type: 'expense', amount: 70, categoryId: 'health' }],
  ["j'ai craqué pour des baskets 120", { type: 'expense', amount: 120, categoryId: 'shopping' }],
  ['le péage 8', { type: 'expense', amount: 8, categoryId: 'transport' }],
  ['parking 3', { type: 'expense', amount: 3, categoryId: 'transport' }],
  ['30 balles de clopes', { type: 'expense', amount: 30, categoryId: 'other_expense' }],
  ["l'assurance voiture 60", { type: 'expense', amount: 60, categoryId: 'transport' }],
  ["j'ai mis 10 dans le parcmètre", { type: 'expense', amount: 10, categoryId: 'transport' }],
  ['la salle de sport 30', { type: 'expense', amount: 30, categoryId: 'health' }],
  ["j'ai payé 15 de frais bancaires", { type: 'expense', amount: 15, categoryId: 'other_expense' }],
  ["j'ai prêté 50 à Marc", { type: 'expense', amount: 50, note: 'Marc' }],
  ['les impôts 300', { type: 'expense', amount: 300, categoryId: 'other_expense' }],
  ['la nounou 500', { type: 'expense', amount: 500, categoryId: 'other_expense' }],
  ['la crèche 400', { type: 'expense', amount: 400, categoryId: 'other_expense' }],
  ['le contrôle technique 85', { type: 'expense', amount: 85, categoryId: 'transport' }],
  ['50 euros de cadeau pour maman', { type: 'expense', amount: 50, categoryId: 'shopping' }],
  ["cadeau d'anniversaire pour Léa 40", { type: 'expense', amount: 40, categoryId: 'shopping' }],
  ["j'ai déboursé 300 pour le dentiste", { type: 'expense', amount: 300, categoryId: 'health' }],
  ["j'ai cramé 80 en soirée", { type: 'expense', amount: 80, categoryId: 'entertainment' }],
  ['petit déj 8', { type: 'expense', amount: 8, categoryId: 'dining' }],
  ['le véto 90', { type: 'expense', amount: 90, categoryId: 'health' }],
  ['des frites 4', { type: 'expense', amount: 4, categoryId: 'dining' }],
  ["j'ai mis 60 d'essence ce matin", { type: 'expense', amount: 60, categoryId: 'transport', occurredAt: '2026-09-16' }],
  ["le resto d'hier soir 48", { type: 'expense', amount: 48, categoryId: 'dining', occurredAt: '2026-09-15', note: 'Resto' }],
  // Québec
  ['une poutine 12', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['le dépanneur 15', { type: 'expense', amount: 15, categoryId: 'groceries' }],
  ["j'ai magasiné 120", { type: 'expense', amount: 120, categoryId: 'shopping' }],
  ['mon cellulaire 60', { type: 'expense', amount: 60, categoryId: 'utilities' }],
  ['épicerie 90 piasses', { type: 'expense', amount: 90, categoryId: 'groceries' }],
  ['le stationnement 8', { type: 'expense', amount: 8, categoryId: 'transport' }],
  ['souper au resto 45', { type: 'expense', amount: 45, categoryId: 'dining' }],
  ['un Tim Hortons 3', { type: 'expense', amount: 3, categoryId: 'dining' }],
  // Belgium and Switzerland
  ['nonante-cinq euros au Colruyt', { type: 'expense', amount: 95, categoryId: 'groceries' }],
  ["huitante francs d'essence", { type: 'expense', amount: 80, categoryId: 'transport' }],
  ["j'ai payé 45 francs le dîner", { type: 'expense', amount: 45, categoryId: 'dining' }],
  ['une pinte 4', { type: 'expense', amount: 4, categoryId: 'dining' }],
];
describe('French: everyday spending', () => runCases('fr', everydayExpenses, LABELS));

/** Money coming in; a paycheck with no amount is still a paycheck, so the card asks only for the number. */
const moreIncome: Case[] = [
  ["j'ai été payé", { kind: 'transaction', type: 'income', amount: null, categoryId: 'salary' }],
  ["j'ai touché ma paie 2400", { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['la paie est tombée', { kind: 'transaction', type: 'income', amount: null, categoryId: 'salary' }],
  ['virement de 2400', { type: 'income', amount: 2400 }],
  ["un client m'a payé 500", { type: 'income', amount: 500, categoryId: 'freelance' }],
  ['pourboires 85', { type: 'income', amount: 85, categoryId: 'freelance' }],
  ["j'ai vendu mon vélo 120", { type: 'income', amount: 120 }],
  ['remboursé 32', { type: 'income', amount: 32 }],
  ["mamie m'a donné 50", { type: 'income', amount: 50, categoryId: 'gift_income' }],
  ['la prime 1000', { type: 'income', amount: 1000, categoryId: 'other_income' }],
  ['les allocs 300', { type: 'income', amount: 300, categoryId: 'other_income' }],
  ['Pôle emploi 900', { type: 'income', amount: 900, categoryId: 'other_income' }],
  ["j'ai eu ma paie 2400", { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['le salaire est arrivé 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['mon chèque de paie 1800', { type: 'income', amount: 1800, categoryId: 'salary' }],
  ['treizième mois 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['virement de maman 50', { type: 'income', amount: 50 }],
  ["ma grand-mère m'a filé 30", { type: 'income', amount: 30, categoryId: 'gift_income' }],
  ["mon père m'a viré 200", { type: 'income', amount: 200, categoryId: 'gift_income' }],
  ['RSA 600', { type: 'income', amount: 600, categoryId: 'other_income' }],
  ['la CAF 180', { type: 'income', amount: 180, categoryId: 'other_income' }],
  ['ma bourse 450', { type: 'income', amount: 450, categoryId: 'other_income' }],
  ['ma retraite 1500', { type: 'income', amount: 1500, categoryId: 'other_income' }],
  ["j'ai touché le chômage 1100", { type: 'income', amount: 1100, categoryId: 'other_income' }],
  ["j'ai encaissé 150 de cours particuliers", { type: 'income', amount: 150, categoryId: 'freelance' }],
  ['vendu ma vieille télé 80 sur leboncoin', { type: 'income', amount: 80 }],
  ['cashback 5', { type: 'income', amount: 5, categoryId: 'other_income' }],
  ["on m'a remboursé 20", { type: 'income', amount: 20 }],
  ['je me suis fait rembourser 30 par la mutuelle', { type: 'income', amount: 30, note: 'Mutuelle' }],
  ["j'ai gagné 50 au loto", { type: 'income', amount: 50 }],
  ["j'ai touché 2400", { type: 'income', amount: 2400 }],
];
describe('French: money coming in, said differently', () => runCases('fr', moreIncome, LABELS));

/** More ways of asking. */
const moreQuestions: Case[] = [
  // spending
  ["j'ai dépensé combien aujourd'hui", spent({ target: null, period: 'today' })],
  ["combien j'ai dépensé hier", spent({ target: null, period: 'yesterday' })],
  ["j'ai dépensé quoi aujourd'hui", spent({ target: null, period: 'today' })],
  ["combien j'ai dépensé ces 7 derniers jours", spent({ target: null, period: 'recentDays', days: 7 })],
  ["combien j'ai dépensé depuis 10 jours", spent({ target: null, period: 'recentDays', days: 10 })],
  ["combien j'ai dépensé sur les 3 derniers jours", spent({ target: null, period: 'recentDays', days: 3 })],
  ["combien j'ai dépensé ce week-end", spent({ target: null, period: 'weekend' })],
  ["combien j'ai dépensé le week-end dernier", spent({ target: null, period: 'weekend' })],
  ['mes dépenses du week-end', spent({ target: null, period: 'weekend' })],
  ['mes dépenses de la semaine', spent({ target: null, period: 'week' })],
  ["combien j'ai dépensé en transports ce mois-ci", spent({ categoryId: 'transport', period: 'month' })],
  ["combien j'ai mis en santé", spent({ categoryId: 'health' })],
  ['combien je dépense en abonnements', spent({ categoryId: 'subscriptions' })],
  ["combien j'ai dépensé en loyer", spent({ categoryId: 'rent' })],
  ["j'ai payé combien de loyer cette année", spent({ categoryId: 'rent', period: 'year' })],
  ["combien j'ai dépensé au total en courses", spent({ categoryId: 'groceries', period: 'all' })],
  ['total essence', spent({ target: 'Essence', fallbackCategoryId: 'transport' })],
  ["ça m'a coûté combien le resto hier", spent({ target: 'Resto', period: 'yesterday', fallbackCategoryId: 'dining' })],
  ["combien ça m'a coûté en pharmacie", spent({ target: 'Pharmacie', fallbackCategoryId: 'health' })],
  ["combien j'ai dépensé pour les enfants ce mois-ci", spent({ target: 'Enfants', period: 'month', fallbackCategoryId: 'shopping' })],
  ['combien on a dépensé en vacances cette année', spent({ target: 'Vacances', period: 'year' })],
  ["combien j'ai mis chez Lidl ce mois-ci", spent({ target: 'Lidl', period: 'month', fallbackCategoryId: 'groceries' })],
  ["qu'est-ce que j'ai claqué cette semaine", spent({ target: null, period: 'week' })],
  ['je suis à combien ce mois-ci', spent({ target: null, period: 'month' })],
  // what is left
  ['il me reste quoi', left({ target: null })],
  ["combien j'ai encore", left({ target: null })],
  ['il me reste combien ce mois-ci', left({ target: null })],
  ['combien de thune il me reste', left({ target: null })],
  ['il reste quoi dans le budget resto', left({ target: 'Resto', fallbackCategoryId: 'dining' })],
  ["j'en suis où ce mois-ci", left({ target: null })],
  ['je peux encore claquer combien', left({ target: null })],
  // comparing
  ["je dépense plus que d'hab", ask({ ask: 'compare', target: null, periodDefaulted: true })],
  ["j'ai claqué plus que la semaine dernière ?", ask({ ask: 'compare', period: 'week', target: null })],
  ["c'est plus ou moins que le mois dernier", ask({ ask: 'compare', period: 'month', target: null })],
  ['est-ce que je dépense plus en courses que le mois dernier', ask({ ask: 'compare', period: 'month', categoryId: 'groceries' })],
  ["j'ai dépensé moins que la semaine dernière ?", ask({ ask: 'compare', period: 'week', target: null })],
  ['mes dépenses ont augmenté ce mois-ci ?', ask({ ask: 'compare', period: 'month', target: null })],
  ["je claque plus qu'avant ?", ask({ ask: 'compare', target: null })],
  // where most went
  ['où est passée ma thune', ask({ ask: 'top', target: null })],
  ['où va mon fric', ask({ ask: 'top', target: null })],
  ['où part mon argent', ask({ ask: 'top', target: null })],
  ['où est parti mon salaire ce mois-ci', ask({ ask: 'top', period: 'month', target: null })],
  ['ma plus grosse dépense', ask({ ask: 'top', target: null })],
  ['ma plus grosse dépense ce mois-ci', ask({ ask: 'top', period: 'month', target: null })],
  ['mon plus gros poste', ask({ ask: 'top', target: null })],
  ["qu'est-ce qui me bouffe le plus de budget", ask({ ask: 'top', target: null })],
  ['dans quoi je dépense le plus cette année', ask({ ask: 'top', period: 'year', target: null })],
  ["c'est quoi mon plus gros poste de dépense ce mois-ci", ask({ ask: 'top', period: 'month', target: null })],
  // affording
  ['je peux me permettre des chaussures à 80', ask({ ask: 'afford', price: 80, target: 'Chaussures', fallbackCategoryId: 'shopping' })],
  ["j'ai assez pour un ciné à 12 ?", ask({ ask: 'afford', price: 12, target: 'Ciné', fallbackCategoryId: 'entertainment' })],
  ['est-ce que je peux me permettre 50 de resto ce soir', ask({ ask: 'afford', price: 50, target: 'Resto' })],
  ['je peux mettre 300 dans un vélo ?', ask({ ask: 'afford', price: 300, target: 'Vélo', fallbackCategoryId: 'transport' })],
  ['on peut se payer un resto à 80 ?', ask({ ask: 'afford', price: 80, target: 'Resto' })],
  ["c'est raisonnable de mettre 150 en fringues", ask({ ask: 'afford', price: 150, target: 'Fringues', fallbackCategoryId: 'shopping' })],
  // income
  ["combien j'ai touché ce mois", inc({ period: 'month' })],
  ['combien je gagne ce mois-ci', inc({ period: 'month' })],
  ["combien j'ai encaissé cette semaine", inc({ period: 'week' })],
  ["qu'est-ce que j'ai touché le mois dernier", inc({ period: 'lastMonth' })],
  ['mes revenus du mois', inc({ period: 'month' })],
  ['combien est rentré depuis la paie', inc({ period: 'budget' })],
  ["j'ai gagné combien cette année en freelance", inc({ period: 'year', categoryId: 'freelance' })],
];
describe('French: more ways of asking', () => runCases('fr', moreQuestions, LABELS));

/** Fixing by voice, including an entry named by its words ("supprime le uber", "change le déjeuner à 15"). */
const named = (target: string, c: Record<string, unknown>) => ({ kind: 'correction', correction: { remove: false, target, ...c } });
const removeNamed = (target: string) => ({ kind: 'correction', correction: { remove: true, target } });
const moreCorrections: Case[] = [
  ["non c'était 14", fix({ amount: 14 })],
  ['mets-le en resto', fix({ categoryId: 'dining', amount: null })],
  ["c'était hier en fait", fix({ date: '2026-09-15', amount: null })],
  ["c'était 14 en fait", fix({ amount: 14 })],
  ['annule', removeIt],
  ['en fait non, 18', fix({ amount: 18 })],
  ["finalement c'était au resto", fix({ categoryId: 'dining' })],
  ["c'était ce matin", fix({ date: '2026-09-16' })],
  ['non, 14 balles', fix({ amount: 14 })],
  ["attends, c'était 14", fix({ amount: 14 })],
  ["je me suis planté, c'est 14", fix({ amount: 14 })],
  ['mets-le en transports', fix({ categoryId: 'transport' })],
  ['mets-la en santé', fix({ categoryId: 'health' })],
  ['déplace ça dans loisirs', fix({ categoryId: 'entertainment' })],
  ["en fait c'était 20 balles", fix({ amount: 20 })],
  ["non c'était mardi", fix({ date: '2026-09-15' })],
  ["c'était avant-hier", fix({ date: '2026-09-14' })],
  ["c'était le 10", fix({ date: '2026-09-10' })],
  ["c'est 14 plutôt", fix({ amount: 14 })],
  ['plutôt 14 balles', fix({ amount: 14 })],
  ['pas 12 mais 14', fix({ amount: 14 })],
  ['non pas 12, 14', fix({ amount: 14 })],
  ['oublie le dernier', removeIt],
  // a named entry
  ['supprime le uber', removeNamed('uber')],
  ['efface le café', removeNamed('café')],
  ["annule le resto d'hier", removeNamed('resto')],
  ['supprime le Spotify', removeNamed('spotify')],
  ["enlève les courses d'hier", removeNamed('courses')],
  ['oublie le café là', removeNamed('café')],
  ['enlève le resto', removeNamed('resto')],
  ['change le déjeuner à 15', named('déjeuner', { amount: 15 })],
  ['change le loyer à 950', named('loyer', { amount: 950 })],
  ['mets le uber à 32', named('uber', { amount: 32 })],
  ['passe le café en courses', named('café', { categoryId: 'groceries', amount: null })],
  ["le resto c'était 50 pas 45", named('resto', { amount: 50 })],
  ["le uber c'était 32 pas 23", named('uber', { amount: 32 })],
  ["le café c'était 3 en fait", named('café', { amount: 3 })],
  ["le uber c'est pas 23 c'est 32", named('uber', { amount: 32 })],
  ["la pharmacie c'était 12,40", named('pharmacie', { amount: 12.4 })],
  ["non le dentiste c'était 70", named('dentiste', { amount: 70 })],
  ["j'ai pas dépensé 23 en uber c'était 32", named('uber', { amount: 32 })],
  ["je n'ai pas payé 23 au resto mais 32", named('resto', { amount: 32 })],
];
describe('French: more corrections, and corrections that name their entry', () => runCases('fr', moreCorrections, LABELS));

/** More reminders, with the day, time and repeat they must carry. */
const moreReminders: Case[] = [
  ['rappelle-moi le loyer le 1er', { kind: 'reminder', occurredAt: '2026-10-01', reminderText: 'Le loyer' }],
  ["me rappeler la facture d'électricité vendredi", { kind: 'reminder', occurredAt: '2026-09-18', reminderText: "La facture d'électricité" }],
  ['préviens-moi à 20h pour noter les tickets', { kind: 'reminder', reminderTime: '20:00', reminderText: 'Noter les tickets' }],
  ['rappelle-moi tous les lundis de vérifier le budget', { kind: 'reminder', reminderRepeat: 'weekly', reminderText: 'Vérifier le budget' }],
  ['pense-bête : payer la cantine le 5', { kind: 'reminder', occurredAt: '2026-10-05', reminderText: 'Payer la cantine' }],
  ["faut que je pense à payer l'assurance jeudi", { kind: 'reminder', occurredAt: '2026-09-17' }],
  ['rappelle-moi le 15 de chaque mois de payer le crédit', { kind: 'reminder', reminderRepeat: 'monthly', reminderText: 'Payer le crédit' }],
  ['mets-moi un rappel demain matin pour le médecin', { kind: 'reminder', occurredAt: '2026-09-17', reminderTime: '08:00', reminderText: 'Le médecin' }],
  ['rappelle-moi ce soir de noter mes dépenses', { kind: 'reminder', reminderTime: '19:00', reminderText: 'Noter mes dépenses' }],
  ['un rappel pour le loyer le 1er', { kind: 'reminder', occurredAt: '2026-10-01', reminderText: 'Le loyer' }],
  ['rappelle-moi dans 3 jours de payer la facture', { kind: 'reminder', occurredAt: '2026-09-19' }],
  ["rappelle-moi vendredi prochain d'appeler l'assurance", { kind: 'reminder', occurredAt: '2026-09-18', reminderText: "Appeler l'assurance" }],
  ["n'oublie pas la facture d'eau le 20", { kind: 'reminder', occurredAt: '2026-09-20', reminderText: "La facture d'eau" }],
  ['rappelle-moi chaque semaine de faire mes comptes', { kind: 'reminder', reminderRepeat: 'weekly' }],
  ['il faut que je pense à résilier Netflix avant le 30', { kind: 'reminder', occurredAt: '2026-09-30', reminderText: 'Résilier Netflix' }],
  ['notifie-moi lundi matin pour les impôts', { kind: 'reminder', occurredAt: '2026-09-21', reminderTime: '08:00', reminderText: 'Les impôts' }],
  ['rappelle-moi tous les jours à 21h de noter mes dépenses', { kind: 'reminder', reminderRepeat: 'daily', reminderTime: '21:00' }],
  ['rappelle-moi tous les soirs de noter mes tickets', { kind: 'reminder', reminderRepeat: 'daily', reminderTime: '20:00' }],
  ['rappelle-moi dimanche de faire les comptes', { kind: 'reminder', occurredAt: '2026-09-20' }],
  ['peux-tu me rappeler de payer la mutuelle le 5', { kind: 'reminder', occurredAt: '2026-10-05', reminderText: 'Payer la mutuelle' }],
  ['fais-moi penser à la cotisation du club mercredi', { kind: 'reminder', reminderText: 'La cotisation du club' }],
  ['rappelle-moi de payer le loyer', { kind: 'reminder', reminderText: 'Payer le loyer' }],
  ['rappelle-moi demain à 9h de payer EDF', { kind: 'reminder', occurredAt: '2026-09-17', reminderTime: '09:00', reminderText: 'Payer EDF' }],
  ["rappelle-moi à 18h30 d'appeler la banque", { kind: 'reminder', reminderTime: '18:30', reminderText: 'Appeler la banque' }],
  ['rappelle-moi le 3 octobre de payer la taxe foncière', { kind: 'reminder', occurredAt: '2026-10-03' }],
  ['rappelle-moi demain soir de payer le loyer', { kind: 'reminder', occurredAt: '2026-09-17', reminderTime: '19:00', reminderText: 'Payer le loyer' }],
  ['rappelle-moi le 1er à 10h de payer le loyer', { kind: 'reminder', occurredAt: '2026-10-01', reminderTime: '10:00' }],
];
describe('French: more reminders', () => runCases('fr', moreReminders, LABELS));

/** Numbers as dictation writes them, and counts before the money ("deux cafés 8"). */
const dictation: Case[] = [
  ['quatre cinquante le café', { type: 'expense', amount: 4.5, categoryId: 'dining' }],
  ['café 4 50', { type: 'expense', amount: 4.5, categoryId: 'dining' }],
  ['vingt balles de courses', { type: 'expense', amount: 20, categoryId: 'groceries' }],
  ['cent euros de courses', { type: 'expense', amount: 100, categoryId: 'groceries' }],
  ['mille deux cents de loyer', { type: 'expense', amount: 1200, categoryId: 'rent' }],
  ['mille cinq cents de loyer', { type: 'expense', amount: 1500, categoryId: 'rent' }],
  ['12 euros 50 le déjeuner', { type: 'expense', amount: 12.5, categoryId: 'dining' }],
  ['12,50 le déjeuner', { type: 'expense', amount: 12.5, categoryId: 'dining' }],
  ['trois euros cinquante le café', { type: 'expense', amount: 3.5, categoryId: 'dining' }],
  ['quatre euros vingt le pain', { type: 'expense', amount: 4.2, categoryId: 'groceries' }],
  ['cinq et demi le café', { type: 'expense', amount: 5.5, categoryId: 'dining' }],
  ['quinze euros le kebab', { type: 'expense', amount: 15, categoryId: 'dining' }],
  ['dix-huit euros le kebab', { type: 'expense', amount: 18, categoryId: 'dining' }],
  ['vingt et un euros de livres', { type: 'expense', amount: 21 }],
  ["soixante-quinze balles d'essence", { type: 'expense', amount: 75, categoryId: 'transport' }],
  ['quatre-vingt-dix euros de courses', { type: 'expense', amount: 90, categoryId: 'groceries' }],
  ['deux cent cinquante de crédit', { type: 'expense', amount: 250, categoryId: 'debt' }],
  ['nonante-cinq le plein', { type: 'expense', amount: 95, categoryId: 'transport' }],
  ['septante-deux balles de courses', { type: 'expense', amount: 72, categoryId: 'groceries' }],
  ['cinquante balles de courses', { type: 'expense', amount: 50, categoryId: 'groceries' }],
  // a round figure said as one
  ['une centaine de courses', { type: 'expense', amount: 100, categoryId: 'groceries' }],
  ["une vingtaine de balles d'essence", { type: 'expense', amount: 20, categoryId: 'transport' }],
  ['un millier de loyer', { type: 'expense', amount: 1000, categoryId: 'rent' }],
  // a count before the money
  ['deux cafés 8', { type: 'expense', amount: 8, categoryId: 'dining', note: '2 cafés' }],
  ['3 bières 15', { type: 'expense', amount: 15, categoryId: 'dining' }],
  ['deux places de ciné 24', { type: 'expense', amount: 24, categoryId: 'entertainment' }],
  ['12 déjeuner 3 personnes', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['2 pour le parking', { type: 'expense', amount: 2, categoryId: 'transport' }],
  ['5 bières', { type: 'expense', amount: 5, categoryId: 'dining' }],
  ['12 le déjeuner', { type: 'expense', amount: 12, categoryId: 'dining' }],
];
describe('French: dictated numbers and counts', () => runCases('fr', dictation, LABELS));

/** With an amount in it, a sentence is an entry, whatever question or correction words it carries. */
const moreStayEntries: Case[] = [
  ['déjeuner 12 total', { kind: 'transaction', amount: 12, categoryId: 'dining' }],
  ['courses 85 cette semaine', { kind: 'transaction', amount: 85, categoryId: 'groceries' }],
  ['total 60 au Carrefour', { kind: 'transaction', amount: 60, categoryId: 'groceries' }],
  ['il me reste 20 euros de tickets resto', { kind: 'transaction', amount: 20 }],
  ['budget courses 300', { kind: 'transaction', amount: 300, categoryId: 'groceries' }],
  ["j'ai gagné 50 au loto", { kind: 'transaction', type: 'income', amount: 50 }],
  ['courses 40 plus que prévu', { kind: 'transaction', amount: 40, categoryId: 'groceries' }],
  ["le plus cher c'était le resto 80", { kind: 'transaction', amount: 80, categoryId: 'dining' }],
  ["j'ai encore 20 euros de clopes", { kind: 'transaction', amount: 20 }],
  ['annule Netflix 15,99', { kind: 'transaction', amount: 15.99, categoryId: 'subscriptions' }],
  ["en fait j'ai dépensé 14 au resto", { kind: 'transaction', amount: 14, categoryId: 'dining' }],
  ['mets 50 de côté', { kind: 'transaction', amount: 50, categoryId: 'savings' }],
];
describe('French: more entries that stay entries', () => runCases('fr', moreStayEntries, LABELS));

/** Misreads a reviewer reproduced: a tip given, spending on payday, "no wait", a terse question, a kitty with no goal. */
const reviewedMisreads: Case[] = [
  // A tip given is money out, at the table; only a verb of receiving ("j'ai reçu") or the plural "pourboires" makes it income.
  ["j'ai donné 5 de pourboire au livreur", { kind: 'transaction', type: 'expense', amount: 5, categoryId: 'dining' }],
  ['pourboire 10', { kind: 'transaction', type: 'expense', amount: 10, categoryId: 'dining' }],
  ["j'ai reçu 50 de pourboires", { kind: 'transaction', type: 'income', amount: 50 }],
  // "à la dernière paie" says when, so the groceries stay spending and the note keeps only what was bought.
  ['courses 40 à la dernière paie', { kind: 'transaction', type: 'expense', amount: 40, categoryId: 'groceries', note: 'Courses' }],
  ['non attends, 15', { kind: 'correction', correction: { amount: 15 } }],
  ['attends, 15', { kind: 'correction', correction: { amount: 15 } }],
  ['euh 15', { kind: 'correction', correction: { amount: 15 } }],
  // "en fait 15 pas 51": the number being corrected is dropped first, the new one is what is left.
  ['en fait 15 pas 51', { kind: 'correction', correction: { amount: 15 } }],
  ['ça va pour les courses ?', { kind: 'question', question: { ask: 'left', categoryId: 'groceries' } }],
  ["j'ai mis 50 dans la cagnotte japon", { kind: 'transaction', amount: 50, categoryId: 'savings' }],
];

describe('French: reviewed misreads', () => runCases('fr', reviewedMisreads, LABELS));

/** "dîner 40 plus 8 de pourboire": the tip is the second entry, and it is spending too. */
describe('French: a tip after the meal', () => {
  it('splits into two dining entries', () => {
    const r = parseOne('dîner 40 plus 8 de pourboire', 'fr', LABELS);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ kind: 'transaction', type: 'expense', amount: 40, categoryId: 'dining' });
    expect(r[1]).toMatchObject({ kind: 'transaction', type: 'expense', amount: 8, categoryId: 'dining' });
  });
});

/**
 * Waiting on the parser core: digit-and-scale runs ("2 mille"), a named month as a question period
 * (`question.monthNames` is already in the pack) and a bare "c'était 15 pas 51" read as a fix through `notTail`.
 * Un-skip once the core change is merged.
 */
describe('after core merge', () => {
  const pending: Case[] = [
    ['2 mille de loyer', { kind: 'transaction', amount: 2000, categoryId: 'rent' }],
    ["combien j'ai dépensé en août", { kind: 'question', question: { ask: 'spent', period: 'namedMonth', month: 7 } }],
    ["c'était 15 pas 51", { kind: 'correction', correction: { amount: 15 } }],
  ];
  runCases('fr', pending, LABELS);
});
