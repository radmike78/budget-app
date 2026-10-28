import { replaceNumberWords } from '../numberWords';
import { ISO_RULE, byMonthRule, byYearRule, endOfYearRule, dayMonthRule, dayOfMonthRule, monthDayRule, mostRecentWeekday, relativeFutureRules, relativePastRules, slashRule, weekdayRule } from '../dateRules';
import { addDays } from '@/lib/dates';
import type { DateRule, LanguagePack } from '../types';
import { monthWords, periodWords } from '../questionRules';
import { ORDINAL_WORDS_EN, clockRule, dayWords, futureDayOfMonthRule, futureWeekdayRule, meridiemRule, monthlyOnRule, repeatWords, weeklyOnRule, wordTimeRules } from '../reminderRules';
import { normalizeDecimalPoint } from '../numbers';

const MONTHS = {
  names: {
    january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2, april: 3, apr: 3, may: 4, june: 5, jun: 5,
    july: 6, jul: 6, august: 7, aug: 7, september: 8, sept: 8, sep: 8, october: 9, oct: 9,
    november: 10, nov: 10, december: 11, dec: 11,
  },
};

const WEEKDAYS = {
  names: {
    sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2, wednesday: 3, wed: 3,
    thursday: 4, thu: 4, thur: 4, thurs: 4, friday: 5, fri: 5, saturday: 6, sat: 6,
  },
  lastBefore: ['last', 'past'],
  prefixes: ['on', 'this'],
};

