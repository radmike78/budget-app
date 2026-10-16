import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const REMINDER_ID = 'onlybudget-daily-reminder';

/**
 * One optional, gentle daily reminder. Never a badge, never a streak.
 * Returns false if permission was not granted. The strings come from the caller's
 * locale (this module is pure). Scheduled local notifications are a native-only
 * feature; the web build reports false.
 */
export async function scheduleDailyReminder(hour: number, text: { title: string; body: string; channelName: string }): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  // The channel comes first: Android 13+ shows the permission prompt only once the app has a channel.
  await ensureChannel(text.channelName);
  if ((await ensureNotificationPermission()) !== 'granted') return false;

  await cancelDailyReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: text.title,
      body: text.body,
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
      channelId: Platform.OS === 'android' ? 'reminders' : undefined,
    },
  });
  return true;
}

/** True when the daily nudge is on the phone's schedule (it is not after moving to a new phone). */
export async function isDailyReminderScheduled(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return (await Notifications.getAllScheduledNotificationsAsync()).some((n) => n.identifier === REMINDER_ID);
  } catch {
    return false;
  }
}

export async function cancelDailyReminder(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
  } catch {
    // nothing scheduled
  }
}

export function configureNotificationHandler(): void {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// ---------- spoken reminders ----------

import type { Reminder } from '@/types';

export type PermissionState = 'granted' | 'denied' | 'unsupported';

/** Asks once if needed. Web has no scheduled local notifications, so it reports unsupported. */
export async function ensureNotificationPermission(): Promise<PermissionState> {
  if (Platform.OS === 'web') return 'unsupported';
  const perm = await Notifications.getPermissionsAsync();
  if (perm.granted) return 'granted';
  if (!perm.canAskAgain && perm.status === 'denied') return 'denied';
  const req = await Notifications.requestPermissionsAsync();
  return req.granted ? 'granted' : 'denied';
}

export async function notificationPermissionState(): Promise<PermissionState> {
  if (Platform.OS === 'web') return 'unsupported';
  const perm = await Notifications.getPermissionsAsync();
  return perm.granted ? 'granted' : 'denied';
}

export function openNotificationSettings(): void {
  if (Platform.OS === 'web') return;
  Linking.openSettings().catch(() => {});
}

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map((n) => Number(n));
  return { hour: Number.isFinite(h) ? h : 9, minute: Number.isFinite(m) ? m : 0 };
}

/** Local Date for "date at time". */
export function reminderDateTime(date: string, time: string): Date {
  const { hour, minute } = parseTime(time);
  const [y, mo, d] = date.split('-').map((n) => Number(n));
  return new Date(y, mo - 1, d, hour, minute, 0, 0);
}

/** The next time this reminder fires after `now`, or null for a one-off already in the past. */
export function nextOccurrence(rem: Reminder, now: Date = new Date()): Date | null {
  let next = reminderDateTime(rem.date, rem.time);
  if (rem.repeat === 'none') return next > now ? next : null;
  let guard = 0;
  while (next <= now && guard < 1000) {
    if (rem.repeat === 'daily') next = new Date(next.getFullYear(), next.getMonth(), next.getDate() + 1, next.getHours(), next.getMinutes());
    else if (rem.repeat === 'weekly') next = new Date(next.getFullYear(), next.getMonth(), next.getDate() + 7, next.getHours(), next.getMinutes());
    else {
      const anchor = reminderDateTime(rem.date, rem.time).getDate();
      const m = next.getMonth() + 1;
      const y = next.getFullYear() + (m > 11 ? 1 : 0);
      const mo = m % 12;
      const last = new Date(y, mo + 1, 0).getDate();
      next = new Date(y, mo, Math.min(anchor, last), next.getHours(), next.getMinutes());
    }
    guard += 1;
  }
  return next;
}

async function ensureChannel(channelName: string): Promise<string | undefined> {
  if (Platform.OS !== 'android') return undefined;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: channelName,
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: undefined,
    showBadge: false,
  });
  return 'reminders';
}

const REMINDER_PREFIX = 'onlybudget-reminder-';

/**
 * Schedules the notification for a reminder. Returns the notification id, or null
 * when notifications are not allowed (the reminder is still kept and can be armed later).
 * `channelName` is the Android channel's user-visible name, in the app's language.
 */
