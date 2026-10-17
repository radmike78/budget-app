/**
 * Picks one of the phone's own text-to-speech voices by language and gender.
 * expo-speech does not expose gender, so it is read from the voice's name:
 * Android names carry "female"/"male", iOS and browsers use well-known names.
 * Pure: no React Native.
 */
import type { VoiceGender } from '@/types';

export interface TtsVoice {
  identifier: string;
  name: string;
  language: string;
  quality?: string;
}

const FEMALE_NAMES = ['samantha', 'karen', 'moira', 'tessa', 'fiona', 'victoria', 'nicky', 'ava', 'allison', 'susan', 'zoe', 'zoé', 'joelle', 'kate', 'serena', 'martha', 'shelley', 'sandy', 'flo', 'grandma', 'kathy', 'princess', 'veena', 'lekha', 'monica', 'paulina', 'mónica', 'amelie', 'amélie', 'audrey', 'aurelie', 'marie', 'anna', 'petra', 'helena', 'alice', 'federica', 'kyoko', 'o-ren', 'yuna', 'sora', 'ting-ting', 'tingting', 'sin-ji', 'sinji', 'mei-jia', 'meijia', 'siri female', 'zira', 'hazel', 'susan', 'linda', 'heera', 'sabina', 'hortense', 'julie', 'hedda', 'katja', 'elsa', 'cosimo female', 'haruka', 'ayumi', 'heami', 'huihui', 'yaoyao', 'hanhan', 'tracy'];
const MALE_NAMES = ['daniel', 'alex', 'fred', 'rishi', 'aaron', 'arthur', 'evan', 'tom', 'oliver', 'gordon', 'ralph', 'bruce', 'junior', 'reed', 'rocko', 'eddy', 'jacques', 'thomas', 'nicolas', 'yannick', 'diego', 'jorge', 'juan', 'carlos', 'markus', 'yannick', 'luca', 'paolo', 'otoya', 'hattori', 'minsu', 'jinho', 'li-mu', 'limu', 'siri male', 'david', 'mark', 'george', 'james', 'ravi', 'pablo', 'raul', 'paul', 'claude', 'stefan', 'hans', 'cosimo', 'ichiro', 'kangkang', 'zhiwei', 'danny', 'sean', 'henry', 'ryan', 'guy', 'liam', 'william'];

/** Best guess at a voice's gender from its name; null when the name gives nothing away. */
export function genderOf(name: string): VoiceGender | null {
  const n = name.toLowerCase();
  if (/\bfemale\b|_female|#female|-female/.test(n)) return 'female';
  if (/\bmale\b|_male|#male|-male/.test(n)) return 'male';
  const words = n.replace(/[()_,-]/g, ' ').split(/\s+/);
  // A name is matched as a whole word: "ava" must not claim "Gustavo", nor "flo" "Florian".
  // Only the entries that are themselves phrases ("siri female") are looked for inside the name.
  const has = (entry: string) => (entry.includes(' ') ? n.includes(entry) : words.includes(entry));
  if (FEMALE_NAMES.some(has)) return 'female';
  if (MALE_NAMES.some(has)) return 'male';
  return null;
}

function sameLanguage(voiceLang: string, tag: string): number {
  const v = voiceLang.toLowerCase().replace('_', '-');
  const t = tag.toLowerCase();
  if (v === t) return 2;
  if (v.split('-')[0] === t.split('-')[0]) return 1;
  return 0;
}

/**
 * The identifier to hand to the speech engine, or null to let it choose. Prefers an exact
 * language match of the wanted gender, then the same language in the wanted gender, then any
 * voice of the language; never a voice of another language.
 */
export function pickVoice(voices: TtsVoice[], speechTag: string, gender: VoiceGender): string | null {
  let best: { id: string; score: number } | null = null;
  for (const v of voices) {
    const lang = sameLanguage(v.language ?? '', speechTag);
    if (lang === 0) continue;
    // Android's "-network" voices synthesise on Google's servers: an answer read aloud (amounts, places) would
    // leave the phone. Only voices that run on the device are used.
    if (/-network\b/i.test(v.identifier)) continue;
    const g = genderOf(v.name ?? '');
    const enhanced = v.quality && /enhanced|premium/i.test(v.quality) ? 1 : 0;
    const score = lang * 10 + (g === gender ? 20 : g === null ? 5 : 0) + enhanced;
    if (!best || score > best.score) best = { id: v.identifier, score };
  }
  return best?.id ?? null;
}
