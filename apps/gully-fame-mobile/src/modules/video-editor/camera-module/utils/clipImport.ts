import * as FileSystem from "expo-file-system/legacy";
import type { ImagePickerAsset } from "expo-image-picker";

import { probeMedia, runFFmpeg, toFFmpegPath, videoEncodeArgs } from "./ffmpeg";

/** Duration given to a still photo on the timeline and in the posted reel. */
export const PHOTO_DEFAULT_DURATION = 5;

export interface ImportedMedia {
  uri: string;
  type: "video" | "photo";
  /** Seconds, read from the file (not from the picker, which reports milliseconds). */
  duration: number;
  width: number;
  height: number;
}

/** Real length of a video file in seconds, or `fallback` when it can't be read. */
export async function readVideoDuration(uri: string, fallback = 0): Promise<number> {
  try {
    const { duration } = await probeMedia(uri);
    return duration > 0 ? duration : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Turns a gallery pick into a clip the editor can trust:
 * - photo vs video from the asset type,
 * - the true duration in seconds from the file,
 * - a video with rotation metadata is re-encoded once with the rotation applied to the
 *   pixels, so every player and the export see the same upright frames.
 */
export async function importGalleryAsset(asset: ImagePickerAsset): Promise<ImportedMedia> {
  if (asset.type !== "video") {
    return {
      uri: asset.uri,
      type: "photo",
      duration: PHOTO_DEFAULT_DURATION,
      width: asset.width,
      height: asset.height,
    };
  }

  const probe = await probeMedia(asset.uri);
  // expo-image-picker's duration is in milliseconds.
  const duration = probe.duration > 0 ? probe.duration : (asset.duration ?? 0) / 1000;
  if (probe.rotation === 0) {
    return { uri: asset.uri, type: "video", duration, width: probe.width, height: probe.height };
  }

  // FFmpeg rotates the decoded frames by the display matrix (autorotate) and writes none.
  const output = toFFmpegPath(`${FileSystem.cacheDirectory}upright_${Date.now()}.mp4`);
  await runFFmpeg(
    ["-i", toFFmpegPath(asset.uri), "-map", "0:v:0", "-map", "0:a?", ...(await videoEncodeArgs()), "-c:a", "copy", "-y", output],
    `normalise rotation ${probe.rotation}°`
  );
  return { uri: `file://${output}`, type: "video", duration, width: probe.width, height: probe.height };
}
