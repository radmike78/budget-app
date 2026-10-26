import { Platform, Share } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

const MIME: Record<string, string> = {
  csv: 'text/csv',
  txt: 'text/plain',
  json: 'application/json',
  onlybudget: 'application/json',
};

/** Writes text to the cache directory and opens the system share sheet (a download on the web build). */
/**
 * Hands a text file to the share sheet. Resolves true when it was taken somewhere; iOS reports a plain dismiss,
 * which answers false so a backup date is never recorded for a copy that was not made. Android and the web
 * cannot tell, and answer true.
 */
export async function shareTextFile(filename: string, contents: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    const ext = filename.split('.').pop() ?? 'txt';
    const blob = new Blob([contents], { type: MIME[ext] ?? 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  }
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.write(contents);
  const ext = filename.split('.').pop() ?? 'txt';
  if (Platform.OS === 'ios') {
    const result = await Share.share({ url: file.uri }, { subject: filename });
    return result.action === Share.sharedAction;
  }
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('SHARING_UNAVAILABLE');
  await Sharing.shareAsync(file.uri, { mimeType: MIME[ext] ?? 'text/plain', dialogTitle: filename, UTI: ext === 'json' || ext === 'onlybudget' ? 'public.json' : 'public.plain-text' });
  return true;
}

/**
 * Lets the user pick a backup file and returns its text, or null if cancelled. A file larger than `maxBytes` is
 * never read into memory (a multi-gigabyte file would end the app); its text comes back empty, which the caller
 * reads as "not a backup".
 */
export async function pickTextFile(maxBytes = Infinity): Promise<{ name: string; text: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true, multiple: false });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  const declared = typeof asset.size === 'number' ? asset.size : (asset as { file?: Blob }).file?.size;
  if (declared != null && declared > maxBytes) {
    if (Platform.OS !== 'web') { try { const f = new File(asset.uri); if (f.exists) f.delete(); } catch { /* best effort */ } }
    return { name: asset.name, text: '' };
  }
  if (Platform.OS === 'web') {
    const webFile = (asset as { file?: Blob }).file;
    const text = webFile ? await webFile.text() : await (await fetch(asset.uri)).text();
    return { name: asset.name, text };
  }
  const file = new File(asset.uri);
  let text: string;
  try {
    // The picker does not always know the size; the copy on disk does.
    if (file.size > maxBytes) return { name: asset.name, text: '' };
    text = await file.text();
  } finally {
    // The picker's cached copy is not kept.
    try { if (file.exists) file.delete(); } catch { /* best effort */ }
  }
  return { name: asset.name, text };
}

/**
 * Every export is written to the cache before the share sheet takes it, and a plain
 * backup holds the whole budget. The receiving app may still be reading it when the
 * sheet closes, so nothing is deleted then; instead the next launch, and Erase
 * everything, remove whatever an earlier export left behind. Returns how many went.
 */
export async function sweepExportCache(): Promise<number> {
  if (Platform.OS === 'web') return 0;
  let removed = 0;
  try {
    for (const entry of Paths.cache.list()) {
      if (entry instanceof File && /^onlybudget-(?:entries|summary|backup)-/i.test(entry.name)) {
        try { entry.delete(); removed += 1; } catch { /* best effort */ }
      }
    }
  } catch {
    // no cache directory yet
  }
  return removed;
}

export function timestampForFilename(d = new Date()): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}
