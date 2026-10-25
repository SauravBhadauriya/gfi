import * as FileSystem from "expo-file-system/legacy";

import { probeMedia, runFFmpeg, toFFmpegPath, videoEncodeArgs } from "./ffmpeg";
import { MAX_OUTPUT_HEIGHT } from "./bakeEdits";

/** Length of a photo post. The backend only takes videos, so a photo is posted as this many seconds of video. */
export const PHOTO_POST_SECONDS = 5;

export interface PhotoMusic {
  /** Remote or local audio url. */
  url: string;
  /** 0..1 */
  volume: number;
  /** Seconds into the track where playback starts. */
  startOffset: number;
}

const even = (v: number) => Math.max(2, Math.round(v / 2) * 2);

/** Remote tracks are downloaded first: this FFmpeg build is only given local files. */
async function localAudio(url: string): Promise<string> {
  if (url.startsWith("file://") || url.startsWith("/")) return toFFmpegPath(url);
  const target = `${FileSystem.cacheDirectory}music_${Math.abs(hash(url))}.mp3`;
  const info = await FileSystem.getInfoAsync(target);
  if (!info.exists) {
    const result = await FileSystem.downloadAsync(url, target);
    if (result.status !== 200) throw new Error(`Could not download the music (HTTP ${result.status})`);
  }
  return toFFmpegPath(target);
}

function hash(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return h;
}

/**
 * WORKAROUND: the backend has no photo post type, so the baked photo becomes a 5 s mp4
 * (same aspect ratio, capped at MAX_OUTPUT_HEIGHT) that goes through the reels flow.
 * The audio is the chosen music (faded out at the end), or silence, so every player has an audio track.
 * Returns the file:// uri of the mp4.
 */
export async function convertPhotoToVideo(
  photoUri: string,
  music: PhotoMusic | null,
  onProgress?: (fraction: number) => void
): Promise<string> {
  const photo = toFFmpegPath(photoUri);
  const { width, height } = await probeMedia(photo);
  const outH = height > MAX_OUTPUT_HEIGHT ? MAX_OUTPUT_HEIGHT : even(height);
  const outW = even((width * outH) / height);

  const args = ["-loop", "1", "-framerate", "30", "-t", String(PHOTO_POST_SECONDS), "-i", photo];
  if (music) {
    args.push("-ss", music.startOffset.toFixed(3), "-i", await localAudio(music.url));
  } else {
    args.push("-f", "lavfi", "-t", String(PHOTO_POST_SECONDS), "-i", "anullsrc=r=44100:cl=stereo");
  }

  const audioFilter = music
    ? `[1:a]aresample=44100,volume=${music.volume.toFixed(2)},apad,atrim=0:${PHOTO_POST_SECONDS},afade=t=out:st=${PHOTO_POST_SECONDS - 0.5}:d=0.5[a]`
    : "[1:a]anull[a]";
  const output = toFFmpegPath(`${FileSystem.cacheDirectory}photo_post_${Date.now()}.mp4`);
  args.push(
    "-filter_complex",
    `[0:v]scale=${outW}:${outH},setsar=1,format=yuv420p[v];${audioFilter}`,
    "-map", "[v]",
    "-map", "[a]",
    ...(await videoEncodeArgs()),
    "-c:a", "aac", "-b:a", "128k",
    "-t", String(PHOTO_POST_SECONDS),
    "-movflags", "+faststart",
    "-y", output
  );

  await runFFmpeg(args, "photo to video", { durationMs: PHOTO_POST_SECONDS * 1000, onProgress });
  return `file://${output}`;
}
