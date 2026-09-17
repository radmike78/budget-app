export type TxType = 'income' | 'expense';
export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly';
export type ThemeSetting = 'system' | 'light' | 'dark';
/** The accent colour family: sage (default), ocean, plum or clay. */
export type Accent = 'sage' | 'ocean' | 'plum' | 'clay';
/** Budget by calendar month, or from one payday to the next (paydays come from repeating income). */
export type BudgetPeriodMode = 'month' | 'pay';
/** What happens to a category's unspent plan when a period ends. */
export type Rollover = 'reset' | 'carry' | 'ask';

/** One budget period, inclusive local dates. */
export interface Period {
  start: string;
  end: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TxType;
  categoryId: string | null;
  note: string | null;
  rawInput: string | null;
  /** YYYY-MM-DD (local calendar date) */
  occurredAt: string;
  /** ISO timestamp */
  createdAt: string;
  isRecurringInstance: boolean;
  recurringRuleId: string | null;
  /** Set on lines imported from a statement: used to skip the same line twice. */
  fingerprint?: string | null;
  importId?: string | null;
}

export type DebtType = 'credit_card' | 'personal_loan' | 'student_loan' | 'auto_loan' | 'mortgage' | 'line_of_credit' | 'other';

/** A debt the user owes, from a credit report, a card statement, or typed in. */
export interface Debt {
  id: string;
  creditor: string;
  type: DebtType;
  balance: number;
  monthlyPayment: number | null;
  creditLimit: number | null;
  /** Percent per year */
  apr: number | null;
  source: 'credit_report' | 'card_statement' | 'manual';
  updatedAt: string;
}

/** A statement the user imported, for the history list. */
export interface ImportRecord {
  id: string;
  kind: 'bank' | 'card' | 'credit_report';
  fileName: string;
  periodStart: string | null;
  periodEnd: string | null;
  count: number;
  importedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  kind: TxType;
  monthlyLimit: number | null;
  /** Unspent plan at the end of a period: start fresh (default), carry it over, or ask. */
  rollover?: Rollover | null;
  /** Start of the period in which carrying over was switched on; earlier periods never carry. */
  rolloverSince?: string | null;
  isDefault: boolean;
  archived: boolean;
  sortOrder: number;
}

export interface RecurringRule {
  id: string;
  amount: number;
  type: TxType;
  categoryId: string | null;
  frequency: Frequency;
  /** YYYY-MM-DD */
  nextOccurrence: string;
  /** Day of month the rule was set on (1-31), so a monthly rule on the 31st returns to the 31st after February. */
  anchorDay?: number | null;
  note: string | null;
  active: boolean;
}

export type GoalKind = 'saving' | 'debt';

export type ReminderRepeat = 'none' | 'daily' | 'weekly' | 'monthly';

/** A spoken or typed reminder, delivered as a local notification. */
export interface Reminder {
  id: string;
  text: string;
  /** YYYY-MM-DD of the first (or only) time it fires */
  date: string;
  /** HH:MM, 24-hour, local time */
  time: string;
  repeat: ReminderRepeat;
  /** Id of the scheduled notification; null when notifications are not allowed. */
  notificationId: string | null;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  /** Save up toward something, or pay down a debt. */
  kind: GoalKind;
  targetAmount: number;
  currentAmount: number;
  /** YYYY-MM-DD or null */
  targetDate: string | null;
  createdAt: string;
  completed: boolean;
}

export interface Settings {
  currency: string;
  theme: ThemeSetting;
  lastBackupAt: string | null;
  startingBalance: number | null;
  onboardingDone: boolean;
  reminderEnabled: boolean;
  /** 0-23, local time */
  reminderHour: number;
  /** Tier 2 parsing assist (off by default; needs the user's own API key). */
  smartParseEnabled: boolean;
  /** 'system' or a language code ('en', 'es', ...). */
  language: string;
  /** Ask for the phone's biometrics or passcode when the app opens. */
  appLockEnabled: boolean;
  /** How answers to spoken questions are given: on screen, read aloud, or aloud only when asked by voice. */
  answerMode: AnswerMode;
  /** Calendar months, or payday to payday. */
  budgetPeriod: BudgetPeriodMode;
  /** One optional plan for all spending in a period, on top of any per-category limits. */
  overallLimit: number | null;
  voice: Voice;
  attitude: Attitude;
  voiceGender: VoiceGender;
  accent: Accent;
}

/** The user's answer to "carry over what was left?" for one category and one period (its start date). */
export interface CarryDecision {
  categoryId: string;
  period: string;
  amount: number;
}

export type AnswerMode = 'auto' | 'text' | 'speak';
/** How the app talks back after an entry. Plain is the app as it is; the others add one line. */
export type Voice = 'plain' | 'friend' | 'coach' | 'roaster';
/** How far a voice is allowed to go. There is deliberately nothing past spicy. */
export type Attitude = 'nice' | 'playful' | 'spicy';
/** Which of the phone's own text-to-speech voices reads answers and lines aloud. */
export type VoiceGender = 'female' | 'male';

/** A learned word -> category mapping, created when the user corrects a parsed category. */
export interface KeywordMapping {
  word: string;
  categoryId: string;
}

export interface CategoryTotal {
  categoryId: string | null;
  total: number;
  count: number;
}

export interface MonthStats {
  /** YYYY-MM of the period's first day. */
  month: string;
  /** The exact range the totals cover: a calendar month, or a pay period. */
  period: Period;
  income: number;
  expenses: number;
  byCategory: CategoryTotal[];
}
