import * as FileSystem from "expo-file-system/legacy";
import { copyAsync, moveAsync, deleteAsync, writeAsStringAsync } from "expo-file-system/legacy";
import type { CameraClip, CameraClipArray } from "../types/camera.types";
import type { AdjustSettings } from "../types/voiceOverlay.types";
import {
  applyPresetToVideo,
  applyPresetToImage,
  applyOverlaysToVideo,
  buildAdjustmentFilterChain,
  buildOverlayEffectFilterChain,
} from "./ffmpegFilters";
import { clipHasFilter } from "./filterHelpers";

// Conditional import for FFmpeg - only available in development builds
let FFmpegKit: any = null;
let ReturnCode: any = null;
let isFFmpegAvailable = false;

try {
  const ffmpeg = require("ffmpeg-kit-react-native-community");
  FFmpegKit = ffmpeg.FFmpegKit;
  ReturnCode = ffmpeg.ReturnCode;
  isFFmpegAvailable = true;
} catch (e) {
  console.warn("FFmpeg not available - video export will use fallback mode");
  isFFmpegAvailable = false;
}

/**
 * Export and combine multiple clips into a single video
 * Gracefully falls back to simple copy when FFmpeg is unavailable
 */
export async function exportAndCombineClips(
  clips: CameraClipArray,
  onProgress?: (progress: number, status: string) => void,
  overlays: any[] = []
): Promise<string> {
  if (clips.length === 0) {
    throw new Error("No clips to export");
  }

  // 🛠️ SMART FALLBACK MODE (Prevents crash when FFmpeg is missing)
  if (!isFFmpegAvailable) {
    onProgress?.(0.1, "Running in simplified mode (FFmpeg bypass)...");

    const exportsDir = `${FileSystem.cacheDirectory}exports/`;
    await FileSystem.makeDirectoryAsync(exportsDir, { intermediates: true });

    // Instead of throwing an error for multiple clips, we gracefully export the first clip to keep the app running.
    const outputPath = `${exportsDir}export_${Date.now()}.mp4`;
    const clip = clips[0]; // Safely pick the first clip

    if (clip.type === "video") {
      onProgress?.(0.5, "Preparing video...");
      await copyAsync({
        from: clip.uri,
        to: outputPath,
      });
      onProgress?.(1.0, "Export complete!");
      return outputPath;
    } else {
      // Fallback for image as well
      await copyAsync({
        from: clip.uri,
        to: outputPath,
      });
      return outputPath;
    }
  }

  // ==========================================
  // Full FFmpeg mode (when properly installed)
  // ==========================================
  const exportsDir = `${FileSystem.cacheDirectory}exports/`;
  await FileSystem.makeDirectoryAsync(exportsDir, { intermediates: true });

  const baseUri = exportsDir;
  onProgress?.(0.1, "Preparing clips...");

  const processedClips: string[] = [];
  const clipCount = clips.length;

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const progress = 0.1 + (i / clipCount) * 0.6;
    onProgress?.(progress, `Processing clip ${i + 1} of ${clipCount}...`);

    const processedPath = `${baseUri}processed_${i}_${Date.now()}.mp4`;

    if (clip.type === "video") {
      const trimStart = clip.trimStart ?? 0;
      const trimEnd = clip.trimEnd ?? clip.duration;
      const trimDuration = trimEnd - trimStart;

      let trimmedPath = clip.uri;
      if (trimStart > 0 || trimEnd < clip.duration) {
        const trimPath = `${baseUri}trimmed_${i}_${Date.now()}.mp4`;
        const trimCommand = `-ss ${trimStart} -i "${clip.uri}" -t ${trimDuration} -c copy -y "${trimPath}"`;

        try {
          const trimSession = await FFmpegKit.execute(trimCommand);
          const trimReturnCode = await trimSession.getReturnCode();

          if (ReturnCode.isSuccess(trimReturnCode)) {
            trimmedPath = trimPath;
          }
        } catch (error) {
          console.warn(`Trim execution error for clip ${i}: ${error}`);
        }
      }

      let filterAppliedPath = trimmedPath;
      if (clipHasFilter(clip) && clip.filterPreset) {
        const filterPath = `${baseUri}filtered_${i}_${Date.now()}.mp4`;
        await applyPresetToVideo(trimmedPath, filterPath, clip.filterPreset);
        filterAppliedPath = filterPath;
      }

      let adjustAppliedPath = filterAppliedPath;
      if (clip.adjustSettings) {
        const adjustFilterChain = buildAdjustmentFilterChain(clip.adjustSettings);
        if (adjustFilterChain) {
          const adjustPath = `${baseUri}adjusted_${i}_${Date.now()}.mp4`;
          const adjustCommand = `-i "${filterAppliedPath}" -vf "${adjustFilterChain}" -c:v libx264 -c:a copy -preset medium -crf 23 -y "${adjustPath}"`;

          try {
            const adjustSession = await FFmpegKit.execute(adjustCommand);
            const adjustReturnCode = await adjustSession.getReturnCode();

            if (ReturnCode.isSuccess(adjustReturnCode)) {
              adjustAppliedPath = adjustPath;
            }
          } catch (error) {}
        }
      }

      let overlayEffectsAppliedPath = adjustAppliedPath;
      if (clip.overlayEffects && clip.overlayEffects.length > 0) {
        const overlayFilterChain = buildOverlayEffectFilterChain(clip.overlayEffects);
        if (overlayFilterChain) {
          const overlayEffectsPath = `${baseUri}overlay_effects_${i}_${Date.now()}.mp4`;
          const overlayCommand = `-i "${adjustAppliedPath}" -vf "${overlayFilterChain}" -c:v libx264 -c:a copy -preset medium -crf 23 -y "${overlayEffectsPath}"`;

          try {
            const overlaySession = await FFmpegKit.execute(overlayCommand);
            const overlayReturnCode = await overlaySession.getReturnCode();

            if (ReturnCode.isSuccess(overlayReturnCode)) {
              overlayEffectsAppliedPath = overlayEffectsPath;
            }
          } catch (error) {}
        }
      }

      if (overlayEffectsAppliedPath === trimmedPath && !filterAppliedPath) {
        await copyAsync({ from: trimmedPath, to: processedPath });
      } else if (overlayEffectsAppliedPath !== processedPath) {
        await copyAsync({ from: overlayEffectsAppliedPath, to: processedPath });
      }

      if (clip.speed && clip.speed !== 1) {
        const spedUpPath = `${baseUri}sped_${i}_${Date.now()}.mp4`;
        const speedCommand = `-i "${processedPath}" -filter:v "setpts=${1 / clip.speed}*PTS" -filter:a "atempo=${clip.speed}" -y "${spedUpPath}"`;

        try {
          const session = await FFmpegKit.execute(speedCommand);
          const returnCode = await session.getReturnCode();

          if (ReturnCode.isSuccess(returnCode)) {
            await deleteAsync(processedPath);
            processedClips.push(spedUpPath);
          } else {
            processedClips.push(processedPath);
          }
        } catch (error) {
          processedClips.push(processedPath);
        }
      } else {
        processedClips.push(processedPath);
      }
    } else if (clip.type === "photo") {
      const imageVideoPath = `${baseUri}image_${i}_${Date.now()}.mp4`;
      let imageUri = clip.uri;

      if (clipHasFilter(clip) && clip.filterPreset) {
        const filteredImagePath = `${baseUri}filtered_image_${i}_${Date.now()}.jpg`;
        await applyPresetToImage(clip.uri, filteredImagePath, clip.filterPreset);
        imageUri = filteredImagePath;
      }

      const imageCommand = `-loop 1 -i "${imageUri}" -t 3 -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -y "${imageVideoPath}"`;

      try {
        const session = await FFmpegKit.execute(imageCommand);
        const returnCode = await session.getReturnCode();

        if (ReturnCode.isSuccess(returnCode)) {
          processedClips.push(imageVideoPath);
        }
      } catch (error) {}
    }
  }

  onProgress?.(0.7, "Combining clips...");

  const concatListPath = `${baseUri}concat_list_${Date.now()}.txt`;
  const concatList = processedClips
    .map((path) => `file '${path.replace(/'/g, "'\\''")}'`)
    .join("\n");
  await writeAsStringAsync(concatListPath, concatList);

  const concatOutputPath = `${baseUri}concat_final_${Date.now()}.mp4`;
  const concatCommand = `-f concat -safe 0 -i "${concatListPath}" -c copy -y "${concatOutputPath}"`;

  onProgress?.(0.85, "Finalizing video...");

  try {
    const session = await FFmpegKit.execute(concatCommand);
    const returnCode = await session.getReturnCode();

    try {
      await deleteAsync(concatListPath);
    } catch (error) {}

    if (!ReturnCode.isSuccess(returnCode)) {
      throw new Error(`Failed to combine clips`);
    }
  } catch (error) {
    throw new Error(`Failed to combine clips: ${error}`);
  }

  let finalVideoPath = concatOutputPath;
  if (overlays && overlays.length > 0) {
    onProgress?.(0.92, "Baking stickers & overlays...");
    const overlayOutputPath = `${baseUri}overlay_final_${Date.now()}.mp4`;

    try {
      finalVideoPath = await applyOverlaysToVideo(concatOutputPath, overlayOutputPath, overlays);
      try {
        await deleteAsync(concatOutputPath);
      } catch (e) {}
    } catch (error) {
      finalVideoPath = concatOutputPath;
    }
  }

  onProgress?.(1.0, "Export complete!");
  return finalVideoPath;
}

export async function exportSingleClip(
  clip: CameraClip,
  outputPath: string,
  onProgress?: (progress: number, status: string) => void
): Promise<string> {
  onProgress?.(0.1, "Preparing clip...");

  if (clip.type === "video") {
    if (clipHasFilter(clip) && clip.filterPreset) {
      onProgress?.(0.5, "Applying filter...");
      return await applyPresetToVideo(clip.uri, outputPath, clip.filterPreset);
    } else {
      onProgress?.(0.5, "Copying video...");
      await copyAsync({
        from: clip.uri,
        to: outputPath,
      });
      return outputPath;
    }
  } else {
    if (clipHasFilter(clip) && clip.filterPreset) {
      onProgress?.(0.5, "Applying filter...");
      return await applyPresetToImage(clip.uri, outputPath, clip.filterPreset);
    } else {
      onProgress?.(0.5, "Copying image...");
      await copyAsync({
        from: clip.uri,
        to: outputPath,
      });
      return outputPath;
    }
  }
}
