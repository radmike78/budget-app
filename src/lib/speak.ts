/**
 * Reads an answer aloud with the phone's own text-to-speech. Nothing is sent
 * anywhere: expo-speech uses the on-device voices (and the browser's on the web).
 */
import * as Speech from 'expo-speech';
import { getPack } from '@/parser/packs';

let speaking = false;

export async function speak(text: string, language: string): Promise<void> {
  const clean = text.replace(/\s+/g, ' ').trim().slice(0, 500);
  if (!clean) return;
  try {
    if (speaking) await Speech.stop();
    speaking = true;
    Speech.speak(clean, {
      language: getPack(language).speechTag,
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
