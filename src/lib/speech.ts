import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useLanguageCode, useT } from '@/i18n';
import { getPack } from '@/parser/packs';
import { stopSpeaking } from '@/lib/speak';

/** Errors after which asking again without on-device recognition can still work (the model is not downloaded). */
const ON_DEVICE_FAILURES = new Set(['language-not-supported', 'network', 'service-not-allowed', 'client']);

export interface VoiceState {
  available: boolean;
  onDevice: boolean;
  listening: boolean;
  transcript: string;
  error: string | null;
}

/**
 * Wraps the platform speech recognizer. Prefers on-device recognition when the
 * device supports it (offline, nothing leaves the phone). Calls `onFinal` once
 * with the finished transcript.
 */
export function useVoiceInput(onFinal: (text: string) => void) {
  const t = useT();
  const language = useLanguageCode();
  const [state, setState] = useState<VoiceState>({ available: false, onDevice: false, listening: false, transcript: '', error: null });
  const finalRef = useRef(onFinal);
  finalRef.current = onFinal;
  const deliveredRef = useRef(false);
  const lastTranscriptRef = useRef('');
  // A second tap before the recognizer reports "start" would start it twice.
  const startingRef = useRef(false);
  // Whether this attempt asked for on-device recognition, and whether it already fell back once.
  const onDeviceAttemptRef = useRef(false);
  const fellBackRef = useRef(false);

  useEffect(() => {
    let available = false;
    let onDevice = false;
    try {
      // iOS answers for the phone's default language, not the app's: the mic stays, and starting reports
      // plainly if this language cannot be heard.
      available = Platform.OS === 'ios' ? true : ExpoSpeechRecognitionModule.isRecognitionAvailable();
      onDevice = ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
    } catch {
      available = false;
    }
    setState((s) => ({ ...s, available, onDevice }));
  }, []);

  useSpeechRecognitionEvent('start', () => {
    startingRef.current = false;
    deliveredRef.current = false;
    lastTranscriptRef.current = '';
    setState((s) => ({ ...s, listening: true, transcript: '', error: null }));
  });

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    lastTranscriptRef.current = text;
    setState((s) => ({ ...s, transcript: text }));
    if (event.isFinal && text.trim() && !deliveredRef.current) {
      deliveredRef.current = true;
      finalRef.current(text.trim());
    }
  });

  useSpeechRecognitionEvent('end', () => {
    startingRef.current = false;
    setState((s) => ({ ...s, listening: false }));
    // iOS leaves the audio session in record mode, which keeps someone's music or podcast stopped and makes
    // a spoken answer quiet; handing it back lets the other app resume.
    if (Platform.OS === 'ios') {
      try { ExpoSpeechRecognitionModule.setAudioSessionActiveIOS(false, { notifyOthersOnDeactivation: true }); } catch { /* already inactive */ }
    }
    // Some recognizers end without an isFinal result; deliver what we have.
    const text = lastTranscriptRef.current.trim();
    if (text && !deliveredRef.current) {
      deliveredRef.current = true;
      finalRef.current(text);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    const friendly: Record<string, string> = {
      'not-allowed': t.voiceErrors.notAllowed,
      'no-speech': t.voiceErrors.noSpeech,
      network: t.voiceErrors.network,
      'language-not-supported': t.voiceErrors.language,
      'service-not-allowed': t.voiceErrors.unavailable,
      'audio-capture': t.voiceErrors.audio,
      'speech-timeout': t.voiceErrors.noSpeech,
      busy: t.voiceErrors.unavailable,
      client: t.voiceErrors.unavailable,
    };
    startingRef.current = false;
    if (event.error === 'aborted' || event.error === 'interrupted') {
      setState((s) => ({ ...s, listening: false }));
      return;
    }
    // On-device recognition fails outright when this language's model is not on the phone (Android): ask once
    // more with the phone's ordinary recognizer instead of telling the person voice does not work.
    if (onDeviceAttemptRef.current && !fellBackRef.current && !deliveredRef.current && ON_DEVICE_FAILURES.has(event.error)) {
      fellBackRef.current = true;
      launch(false);
      return;
    }
    setState((s) => ({ ...s, listening: false, error: friendly[event.error] ?? t.voiceErrors.generic }));
  });

  const launch = (onDevice: boolean) => {
    const pack = getPack(language);
    onDeviceAttemptRef.current = onDevice;
    try {
      ExpoSpeechRecognitionModule.start({
        lang: pack.speechTag,
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: onDevice,
        addsPunctuation: false,
        iosTaskHint: 'dictation',
        contextualStrings: pack.contextualStrings,
      });
    } catch {
      // A recognizer that refuses the request outright never sends an error event,
      // so say so here rather than leaving the mic looking as if it is listening.
      startingRef.current = false;
      setState((s) => ({ ...s, listening: false, error: t.voiceErrors.unavailable }));
    }
  };

  const start = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    setState((s) => ({ ...s, error: null }));
    // An answer still being read aloud would be heard by the mic.
    await stopSpeaking().catch(() => {});
    // Asking for the microphone can itself fail (a work profile that forbids it): said like any other error.
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync().catch(() => ({ granted: false }));
    if (!perm.granted) {
      startingRef.current = false;
      setState((s) => ({ ...s, error: t.voiceErrors.notAllowed }));
      return;
    }
    let onDevice = false;
    try {
      onDevice = ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
    } catch {
      onDevice = false;
    }
    fellBackRef.current = false;
    launch(onDevice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, t]);

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const cancel = useCallback(() => {
    deliveredRef.current = true; // suppress delivery
    ExpoSpeechRecognitionModule.abort();
    setState((s) => ({ ...s, listening: false, transcript: '' }));
  }, []);

  const clearError = useCallback(() => setState((s) => ({ ...s, error: null })), []);

  return { ...state, start, stop, cancel, clearError };
}

/** Starts the Android offline model download and returns a sentence for the user, built from the caller's locale strings. */
export async function triggerOfflineModelDownload(language: string, text: { ready: string; status: (status: string) => string; failed: (message: string) => string }): Promise<string> {
  try {
    const result = await ExpoSpeechRecognitionModule.androidTriggerOfflineModelDownload({ locale: getPack(language).speechTag });
    return result.status === 'download_success' ? text.ready : text.status(String(result.status));
  } catch (e) {
    return text.failed((e as Error).message);
  }
}
