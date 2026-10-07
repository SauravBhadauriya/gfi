import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  InteractionManager,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  Modal,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused, router } from 'expo-router';

import ClipList from '../components/ClipList';
import ClipPlayerOverlay from '../components/ClipPlayerOverlay';
import { useCamera } from '../hooks/useCamera';
import { usePermissions } from '../hooks/usePermissions';
import type { CameraClip, CameraClipArray, SpeedSegment } from '../types/camera.types';
import { CameraModeEnum, FlashModeEnum } from '../utils/mediaTypes';

import MusicLibraryModal from '@/components/MusicLibraryModal';
import { listAudio } from '@/api/services/musicLibraryService';
import { listFilters } from '@/api/services/filterLibraryService';

type Resolution = 'hd' | 'fhd' | '2k' | '4k';
type FrameRate = 24 | 30 | 60;
type ColorMode = 'sdr' | 'hdr';
type TimerDuration = 0 | 15 | 30 | 60;
type SpeedMultiplier = 0.3 | 0.5 | 1 | 1.5 | 2 | 3;

const EMPTY_CLIPS: CameraClipArray = [];
let nextCameraScreenInstanceId = 1;
const BUILD_MARKER_TIMESTAMP = 'PHASE-1-FIX-RECORDING';
let lastRecordResult: { resolved: boolean; uri?: string; error?: string; elapsedMs?: number } | null = null;
let lastRecordElapsedMs = 0;

// EMERGENCY FALLBACK: Set to true to use system camera instead of blank preview
const USE_SYSTEM_CAMERA_FALLBACK = false;

// DEVICE FIX: Unisoc ums9621 (AI+ Nova 1 5G) has broken expo-camera video mode
// Force picture mode which works. Recording still functions via recordAsync.
const FORCE_PICTURE_MODE_FOR_VIDEO = true;

interface CameraScreenProps {
  onBack: () => void;
  onNext: (clips: CameraClipArray) => void;
  initialClips?: CameraClipArray;
}

