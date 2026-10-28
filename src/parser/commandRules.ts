/**
 * Spoken settings changes for the voice: "switch to the coach", "female voice",
 * "plain voice", "be nicer", "roast me harder". English only for now. A command
 * is applied at once and never saved as an entry. Pure: no React Native.
 */
import type { Attitude, Voice, VoiceGender } from '@/types';

export interface VoiceCommand {
  voice?: Voice;
  attitude?: Attitude;
  gender?: VoiceGender;
  /** "pause netflix", "resume the gym", "delete the spotify subscription": a repeating entry, found by its words in `useEntryFlow`. */
  rule?: { action: 'pause' | 'resume' | 'remove'; target: string };
  /** "mark the trip goal done", "reopen the car fund": a goal by its id. */
  goal?: { action: 'done' | 'reopen'; id: string };
  /** "same again", "another coffee": the last entry (matching the words, if any) opens in a card dated today. */
  again?: { target: string | null };
  /** "switch to spanish", "change currency to euros", "dark mode": a setting, applied at once. */
  language?: string;
  currency?: string;
  theme?: 'system' | 'light' | 'dark';
  /** "what can I say", "help": the Help screen. */
  help?: boolean;
}

/** Something must say this is about the voice, or the sentence is an entry. */
const LEAD = /\b(switch|change|set|use|make it|talk to me|talk like|be|go|turn (?:on|off)|i want|give me|let'?s (?:try|go with|have)|sound like|voice|persona|personality|tone|attitude)\b/i;
const VOICES: [RegExp, Voice][] = [
  [/\b(roaster|roast me|roast mode|savage|sassy|snarky)\b/i, 'roaster'],
  [/\bcoach\b/i, 'coach'],
  [/\b(best friend|friend|buddy|pal)\b/i, 'friend'],
  [/\b(plain|no voice|voice off|turn off the voice|quiet|be quiet|stop talking|no jokes|no personality|just the facts|silent)\b/i, 'plain'],
];
const ATTITUDES: [RegExp, Attitude][] = [
  [/\b(spicy|spicier|harder|meaner|more savage|ruthless|brutal|savage)\b/i, 'spicy'],
  [/\b(nice|nicer|gentle|gentler|kind|kinder|softer|easy on me|go easy|calm down)\b/i, 'nice'],
  [/\b(playful|medium|normal|regular|middle)\b/i, 'playful'],
];
const GENDERS: [RegExp, VoiceGender][] = [
  [/\b(female|woman|woman's|womans|lady|girl|feminine|her voice)\b/i, 'female'],
  [/\b(male|man|man's|mans|guy|masculine|his voice)\b/i, 'male'],
];

/** True when the sentence looks like an entry (money) rather than a request about the voice. */
function looksLikeEntry(text: string): boolean {
  return /\d/.test(text) || /[$€£¥₩]/.test(text);
}

export function parseVoiceCommand(input: string): VoiceCommand | null {
  const text = input.trim().toLowerCase();
  if (!text || looksLikeEntry(text)) return null;
  const cmd: VoiceCommand = {};
  for (const [re, v] of VOICES) if (re.test(text)) { cmd.voice = v; break; }
  for (const [re, a] of ATTITUDES) if (re.test(text)) { cmd.attitude = a; break; }
  // "female" contains "male": check the longer word first, which GENDERS already does.
  for (const [re, g] of GENDERS) if (re.test(text)) { cmd.gender = g; break; }
  if (cmd.voice === undefined && cmd.attitude === undefined && cmd.gender === undefined) return null;
  // "spicy" on its own could be a meal, "friend" or "lady" a note ("nice dinner", "lunch with a lady").
  // Ask for a lead word or "voice", except for the few phrases that can only be about the voice.
  if (!LEAD.test(text) && !/\b(roast me|plain|quiet|no jokes|stop talking|be quiet|silent)\b/i.test(text)) return null;
  return cmd;
}
