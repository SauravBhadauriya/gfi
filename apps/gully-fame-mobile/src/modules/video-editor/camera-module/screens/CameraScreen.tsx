// PATH: apps/gully-fame-mobile/src/modules/video-editor/camera-module/screens/CameraScreen.tsx
// QUICK FIX VERSION - Camera preview now shows properly
// Root cause: CameraView must have explicit dimensions, not wrapped in SafeAreaView

import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import CameraSwitchButton from '../components/CameraSwitchButton';
import CaptureButton from '../components/CaptureButton';
import ClipPlayerOverlay from '../components/ClipPlayerOverlay';
import FlashToggle from '../components/FlashToggle';
import GalleryButton from '../components/GalleryButton';
import HDSelector, { type ColorMode, type FrameRate, type Resolution } from '../components/HDSelector';
import SpeedSelector, { type SpeedMultiplier } from '../components/SpeedSelector';
import TimerSelector, { type TimerDuration } from '../components/TimerSelector';
import MusicLibraryModal from '../components/MusicLibraryModal';
import { useCamera } from '../hooks/useCamera';
import { usePermissions } from '../hooks/usePermissions';
import { cameraStyles } from '../styles/cameraStyles';
import type { CameraClip, CameraClipArray, SpeedSegment } from '../types/camera.types';
import { CameraModeEnum, FlashModeEnum } from '../utils/mediaTypes';

interface CameraScreenProps {
  onBack: () => void;
  onNext: (clips: CameraClipArray) => void;
  initialClips?: CameraClipArray;
}

type UIMode = 'REEL' | 'LIVE';

