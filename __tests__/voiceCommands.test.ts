import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';
import { parseEntries, type ParseContext } from '@/parser';
import { parseVoiceCommand } from '@/parser/commandRules';
import { genderOf, pickVoice } from '@/lib/voices';
import { greeting } from '@/lib/personas';

const ctx = (language = 'en'): ParseContext => ({ categories: DEFAULT_CATEGORIES, goals: [], keywordMap: {}, today: '2026-09-16', language });

describe('spoken voice commands', () => {
  it.each([
    ['switch to the coach', { voice: 'coach' }],
    ['Talk to me like a best friend', { voice: 'friend' }],
    ['roast me', { voice: 'roaster' }],
    ['use the roaster voice', { voice: 'roaster' }],
    ['plain voice', { voice: 'plain' }],
    ['turn off the voice', { voice: 'plain' }],
    ['no jokes please', { voice: 'plain' }],
    ['female voice', { gender: 'female' }],
    ['use a male voice', { gender: 'male' }],
    ["I want a man's voice", { gender: 'male' }],
    ['be nicer', { attitude: 'nice' }],
    ['go easy on me', { attitude: 'nice' }],
    ['roast me harder', { voice: 'roaster', attitude: 'spicy' }],
    ['switch to the coach and make it spicy', { voice: 'coach', attitude: 'spicy' }],
    ['female roaster voice please', { voice: 'roaster', gender: 'female' }],
  ])('%s', (text, expected) => {
    expect(parseVoiceCommand(text)).toEqual(expected);
  });
  it('leaves entries and ordinary notes alone', () => {
    for (const text of ['spent 12 on lunch', 'coffee with a friend 4.50', 'spicy ramen 14', 'paid the coach 60', 'dinner with a male friend 40', 'friend', 'coach', 'lunch with my friend', 'the man at the market']) {
      expect(parseVoiceCommand(text)).toBeNull();
    }
  });
  it('becomes a command result in the parser, English only, and never an entry', () => {
    const [r] = parseEntries('switch to the coach', ctx());
    expect(r.kind).toBe('command');
    expect(r.command).toEqual({ voice: 'coach' });
    expect(r.amount).toBeNull();
    expect(parseEntries('switch to the coach', ctx('es'))[0].kind).not.toBe('command');
    expect(parseEntries('spent 12 on lunch with a friend', ctx())[0].kind).not.toBe('command');
  });
  it('has a greeting for every voice, in English only', () => {
    for (const v of ['plain', 'friend', 'coach', 'roaster'] as const) {
      expect(greeting(v, 'en', () => 0)!.length).toBeGreaterThan(5);
      expect(greeting(v, 'de')).toBeNull();
    }
  });
});

describe('picking a spoken voice', () => {
  const voices = [
    { identifier: 'com.apple.voice.compact.en-US.Samantha', name: 'Samantha', language: 'en-US', quality: 'Default' },
    { identifier: 'com.apple.voice.compact.en-GB.Daniel', name: 'Daniel', language: 'en-GB', quality: 'Default' },
    { identifier: 'com.apple.voice.enhanced.en-US.Evan', name: 'Evan', language: 'en-US', quality: 'Enhanced' },
    { identifier: 'es-es-x-eed#female_1-local', name: 'es-es-x-eed#female_1-local', language: 'es-ES' },
    { identifier: 'es-es-x-eee#male_2-local', name: 'es-es-x-eee#male_2-local', language: 'es-ES' },
    { identifier: 'Google UK English Female', name: 'Google UK English Female', language: 'en-GB' },
    { identifier: 'de-DE-x-nfh', name: 'de-DE-x-nfh', language: 'de-DE' },
  ];
  it('reads gender from names', () => {
    expect(genderOf('Samantha')).toBe('female');
    expect(genderOf('Daniel')).toBe('male');
    expect(genderOf('es-es-x-eed#female_1-local')).toBe('female');
    expect(genderOf('Google UK English Male')).toBe('male');
    expect(genderOf('de-DE-x-nfh')).toBeNull();
  });
  it('prefers the wanted gender in the exact language, then the same language', () => {
    expect(pickVoice(voices, 'en-US', 'female')).toBe('com.apple.voice.compact.en-US.Samantha');
    expect(pickVoice(voices, 'en-US', 'male')).toBe('com.apple.voice.enhanced.en-US.Evan');
    expect(pickVoice(voices, 'en-GB', 'male')).toBe('com.apple.voice.compact.en-GB.Daniel');
    expect(pickVoice(voices, 'es-ES', 'male')).toBe('es-es-x-eee#male_2-local');
    expect(pickVoice(voices, 'es-ES', 'female')).toBe('es-es-x-eed#female_1-local');
  });
  it('takes any voice of the language when the gender is unknown, and none of another language', () => {
    expect(pickVoice(voices, 'de-DE', 'male')).toBe('de-DE-x-nfh');
    expect(pickVoice(voices, 'ja-JP', 'female')).toBeNull();
  });
});

describe('ordinary phrases are not voice commands', () => {
  it.each(['nice dinner', 'lunch with a lady', 'coffee with the guy', 'spicy'])('"%s" is left alone', (text) => {
    expect(parseVoiceCommand(text)).toBeNull();
    expect(parseEntries(text, ctx())[0].kind).not.toBe('command');
  });
});