const KEYWORDS: Record<string, string[]> = {
  salary: ['salary', 'paycheck', 'pay check', 'payday', 'wages', 'wage', 'got paid', 'get paid', 'was paid', 'direct deposit', 'payroll', 'pay day', 'pay cheque', 'paycheque',
    // "my check came in", "paycheck hit", "pay landed": the pay arriving, said the way people say it
    'check came in', 'cheque came in', 'check hit', 'cheque hit', 'paycheck hit', 'pay came in', 'pay hit', 'pay landed', 'pay went in', 'got my pay', 'overtime', 'pay rise', 'raise'],
  freelance: ['freelance', 'freelancing', 'side income', 'side gig', 'gig', 'client', 'invoice', 'contract work', 'consulting', 'commission', 'etsy', 'upwork', 'fiverr', 'tutoring', 'side hustle', 'ebay sale', 'tips', 'tip money', 'on the side', 'side job', 'side work'],
  gift_income: ['gift from', 'got for my birthday', 'for my birthday from', 'got as a gift', 'birthday money', 'gift money', 'gave me', 'sent me', 'money from mom', 'money from dad', 'from grandma', 'from grandpa', 'christmas money', 'from mum', 'from my mum', 'from nan', 'from my nan', 'from auntie', 'from my aunt'],
  // ("paid me" is not here: "a client paid me 500" is freelance, and the verb alone already makes it income.)
  // ("paid back" alone is money out to someone, under debt; only "paid me back" and "got paid back" are money in.)
  other_income: ['sold', 'selling', 'resold', 'sold my', 'refund', 'venmoed me', 'zelled me', 'cash apped me', 'paypaled me', 'e-transferred me', 'sent me money', 'cashed a check', 'cashed a cheque', 'refunded', 'reimbursed', 'reimbursement', 'cashback', 'cash back', 'rebate', 'interest', 'dividend', 'dividends', 'bonus', 'tax return', 'tax refund', 'won', 'winnings', 'lottery', 'pension', 'stipend', 'allowance', 'benefit', 'benefits', 'unemployment', 'paid me back', 'paid us back', 'got paid back', 'repaid', 'venmo from', 'zelle from', 'paypal from', 'cash app from', 'settlement', 'returned', 'got back', 'return at', 'return to', 'return from'],
  groceries: ['groceries', 'grocery', 'grocery store', 'supermarket', 'market', 'food shopping', 'produce', 'vegetables', 'fruit', 'milk', 'eggs', 'bread', 'costco', 'trader joes', "trader joe's", 'whole foods', 'aldi', 'kroger', 'safeway', 'walmart grocery', 'lidl', 'tesco', 'sainsburys', "sainsbury's", 'woolworths', 'coles', 'loblaws', 'wegmans', 'publix', 'heb', 'h-e-b', 'meijer', 'food lion', 'giant', 'stop and shop', 'sprouts', 'meat', 'butcher', 'farmers market', 'bakery', 'asda', 'morrisons', 'waitrose', 'co-op', 'coop', 'm&s', 'marks and spencer', 'ocado', 'iceland', 'big shop', 'weekly shop', 'food shop'],
  dining: ['lunch', 'dinner', 'breakfast', 'brunch', 'coffee', 'latte', 'cappuccino', 'espresso', 'cafe', 'café', 'restaurant', 'takeout', 'take out', 'takeaway', 'take away', 'delivery', 'doordash', 'door dash', 'ubereats', 'uber eats', 'grubhub', 'deliveroo', 'postmates', 'seamless', 'pizza', 'burger', 'burgers', 'sushi', 'tacos', 'taco', 'sandwich', 'snack', 'snacks', 'drinks', 'beer', 'beers', 'wine', 'cocktail', 'cocktails', 'bar', 'pub', 'starbucks', 'dunkin', 'mcdonalds', "mcdonald's", 'chipotle', 'subway', 'wendys', "wendy's", 'chick fil a', 'chick-fil-a', 'taco bell', 'panera', 'boba', 'bubble tea', 'tea', 'smoothie', 'juice', 'ice cream', 'dessert', 'donut', 'donuts', 'bagel', 'food', 'ate', 'eat', 'eating out', 'meal', 'ramen', 'pho', 'kebab', 'curry', 'noodles', 'happy hour', 'tip', 'steakhouse', 'steak house', 'steak', 'grill', 'bistro', 'diner', 'eatery', 'brasserie', 'trattoria', 'taqueria', 'cantina', 'bakery cafe', 'chili\'s', 'chilis', 'applebee\'s', 'applebees', 'olive garden', 'outback', 'cheesecake factory', 'panda express', 'five guys', 'shake shack', 'in-n-out', 'in n out', 'dominos', 'domino\'s', 'papa johns', 'papa john\'s', 'pizza hut', 'tim hortons', 'whataburger', 'sonic', 'arby\'s', 'arbys', 'kfc', 'popeyes', 'wingstop', 'waffle house', 'ihop', 'denny\'s', 'dennys', 'cracker barrel', 'texas roadhouse', 'red lobster', 'buffalo wild wings', 'wendy\'s', 'jack in the box', 'carl\'s jr', 'del taco', 'qdoba', 'sweetgreen', 'noodles & company', 'raising cane\'s', 'canes', 'zaxby\'s', 'culver\'s', 'steak n shake', 'longhorn', 'ruth\'s chris', 'fleming\'s', 'morton\'s', 'capital grille', 'p.f. chang\'s', 'pf changs', 'benihana', 'nando\'s', 'wagamama', 'pret', 'greggs', 'caffe nero', 'tim horton\'s', 'bbq', 'barbecue', 'barbeque', 'kbbq', 'korean bbq', 'korean food', 'korean restaurant', 'chinese food', 'chinese restaurant', 'thai food', 'thai restaurant', 'mexican food', 'mexican restaurant', 'indian food', 'indian restaurant', 'italian food', 'italian restaurant', 'japanese food', 'japanese restaurant', 'vietnamese food', 'greek food', 'mediterranean food', 'buffet', 'hot pot', 'hotpot', 'dim sum', 'wings', 'fried chicken', 'brewery', 'gastropub', 'food truck', 'cafeteria', 'canteen', 'food court', 'poke', 'shawarma', 'gyro', 'falafel', 'dumplings', 'bbq joint', 'chippy', 'chip shop', 'fish and chips', 'kebab shop', 'nandos', 'costa', 'maccies', 'maccas', 'mcdonald', 'round of drinks', 'pint', 'pints', 'the pub', 'pub lunch', 'meal deal'],
  rent: ['rent', 'mortgage', 'landlord', 'lease', 'housing', 'hoa', 'hoa fee', 'property tax', 'home insurance', 'renters insurance', "renter's insurance", 'apartment', 'security deposit'],
  utilities: ['utilities', 'utility', 'electric', 'electricity', 'electric bill', 'power bill', 'gas bill', 'water bill', 'water', 'sewer', 'trash', 'garbage', 'internet', 'wifi', 'wi-fi', 'broadband', 'phone bill', 'cell phone', 'cellphone', 'mobile bill', 'phone plan', 'verizon', 'at&t', 'att', 't-mobile', 'tmobile', 'comcast', 'xfinity', 'spectrum', 'heating', 'heat', 'energy', 'utility bill', 'council tax', 'cable',
    // suppliers people name instead of the bill ("british gas 130" is the gas bill, not fuel)
    'british gas', 'octopus energy', 'octopus', 'edf', 'eon', 'e.on', 'ovo', 'scottish power', 'thames water', 'virgin media', 'sky', 'bt', 'o2', 'vodafone', 'ee', 'giffgaff', 'pg&e', 'pge', 'con edison', 'coned', 'duke energy', 'national grid', 'eversource', 'hydro bill', 'hydro'],
  transport: ['gas', 'gasoline', 'gas tank', 'the tank', 'filled up', 'fill up', 'fill-up', 'filled the tank', 'filled her up', 'car repair', 'car repairs', 'auto repair', 'auto shop', 'tune up', 'tune-up', 'fuel', 'petrol', 'diesel', 'uber', 'lyft', 'taxi', 'cab', 'train', 'subway fare', 'metro', 'bus', 'bus fare', 'transit', 'parking', 'toll', 'tolls', 'car', 'car payment', 'car insurance', 'auto insurance', 'oil change', 'car wash', 'mechanic', 'repair', 'tires', 'tire', 'registration', 'dmv', 'flight', 'flights', 'plane ticket', 'airfare', 'airline', 'rental car', 'car rental', 'scooter', 'bike', 'bicycle', 'e-bike', 'train ticket', 'amtrak', 'commute', 'commuting', 'ride', 'rideshare', 'ev charging', 'charging', 'shell', 'exxon', 'chevron', 'bp', 'mobil', 'wawa', 'sheetz', 'speedway', 'circle k', 'quiktrip', 'racetrac', 'gas station', 'petrol station', 'esso', 'texaco', 'sunoco', 'valero', 'love\'s', 'buc-ee\'s', 'bucees', 'supercharger', 'jiffy lube', 'valvoline', 'autozone', 'o\'reilly', 'pep boys', 'greyhound', 'megabus', 'american airlines', 'southwest', 'jetblue', 'alaska airlines', 'hertz', 'avis', 'enterprise', 'turo', 'pump', 'the pump', 'gas pump', 'petrol pump', 'topped up the car', 'top up the car', 'tank of gas', 'tank of petrol', 'congestion charge', 'oyster card', 'parking meter', 'car park', 'the tube', 'tfl', 'national rail', 'tyres', 'tyre', 'mot'],
  health: ['doctor', 'dentist', 'dental', 'pharmacy', 'prescription', 'medicine', 'meds', 'medication', 'copay', 'co-pay', 'hospital', 'clinic', 'urgent care', 'health insurance', 'therapy', 'therapist', 'counseling', 'gym', 'gym membership', 'fitness', 'yoga', 'pilates', 'vitamins', 'supplements', 'glasses', 'contacts', 'optometrist', 'eye exam', 'chiropractor', 'physio', 'physical therapy', 'vet', 'veterinarian', 'massage', 'health', 'medical', 'cvs', 'walgreens', 'boots', 'chemist', 'rite aid', 'planet fitness', 'la fitness', 'equinox', 'orangetheory', 'crossfit', 'anytime fitness', 'kaiser', 'quest', 'labcorp', 'petsmart vet', 'banfield'],
  entertainment: ['movie', 'movies', 'cinema', 'theater', 'theatre', 'concert', 'show', 'tickets', 'ticket', 'game', 'games', 'video game', 'video games', 'steam', 'playstation', 'xbox', 'nintendo', 'bowling', 'golf', 'museum', 'zoo', 'park', 'amusement park', 'festival', 'club', 'nightclub', 'karaoke', 'arcade', 'books', 'book', 'kindle', 'audible', 'hobby', 'hobbies', 'crafts', 'fun', 'night out', 'date night', 'entertainment', 'sports', 'match', 'streaming'],
  shopping: ['amazon', 'target', 'walmart', 'clothes', 'clothing', 'shoes', 'sneakers', 'shirt', 'pants', 'jeans', 'dress', 'jacket', 'coat', 'shopping', 'store', 'mall', 'ikea', 'furniture', 'decor', 'home depot', 'lowes', "lowe's", 'hardware', 'tools', 'electronics', 'best buy', 'apple store', 'headphones', 'phone', 'laptop', 'charger', 'cable', 'gift', 'gifts', 'present', 'presents', 'birthday gift', 'toys', 'toy', 'makeup', 'cosmetics', 'skincare', 'haircut', 'hair', 'salon', 'barber', 'nails', 'beauty', 'sephora', 'ulta', 'etsy order', 'online order', 'order', 'purchase', 'stationery', 'office supplies', 'supplies', 'household', 'cleaning supplies', 'toiletries', 'laundry', 'dry cleaning', 'flowers', 'plants', 'pet food', 'dog food', 'cat food', 'pet', 'pets', 'dog', 'cat', 'kids', 'baby', 'diapers', 'school supplies', 'textbook', 'textbooks', 'tuition', 'course', 'class', 'macy\'s', 'macys', 'nordstrom', 'kohl\'s', 'kohls', 'tj maxx', 'tjmaxx', 'marshalls', 'old navy', 'gap', 'h&m', 'uniqlo', 'forever 21', 'department store', 'boutique', 'costco membership', 'dollar tree', 'dollar general', 'five below', 'bed bath', 'wayfair', 'etsy', 'ebay', 'temu', 'shein', 'aliexpress', 'foot locker', 'nike', 'adidas', 'lululemon', 'dick\'s', 'dicks sporting', 'rei', 'bass pro', 'michaels', 'hobby lobby', 'joann', 'staples', 'office depot', 'ace hardware', 'harbor freight', 'menards', 'costco shopping', 'sam\'s club', 'bj\'s', 'john lewis', 'argos', 'debenhams', 'selfridges', 'ikea order', 'best buy'],
  subscriptions: ['subscription', 'subscriptions', 'netflix', 'spotify', 'hulu', 'disney plus', 'disney+', 'hbo', 'max', 'apple music', 'apple tv', 'youtube premium', 'youtube', 'prime', 'amazon prime', 'icloud', 'google one', 'dropbox', 'chatgpt', 'claude', 'adobe', 'membership', 'patreon', 'substack', 'newspaper', 'nyt', 'new york times', 'paramount', 'peacock', 'crunchyroll', 'twitch', 'app subscription', 'monthly plan', 'annual plan', 'renewal', 'renewed', 'xbox live', 'game pass', 'ps plus', 'playstation plus', 'nintendo online', 'audible subscription', 'kindle unlimited', 'duolingo', 'headspace', 'calm', 'strava', 'peloton'],
  debt: ['credit card', 'credit card payment', 'card payment', 'loan', 'loan payment', 'student loan', 'student loans', 'debt', 'paid off', 'minimum payment', 'interest payment', 'late fee', 'overdraft', 'affirm', 'klarna', 'afterpay', 'personal loan', 'line of credit', 'paying back', 'paid back', 'owed', 'repayment', 'installment', 'instalment'],
  savings: ['savings', 'saving', 'transfer', 'transferred', 'moved to savings', 'emergency fund', 'investment', 'invested', 'investing', 'retirement', '401k', 'ira', 'roth', 'brokerage', 'stocks', 'crypto', 'bitcoin', 'vanguard', 'fidelity', 'schwab', 'robinhood', 'acorns', 'wealthfront', 'betterment', 'set aside', 'put away', 'deposit to savings', 'high yield', 'hysa', 'sinking fund',
    // everyday ways of putting money away; "saved" with nothing else said is money put away, not a discount
    'saved', 'stashed', 'stash', 'stashed away', 'squirreled away', 'squirrelled away', 'socked away', 'tucked away', 'salted away', 'put aside', 'put toward', 'put towards',
    'the pot', 'savings pot', 'holiday pot', 'rainy day fund', 'rainy day', 'piggy bank', 'nest egg', 'savings account', 'savings jar', 'isa', 'premium bonds', 'moved to my savings', 'auto transfer'],
  other_expense: ['tuition', 'school fees', 'school fee', 'daycare', 'childcare', 'child care', 'babysitter', 'nursery', 'textbooks', 'haircut', 'barber', 'fee', 'fees', 'bank fee', 'atm', 'atm fee', 'cash', 'withdrawal', 'withdrew', 'donation', 'donated', 'charity', 'church', 'tithe', 'taxes', 'tax', 'irs', 'fine', 'parking ticket', 'speeding ticket', 'postage', 'stamps', 'shipping', 'ups', 'fedex', 'usps', 'post office', 'misc', 'miscellaneous', 'other', 'stuff', 'things', 'lent', 'loaned', 'venmo', 'zelle', 'paypal', 'cash app', 'sent', 'paid someone', 'insurance', 'life insurance', 'childcare', 'daycare', 'babysitter', 'nanny', 'school', 'education', 'legal', 'lawyer', 'accountant', 'wedding', 'vacation', 'trip', 'travel', 'hotel', 'airbnb', 'hostel', 'lodging',
    // money handed to the family ("gave the kids 20") is not shopping
    'gave the kids', 'gave the kid', 'gave my kids', 'gave the children', 'gave my son', 'gave my daughter', 'gave the boys', 'gave the girls', 'pocket money', 'lunch money', 'kids allowance'],
};

