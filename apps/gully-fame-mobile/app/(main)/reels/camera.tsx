/**
 * Instagram-Style Reel Camera Screen
 * Full-screen recording with:
 * - Multi-segment recording (tap to record)
 * - Audio selection
 * - Camera controls (flip, flash, zoom, timer, aspect ratio)
 * - Gallery picker
 * - Real backend integration
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
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { router, useLocalSearchParams } from 'expo-router';
import { AudioLibraryModal, type Audio } from '@/src/components/AudioLibraryModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

type CameraMode = 'REEL' | 'LIVE';
type CameraFacing = 'front' | 'back';
type FlashMode = 'on' | 'off' | 'auto';
type TimerDuration = 0 | 3 | 10;
type ZoomLevel = 1 | 2 | 3;
type AspectRatio = '9:16' | '1:1' | '16:9';

interface RecordingSegment {
  uri: string;
  duration: number;
  timestamp: number;
}

interface CameraScreenState {
  mode: CameraMode;
  isRecording: boolean;
  recordingTime: number;
  cameraFacing: CameraFacing;
  flash: FlashMode;
  zoom: ZoomLevel;
  timer: TimerDuration;
  aspectRatio: AspectRatio;
  maxDuration: number;
  segments: RecordingSegment[];
  selectedAudio: { id: string; name: string } | null;
}

const INITIAL_STATE: CameraScreenState = {
  mode: 'REEL',
  isRecording: false,
  recordingTime: 0,
  cameraFacing: 'front',
  flash: 'off',
  zoom: 1,
  timer: 0,
  aspectRatio: '9:16',
  maxDuration: 60,
  segments: [],
  selectedAudio: null,
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#EC9A15',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(236, 154, 21, 0.8)',
    borderRadius: 20,
  },
  audioButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 22,
  },
  leftRail: {
    position: 'absolute',
    left: 12,
    top: 80,
    gap: 24,
    zIndex: 10,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  iconButtonText: {
    fontSize: 20,
  },
  pillButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  pillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    zIndex: 10,
  },
  modeTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modeTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  modeTabActive: {
    backgroundColor: '#EC9A15',
    borderColor: '#EC9A15',
  },
  modeTabText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
  recordingTime: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(236, 154, 21, 0.3)',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#EC9A15',
    borderRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  galleryThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(100,100,100,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryIcon: {
    fontSize: 24,
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(236, 154, 21, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  recordButtonRecording: {
    backgroundColor: '#FF4444',
    borderColor: '#fff',
  },
  recordButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  flipButtonText: {
    fontSize: 22,
  },
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  modalOptionActive: {
    backgroundColor: 'rgba(236, 154, 21, 0.2)',
    borderLeftWidth: 3,
    borderLeftColor: '#EC9A15',
  },
  modalOptionText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 12,
  },
  modalOptionActiveText: {
    color: '#EC9A15',
    fontWeight: '600',
  },
  segmentsList: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  segment: {
    height: 4,
    flex: 1,
    backgroundColor: 'rgba(236, 154, 21, 0.4)',
    borderRadius: 2,
  },
  segmentRecorded: {
    backgroundColor: '#EC9A15',
  },
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function InstagramReelCamera() {
  const params = useLocalSearchParams();
  const [state, setState] = useState<CameraScreenState>(INITIAL_STATE);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [showAspectModal, setShowAspectModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  // @ts-ignore - NodeJS.Timeout not available
  const recordingTimerRef = useRef<any>();
  // @ts-ignore - NodeJS.Timeout not available
  const countdownTimerRef = useRef<any>();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  // =========================================================================
  // PERMISSIONS
  // =========================================================================

  useEffect(() => {
    (async () => {
      try {
        // Request permissions
        if (!cameraPermission?.granted) {
          await requestCameraPermission();
        }
        if (!micPermission?.granted) {
          await requestMicPermission();
        }

        // Android runtime permissions
        if (Platform.OS === 'android') {
          const cameraOk = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.CAMERA
          );
          const audioOk = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
          );

          if (!cameraOk || !audioOk) {
            await PermissionsAndroid.requestMultiple([
              PermissionsAndroid.PERMISSIONS.CAMERA,
              PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            ]);
          }
        }

        setHasPermission(
          cameraPermission?.granted === true &&
          (Platform.OS === 'ios' || micPermission?.granted === true)
        );
        setIsLoading(false);
      } catch (error) {
        console.error('[ReelCamera] Permission error:', error);
        setIsLoading(false);
      }
    })();
  }, [cameraPermission?.granted, micPermission?.granted]);

  // =========================================================================
  // RECORDING
  // =========================================================================

  const startCountdown = useCallback(async () => {
    if (state.timer === 0) {
      startRecording();
      return;
    }

    let remaining = state.timer;
    Alert.alert(`Recording in ${remaining}s...`);

    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining === 0) {
        clearInterval(countdownTimerRef.current);
        startRecording();
      }
    }, 1000);
  }, [state.timer]);

  const startRecording = useCallback(async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    try {
      setState(prev => ({ ...prev, isRecording: true, recordingTime: 0 }));

      const videoData = await cameraRef.current.recordAsync({
        maxDuration: state.maxDuration - (state.segments.reduce((sum, seg) => sum + seg.duration, 0)),
      });

      if (videoData?.uri) {
        const newSegment: RecordingSegment = {
          uri: videoData.uri,
          duration: state.recordingTime,
          timestamp: Date.now(),
        };

        setState(prev => ({
          ...prev,
          isRecording: false,
          segments: [...prev.segments, newSegment],
          recordingTime: 0,
        }));

        console.log('[ReelCamera] Segment recorded:', newSegment);
      }
    } catch (error) {
      console.error('[ReelCamera] Recording error:', error);
      Alert.alert('Error', 'Failed to record');
      setState(prev => ({ ...prev, isRecording: false }));
    }
  }, [state.maxDuration, state.segments, state.recordingTime]);

  const stopRecording = useCallback(async () => {
    if (cameraRef.current?.isRecording) {
      try {
        await cameraRef.current.stopRecording();
        setState(prev => ({ ...prev, isRecording: false }));
      } catch (error) {
        console.error('[ReelCamera] Stop error:', error);
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

  const handleDeleteLastSegment = useCallback(() => {
    setState(prev => ({
      ...prev,
      segments: prev.segments.slice(0, -1),
    }));
  }, []);

  const handleDone = useCallback(() => {
    if (state.segments.length === 0) {
      Alert.alert('No Recording', 'Please record at least one segment');
      return;
    }

    router.push({
      pathname: '/(main)/reels/preview',
      params: {
        segments: JSON.stringify(state.segments),
        audioId: state.selectedAudio?.id,
        audioName: state.selectedAudio?.name,
        mode: state.mode,
      },
    });
  }, [state.segments, state.selectedAudio, state.mode]);

  // Recording timer
  useEffect(() => {
    if (state.isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setState(prev => {
          const newTime = prev.recordingTime + 1;
          const totalDuration = newTime + prev.segments.reduce((sum, seg) => sum + seg.duration, 0);

          if (totalDuration >= prev.maxDuration) {
            stopRecording();
            return prev;
          }

          return { ...prev, recordingTime: newTime };
        });
      }, 1000);

      return () => {
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
      };
    }
  }, [state.isRecording, state.maxDuration, state.segments, stopRecording]);

  // =========================================================================
  // CAMERA CONTROLS
  // =========================================================================

  const handleFlipCamera = useCallback(() => {
    setState(prev => ({
      ...prev,
      cameraFacing: prev.cameraFacing === 'front' ? 'back' : 'front',
    }));
  }, []);

  const handleToggleFlash = useCallback(() => {
    setState(prev => ({
      ...prev,
      flash: prev.flash === 'off' ? 'on' : 'off',
    }));
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
            duration: Math.floor(asset.duration || 0),
            audioId: state.selectedAudio?.id,
            audioName: state.selectedAudio?.name,
            mode: state.mode,
          },
        });
      }
    } catch (error) {
      console.error('[ReelCamera] Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  }, [state.selectedAudio, state.mode]);

  // =========================================================================
  // PERMISSION UI
  // =========================================================================

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

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Camera and microphone permissions are required to record reels.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => {
              requestCameraPermission();
              requestMicPermission();
            }}
          >
            <Text style={styles.permissionButtonText}>Grant Permissions</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // =========================================================================
  // RENDER
  // =========================================================================

  const totalDuration = state.recordingTime + state.segments.reduce((sum, seg) => sum + seg.duration, 0);
  const recordProgress = totalDuration / state.maxDuration;
  const formattedTime = `${Math.floor(totalDuration / 60)}:${String(totalDuration % 60).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={state.cameraFacing}
        enableTorch={state.flash === 'on'}
        zoom={state.zoom - 1}
        mode="video"
      />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.audioButton} onPress={() => setShowAudioModal(true)}>
          <Text>🎵</Text>
          <Text style={styles.audioButtonText}>
            {state.selectedAudio ? state.selectedAudio.name.substring(0, 15) : 'Add audio'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsButton}>
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Left Rail */}
      <View style={styles.leftRail}>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.iconButtonText}>🎵</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.iconButtonText}>✨</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.iconButtonText}>👤</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.iconButtonText}>🪄</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pillButton}>
          <Text style={styles.pillText}>{state.zoom}x</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowTimerModal(!showTimerModal)}
        >
          <Text style={styles.iconButtonText}>⏱</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowAspectModal(!showAspectModal)}
        >
          <Text style={styles.iconButtonText}>⬜</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        {/* Mode Tabs */}
        <View style={styles.modeTabs}>
          {(['REEL', 'LIVE'] as CameraMode[]).map(mode => (
            <TouchableOpacity
              key={mode}
              style={[styles.modeTab, state.mode === mode && styles.modeTabActive]}
              onPress={() => setState(prev => ({ ...prev, mode }))}
            >
              <Text style={styles.modeTabText}>{mode}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recording Info */}
        {state.isRecording && (
          <>
            <View style={styles.recordingInfo}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingTime}>
                {formattedTime} / {Math.floor(state.maxDuration / 60)}:00
              </Text>
            </View>

            {/* Segments */}
            {state.segments.length > 0 && (
              <View style={styles.segmentsList}>
                {state.segments.map((seg, idx) => (
                  <View
                    key={idx}
                    style={[styles.segment, styles.segmentRecorded]}
                  />
                ))}
                {state.recordingTime > 0 && (
                  <View style={styles.segment} />
                )}
              </View>
            )}

            {/* Progress */}
            <View style={styles.progressBarContainer}>
              <View
                style={[styles.progressBar, { width: `${recordProgress * 100}%` }]}
              />
            </View>
          </>
        )}

        {/* Delete Last Segment */}
        {state.segments.length > 0 && !state.isRecording && (
          <TouchableOpacity
            onPress={handleDeleteLastSegment}
            style={{ marginBottom: 12, alignSelf: 'center' }}
          >
            <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '600' }}>
              Delete Last Segment
            </Text>
          </TouchableOpacity>
        )}

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.galleryButton} onPress={handleOpenGallery}>
            <Text style={styles.galleryIcon}>🖼</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.recordButton, state.isRecording && styles.recordButtonRecording]}
            onPress={handleRecordPress}
            activeOpacity={0.8}
          >
            {state.isRecording && <View style={styles.recordButtonInner} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.flipButton} onPress={handleFlipCamera}>
            <Text style={styles.flipButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Done Button */}
        {state.segments.length > 0 && !state.isRecording && (
          <TouchableOpacity
            onPress={handleDone}
            style={{
              marginTop: 12,
              backgroundColor: '#EC9A15',
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold' }}>
              Done ({state.segments.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Timer Modal */}
      <Modal
        visible={showTimerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimerModal(false)}
      >
        <TouchableOpacity
          style={styles.modal}
          activeOpacity={1}
          onPress={() => setShowTimerModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Timer</Text>
            {([0, 3, 10] as TimerDuration[]).map(duration => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.modalOption,
                  state.timer === duration && styles.modalOptionActive,
                ]}
                onPress={() => {
                  setState(prev => ({ ...prev, timer: duration }));
                  setShowTimerModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    state.timer === duration && styles.modalOptionActiveText,
                  ]}
                >
                  {duration === 0 ? 'Off' : `${duration}s`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Aspect Modal */}
      <Modal
        visible={showAspectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAspectModal(false)}
      >
        <TouchableOpacity
          style={styles.modal}
          activeOpacity={1}
          onPress={() => setShowAspectModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Aspect Ratio</Text>
            {(['9:16', '1:1', '16:9'] as AspectRatio[]).map(ratio => (
              <TouchableOpacity
                key={ratio}
                style={[
                  styles.modalOption,
                  state.aspectRatio === ratio && styles.modalOptionActive,
                ]}
                onPress={() => {
                  setState(prev => ({ ...prev, aspectRatio: ratio }));
                  setShowAspectModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    state.aspectRatio === ratio && styles.modalOptionActiveText,
                  ]}
                >
                  {ratio}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
