/**
 * Optimized Camera Screen
 * 
 * This is a ready-to-use screen that integrates CameraScreen
 * into your Expo Router navigation.
 * 
 * Usage:
 * - Automatically available at: app/(main)/reels/optimized-camera
 * - Or import and use directly in any component
 */

import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import CameraScreen from '@modules/video-editor/camera-module/screens/CameraScreen';
import type { CameraClipArray } from '@modules/video-editor/camera-module/types/camera.types';

/**
 * Main camera screen with OptimizedReelRecorder
 */
export default function OptimizedCameraScreen() {
  const router = useRouter();

  // ─────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────

  /**
   * When user finishes recording (taps "Finish")
   */
  const handleRecordingComplete = useCallback(
    (clips: CameraClipArray) => {
      console.log('[OptimizedCameraScreen] Recording complete', {
        clipsCount: clips.length,
        totalDuration: clips.reduce((sum: number, c: any) => sum + c.duration, 0),
      });

      // Navigate to preview screen with clips (use full path with main group)
      router.push({
        pathname: '/(main)/reels/preview',
        params: {
          clips: JSON.stringify(clips),
          source: 'optimized-camera',
        },
      });
    },
    [router]
  );

  /**
   * When user presses back/close button
   */
  const handleBack = useCallback(() => {
    console.log('[OptimizedCameraScreen] User pressed back');
    router.back();
  }, [router]);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <CameraScreen
      onBack={handleBack}
      onNext={handleRecordingComplete}
    />
  );
}
