import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Optional app lock (OWASP MASVS-AUTH): the phone's own biometrics or passcode
 * guard the app when it opens or comes back from the background. No secret is
 * stored by the app; the OS answers yes or no.
 */
export async function canUseAppLock(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const [hardware, enrolled, level] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.getEnrolledLevelAsync(),
    ]);
    // A device passcode alone is enough; biometrics are a bonus.
    return level !== LocalAuthentication.SecurityLevel.NONE && (hardware ? enrolled || level > 0 : level > 0);
  } catch {
    return false;
  }
}

export async function authenticate(prompt: string, cancel: string): Promise<boolean> {
  return (await authenticateWithReason(prompt, cancel)) === 'ok';
}

/**
 * `unavailable` means the phone itself has no lock any more (the passcode was removed, nothing enrolled):
 * asking again can never succeed, so the caller must not keep the app shut behind it. The data is only
 * on this phone, so being locked out would mean losing all of it.
 */
let prompting = false;
/** True while the system's unlock prompt is up (it moves the app to "inactive"; that is not time away). */
export function isPrompting(): boolean {
  return prompting;
}

export async function authenticateWithReason(prompt: string, cancel: string): Promise<'ok' | 'failed' | 'unavailable'> {
  if (Platform.OS === 'web') return 'ok';
  prompting = true;
  try {
    return await ask(prompt, cancel);
  } finally {
    // The "active" that follows the prompt arrives just after it closes.
    setTimeout(() => { prompting = false; }, 500);
  }
}

async function ask(prompt: string, cancel: string): Promise<'ok' | 'failed' | 'unavailable'> {
  try {
    // Strong (class 3) biometrics only: a 2D face match on some Android phones opens for a photo. The passcode
    // is always the fallback.
    const res = await LocalAuthentication.authenticateAsync({ promptMessage: prompt, cancelLabel: cancel, disableDeviceFallback: false, biometricsSecurityLevel: 'strong' });
    if (res.success) return 'ok';
    // An error code alone ("not available" is also a busy sensor) never counts: only a phone that really has
    // no lock any more lets the app in.
    return (await canUseAppLock()) ? 'failed' : 'unavailable';
  } catch {
    return (await canUseAppLock()) ? 'failed' : 'unavailable';
  }
}