const STOPWORDS = [
  'a', 'an', 'the', 'and', 'or', 'but', 'of', 'on', 'in', 'at', 'to', 'for', 'from', 'with', 'by', 'about',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'it', 'its', 'this', 'that', 'these', 'those', 'some', 'any',
  'is', 'was', 'were', 'be', 'been', 'am', 'are', 'do', 'did', 'does', 'have', 'has', 'had', 'got', 'get',
  'just', 'today', 'yesterday', 'tonight', 'morning', 'afternoon', 'evening', 'night', 'week', 'month', 'year',
  'spent', 'spend', 'paid', 'pay', 'bought', 'buy', 'purchased', 'cost', 'costs', 'charged', 'received', 'earned',
  'dollars', 'dollar', 'bucks', 'buck', 'usd', 'euros', 'euro', 'pounds', 'pound', 'quid', 'cents', 'cent',
  'each', 'total', 'again', 'also', 'then', 'so', 'very', 'really', 'new', 'more', 'less', 'last', 'next',
  'goal', 'save', 'saved', 'saving', 'add', 'added', 'put', 'toward', 'towards', 'into', 'up', 'out', 'off',
  'went', 'go', 'going', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'entry', 'expense', 'income', 'money', 'something', 'thing', 'like', 'ago', 'made', 'hit',
];

function singularForms(word: string): string[] {
  const out: string[] = [];
  if (word.length > 4 && word.endsWith('ies')) out.push(word.slice(0, -3) + 'y');
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) out.push(word.slice(0, -1));
  if (word.length > 4 && word.endsWith('es')) out.push(word.slice(0, -2));
  return out;
}

const relPast = relativePastRules({
  today: ['today', 'tonight', 'this morning', 'this afternoon', 'this evening', 'earlier today'],
  yesterday: ['yesterday', 'yesterday morning', 'yesterday afternoon', 'yesterday evening', 'yesterday night', 'last night'],
  // ("the other day" is a day or two ago; two is near enough, and the card shows the date to change.)
  dayBeforeYesterday: ['day before yesterday', 'the day before yesterday', 'the other day', 'the other night'],
  lastWeek: ['last week'],
  lastMonth: ['last month'],
  daysAgo: /\b(\d+|a|one) days? ago\b/,
  weeksAgo: /\b(\d+|a|one) weeks? ago\b/,
  monthsAgo: /\b(\d+|a|one) months? ago\b/,
  oneWords: ['a', 'one'],
});

const relFuture = relativeFutureRules({
  endOfYear: ['by end of year', 'by the end of the year', 'by the end of this year', 'end of year', 'end of the year', 'end of this year', 'by year end'],
  endOfNextYear: ['by the end of next year', 'end of next year'],
  endOfMonth: ['by end of month', 'by the end of the month', 'by the end of this month', 'end of month', 'end of the month'],
  nextYear: ['by next year', 'next year'],
  nextMonth: ['by next month', 'next month'],
  christmas: ['by christmas', 'before christmas', 'christmas'],
  inDays: /\b(?:in|within|over|over the next|in the next|during the next|for the next) (\d+|a|one) days?\b/,
  inWeeks: /\b(?:in|within|over|over the next|in the next|during the next|for the next) (\d+|a|one) weeks?\b/,
  inMonths: /\b(?:in|within|over|over the next|in the next|during the next|for the next) (\d+|a|one) months?\b/,
  inYears: /\b(?:in|within|over|over the next|in the next|during the next|for the next) (\d+|a|one) years?\b/,
  oneWords: ['a', 'one'],
  seasons: { spring: ['by spring', 'by next spring'], summer: ['by summer', 'by next summer'], fall: ['by fall', 'by autumn', 'by next fall', 'by next autumn'], winter: ['by winter', 'by next winter'] },
});

