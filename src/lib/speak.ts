/**
 * Reads an answer or a voice line aloud with the phone's own text-to-speech. Nothing is
 * sent anywhere: expo-speech uses the on-device voices (and the browser's on the web).
 * The voice is picked by the app language and the chosen gender (src/lib/voices.ts).
 */
import * as Speech from 'expo-speech';
import type { VoiceGender } from '@/types';
import { getPack } from '@/parser/packs';
import { pickVoice, type TtsVoice } from './voices';

let speaking = false;
let voicesCache: TtsVoice[] | null = null;

async function availableVoices(): Promise<TtsVoice[]> {
  if (voicesCache && voicesCache.length > 0) return voicesCache;
  try {
    const list = await Speech.getAvailableVoicesAsync();
    voicesCache = list.map((v) => ({ identifier: v.identifier, name: v.name, language: v.language, quality: v.quality }));
  } catch {
    voicesCache = [];
  }
  return voicesCache;
}

export async function speak(text: string, language: string, gender: VoiceGender = 'female'): Promise<void> {
  const clean = text.replace(/\s+/g, ' ').trim().slice(0, 500);
  if (!clean) return;
  try {
    if (speaking) await Speech.stop();
    const tag = getPack(language).speechTag;
    const voice = pickVoice(await availableVoices(), tag, gender);
    speaking = true;
    Speech.speak(clean, {
      language: tag,
      ...(voice ? { voice } : null),
      onDone: () => { speaking = false; },
      onStopped: () => { speaking = false; },
      onError: () => { speaking = false; },
    });
  } catch {
    speaking = false;
  }
}

export async function stopSpeaking(): Promise<void> {
  try { await Speech.stop(); } catch { /* no voice engine */ }
  speaking = false;
}