const CameraScreen: React.FC<CameraScreenProps> = ({ onBack, onNext, initialClips = EMPTY_CLIPS }) => {
  const { width, height } = Dimensions.get('screen');
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [appState, setAppState] = useState(AppState.currentState);
  const [isCameraReadyToMount, setIsCameraReadyToMount] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [mountCount, setMountCount] = useState(0);
  const [lastMountError, setLastMountError] = useState('none');
  const cameraWasMountedRef = useRef(false);
  const debugInstanceIdRef = useRef(0);
  if (__DEV__ && debugInstanceIdRef.current === 0) {
    debugInstanceIdRef.current = nextCameraScreenInstanceId++;
  }

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      setAppState(nextState);
    });
    return () => subscription.remove();
  }, []);

  const [mode, setMode] = useState<CameraModeEnum>(CameraModeEnum.Video);
  const [flash, setFlash] = useState<FlashModeEnum>(FlashModeEnum.Off);
  const [clips, setClips] = useState<CameraClipArray>(initialClips);

  useEffect(() => {
    if (initialClips && initialClips.length > 0) {
      setClips(initialClips);
    }
  }, [initialClips]);

  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [activeClip, setActiveClip] = useState<CameraClip | null>(null);
  const [timerDuration, setTimerDuration] = useState<TimerDuration>(15);
  const [speed, setSpeed] = useState<SpeedMultiplier>(1);
  const [zoom, setZoom] = useState(1);

  const recordingStartTimeRef = useRef<number | null>(null);
  const speedChangesRef = useRef<Array<{ time: number; speed: number }>>([]);
  const currentSpeedRef = useRef<SpeedMultiplier>(speed);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [isHoldingCapture, setIsHoldingCapture] = useState(false);

  const [resolution, setResolution] = useState<Resolution>('hd');
  const [frameRate, setFrameRate] = useState<FrameRate>(30);
  const [colorMode, setColorMode] = useState<ColorMode>('sdr');

  const [showSpeedModal, setShowSpeedModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showHDModal, setShowHDModal] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [selectedMusicTrack, setSelectedMusicTrack] = useState<any | null>(null);
  const [musicTracks, setMusicTracks] = useState<any[]>([]);
  const [showFilterGrid, setShowFilterGrid] = useState(false);
  const [filterList, setFilterList] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<any | null>(null);
  const [loadingFilters, setLoadingFilters] = useState(false);

  const [isSwitchingLens, setIsSwitchingLens] = useState(false);
  const [pendingFlip, setPendingFlip] = useState(false);
  const shouldResumeRecordingRef = useRef(false);

  const { hasPermission, isRequesting, requestPermissions } = usePermissions();
  const { cameraRef, isRecording, takePhoto, startRecording, stopRecording } = useCamera(mode, flash);

  useFocusEffect(
    useCallback(() => {
      setIsCameraReadyToMount(false);
      setCameraReady(false);
      if (appState !== 'active' || hasPermission !== true) {
        return () => setIsCameraReadyToMount(false);
      }

      const interactionTask = InteractionManager.runAfterInteractions(() => {
        setIsCameraReadyToMount(true);
      });
      return () => {
        interactionTask.cancel();
        setIsCameraReadyToMount(false);
        setCameraReady(false);
      };
    }, [appState, hasPermission])
  );

  const shouldRenderCamera = isCameraReadyToMount && hasPermission === true && isFocused && appState === 'active';

  useEffect(() => {
    if (shouldRenderCamera && !cameraWasMountedRef.current) {
      cameraWasMountedRef.current = true;
      setMountCount(count => count + 1);
    } else if (!shouldRenderCamera) {
      cameraWasMountedRef.current = false;
      setCameraReady(false);
    }
  }, [shouldRenderCamera]);

  const handleDeleteClip = useCallback((id: string) => setClips(prev => prev.filter(clip => clip.id !== id)), []);

  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const audioRes = await listAudio("trending", 1, 50);
        if (audioRes.success && audioRes.data?.tracks) setMusicTracks(audioRes.data.tracks);
      } catch (e) {}

      try {
        setLoadingFilters(true);
        const filterRes = await listFilters(undefined, 1, 50);
        if (filterRes.success && filterRes.data?.filters) setFilterList(filterRes.data.filters);
      } catch (e) {} finally { setLoadingFilters(false); }
    };
    fetchBackendData();
  }, []);

  useEffect(() => { if (!isRecording) currentSpeedRef.current = speed; }, [speed, isRecording]);

  const handleSwitchCamera = useCallback(async () => {
    if (isSwitchingLens || pendingFlip) return;
    if (isRecording && mode === CameraModeEnum.Video) {
      if (__DEV__) console.log('[CameraScreen.handleSwitchCamera] Stopping recording before flip');
      setIsSwitchingLens(true);
      setPendingFlip(true);
      await stopRecording();
    } else {
      if (__DEV__) console.log('[CameraScreen.handleSwitchCamera] Flipping lens directly');
      setIsSwitchingLens(true);
      setCameraReady(false);
      shouldResumeRecordingRef.current = false;
      setCameraFacing(prev => (prev === 'front' ? 'back' : 'front'));
      setZoom(1);
    }
  }, [isRecording, mode, stopRecording, isSwitchingLens, pendingFlip]);

  useEffect(() => {
    if (!isFocused || appState !== 'active') {
      if (__DEV__ && isRecording) console.log(`[CameraScreen.blur] Screen blur/inactive: isFocused=${isFocused}, appState=${appState}. Stopping recording.`);
      void stopRecording();
    }
  }, [appState, isFocused, stopRecording]);

  useEffect(() => {
    if (!isRecording && pendingFlip) {
      setPendingFlip(false);
      shouldResumeRecordingRef.current = true;
      setCameraFacing(prev => (prev === 'front' ? 'back' : 'front'));
      setZoom(1);
    }
  }, [isRecording, pendingFlip]);

  const handleAddClip = useCallback((clip: CameraClip | null) => {
    if (__DEV__) console.warn(`[handleAddClip] ⚙️ CALLED with clip=${clip ? 'present' : 'NULL'}`);
    
    if (!clip) {
      if (__DEV__) console.warn(`[handleAddClip] ❌ Clip is NULL, not adding`);
      recordingStartTimeRef.current = null;
      speedChangesRef.current = [];
      return;
    }

    // PHASE 1 FIX: Verify file size > 10KB in case it slipped through
    if (clip.type === 'video' && clip.uri) {
      // File size is already validated in useCamera, so just log it
      if (__DEV__) console.warn(`[handleAddClip] ✅ File validation passed in useCamera, adding clip`);
    }

    if (clip.type === 'video' && recordingStartTimeRef.current !== null) {
      const recordingDuration = (Date.now() - recordingStartTimeRef.current) / 1000;
      let videoDuration = clip.duration > 0 ? clip.duration : recordingDuration;
      if (clip.duration === 0 && recordingDuration > 0) clip.duration = recordingDuration;
      lastRecordElapsedMs = Math.round(recordingDuration * 1000);
      lastRecordResult = { resolved: true, uri: clip.uri, elapsedMs: lastRecordElapsedMs };
      
      if (__DEV__) console.warn(`[handleAddClip] ✅ ADDING CLIP: uri=${clip.uri.substring(0,40)}..., duration=${clip.duration.toFixed(2)}s, elapsed=${recordingDuration.toFixed(2)}s`);

      const changes = [...speedChangesRef.current];
      if (changes.length > 0 && videoDuration > 0) {
        const segments: SpeedSegment[] = [];
        for (let i = 0; i < changes.length; i++) {
          const change = changes[i];
          const startTime = Math.min(Math.max(change.time, 0), videoDuration);
          const segSpeed = change.speed;
          let endTime = i < changes.length - 1 ? Math.min(Math.max(changes[i + 1].time, startTime), videoDuration) : videoDuration;
          if (endTime > startTime) segments.push({ startTime, endTime, speed: segSpeed });
        }
        if (segments.length > 0 && (segments.length > 1 || segments.some(seg => seg.speed !== 1))) {
          clip.speedSegments = segments;
        }
      } else if (currentSpeedRef.current !== 1 && videoDuration > 0) {
        clip.speedSegments = [{ startTime: 0, endTime: videoDuration, speed: currentSpeedRef.current }];
      }
    }

    recordingStartTimeRef.current = null;
    speedChangesRef.current = [];
    if (__DEV__) console.warn(`[handleAddClip] 📝 Calling setClips to add clip`);
    setClips(prev => {
      const newClips = [...prev, clip];
      if (__DEV__) console.warn(`[handleAddClip] 📊 State updated: clips now = ${newClips.length}`);
      return newClips;
    });
  }, []);

  const handleCameraReady = useCallback(async () => {
    console.log('[CameraScreen] onCameraReady');
    setCameraReady(true);
    setLastMountError('none');
    if (shouldResumeRecordingRef.current) {
      shouldResumeRecordingRef.current = false;
      setTimeout(async () => {
        try {
          recordingStartTimeRef.current = Date.now();
          speedChangesRef.current = [{ time: 0, speed: speed }];
          await startRecording(handleAddClip, timerDuration, speed);
        } catch (error) {}
        finally { setIsSwitchingLens(false); }
      }, 400);
    } else {
      setIsSwitchingLens(false);
    }
  }, [startRecording, handleAddClip, timerDuration, speed]);

  const handleCameraMountError = useCallback((error: { message?: string }) => {
    const message = error?.message ?? String(error);
    console.error('[CameraScreen] onMountError:', message);
    setLastMountError(message);
    setCameraReady(false);
  }, []);

  useEffect(() => {
    if (isSwitchingLens) {
      const timeout = setTimeout(() => { setIsSwitchingLens(false); setPendingFlip(false); }, 8000);
      return () => clearTimeout(timeout);
    }
  }, [isSwitchingLens]);

  const normalizedZoom = React.useMemo(() => Math.min(Math.max((zoom - 1) / 4, 0), 1), [zoom]);
  const handleZoomChange = useCallback((newZoom: number) => setZoom(newZoom), []);

  const handleCapturePressIn = useCallback(() => setIsHoldingCapture(true), []);
  const handleCapturePressOut = useCallback(async () => {
    const wasHolding = isHoldingCapture;
    setIsHoldingCapture(false);
    if (mode === CameraModeEnum.Photo && wasHolding) {
      const clip = await takePhoto();
      handleAddClip(clip);
    }
  }, [mode, isHoldingCapture, takePhoto, handleAddClip]);

  const handleToggleFlash = useCallback(() => setFlash(current => current === FlashModeEnum.On ? FlashModeEnum.Off : FlashModeEnum.On), []);
  const handleRetakeAll = useCallback(() => {
    Alert.alert("Discard all clips?", "Are you sure? All recorded clips will be deleted.", [
      { text: "Cancel", style: "cancel" },
      { text: "Discard All", style: "destructive", onPress: () => setClips([]) },
    ]);
  }, []);

  const handleOpenClip = useCallback((clip: CameraClip) => setActiveClip(clip), []);
  const handleCloseClip = useCallback(() => setActiveClip(null), []);

  const handleOpenGallery = useCallback(async () => {
    let permission = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert("Permission Required", "We need gallery access to upload media.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, allowsMultipleSelection: false, quality: 1 });
    if (result.canceled || !result.assets || result.assets.length === 0) return;
    const asset = result.assets[0];
    if (!asset.uri) return;
    const makeId = () => `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const isVideo = asset.type === 'video';
    const duration = isVideo ? asset.duration ?? 0 : 0;
    const newClip: CameraClip = { id: makeId(), uri: asset.uri, duration, type: isVideo ? 'video' : 'photo', source: 'gallery', speed: isVideo ? speed : undefined };
    setClips(prev => [...prev, newClip]);
  }, [speed]);

  const handleSpeedChange = useCallback((newSpeed: SpeedMultiplier) => {
    setSpeed(newSpeed);
    if (isRecording && recordingStartTimeRef.current !== null) {
      const currentTime = (Date.now() - recordingStartTimeRef.current) / 1000;
      speedChangesRef.current.push({ time: currentTime, speed: newSpeed });
      currentSpeedRef.current = newSpeed;
    }
  }, [isRecording]);

  const handleCapturePress = useCallback(async () => {
    if (!cameraReady || !isFocused || appState !== 'active' || isSwitchingLens || pendingFlip) return;
    
    if (mode === CameraModeEnum.Photo) {
      const clip = await takePhoto();
      handleAddClip(clip);
    } else {
      // Video mode (but CameraView may still be in picture mode due to FORCE_PICTURE_MODE_FOR_VIDEO)
      if (FORCE_PICTURE_MODE_FOR_VIDEO) {
        // CameraView is forced to picture mode; fallback to system camera for video recording
        if (__DEV__) console.warn(`[handleCapturePress] 🔴 CameraView in picture mode, using system camera fallback`);
        const { recordVideoWithSystemCamera } = await import('@/modules/video-editor/camera-module/services/systemCameraFallback');
        const clip = await recordVideoWithSystemCamera();
        handleAddClip(clip);
      } else {
        // Normal expo-camera video recording
        if (isRecording) {
          if (__DEV__) console.warn(`[handleCapturePress] ⏹ STOPPING recording, clips=${clips.length}`);
          await stopRecording();
        } else {
          if (__DEV__) console.warn(`[handleCapturePress] 🔴 STARTING recording NOW`);
          recordingStartTimeRef.current = Date.now();
          speedChangesRef.current = [];
          currentSpeedRef.current = speed;
          speedChangesRef.current.push({ time: 0, speed: speed });
          lastRecordResult = null;
          lastRecordElapsedMs = 0;
          try {
            if (__DEV__) console.warn(`[handleCapturePress] 📞 Calling startRecording, handleAddClip is bound`);
            await startRecording(handleAddClip, timerDuration, speed);
            if (__DEV__) console.warn(`[handleCapturePress] ✅ startRecording returned`);
          } catch (e) {
            if (__DEV__) console.warn(`[handleCapturePress] ❌ startRecording threw:`, e);
          }
        }
      }
    }
  }, [appState, cameraReady, handleAddClip, isFocused, isRecording, mode, startRecording, stopRecording, takePhoto, timerDuration, speed, isSwitchingLens, pendingFlip, clips.length]);

  const totalDuration = clips.reduce((sum, c) => sum + (c.duration ?? 0), 0);
  // Show Next button whenever we have at least one clip and are not recording
  const canProceedToNext = clips.length > 0 && !isRecording;

  const handleNextPress = useCallback(() => {
    if (__DEV__) console.warn(`[handleNextPress] Called: canProceedToNext=${canProceedToNext}, clips=${clips.length}, isRecording=${isRecording}`);
    // ALWAYS proceed if we have clips, ignoring the gate
    if (clips.length === 0) {
      if (__DEV__) console.warn(`[handleNextPress] No clips, aborting`);
      return;
    }
    const clipsWithMetadata = clips.map(clip => ({ ...clip, musicTrack: selectedMusicTrack, filter: selectedFilter, resolution, frameRate }));
    if (__DEV__) console.warn(`[handleNextPress] Calling onNext with ${clipsWithMetadata.length} clips, onNext=${typeof onNext}`);
    onNext(clipsWithMetadata as unknown as CameraClipArray);
  }, [clips, onNext, selectedMusicTrack, selectedFilter, resolution, frameRate, isRecording]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRecording) {
      if (recordingStartTimeRef.current === null) {
        recordingStartTimeRef.current = Date.now();
        speedChangesRef.current = [{ time: 0, speed: currentSpeedRef.current }];
      }
      const start = recordingStartTimeRef.current;
      interval = setInterval(() => { setRecordingSeconds(Math.floor((Date.now() - start) / 1000)); }, 500);
    } else { setRecordingSeconds(0); }
    return () => { if (interval) clearInterval(interval); };
  }, [isRecording]);

  const formatTimer = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator color="#ffffff" />
        <Text style={styles.permissionText}>Checking camera permissions…</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need access to your camera and microphone.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions} disabled={isRequesting}>
          <Text style={styles.permissionButtonText}> Grant permission </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer} collapsable={false}>
      {shouldRenderCamera ? (
        <>
          <CameraView
              ref={cameraRef}
              style={{ position: 'absolute', top: 0, left: 0, width, height }}
              facing={cameraFacing}
              {...(mode === CameraModeEnum.Photo
                ? { flash: flash === FlashModeEnum.On ? 'on' : 'off' }
                : {})}
              enableTorch={mode === CameraModeEnum.Video && flash === FlashModeEnum.On}
              mode={FORCE_PICTURE_MODE_FOR_VIDEO ? 'picture' : (mode === CameraModeEnum.Video ? 'video' : 'picture')}
              zoom={normalizedZoom}
              onCameraReady={handleCameraReady}
              onMountError={handleCameraMountError}
              active={isFocused && appState === 'active'}
          />

          {/* BUILD MARKER + DEV BUTTONS */}
          {__DEV__ && (
            <>
              <View style={[styles.buildMarkerBanner, { top: insets.top }]}>
                <Text style={styles.buildMarkerText} numberOfLines={1}>
                  🎥 CameraScreen v2 | {BUILD_MARKER_TIMESTAMP}
                </Text>
              </View>
              {/* RED BANNER IF NO CLIPS */}
              {clips.length === 0 && (
                <View style={[styles.buildMarkerBanner, { top: insets.top + 25, backgroundColor: 'rgba(255,0,0,0.8)' }]}>
                  <Text style={[styles.buildMarkerText, { color: '#FFF' }]}>
                    🔴 NO CLIPS ADDED
                  </Text>
                </View>
              )}
              <View style={[styles.devButtonRow, { top: insets.top + 28 }]}>
                <TouchableOpacity
                  style={[styles.devTestButton, { backgroundColor: '#00CC00' }]}
                  onPress={() => router.push('/(main)/cam-expo-min')}
                >
                  <Text style={styles.devTestButtonText}>EXPO</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.devTestButton, { backgroundColor: '#0066CC' }]}
                  onPress={() => router.push('/(main)/camera-vision-test')}
                >
                  <Text style={styles.devTestButtonText}>VISION</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.devTestButton, { backgroundColor: '#CC6600' }]}
                  onPress={() => router.push('/(main)/camera-lab')}
                >
                  <Text style={styles.devTestButtonText}>LAB</Text>
                </TouchableOpacity>
              </View>
              {/* DEV STATUS PANEL */}
              <View style={[styles.devStatusPanel, { top: insets.top + 80 }]}>
                <Text style={styles.devStatusText}>clips={clips.length}</Text>
                {clips.map((c, i) => (
                  <Text key={c.id} style={styles.devStatusText}>
                    [{i}] uri={c.uri.substring(Math.max(0, c.uri.length - 25))} dur={(c.duration ?? 0).toFixed(1)}s
                  </Text>
                ))}
                <Text style={styles.devStatusText}>isRecording={String(isRecording)}</Text>
                <Text style={styles.devStatusText}>ready={String(cameraReady)}</Text>
                <Text style={styles.devStatusText}>totalDur={totalDuration.toFixed(1)}s</Text>
                <Text style={[styles.devStatusText, canProceedToNext ? { color: '#0f0' } : { color: '#f00' }]}>
                  canNext={String(canProceedToNext)}
                </Text>
                {lastRecordResult && (
                  <Text style={styles.devStatusText}>
                    last: {lastRecordResult.resolved ? 'OK' : 'ERR'} {lastRecordResult.elapsedMs}ms
                  </Text>
                )}
              </View>
              {/* LARGE DEBUG OVERLAY - IMPOSSIBLE TO MISS */}
              {__DEV__ && clips.length > 0 && (
                <View style={styles.debugOverlay}>
                  <Text style={styles.debugOverlayText}>✓ CLIPS: {clips.length}</Text>
                  <Text style={styles.debugOverlayText}>REC: {String(isRecording)}</Text>
                  <Text style={[styles.debugOverlayText, { color: isRecording ? '#f00' : '#0f0' }]}>
                    NEXT: {isRecording ? 'NO' : 'YES'}
                  </Text>
                </View>
              )}
            </>
          )}

          <SafeAreaView style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {__DEV__ && (
              <View pointerEvents="none" style={styles.cameraDebugLabel}>
                <Text numberOfLines={2} style={styles.cameraDebugText}>
                  screen={debugInstanceIdRef.current} permission={String(hasPermission)} focus={String(isFocused)} ready={String(cameraReady)} mounts={mountCount} error={lastMountError}
                </Text>
              </View>
            )}
            {isSwitchingLens && (
              <View style={styles.switchingOverlay}>
                <ActivityIndicator color="#ffffff" size="large" />
                <Text style={styles.switchingText}>Flipping Lens...</Text>
              </View>
            )}

            {isRecording && (
              <View style={styles.recordingTimerContainer}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingTimerText}>{formatTimer(recordingSeconds)}</Text>
              </View>
            )}

            {/* TOP BAR */}
            <View style={styles.topBar} pointerEvents="box-none">
              <TouchableOpacity style={styles.backBtn} onPress={onBack}>
                <Ionicons name="arrow-back" size={28} color="#fff" style={styles.iconShadow} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.topModeToggle} disabled={isRecording} onPress={() => setMode(mode === CameraModeEnum.Video ? CameraModeEnum.Photo : CameraModeEnum.Video)}>
                <Text style={[styles.topModeText, isRecording && { opacity: 0.5 }]}>{mode === CameraModeEnum.Video ? 'Video Mode' : 'Photo Mode'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsBtn} accessibilityLabel="Camera settings">
                <Ionicons name="settings-outline" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* MIDDLE SPACE */}
            <View style={styles.middleSpace} pointerEvents="box-none">
              <View style={styles.leftToolbar} pointerEvents="box-none">
                <TouchableOpacity style={styles.toolbarBtn} onPress={() => setShowMusicModal(true)}>
                  <Ionicons name="musical-notes" size={28} color="#fff" style={styles.iconShadow} />
                  {selectedMusicTrack && <Text style={styles.toolbarLabel}>1 Track</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolbarBtn} onPress={() => setShowFilterGrid(true)}>
                  <Ionicons name="sparkles" size={28} color="#fff" style={styles.iconShadow} />
                  {selectedFilter && <Text style={styles.toolbarLabel}>Filter</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolbarBtn} onPress={() => setShowTimerModal(true)}>
                  <Ionicons name="timer-outline" size={28} color="#fff" style={styles.iconShadow} />
                  <Text style={styles.toolbarLabel}>{timerDuration}s</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolbarBtn} onPress={() => setShowSpeedModal(true)}>
                  <Text style={styles.iconText}>{speed}x</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolbarBtn} onPress={() => setShowHDModal(true)}>
                  <Text style={styles.iconText}>{resolution.toUpperCase()}{'\n'}{frameRate}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* BOTTOM CONTROLS */}
            <View style={styles.bottomControlsContainer} pointerEvents="box-none">
              <View style={styles.bottomSideGroup} pointerEvents="box-none">
                {clips.length > 0 && !isRecording ? (
                  <TouchableOpacity style={styles.actionBtn} onPress={clips.length > 1 ? handleRetakeAll : handleRetakeAll}>
                    <Ionicons name="close-circle-outline" size={38} color="#fff" style={styles.iconShadow} />
                  </TouchableOpacity>
                ) : (
                  !isRecording && (
                    <>
                      <TouchableOpacity style={styles.actionBtn} onPress={handleToggleFlash}>
                        <Ionicons name={flash === FlashModeEnum.On ? "flash" : "flash-outline"} size={26} color="#fff" style={styles.iconShadow} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={handleOpenGallery}>
                        <Ionicons name="images-outline" size={26} color="#fff" style={styles.iconShadow} />
                      </TouchableOpacity>
                    </>
                  )
                )}
              </View>

              <View style={styles.captureCenterGroup} pointerEvents="box-none">
                {!isRecording && (
                  <View style={styles.curvedZoomDial} pointerEvents="auto">
                    {[1, 2, 3, 5].map((z) => (
                      <TouchableOpacity key={z} style={[styles.zoomPill, zoom === z && styles.zoomPillActive]} onPress={() => handleZoomChange(z)}>
                        <Text style={[styles.zoomPillText, zoom === z && styles.zoomPillTextActive]}>{z}x</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {/* Hide capture button if total duration >= timer max */}
                {!(timerDuration > 0 && totalDuration >= timerDuration) && (
                  <TouchableOpacity style={styles.recordButtonContainer} onPress={handleCapturePress} onPressIn={handleCapturePressIn} onPressOut={handleCapturePressOut} activeOpacity={0.8} disabled={!hasPermission || !cameraReady || isSwitchingLens || !isFocused || appState !== 'active'}>
                    <View style={[styles.recordButton, isRecording && styles.recordButtonRecording, mode === CameraModeEnum.Photo && styles.recordButtonPhoto]}>
                      {isRecording ? <View style={styles.recordButtonSquare} /> : <View style={[styles.recordButtonCircle, mode === CameraModeEnum.Photo && styles.recordButtonCirclePhoto]} />}
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.bottomSideGroupRight} pointerEvents="box-none">
                {/* ALWAYS show Next button if we have clips, regardless of isRecording state */}
                {clips.length > 0 ? (
                  <TouchableOpacity 
                    style={[styles.nextActionBtn]} 
                    onPress={handleNextPress}
                  >
                    <Ionicons name="checkmark" size={28} color="#fff" />
                  </TouchableOpacity>
                ) : (
                  !isRecording && (
                    <TouchableOpacity style={styles.actionBtn} onPress={handleSwitchCamera} disabled={isRecording}>
                      <Ionicons name="camera-reverse-outline" size={30} color="#fff" style={styles.iconShadow} />
                    </TouchableOpacity>
                  )
                )}
                {/* DEV: Force-show Next button below the normal one if clips exist */}
                {__DEV__ && clips.length > 0 && (
                  <TouchableOpacity 
                    style={[styles.nextActionBtn, { marginLeft: 10, backgroundColor: '#FF00FF' }]} 
                    onPress={() => {
                      if (__DEV__) console.warn(`[DEV BUTTON] Forced next press, clips=${clips.length}, isRecording=${isRecording}`);
                      handleNextPress();
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>DEV</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {clips.length > 0 && (
              <View style={styles.clipListWrapper} pointerEvents="auto">
                <ClipList clips={clips} onDeleteClip={handleDeleteClip} onPressClip={handleOpenClip} />
                
                {/* Clip Timeline/Duration Display */}
                {!isRecording && clips.length > 0 && (
                  <View style={styles.clipDurationTimeline}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.clipDurationScroll}>
                      {clips.map((clip, idx) => (
                        <View key={clip.id} style={styles.clipDurationBadge}>
                          <Text style={styles.clipDurationText}>
                            {idx + 1}: {((clip.duration ?? 0) / 1).toFixed(1)}s
                          </Text>
                        </View>
                      ))}
                      <View style={styles.clipDurationBadge}>
                        <Text style={[styles.clipDurationText, { fontWeight: 'bold' }]}>
                          Total: {totalDuration.toFixed(1)}s / {timerDuration}s max
                        </Text>
                      </View>
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </SafeAreaView>
        </>
      ) : (
        <View style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#EC9A15" size="large" />
        </View>
      )}

      {/* MODALS */}
      <MusicLibraryModal visible={showMusicModal} onCancel={() => setShowMusicModal(false)} onSelect={(music: any) => { setSelectedMusicTrack(music); setShowMusicModal(false); }} selectedMusic={selectedMusicTrack} />
      {showFilterGrid && (
        <Modal visible={showFilterGrid} transparent animationType="slide" onRequestClose={() => setShowFilterGrid(false)}>
          <TouchableOpacity style={styles.fullOverlay} activeOpacity={1} onPress={() => setShowFilterGrid(false)}>
            <View style={styles.filterGridContainer}>
              <View style={styles.filterGridHeader}>
                <Text style={styles.filterGridTitle}>Effects & Filters</Text>
                <TouchableOpacity onPress={() => setShowFilterGrid(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
              </View>
              {loadingFilters ? <ActivityIndicator color="#EC9A15" style={{ marginVertical: 40 }} /> : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.filterGrid}>
                  <TouchableOpacity style={[styles.filterGridTile, !selectedFilter && styles.filterGridTileSelected]} onPress={() => { setSelectedFilter(null); setShowFilterGrid(false); }}>
                    <View style={[styles.filterGridThumbnail, !selectedFilter && styles.filterGridThumbnailSelected]}><Text style={{color: '#fff', fontSize: 16}}>◯</Text></View>
                    <Text style={styles.filterGridTileName}>None</Text>
                  </TouchableOpacity>
                  {filterList.map((f) => (
                    <TouchableOpacity key={f.id} style={[styles.filterGridTile, selectedFilter?.id === f.id && styles.filterGridTileSelected]} onPress={() => { setSelectedFilter(f); setShowFilterGrid(false); }}>
                      <View style={[styles.filterGridThumbnail, selectedFilter?.id === f.id && styles.filterGridThumbnailSelected]}><Text style={{color: '#fff', fontSize: 18, fontWeight: 'bold'}}>{f.name.charAt(0)}</Text></View>
                      <Text style={styles.filterGridTileName} numberOfLines={1}>{f.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
      <Modal visible={showSpeedModal} transparent animationType="fade" onRequestClose={() => setShowSpeedModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSpeedModal(false)}>
          <View style={styles.modalContent}>
            {([0.3, 0.5, 1, 1.5, 2, 3] as SpeedMultiplier[]).map((s) => (
              <TouchableOpacity key={s} style={[styles.modalItem, speed === s && styles.modalItemActive]} onPress={() => { handleSpeedChange(s); setShowSpeedModal(false); }}>
                <Text style={[styles.modalItemText, speed === s && styles.modalItemTextActive]}>{s}x</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal visible={showTimerModal} transparent animationType="fade" onRequestClose={() => setShowTimerModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTimerModal(false)}>
          <View style={styles.modalContent}>
            {([0, 15, 30, 60] as TimerDuration[]).map((t) => (
              <TouchableOpacity key={t} style={[styles.modalItem, timerDuration === t && styles.modalItemActive]} onPress={() => { setTimerDuration(t); setShowTimerModal(false); }}>
                <Text style={[styles.modalItemText, timerDuration === t && styles.modalItemTextActive]}>{t === 0 ? 'Off' : `${t}s`}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal visible={showHDModal} transparent animationType="fade" onRequestClose={() => setShowHDModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowHDModal(false)}>
          <View style={styles.modalContent}>
            {(['hd', 'fhd', '2k', '4k'] as Resolution[]).map((r) => (
              <TouchableOpacity key={r} style={[styles.modalItem, resolution === r && styles.modalItemActive]} onPress={() => { setResolution(r); setShowHDModal(false); }}>
                <Text style={[styles.modalItemText, resolution === r && styles.modalItemTextActive]}>{r.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      {activeClip && <ClipPlayerOverlay clip={activeClip} onClose={handleCloseClip} />}
    </View>
  );
};

const styles = StyleSheet.create({
  buildMarkerBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FF0000',
    paddingVertical: 4,
    paddingHorizontal: 8,
    zIndex: 99999,
    elevation: 99999,
  },
  buildMarkerText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  devButtonRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 99998,
    elevation: 99998,
  },
  devTestButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  devTestButtonText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  devStatusPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 99997,
  },
  devStatusText: {
    color: '#0f0',
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 10,
  },
  debugOverlay: {
    position: 'absolute',
    right: 20,
    top: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderWidth: 3,
    borderColor: '#FF6600',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    zIndex: 99998,
  },
  debugOverlayText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 22,
  },
  mainContainer: { flex: 1, backgroundColor: '#000' },
  cameraDebugLabel: { position: 'absolute', top: 4, left: 4, zIndex: 2000, maxWidth: 280, backgroundColor: 'rgba(0,0,0,0.72)', paddingHorizontal: 5, paddingVertical: 3 },
  cameraDebugText: { color: '#fff', fontSize: 9 },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 20 },
  permissionText: { color: '#fff', textAlign: 'center', marginTop: 20, marginBottom: 20 },
  permissionButton: { backgroundColor: '#EC9A15', padding: 15, borderRadius: 8 },
  permissionButtonText: { color: '#fff', fontWeight: 'bold' },
  switchingOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  switchingText: { color: '#ffffff', marginTop: 14, fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },
  recordingTimerContainer: { position: 'absolute', top: 20, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', zIndex: 100 },
  recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'red', marginRight: 8 },
  recordingTimerText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60, zIndex: 50 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  topModeToggle: { backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
  topModeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  settingsBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-end' },
  middleSpace: { flex: 1, position: 'relative' },
  leftToolbar: { position: 'absolute', left: 15, top: 20, width: 60, alignItems: 'center', gap: 25 },
  toolbarBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  iconShadow: { textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  iconText: { color: '#fff', fontSize: 14, fontWeight: 'bold', textAlign: 'center', textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  toolbarLabel: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginTop: 2, textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  bottomControlsContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 25, paddingBottom: Platform.OS === 'ios' ? 10 : 30, zIndex: 40 },
  bottomSideGroup: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 20, paddingBottom: 25 },
  bottomSideGroupRight: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 25 },
  actionBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  nextActionBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EC9A15', justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4 },
  captureCenterGroup: { flex: 2, alignItems: 'center', justifyContent: 'flex-end' },
  curvedZoomDial: { flexDirection: 'row', backgroundColor: 'rgba(30, 30, 30, 0.6)', height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 4, marginBottom: 15 },
  zoomPill: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 14 },
  zoomPillActive: { backgroundColor: '#fff' },
  zoomPillText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  zoomPillTextActive: { color: '#000' },
  recordButtonContainer: { width: 90, height: 90, justifyContent: 'center', alignItems: 'center' },
  recordButton: { width: 84, height: 84, borderRadius: 42, borderWidth: 5, borderColor: '#fff', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  recordButtonPhoto: { borderColor: '#fff' },
  recordButtonRecording: { borderColor: '#EC9A15' },
  recordButtonCircle: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#EC9A15' },
  recordButtonCirclePhoto: { backgroundColor: '#fff' },
  recordButtonSquare: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#EC9A15' },
  clipListWrapper: { width: '100%', alignItems: 'center', paddingBottom: 20, zIndex: 50 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#2a2a2a', borderRadius: 12, padding: 10, width: 150 },
  modalItem: { paddingVertical: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalItemActive: { backgroundColor: 'rgba(236, 154, 21, 0.2)', borderRadius: 8, borderBottomWidth: 0 },
  modalItemText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalItemTextActive: { color: '#EC9A15' },
  fullOverlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0, 0, 0, 0.7)", justifyContent: "flex-end", zIndex: 1000 },
  filterGridContainer: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 16, borderTopRightRadius: 16, height: "50%", paddingTop: 16 },
  filterGridHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.1)" },
  filterGridTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  filterGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 12, paddingVertical: 16 },
  filterGridTile: { width: "22%", aspectRatio: 1, justifyContent: "center", alignItems: "center", borderRadius: 12, backgroundColor: "rgba(255, 255, 255, 0.05)", borderWidth: 2, borderColor: "transparent" },
  filterGridTileSelected: { borderColor: "#EC9A15", backgroundColor: "rgba(236, 154, 21, 0.15)" },
  filterGridThumbnail: { width: "100%", height: "70%", justifyContent: "center", alignItems: "center", borderRadius: 8, backgroundColor: "rgba(255, 255, 255, 0.1)", marginBottom: 4 },
  filterGridThumbnailSelected: { backgroundColor: "rgba(236, 154, 21, 0.3)" },
  filterGridTileName: { color: "#fff", fontSize: 11, fontWeight: "500", textAlign: "center" },
  clipDurationTimeline: { width: '100%', backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 12, paddingHorizontal: 10 },
  clipDurationScroll: { flexDirection: 'row', gap: 10, paddingHorizontal: 10 },
  clipDurationBadge: { backgroundColor: 'rgba(236, 154, 21, 0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#EC9A15' },
  clipDurationText: { color: '#fff', fontSize: 12, fontWeight: '600' }
});

export default CameraScreen;
