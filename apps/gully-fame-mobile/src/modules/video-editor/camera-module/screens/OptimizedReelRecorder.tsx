/**
 * OptimizedReelRecorder.tsx
 * 
 * Production-grade reel recording component with:
 * ✅ Screen focus lifecycle management (useIsFocused)
 * ✅ Dynamic camera + microphone permission handling
 * ✅ 60-second video recording with progress tracking
 * ✅ Camera flip, flash toggle, speed control (0.5x, 1x, 2x)
 * ✅ Graceful cleanup to prevent memory leaks on Android
 * ✅ Comprehensive error handling and recovery
 * 
 * Based on: Gully Fame mobile app (React Native/Expo)
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  useLayoutEffect,
  useId,
} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Platform,
  Alert,
  AppState,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useFocusEffect } from 'expo-router'; // ← Changed from @react-navigation/native
import * as Haptics from 'expo-haptics';

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

type CameraFacing = 'front' | 'back';
type FlashMode = 'on' | 'off' | 'auto';
type SpeedMultiplier = 0.5 | 1 | 1.5 | 2;
type RecordingState = 'idle' | 'recording' | 'paused' | 'processing';

interface RecordedClip {
  id: string;
  uri: string;
  duration: number; // seconds
  speed: SpeedMultiplier;
  timestamp: number;
}

interface ReelRecorderProps {
  maxDuration?: number; // Default: 60 seconds
  onRecordingComplete?: (clips: RecordedClip[]) => void;
  onError?: (error: Error) => void;
  onBack?: () => void;
}

// ═══════════════════════════════════════════════════════════════
// CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════

/**
 * Hook: useScreenFocus
 * Safely manages component lifecycle based on screen navigation using Expo Router
 */
const useScreenFocus = () => {
  const [isFocused, setIsFocused] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useFocusEffect(
    useCallback(() => {
      // Screen is now focused
      setIsFocused(true);
      setShouldRender(true);

      return () => {
        // Screen is about to be unfocused
        setIsFocused(false);

        // Delay unmounting to allow graceful cleanup
        const timer = setTimeout(() => setShouldRender(false), 500);
        return () => clearTimeout(timer);
      };
    }, [])
  );

  return { isFocused, shouldRender };
};

/**
 * Hook: usePermissionManager
 * Manages camera and microphone permissions with retry logic
 */
const usePermissionManager = () => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAllPermissions = useMemo(
    () =>
      cameraPermission?.granted === true &&
      micPermission?.granted === true,
    [cameraPermission?.granted, micPermission?.granted]
  );

  const requestAllPermissions = useCallback(async () => {
    try {
      setIsRequesting(true);
      setError(null);

      console.log('[usePermissionManager] Requesting camera & microphone permissions');

      const [camResult, micResult] = await Promise.all([
        requestCameraPermission(),
        requestMicrophonePermission(),
      ]);

      if (!camResult?.granted || !micResult?.granted) {
        const missingPerms = [];
        if (!camResult?.granted) missingPerms.push('Camera');
        if (!micResult?.granted) missingPerms.push('Microphone');

        const errorMsg = `${missingPerms.join(' and ')} permission${missingPerms.length > 1 ? 's' : ''} denied`;
        setError(errorMsg);
        console.warn(`[usePermissionManager] ${errorMsg}`);
        return false;
      }

      console.log('[usePermissionManager] ✅ All permissions granted');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error requesting permissions';
      setError(msg);
      console.error('[usePermissionManager] Permission request error:', err);
      return false;
    } finally {
      setIsRequesting(false);
    }
  }, [requestCameraPermission, requestMicrophonePermission]);

  return {
    hasAllPermissions,
    isRequesting,
    error,
    permissionsLoading: cameraPermission === null || micPermission === null,
    requestAllPermissions,
  };
};

/**
 * Hook: useRecordingTimer
 * Manages 60-second recording timer with progress tracking
 */
const useRecordingTimer = (isRecording: boolean, maxDuration: number = 60) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRecording) {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
      return;
    }

    const startTime = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);

      if (elapsed >= maxDuration) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        setElapsedSeconds(maxDuration);
      } else {
        setElapsedSeconds(elapsed);
      }
    }, 100); // Update every 100ms for smooth progress

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, maxDuration]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const progress = Math.min(elapsedSeconds / maxDuration, 1);
  const isTimeUp = elapsedSeconds >= maxDuration;

  return { elapsedSeconds, progress, isTimeUp };
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT: OptimizedReelRecorder
// ═══════════════════════════════════════════════════════════════

