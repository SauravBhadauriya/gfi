import { useCallback, useRef, useState, type MutableRefObject } from 'react';
import type { CameraRecordingOptions } from 'expo-camera';
import type { CameraClip } from '../types/camera.types';
import { CameraModeEnum } from '../utils/mediaTypes';

export interface UseCameraResult {
  cameraRef: MutableRefObject<any>;
  isRecording: boolean;
  takePhoto: () => Promise<CameraClip | null>;
  startRecording: (onFinished: (clip: CameraClip | null) => void | Promise<void>, maxDurationSeconds?: number, speed?: number) => Promise<void>;
  stopRecording: () => Promise<void>;
}

/**
 * Hook that encapsulates expo-camera capture logic.
 */
export const useCamera = (mode: CameraModeEnum, _flash: unknown): UseCameraResult => {
  const cameraRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecordingRef = useRef(false);

  const takePhoto = useCallback(async (): Promise<CameraClip | null> => {
    if (!cameraRef.current || mode !== CameraModeEnum.Photo) {
      return null;
    }

    const makeId = () =>
      `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      const photo = await cameraRef.current.takePictureAsync();
      const uri = (photo as { uri?: string }).uri ?? '';
      if (!uri) {
        return null;
      }

      return {
        id: makeId(),
        uri,
        duration: 0,
        type: 'photo',
        source: 'camera',
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to take photo', error);
      return null;
    }
  }, [mode]);

  const startRecording = useCallback(
    async (onFinished: (clip: CameraClip | null) => void | Promise<void>, maxDurationSeconds?: number, speed?: number): Promise<void> => {
      if (!cameraRef.current || mode !== CameraModeEnum.Video || isRecording) {
        return;
      }

      const makeId = () =>
        `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

      setIsRecording(true);
      isRecordingRef.current = true;

      // Clear any existing timer
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
      }

      try {
        const options: CameraRecordingOptions = {};
        const recordingPromise = cameraRef.current.recordAsync(options);

        // Set up auto-stop timer if maxDuration is provided
        if (maxDurationSeconds && maxDurationSeconds > 0) {
          maxDurationTimerRef.current = setTimeout(async () => {
            if (cameraRef.current && isRecordingRef.current) {
              try {
                await cameraRef.current.stopRecording();
              } catch (error) {
                // eslint-disable-next-line no-console
                console.warn('Failed to auto-stop recording', error);
              }
            }
          }, maxDurationSeconds * 1000);
        }

        recordingPromise
          .then((video: any) => {
            // Clear timer if recording finishes before timeout
            if (maxDurationTimerRef.current) {
              clearTimeout(maxDurationTimerRef.current);
              maxDurationTimerRef.current = null;
            }
            setIsRecording(false);
            isRecordingRef.current = false;
            const uri = (video as { uri?: string }).uri ?? '';
            const duration = (video as { duration?: number }).duration ?? 0;

            if (!uri) {
              void onFinished(null);
            } else {
              void onFinished({
                id: makeId(),
                uri,
                duration,
                type: 'video',
                source: 'camera',
                speed: speed ?? 1, // Store speed multiplier with clip
              });
            }
          })
          .catch((error: any) => {
            // Clear timer on error
            if (maxDurationTimerRef.current) {
              clearTimeout(maxDurationTimerRef.current);
              maxDurationTimerRef.current = null;
            }
            // eslint-disable-next-line no-console
            console.error('Recording error', error);
            setIsRecording(false);
            isRecordingRef.current = false;
            void onFinished(null);
          });
      } catch (error) {
        // Clear timer on error
        if (maxDurationTimerRef.current) {
          clearTimeout(maxDurationTimerRef.current);
          maxDurationTimerRef.current = null;
        }
        // eslint-disable-next-line no-console
        console.error('Failed to start recording', error);
        setIsRecording(false);
        isRecordingRef.current = false;
        void onFinished(null);
      }
    },
    [isRecording, mode],
  );

  const stopRecording = useCallback(async (): Promise<void> => {
    if (!cameraRef.current || !isRecording) {
      return;
    }

    // Clear auto-stop timer
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }

    isRecordingRef.current = false;

    try {
      await cameraRef.current.stopRecording();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to stop recording', error);
    }
  }, [isRecording]);

  return {
    cameraRef,
    isRecording,
    takePhoto,
    startRecording,
    stopRecording,
  };
};

