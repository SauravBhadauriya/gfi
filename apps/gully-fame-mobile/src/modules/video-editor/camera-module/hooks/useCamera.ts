import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
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
        const options: CameraRecordingOptions = {
          // Ensure recording actually produces frames on problematic devices
          quality: 1, // Max quality
          mute: false, // Allow audio
          videoBitrate: 5000000, // 5 Mbps
        };
        if (__DEV__) console.warn(`[useCamera.startRecording] recordAsync called with options:`, options);
        recordAsyncStartedAtRef.current = performance.now();
        const recordingPromise = cameraRef.current.recordAsync(options);

        // DISABLED: Auto-stop timer causes "stopped before any data" errors on some devices
        // User can tap the button again to stop recording instead
        // if (maxDurationSeconds && maxDurationSeconds > 0) {
        //   maxDurationTimerRef.current = setTimeout(async () => {
        //     if (cameraRef.current && isRecordingRef.current) {
        //       const elapsedMs = performance.now() - (recordAsyncStartedAtRef.current ?? 0);
        //       if (__DEV__) console.log(`[useCamera] Auto-stop timer fired after ${elapsedMs.toFixed(0)}ms (${maxDurationSeconds}s limit)`);
        //       try {
        //         await cameraRef.current.stopRecording();
        //       } catch (error) {
        //         if (__DEV__) console.warn('[useCamera] Failed to auto-stop recording', error);
        //       }
        //     }
        //   }, (maxDurationSeconds * 1000) + 100);
        // }

        recordingPromise
          .then((video: any) => {
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
            } else {
              if (__DEV__) console.warn(`[useCamera.recordAsync] ✅ SUCCESS: uri present, calling onFinished with clip`);
              void onFinished({
                id: makeId(),
                uri,
                duration,
                type: 'video',
                source: 'camera',
                speed: speed ?? 1,
              });
            }
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
        if (__DEV__) console.log(`[useCamera.stopRecording] Delayed stop now executing`);
        if (!cameraRef.current || !isRecordingRef.current) return;
        
        // Clear auto-stop timer
        if (maxDurationTimerRef.current) {
          clearTimeout(maxDurationTimerRef.current);
          maxDurationTimerRef.current = null;
        }

        isRecordingRef.current = false;
        pendingStopRef.current = false;

        try {
          await cameraRef.current.stopRecording();
        } catch (error) {
          if (__DEV__) console.warn('[useCamera.stopRecording] Exception during delayed stop:', error);
        }
        if (__DEV__) console.warn(`[useCamera.stopRecording] Delayed stop: calling setIsRecording(false)`);
        setIsRecording(false);
      }, delayNeeded);
      
      return;
    }

    // Clear auto-stop timer
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }

    isRecordingRef.current = false;
    pendingStopRef.current = false;

    try {
      await cameraRef.current.stopRecording();
    } catch (error) {
      if (__DEV__) console.warn('[useCamera.stopRecording] Exception:', error);
    }
    if (__DEV__) console.warn(`[useCamera.stopRecording] Calling setIsRecording(false) after successful stop`);
    setIsRecording(false);
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
