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
export async function authenticateWithReason(prompt: string, cancel: string): Promise<'ok' | 'failed' | 'unavailable'> {
  if (Platform.OS === 'web') return 'ok';
  try {
    const res = await LocalAuthentication.authenticateAsync({ promptMessage: prompt, cancelLabel: cancel, disableDeviceFallback: false });
    if (res.success) return 'ok';
    if (res.error === 'not_enrolled' || res.error === 'passcode_not_set' || res.error === 'not_available') return 'unavailable';
    return (await canUseAppLock()) ? 'failed' : 'unavailable';
  } catch {
    return (await canUseAppLock()) ? 'failed' : 'unavailable';
  }
}
