import { Directory, File, Paths } from "expo-file-system";
import type { CameraClip, CameraClipArray } from "../types/camera.types";
import type { AdjustSettings } from "../types/voiceOverlay.types";
import { applyPresetToVideo, applyPresetToImage, applyOverlaysToVideo, buildAdjustmentFilterChain, buildOverlayEffectFilterChain } from "./ffmpegFilters";
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
  console.warn("FFmpeg not available in Expo Go - video export will use fallback mode");
  isFFmpegAvailable = false;
}

/**
 * Export and combine multiple clips into a single video
 * 🔥 Added `overlays` array to bake stickers onto final export
 * Gracefully falls back to simple copy when FFmpeg is unavailable
 */
export async function exportAndCombineClips(
  clips: CameraClipArray,
  onProgress?: (progress: number, status: string) => void,
  overlays: any[] = [] // 👈 Naya parameter
): Promise<string> {
  if (clips.length === 0) {
    throw new Error("No clips to export");
  }

  // Fallback mode for Expo Go (no FFmpeg available)
  if (!isFFmpegAvailable) {
    onProgress?.(0.1, "Running in Expo Go mode (simplified export)...");
    
    const exportsDir = new Directory(Paths.cache, "exports");
    if (!exportsDir.exists) {
      exportsDir.create();
    }

    const baseUri = exportsDir.uri.endsWith("/") ? exportsDir.uri : `${exportsDir.uri}/`;
    
    // In Expo Go, just copy the first clip as fallback
    // In a dev build, you'd have full FFmpeg processing
    if (clips.length === 1) {
      const outputPath = `${baseUri}export_${Date.now()}.mp4`;
      const clip = clips[0];
      
      if (clip.type === "video") {
        onProgress?.(0.5, "Preparing video...");
        const sourceVideo = new File(clip.uri);
        sourceVideo.copy(outputPath);
        onProgress?.(1.0, "Export complete!");
        return outputPath;
      } else {
        throw new Error("Image to video conversion requires FFmpeg (development build needed)");
      }
    } else {
      throw new Error(
        "Video concatenation requires FFmpeg. Create a development build to enable full export functionality. " +
        "To create a dev build: eas build --platform android --profile preview"
      );
    }
  }

  // Full FFmpeg mode (development build)
  const exportsDir = new Directory(Paths.cache, "exports");
  if (!exportsDir.exists) {
    exportsDir.create();
  }

  const baseUri = exportsDir.uri.endsWith("/") ? exportsDir.uri : `${exportsDir.uri}/`;
  onProgress?.(0.1, "Preparing clips...");

  const processedClips: string[] = [];
  const clipCount = clips.length;

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const progress = 0.1 + (i / clipCount) * 0.6;
    onProgress?.(progress, `Processing clip ${i + 1} of ${clipCount}...`);

    const processedPath = `${baseUri}processed_${i}_${Date.now()}.mp4`;

    if (clip.type === "video") {
      // 🎬 FIX 1: Apply trim before any other processing
      const trimStart = clip.trimStart ?? 0;
      const trimEnd = clip.trimEnd ?? clip.duration;
      const trimDuration = trimEnd - trimStart;
      
      // First, apply trim if needed
      let trimmedPath = clip.uri;
      if (trimStart > 0 || trimEnd < clip.duration) {
        const trimPath = `${baseUri}trimmed_${i}_${Date.now()}.mp4`;
        const trimCommand = `-ss ${trimStart} -i "${clip.uri}" -t ${trimDuration} -c copy -y "${trimPath}"`;
        
        console.log(`🎬 Trimming clip ${i}: ${trimStart}s to ${trimEnd}s (${trimDuration}s)`);
        
        try {
          const trimSession = await FFmpegKit.execute(trimCommand);
          const trimReturnCode = await trimSession.getReturnCode();
          
          if (ReturnCode.isSuccess(trimReturnCode)) {
            trimmedPath = trimPath;
          } else {
            const trimError = await trimSession.getFailStackTrace();
            console.warn(`Trim failed for clip ${i}, using full video: ${trimError}`);
          }
        } catch (error) {
          console.warn(`Trim execution error for clip ${i}: ${error}`);
        }
      }
      
      // Apply filter if exists
      let filterAppliedPath = trimmedPath;
      if (clipHasFilter(clip) && clip.filterPreset) {
        const filterPath = `${baseUri}filtered_${i}_${Date.now()}.mp4`;
        await applyPresetToVideo(trimmedPath, filterPath, clip.filterPreset);
        filterAppliedPath = filterPath;
      }

      // Apply adjust settings if exists (brightness, contrast, saturation, etc)
      let adjustAppliedPath = filterAppliedPath;
      if (clip.adjustSettings) {
        const adjustFilterChain = buildAdjustmentFilterChain(clip.adjustSettings);
        if (adjustFilterChain) {
          const adjustPath = `${baseUri}adjusted_${i}_${Date.now()}.mp4`;
          const adjustCommand = `-i "${filterAppliedPath}" -vf "${adjustFilterChain}" -c:v libx264 -c:a copy -preset medium -crf 23 -y "${adjustPath}"`;
          
          console.log(`🎨 Applying adjustments to clip ${i}: ${adjustFilterChain}`);
          
          try {
            const adjustSession = await FFmpegKit.execute(adjustCommand);
            const adjustReturnCode = await adjustSession.getReturnCode();
            
            if (ReturnCode.isSuccess(adjustReturnCode)) {
              adjustAppliedPath = adjustPath;
              // Clean up intermediate filter path if different
              if (filterAppliedPath !== trimmedPath) {
                try {
                  const filterFile = new File(filterAppliedPath);
                  if (filterFile.exists) filterFile.delete();
                } catch (e) {}
              }
            } else {
              const adjustError = await adjustSession.getFailStackTrace();
              console.warn(`Adjustments failed for clip ${i}, skipping: ${adjustError}`);
              adjustAppliedPath = filterAppliedPath;
            }
          } catch (error) {
            console.warn(`Adjust settings execution error for clip ${i}: ${error}`);
            adjustAppliedPath = filterAppliedPath;
          }
        }
      }

      // Apply overlay effects if exists (blur, vignette, watermark, gradient)
      let overlayEffectsAppliedPath = adjustAppliedPath;
      if (clip.overlayEffects && clip.overlayEffects.length > 0) {
        const overlayFilterChain = buildOverlayEffectFilterChain(clip.overlayEffects);
        if (overlayFilterChain) {
          const overlayEffectsPath = `${baseUri}overlay_effects_${i}_${Date.now()}.mp4`;
          const overlayCommand = `-i "${adjustAppliedPath}" -vf "${overlayFilterChain}" -c:v libx264 -c:a copy -preset medium -crf 23 -y "${overlayEffectsPath}"`;
          
          console.log(`✨ Applying overlay effects to clip ${i}: ${overlayFilterChain}`);
          
          try {
            const overlaySession = await FFmpegKit.execute(overlayCommand);
            const overlayReturnCode = await overlaySession.getReturnCode();
            
            if (ReturnCode.isSuccess(overlayReturnCode)) {
              overlayEffectsAppliedPath = overlayEffectsPath;
              // Clean up intermediate adjust path if different
              if (adjustAppliedPath !== filterAppliedPath) {
                try {
                  const adjustFile = new File(adjustAppliedPath);
                  if (adjustFile.exists) adjustFile.delete();
                } catch (e) {}
              }
            } else {
              const overlayError = await overlaySession.getFailStackTrace();
              console.warn(`Overlay effects failed for clip ${i}, skipping: ${overlayError}`);
              overlayEffectsAppliedPath = adjustAppliedPath;
            }
          } catch (error) {
            console.warn(`Overlay effects execution error for clip ${i}: ${error}`);
            overlayEffectsAppliedPath = adjustAppliedPath;
          }
        }
      }

      // If no filters or adjustments applied, copy from trimmed
      if (overlayEffectsAppliedPath === trimmedPath && !filterAppliedPath) {
        const sourceVideo = new File(trimmedPath);
        sourceVideo.copy(processedPath);
      } else if (overlayEffectsAppliedPath !== processedPath) {
        const sourceVideo = new File(overlayEffectsAppliedPath);
        sourceVideo.copy(processedPath);
      }

      if (clip.speed && clip.speed !== 1) {
        const spedUpPath = `${baseUri}sped_${i}_${Date.now()}.mp4`;
        const speedCommand = `-i "${processedPath}" -filter:v "setpts=${1 / clip.speed}*PTS" -filter:a "atempo=${clip.speed}" -y "${spedUpPath}"`;
        
        try {
          const session = await FFmpegKit.execute(speedCommand);
          const returnCode = await session.getReturnCode();

          if (ReturnCode.isSuccess(returnCode)) {
            const tempVideo = new File(processedPath);
            if (tempVideo.exists) tempVideo.delete();
            processedClips.push(spedUpPath);
          } else {
            processedClips.push(processedPath);
          }
        } catch (error) {
          console.warn("Speed adjustment failed, using original:", error);
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
        } else {
          throw new Error(`Failed to convert image ${i} to video`);
        }
      } catch (error) {
        console.error("Image conversion error:", error);
        throw new Error(`Failed to process image ${i}: ${error}`);
      }
    }
  }

  onProgress?.(0.7, "Combining clips...");

  const concatListPath = `${baseUri}concat_list_${Date.now()}.txt`;
  const concatList = processedClips
    .map((path) => `file '${path.replace(/'/g, "'\\''")}'`)
    .join("\n");

  const concatFile = new File(concatListPath);
  concatFile.writeAsString(concatList);

  const concatOutputPath = `${baseUri}concat_final_${Date.now()}.mp4`;
  const concatCommand = `-f concat -safe 0 -i "${concatListPath}" -c copy -y "${concatOutputPath}"`;

  onProgress?.(0.85, "Finalizing video...");

  try {
    const session = await FFmpegKit.execute(concatCommand);
    const returnCode = await session.getReturnCode();

    try {
      if (concatFile.exists) concatFile.delete();
    } catch (error) {
      console.warn("Cleanup error:", error);
    }

    if (!ReturnCode.isSuccess(returnCode)) {
      const failureStackTrace = (await session.getFailStackTrace()) || "Unknown error";
      throw new Error(`Failed to combine clips: ${failureStackTrace}`);
    }
  } catch (error) {
    console.error("FFmpeg concat error:", error);
    throw new Error(`Failed to combine clips: ${error}`);
  }

  // 🔥 FINAL MAGIC: Agar stickers/overlays select huye the, unko chipkao!
  let finalVideoPath = concatOutputPath;
  if (overlays && overlays.length > 0) {
    onProgress?.(0.92, "Baking stickers & overlays...");
    const overlayOutputPath = `${baseUri}overlay_final_${Date.now()}.mp4`;
    
    try {
      finalVideoPath = await applyOverlaysToVideo(concatOutputPath, overlayOutputPath, overlays);
      
      // Purani concat video delete maro space bachane ke liye
      try {
        const tempVideo = new File(concatOutputPath);
        if (tempVideo.exists) tempVideo.delete();
      } catch (e) {}
    } catch (error) {
      console.warn("Overlay application failed, using video without overlays:", error);
      finalVideoPath = concatOutputPath;
    }
  }

  onProgress?.(1.0, "Export complete!");
  return finalVideoPath;
}

// ... (exportSingleClip waise hi rahega)
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
      const sourceVideo = new File(clip.uri);
      sourceVideo.copy(outputPath);
      return outputPath;
    }
  } else {
    if (clipHasFilter(clip) && clip.filterPreset) {
      onProgress?.(0.5, "Applying filter...");
      return await applyPresetToImage(clip.uri, outputPath, clip.filterPreset);
    } else {
      onProgress?.(0.5, "Copying image...");
      const sourceImage = new File(clip.uri);
      sourceImage.copy(outputPath);
      return outputPath;
    }
  }
}