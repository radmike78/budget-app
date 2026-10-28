import type { TxType, Frequency } from '@/types';

/** A date rule: regex over normalized text, resolver returns YYYY-MM-DD or null. */
import type { ReminderPack } from './reminderRules';
import type { QuestionPack } from './questionRules';

export interface DateRule {
  re: RegExp;
  resolve: (m: RegExpMatchArray, todayStr: string) => string | null;
}

/**
 * Everything the parser needs to understand one language. Packs are plain
 * data plus a few small functions, so adding a language is one file.
 */
export interface LanguagePack {
  code: string;
  /** BCP-47 tag handed to the speech recognizer. */
  speechTag: string;
  /** 'space' languages split on whitespace; 'cjk' languages are matched by substring. */
  tokenizer: 'space' | 'cjk';
  /** True when "12,50" means twelve and a half. */
  decimalComma: boolean;
  /** Turns spoken number words into digits ("twelve" -> "12"). Runs after normalize(). */
  numberWords: (text: string) => string;
  /** Currency symbols/words that mark a number as money. */
  currencyMarkers: RegExp;
  /** Words that should be dropped from notes. */
  currencyWords: RegExp;
  incomeVerbs: string[];
  expenseVerbs: string[];
  /** category id -> keywords/phrases (lowercase). */
  keywords: Record<string, string[]>;
  stopwords: string[];
  pastDateRules: DateRule[];
  futureDateRules: DateRule[];
  /** "goal:" style lead-ins at the start of the phrase. */
  goalLead: RegExp;
  /** "I want to save", "save up" ... */
  goalIntent: RegExp;
  /** Past-tense saving verbs that turn a phrase into a contribution rather than a new goal. */
  goalPastVerbs: RegExp;
  /** "200 a month", "50 a week": an amount said per period is a pace, not a goal's total. */
  perPeriod?: RegExp;
  /** Words that may follow a bare number without making it a count ("12 on lunch" is money; "2 coffees 8" is two coffees). */
  countStop?: RegExp;
  /** Verbs that mean paying down a debt ("pay off", "rembourser", "还清"). Present or future forms only. */
  debtIntent: RegExp;
  /** Nouns that name a debt ("credit card", "loan", "借金"). */
  debtWords: RegExp;
  /** Verbs that mean "add money to a goal". */
  contributionVerbs: RegExp;
  /** Prepositions that introduce the goal name: "to|toward|into|for". Must be a capturing-friendly alternation without groups. */
  contributionPreps: string;
  /** Word(s) meaning "for" that introduce a goal's name. */
  forWords: string;
  /** Words meaning "goal" that may trail a name. */
  goalWords: string;
  /** Generic words around a goal's name when paying into it ("the Japan fund", "my Japan savings"); whole words. */
  goalNouns?: RegExp;
  /**
   * Income verbs that mean a paycheck when nothing else is said: "me pagaron 2400", "cobré 1500" (Spanish has no
   * "got paid" of its own). With anything said after them ("de un cliente") the words decide, as usual.
   */
  bareIncomeIsPay?: RegExp;
  /**
   * A time phrase that holds an income word ("last payday", "since payday"): taken out before the type and the
   * category are read, so "spent 40 on groceries last payday" is spending. Kept in the note. Global.
   */
  notIncome?: RegExp;
  /**
   * In a sentence with several entries, a later one that says only this ("uber to the airport 45 and back 50":
   * "back") is the same kind of thing as the one before and takes its category. Anchored; matched against the note.
   */
  continuation?: RegExp;
  /**
   * "2 coffees 4 each", "half of 50": `each` follows a unit price after a count and a word, `half` precedes a number.
   * "3 x 5" and "4 x3" are read in every language. Optional.
   */
  multiply?: { each?: RegExp; half?: RegExp };
  /** Which frequency a `perPeriod` phrase names ("every month" → monthly); a phrase that matches none (per paycheck) makes no repeat. Optional. */
  repeatOf?: Partial<Record<Frequency, RegExp>>;
  /** Words standing for a goal just mentioned ("it", "that one", "the goal"): the newest open goal. Optional. */
  goalPronoun?: RegExp;
  /** Words stripped from the start of a goal name. */
  articles: RegExp;
  /** Filler stripped from the start / end of a note. */
  leadingFiller: RegExp;
  trailingFiller: RegExp;
  /** Extra patterns removed from notes (CJK particles, etc.). */
  noteStrip: RegExp[];
  /** Words that flag a plural/singular variant lookup (space tokenizer only). */
  singularForms?: (word: string) => string[];
  /** Short phrases the recognizer should bias toward. */
  contextualStrings: string[];
  /** Separators between several entries in one sentence ("and", ",", "y", "und", "和"). Regex alternatives. */
  listSeparators: string[];
  /** Spoken reminders: lead phrases, clock times, repeat words, future days. */
  reminder: ReminderPack;
  /** Spoken questions about spending: lead phrases, period words, leftovers to strip. */
  question: QuestionPack;
  /** Fixing the last entry by voice: "actually it was 14", "make that dining", "delete that". */
  correction?: CorrectionPack;
}

export interface CorrectionPack {
  /** The whole utterance removes the last entry ("delete that", "scratch that", "never mind"). Anchored. */
  remove: RegExp;
  /** The whole utterance removes a named entry: "forget the spotify one", "delete the uber". Group `target`. Anchored. */
  removeTarget?: RegExp;
  /**
   * Whole utterances that change a named entry: "that uber was 32 not 23", "change the uber to 32",
   * "i didn't spend 23 on uber it was 32". Groups `target` (the entry's words) and `rest` (the new value). Anchored.
   */
  targetLeads?: RegExp[];
  /** A trailing "not 12" / "non 12" (the number being corrected), dropped before anything else is read. */
  notTail?: RegExp;
  /**
   * With `notTail` present, a start that makes the utterance a fix only because the old number follows
   * ("it was 15 not 51": "it was"). Anchored; what follows is the new value. Without the tail, `lead` decides.
   */
  tailLead?: RegExp;
  /**
   * The start of an utterance that changes the last entry ("actually it was", "make that", "change it to").
   * Must match at the start. What follows may only be a new amount, category or date, with filler words.
   */
  lead: RegExp;
}

export type KeywordEntry = { categoryId: string; kind: TxType };
