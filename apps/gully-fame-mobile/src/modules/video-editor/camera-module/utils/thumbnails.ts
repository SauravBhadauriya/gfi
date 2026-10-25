import * as FileSystem from "expo-file-system/legacy";

import { runFFmpeg, toFFmpegPath } from "./ffmpeg";

/** Height of the extracted frames in pixels (timeline tiles are about 64 dp tall). */
const THUMB_HEIGHT = 128;
const THUMBS_DIR = `${FileSystem.cacheDirectory}thumbs/`;

const memory = new Map<string, Promise<string[]>>();
// One FFmpeg extraction at a time, so a long timeline doesn't start a dozen sessions at once.
let queue: Promise<unknown> = Promise.resolve();

function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

async function listFrames(dir: string): Promise<string[]> {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) return [];
  const names = (await FileSystem.readDirectoryAsync(dir)).filter((n) => n.endsWith(".jpg")).sort();
  return names.map((n) => `${dir}${n}`);
}

/**
 * About one frame per second of a video's trimmed range, as file:// uris, cached on disk
 * (cache/thumbs/<key>/) and in memory. Rejects (and forgets the attempt) when FFmpeg fails,
 * so the caller can offer a retry.
 */
export function videoThumbnails(uri: string, start: number, length: number): Promise<string[]> {
  const count = Math.max(1, Math.ceil(length));
  const key = `${uri}|${start.toFixed(2)}|${length.toFixed(2)}`;
  const cached = memory.get(key);
  if (cached) return cached;

  const dir = `${THUMBS_DIR}${hash(key)}/`;
  const job = (async () => {
    const existing = await listFrames(dir);
    if (existing.length > 0) return existing;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const run = queue.then(() =>
      runFFmpeg(
        [
          "-ss", start.toFixed(3),
          "-t", Math.max(0.1, length).toFixed(3),
          "-i", toFFmpegPath(uri),
          "-vf", `fps=${(count / Math.max(0.1, length)).toFixed(4)},scale=-2:${THUMB_HEIGHT}`,
          "-frames:v", String(count),
          "-q:v", "5",
          "-y", `${toFFmpegPath(dir)}t_%03d.jpg`,
        ],
        "timeline thumbnails"
      )
    );
    queue = run.catch(() => {});
    await run;
    const frames = await listFrames(dir);
    if (frames.length === 0) throw new Error("No frames extracted");
    return frames;
  })();

  memory.set(key, job);
  job.catch(() => memory.delete(key));
  return job;
}
