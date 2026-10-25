import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

/**
 * Reels saved for offline viewing. Each file lives in the app's documents folder
 * and its metadata is kept in AsyncStorage, so the Downloads screen can list and
 * play them after the app restarts.
 */

export interface DownloadItem {
  id: string;
  title: string;
  thumbnail: string;
  /** file:// path of the watermarked MP4 in the app's documents folder. */
  localUri: string;
  sizeBytes: number;
  createdAt: string;
}

const STORAGE_KEY = "@gullyfame_downloads";
export const DOWNLOADS_DIR = `${FileSystem.documentDirectory}downloads/`;

export async function listDownloads(): Promise<DownloadItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const items: DownloadItem[] = raw ? JSON.parse(raw) : [];
    // Drop entries whose file was removed outside the app.
    const checks = await Promise.all(items.map((item) => FileSystem.getInfoAsync(item.localUri).then((i) => i.exists)));
    return items.filter((_, index) => checks[index]);
  } catch {
    return [];
  }
}

async function writeAll(items: DownloadItem[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/** Copies a finished file into the downloads folder and records it. */
export async function saveDownload(input: {
  title: string;
  thumbnail: string;
  sourceUri: string;
}): Promise<DownloadItem> {
  await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
  const id = `dl_${Date.now()}`;
  const localUri = `${DOWNLOADS_DIR}${id}.mp4`;
  await FileSystem.copyAsync({ from: input.sourceUri, to: localUri });
  const info = await FileSystem.getInfoAsync(localUri);
  const item: DownloadItem = {
    id,
    title: input.title,
    thumbnail: input.thumbnail,
    localUri,
    sizeBytes: info.exists && "size" in info ? info.size ?? 0 : 0,
    createdAt: new Date().toISOString(),
  };
  const current = await listDownloads();
  await writeAll([item, ...current]);
  return item;
}

/** Deletes the file and its metadata. */
export async function removeDownload(id: string): Promise<void> {
  const current = await listDownloads();
  const target = current.find((item) => item.id === id);
  if (target) await FileSystem.deleteAsync(target.localUri, { idempotent: true });
  await writeAll(current.filter((item) => item.id !== id));
}