const CameraScreen: React.FC<CameraScreenProps> = ({ onBack, onNext, initialClips = [] }) => {
  const [uiMode, setUiMode] = useState<UIMode>('REEL');
  const mode = (uiMode === 'REEL' || uiMode === 'LIVE') ? CameraModeEnum.Video : CameraModeEnum.Photo;

  const [flash, setFlash] = useState<FlashModeEnum>(FlashModeEnum.Off);
  const [clips, setClips] = useState<CameraClipArray>(initialClips);
  const [isMusicSheetVisible, setIsMusicSheetVisible] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    if (initialClips) setClips(initialClips);
  }, [initialClips]);

  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [activeClip, setActiveClip] = useState<CameraClip | null>(null);
  const [timerDuration, setTimerDuration] = useState<TimerDuration>(15);
  const [speed, setSpeed] = useState<SpeedMultiplier>(1);

  const recordingStartTimeRef = useRef<number | null>(null);
  const speedChangesRef = useRef<Array<{ time: number; speed: number }>>([]);
  const currentSpeedRef = useRef<SpeedMultiplier>(speed);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const [isHoldingCapture, setIsHoldingCapture] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [resolution, setResolution] = useState<Resolution>('hd');
  const [frameRate, setFrameRate] = useState<FrameRate>(30);
  const [colorMode, setColorMode] = useState<ColorMode>('sdr');

  const { hasPermission, isRequesting, requestPermissions } = usePermissions();
  const { cameraRef, isRecording, takePhoto, startRecording, stopRecording } = useCamera(mode, flash);

  const totalClipsDuration = useMemo(() => clips.reduce((acc, clip) => acc + clip.duration, 0), [clips]);
  const currentTotalDuration = isRecording ? totalClipsDuration + recordingSeconds : totalClipsDuration;
  const progress = timerDuration > 0 ? currentTotalDuration / timerDuration : 0;

  const hasClips = clips.length > 0;

  useEffect(() => {
    if (!isRecording) currentSpeedRef.current = speed;
  }, [speed, isRecording]);

  const handleSwitchCamera = useCallback(() => {
    setCameraFacing(prev => (prev === 'front' ? 'back' : 'front'));
    setZoom(1);
  }, []);

  const normalizedZoom = React.useMemo(() => Math.min(Math.max((zoom - 1) / 3, 0), 1), [zoom]);
  const handleToggleGrid = useCallback(() => setGridEnabled(prev => !prev), []);

  const handleAddClip = useCallback((clip: CameraClip | null) => {
    console.log('[CameraScreen] handleAddClip: Called with clip', {
      hasClip: !!clip,
      clipId: clip?.id,
      clipUri: clip?.uri,
      clipDuration: clip?.duration,
      clipType: clip?.type,
    });

    if (!clip) {
      console.log('[CameraScreen] handleAddClip: No clip provided, resetting refs');
      recordingStartTimeRef.current = null;
      speedChangesRef.current = [];
      return;
    }

    if (clip.type === 'video' && recordingStartTimeRef.current !== null) {
      const recordingDuration = (Date.now() - recordingStartTimeRef.current) / 1000;
      let videoDuration = clip.duration > 0 ? clip.duration : recordingDuration;
      if (clip.duration === 0 && recordingDuration > 0) clip.duration = recordingDuration;

      console.log('[CameraScreen] handleAddClip: Video clip details', {
        clipDuration: clip.duration,
        recordingDuration,
        videoDuration,
      });

      const changes = [...speedChangesRef.current];
      if (changes.length > 0 && videoDuration > 0) {
        const segments: SpeedSegment[] = [];
        for (let i = 0; i < changes.length; i++) {
          const change = changes[i];
          const startTime = Math.min(Math.max(change.time, 0), videoDuration);
          let endTime = (i < changes.length - 1) ? Math.min(Math.max(changes[i + 1].time, startTime), videoDuration) : videoDuration;
          if (endTime > startTime) segments.push({ startTime, endTime, speed: change.speed });
        }
        if (segments.some(seg => seg.speed !== 1) || segments.length > 1) clip.speedSegments = segments;
      } else if (currentSpeedRef.current !== 1 && videoDuration > 0) {
        clip.speedSegments = [{ startTime: 0, endTime: videoDuration, speed: currentSpeedRef.current }];
      }
    }

    recordingStartTimeRef.current = null;
    speedChangesRef.current = [];

    console.log('[CameraScreen] handleAddClip: Adding clip to array. Current clips count:', clips.length);
    setClips(prev => {
      const newClips = [...prev, clip];
      console.log('[CameraScreen] handleAddClip: Updated clips array. New count:', newClips.length);
      return newClips;
    });
  }, [clips.length]);

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

  const handleUndoClip = useCallback(() => {
    setClips(prev => prev.slice(0, -1));
  }, []);

  const handleOpenGallery = useCallback(async () => {
    let permission = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, allowsMultipleSelection: false, quality: 1 });
    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const asset = result.assets[0];
    if (!asset.uri) return;
    const isVideo = asset.type === 'video';
    setClips(prev => [...prev, {
      id: `clip-${Date.now().toString(36)}`, uri: asset.uri, duration: isVideo ? asset.duration ?? 0 : 0,
      type: isVideo ? 'video' : 'photo', source: 'gallery', speed: isVideo ? speed : undefined,
    }]);
  }, [speed]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed as SpeedMultiplier);
    if (isRecording && recordingStartTimeRef.current !== null) {
      speedChangesRef.current.push({ time: (Date.now() - recordingStartTimeRef.current) / 1000, speed: newSpeed });
      currentSpeedRef.current = newSpeed;
    }
  }, [isRecording]);

  const handleCapturePress = useCallback(async () => {
    if (mode === CameraModeEnum.Video) {
      try {
        if (isRecording) {
          console.log('[CameraScreen] handleCapturePress: Stopping recording');
          await stopRecording();
          console.log('[CameraScreen] handleCapturePress: Recording stopped successfully');
        } else {
          console.log('[CameraScreen] handleCapturePress: Starting recording');
          recordingStartTimeRef.current = Date.now();
          speedChangesRef.current = [{ time: 0, speed: speed }];
          currentSpeedRef.current = speed;
          await startRecording(handleAddClip, timerDuration, speed);
          console.log('[CameraScreen] handleCapturePress: Recording started successfully');
        }
      } catch (error) {
        console.error('[CameraScreen] handleCapturePress: ERROR', {
          error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          isRecording,
        });
        alert(`Recording error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }, [handleAddClip, isRecording, mode, startRecording, stopRecording, timerDuration, speed, resolution, frameRate, colorMode]);

  const handleNextPress = useCallback(() => {
    console.log('[CameraScreen] handleNextPress: Called', {
      clipsCount: clips.length,
      clipsArray: clips.map(c => ({ id: c.id, type: c.type, duration: c.duration })),
    });

    if (clips.length > 0) {
      console.log('[CameraScreen] handleNextPress: Calling onNext with clips');
      onNext(clips);
    } else {
      console.warn('[CameraScreen] handleNextPress: No clips available');
      alert('Please record at least one clip before proceeding');
    }
  }, [clips, onNext]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRecording) {
      if (recordingStartTimeRef.current === null) {
        recordingStartTimeRef.current = Date.now();
        speedChangesRef.current = [{ time: 0, speed: currentSpeedRef.current }];
      }
      const start = recordingStartTimeRef.current;
      interval = setInterval(() => {
        setRecordingSeconds(Math.floor((Date.now() - start) / 1000));
      }, 500);
    } else {
      setRecordingSeconds(0);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRecording]);

  const formatTimer = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (hasPermission === null && !isRequesting) {
      console.log('[CameraScreen] Requesting permissions on mount');
      requestPermissions();
    }
  }, [hasPermission, isRequesting, requestPermissions]);

  if (hasPermission === null) {
    return (
      <View style={[styles.masterContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#ffffff" size="large" />
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={[styles.masterContainer, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ color: '#FFF', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
          Reels banane ke liye Camera aur Microphone ki permission allow karein.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 }}
          onPress={requestPermissions}
          disabled={isRequesting}
        >
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
            {isRequesting ? 'Requesting...' : 'Grant Permissions'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    // ✅ KEY FIX: Root container is NOT SafeAreaView, just View with flex: 1
    // This allows CameraView to take full dimensions
    <View style={styles.masterContainer}>
      {/* ✅ KEY FIX: CameraView is direct child with absolute positioning */}
      {/* No intermediate SafeAreaView wrapping it */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing={cameraFacing}
        flash={flash === FlashModeEnum.On ? 'on' : 'off'}
        enableTorch={flash === FlashModeEnum.On}
        mode={mode === CameraModeEnum.Video ? 'video' : 'picture'}
        zoom={normalizedZoom}
        videoQuality={resolution === '4k' ? '2160p' : '1080p'}
        onCameraReady={() => {
          console.log('[CameraScreen] ✅ onCameraReady fired - native camera session initialized successfully');
          setIsCameraReady(true);
        }}
      />

      {/* UI Overlay on top of camera */}
      {!isRecording && (
        <>
          <View style={styles.floatingTopBar}>
            <TouchableOpacity style={styles.iconButton} onPress={onBack}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>

            {!hasClips && (
              <TouchableOpacity style={styles.audioPill} onPress={() => setIsMusicSheetVisible(true)}>
                <Text style={styles.audioPillText}>🎵 Add audio</Text>
              </TouchableOpacity>
            )}

            {hasClips && (
              <View style={styles.timerPillStatic}>
                <Text style={styles.timerPillStaticText}>{formatTimer(currentTotalDuration)}</Text>
              </View>
            )}

            {!hasClips && (
              <TouchableOpacity style={styles.iconButton}>
                <Text style={styles.settingsIcon}>⚙️</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.floatingSidebar}>
            <TouchableOpacity style={styles.sidebarItemRow} onPress={() => setIsMusicSheetVisible(true)}>
              <Text style={styles.sidebarIcon}>🎵</Text>
              {hasClips && <Text style={styles.sidebarLabel}>Audio</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItemRow}>
              <Text style={styles.sidebarIcon}>✨</Text>
              {hasClips && <Text style={styles.sidebarLabel}>Effects</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItemRow}>
              <Text style={styles.sidebarIcon}>👤</Text>
              {hasClips && <Text style={styles.sidebarLabel}>Green Screen</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItemRow}>
              <Text style={styles.sidebarIcon}>🪄</Text>
              {hasClips && (
                <View style={styles.labelWithBadge}>
                  <Text style={styles.sidebarLabel}>Touch Up</Text>
                  <View style={styles.badge}><Text style={styles.badgeText}>NEW</Text></View>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.sidebarItemRow}>
              <SpeedSelector speed={speed} onSpeedChange={handleSpeedChange} disabled={mode === CameraModeEnum.Photo} />
              {hasClips && <Text style={styles.sidebarLabelShifted}>Speed</Text>}
            </View>
            <View style={styles.sidebarItemRow}>
              <TimerSelector duration={timerDuration} onDurationChange={setTimerDuration} disabled={mode === CameraModeEnum.Photo} />
              {hasClips && <Text style={styles.sidebarLabelShifted}>Timer</Text>}
            </View>
            <TouchableOpacity style={styles.sidebarItemRow} onPress={handleToggleGrid}>
              <Text style={styles.sidebarIcon}>🔲</Text>
              {hasClips && <Text style={styles.sidebarLabel}>Align</Text>}
            </TouchableOpacity>
          </View>
        </>
      )}

      {isRecording && (
        <View style={styles.recordingTimerPill}>
          <Text style={styles.recordingTimerText}>{formatTimer(currentTotalDuration)}</Text>
        </View>
      )}

      {gridEnabled && (
        <View style={cameraStyles.gridOverlay} pointerEvents="none">
          <View style={[cameraStyles.gridLineVertical, { left: '33.33%' }]} />
          <View style={[cameraStyles.gridLineVertical, { left: '66.66%' }]} />
          <View style={[cameraStyles.gridLineHorizontal, { top: '33.33%' }]} />
          <View style={[cameraStyles.gridLineHorizontal, { top: '66.66%' }]} />
        </View>
      )}

      <View style={styles.bottomArea}>
        <View style={styles.captureRow}>
          {hasClips && !isRecording ? (
            <>
              <View style={styles.sideControlCenter}>
                <TouchableOpacity style={styles.undoButton} onPress={handleUndoClip}>
                  <Text style={styles.undoText}>Undo</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.centerControl}>
                <CaptureButton mode={mode} isRecording={isRecording} hasClips={hasClips} progress={progress} onPress={handleCapturePress} onPressIn={handleCapturePressIn} onPressOut={handleCapturePressOut} disabled={!hasPermission || !isCameraReady} />
              </View>
              <View style={styles.sideControlCenter}>
                <TouchableOpacity style={styles.nextButtonProminent} onPress={handleNextPress}>
                  <Text style={styles.nextButtonTextProminent}>Next ⟩</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.sideControl}>
                {!isRecording && <GalleryButton onPress={handleOpenGallery} />}
              </View>
              <View style={styles.centerControl}>
                <CaptureButton mode={mode} isRecording={isRecording} hasClips={hasClips} progress={progress} onPress={handleCapturePress} onPressIn={handleCapturePressIn} onPressOut={handleCapturePressOut} disabled={!hasPermission || !isCameraReady} />
              </View>
              <View style={styles.sideControlRight}>
                <View style={isRecording ? styles.recordingFlipButton : {}}>
                  <CameraSwitchButton onPress={handleSwitchCamera} />
                </View>
              </View>
            </>
          )}
        </View>

        {!isRecording && !hasClips && (
          <View style={styles.modeSelectorContainer} >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeSelectorScroll}>
              {(['REEL', 'LIVE'] as UIMode[]).map((m) => (
                <TouchableOpacity key={m} onPress={() => setUiMode(m)} style={styles.modePill}>
                  <Text style={[styles.modeText, uiMode === m && styles.modeTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {hasClips && !isRecording && (
          <View style={styles.cornerControlsRow}>
            <GalleryButton onPress={handleOpenGallery} />
            <CameraSwitchButton onPress={handleSwitchCamera} />
          </View>
        )}
      </View>

      {activeClip && <ClipPlayerOverlay clip={activeClip} onClose={() => setActiveClip(null)} />}

      <MusicLibraryModal visible={isMusicSheetVisible} onCancel={() => setIsMusicSheetVisible(false)} selectedMusic={null} onSelect={() => setIsMusicSheetVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  masterContainer: { flex: 1, backgroundColor: '#000' },
  floatingTopBar: { position: 'absolute', top: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, zIndex: 10 },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  closeIcon: { color: '#FFF', fontSize: 28, fontWeight: '300', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  settingsIcon: { fontSize: 24, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  audioPill: { backgroundColor: 'rgba(0, 0, 0, 0.4)', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20 },
  audioPillText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  timerPillStatic: { backgroundColor: 'rgba(255, 255, 255, 0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  timerPillStaticText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  recordingTimerPill: { position: 'absolute', top: 60, right: 20, backgroundColor: '#FF007F', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, zIndex: 10 },
  recordingTimerText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  floatingSidebar: { position: 'absolute', left: 20, top: 120, alignItems: 'flex-start', gap: 16, zIndex: 10 },
  sidebarItemRow: { flexDirection: 'row', alignItems: 'center', height: 40 },
  sidebarIcon: { fontSize: 22, color: '#FFF', width: 40, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  sidebarLabel: { color: '#FFF', fontSize: 13, fontWeight: '600', marginLeft: 8, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  sidebarLabelShifted: { color: '#FFF', fontSize: 13, fontWeight: '600', marginLeft: -2, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  labelWithBadge: { alignItems: 'flex-start' },
  badge: { backgroundColor: '#0095f6', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, marginLeft: 8, marginTop: 2 },
  badgeText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },
  bottomArea: { position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center', zIndex: 10, paddingTop: 60 },
  captureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 30, marginBottom: 30, marginTop: 40 },
  sideControl: { flex: 1, alignItems: 'flex-start' },
  sideControlCenter: { flex: 1, alignItems: 'center' },
  centerControl: { flex: 1, alignItems: 'center' },
  sideControlRight: { flex: 1, alignItems: 'flex-end', gap: 15 },
  recordingFlipButton: { position: 'absolute', bottom: -40, right: 0 },
  undoButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24 },
  undoText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  nextButtonProminent: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 },
  nextButtonTextProminent: { color: '#000', fontWeight: 'bold', fontSize: 15 },
  modeSelectorContainer: { height: 40, width: '100%', marginTop: 40 },
  modeSelectorScroll: { paddingHorizontal: 50, alignItems: 'center', gap: 24 },
  modePill: { paddingHorizontal: 10 },
  modeText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600', letterSpacing: 1 },
  modeTextActive: { color: '#FFF' },
  cornerControlsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 30, position: 'absolute', bottom: -10, marginTop: 40 }
});

export default CameraScreen;