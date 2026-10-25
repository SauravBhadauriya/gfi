import { FFmpegKit, FFprobeKit, ReturnCode, type FFmpegSession } from "ffmpeg-kit-react-native";
import * as FileSystem from "expo-file-system/legacy";

/** Thrown when an FFmpeg session fails; carries the full session log. */
export class FFmpegError extends Error {
  readonly logs: string;
  readonly returnCode: number | null;

  constructor(message: string, logs: string, returnCode: number | null) {
    super(message);
    this.name = "FFmpegError";
    this.logs = logs;
    this.returnCode = returnCode;
  }
}

export interface FFmpegRun {
  durationMs: number;
}

/**
 * H.264 encoder settings for every re-encode. The Android build substitutes
 * com.moizhassan.ffmpeg:ffmpeg-kit-16kb (android/build.gradle), which ships
 * libopenh264 but not libx264, so x264 options like -preset/-crf don't apply.
 */
export const H264_ENCODE_ARGS = ["-c:v", "libopenh264", "-b:v", "8M", "-pix_fmt", "yuv420p"];
export const H264_ENCODE = H264_ENCODE_ARGS.join(" ");

/** FFmpeg wants plain filesystem paths, not file:// URIs. */
export const toFFmpegPath = (uri: string) => uri.replace(/^file:\/\//, "");

export interface RunFFmpegOptions {
  /** Length of the output in ms; with onProgress, reports 0..1 from FFmpeg's statistics. */
  durationMs?: number;
  onProgress?: (fraction: number) => void;
}

/**
 * The single entry point for running FFmpeg in the app.
 * Pass an argument array (preferred, no quoting issues) or a legacy command string.
 * Throws FFmpegError with the session logs instead of failing silently.
 */
export async function runFFmpeg(
  args: string[] | string,
  label = "ffmpeg",
  options: RunFFmpegOptions = {}
): Promise<FFmpegRun> {
  const started = Date.now();
  const { durationMs, onProgress } = options;
  let session: FFmpegSession;
  if (onProgress && durationMs) {
    session = await new Promise<FFmpegSession>((resolve, reject) => {
      const onStats = (stats: { getTime(): number }) => onProgress(Math.min(1, Math.max(0, stats.getTime() / durationMs)));
      const run = Array.isArray(args)
        ? FFmpegKit.executeWithArgumentsAsync(args, resolve, undefined, onStats)
        : FFmpegKit.executeAsync(args, resolve, undefined, onStats);
      run.catch(reject);
    });
  } else {
    session = Array.isArray(args) ? await FFmpegKit.executeWithArguments(args) : await FFmpegKit.execute(args);
  }
  const returnCode = await session.getReturnCode();
  const durationTaken = Date.now() - started;

  if (!ReturnCode.isSuccess(returnCode)) {
    const logs = (await session.getAllLogsAsString()) ?? "";
    const code = returnCode?.getValue() ?? null;
    // One line per entry: Android's logcat truncates single entries over ~4 KB.
    
    throw new FFmpegError(`${label} failed (FFmpeg return code ${code})`, logs, code);
  }

  return { durationMs: durationTaken };
}

/** Hardware H.264 (Android MediaCodec). Much faster than libopenh264 but not on every device. */
const MEDIACODEC_ENCODE_ARGS = ["-c:v", "h264_mediacodec", "-b:v", "6M", "-pix_fmt", "yuv420p"];
let videoEncoder: Promise<string[]> | null = null;

/**
 * Encoder args for edit exports: MediaCodec when a one-off probe encode succeeds
 * on this device, otherwise libopenh264 (logged, so the slower path is never a surprise).
 * x264's -preset/-crf don't exist in this build (no libx264).
 */
export function videoEncodeArgs(): Promise<string[]> {
  videoEncoder ??= (async () => {
    const out = toFFmpegPath(`${FileSystem.cacheDirectory}encoder_probe.mp4`);
    const session = await FFmpegKit.executeWithArguments([
      "-f", "lavfi", "-i", "color=c=gray:s=320x240:d=0.5", ...MEDIACODEC_ENCODE_ARGS, "-y", out,
    ]);
    const ok = ReturnCode.isSuccess(await session.getReturnCode());
    await FileSystem.deleteAsync(`file://${out}`, { idempotent: true });
    if (ok) {
      return MEDIACODEC_ENCODE_ARGS;
    }
    return H264_ENCODE_ARGS;
  })();
  return videoEncoder;
}

export interface MediaProbe {
  /** Display size, honouring rotation metadata. */
  width: number;
  height: number;
  hasAudio: boolean;
  /** Seconds; 0 for still images or when unknown. */
  duration: number;
  /** Display rotation from the container metadata, in degrees (0, 90, 180, 270). */
  rotation: number;
}

/** Display size of the first video/image stream, honouring rotation metadata. */
export async function probeMediaSize(path: string): Promise<{ width: number; height: number }> {
  const { width, height } = await probeMedia(path);
  return { width, height };
}

export async function probeMedia(path: string): Promise<MediaProbe> {
  const session = await FFprobeKit.getMediaInformation(toFFmpegPath(path));
  const info = session.getMediaInformation();
  const streams = info?.getStreams() ?? [];
  const stream = streams.find((st) => st.getWidth() > 0 && st.getHeight() > 0);
  if (!stream) {
    const logs = (await session.getAllLogsAsString()) ?? "";
    throw new FFmpegError(`Could not read the size of ${path}`, logs, null);
  }
  const props = stream.getAllProperties() ?? {};
  const sideRotation = (props.side_data_list ?? []).find((d: any) => d.rotation !== undefined)?.rotation;
  const rotation = ((Math.round(Number(sideRotation ?? props.tags?.rotate ?? 0)) % 360) + 360) % 360;
  const hasAudio = streams.some((st) => st.getType() === "audio");
  const duration = Number(info?.getDuration()) || 0;
  return rotation % 180 === 90
    ? { width: stream.getHeight(), height: stream.getWidth(), hasAudio, duration, rotation }
    : { width: stream.getWidth(), height: stream.getHeight(), hasAudio, duration, rotation };
}