const OptimizedReelRecorder: React.FC<ReelRecorderProps> = ({
  maxDuration = 60,
  onRecordingComplete,
  onError,
  onBack,
}) => {
  // ─────────────────────── Screen Lifecycle ───────────────────────
  const { isFocused, shouldRender } = useScreenFocus();

  // ─────────────────────── Permissions ───────────────────────
  const permissions = usePermissionManager();

  // ─────────────────────── Camera References ───────────────────────
  const cameraRef = useRef<CameraView>(null);
  const recordingRef = useRef<ReturnType<typeof CameraView.recordAsync> | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordingStateRef = useRef<RecordingState>('idle');

  // ─────────────────────── Recording Timer ───────────────────────
  const { elapsedSeconds, progress, isTimeUp } = useRecordingTimer(isRecording, maxDuration);

  // ─────────────────────── Camera Settings ───────────────────────
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('front');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [speed, setSpeed] = useState<SpeedMultiplier>(1);
  const [zoom, setZoom] = useState(1);
  const [cameraReady, setCameraReady] = useState(false);

  // ─────────────────────── UI State ───────────────────────
  const [clips, setClips] = useState<RecordedClip[]>([]);
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // ─────────────────────── Animation ───────────────────────
  const progressAnim = useRef(new Animated.Value(0)).current;
  const recordingPulseAnim = useRef(new Animated.Value(1)).current;

  const componentId = useId();

  // ═══════════════════════════════════════════════════════════════
  // LIFECYCLE EFFECTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Request permissions on component mount
   */
  useEffect(() => {
    if (permissions.permissionsLoading || isRequesting) return;

    console.log(`[OptimizedReelRecorder:${componentId}] Requesting initial permissions`);
    void permissions.requestAllPermissions();
  }, [permissions, componentId]);

  /**
   * Stop recording when user leaves screen (useIsFocused)
   */
  useEffect(() => {
    if (!isFocused && isRecording) {
      console.warn(`[OptimizedReelRecorder:${componentId}] Screen lost focus - stopping recording`);
      void stopRecording();
    }
  }, [isFocused]);

  /**
   * Stop recording when time limit reached
   */
  useEffect(() => {
    if (isTimeUp && isRecording) {
      console.log(`[OptimizedReelRecorder:${componentId}] Max duration reached - auto-stopping`);
      void stopRecording();
      // Haptic feedback for user awareness
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [isTimeUp, isRecording]);

  /**
   * Animate progress bar
   */
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  /**
   * Recording pulse animation (breathing effect)
   */
  useEffect(() => {
    if (!isRecording) {
      recordingPulseAnim.setValue(1);
      return;
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(recordingPulseAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(recordingPulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [isRecording, recordingPulseAnim]);

  /**
   * Cleanup on unmount (CRITICAL for Android memory leaks)
   */
  useEffect(() => {
    return () => {
      console.log(`[OptimizedReelRecorder:${componentId}] Cleanup on unmount`);

      // Cancel any pending recording
      if (isRecording) {
        recordingStateRef.current = 'idle';
        void stopRecording().catch(err =>
          console.error(`[OptimizedReelRecorder:${componentId}] Error during cleanup:`, err)
        );
      }

      // Release animation refs
      recordingPulseAnim.setValue(1);
      progressAnim.setValue(0);

      // Clear camera ref
      cameraRef.current = null;
      recordingRef.current = null;
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // CAMERA CONTROL FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Start video recording
   */
  const startRecording = useCallback(async () => {
    if (!cameraRef.current || !cameraReady || isRecording) {
      console.warn('[OptimizedReelRecorder] Cannot start recording - pre-checks failed', {
        hasRef: !!cameraRef.current,
        cameraReady,
        isRecording,
      });
      return;
    }

    try {
      recordingStateRef.current = 'recording';
      setIsRecording(true);

      console.log(`[OptimizedReelRecorder:${componentId}] Starting video recording`);

      // Start recording with no options (uses device defaults)
      const recordingPromise = cameraRef.current.recordAsync({});

      // Store promise for manual stop
      recordingRef.current = recordingPromise;

      // Handle recording completion
      recordingPromise
        .then((video) => {
          console.log(`[OptimizedReelRecorder:${componentId}] Recording completed`, {
            duration: video?.duration,
            hasUri: !!video?.uri,
          });

          if (video?.uri) {
            const newClip: RecordedClip = {
              id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              uri: video.uri,
              duration: video.duration ?? 0,
              speed,
              timestamp: Date.now(),
            };

            setClips(prev => [...prev, newClip]);
          }

          setIsRecording(false);
          recordingStateRef.current = 'idle';
          recordingRef.current = null;
        })
        .catch((error) => {
          console.error(`[OptimizedReelRecorder:${componentId}] Recording error:`, error);
          setIsRecording(false);
          recordingStateRef.current = 'idle';
          recordingRef.current = null;

          const errorMsg = error instanceof Error ? error.message : 'Recording failed';
          Alert.alert('Recording Error', errorMsg);
          onError?.(error instanceof Error ? error : new Error(errorMsg));
        });

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error(`[OptimizedReelRecorder:${componentId}] Sync error starting recording:`, error);
      setIsRecording(false);
      recordingStateRef.current = 'idle';

      const err = error instanceof Error ? error : new Error(String(error));
      Alert.alert('Error', err.message);
      onError?.(err);
    }
  }, [cameraReady, isRecording, speed, onError, componentId]);

  /**
   * Stop video recording
   */
  const stopRecording = useCallback(async () => {
    if (!cameraRef.current || !isRecording) {
      console.warn('[OptimizedReelRecorder] Cannot stop recording - not recording', {
        hasRef: !!cameraRef.current,
        isRecording,
      });
      return;
    }

    try {
      recordingStateRef.current = 'paused';

      console.log(`[OptimizedReelRecorder:${componentId}] Stopping recording`);

      // Stop and let promise handle completion
      await cameraRef.current.stopRecording();

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error(`[OptimizedReelRecorder:${componentId}] Error stopping recording:`, error);
      setIsRecording(false);
      recordingStateRef.current = 'idle';

      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
    }
  }, [isRecording, onError, componentId]);

  /**
   * Toggle camera (front/back)
   */
  const toggleCamera = useCallback(() => {
    console.log(`[OptimizedReelRecorder:${componentId}] Toggling camera`);
    setCameraFacing(prev => (prev === 'front' ? 'back' : 'front'));
    setZoom(1); // Reset zoom on switch
    void Haptics.selectionAsync();
  }, [componentId]);

  /**
   * Toggle flash mode
   */
  const toggleFlash = useCallback(() => {
    setFlashMode(prev => {
      const modes: FlashMode[] = ['off', 'on', 'auto'];
      const nextIndex = (modes.indexOf(prev) + 1) % modes.length;
      return modes[nextIndex];
    });
    void Haptics.selectionAsync();
  }, []);

  /**
   * Update recording speed
   */
  const setRecordingSpeed = useCallback((newSpeed: SpeedMultiplier) => {
    console.log(`[OptimizedReelRecorder:${componentId}] Speed changed to ${newSpeed}x`);
    setSpeed(newSpeed);
    void Haptics.selectionAsync();
  }, [componentId]);

  /**
   * Remove last recorded clip
   */
  const undoLastClip = useCallback(() => {
    if (clips.length > 0) {
      console.log(`[OptimizedReelRecorder:${componentId}] Removing last clip`);
      setClips(prev => prev.slice(0, -1));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [clips.length, componentId]);

  /**
   * Finish recording session
   */
  const finishRecording = useCallback(async () => {
    if (clips.length === 0) {
      Alert.alert('No Clips', 'Please record at least one clip before finishing');
      return;
    }

    try {
      setIsProcessing(true);

      console.log(`[OptimizedReelRecorder:${componentId}] Finishing recording session`, {
        clipsCount: clips.length,
        totalDuration: clips.reduce((sum, c) => sum + c.duration, 0),
      });

      // Simulate processing (in real app, would upload to server)
      await new Promise(resolve => setTimeout(resolve, 500));

      onRecordingComplete?.(clips);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      Alert.alert('Error', err.message);
      onError?.(err);
    } finally {
      setIsProcessing(false);
    }
  }, [clips, onRecordingComplete, onError, componentId]);

  // ═══════════════════════════════════════════════════════════════
  // RENDER CONDITIONS
  // ═══════════════════════════════════════════════════════════════

  // Permissions still loading
  if (permissions.permissionsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.permissionText}>Loading permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Permissions requested but not yet granted
  if (permissions.isRequesting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.permissionText}>Requesting camera & microphone access...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Permissions denied
  if (!permissions.hasAllPermissions) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.permissionText}>📱 Camera & Microphone permissions required</Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => void permissions.requestAllPermissions()}
          >
            <Text style={styles.permissionButtonText}>Grant Permissions</Text>
          </TouchableOpacity>
          {permissions.error && (
            <Text style={styles.errorText}>{permissions.error}</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Screen not focused - don't render camera (saves resources)
  if (!shouldRender) {
    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════

  const normalizedZoom = Math.min(Math.max((zoom - 1) / 3, 0), 1);
  const totalRecordedDuration = clips.reduce((sum, c) => sum + c.duration, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Camera Preview */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing={cameraFacing}
        flash={flashMode}
        mode="video"
        zoom={normalizedZoom}
        videoQuality="1080p"
        onCameraReady={() => {
          console.log(`[OptimizedReelRecorder:${componentId}] ✅ Camera ready`);
          setCameraReady(true);
        }}
      />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onBack}
          disabled={isRecording}
        >
          <Text style={styles.headerButtonText}>✕ Back</Text>
        </TouchableOpacity>

        <View style={styles.timerDisplay}>
          <Text style={styles.timerText}>
            {String(elapsedSeconds).padStart(2, '0')}s / {maxDuration}s
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={toggleFlash}
          disabled={isRecording}
        >
          <Text style={styles.headerButtonText}>
            {flashMode === 'off' ? '💡' : '🔦'} {flashMode.toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recording Progress Bar */}
      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Speed Control */}
      <View style={styles.speedControlContainer}>
        {([0.5, 1, 1.5, 2] as SpeedMultiplier[]).map(s => (
          <TouchableOpacity
            key={s}
            style={[
              styles.speedButton,
              speed === s && styles.speedButtonActive,
            ]}
            onPress={() => setRecordingSpeed(s)}
            disabled={isRecording}
          >
            <Text style={styles.speedButtonText}>{s}x</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Clips Counter */}
      <View style={styles.clipsDisplay}>
        <Text style={styles.clipsText}>📹 {clips.length} clip(s)</Text>
        <Text style={styles.durationText}>{totalRecordedDuration.toFixed(1)}s</Text>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Left: Camera Toggle */}
        <TouchableOpacity
          style={[styles.controlButton, !isRecording && styles.controlButtonActive]}
          onPress={toggleCamera}
          disabled={isRecording}
        >
          <Text style={styles.controlButtonText}>🔄</Text>
        </TouchableOpacity>

        {/* Center: Record / Stop Button */}
        <Animated.View
          style={[
            styles.recordButtonContainer,
            {
              transform: [
                {
                  scale: recordingPulseAnim,
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={!cameraReady || isProcessing}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.recordButtonInner,
                isRecording && styles.recordButtonInnerRecording,
              ]}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Right: Undo / Finish */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            clips.length > 0 && styles.controlButtonActive,
          ]}
          onPress={clips.length > 0 ? finishRecording : undoLastClip}
          disabled={clips.length === 0 || isProcessing}
        >
          <Text style={styles.controlButtonText}>
            {clips.length > 0 ? '✓' : '↶'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Processing Indicator */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  permissionText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    color: '#ff4757',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#0095ff',
    borderRadius: 24,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 100,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  timerDisplay: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
  },
  timerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  progressBarContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 50,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ff007f',
  },
  speedControlContainer: {
    position: 'absolute',
    top: 120,
    left: 16,
    flexDirection: 'row',
    gap: 8,
    zIndex: 50,
  },
  speedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  speedButtonActive: {
    backgroundColor: '#0095ff',
    borderColor: '#0095ff',
  },
  speedButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  clipsDisplay: {
    position: 'absolute',
    bottom: 200,
    right: 16,
    alignItems: 'flex-end',
    zIndex: 50,
  },
  clipsText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  durationText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 100,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  controlButtonText: {
    fontSize: 24,
  },
  recordButtonContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  recordButtonActive: {
    backgroundColor: '#ff4757',
    borderColor: '#ff4757',
  },
  recordButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
  },
  recordButtonInnerRecording: {
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  processingText: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
});

export default OptimizedReelRecorder;
