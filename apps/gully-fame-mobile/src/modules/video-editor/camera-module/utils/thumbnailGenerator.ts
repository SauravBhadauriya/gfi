import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { CameraClip } from '../types/camera.types';

// Note: For video thumbnails, you may need to install expo-file-system
// or use ffmpeg-kit-react-native for frame extraction

const THUMBNAIL_WIDTH = 120;
const THUMBNAIL_HEIGHT = 80;
const THUMBNAIL_QUALITY = 0.8;

/**
 * Generate a thumbnail for a video clip at a specific time
 * Uses FFmpeg-kit if available, otherwise falls back to image manipulation
 */
export async function generateVideoThumbnail(
  videoUri: string,
  timeSeconds: number = 0
): Promise<string | null> {
  try {
    // TODO: Implement video thumbnail extraction using ffmpeg-kit-react-native
    // Example FFmpeg command:
    // ffmpeg -i input.mp4 -ss ${timeSeconds} -vframes 1 -vf scale=120:80 output.jpg
    
    // For now, return null - the timeline will show a placeholder
    // You can implement this using:
    // 1. ffmpeg-kit-react-native to extract frames
    // 2. Or use expo-file-system + expo-image-manipulator if you have frame extraction
    
    return null;
  } catch (error) {
    console.warn('Error generating video thumbnail:', error);
    return null;
  }
}

/**
 * Generate a thumbnail for an image clip
 */
export async function generateImageThumbnail(imageUri: string): Promise<string | null> {
  try {
    // Use expo-file-system's cacheDirectory
    const cacheBase = (FileSystem as any).cacheDirectory || '';
    const cacheDir = `${cacheBase}thumbnails/`;
    const exists = await FileSystem.getInfoAsync(cacheDir);
    if (!exists.exists) {
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
    }
    
    const filename = `thumb_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
    const outputUri = `${cacheDir}${filename}`;
    
    const manipulated = await manipulateAsync(
      imageUri,
      [{ resize: { width: THUMBNAIL_WIDTH, height: THUMBNAIL_HEIGHT } }],
      { compress: THUMBNAIL_QUALITY, format: SaveFormat.JPEG }
    );
    
    return manipulated.uri;
  } catch (error) {
    console.warn('Error generating image thumbnail:', error);
    return null;
  }
}

/**
 * Generate thumbnail for a clip (video or image)
 */
export async function generateClipThumbnail(clip: CameraClip): Promise<string | null> {
  if (clip.type === 'video') {
    // Use middle of clip or trim start
    const time = clip.trimStart ?? clip.duration / 2;
    return generateVideoThumbnail(clip.uri, time);
  } else {
    // For images, always generate thumbnail
    return generateImageThumbnail(clip.uri);
  }
}

/**
 * Batch generate thumbnails for multiple clips
 */
export async function generateThumbnailsForClips(
  clips: CameraClip[]
): Promise<Map<string, string>> {
  const thumbnails = new Map<string, string>();
  
  // Generate thumbnails in parallel for better performance
  const thumbnailPromises = clips.map(async (clip) => {
    if (clip.thumbnailUri) {
      return { clipId: clip.id, thumbnail: clip.thumbnailUri };
    }
    
    const thumbnail = await generateClipThumbnail(clip);
    return { clipId: clip.id, thumbnail };
  });
  
  const results = await Promise.all(thumbnailPromises);
  
  for (const result of results) {
    if (result.thumbnail) {
      thumbnails.set(result.clipId, result.thumbnail);
    }
  }
  
  return thumbnails;
}

