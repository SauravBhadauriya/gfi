/**
 * systemCameraFallback.ts - Fallback recording backend using expo-image-picker system camera
 * NOT ENABLED YET - gated behind RECORDING_BACKEND constant
 * 
 * Provides:
 * 1. System camera video recording via expo-image-picker launchCameraAsync
 * 2. Creates clips compatible with the main recording flow
 * 
 * Used only if expo-camera recordAsync fails consistently.
 */

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import type { CameraClip } from '../types/camera.types';

const MAX_VIDEO_DURATION_SECONDS = 15; // Match active screen timerDuration

/**
 * Record video using system camera (expo-image-picker fallback)
 * Returns a CameraClip compatible with the main recording flow
 */
export async function recordVideoWithSystemCamera(): Promise<CameraClip | null> {
  try {
    if (__DEV__) console.log('[systemCameraFallback] Requesting media library permissions...');

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      if (__DEV__) console.warn('[systemCameraFallback] Camera permission denied');
      return null;
    }

    if (__DEV__) console.log('[systemCameraFallback] Launching system camera...');

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
      videoMaxDuration: MAX_VIDEO_DURATION_SECONDS,
      aspect: [9, 16], // Portrait/reel aspect ratio
    });

    if (result.canceled) {
      if (__DEV__) console.log('[systemCameraFallback] User cancelled');
      return null;
    }

    if (!result.assets || result.assets.length === 0) {
      if (__DEV__) console.warn('[systemCameraFallback] No assets returned');
      return null;
    }

    const asset = result.assets[0];
    const uri = asset.uri;
    const duration = asset.duration ?? 0;

    if (!uri) {
      if (__DEV__) console.warn('[systemCameraFallback] No uri in asset');
      return null;
    }

    // Validate file exists and size
    let fileSize = 0;
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        if (__DEV__) console.warn('[systemCameraFallback] File does not exist at', uri);
        return null;
      }
      if (fileInfo.isDirectory === false && fileInfo.size) {
        fileSize = fileInfo.size;
      }
    } catch (err) {
      if (__DEV__) console.warn('[systemCameraFallback] Failed to check file size:', err);
      return null;
    }

    if (fileSize <= 10240) {
      if (__DEV__) console.warn('[systemCameraFallback] File too small:', fileSize, 'bytes');
      return null;
    }

    const makeId = () => `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const clip: CameraClip = {
      id: makeId(),
      uri,
      duration: duration > 0 ? duration / 1000 : 0, // Convert ms to seconds
      type: 'video',
      source: 'camera', // Changed from 'system-camera' to valid source type
      speed: 1,
    };

    if (__DEV__) {
      console.log('[systemCameraFallback] ✅ SUCCESS:', {
        uri: uri.substring(Math.max(0, uri.length - 40)),
        duration: clip.duration.toFixed(2),
        fileSize: (fileSize / 1024).toFixed(1),
      });
    }

    return clip;
  } catch (error) {
    console.error('[systemCameraFallback] Error:', error);
    return null;
  }
}

/**
 * Pick video from gallery and convert to CameraClip
 * (Already implemented in CameraScreen.handleOpenGallery, keeping for reference)
 */
export async function pickVideoFromGallery(): Promise<CameraClip | null> {
  try {
    if (__DEV__) console.log('[systemCameraFallback] Requesting gallery permissions...');

    let permission = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (permission.status !== 'granted') {
      if (__DEV__) console.warn('[systemCameraFallback] Gallery permission denied');
      return null;
    }

    if (__DEV__) console.log('[systemCameraFallback] Launching gallery picker...');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      if (__DEV__) console.log('[systemCameraFallback] User cancelled or no assets');
      return null;
    }

    const asset = result.assets[0];
    const uri = asset.uri;
    const duration = asset.duration ?? 0;

    if (!uri) {
      if (__DEV__) console.warn('[systemCameraFallback] No uri in gallery asset');
      return null;
    }

    const makeId = () => `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const clip: CameraClip = {
      id: makeId(),
      uri,
      duration: duration > 0 ? duration / 1000 : 0,
      type: 'video',
      source: 'gallery',
      speed: 1,
    };

    if (__DEV__) {
      console.log('[systemCameraFallback] ✅ Gallery clip:', {
        uri: uri.substring(Math.max(0, uri.length - 40)),
        duration: clip.duration.toFixed(2),
      });
    }

    return clip;
  } catch (error) {
    console.error('[systemCameraFallback] Gallery error:', error);
    return null;
  }
}
