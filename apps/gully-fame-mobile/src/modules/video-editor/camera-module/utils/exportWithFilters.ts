import * as FileSystem from 'expo-file-system';
import type { CameraClip } from '../types/camera.types';
import { applyPresetToImage, applyPresetToVideo } from './ffmpegFilters';
import { clipHasFilter } from './filterHelpers';

/**
 * Exports a clip with its filter preset applied (if any)
 * @param clip - The clip to export
 * @param outputPath - Path where the filtered media will be saved
 * @returns Promise that resolves to the output path
 */
export async function exportClipWithFilter(
  clip: CameraClip,
  outputPath: string
): Promise<string> {
  // Check if clip has a filter preset
  if (clipHasFilter(clip) && clip.filterPreset) {
    console.log(`Exporting ${clip.type} with filter:`, clip.filterPreset.name);
    
    if (clip.type === 'photo') {
      // Apply filter to image using FFmpeg
      return await applyPresetToImage(clip.uri, outputPath, clip.filterPreset);
    } else {
      // Apply filter to video using FFmpeg
      return await applyPresetToVideo(clip.uri, outputPath, clip.filterPreset);
    }
  } else {
    // No filter - just copy original file
    console.log(`Exporting ${clip.type} without filter (Original)`);
    await FileSystem.copyAsync({ from: clip.uri, to: outputPath });
    return outputPath;
  }
}

/**
 * Exports multiple clips with their filter presets applied
 * @param clips - Array of clips to export
 * @param outputDir - Directory where exported files will be saved
 * @returns Promise that resolves to array of output paths
 */
export async function exportClipsWithFilters(
  clips: CameraClip[],
  outputDir: string
): Promise<string[]> {
  // Ensure output directory exists
  const dirInfo = await FileSystem.getInfoAsync(outputDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(outputDir, { intermediates: true });
  }

  const outputPaths: string[] = [];

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const extension = clip.type === 'photo' ? '.jpg' : '.mp4';
    const outputPath = `${outputDir}/clip_${i}${extension}`;
    
    const exportedPath = await exportClipWithFilter(clip, outputPath);
    outputPaths.push(exportedPath);
  }

  return outputPaths;
}