export async function scheduleReminderNotification(rem: Reminder, title: string, channelName: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  // The channel comes first: Android 13+ shows the permission prompt only once the app has a channel.
  const channelId = await ensureChannel(channelName);
  const state = await ensureNotificationPermission();
  if (state !== 'granted') return null;
  const { hour, minute } = parseTime(rem.time);
  const content = { title, body: rem.text, sound: false as const };
  const identifier = `${REMINDER_PREFIX}${rem.id}`;
  await cancelReminderNotification(identifier);
  const now = new Date();
  const first = reminderDateTime(rem.date, rem.time);
  const day = first.getDate();

  // Repeating triggers start at once, so they are used only when the first date is not further off than one
  // repeat; until then the next few dates are scheduled one by one, and each launch re-arms them.
  if (rem.repeat === 'daily' && first.getTime() - now.getTime() <= 86_400_000) {
    await Notifications.scheduleNotificationAsync({ identifier, content, trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId } });
    return identifier;
  }
  if (rem.repeat === 'weekly' && first.getTime() - now.getTime() <= 7 * 86_400_000) {
    const weekday = first.getDay() + 1; // expo: 1 = Sunday
    await Notifications.scheduleNotificationAsync({ identifier, content, trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour, minute, channelId } });
    return identifier;
  }
  // Monthly on a day every month has keeps firing without the app being opened.
  if (rem.repeat === 'monthly' && day <= 28 && first.getTime() - now.getTime() <= 31 * 86_400_000) {
    await Notifications.scheduleNotificationAsync({ identifier, content, trigger: { type: Notifications.SchedulableTriggerInputTypes.MONTHLY, day, hour, minute, channelId } });
    return identifier;
  }
  // A one-off, a monthly on the 29th–31st (the last day of shorter months), or a repeat that starts later:
  // concrete dates. iOS keeps at most 64 pending notifications for an app, so a series stays short.
  const dates = upcoming(rem, now, rem.repeat === 'none' ? 1 : SERIES_LENGTH);
  if (dates.length === 0) return null;
  for (let k = 0; k < dates.length; k += 1) {
    await Notifications.scheduleNotificationAsync({ identifier: k === 0 ? identifier : `${identifier}${SERIES_MARK}${k}`, content, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dates[k], channelId } });
  }
  return identifier;
}

/** How many dated notifications a repeating reminder keeps ahead of it when it cannot use a repeating trigger. */
const SERIES_LENGTH = 6;
const SERIES_MARK = '~';

/** The next `count` times a reminder fires after `now`. */
export function upcoming(rem: Reminder, now: Date, count: number): Date[] {
  const out: Date[] = [];
  let after = now;
  for (let k = 0; k < count; k += 1) {
    const next = nextOccurrence(rem, after);
    if (!next) break;
    out.push(next);
    if (rem.repeat === 'none') break;
    after = next;
  }
  return out;
}

export async function cancelReminderNotification(notificationId: string | null | undefined): Promise<void> {
  if (Platform.OS === 'web' || !notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    // A dated series carries the same id with a mark and a number.
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) if (n.identifier.startsWith(`${notificationId}${SERIES_MARK}`)) await Notifications.cancelScheduledNotificationAsync(n.identifier);
  } catch {
    // nothing scheduled
  }
}

/**
 * True when a reminder has to be scheduled again even though it is on the schedule: a dated series (a monthly
 * on the 29th–31st, or a repeat not started yet) only covers the next few dates.
 */
export function needsRearm(rem: Reminder, now: Date = new Date()): boolean {
  if (rem.repeat === 'none') return false;
  const first = reminderDateTime(rem.date, rem.time);
  if (rem.repeat === 'monthly') return first.getDate() > 28 || first.getTime() - now.getTime() > 31 * 86_400_000;
  return first.getTime() > now.getTime();
}

/** Identifiers of every reminder notification on the phone's schedule. */
export async function scheduledReminderIds(): Promise<Set<string>> {
  if (Platform.OS === 'web') return new Set();
  try {
    return new Set((await Notifications.getAllScheduledNotificationsAsync()).map((n) => n.identifier));
  } catch {
    return new Set();
  }
}

/** Cancels every scheduled spoken-reminder notification (used before a restore replaces the reminders). */
export async function cancelAllReminderNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.identifier.startsWith(REMINDER_PREFIX)) await cancelReminderNotification(n.identifier);
    }
  } catch {
    // nothing scheduled, or notifications unavailable
  }
}