/** "two weeks ago tuesday": the Tuesday of the week two weeks back (the most recent one on or before that day). */
const WEEKS_AGO_WEEKDAY: DateRule = {
  re: new RegExp(`\\b(\\d+|a|one) weeks? ago(?: on)? (${Object.keys(WEEKDAYS.names).sort((a, b) => b.length - a.length).join('|')})\\b`, 'iu'),
  resolve: (m, t) => {
    const n = m[1] === 'a' || m[1] === 'one' ? 1 : Number(m[1]);
    const day = (WEEKDAYS.names as Record<string, number>)[m[2].toLowerCase()];
    return Number.isFinite(n) && day != null ? mostRecentWeekday(day, addDays(t, -7 * n), false) : null;
  },
};

const SCALE_AFTER_DIGITS: Record<string, number> = { hundred: 100, thousand: 1000, grand: 1000, k: 1000, million: 1_000_000 };

export const en: LanguagePack = {
  code: 'en',
  speechTag: 'en-US',
  tokenizer: 'space',
  decimalComma: false,
  // "a fiver", "a tenner" (UK), "a buck" are amounts too; the shared number words take it from there.
  // "2 grand", "2 thousand", "12 hundred": a digit before a scale word is one amount, as dictation writes it.
  numberWords: (t) => replaceNumberWords(normalizeDecimalPoint(t)
    .replace(/\b(\d+(?:\.\d+)?) (hundred|thousand|grand|million)\b/g, (_m, n: string, scale: string) => String(Math.round(parseFloat(n) * SCALE_AFTER_DIGITS[scale])))
    .replace(/\b(?:a |one )?fiver\b/g, '5')
    .replace(/\b(?:a |one )?tenner\b/g, '10')
    .replace(/\ba buck\b/g, '1 dollar')
    .replace(/\ba quid\b/g, '1 quid')),
  currencyMarkers: /\$|€|£|¥|₹|dollars?|bucks?|usd|euros?|eur|pounds?|gbp|quid|cad|aud|yen|rupees?|inr|pesos?|kr|chf/i,
  currencyWords: /\b(dollars?|bucks?|usd|euros?|eur|pounds?|gbp|quid|cad|aud|yen|rupees?|inr|pesos?|kr|chf|cents?)\b/giu,
  incomeVerbs: [
    'got paid', 'get paid', 'was paid', 'were paid', 'been paid', 'paid me', 'paid us', 'paycheck', 'pay check', 'payday', 'pay day',
    'salary', 'wages', 'wage', 'earned', 'earning', 'earn', 'received', 'receive', 'refund', 'refunded', 'reimbursed', 'reimbursement',
    'income', 'deposited', 'deposit from', 'bonus', 'commission', 'sold', 'made money', 'made from', 'won money', 'winnings', 'cashback', 'cash back', 'dividend',
    'dividends', 'pension', 'stipend', 'allowance', 'gift from', 'gave me', 'sent me', 'paid me back', 'paid us back', 'repaid',
    'tips', 'tip money', 'tax refund', 'tax return', 'freelance', 'invoice paid', 'client paid', 'payout', 'cashed',
    // a return: "returned the shoes, got 60 back", "return 60 at zara" (the amount is already out of the text here)
    'returned', 'got back', 'return at', 'return to', 'return from',
    // "got 40 on venmo from sam": money that arrived through an app
    'venmo from', 'zelle from', 'paypal from', 'cash app from',
    // "got 50 from mom": money from family is money in (a purchase "from" a shop names the shop, not a parent).
    'from mom', 'from my mom', 'from mum', 'from my mum', 'from dad', 'from my dad', 'from my parents', 'from grandma', 'from my grandma',
    'from grandpa', 'from my grandpa', 'got back from', 'got paid back', 'borrowed from',
    'got for my birthday', 'venmoed me', 'zelled me', 'cash apped me', 'paypaled me', 'e-transferred me', 'transferred me', 'sent me money', 'made in tips', 'brought in', 'took home', 'take home pay', 'came in',
    'came through', 'reimbursed me', 'on the side', 'overtime', 'pay rise', 'got a raise', 'from nan', 'from my nan', 'from my aunt', 'from auntie',
    'paycheck hit', 'check came in', 'cheque came in', 'check hit', 'pay came in', 'pay landed', 'pay hit', 'pay went in',
  ],
  expenseVerbs: [
    'spent', 'spend', 'paid', 'pay', 'paying', 'bought', 'buy', 'buying', 'purchased', 'purchase', 'cost', 'costs', 'charged', 'owe',
    'ordered', 'picked up', 'grabbed', 'went to', 'went for', 'got', 'expense', 'bill', 'renewed', 'donated', 'tipped', 'lent',
    // "paid back sam 40", "gave the kids 20": money handed to someone
    'paid back', 'gave',
    'loaned', 'withdrew', 'sent', 'transferred', 'dropped', 'blew', 'splurged', 'treated',
    // spending slang; each is taken out of the note ("shelled out for a haircut" keeps "haircut")
    'wasted', 'threw away', 'shelled out', 'coughed up', 'forked out', 'forked over', 'splashed out', 'swung by', 'hit up', 'popped into', 'popped in',
    'popped to', 'stopped for', 'stopped at', 'stopped by', 'ran to', 'chipped in', 'topped up', 'venmoed', 'zelled', 'paypaled', 'cash apped', 'wired', 'burned', 'burnt through',
    // "co-pay" holds "pay"; taken whole, so the note is not left as "Co".
    'co-pay',
  ],
  keywords: KEYWORDS,
  stopwords: STOPWORDS,
  pastDateRules: [
    ISO_RULE,
    WEEKS_AGO_WEEKDAY,
    ...relPast,
    monthDayRule(MONTHS, { pre: ['on', 'back on'], ordinal: '(?:st|nd|rd|th)?' }),
    dayMonthRule(MONTHS, { pre: ['on', 'on the', 'the'], between: ['of'], ordinal: '(?:st|nd|rd|th)?' }),
    dayOfMonthRule(/\bon the (\d{1,2})(?:st|nd|rd|th)\b/),
    weekdayRule(WEEKDAYS),
    slashRule(false),
  ],
  futureDateRules: [
    ISO_RULE,
    ...relFuture,
    monthDayRule(MONTHS, { pre: ['by', 'before', 'until', 'due'], ordinal: '(?:st|nd|rd|th)?', future: true }),
    dayMonthRule(MONTHS, { pre: ['by', 'before', 'until', 'by the', 'before the', 'the'], between: ['of'], ordinal: '(?:st|nd|rd|th)?', future: true }),
    endOfYearRule(['by end of', 'by the end of', 'before the end of', 'until the end of', 'end of', 'through']),
    byMonthRule(MONTHS, ['by', 'before', 'until', 'in', 'by next', 'before next', 'until next', 'next', 'by early', 'by mid', 'by late', 'by end of', 'by the end of', 'end of', 'for', 'this']),
    byYearRule(['by', 'before', 'until', 'in', 'during']),
  ],
  goalLead: /^(?:(?:new |savings? |debt |payoff )?goal|(?:set|create|make|start|add)(?: up)? (?:a |me a |my |the |another )?(?:new )?(?:savings? |debt |payoff |pay[- ]down )?(?:goal|plan|target)(?: to| of| for)?|i(?:'d| would)? (?:want|like|need) (?:a |to (?:set|make|create|start) (?:a |my )?)(?:new )?(?:savings? |debt )?(?:goal|plan)(?: to| of| for)?)\s*:?\s*/,
  goalIntent: /\b(?:i(?:'d| would)? (?:want|like|need|plan|am trying|'m trying) to (?:save|put away|set aside|have)|want to save|save up|saving up|trying to save|need to save|save)\b/,
  goalPastVerbs: /\b(?:saved|stashed|moved|added|put(?! (?:away|aside))|transferred|deposited|paid)\b/,
  goalPronoun: /^(?:it|that|this|that one|this one|the goal|my goal|the fund|the pot|the jar)$/iu,
  repeatOf: { yearly: /\b(?:year|yearly|annually|annual)\b/iu, biweekly: /\b(?:fortnight|fortnightly|biweekly|(?:two|2|other) weeks?)\b/iu, weekly: /\b(?:week|weekly)\b/iu, monthly: /\b(?:month|monthly)\b/iu },
  perPeriod: /\b(?:(?:a|per|each|every)\s+(?:month|week|fortnight|year|paycheck|pay ?day|payday)|monthly|weekly|yearly|biweekly|fortnightly|every (?:two|2|other) weeks?)\b/,
  countStop: /^(?:on|for|at|in|to|of|from|per|a|an|the|and|with|by|off|into|towards?|each|every|dollars?|bucks|quid|k|grand|total|each|apiece|more|less|back|out|up|down|yesterday|today|tonight|last|this|ago|again|not|instead|rather)$/i,
  // "spent 40 on groceries last payday": the pay word says when, not that money came in.
  notIncome: /\b(?:last|since|before|after|until|till|the week before|the day before|the day after) (?:payday|pay day|paycheck|pay check|paycheque|pay cheque)\b/giu,
  // "uber to the airport 45 and back 50": the second ride is a ride too.
  continuation: /^(?:and )?(?:back|home|return|the return|the way back|coming back|again|same|the same|same again|another|one more|the other way)$/iu,
  debtIntent: /\b(?:(?:i|we) (?:still )?owe|(?:(?:i(?:'d| would)? (?:want|like|need) to |help me )?get (?:(?:my|the|our) )?(?:[a-z'-]+ ){0,3}paid (?:off|down))|(?:i(?:'d| would)? (?:want|like|need|plan|am trying|'m trying|am going|'m going) to |we (?:want|need|plan) to |i (?:will|wanna|gotta|have to|got to) |i want a plan to |help me )?(?:pay(?:ing)? (?:down|off|back)|pay (?:it |them |that )?(?:down|off)|get out of debt|get rid of (?:my |the |our )?(?:debt|loan|balance)|(?:be|become|get) debt[- ]free|debt[- ]free|clear (?:my |the |our )?(?:debt|loan|balance|card)|wipe out|knock out))\b/,
  debtWords: /\b(?:debts?|credit cards?|cards? balance|loans?|student loans?|car loans?|mortgage|line of credit|overdraft|balance owed|what i owe|amex|visa|mastercard|discover)\b/,
  contributionVerbs: /^(?=[$€£]?\d[\d.,]*\s+(?:dollars?\s+|bucks\s+)?(?:to|toward|towards|into)\s)|\b(?:add(?:ed)?|put|moved?|saved?|set aside|transfer(?:red)?|deposit(?:ed)?|contribut(?:ed|e)|stashed|stash|tucked(?: away)?|threw|tossed|chucked|chuck|dropped|stuck|socked|squirrel+ed|topped up|top up|sent|parked|funnel+ed|paid|pay|payment)\b/,
  contributionPreps: 'to|toward|towards|into|for|in|at',
  forWords: 'for',
  goalWords: 'goal',
  goalNouns: /^(?:fund|funds|savings|saving|account|pot|jar|stash|kitty|piggy|bank|goal|money)$/u,
  articles: /^(?:(?:a|an|the|my|our|some|new)\s+)+/,
  leadingFiller: /^(?:(?:i|we|just|then|and|so|also|today|ok|okay|um|uh|please|note|log|add|record|entry|new|expense|income|spent|spend|paid|pay|bought|buy|purchased|got|get|received|earned|made|cost|for|on|at|of|to|in|from|the|a|an|some|my|our|about|around|roughly|another|went|like|yeah|well)\s+)+/,
  trailingFiller: /(?:\s+(?:today|yesterday|for|on|at|of|to|in|from|the|a|an|and|with|each|total|again|please|thanks|it|that|this|by|like|was|hit|landed|cleared|came in|came through|went in))+$/,
  // "um", "uh", "like" before a preposition, "and change", "a month" said in passing and "worth of" never belong in a note.
  noteStrip: [
    /(?<![\p{L}])(?:um+|uh+|er+|hmm+|erm|actually|basically|honestly)(?![\p{L}])/giu,
    /(?<![\p{L}])like (?=(?:on|at|for|in|to|from)\b)/giu,
    /(?<![\p{L}])(?:and|or) (?:some )?change(?![\p{L}])/giu,
    /(?<![\p{L}])(?:a|per|each|every) (?:month|week|year|fortnight)(?![\p{L}])/giu,
    /(?<![\p{L}])worth of(?![\p{L}])/giu,
  ],
  singularForms,
  listSeparators: [',', ';', 'and', 'plus', 'also', 'then', 'and then', 'and also'],
  reminder: {
    lead: /\b(?:(?:can|could|would|will) you )?(?:please )?(?:remind (?:me|us)|set (?:a |an |up a )?(?:reminder|alarm|alert)|(?:i need|i want|i'd like|create|add|make) (?:a |an )?(?:reminder|alert)|reminder|don't let me forget|(?:don't|do not) forget|^remember(?= to\b)|(?:give me a |a )?heads[- ]up|ping me|nudge me|poke me|flag (?:it |this )?(?:for me|to me))\b(?:\s+(?:to|that|about|for|of)(?![\p{L}]))?\s*:?/iu,
    time: [
      meridiemRule(['at', 'around', 'about', '@', 'by']),
      clockRule(['at', 'around', 'about', '@', 'by'], { dayParts: { 'in the morning': 0, morning: 0, 'in the afternoon': 12, afternoon: 12, 'in the evening': 12, evening: 12, 'at night': 12, night: 12, tonight: 12 } }),
      ...wordTimeRules({ morning: ['in the morning', 'morning', 'first thing'], noon: ['at noon', 'noon', 'midday', 'at lunch', 'lunchtime'], afternoon: ['in the afternoon', 'afternoon'], evening: ['in the evening', 'evening', 'tonight', 'at night', 'night', 'before bed'] }, { morning: 8, noon: 12, afternoon: 15, evening: 19 }),
    ],
    repeat: [
      weeklyOnRule(['every', 'each', 'on every'], WEEKDAYS.names, { suffix: ['s'] }),
      monthlyOnRule(/\b(?:on )?(?:the )?(\d{1,2}(?:st|nd|rd|th)?|first|fifteenth|last) (?:day )?of (?:every|each|the) month\b/iu, { ...ORDINAL_WORDS_EN, last: 31 }),
      repeatWords(['every morning', 'each morning', 'mornings'], 'daily', 8),
      repeatWords(['every evening', 'each evening', 'every night', 'each night', 'nightly', 'evenings'], 'daily', 20),
      repeatWords(['every afternoon', 'each afternoon'], 'daily', 15),
      repeatWords(['every day', 'each day', 'daily', 'everyday'], 'daily'),
      repeatWords(['every week', 'each week', 'weekly', 'once a week'], 'weekly'),
      repeatWords(['every month', 'each month', 'monthly', 'once a month'], 'monthly'),
    ],
    day: [
      ISO_RULE,
      dayWords(['the day after tomorrow', 'day after tomorrow'], 2),
      dayWords(['tomorrow', 'tmrw'], 1),
      dayWords(['today', 'later today', 'tonight', 'this evening', 'this afternoon', 'this morning'], 0),
      futureWeekdayRule(WEEKDAYS.names, { pre: ['next', 'on next', 'this coming', 'coming', 'on', 'this', 'by'], nextWords: ['next', 'coming'] }),
      monthDayRule(MONTHS, { pre: ['on', 'by'], ordinal: '(?:st|nd|rd|th)?', future: true }),
      dayMonthRule(MONTHS, { pre: ['on', 'on the', 'the', 'by the'], between: ['of'], ordinal: '(?:st|nd|rd|th)?', future: true }),
    ],
    dayLate: [futureDayOfMonthRule(/\b(?:on |by )?the (\d{1,2}(?:st|nd|rd|th)|first|second|third|fourth|fifth|tenth|fifteenth|twentieth|thirtieth|thirty[- ]first|twenty[- ]first|twenty[- ]fifth)\b/iu, ORDINAL_WORDS_EN)],
    strip: [/^(?:(?:to|that|about|for|of|please|and|also|then|i need to|i have to|i should|i must|i've got to|i gotta)\s+)+/iu, /(?:\s+(?:please|thanks|thank you|ok|okay))+$/iu],
  },
  question: {
    // ("blow", "drop", "waste", "burn through" are spending too; "what's my grocery spending" keeps "grocery" for the target.)
    lead: /\b(?:(?:how much|what) (?:did|does|do|has|have|had|will) (?=.*\bcost(?:s|ed)?\b)|how much (?:money )?(?:was|has been|got|were|is being|have been) (?:spent|paid|blown)|(?:what|how much) (?:am i|are we|'m i) (?:spending|paying)|(?:have|did) (?:i|we) (?:spent|spend) (?:a lot|much|too much|anything|a bunch|loads)|what(?:'s| is| s|s| was) (?:my |the |our )?(?:total|spending|spend|expenses?)(?: (?:so far|spent|spending))?(?: (?:on|at|for|in))?|what(?:'s| is| s|s| was) (?:my |the |our )?(?=\p{L}+ (?:spending|spend|total)\b)|how much (?:money |cash )?(?:(?:have|did|do|had) (?:i|we) |i've |i have |we've |we |i )?(?:spent|spend|paid|pay|used|blown|blew|blow|dropped|drop|wasted|waste|burned|burnt|burn|shelled out|shell out|forked out|fork out|gone through|go through)|what (?:(?:have|did|do) (?:i|we) |i've |i |we )(?:spent|spend|paid|pay|blown|blow|blew|dropped|drop|wasted|waste)|how much (?:money )?(?:has|have|had) (?:gone|went) (?:to|on|into|for)|how much (?:money )?(?:went|goes) (?:to|on|into|for)|(?:my |the )?(?:total|overall) spending|how much (?:money |cash )?(?:on|at|for)|(?:what|how much) (?:is|was|are) my (?:spending|spend|expenses)|(?:what|how much) (?:did|do) i owe|how much (?:i|we) (?:spent|spend))\b/u,
    incomeLead: /\b(?:how much (?:money )?(?:(?:have|did|do|had) (?:i|we) |i've |i have |we've |i |we )?(?:earned|earn|made|make|received|receive|brought in|bring in|got paid|get paid|gotten paid|been paid|taken in|take home|took home)|what (?:(?:have|did|do) (?:i|we) |i've |i )(?:earned|earn|made|make|received|receive|brought in|bring in|get paid|got paid|take home|took home)|what(?:'s| is| s| was| were) (?:my|our) (?:income|earnings|pay|take[- ]home)|how much (?:money )?(?:came|has come|had come|comes) in|(?:my |the )?(?:total|overall) income|what (?:is|was|are) my (?:income|earnings)|how much (?:income|money in))\b/u,
    recentDays: /\b(?:(?:in|over|for|during) )?(?:the )?(?:last|past|previous) (\d{1,3}) days?\b/u,
    // "in august", "last march", "back in may": a calendar month by name ("may" and the short forms only after a lead word)
    months: monthWords(
      { january: 0, february: 1, march: 2, april: 3, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11 },
      ['in', 'during', 'for', 'back in', 'over', 'throughout', 'last', 'this', 'the month of', 'in the month of'],
      { may: 4, jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 },
    ),
    periods: [
      periodWords(['until payday', 'till payday', 'before payday', 'until my next paycheck', 'till my next paycheck', 'until i get paid', 'till i get paid', 'until the end of the month', 'till the end of the month', 'this pay period', 'pay period', 'this pay cycle', 'pay cycle', 'this paycheck', 'since payday', 'since my last payday', 'since i got paid', 'since i was paid', 'since my last paycheck', 'since my paycheck', 'this budget period', 'budget period', 'this period'], 'budget'),
      periodWords(['over the weekend', 'this weekend', 'last weekend', 'the weekend', 'on the weekend', 'at the weekend', 'this past weekend', 'weekend'], 'weekend'),
      periodWords(['today', 'so far today', 'tonight', 'this morning', 'this afternoon', 'this evening'], 'today'),
      periodWords(['yesterday'], 'yesterday'),
      periodWords(['last week', 'the past week', 'past week', 'previous week', 'the previous week'], 'lastWeek'),
      periodWords(['this week', 'so far this week', 'week to date', 'the week'], 'week'),
      periodWords(['last month', 'the past month', 'past month', 'previous month', 'the previous month'], 'lastMonth'),
      periodWords(['this month', 'so far this month', 'month to date', 'the month'], 'month'),
      periodWords(['last year', 'the past year', 'past year', 'previous year', 'the previous year'], 'lastYear'),
      periodWords(['this year', 'so far this year', 'year to date', 'the year'], 'year'),
      periodWords(['all time', 'of all time', 'in total', 'altogether', 'overall', 'ever', 'so far', 'since the beginning', 'since the start', 'total'], 'all'),
    ],
    strip: [
      /^(?:(?:hey|hi|ok|okay|so|um|uh|well|quick question|can you|could you|would you|tell me|show me|give me|let me know|do you know|i want to know|i'd like to know|i wonder|i was wondering|whats|what's)[\s,]+)+/u,
      /\b(?:cost(?:s|ed)? (?:me|us)|cost(?:s|ed)?|a lot|too much|so much|that much)\b/gu,
      /^(?:(?:on|at|for|in|with|to|from|about|towards|toward|the|a|an|my|our|some|any|of|and|then|so|please|money|cash|did|do|i|we|have|has|is|was|are|were|been|over)\s+)+/u,
      // "how much have I saved for Japan": the putting-away verb goes, "Japan" stays and finds the transfers toward it.
      /^(?:(?:saved|put away|set aside|put aside|stashed|tucked away|squirreled away|contributed)\s+(?:for|toward|towards|into|in|to|on)|put (?:toward|towards|into|in|to))\s+/u,
      /(?:\s+(?:so far|in total|altogether|overall|please|thanks|thank you|again|now|money|cash|then|today|this|the|my))+$/u,
      // "what's my coffee total this week": the counting word after the thing is not part of the thing
      /(?:\s+(?:total|totals|spend|spending|spent|expenses?|costs?))+$/u,
      /\b(?:money|cash|dollars|bucks|spending|spend)\b/gu,
    ],
    // ("am I okay on groceries", "am I doing ok": how a plan is going; "groceries left?" is what is left of it.)
    remainingLead: /\b(?:(?:am i|are we) (?:still )?(?:doing )?(?:ok|okay|alright|all right|fine|good|alright)(?= (?:on|for|with|in)\b|\s*$)|(?<=\p{L} )left\s*$|how much (?:(?:more )?(?:room|wiggle room|spending money|money|cash|budget) )?(?:do (?:i|we) (?:still )?have|have (?:i|we) (?:still )?got|(?:i|we) (?:still )?have|is there)\b(?! (?:spent|paid|made|earned|saved|to pay))|what(?:'s| is| s|s| was) (?:my |the |our )?balance|what(?:'s| is| s|s) (?:still )?remaining|how (?:am i|are we|'m i|'re we) doing|how(?:'s| is| s|s) (?:my|the|our) (?:budget|spending|month|plan)|(?:am i|are we) (?:still )?(?:on|under|over|within|inside|in) (?:(?:my|the|our) )?(?:budget|plan)|(?:am i|are we) (?:still )?(?:over|under) (?:on|for|in|with)|(?:am i|are we) (?:still )?on track|how much (?:is|do i have|have i got) (?:still )?(?:left )?in (?:my|the|our)(?= (?:[\p{L} ]{1,30} )?(?:budget|plan)\b)|what (?:can|could) (?:i|we) (?:still )?spend|is there (?:(?:any(?:thing)?|much|money|any money|still) )*left|do (?:i|we) (?:still )?have (?:(?:any(?:thing)?|much|money|enough|any money) )*left|how much (?=(?:till|until|before) (?:payday|my next paycheck|i get paid|the end of the month))|what(?:'s| is| s|s)? (?:my |the |our )?(?:remaining|leftover)(?: (?:budget|money|plan|cash))?|(?:my |the )?remaining budget|how much (?:money |cash )?(?:do (?:i|we) (?:still )?have|have (?:i|we) got|(?:i|we) (?:still )?have|is there|is|are) (?:still )?left|how much (?:money |cash )?(?:is )?(?:still )?left|how much (?:more )?(?:money |cash )?(?:can|could) (?:i|we) (?:still )?spend|how much (?:more )?(?:money |cash )?(?:do (?:i|we) have|have (?:i|we) got) (?:left )?to spend|what(?:'s| is| s|s) (?:still )?left|what (?:do|have) (?:i|we) (?:got |still )?(?:got )?left|how much budget (?:do (?:i|we) have |is |have (?:i|we) got )?(?:still )?left|what(?:'s| is| s|s) (?:my|our|the)(?= (?:[\p{L} ]{1,30} )?(?:budget|plan)\b))\b/u,
    remainingWords: /\b(?:over(?=\s*$)|budgets?|plans?|left over|left|remaining|leftover|to spend|spend|available|still|money|cash|wiggle room|room|spending money|looking like|look like|looks like|looking|going|on track|track)\b/gu,
    compareBefore: /\b(?:the )?(?:week|month|year|day|weekend|period|one)s? (?:before|prior|previous)(?: that)?\b|\bbefore that\b|\bprior\b|\bbefore\b/iu,
    compareLead: /\b(?:(?:did|have|am|are|was|were) (?:i|we) (?:spent|spend|spending|been spending) (?:more|less)|(?:is|was|has) (?:my|our|the)(?= (?:\p{L}+ )?spending (?:been )?(?:up|down|higher|lower)\b)|how (?:does|do|did|is|has|am|are|'s)\b[^?]{0,40}?\bcompar(?:e|ed|ing)|compared? (?:to|with)|(?:more|less) than (?:last|the last|the previous|previous|before|usual)|how much more (?:did|have) (?:i|we) spen[dt]|more or less than)\b/u,
    topLead: /\b(?:what (?:did|do|have) (?:i|we) (?:spend|spent|spending) (?:the )?most (?:money )?on|what (?:am i|are we) spending (?:the )?most on|where (?:did|does|do|has|is) (?:most of )?(?:my|our|the) money (?:go|gone|going)|where (?:did|does|has) most of (?:it|my money|our money) (?:go|gone)|where (?:am i|are we) spending (?:the )?most|what(?:'s| is| was| are| were|s) (?:my|our|the) (?:biggest|largest|top|main) (?:expenses?|spending|categor(?:y|ies)|costs?)|what (?:costs|cost) (?:me|us) the most|(?:my|our|the) (?:biggest|largest|top) (?:expenses?|spending|categor(?:y|ies)))\b/u,
    affordLead: /\b(?:(?:can|could|should) (?:i|we) (?:still )?(?:afford|spend|get|buy|swing|manage|justify|stretch to)|(?:is|would|will) (?:it|that|this)? ?(?:be )?(?:ok|okay|fine|alright) (?:to (?:spend|buy|get) |if i (?:spend|buy|get) )?|do (?:i|we) (?:still )?have (?:enough|room) (?:for|to)|(?:will|would) (?:i|we) (?:still )?be (?:ok|okay|fine) if (?:i|we) (?:spend|buy|get)|can (?:i|we) (?:still )?fit|is there (?:still )?room for|(?:have i|have we|do i have|do we have) (?:got )?(?:enough )?room for)\b/u,
    askWords: /\b(?:more or less|more|less|than|compared? (?:to|with)|compared|comparing|compare|vs|versus|usual|so far|the most|most|biggest|largest|afford|the price of|up|down|higher|lower|been|spending|spend|spent|buy|get|money|on it|in it|doing|going)\b/gu,
    // ("coffee spend?", "coffee this week?": one or two words and a period, with no amount, ask for a total.)
    weakLead: /\b(?:(?:what(?:'s| is| s) )?(?:my |the |our )?(?:total|spending|spend|expenses?)(?: (?:spent|so far))?(?: (?:on|at|for|in))?|how much(?! (?:is|are|was|were|does|do|will|would|should) ))\b|^(?!(?:got|paid|spent|bought|sold|saved|put|sent|made|received|earned|lost|won|owe|owed|add|log|new)\b)(?=\p{L}+(?: \p{L}+)? (?:this|last|past) (?:week|month|year|weekend)\s*$)/u,
    groups: [
      { words: ['food', 'food and drink', 'food and drinks', 'eating', 'meals', 'groceries and eating out', 'groceries and dining', 'groceries and restaurants'], ids: ['groceries', 'dining'] },
    ],
  },
  correction: {
    notTail: /,?\s+(?:and )?not [$€£]?\d[\d.,]*(?: ?(?:dollars?|bucks|quid|euros?))?$/iu,
    // "it was 15 not 51": with the old number at the end, a plain "it was" is a fix to the last entry.
    tailLead: /^(?:(?:oh|oops|sorry|wait|hmm|ok|okay|no|nope|nah|actually)[, ]+)*(?:it|that|this|that one|the last one) (?:was|is|cost|should be|should have been)(?: actually| really)?\s+/iu,
    removeTarget: /^(?:(?:oh|oops|sorry|actually|wait|no|nope|nah|hmm|please|ok|okay)[, ]+)*(?:delete|remove|erase|scratch|cancel|drop|get rid of|take out|forget|undo|kill|ditch|zap|nix) (?:the |that |this |my |our )?(?<target>(?!that\b|this\b|it\b|last\b)[\p{L}' ]+?)(?: (?:one|1|entry|expense|purchase|item|charge|thing))?(?: please)?$/iu,
    targetLeads: [
      // "change the uber to 32", "move the lunch to groceries", "make the coffee 4.50"
      // ("put away 200 for a trip" and "set aside 200" are savings, not a change to an entry called "away".)
      /^(?:(?:oh|oops|sorry|wait|no|nope|nah|hmm|ok|okay)[, ]+)*(?:change|fix|correct|update|set|make|move|put|file) (?:the |that |this |my )?(?<target>(?!(?:away|aside|back|down|up|together|off|out|in)\b)[\p{L}' ]+?)(?: (?:to|into|as|under|in))? (?<rest>.+)$/iu,
      // "oops the uber was 32", "the uber was actually 32", "the uber should be 32", "that uber was 32 not 23": something
      // marks it as a fix. A plain "the dentist was 150" has no such mark and is a new entry.
      /^(?:(?:oh|oops|sorry|wait|hmm|ok|okay)[, ]+)+(?:the |that |my )(?<target>[\p{L}' ]+?) (?:was|is|cost|should be|should have been) (?:actually |really )?(?<rest>[$€£]?\d[\d.,]*(?: (?:dollars?|bucks?))?)(?:,? (?:not|and not|instead of|rather than) [$€£]?\d[\d.,]*)?$/iu,
      /^(?:the |that |my )(?<target>[\p{L}' ]+?) (?:(?:was|is|cost) (?:actually|really)|should (?:be|have been)) (?<rest>[$€£]?\d[\d.,]*(?: (?:dollars?|bucks?))?)(?:,? (?:not|and not|instead of|rather than) [$€£]?\d[\d.,]*)?$/iu,
      // "the groceries were 45 not 54", "drinks were 30 not 40": the old number at the end marks the fix, with or without an article
      /^(?:the |that |my )?(?<target>(?!(?:it|that|this|they)\b)[\p{L}' ]+?) (?:was|were|is|cost) (?<rest>[$€£]?\d[\d.,]*(?: (?:dollars?|bucks?))?),? (?:not|and not|instead of|rather than) [$€£]?\d[\d.,]*$/iu,
      // "no the uber was 32", "no wait the uber was 32" ("no wait that was 14" has no name and is read by `lead`)
      /^(?:(?:no|nope|nah|wait|oops|sorry|actually|hmm)[, ]+)+(?:the |that |my )?(?<target>(?!(?:that|it|this|wait)\b)[\p{L}' ]+?) (?:was|is|cost) (?:actually |really )?(?<rest>[$€£]?\d[\d.,]*(?: (?:dollars?|bucks?))?)(?:,? (?:not|instead of) [$€£]?\d[\d.,]*)?$/iu,
      // "i didn't spend 23 on uber it was 32"
      /^(?:(?:oh|oops|sorry|wait|no|nope|hmm)[, ]+)*i (?:didn't|did not|never) (?:spend|pay|spent|paid) [$€£]?\d[\d.,]* (?:on|for|at) (?:the |that )?(?<target>[\p{L}' ]+?),? (?:it was|it's|that was|i spent|i paid|it should be) (?<rest>[$€£]?\d[\d.,]*(?: (?:dollars?|bucks?))?)$/iu,
    ],
    remove: /^(?:(?:oh|oops|sorry|actually|wait|no|nope|nah|hmm|please|ok|okay)[, ]+)*(?:(?:delete|remove|erase|scratch|cancel|drop|get rid of|take out|forget|undo|kill|bin|ditch|trash|zap|nix) (?:that|this|it|that one|this one|that 1|this 1|the last (?:one|1|entry|thing|expense|purchase|item)|my last (?:one|1|entry|expense|purchase)|last entry|the last thing i said)|scratch that|forget it|never ?mind(?: (?:that|that one|the last one))?|delete|remove|undo)(?: please)?$/u,
    // ("no wait that was 14", "oops, that was 14": an opener makes "that was" a fix; a bare "that was 40 for gas" is an entry.)
    lead: /^(?:(?:oh|oops|sorry|wait|hmm|my bad|ok|okay|no|nope|nah)[, ]+)*(?:actually[, ]+(?:it was|that was|it's|that's|it is|that is|make (?:that|it)|change (?:that|it)(?: to)?|it should be|that should be)?|(?:make|change|fix|correct|update|switch|set) (?:(?:the|that|my) last (?:one|1|entry)|that|it|this)(?: (?:to|into|as))?|(?:that|it) should (?:be|have been)|(?:that|it) (?:was|is) (?:actually|really)|(?:put|move|file) (?:that|it|this|the last (?:one|1)) (?:under|in|into|as|to)|correction:?|i meant|(?:the )?wrong (?:amount|number|price|category|date|day)[,:]?|(?:it|that) was (?=(?:yesterday|today|on |last |the day before))|(?:no|nope|nah|wait|oops|sorry|hmm)[, ]+(?:(?:oh|wait|hmm|no|nope)[, ]+)*(?:that|it|that one|the last one) (?:was|is|should be|should have been)(?= [$€£¥]?\d)|(?:no|nope|nah|oops|sorry|wait|hmm|oh)[, ]+(?=[$€£¥]?\d)|(?:ok|okay|uh|um|yeah|yes|so)[, ]+(?=[$€£¥]?\d[\d.,]*(?: ?(?:dollars?|bucks|quid|euros?|pounds?))?\s*$))\s*/u,
  },
  contextualStrings: ['dollars', 'bucks', 'groceries', 'rent', 'paycheck', 'goal', 'Netflix', 'Uber', 'how much have I spent'],
};
