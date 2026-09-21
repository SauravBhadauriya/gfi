/**
 * Complete Camera Screen Implementation with Multi-Segment Support
 * Features:
 * - Fixed Android black preview: keep CameraView mounted (flex:1) and toggle
 *   the `active` prop instead of conditionally unmounting on focus change.
 * - Fixed Android recording crash (mute passed to recordAsync)
 * - Multi-segment recording (stitch multiple clips)
 * - Next button & Delete last segment control
 * - Seamless integration with ReelPreviewScreen FFmpeg merger
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type UIMode = 'REEL' | 'LIVE';
type CameraFacing = 'front' | 'back';
type FlashMode = 'on' | 'off' | 'auto';
type SpeedMultiplier = 0.5 | 1 | 2 | 3;
type TimerDuration = 0 | 3 | 10;

export interface RecordingSegment {
  uri: string;
  duration: number;
  timestamp: number;
}

interface CameraScreenState {
  mode: UIMode;
  isRecording: boolean;
  recordingTime: number;
  cameraFacing: CameraFacing;
  flash: FlashMode;
  speed: SpeedMultiplier;
  timer: TimerDuration;
  maxDuration: number; // 60s for REEL
  selectedMusic: { id: string; name: string } | null;
  segments: RecordingSegment[];
}

const INITIAL_STATE: CameraScreenState = {
  mode: 'REEL',
  isRecording: false,
  recordingTime: 0,
  cameraFacing: 'front',
  flash: 'off',
  speed: 1,
  timer: 0,
  maxDuration: 60,
  selectedMusic: null,
  segments: [],
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CameraScreen() {
  const isFocused = useIsFocused();
  const [state, setState] = useState<CameraScreenState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [showSpeedModal, setShowSpeedModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);

  const cameraRef = useRef<any>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout>();
  const countdownTimerRef = useRef<NodeJS.Timeout>();
  const currentSegmentDurationRef = useRef<number>(0);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  useEffect(() => {
    (async () => {
      try {
        if (!cameraPermission?.granted) await requestCameraPermission();
        if (!microphonePermission?.granted) await requestMicrophonePermission();
        setIsLoading(false);
      } catch (error) {
        console.error('[CameraScreen] Permission error:', error);
        setIsLoading(false);
      }
    })();
    // Request permissions once on mount; permission hooks are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      (async () => {
        const cameraStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        const audioStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);

        if (!cameraStatus || !audioStatus) {
          try {
            await PermissionsAndroid.requestMultiple([
              PermissionsAndroid.PERMISSIONS.CAMERA,
              PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            ]);
          } catch (error) {
            console.error('[CameraScreen] Android permission error:', error);
          }
        }
      })();
    }
  }, []);

  // Total recorded duration across all segments
  const totalRecordedDuration = state.segments.reduce((acc, seg) => acc + seg.duration, 0) + state.recordingTime;

  const startRecording = useCallback(async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    if (totalRecordedDuration >= state.maxDuration) {
      Alert.alert('Limit Reached', 'Maximum reel length is 60 seconds.');
      return;
    }

    try {
      currentSegmentDurationRef.current = 0;
      setState(prev => ({ ...prev, isRecording: true, recordingTime: 0 }));

      const remainingTime = state.maxDuration - totalRecordedDuration;

      // Start recording with mute: true to fix Android media conflicts
      const videoData = await cameraRef.current.recordAsync({
        maxDuration: remainingTime,
        mute: true,
      });

      if (videoData?.uri) {
        const newSegment: RecordingSegment = {
          uri: videoData.uri,
          duration: currentSegmentDurationRef.current || 1,
          timestamp: Date.now(),
        };

        setState(prev => ({
          ...prev,
          isRecording: false,
          recordingTime: 0,
          segments: [...prev.segments, newSegment],
        }));
      }
    } catch (error) {
      console.error('[CameraScreen] Recording error:', error);
      setState(prev => ({ ...prev, isRecording: false, recordingTime: 0 }));
    }
  }, [state.maxDuration, totalRecordedDuration]);

  const startCountdown = useCallback(async () => {
    if (state.timer === 0) {
      startRecording();
      return;
    }

    let remaining = state.timer;
    Alert.alert(`Recording starts in ${remaining}s...`);

    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(countdownTimerRef.current);
        startRecording();
      }
    }, 1000);
  }, [state.timer, startRecording]);

  const stopRecording = useCallback(async () => {
    if (cameraRef.current) {
      try {
        await cameraRef.current.stopRecording();
      } catch (error) {
        console.error('[CameraScreen] Stop recording error:', error);
      }
    }
  }, []);

  const handleRecordPress = useCallback(async () => {
    if (state.isRecording) {
      await stopRecording();
    } else {
      await startCountdown();
    }
  }, [state.isRecording, startCountdown, stopRecording]);

  useEffect(() => {
    if (state.isRecording) {
      recordingTimerRef.current = setInterval(() => {
        currentSegmentDurationRef.current += 1;
        setState(prev => {
          const newTime = prev.recordingTime + 1;
          const currentTotal = prev.segments.reduce((acc, s) => acc + s.duration, 0) + newTime;

          if (currentTotal >= prev.maxDuration) {
            stopRecording();
          }
          return { ...prev, recordingTime: newTime };
        });
      }, 1000);

      return () => {
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      };
    }
  }, [state.isRecording, stopRecording]);

  const handleDeleteLastSegment = useCallback(() => {
    if (state.segments.length === 0) return;
    setState(prev => ({
      ...prev,
      segments: prev.segments.slice(0, -1),
    }));
  }, [state.segments]);

  const handleFlipCamera = useCallback(() => {
    setState(prev => ({ ...prev, cameraFacing: prev.cameraFacing === 'front' ? 'back' : 'front' }));
  }, []);

  const handleToggleFlash = useCallback(() => {
    setState(prev => ({ ...prev, flash: prev.flash === 'off' ? 'on' : 'off' }));
  }, []);

  const handleOpenGallery = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        router.push({
          pathname: '/(main)/reels/preview',
          params: {
            videoUri: asset.uri,
            duration: String(Math.round((asset.duration || 0) / 1000)),
            audioId: state.selectedMusic?.id,
            audioName: state.selectedMusic?.name,
            mode: state.mode,
          },
        });
      }
    } catch (error) {
      console.error('[CameraScreen] Gallery error:', error);
      Alert.alert('Error', 'Failed to load video from gallery');
    }
  }, [state.selectedMusic, state.mode]);

  const handleNavigateToPreview = useCallback(() => {
    if (state.segments.length === 0) {
      Alert.alert('No Clips', 'Please record at least one clip before proceeding.');
      return;
    }

    router.push({
      pathname: '/(main)/reels/preview',
      params: {
        segments: JSON.stringify(state.segments),
        duration: String(totalRecordedDuration),
        audioId: state.selectedMusic?.id,
        audioName: state.selectedMusic?.name,
        mode: state.mode,
      },
    });
  }, [state.segments, totalRecordedDuration, state.selectedMusic, state.mode]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color="#EC9A15" />
          <Text style={styles.permissionText}>Initializing Camera...</Text>
        </View>
      </View>
    );
  }

  const hasPermission = cameraPermission?.granted && (Platform.OS === 'ios' || microphonePermission?.granted);

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera and microphone permissions are required to record videos.</Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => {
              requestCameraPermission();
              if (Platform.OS === 'android') requestMicrophonePermission();
            }}
          >
            <Text style={styles.permissionButtonText}>Grant Permissions</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const recordProgress = totalRecordedDuration / state.maxDuration;
  const formattedTime = `${Math.floor(totalRecordedDuration / 60)}:${String(totalRecordedDuration % 60).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      {/*
        Keep CameraView permanently mounted and use `active` to pause/resume.
        Conditionally unmounting on focus tears down the native camera session
        and causes a black preview on Android when returning to the screen.
        Use flex:1 (not absoluteFill) so the preview surface gets a measured size.
      */}
      <CameraView
        ref={cameraRef}
        style={styles.cameraPreview}
        facing={state.cameraFacing}
        enableTorch={state.flash === 'on'}
        mode="video"
        active={isFocused}
      />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>
          {state.segments.length > 0 ? `${state.segments.length} Clips (${formattedTime})` : state.mode === 'REEL' ? 'Create a Reel' : 'Go Live'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Left Controls */}
      <View style={styles.leftControls}>
        <TouchableOpacity style={styles.controlIcon} onPress={() => setShowSpeedModal(!showSpeedModal)}>
          <Text style={styles.controlIconText}>⚡</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlIcon} onPress={() => setShowTimerModal(!showTimerModal)}>
          <Text style={styles.controlIconText}>⏱</Text>
        </TouchableOpacity>
      </View>

      {/* Right Controls */}
      <View style={styles.rightControls}>
        <TouchableOpacity style={styles.controlIcon} onPress={handleToggleFlash}>
          <Text style={styles.controlIconText}>{state.flash === 'on' ? '🔆' : '🔅'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlIcon} onPress={handleFlipCamera}>
          <Text style={styles.controlIconText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Mode Pills */}
      {!state.isRecording && state.segments.length === 0 && (
        <View style={styles.modePills}>
          {(['REEL', 'LIVE'] as UIMode[]).map(mode => (
            <TouchableOpacity
              key={mode}
              style={[styles.modePill, state.mode === mode && styles.modePillActive]}
              onPress={() => setState(p => ({ ...p, mode }))}
            >
              <Text style={styles.modePillText}>{mode}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Progress bar */}
        <View style={styles.recordingIndicator}>
          <View style={[styles.recordingDot, state.isRecording && { backgroundColor: '#FF4444' }]} />
          <Text style={styles.recordingText}>{formattedTime} / 1:00</Text>
        </View>
        <View style={styles.progressBar}>
          <Animated.View style={{ height: '100%', backgroundColor: '#EC9A15', width: `${Math.min(recordProgress * 100, 100)}%` }} />
        </View>

        {state.selectedMusic && (
          <View style={styles.audioButton}>
            <Text style={styles.audioButtonText}>🎵 {state.selectedMusic.name}</Text>
          </View>
        )}

        <View style={styles.controlsRow}>
          {/* Gallery or Delete Last Clip */}
          {state.segments.length > 0 && !state.isRecording ? (
            <TouchableOpacity style={styles.controlButton} onPress={handleDeleteLastSegment}>
              <Text style={{ fontSize: 20 }}>⌫</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.controlButton} onPress={handleOpenGallery} disabled={state.isRecording}>
              <Text style={{ fontSize: 20 }}>🖼</Text>
            </TouchableOpacity>
          )}

          {/* Record / Stop Button */}
          <TouchableOpacity
            style={[styles.recordButton, state.isRecording && styles.recordButtonRecording]}
            onPress={handleRecordPress}
            activeOpacity={0.8}
          >
            <Text style={styles.recordButtonText}>{state.isRecording ? 'Stop' : 'Record'}</Text>
          </TouchableOpacity>

          {/* Next Button (Visible when segments recorded) */}
          {state.segments.length > 0 && !state.isRecording ? (
            <TouchableOpacity style={[styles.controlButton, styles.nextButton]} onPress={handleNavigateToPreview}>
              <Text style={styles.nextButtonText}>Next →</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 50 }} />
          )}
        </View>
      </View>

      {/* Modals */}
      {showSpeedModal && (
        <View style={styles.settingsModal}>
          <Text style={styles.settingsTitle}>Speed</Text>
          {([0.5, 1, 2, 3] as SpeedMultiplier[]).map(speed => (
            <TouchableOpacity
              key={speed}
              style={styles.settingsOption}
              onPress={() => {
                setState(prev => ({ ...prev, speed }));
                setShowSpeedModal(false);
              }}
            >
              <Text style={[styles.settingsOptionText, state.speed === speed && styles.settingsOptionActive]}>{speed}x</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showTimerModal && (
        <View style={styles.settingsModal}>
          <Text style={styles.settingsTitle}>Timer</Text>
          {([0, 3, 10] as TimerDuration[]).map(duration => (
            <TouchableOpacity
              key={duration}
              style={styles.settingsOption}
              onPress={() => {
                setState(prev => ({ ...prev, timer: duration }));
                setShowTimerModal(false);
              }}
            >
              <Text style={[styles.settingsOptionText, state.timer === duration && styles.settingsOptionActive]}>
                {duration === 0 ? 'Immediate' : `${duration}s`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraPreview: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#EC9A15',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    zIndex: 10,
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  leftControls: {
    position: 'absolute',
    left: 16,
    top: 120,
    gap: 20,
    zIndex: 10,
  },
  controlIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIconText: {
    color: '#fff',
    fontSize: 20,
  },
  rightControls: {
    position: 'absolute',
    right: 16,
    top: 120,
    gap: 20,
    zIndex: 10,
  },
  modePills: {
    position: 'absolute',
    bottom: 160,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  modePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  modePillActive: {
    backgroundColor: '#EC9A15',
    borderColor: '#EC9A15',
  },
  modePillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 12,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#EC9A15',
    width: 70,
    borderRadius: 25,
  },
  nextButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EC9A15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  recordButtonRecording: {
    backgroundColor: '#FF4444',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#888',
  },
  recordingText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  audioButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(236, 154, 21, 0.2)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EC9A15',
    marginTop: 8,
  },
  audioButtonText: {
    color: '#EC9A15',
    fontSize: 12,
    fontWeight: '600',
  },
  settingsModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 40,
    zIndex: 20,
  },
  settingsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  settingsOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  settingsOptionText: {
    color: '#fff',
    fontSize: 14,
  },
  settingsOptionActive: {
    color: '#EC9A15',
  },
});