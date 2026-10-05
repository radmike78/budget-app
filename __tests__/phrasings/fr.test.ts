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
