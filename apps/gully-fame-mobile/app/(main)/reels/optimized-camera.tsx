/**
 * Optimized Camera Screen
 * 
 * This is a ready-to-use screen that integrates OptimizedReelRecorder
 * into your Expo Router navigation.
 * 
 * Usage:
 * - Automatically available at: app/(main)/reels/optimized-camera
 * - Or import and use directly in any component
 */

import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import OptimizedReelRecorder from '@modules/video-editor/camera-module/screens/OptimizedReelRecorder';

interface RecordedClip {
  id: string;
  uri: string;
  duration: number;
  speed: 0.5 | 1 | 1.5 | 2;
  timestamp: number;
}

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
    (clips: RecordedClip[]) => {
      console.log('[OptimizedCameraScreen] Recording complete', {
        clipsCount: clips.length,
        totalDuration: clips.reduce((sum, c) => sum + c.duration, 0),
      });

      // Navigate to preview screen with clips
      router.push({
        pathname: '/reels/preview',
        params: {
          clips: JSON.stringify(clips),
          source: 'optimized-camera',
        },
      });
    },
    [router]
  );

  /**
   * When recording encounters an error
   */
  const handleRecordingError = useCallback((error: Error) => {
    console.error('[OptimizedCameraScreen] Recording error:', error);

    Alert.alert(
      'Recording Error',
      error.message || 'Failed to record video. Please try again.',
      [
        {
          text: 'OK',
          onPress: () => {
            // User can retry
          },
        },
        {
          text: 'Go Back',
          onPress: () => router.back(),
          style: 'cancel',
        },
      ]
    );
  }, [router]);

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
    <OptimizedReelRecorder
      maxDuration={60}
      onRecordingComplete={handleRecordingComplete}
      onError={handleRecordingError}
      onBack={handleBack}
    />
  );
}
