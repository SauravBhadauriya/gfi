import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import type { CameraRecordingOptions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
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
  const recordingStartedAtRef = useRef<number | null>(null);
  const recordAsyncStartedAtRef = useRef<number | null>(null);
  const stopRecordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStopRef = useRef(false);
  
  // Minimum recording duration: 1000ms to ensure frames are written
  const MIN_RECORDING_DURATION_MS = 1000;

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
      if (!cameraRef.current || mode !== CameraModeEnum.Video || isRecordingRef.current) {
        if (__DEV__) console.log('[useCamera.startRecording] Early return:', { hasRef: !!cameraRef.current, isVideo: mode === CameraModeEnum.Video, alreadyRecording: isRecordingRef.current });
        return;
      }

      const makeId = () =>
        `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

      const startTime = performance.now();
      recordingStartedAtRef.current = Date.now();
      if (__DEV__) console.log(`[useCamera.startRecording] START: recordAsync called at ${startTime.toFixed(0)}ms, maxDuration=${maxDurationSeconds}s, speed=${speed}`);

      setIsRecording(true);
      isRecordingRef.current = true;

      // Clear any existing timer
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
      }

      try {
        // PHASE 1 FIX: Only pass valid expo-camera v57 recordAsync options
        // Removed: quality (photo-only), videoBitrate (not valid in v57)
        // Note: mute is a runtime option not in TypeScript types; using cast
        const options: CameraRecordingOptions & { mute?: boolean } = {
          mute: false, // Allow audio (microphone permission already requested in usePermissions)
          ...(maxDurationSeconds && maxDurationSeconds > 0 ? { maxDuration: maxDurationSeconds } : {}), // maxDuration in seconds (not ms as docs suggest)
        };
        if (__DEV__) console.warn(`[useCamera.startRecording] recordAsync called with options:`, options);
        recordAsyncStartedAtRef.current = performance.now();
        const recordingPromise = cameraRef.current.recordAsync(options as CameraRecordingOptions);

        // PHASE 1 FIX: Disabled fallback timer - causes encoder to reject stream on Unisoc ums9621
        // maxDuration option is still passed to recordAsync (may work on other devices).
        // On devices where it fails, user must tap stop button to end recording.
        // Fallback timer would interrupt encoding before data is written.

        recordingPromise
          .then(async (video: any) => {
            const elapsedMs = performance.now() - (recordAsyncStartedAtRef.current ?? 0);
            // Clear timer if recording finishes before timeout
            if (maxDurationTimerRef.current) {
              clearTimeout(maxDurationTimerRef.current);
              maxDurationTimerRef.current = null;
            }
            if (__DEV__) console.warn(`[useCamera.recordAsync] RESOLVED after ${elapsedMs.toFixed(0)}ms, calling setIsRecording(false)`);
            setIsRecording(false);
            isRecordingRef.current = false;
            const uri = (video as { uri?: string }).uri ?? '';
            const duration = (video as { duration?: number }).duration ?? 0;

            if (__DEV__) console.log(`[useCamera.recordAsync] RESOLVED after ${elapsedMs.toFixed(0)}ms: uri=${uri ? 'present' : 'missing'}, duration=${duration}`);

            if (!uri) {
              if (__DEV__) console.warn(`[useCamera.recordAsync] NO URI returned, calling onFinished(null)`);
              void onFinished(null);
              return;
            }

            // PHASE 1 FIX: Validate file size (>10KB required)
            let fileSize = 0;
            try {
              const fileInfo = await FileSystem.getInfoAsync(uri);
              if (!fileInfo.exists) {
                if (__DEV__) console.warn(`[useCamera.recordAsync] File does not exist at ${uri}, calling onFinished(null)`);
                void onFinished(null);
                return;
              }
              fileSize = fileInfo.size ?? 0;
            } catch (err) {
              if (__DEV__) console.warn(`[useCamera.recordAsync] Failed to check file size:`, err);
              void onFinished(null);
              return;
            }

            if (fileSize <= 10240) { // 10 KB threshold
              if (__DEV__) console.warn(`[useCamera.recordAsync] File too small: ${fileSize} bytes, recording produced no data`);
              void onFinished(null);
              return;
            }

            if (__DEV__) console.warn(`[useCamera.recordAsync] ✅ SUCCESS: uri present (${(fileSize / 1024).toFixed(1)}KB), calling onFinished with clip`);
            void onFinished({
              id: makeId(),
              uri,
              duration: duration > 0 ? duration : elapsedMs / 1000, // Fallback to elapsed time
              type: 'video',
              source: 'camera',
              speed: speed ?? 1,
            });
          })
          .catch((error: any) => {
            const elapsedMs = performance.now() - (recordAsyncStartedAtRef.current ?? 0);
            // Clear timer on error
            if (maxDurationTimerRef.current) {
              clearTimeout(maxDurationTimerRef.current);
              maxDurationTimerRef.current = null;
            }
            const errorCode = error?.code ?? 'UNKNOWN';
            const errorMsg = error?.message ?? String(error);
            
            // Handle "recording was stopped before any data" gracefully
            const isTooShortError = errorMsg.includes('stopped before any data');
            if (__DEV__) {
              if (isTooShortError) {
                console.log(`[useCamera.recordAsync] REJECTED after ${elapsedMs.toFixed(0)}ms: Too short (${errorCode}): ${errorMsg}`);
              } else {
                console.warn(`[useCamera.recordAsync] REJECTED after ${elapsedMs.toFixed(0)}ms: (${errorCode}): ${errorMsg}`);
              }
            }
            
            setIsRecording(false);
            isRecordingRef.current = false;
            void onFinished(null);
          });
      } catch (error) {
        const elapsedMs = performance.now() - (recordAsyncStartedAtRef.current ?? 0);
        // Clear timer on error
        if (maxDurationTimerRef.current) {
          clearTimeout(maxDurationTimerRef.current);
          maxDurationTimerRef.current = null;
        }
        if (__DEV__) console.warn(`[useCamera] Failed to start recording after ${elapsedMs.toFixed(0)}ms:`, error);
        setIsRecording(false);
        isRecordingRef.current = false;
        void onFinished(null);
      }
    },
    [isRecording, mode],
  );

  const stopRecording = useCallback(async (): Promise<void> => {
    if (!cameraRef.current || !isRecordingRef.current) {
      if (__DEV__ && isRecordingRef.current === false) console.log('[useCamera.stopRecording] Ignored: not recording');
      return;
    }

    const elapsedMs = recordingStartedAtRef.current ? Date.now() - recordingStartedAtRef.current : 0;
    if (__DEV__) console.log(`[useCamera.stopRecording] STOP called after ${elapsedMs}ms of recording`);

    // GUARD: Enforce minimum recording duration to ensure frames are written
    if (elapsedMs < MIN_RECORDING_DURATION_MS) {
      const delayNeeded = MIN_RECORDING_DURATION_MS - elapsedMs;
      if (__DEV__) console.log(`[useCamera.stopRecording] Too short (${elapsedMs}ms < ${MIN_RECORDING_DURATION_MS}ms). Delaying stop by ${delayNeeded}ms.`);
      
      pendingStopRef.current = true;
      if (stopRecordingTimeoutRef.current) clearTimeout(stopRecordingTimeoutRef.current);
      
      stopRecordingTimeoutRef.current = setTimeout(async () => {
        try {
          if (__DEV__) console.log(`[useCamera.stopRecording] Delayed stop now executing`);
          if (!cameraRef.current || !isRecordingRef.current) return;
          
          // Clear auto-stop timer
          if (maxDurationTimerRef.current) {
            clearTimeout(maxDurationTimerRef.current);
            maxDurationTimerRef.current = null;
          }

          isRecordingRef.current = false;
          pendingStopRef.current = false;
          await cameraRef.current.stopRecording();
        } catch (error) {
          if (__DEV__) console.warn('[useCamera.stopRecording] Exception during delayed stop:', error);
          isRecordingRef.current = false;
          pendingStopRef.current = false;
        } finally {
          if (__DEV__) console.warn(`[useCamera.stopRecording] Delayed stop: calling setIsRecording(false)`);
          setIsRecording(false);
        }
      }, delayNeeded);
      
      return;
    }

    // PHASE 1 FIX: Use try/finally to ensure locks are reset even if stopRecording throws
    try {
      // Clear auto-stop timer
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
      }

      isRecordingRef.current = false;
      pendingStopRef.current = false;
      await cameraRef.current.stopRecording();
      if (__DEV__) console.warn(`[useCamera.stopRecording] Calling setIsRecording(false) after successful stop`);
    } catch (error) {
      if (__DEV__) console.warn('[useCamera.stopRecording] Exception:', error);
      isRecordingRef.current = false;
      pendingStopRef.current = false;
    } finally {
      setIsRecording(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
      }
      if (stopRecordingTimeoutRef.current) {
        clearTimeout(stopRecordingTimeoutRef.current);
      }
      if (cameraRef.current && isRecordingRef.current) {
        cameraRef.current.stopRecording();
      }
      isRecordingRef.current = false;
      pendingStopRef.current = false;
    };
  }, []);

  return {
    cameraRef,
    isRecording,
    takePhoto,
    startRecording,
    stopRecording,
  };
};
