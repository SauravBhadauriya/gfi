import * as FileSystem from "expo-file-system/legacy";

import type { Clip, EditorFilter, TextItem } from "@/types/editor.types";
import { ffmpegFilterChain } from "../components/preview/filterPresets";
import { buildTextAss, ensureFonts, type FrameSize } from "./bakeOverlays";
import { probeMedia, runFFmpeg, toFFmpegPath, videoEncodeArgs } from "./ffmpeg";

/** Exports are scaled down to this height (keeps aspect); smaller media is left as is. */
export const MAX_OUTPUT_HEIGHT = 1280;

export interface BakeEditsInput {
  mediaType: "photo" | "video";
  clips: Clip[];
  texts: TextItem[];
  filter: EditorFilter | null;
  /** The on-screen media frame the edits were placed in. */
  frame: FrameSize;
  /** 0..1 while FFmpeg encodes (video only). */
  onProgress?: (fraction: number) => void;
}

export interface BakeEditsResult {
  /** file:// uri of the export (the original file when nothing needed baking). */
  uri: string;
  /** Total video length in seconds (0 for a photo). */
  duration: number;
  /** Which edits are in the file, e.g. ["filter", "text"]. */
  baked: string[];
}

const even = (v: number) => Math.max(2, Math.round(v / 2) * 2);

/**
 * Bakes every preview edit in ONE FFmpeg command: trims, joining clips, scaling to
 * MAX_OUTPUT_HEIGHT, the colour filter and the texts. A photo comes out as a JPEG,
 * a video as H.264 (audio copied when it is untouched).
 */
export async function bakeEdits({
  mediaType,
  clips,
  texts,
  filter,
  frame,
  onProgress,
}: BakeEditsInput): Promise<BakeEditsResult> {
  if (clips.length === 0) throw new Error("Nothing to export");
  const isPhoto = mediaType === "photo";
  const used = isPhoto ? clips.slice(0, 1) : clips;
  const probes = await Promise.all(used.map((clip) => probeMedia(clip.uri)));

  const segments = used.map((clip, i) => {
    const full = clip.duration || probes[i].duration;
    const start = clip.trimStart ?? 0;
    const end = Math.min(clip.trimEnd ?? full, full || Infinity);
    return { start, length: Math.max(0, end - start), trimmed: start > 0 || end < full };
  });
  const duration = isPhoto ? 0 : segments.reduce((sum, seg) => sum + seg.length, 0);

  const filterChain = ffmpegFilterChain(filter);
  const baked = [...(filterChain ? ["filter"] : []), ...(texts.length ? ["text"] : [])];
  const needsConcat = used.length > 1;

  // Nothing to change: hand over the original file, no re-encode at all.
  if (!filterChain && texts.length === 0 && !needsConcat && !segments[0].trimmed) {
    return { uri: used[0].uri, duration, baked };
  }

  const source = probes[0];
  const outH = source.height > MAX_OUTPUT_HEIGHT ? MAX_OUTPUT_HEIGHT : even(source.height);
  const outW = even((source.width * outH) / source.height);
  // Same cover crop as the preview, so every clip lands on the first clip's size.
  const fit = `scale=${outW}:${outH}:force_original_aspect_ratio=increase,crop=${outW}:${outH},setsar=1`;

  const stamp = Date.now();
  const post: string[] = [];
  if (filterChain) post.push(filterChain);
  let assPath: string | null = null;
  if (texts.length) {
    const fontsDir = await ensureFonts();
    assPath = `${FileSystem.cacheDirectory}texts_${stamp}.ass`;
    await FileSystem.writeAsStringAsync(assPath, buildTextAss(texts, frame, { width: outW, height: outH }));
    post.push(`subtitles=filename=${toFFmpegPath(assPath)}:fontsdir=${fontsDir}`);
  }

  const args: string[] = [];
  used.forEach((clip, i) => {
    const seg = segments[i];
    if (!isPhoto && clip.type === "photo") {
      // A still inside a video: loop the frame for the clip's duration.
      args.push("-loop", "1", "-framerate", "30", "-t", seg.length.toFixed(3));
    } else if (!isPhoto) {
      if (seg.start > 0) args.push("-ss", seg.start.toFixed(3));
      if (seg.trimmed) args.push("-t", seg.length.toFixed(3));
    }
    args.push("-i", toFFmpegPath(clip.uri));
  });

  const graph: string[] = [];
  const anyAudio = probes.some((p) => p.hasAudio);
  if (needsConcat) {
    // Clips without a sound track get silence so the joined audio stays in sync.
    let nextInput = used.length;
    const audioIn = used.map((_, i) => {
      if (!anyAudio) return "";
      if (probes[i].hasAudio) return `[${i}:a]`;
      args.push("-f", "lavfi", "-t", segments[i].length.toFixed(3), "-i", "anullsrc=r=44100:cl=stereo");
      return `[${nextInput++}:a]`;
    });
    used.forEach((_, i) => graph.push(`[${i}:v]${fit}[v${i}]`));
    graph.push(
      `${used.map((_, i) => `[v${i}]${audioIn[i]}`).join("")}concat=n=${used.length}:v=1:a=${anyAudio ? 1 : 0}[vc]${anyAudio ? "[aout]" : ""}`
    );
    graph.push(`[vc]${post.join(",") || "null"}[vout]`);
  } else {
    graph.push(`[0:v]${[fit, ...post].join(",")}[vout]`);
  }
  args.push("-filter_complex", graph.join(";"), "-map", "[vout]");

  const output = toFFmpegPath(`${FileSystem.cacheDirectory}export_${stamp}.${isPhoto ? "jpg" : "mp4"}`);
  try {
    if (isPhoto) {
      args.push("-frames:v", "1", "-update", "1", "-q:v", "2", "-y", output);
      await runFFmpeg(args, "bake photo");
    } else {
      if (needsConcat && anyAudio) args.push("-map", "[aout]", "-c:a", "aac", "-b:a", "128k");
      else args.push("-map", "0:a?", "-c:a", "copy");
      args.push(...(await videoEncodeArgs()), "-y", output);
      await runFFmpeg(args, "bake video", { durationMs: duration * 1000, onProgress });
    }
  } finally {
    if (assPath) await FileSystem.deleteAsync(assPath, { idempotent: true });
  }
  return { uri: `file://${output}`, duration, baked };
}
