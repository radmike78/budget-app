/**
 * Many everyday ways of saying the same thing in English, and what each must
 * become. A failure names the phrasing and shows what the parser made of it.
 */
import { parseOne, runCases, type Case } from './harness';

const CASES: Case[] = [
  // expenses
  ['spent 12 on lunch', { kind: 'transaction', type: 'expense', amount: 12, categoryId: 'dining' }],
  ['lunch was 12', { kind: 'transaction', type: 'expense', amount: 12, categoryId: 'dining' }],
  ['12 for lunch', { kind: 'transaction', type: 'expense', amount: 12, categoryId: 'dining' }],
  ['I paid 12 for lunch', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['dropped 12 on lunch', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['lunch cost me 12', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['lunch set me back 12', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['12 bucks on lunch', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['grabbed lunch for 12', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['bought lunch 12', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['twelve dollars on lunch', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['lunch twelve bucks', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['it was 12 for lunch', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['picked up groceries for 85', { type: 'expense', amount: 85, categoryId: 'groceries' }],
  ['groceries came to 85', { type: 'expense', amount: 85, categoryId: 'groceries' }],
  ['85 at Costco', { type: 'expense', amount: 85, categoryId: 'groceries' }],
  ['did a grocery run 85', { type: 'expense', amount: 85, categoryId: 'groceries' }],
  ['just spent 40 on gas', { type: 'expense', amount: 40, categoryId: 'transport' }],
  ['filled up the tank for 40', { type: 'expense', amount: 40, categoryId: 'transport' }],
  ['gas was 40', { type: 'expense', amount: 40, categoryId: 'transport' }],
  ['put 40 in the tank', { type: 'expense', amount: 40, categoryId: 'transport' }],
  ['Netflix charged me 15.99', { type: 'expense', amount: 15.99, categoryId: 'subscriptions' }],
  ['paid the electric bill 120', { type: 'expense', amount: 120, categoryId: 'utilities' }],
  ['electricity bill 120', { type: 'expense', amount: 120, categoryId: 'utilities' }],
  ['paid rent 1500', { type: 'expense', amount: 1500, categoryId: 'rent' }],
  ['coffee five fifty', { type: 'expense', amount: 5.5, categoryId: 'dining' }],
  ['$5.50 coffee', { type: 'expense', amount: 5.5, categoryId: 'dining' }],
  ['yesterday I spent 23 on an uber', { type: 'expense', amount: 23, categoryId: 'transport', occurredAt: '2026-09-15' }],
  ['dinner last night was 60', { type: 'expense', amount: 60, categoryId: 'dining', occurredAt: '2026-09-15' }],
  ['blew 200 on shoes', { type: 'expense', amount: 200, categoryId: 'shopping' }],
  ['splurged 200 on shoes', { type: 'expense', amount: 200, categoryId: 'shopping' }],
  ['treated myself to a 7 dollar latte', { type: 'expense', amount: 7, categoryId: 'dining' }],
  ['shelled out 300 for car repairs', { type: 'expense', amount: 300, categoryId: 'transport' }],
  ['forked over 300 for car repairs', { type: 'expense', amount: 300, categoryId: 'transport' }],
  ['movie tickets 30', { type: 'expense', amount: 30, categoryId: 'entertainment' }],
  ['ordered doordash 35', { type: 'expense', amount: 35, categoryId: 'dining' }],
  ['takeout 35', { type: 'expense', amount: 35, categoryId: 'dining' }],
  ['doctor copay 25', { type: 'expense', amount: 25, categoryId: 'health' }],
  ['prescription 15', { type: 'expense', amount: 15, categoryId: 'health' }],
  ['phone bill 80', { type: 'expense', amount: 80, categoryId: 'utilities' }],
  ['car payment 350', { type: 'expense', amount: 350 }],
  ['credit card payment 200', { type: 'expense', amount: 200, categoryId: 'debt' }],
  ['tipped the barber 10', { type: 'expense', amount: 10 }],
  ['haircut 40', { type: 'expense', amount: 40 }],
  ['a hundred on groceries', { type: 'expense', amount: 100, categoryId: 'groceries' }],
  ['fifteen for parking', { type: 'expense', amount: 15, categoryId: 'transport' }],
  ['20 quid on drinks', { type: 'expense', amount: 20, categoryId: 'dining' }],
  ['beers 24', { type: 'expense', amount: 24, categoryId: 'dining' }],
  ['bar tab 48', { type: 'expense', amount: 48, categoryId: 'dining' }],
  ['spotify 11.99', { type: 'expense', amount: 11.99, categoryId: 'subscriptions' }],
  ['amazon order 64', { type: 'expense', amount: 64, categoryId: 'shopping' }],
  // income
  ['got 50 from mom', { kind: 'transaction', type: 'income', amount: 50 }],
  ['got 100 from my dad', { kind: 'transaction', type: 'income', amount: 100 }],
  ['got 40 back from sarah', { kind: 'transaction', type: 'income', amount: 40 }],
  ['got 20 from grandma for my birthday', { kind: 'transaction', type: 'income', amount: 20 }],
  // amounts written without a leading zero, and a coffee chain whose name ends in "bucks"
  ['spent 12,50 on lunch', { kind: 'transaction', type: 'expense', amount: 12.5, categoryId: 'dining' }],
  ['12,99 netflix', { kind: 'transaction', type: 'expense', amount: 12.99, categoryId: 'subscriptions' }],
  ['gum .50', { kind: 'transaction', type: 'expense', amount: 0.5 }],
  ['spent .99 on an app', { kind: 'transaction', type: 'expense', amount: 0.99 }],
  ['starbucks 6.75', { kind: 'transaction', type: 'expense', amount: 6.75, categoryId: 'dining', note: 'Starbucks' }],
  ['starbucks 5 dollars', { kind: 'transaction', type: 'expense', amount: 5, categoryId: 'dining' }],
  ['got paid 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['paycheck 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['salary came in 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['payday 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['got my paycheck 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['2400 paycheck', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['direct deposit 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['I earned 300 freelancing', { type: 'income', amount: 300, categoryId: 'freelance' }],
  ['made 50 selling a lamp', { type: 'income', amount: 50 }],
  ['sold my bike for 150', { type: 'income', amount: 150 }],
  ['received 100 from mom', { type: 'income', amount: 100 }],
  ['mom gave me 100', { type: 'income', amount: 100 }],
  ['got 100 for my birthday', { type: 'income', amount: 100, categoryId: 'gift_income' }],
  ['refund of 30 from amazon', { type: 'income', amount: 30 }],
  ['Sam paid me back 40', { type: 'income', amount: 40 }],
  ['Sam venmoed me 40', { type: 'income', amount: 40 }],
  ['cashed a check for 200', { type: 'income', amount: 200 }],
  ['tips 85 tonight', { type: 'income', amount: 85 }],
  ['made 85 in tips', { type: 'income', amount: 85 }],
  ['bonus 500', { type: 'income', amount: 500 }],
  ['tax refund 900', { type: 'income', amount: 900 }],
  // spending questions
  ['how much did I spend on coffee', { kind: 'question', question: { ask: 'spent', type: 'expense', target: 'Coffee' } }],
  ['what did I spend on coffee this week', { kind: 'question', question: { ask: 'spent', period: 'week' } }],
  ['how much went to coffee', { kind: 'question', question: { ask: 'spent', target: 'Coffee' } }],
  ['what did groceries cost me this month', { kind: 'question', question: { ask: 'spent', categoryId: 'groceries', period: 'month' } }],
  ['how much did groceries cost this month', { kind: 'question', question: { ask: 'spent', categoryId: 'groceries', period: 'month' } }],
  ['total spent on gas this month', { kind: 'question', question: { ask: 'spent', target: 'Gas', period: 'month' } }],
  ['how much was spent on dining', { kind: 'question', question: { ask: 'spent', categoryId: 'dining' } }],
  ['what have I spent so far', { kind: 'question', question: { ask: 'spent', target: null } }],
  ['spending on coffee this week', { kind: 'question', question: { ask: 'spent', target: 'Coffee', period: 'week' } }],
  ['how much money did I spend last week', { kind: 'question', question: { ask: 'spent', period: 'lastWeek', target: null } }],
  ['how much on uber this month', { kind: 'question', question: { ask: 'spent', target: 'Uber' } }],
  ['what\'s my total for coffee', { kind: 'question', question: { ask: 'spent', target: 'Coffee' } }],
  ['how much coffee this week', { kind: 'question', question: { ask: 'spent', target: 'Coffee', period: 'week' } }],
  ['coffee total this month', { kind: 'question', question: { ask: 'spent', target: 'Coffee' } }],
  ['how much have I blown on takeout', { kind: 'question', question: { ask: 'spent', target: 'Takeout' } }],
  ['tell me how much I spent on gas', { kind: 'question', question: { ask: 'spent', target: 'Gas' } }],
  ['how much do I spend on coffee', { kind: 'question', question: { ask: 'spent', target: 'Coffee' } }],
  ['what am I spending on coffee', { kind: 'question', question: { ask: 'spent', target: 'Coffee' } }],
  ['how much have I spent at Target', { kind: 'question', question: { ask: 'spent', target: 'Target' } }],
  ['how much has gone on groceries', { kind: 'question', question: { ask: 'spent', categoryId: 'groceries' } }],
  ['how much did I spend today', { kind: 'question', question: { ask: 'spent', period: 'today' } }],
  ['what did I spend yesterday', { kind: 'question', question: { ask: 'spent', period: 'yesterday' } }],
  ['what are my expenses this month', { kind: 'question', question: { ask: 'spent', period: 'month' } }],
  ['how much did eating out cost me', { kind: 'question', question: { ask: 'spent' } }],
  ['how much have I spent in the last 7 days', { kind: 'question', question: { ask: 'spent' } }],
  ['how much did I spend over the weekend', { kind: 'question', question: { ask: 'spent' } }],
  ['have I spent a lot on coffee', { kind: 'question', question: { ask: 'spent', target: 'Coffee' } }],
  // left
  ['how much is left', { kind: 'question', question: { ask: 'left', target: null } }],
  ['how much room do I have', { kind: 'question', question: { ask: 'left', target: null } }],
  ['how much can I spend today', { kind: 'question', question: { ask: 'left', target: null } }],
  ['what\'s left to spend', { kind: 'question', question: { ask: 'left', target: null } }],
  ['how much do I have to spend', { kind: 'question', question: { ask: 'left', target: null } }],
  ['how much spending money do I have left', { kind: 'question', question: { ask: 'left', target: null } }],
  ['how much have I got left for groceries', { kind: 'question', question: { ask: 'left', categoryId: 'groceries' } }],
  ['what\'s remaining in groceries', { kind: 'question', question: { ask: 'left', categoryId: 'groceries' } }],
  ['how am I doing on groceries', { kind: 'question', question: { ask: 'left', categoryId: 'groceries' } }],
  ['how am I doing this month', { kind: 'question', question: { ask: 'left', target: null } }],
  ['am I on budget', { kind: 'question', question: { ask: 'left', target: null } }],
  ['am I under budget for dining', { kind: 'question', question: { ask: 'left', categoryId: 'dining' } }],
  ['how much is left over', { kind: 'question', question: { ask: 'left', target: null } }],
  ['how much do I have left until payday', { kind: 'question', question: { ask: 'left', target: null } }],
  ['what\'s left until payday', { kind: 'question', question: { ask: 'left', target: null } }],
  ['how much till payday', { kind: 'question', question: { ask: 'left', target: null } }],
  ['what\'s my budget looking like', { kind: 'question', question: { ask: 'left', target: null } }],
  ['how much is in my grocery budget', { kind: 'question', question: { ask: 'left', fallbackCategoryId: 'groceries' } }],
  ['what\'s my balance', { kind: 'question', question: { ask: 'left', target: null } }],
  ['how much money do I have', { kind: 'question', question: { ask: 'left', target: null } }],
  ['what can I still spend on dining', { kind: 'question', question: { ask: 'left', categoryId: 'dining' } }],
  ['how much more can I spend on dining', { kind: 'question', question: { ask: 'left', categoryId: 'dining' } }],
  ['is there anything left for dining', { kind: 'question', question: { ask: 'left', categoryId: 'dining' } }],
  ['do I have money left for dining', { kind: 'question', question: { ask: 'left', categoryId: 'dining' } }],
  // income questions
  ['how much did I make this month', { kind: 'question', question: { type: 'income', period: 'month' } }],
  ['what did I earn last month', { kind: 'question', question: { type: 'income', period: 'lastMonth' } }],
  ['how much income this month', { kind: 'question', question: { type: 'income' } }],
  ['how much came in this week', { kind: 'question', question: { type: 'income', period: 'week' } }],
  ['how much did I get paid this month', { kind: 'question', question: { type: 'income' } }],
  ['what\'s my income this month', { kind: 'question', question: { type: 'income' } }],
  ['how much have I made freelancing this year', { kind: 'question', question: { type: 'income', period: 'year' } }],
  // goals
  ['save 3000 for Japan by June', { kind: 'goal', amount: 3000 }],
  ['I want to save 3000 for a trip', { kind: 'goal', amount: 3000 }],
  ['goal 3000 for Japan', { kind: 'goal', amount: 3000 }],
  ['saving up for a car, 5000', { kind: 'goal', amount: 5000 }],
  ['I\'d like to put away 1000 for emergencies', { kind: 'goal', amount: 1000 }],
  ['start a goal of 1000 for an emergency fund', { kind: 'goal', amount: 1000 }],
  ['new goal: 1200 for a new laptop', { kind: 'goal', amount: 1200 }],
  ['I need to save 500 for Christmas by December', { kind: 'goal', amount: 500 }],
  ['help me save 2000 for a vacation', { kind: 'goal', amount: 2000 }],
  ['pay off my visa 2000', { kind: 'goal', amount: 2000, goalKind: 'debt' }],
  ['I want to pay off 2000 on my credit card', { kind: 'goal', amount: 2000, goalKind: 'debt' }],
  ['I owe 2000 on my visa', { kind: 'goal', amount: 2000, goalKind: 'debt' }],
  // contributions
  ['add 100 to the trip goal', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['put 100 toward Japan', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['saved 100 for Japan', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['moved 100 into the Japan fund', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['100 to the Japan trip', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['set aside 100 for Japan', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['transferred 100 to my Japan savings', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  // reminders
  ['remind me to pay rent on the 1st', { kind: 'reminder' }],
  ['remember to pay rent on the 1st', { kind: 'reminder' }],
  ['don\'t let me forget to pay rent on the 1st', { kind: 'reminder' }],
  ['set a reminder to pay rent on the 1st', { kind: 'reminder' }],
  ['remind me every friday to log receipts', { kind: 'reminder' }],
  ['reminder: pay the visa bill on the 15th', { kind: 'reminder' }],
  ['nudge me tomorrow at 9 to check the budget', { kind: 'reminder' }],
  // more ways to log spending
  ['spent twelve bucks on lunch', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['lunch came to 12', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['lunch ran me 12', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['paid $12 at Chipotle', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['Chipotle 12', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['12 Chipotle', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['had lunch for 12', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['got lunch, 12', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['coffee this morning 4.75', { type: 'expense', amount: 4.75, categoryId: 'dining' }],
  ['uber home 18', { type: 'expense', amount: 18, categoryId: 'transport' }],
  ['took an uber for 18', { type: 'expense', amount: 18, categoryId: 'transport' }],
  ['train ticket 9.50', { type: 'expense', amount: 9.5, categoryId: 'transport' }],
  ['parking was 15', { type: 'expense', amount: 15, categoryId: 'transport' }],
  ['groceries 85.20 at Trader Joe\'s', { type: 'expense', amount: 85.2, categoryId: 'groceries' }],
  ['went grocery shopping, 85', { type: 'expense', amount: 85, categoryId: 'groceries' }],
  ['internet bill 70', { type: 'expense', amount: 70, categoryId: 'utilities' }],
  ['paid the water bill, 45', { type: 'expense', amount: 45, categoryId: 'utilities' }],
  ['gym 40', { type: 'expense', amount: 40, categoryId: 'health' }],
  ['new jeans 60', { type: 'expense', amount: 60, categoryId: 'shopping' }],
  ['concert tickets were 120', { type: 'expense', amount: 120, categoryId: 'entertainment' }],
  ['renewed spotify 11.99', { type: 'expense', amount: 11.99, categoryId: 'subscriptions' }],
  ['student loan payment 250', { type: 'expense', amount: 250, categoryId: 'debt' }],
  ['moved 200 to savings', { type: 'expense', amount: 200, categoryId: 'savings' }],
  ['donated 25 to the food bank', { type: 'expense', amount: 25 }],
  ['1.2k on rent', { type: 'expense', amount: 1200, categoryId: 'rent' }],
  // more ways to log money in
  ['paycheck came in, 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['got paid today 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['work paid me 2400', { type: 'income', amount: 2400 }],
  ['client paid 600', { type: 'income', amount: 600, categoryId: 'freelance' }],
  ['invoice paid 600', { type: 'income', amount: 600 }],
  ['got a refund of 45', { type: 'income', amount: 45 }],
  ['grandma sent me 50', { type: 'income', amount: 50, categoryId: 'gift_income' }],
  // more questions
  ['how much have we spent on groceries this month', { kind: 'question', question: { ask: 'spent', categoryId: 'groceries', period: 'month' } }],
  ['what did we spend eating out last month', { kind: 'question', question: { ask: 'spent', period: 'lastMonth' } }],
  ['how much did I spend on food this week', { kind: 'question', question: { ask: 'spent', categoryIds: ['groceries', 'dining'], period: 'week' } }],
  ['what\'s my spending this week', { kind: 'question', question: { ask: 'spent', target: null, period: 'week' } }],
  ['what\'s my total so far this month', { kind: 'question', question: { ask: 'spent', target: null, period: 'month' } }],
  ['spending this month', { kind: 'question', question: { ask: 'spent', target: null, period: 'month' } }],
  ['total for groceries last month', { kind: 'question', question: { ask: 'spent', categoryId: 'groceries', period: 'lastMonth' } }],
  ['how much since payday', { kind: 'question', question: { ask: 'spent', period: 'budget' } }],
  ['what have I spent since I got paid', { kind: 'question', question: { ask: 'spent', period: 'budget' } }],
  ['hey, how much did I spend on coffee this week?', { kind: 'question', question: { ask: 'spent', target: 'Coffee', period: 'week' } }],
  ['can you tell me what I spent at Costco last month', { kind: 'question', question: { ask: 'spent', target: 'Costco', period: 'lastMonth' } }],
  ['what\'s left in my dining budget', { kind: 'question', question: { ask: 'left', categoryId: 'dining' } }],
  ['how much budget is left', { kind: 'question', question: { ask: 'left', target: null } }],
  ['how much more can I spend this month', { kind: 'question', question: { ask: 'left', target: null } }],
  ['am I over budget', { kind: 'question', question: { ask: 'left', target: null } }],
  ['am I on track', { kind: 'question', question: { ask: 'left', target: null } }],
  ['how\'s my budget looking', { kind: 'question', question: { ask: 'left', target: null } }],
  ['how much did I bring in last month', { kind: 'question', question: { type: 'income', period: 'lastMonth' } }],
  ['what did I take home this month', { kind: 'question', question: { type: 'income', period: 'month' } }],
  // goals, contributions and reminders, said differently
  ['I want to save up 5000 for a car by next summer', { kind: 'goal', amount: 5000 }],
  ['my goal is to save 1000 for an emergency fund', { kind: 'goal', amount: 1000 }],
  ['I want to get my visa paid off, 2000', { kind: 'goal', goalKind: 'debt' }],
  ['threw 50 into the Japan fund', { kind: 'contribution', amount: 50, goalId: 'g1' }],
  ['put another 50 toward the trip to Japan', { kind: 'contribution', amount: 50, goalId: 'g1' }],
  ['don\'t forget to cancel Hulu on Friday', { kind: 'reminder' }],
  ['remind me on the 15th to pay the visa', { kind: 'reminder' }],
];

/** The opposite check: a looser way of asking must never swallow an ordinary entry. */
// counts, paces and selling things (from the pre-launch review)
const COUNTS_AND_PACES: Case[] = [
  ['2 coffees 8', { type: 'expense', amount: 8, categoryId: 'dining', note: '2 coffees' }],
  ['3 beers 15', { type: 'expense', amount: 15, categoryId: 'dining' }],
  ['bought 2 tickets 30', { type: 'expense', amount: 30, categoryId: 'entertainment' }],
  ['sold 3 shirts for 45', { type: 'income', amount: 45, categoryId: 'other_income' }],
  ['sold my old bike for 150', { type: 'income', amount: 150, categoryId: 'other_income' }],
  ['save 200 a month for a car', { kind: 'goal', amount: null, goalName: 'Car' }],
  ['i want to save 100 a month for christmas', { kind: 'goal', amount: null, goalName: 'Christmas' }],
  ['save 50 a week', { kind: 'goal', amount: null }],
  // a small number before a preposition is still the money
  ['2 for parking', { type: 'expense', amount: 2, categoryId: 'transport' }],
  ['12 lunch 3 people', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['5 beers', { type: 'expense', amount: 5, categoryId: 'dining' }],
  ['save 500 for a car', { kind: 'goal', amount: 500, goalName: 'Car' }],
  // "put away" and "set aside" are savings (here, into the open trip goal), never a change to an entry called "away"
  ['put away 200 for a trip', { kind: 'contribution', amount: 200, goalId: 'g1' }],
  ['set aside 200 for a trip', { kind: 'contribution', amount: 200, goalId: 'g1' }],
  ['put away 200 for a rainy day', { kind: 'transaction', type: 'expense', amount: 200, categoryId: 'savings' }],
];
describe('English counts, paces and selling things', () => runCases('en', COUNTS_AND_PACES));

describe('English custom category whose name has "and" in it', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { parseEntries } = require('@/parser') as typeof import('@/parser');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DEFAULT_CATEGORIES } = require('@/lib/defaultCategories') as typeof import('@/lib/defaultCategories');
  const kids = { ...DEFAULT_CATEGORIES.find((c) => c.id === 'dining')!, id: 'kids', name: 'Kids extracurricular activities and school supplies', isDefault: false };
  const ctx = { categories: [...DEFAULT_CATEGORIES, kids], goals: [], keywordMap: {}, today: '2026-09-16', nowTime: '12:00', language: 'en' };
  it('is matched whole, before "school supplies" in the dictionary, and never split at its own "and"', () => {
    expect(parseEntries('spent 30 on kids extracurricular activities and school supplies', ctx)).toMatchObject([{ amount: 30, categoryId: 'kids' }]);
    expect(parseEntries('spent 30 on kids extracurricular activities and school supplies and 12 on lunch', ctx)).toMatchObject([{ amount: 30, categoryId: 'kids' }, { amount: 12, categoryId: 'dining' }]);
  });
});

const STAY_ENTRIES: Case[] = [
  ['lunch 12 total', { kind: 'transaction', amount: 12 }],
  ['spent 40 total on groceries', { kind: 'transaction', amount: 40, categoryId: 'groceries' }],
  ['total 85 at Costco', { kind: 'transaction', amount: 85 }],
  ['how much is my rent', { kind: 'transaction' }],
  ['left a 5 dollar tip', { kind: 'transaction', amount: 5 }],
  ['balance transfer fee 35', { kind: 'transaction', amount: 35 }],
  ['budget app 4.99', { kind: 'transaction', amount: 4.99 }],
  ['I owe Sam 20', { kind: 'transaction', amount: 20 }],
  ['remember the milk 4', { kind: 'transaction', amount: 4 }],
  ['spending money for the trip 200', { kind: 'transaction', amount: 200 }],
  ['20 to Sam for pizza', { kind: 'transaction', amount: 20 }],
  ['paid 30 for lunch at Japan House', { kind: 'transaction', amount: 30 }],
  ['put 40 in the tank', { kind: 'transaction', amount: 40 }],
];

describe('English phrasings', () => runCases('en', CASES));
describe('English entries stay entries', () => runCases('en', STAY_ENTRIES));

/** Fixing the last entry by voice. Only the new value may follow the lead; anything else is a new entry. */
const CORRECTIONS: Case[] = [
  // dictation writes "four fifty" as "4 50", and "five and a half" as words
  ['coffee 4 50', { kind: 'transaction', amount: 4.5, categoryId: 'dining', note: 'Coffee' }],
  ['amazon 89 99', { kind: 'transaction', amount: 89.99, note: 'Amazon' }],
  ['lunch 12 50', { kind: 'transaction', amount: 12.5, categoryId: 'dining' }],
  ['coffee 5 and a half', { kind: 'transaction', amount: 5.5, categoryId: 'dining', note: 'Coffee' }],
  ['4 50 dollars on coffee', { kind: 'transaction', amount: 4.5, categoryId: 'dining' }],
  ['remind me to call mom at 9 30', { kind: 'reminder', reminderTime: '09:30' }],
  // filler words never land in the note
  ['um spent like 23 on uber', { kind: 'transaction', amount: 23, categoryId: 'transport', note: 'Uber' }],
  ['bought groceries at trader joes 62 and change', { kind: 'transaction', amount: 62, categoryId: 'groceries', note: 'Groceries at trader joes' }],
  // corrections that name the entry
  ['forget the spotify one', { kind: 'correction', correction: { remove: true, target: 'spotify' } }],
  ['delete the spotify', { kind: 'correction', correction: { remove: true, target: 'spotify' } }],
  ['remove the uber entry', { kind: 'correction', correction: { remove: true, target: 'uber' } }],
  ['that uber was 32 not 23', { kind: 'correction', correction: { remove: false, amount: 32, target: 'uber' } }],
  ['the uber was actually 32', { kind: 'correction', correction: { amount: 32, target: 'uber' } }],
  ['change the uber to 32', { kind: 'correction', correction: { amount: 32, target: 'uber' } }],
  ['no the uber was 32', { kind: 'correction', correction: { amount: 32, target: 'uber' } }],
  ["i didn't spend 23 on uber it was 32", { kind: 'correction', correction: { amount: 32, target: 'uber' } }],
  ['move the lunch to groceries', { kind: 'correction', correction: { categoryId: 'groceries', target: 'lunch' } }],
  // goals named after the occasion they are for
  ['save 500 for christmas', { kind: 'goal', amount: 500, goalName: 'Christmas', targetDate: '2026-12-25' }],
  ['goal save 500 for christmas', { kind: 'goal', amount: 500, goalName: 'Christmas' }],
  ['actually it was 14', { kind: 'correction', correction: { remove: false, amount: 14 } }],
  ['make that 14', { kind: 'correction', correction: { amount: 14 } }],
  ['no, 14', { kind: 'correction', correction: { amount: 14 } }],
  ['oops, 14.50', { kind: 'correction', correction: { amount: 14.5 } }],
  ['sorry, make it 14 dollars', { kind: 'correction', correction: { amount: 14 } }],
  ['that should be 20', { kind: 'correction', correction: { amount: 20 } }],
  ['i meant 15', { kind: 'correction', correction: { amount: 15 } }],
  ['actually 14', { kind: 'correction', correction: { amount: 14 } }],
  ['change that to dining', { kind: 'correction', correction: { categoryId: 'dining', amount: null } }],
  ['change it to groceries', { kind: 'correction', correction: { categoryId: 'groceries' } }],
  ['put that under shopping', { kind: 'correction', correction: { categoryId: 'shopping' } }],
  ['move it to transportation', { kind: 'correction', correction: { categoryId: 'transport' } }],
  ['make that coffee', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['that was yesterday', { kind: 'correction', correction: { date: '2026-09-15', amount: null } }],
  ['actually it was yesterday', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['change that to 14 and groceries', { kind: 'correction', correction: { amount: 14, categoryId: 'groceries' } }],
  ['delete that', { kind: 'correction', correction: { remove: true } }],
  ['scratch that', { kind: 'correction', correction: { remove: true } }],
  ['remove the last one', { kind: 'correction', correction: { remove: true } }],
  ['delete my last entry', { kind: 'correction', correction: { remove: true } }],
  ['never mind', { kind: 'correction', correction: { remove: true } }],
  ['oops, delete that', { kind: 'correction', correction: { remove: true } }],
];

/** Sentences that sound a little like a correction but are new entries. */
const NOT_TAILS: Case[] = [
  ['actually it was 14 not 12', { kind: 'correction', correction: { amount: 14, target: null } }],
  ['no it was 14, not 12', { kind: 'correction', correction: { amount: 14, target: null } }],
  ['make that 14 not 12', { kind: 'correction', correction: { amount: 14 } }],
];
describe('English corrections that name the old number', () => runCases('en', NOT_TAILS));

const NOT_CORRECTIONS: Case[] = [
  ['it was 12 for lunch', { kind: 'transaction', amount: 12, categoryId: 'dining' }],
  ['that was 40 for gas', { kind: 'transaction', amount: 40 }],
  ['make that the Japan trip', { kind: 'transaction' }],
  ['remove 20 from savings', { kind: 'transaction', amount: 20 }],
  ['cancel Netflix 15.99', { kind: 'transaction', amount: 15.99 }],
  ['actually spent 14 on lunch', { kind: 'transaction', amount: 14, categoryId: 'dining' }],
];

describe('English corrections', () => runCases('en', CORRECTIONS));
describe('English sentences that are not corrections', () => runCases('en', NOT_CORRECTIONS));

/** Comparing with last time, where most went, and whether something fits. */
const INSIGHTS: Case[] = [
  ['did I spend more than last month', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['am I spending more on dining than last month', { kind: 'question', question: { ask: 'compare', period: 'month', categoryId: 'dining' } }],
  ['how does this month compare to last month', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['how am I doing compared to last week', { kind: 'question', question: { ask: 'compare', period: 'week', target: null } }],
  ['is my spending up this month', { kind: 'question', question: { ask: 'compare', period: 'month' } }],
  ['how much more did I spend this week than last week', { kind: 'question', question: { ask: 'compare', period: 'week', target: null } }],
  // A finished period against the one before it keeps its own period; "before" never becomes a target.
  ['did I spend more last week than the week before', { kind: 'question', question: { ask: 'compare', period: 'lastWeek', target: null } }],
  ['did I spend more yesterday than the day before', { kind: 'question', question: { ask: 'compare', period: 'yesterday', target: null } }],
  ['did I spend more last month than the month before on groceries', { kind: 'question', question: { ask: 'compare', period: 'lastMonth', categoryId: 'groceries' } }],
  ['did I spend more over the weekend than last weekend', { kind: 'question', question: { ask: 'compare', period: 'weekend', target: null } }],
  ['did I spend less on groceries than last month', { kind: 'question', question: { ask: 'compare', categoryId: 'groceries' } }],
  ['what did I spend the most on', { kind: 'question', question: { ask: 'top', target: null } }],
  ['where did most of my money go this month', { kind: 'question', question: { ask: 'top', period: 'month' } }],
  ["what's my biggest expense", { kind: 'question', question: { ask: 'biggest' } }],
  ['where did my money go last month', { kind: 'question', question: { ask: 'top', period: 'lastMonth' } }],
  ['what am I spending the most on', { kind: 'question', question: { ask: 'top' } }],
  ['can I afford a $200 jacket', { kind: 'question', question: { ask: 'afford', price: 200, target: 'Jacket', fallbackCategoryId: 'shopping' } }],
  ['can I afford 200 for shoes', { kind: 'question', question: { ask: 'afford', price: 200 } }],
  ['is 80 ok for dinner', { kind: 'question', question: { ask: 'afford', price: 80, fallbackCategoryId: 'dining' } }],
  ['can I spend 80 on dinner tonight', { kind: 'question', question: { ask: 'afford', price: 80 } }],
  ['do I have enough for a 1200 laptop', { kind: 'question', question: { ask: 'afford', price: 1200, target: 'Laptop' } }],
  ['would 50 be ok for groceries', { kind: 'question', question: { ask: 'afford', price: 50, categoryId: 'groceries' } }],
  ['can I afford to eat out', { kind: 'question', question: { ask: 'left' } }],
];
const INSIGHTS_STAY_ENTRIES: Case[] = [
  ['spent 200 on a jacket', { kind: 'transaction', amount: 200 }],
  ['bought the most expensive coffee 7', { kind: 'transaction', amount: 7 }],
  ['more coffee 4', { kind: 'transaction', amount: 4 }],
];
describe('English: comparing, the most, affording', () => runCases('en', INSIGHTS));
describe('English: entries near those words stay entries', () => runCases('en', INSIGHTS_STAY_ENTRIES));

/**
 * Everyday speech, second pass: putting money away, spending slang, money in, questions people really ask,
 * fixes, reminders and dictation quirks. Each block is run through the same harness.
 */
const PUTTING_AWAY: Case[] = [
  // plain savings: money moved out of the spendable pot, nothing names the open goal
  ['put 200 away', { kind: 'transaction', type: 'expense', amount: 200, categoryId: 'savings' }],
  ['stashed 50', { kind: 'transaction', type: 'expense', amount: 50, categoryId: 'savings' }],
  ['squirreled away 100', { kind: 'transaction', type: 'expense', amount: 100, categoryId: 'savings' }],
  ['socked away 300 this month', { kind: 'transaction', type: 'expense', amount: 300, categoryId: 'savings' }],
  ['tucked 40 into savings', { kind: 'transaction', type: 'expense', amount: 40, categoryId: 'savings' }],
  ['moved 500 to savings', { kind: 'transaction', type: 'expense', amount: 500, categoryId: 'savings' }],
  ['put 200 in savings', { kind: 'transaction', type: 'expense', amount: 200, categoryId: 'savings' }],
  ['stuck 100 in my savings', { kind: 'transaction', type: 'expense', amount: 100, categoryId: 'savings' }],
  ['chucked 20 in the holiday pot', { kind: 'transaction', type: 'expense', amount: 20, categoryId: 'savings' }],
  ['saved 50 today', { kind: 'transaction', type: 'expense', amount: 50, categoryId: 'savings', occurredAt: '2026-09-16' }],
  ['transferred 200 to my savings account', { kind: 'transaction', type: 'expense', amount: 200, categoryId: 'savings', note: 'Savings account' }],
  ['topped up my emergency fund by 100', { kind: 'transaction', type: 'expense', amount: 100, categoryId: 'savings', note: 'Emergency fund' }],
  ['auto transfer to savings 150', { kind: 'transaction', type: 'expense', amount: 150, categoryId: 'savings' }],
  ['moved a hundred over to savings', { kind: 'transaction', type: 'expense', amount: 100, categoryId: 'savings' }],
  // "set aside 100 for rent" is money earmarked, not rent paid
  ['set aside 100 for rent', { kind: 'transaction', type: 'expense', amount: 100, categoryId: 'savings' }],
  // the words name the open goal "Trip to Japan"
  ['threw 100 at the Japan trip', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['chucked 50 into the Japan fund', { kind: 'contribution', amount: 50, goalId: 'g1' }],
  ['dropped 50 into the trip fund', { kind: 'contribution', amount: 50, goalId: 'g1' }],
  ['tossed 25 into the Japan pot', { kind: 'contribution', amount: 25, goalId: 'g1' }],
  ['put a hundred into the Japan trip', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  // future intent with a pace is a new goal; the pace is not the total
  ['I want to put away 200 a month for a car', { kind: 'goal', amount: null, goalName: 'Car' }],
  ['I want to save 300 a month for a house deposit', { kind: 'goal', amount: null, goalName: 'House deposit' }],
];
describe('English: putting money away', () => runCases('en', PUTTING_AWAY));

const SLANG: Case[] = [
  ['dropped 40 on drinks', { type: 'expense', amount: 40, categoryId: 'dining', note: 'Drinks' }],
  ['blew 60 at the bar', { type: 'expense', amount: 60, categoryId: 'dining' }],
  ['wasted 20 on a cab', { type: 'expense', amount: 20, categoryId: 'transport', note: 'Cab' }],
  ['threw away 15 on parking', { type: 'expense', amount: 15, categoryId: 'transport', note: 'Parking' }],
  ['shelled out 90 for a haircut', { type: 'expense', amount: 90, note: 'Haircut' }],
  ['coughed up 45 for parking', { type: 'expense', amount: 45, categoryId: 'transport', note: 'Parking' }],
  ['forked out 300 for tires', { type: 'expense', amount: 300, categoryId: 'transport', note: 'Tires' }],
  ['splashed out 150 on a new coat', { type: 'expense', amount: 150, categoryId: 'shopping', note: 'Coat' }],
  ['treated the kids to ice cream 12', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['picked up a coffee 4', { type: 'expense', amount: 4, categoryId: 'dining', note: 'Coffee' }],
  ['grabbed a sandwich for 9', { type: 'expense', amount: 9, categoryId: 'dining', note: 'Sandwich' }],
  ['ran to the store, 35', { type: 'expense', amount: 35, categoryId: 'shopping', note: 'Store' }],
  ['swung by Starbucks 6', { type: 'expense', amount: 6, categoryId: 'dining', note: 'Starbucks' }],
  ['hit up Chipotle 14', { type: 'expense', amount: 14, categoryId: 'dining', note: 'Chipotle' }],
  ['went to the movies 30', { type: 'expense', amount: 30, categoryId: 'entertainment' }],
  ['popped into Tesco for 22', { type: 'expense', amount: 22, categoryId: 'groceries', note: 'Tesco' }],
  ['stopped for gas 45', { type: 'expense', amount: 45, categoryId: 'transport', note: 'Gas' }],
  ['did a Target run 80', { type: 'expense', amount: 80, categoryId: 'shopping' }],
  ['Costco trip 180', { type: 'expense', amount: 180, categoryId: 'groceries' }],
  ['20 at the pump', { type: 'expense', amount: 20, categoryId: 'transport' }],
  ['filled up 55', { type: 'expense', amount: 55, categoryId: 'transport' }],
  ['topped up the car 40', { type: 'expense', amount: 40, categoryId: 'transport' }],
  ['round of drinks 40', { type: 'expense', amount: 40, categoryId: 'dining' }],
  ['a round at the pub 24', { type: 'expense', amount: 24, categoryId: 'dining' }],
  ['chipped in 20 for the gift', { type: 'expense', amount: 20, categoryId: 'shopping', note: 'Gift' }],
  ['split the bill, my half was 30', { kind: 'transaction', type: 'expense', amount: 30 }],
  ['venmoed Sarah 25 for dinner', { type: 'expense', amount: 25, categoryId: 'dining' }],
  // money sent to a person is money out, whoever they are
  ['sent mom 100', { type: 'expense', amount: 100, note: 'Mom' }],
  ['paid the babysitter 60', { type: 'expense', amount: 60, note: 'Babysitter' }],
  ['parking meter 3', { type: 'expense', amount: 3, categoryId: 'transport' }],
  ['tolls 8', { type: 'expense', amount: 8, categoryId: 'transport' }],
  ['an oil change, 70', { type: 'expense', amount: 70, categoryId: 'transport', note: 'Oil change' }],
  // a plain statement with "the ... was" is an entry; only "actually", an opener or "not 23" makes it a fix
  ['the dentist was 150', { kind: 'transaction', type: 'expense', amount: 150, categoryId: 'health', note: 'Dentist' }],
  ['co-pay 25', { type: 'expense', amount: 25, categoryId: 'health' }],
  // a monthly thing said in passing is an expense with the pace dropped from the note, never a goal
  ['gym 40 a month', { kind: 'transaction', type: 'expense', amount: 40, categoryId: 'health', note: 'Gym' }],
  ['Netflix 15.99 a month', { kind: 'transaction', type: 'expense', amount: 15.99, categoryId: 'subscriptions', note: 'Netflix' }],
  // a pace on an entry is offered as a repeating entry; the words never reach the note, and a goal or a pay-day pace is not one
  ['netflix 15.99 every month', { kind: 'transaction', amount: 15.99, categoryId: 'subscriptions', note: 'Netflix', repeat: 'monthly' }],
  ['rent 1200 on the 1st every month', { kind: 'transaction', amount: 1200, categoryId: 'rent', repeat: 'monthly', dateExplicit: true }],
  ['spotify 10 monthly', { kind: 'transaction', amount: 10, note: 'Spotify', repeat: 'monthly' }],
  ['phone bill 45 every other week', { kind: 'transaction', amount: 45, repeat: 'biweekly' }],
  ['paid 1500 salary every 2 weeks', { kind: 'transaction', type: 'income', amount: 1500, categoryId: 'salary', repeat: 'biweekly' }],
  ['car insurance 600 a year', { kind: 'transaction', amount: 600, note: 'Car insurance', repeat: 'yearly' }],
  ['cleaner 60 a week', { kind: 'transaction', amount: 60, repeat: 'weekly' }],
  ['20 per paycheck for gas', { kind: 'transaction', amount: 20, categoryId: 'transport', repeat: null }],
  ['coffee 4', { kind: 'transaction', amount: 4, repeat: null }],
  ['save 200 a month for a car', { kind: 'goal', repeat: null }],
  ['um like 23 on uber', { type: 'expense', amount: 23, categoryId: 'transport', note: 'Uber' }],
  ['so I went and got groceries and it was like 85', { type: 'expense', amount: 85, categoryId: 'groceries', note: 'Groceries' }],
  ['beers with the lads 30 quid', { type: 'expense', amount: 30, categoryId: 'dining' }],
  ['takeaway curry 25', { type: 'expense', amount: 25, categoryId: 'dining' }],
  ['petrol 60', { type: 'expense', amount: 60, categoryId: 'transport' }],
  ['chippy 12', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['50 dollars worth of gas', { type: 'expense', amount: 50, categoryId: 'transport', note: 'Gas' }],
];
describe('English: spending slang', () => runCases('en', SLANG));

const MONEY_IN: Case[] = [
  ['got paid', { kind: 'transaction', type: 'income', amount: null, categoryId: 'salary' }],
  ['payday! 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['my check came in 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['paycheck hit 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['pay came in 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['wages 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['overtime 200', { type: 'income', amount: 200, categoryId: 'salary' }],
  ['made 300 on the side', { type: 'income', amount: 300, categoryId: 'freelance' }],
  ['side hustle 300', { type: 'income', amount: 300, categoryId: 'freelance' }],
  ['a client paid me 500', { type: 'income', amount: 500, categoryId: 'freelance' }],
  ['tips tonight 85', { type: 'income', amount: 85, occurredAt: '2026-09-16' }],
  ['sold my couch for 120', { type: 'income', amount: 120, categoryId: 'other_income', note: 'Couch' }],
  ['cash from grandma 50', { type: 'income', amount: 50, categoryId: 'gift_income' }],
  ['birthday money 100', { type: 'income', amount: 100, categoryId: 'gift_income' }],
  ['my mum sent me 50', { type: 'income', amount: 50, categoryId: 'gift_income' }],
  ['refund from Amazon 32', { type: 'income', amount: 32, categoryId: 'other_income', note: 'Amazon' }],
  ['got 40 back from Dave', { type: 'income', amount: 40, categoryId: 'other_income', note: 'Dave' }],
  ['venmo from Sarah 25', { type: 'income', amount: 25, categoryId: 'other_income' }],
  ['got my tax refund, 900', { type: 'income', amount: 900, categoryId: 'other_income' }],
  ['bonus 1000', { type: 'income', amount: 1000, categoryId: 'other_income' }],
  ['got a bonus of 1000', { type: 'income', amount: 1000, categoryId: 'other_income' }],
  ['unemployment came through 450', { type: 'income', amount: 450, categoryId: 'other_income', note: 'Unemployment' }],
  ['child benefit 90', { type: 'income', amount: 90, categoryId: 'other_income' }],
  ['dividends 25', { type: 'income', amount: 25, categoryId: 'other_income' }],
  ['got reimbursed 80 for the train', { type: 'income', amount: 80, categoryId: 'other_income', note: 'Train' }],
  ['work reimbursed me 80', { type: 'income', amount: 80, categoryId: 'other_income', note: 'Work' }],
];
describe('English: money in, said the way people say it', () => runCases('en', MONEY_IN));

const REAL_QUESTIONS: Case[] = [
  ['what did I spend on food this week', { kind: 'question', question: { ask: 'spent', categoryIds: ['groceries', 'dining'], period: 'week' } }],
  ["what's left for groceries", { kind: 'question', question: { ask: 'left', categoryId: 'groceries' } }],
  ['whats left in groceries', { kind: 'question', question: { ask: 'left', categoryId: 'groceries' } }],
  ['how much left on groceries', { kind: 'question', question: { ask: 'left', categoryId: 'groceries' } }],
  ['how much do I have for groceries', { kind: 'question', question: { ask: 'left', categoryId: 'groceries' } }],
  ["what's my remaining for dining", { kind: 'question', question: { ask: 'left', categoryId: 'dining' } }],
  ['am I over on dining', { kind: 'question', question: { ask: 'left', categoryId: 'dining' } }],
  ['am I under on groceries', { kind: 'question', question: { ask: 'left', categoryId: 'groceries' } }],
  ['am I over for the month', { kind: 'question', question: { ask: 'left', target: null } }],
  ['where did my money go this month', { kind: 'question', question: { ask: 'top', period: 'month' } }],
  ['what was my biggest expense', { kind: 'question', question: { ask: 'biggest', target: null } }],
  ['whats my top category', { kind: 'question', question: { ask: 'top', target: null } }],
  ['what did I spend most on last month', { kind: 'question', question: { ask: 'top', period: 'lastMonth', target: null } }],
  ['can I afford 80 for shoes', { kind: 'question', question: { ask: 'afford', price: 80, target: 'Shoes' } }],
  ['can I swing 200 for a jacket', { kind: 'question', question: { ask: 'afford', price: 200, target: 'Jacket' } }],
  ['is 40 ok for drinks tonight', { kind: 'question', question: { ask: 'afford', price: 40, fallbackCategoryId: 'dining' } }],
  ['can I spend 80 on shoes', { kind: 'question', question: { ask: 'afford', price: 80, fallbackCategoryId: 'shopping' } }],
  ['did I spend less this week', { kind: 'question', question: { ask: 'compare', period: 'week' } }],
  ['is my dining spending up', { kind: 'question', question: { ask: 'compare', categoryId: 'dining' } }],
  ['how much did I earn this week', { kind: 'question', question: { type: 'income', period: 'week' } }],
  ['how much did I make freelancing', { kind: 'question', question: { type: 'income', fallbackCategoryId: 'freelance' } }],
  // what has been put away: the transfers toward the goal mention its name, so "Japan" finds them
  ['how much have I saved for Japan', { kind: 'question', question: { ask: 'spent', target: 'Japan' } }],
  ['how much have I put towards Japan', { kind: 'question', question: { ask: 'spent', target: 'Japan' } }],
  ['how much have I put away this month', { kind: 'question', question: { ask: 'spent', period: 'month', fallbackCategoryId: 'savings' } }],
  ['how much have I spent on uber this month', { kind: 'question', question: { ask: 'spent', target: 'Uber', period: 'month' } }],
  ['how much on groceries so far', { kind: 'question', question: { ask: 'spent', categoryId: 'groceries', period: 'all' } }],
  ['how much did the weekend cost', { kind: 'question', question: { ask: 'spent', period: 'weekend', target: null } }],
  ['how much have I spent on takeout in the last 30 days', { kind: 'question', question: { ask: 'spent', period: 'recentDays', days: 30, target: 'Takeout' } }],
  // one day, read by the same rules that date an entry (today is Wednesday the 16th)
  ['tell me how much I spent last wednesday', { kind: 'question', question: { ask: 'spent', period: 'day', date: '2026-09-09', target: null } }],
  ['how much did I spend at starbucks last wednesday', { kind: 'question', question: { ask: 'spent', period: 'day', date: '2026-09-09', target: 'Starbucks' } }],
  ['how much did I spend on tuesday', { kind: 'question', question: { ask: 'spent', period: 'day', date: '2026-09-15', target: null } }],
  ['how much did i spend on the 3rd', { kind: 'question', question: { ask: 'spent', period: 'day', date: '2026-09-03' } }],
  ['how much did I spend 3 days ago', { kind: 'question', question: { ask: 'spent', period: 'day', date: '2026-09-13' } }],
  ['did I spend more last friday than the day before', { kind: 'question', question: { ask: 'compare', period: 'day', date: '2026-09-11' } }],
  ['how much did I spend yesterday', { kind: 'question', question: { ask: 'spent', period: 'yesterday' } }],
  ['lunch 12 last wednesday', { kind: 'transaction', amount: 12, occurredAt: '2026-09-09' }],
  // the single biggest entry, against the biggest category
  ['what was my biggest expense last month', { kind: 'question', question: { ask: 'biggest', period: 'lastMonth', target: null } }],
  ['what was my biggest grocery expense last month', { kind: 'question', question: { ask: 'biggest', period: 'lastMonth', fallbackCategoryId: 'groceries' } }],
  ['what was the most expensive thing I bought this year', { kind: 'question', question: { ask: 'biggest', period: 'year', target: null } }],
  ["what's the most I spent at once last week", { kind: 'question', question: { ask: 'biggest', period: 'lastWeek', target: null } }],
  ['biggest expense last week', { kind: 'question', question: { ask: 'biggest', period: 'lastWeek', target: null } }],
  ['my biggest expenses this month', { kind: 'question', question: { ask: 'top', period: 'month' } }],
  ['what did I spend the most on last month', { kind: 'question', question: { ask: 'top', period: 'lastMonth', target: null } }],
  ['where did most of my money go in the last 30 days', { kind: 'question', question: { ask: 'top', period: 'recentDays', days: 30 } }],
  ['am I spending more in the last 30 days', { kind: 'question', question: { ask: 'compare', period: 'recentDays', days: 30 } }],
  // a word that is also a property every object inherits is not a number word
  ['paid the constructor 500 for the deck', { kind: 'transaction', amount: 500 }],
  ['constructor 500', { kind: 'transaction', amount: 500 }],
  ['what did I spend on amazon last week', { kind: 'question', question: { ask: 'spent', target: 'Amazon', period: 'lastWeek' } }],
  ['what did I drop on drinks this week', { kind: 'question', question: { ask: 'spent', target: 'Drinks', period: 'week' } }],
  ['how much did I blow on takeout last month', { kind: 'question', question: { ask: 'spent', target: 'Takeout', period: 'lastMonth' } }],
  ["what's my grocery spending this month", { kind: 'question', question: { ask: 'spent', period: 'month', fallbackCategoryId: 'groceries' } }],
];
describe('English: questions people really ask', () => runCases('en', REAL_QUESTIONS));

const MORE_CORRECTIONS: Case[] = [
  ['no wait that was 14', { kind: 'correction', correction: { remove: false, amount: 14, target: null } }],
  ['oops, that was 14', { kind: 'correction', correction: { amount: 14, target: null } }],
  ['no it was 12.50', { kind: 'correction', correction: { amount: 12.5, target: null } }],
  ['nope, 15', { kind: 'correction', correction: { amount: 15 } }],
  ['wait, make that 20', { kind: 'correction', correction: { amount: 20 } }],
  ['make that last one 25', { kind: 'correction', correction: { amount: 25 } }],
  ['that should have been 30', { kind: 'correction', correction: { amount: 30 } }],
  ['sorry I meant 40', { kind: 'correction', correction: { amount: 40 } }],
  ['oops wrong amount, 14', { kind: 'correction', correction: { amount: 14 } }],
  ['make it dining', { kind: 'correction', correction: { categoryId: 'dining', amount: null } }],
  ['that was yesterday actually', { kind: 'correction', correction: { date: '2026-09-15', amount: null } }],
  ['that was the day before yesterday', { kind: 'correction', correction: { date: '2026-09-14' } }],
  ['delete the uber', { kind: 'correction', correction: { remove: true, target: 'uber' } }],
  ['change the lunch to 15', { kind: 'correction', correction: { amount: 15, target: 'lunch' } }],
  ['the lunch should be 15', { kind: 'correction', correction: { amount: 15, target: 'lunch' } }],
  ['the coffee was 4.50 not 5', { kind: 'correction', correction: { amount: 4.5, target: 'coffee' } }],
  ['undo that', { kind: 'correction', correction: { remove: true } }],
  ['get rid of the last one', { kind: 'correction', correction: { remove: true } }],
  ['kill the last one', { kind: 'correction', correction: { remove: true } }],
  ['bin that', { kind: 'correction', correction: { remove: true } }],
];
describe('English: more fixes by voice', () => runCases('en', MORE_CORRECTIONS));

const MORE_REMINDERS: Case[] = [
  ['remind me rent is due on the 1st', { kind: 'reminder', occurredAt: '2026-10-01', reminderText: 'Rent is due' }],
  ["don't let me forget the electric bill friday", { kind: 'reminder', occurredAt: '2026-09-18' }],
  ['ping me at 8 to log receipts', { kind: 'reminder', reminderTime: '08:00', reminderText: 'Log receipts' }],
  ['remind me every monday to check my budget', { kind: 'reminder', reminderRepeat: 'weekly', reminderText: 'Check my budget' }],
  ['remind me the car insurance is due on the 20th', { kind: 'reminder', occurredAt: '2026-09-20' }],
  ['heads up on friday to pay the water bill', { kind: 'reminder', occurredAt: '2026-09-18', reminderText: 'Pay the water bill' }],
  ['remind me tomorrow morning to transfer rent', { kind: 'reminder', occurredAt: '2026-09-17', reminderTime: '08:00' }],
  ['every evening at 9 remind me to log my spending', { kind: 'reminder', reminderRepeat: 'daily', reminderTime: '21:00' }],
  ['remind me to cancel the free trial in 3 days', { kind: 'reminder', occurredAt: '2026-09-19', reminderText: 'Cancel the free trial' }],
  ['can you remind me at 5pm to pay sarah back', { kind: 'reminder', reminderTime: '17:00' }],
  ['remind me on the first of every month to pay rent', { kind: 'reminder', reminderRepeat: 'monthly', reminderText: 'Pay rent' }],
  ["don't forget the gas bill is due thursday", { kind: 'reminder', occurredAt: '2026-09-17' }],
  ['remind me at 9 30 to check the budget', { kind: 'reminder', reminderTime: '09:30', reminderText: 'Check the budget' }],
];
describe('English: more reminders', () => runCases('en', MORE_REMINDERS));

const DICTATION: Case[] = [
  ['lunch four fifty', { kind: 'transaction', amount: 4.5, categoryId: 'dining' }],
  ['3 50 for a coffee', { kind: 'transaction', amount: 3.5, categoryId: 'dining', note: 'Coffee' }],
  ['two fifty for a coffee', { kind: 'transaction', amount: 2.5, categoryId: 'dining' }],
  ['twenty bucks on gas', { kind: 'transaction', amount: 20, categoryId: 'transport' }],
  ['a grand on rent', { kind: 'transaction', amount: 1000, categoryId: 'rent' }],
  ['twenty five hundred rent', { kind: 'transaction', amount: 2500, categoryId: 'rent' }],
  ['1,200 rent', { kind: 'transaction', amount: 1200, categoryId: 'rent' }],
  ['12 dollars 50 for lunch', { kind: 'transaction', amount: 12.5, categoryId: 'dining', note: 'Lunch' }],
  ['$12.50 lunch', { kind: 'transaction', amount: 12.5, categoryId: 'dining' }],
  // UK: a fiver, a tenner, quid
  ['fiver for coffee', { kind: 'transaction', amount: 5, categoryId: 'dining', note: 'Coffee' }],
  ['a tenner on lunch', { kind: 'transaction', amount: 10, categoryId: 'dining', note: 'Lunch' }],
  ['50 quid groceries', { kind: 'transaction', amount: 50, categoryId: 'groceries' }],
  ['a buck fifty for gum', { kind: 'transaction', amount: 1.5, note: 'Gum' }],
];
describe('English: numbers as dictation writes them', () => runCases('en', DICTATION));

/** Sentences that brush against a question, goal or correction but are plain entries. */
const STILL_ENTRIES: Case[] = [
  ['groceries 85 this week', { kind: 'transaction', amount: 85, categoryId: 'groceries' }],
  // a discount is not money that moved; "saved" alone reads as putting money away, and the card is there to change it.
  // What matters is that it is never a goal or a contribution.
  ['saved 50 on the sale', { kind: 'transaction', amount: 50 }],
  ['total 60 on drinks', { kind: 'transaction', amount: 60, categoryId: 'dining' }],
  ['gas 40 for the week', { kind: 'transaction', amount: 40, categoryId: 'transport' }],
  ['coffee 4 like every morning', { kind: 'transaction', amount: 4, categoryId: 'dining' }],
  ['more groceries 30', { kind: 'transaction', amount: 30, categoryId: 'groceries' }],
  ['the most expensive coffee ever 7', { kind: 'transaction', amount: 7, categoryId: 'dining' }],
  ['dropped 12 on lunch', { kind: 'transaction', amount: 12, categoryId: 'dining' }],
  // "at" now introduces a goal name ("threw 100 at the Japan trip"), yet a place that merely contains a goal word stays a place
  ['paid 30 at Japan House', { kind: 'transaction', amount: 30, note: 'Japan House' }],
  ['spent 12 at the pub', { kind: 'transaction', amount: 12, categoryId: 'dining' }],
  ['that was 40 for gas', { kind: 'transaction', amount: 40, categoryId: 'transport' }],
  ['put 200 away for a rainy day', { kind: 'transaction', amount: 200, categoryId: 'savings' }],
];
describe('English: still entries', () => runCases('en', STILL_ENTRIES));

/** Misreads a reviewer found, each reproduced before the fix. */
const REVIEW_CORRECTIONS: Case[] = [
  // the number being corrected is never the amount, and the old number at the end marks the fix on its own
  ['it was 15 not 51', { kind: 'correction', correction: { remove: false, amount: 15, target: null } }],
  ['that was 12 not 21', { kind: 'correction', correction: { amount: 12, target: null } }],
  ['lunch was 15 not 50', { kind: 'correction', correction: { amount: 15, target: 'lunch' } }],
  ['the groceries were 45 not 54', { kind: 'correction', correction: { amount: 45, target: 'groceries' } }],
  ['drinks were 30 not 40', { kind: 'correction', correction: { amount: 30, target: 'drinks' } }],
  ['groceries were 45 not 54', { kind: 'correction', correction: { amount: 45, target: 'groceries' } }],
  // an opener and a bare new amount
  ['no wait 15', { kind: 'correction', correction: { amount: 15, target: null } }],
  ['no wait, 15', { kind: 'correction', correction: { amount: 15 } }],
  ['nah 15', { kind: 'correction', correction: { amount: 15 } }],
  ['nah, 15 bucks', { kind: 'correction', correction: { amount: 15 } }],
  ['wait, 15', { kind: 'correction', correction: { amount: 15 } }],
  ['ok 15', { kind: 'correction', correction: { amount: 15 } }],
  ['uh 15', { kind: 'correction', correction: { amount: 15 } }],
];
describe('English: fixes the reviewer found misread', () => runCases('en', REVIEW_CORRECTIONS));

const REVIEW_ENTRIES: Case[] = [
  // digits glued to letters are part of a name
  ['gs25 snack 3', { kind: 'transaction', amount: 3, categoryId: 'dining' }],
  ['7-eleven 5', { kind: 'transaction', amount: 5, note: '7-eleven' }],
  ['spent 15 at 7-eleven', { kind: 'transaction', amount: 15, note: '7-eleven' }],
  // a digit before a scale word
  ['2 grand on the car', { kind: 'transaction', amount: 2000, categoryId: 'transport' }],
  ['2 thousand on the car', { kind: 'transaction', amount: 2000, categoryId: 'transport' }],
  ['12 hundred rent', { kind: 'transaction', amount: 1200, categoryId: 'rent' }],
  // "1.200" typed the way a field reads it; "4.50" is still four fifty
  ['1.200 rent', { kind: 'transaction', amount: 1200, categoryId: 'rent' }],
  ['4.50 coffee', { kind: 'transaction', amount: 4.5, categoryId: 'dining' }],
  // the pay word says when, not that money came in
  ['spent 40 on groceries last payday', { kind: 'transaction', type: 'expense', amount: 40, categoryId: 'groceries' }],
  ['spent 300 since payday', { kind: 'transaction', type: 'expense', amount: 300 }],
  // a return is money back
  ['returned the shoes, got 60 back', { kind: 'transaction', type: 'income', amount: 60, note: 'Shoes' }],
  ['got 60 back for the shoes', { kind: 'transaction', type: 'income', amount: 60, note: 'Shoes' }],
  ['return 60 at zara', { kind: 'transaction', type: 'income', amount: 60, note: 'Zara' }],
  // paying someone back is money out; money through an app is money in
  ['paid back sam 40', { kind: 'transaction', type: 'expense', amount: 40, note: 'Sam' }],
  ['paid sam back 40', { kind: 'transaction', type: 'expense', amount: 40 }],
  ['got 40 on venmo from sam', { kind: 'transaction', type: 'income', amount: 40, note: 'Sam' }],
  ['won 100 on a scratch card', { kind: 'transaction', type: 'income', amount: 100 }],
  // dates said loosely
  ['the other day I spent 30 on books', { kind: 'transaction', amount: 30, categoryId: 'entertainment', note: 'Books', occurredAt: '2026-09-14' }],
  ['two weeks ago tuesday I paid 80 for the vet', { kind: 'transaction', amount: 80, categoryId: 'health', note: 'Vet', occurredAt: '2026-09-01' }],
  ['a week ago friday 20 on parking', { kind: 'transaction', amount: 20, categoryId: 'transport', occurredAt: '2026-09-04' }],
  // who the money went to, and the bill a supplier's name stands for
  ['gave the kids 20', { kind: 'transaction', amount: 20, categoryId: 'other_expense', note: 'Kids' }],
  ['british gas 130', { kind: 'transaction', amount: 130, categoryId: 'utilities' }],
];
describe('English: entries the reviewer found misread', () => runCases('en', REVIEW_ENTRIES));

const REVIEW_QUESTIONS: Case[] = [
  // a month by name is a period, never the thing asked about
  ['how much did I spend in august', { kind: 'question', question: { ask: 'spent', period: 'namedMonth', month: 7, target: null } }],
  ['what did I spend on coffee in august', { kind: 'question', question: { ask: 'spent', period: 'namedMonth', month: 7, target: 'Coffee' } }],
  ['how much did I spend in may', { kind: 'question', question: { ask: 'spent', period: 'namedMonth', month: 4, target: null } }],
  ['how much did I make last march', { kind: 'question', question: { type: 'income', period: 'namedMonth', month: 2, target: null } }],
  // the counting word after the thing is not part of the thing
  ["what's my coffee total this week", { kind: 'question', question: { ask: 'spent', target: 'Coffee', period: 'week' } }],
  // terse ways of asking
  ['am I okay on groceries', { kind: 'question', question: { ask: 'left', categoryId: 'groceries' } }],
  ['am i doing ok on groceries', { kind: 'question', question: { ask: 'left', categoryId: 'groceries' } }],
  ['coffee spend?', { kind: 'question', question: { ask: 'spent', target: 'Coffee' } }],
  ['groceries left?', { kind: 'question', question: { ask: 'left', categoryId: 'groceries' } }],
  ['coffee this week?', { kind: 'question', question: { ask: 'spent', target: 'Coffee', period: 'week' } }],
];
describe('English: questions the reviewer found misread', () => runCases('en', REVIEW_QUESTIONS));

const REVIEW_STAY_ENTRIES: Case[] = [
  ['payday 2400', { kind: 'transaction', type: 'income', amount: 2400, categoryId: 'salary' }],
  ['got paid today', { kind: 'transaction', type: 'income' }],
  ['groceries 85 this week', { kind: 'transaction', amount: 85 }],
  ['return flight 300', { kind: 'transaction', type: 'expense', amount: 300, categoryId: 'transport' }],
  ['lunch 12 total', { kind: 'transaction', amount: 12 }],
  ['it was 12 for lunch', { kind: 'transaction', amount: 12, categoryId: 'dining' }],
  ['the dentist was 150', { kind: 'transaction', amount: 150, categoryId: 'health' }],
  ['bought 2 tickets 30', { kind: 'transaction', amount: 30, categoryId: 'entertainment' }],
  ['august 3 lunch 12', { kind: 'transaction', amount: 12, occurredAt: '2026-08-03' }],
];
describe('English: entries near those fixes stay entries', () => runCases('en', REVIEW_STAY_ENTRIES));

describe('English: two rides in one sentence, and the won that is a verb', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { parseEntries } = require('@/parser') as typeof import('@/parser');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { spokenCurrency } = require('@/parser/currencyHint') as typeof import('@/parser/currencyHint');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DEFAULT_CATEGORIES } = require('@/lib/defaultCategories') as typeof import('@/lib/defaultCategories');
  const ctx = { categories: DEFAULT_CATEGORIES, goals: [], keywordMap: {}, today: '2026-09-16', nowTime: '12:00', language: 'en' };
  it('"and back 50" is the same kind of thing as the ride before it', () => {
    expect(parseEntries('uber to the airport 45 and back 50', ctx)).toMatchObject([
      { amount: 45, categoryId: 'transport' },
      { amount: 50, categoryId: 'transport', note: 'Back' },
    ]);
  });
  it('"won 100" is winning, "5000 won" is money', () => {
    expect(spokenCurrency('won 100 on a scratch card')).toBeNull();
    expect(spokenCurrency('won on the lottery 100')).toBeNull();
    expect(spokenCurrency('5000 won for lunch')).toBe('KRW');
    expect(spokenCurrency('lunch 5000 won')).toBe('KRW');
  });
});

describe('a goal named by a pronoun', () => {
  it('"add 50 to it" goes to the goal made last', () => {
    const r = parseOne('add 50 to it', 'en');
    expect(r[0]).toMatchObject({ kind: 'contribution', amount: 50, goalId: 'g1' });
    expect(parseOne('put 20 in that one', 'en')[0]).toMatchObject({ kind: 'contribution', amount: 20, goalId: 'g1' });
  });
});

describe('money for a goal that is done', () => {
  it('still names the goal, so the app can say it is done', () => {
    const done = [{ ...GOALS_FOR_DONE[0], completed: true }];
    expect(parseOne('add 20 to the trip', 'en', undefined, done)[0]).toMatchObject({ kind: 'contribution', amount: 20, goalId: 'g1' });
  });
});
const GOALS_FOR_DONE = [{ id: 'g1', name: 'Trip to Japan', kind: 'saving', targetAmount: 3000, currentAmount: 3000, targetDate: null, completed: true, createdAt: '2026-01-01' }] as unknown as import('@/types').Goal[];
