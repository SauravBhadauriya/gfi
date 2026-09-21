// PATH: apps/gully-fame-mobile/src/modules/video-editor/camera-module/screens/CameraScreen.tsx

import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import BackArrow from '../components/BackArrow';
import CameraSwitchButton from '../components/CameraSwitchButton';
import CaptureButton from '../components/CaptureButton';
import ClipList from '../components/ClipList';
import ClipPlayerOverlay from '../components/ClipPlayerOverlay';
import FlashToggle from '../components/FlashToggle';
import GalleryButton from '../components/GalleryButton';
import HDSelector, { type ColorMode, type FrameRate, type Resolution } from '../components/HDSelector';
import ModeToggle from '../components/ModeToggle';
import SpeedSelector, { type SpeedMultiplier } from '../components/SpeedSelector';
import TimerSelector, { type TimerDuration } from '../components/TimerSelector';
import ZoomButtons from '../components/ZoomButtons';
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

const CameraScreen: React.FC<CameraScreenProps> = ({ onBack, onNext, initialClips = [] }) => {
  const [mode, setMode] = useState<CameraModeEnum>(CameraModeEnum.Video); 
  const [flash, setFlash] = useState<FlashModeEnum>(FlashModeEnum.Off);
  const [clips, setClips] = useState<CameraClipArray>(initialClips);

  useEffect(() => {
    if (initialClips) {
      setClips(initialClips);
    }
  }, [initialClips]);

  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [activeClip, setActiveClip] = useState<CameraClip | null>(null);
  const [timerDuration, setTimerDuration] = useState<TimerDuration>(15);
  const [speed, setSpeed] = useState<SpeedMultiplier>(1);
  
  const recordingStartTimeRef = useRef<number | null>(null);
  const speedChangesRef = useRef<Array<{ time: number; speed: number }>>([]);
  const currentSpeedRef = useRef<SpeedMultiplier>(speed);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [isHoldingCapture, setIsHoldingCapture] = useState(false);
  const [zoom, setZoom] = useState(1); 
  const [gridEnabled, setGridEnabled] = useState(false); 
  const [resolution, setResolution] = useState<Resolution>('hd');
  const [frameRate, setFrameRate] = useState<FrameRate>(30);
  const [colorMode, setColorMode] = useState<ColorMode>('sdr');

  // 🔥 STATE MACHINE FLAGS (Bina kisi arbitrary setTimeout ke hardware sync ke liye)
  const [isSwitchingLens, setIsSwitchingLens] = useState(false);
  const [pendingFlip, setPendingFlip] = useState(false);
  const shouldResumeRecordingRef = useRef(false);

  const { hasPermission, isRequesting, requestPermissions } = usePermissions();
  const { cameraRef, isRecording, takePhoto, startRecording, stopRecording } = useCamera(
    mode,
    flash,
  );
  
  useEffect(() => {
    if (!isRecording) {
      currentSpeedRef.current = speed;
    }
  }, [speed, isRecording]);

  const handleChangeMode = useCallback((nextMode: CameraModeEnum) => {
    setMode(nextMode);
  }, []);

  // 🔥 STEP 1: TRIGGER FLIP (Sirf stop recording call karo aur state mark karo)
  const handleSwitchCamera = useCallback(async () => {
    if (isSwitchingLens || pendingFlip) return; 

    if (isRecording && mode === CameraModeEnum.Video) {
      console.log('🎥 Flip triggered during active recording. Scheduling hardware safe-stop...');
      setIsSwitchingLens(true);
      setPendingFlip(true); // Machine will wait for isRecording to become false natively
      await stopRecording();
    } else {
      setIsSwitchingLens(true);
      shouldResumeRecordingRef.current = false;
      setCameraFacing(prev => (prev === 'front' ? 'back' : 'front'));
      setZoom(1);
    }
  }, [isRecording, mode, stopRecording, isSwitchingLens, pendingFlip]);

  // 🔥 STEP 2: HARDWARE WATCHER (Jab native recorder completely close hoga tabhi lens badlega)
  useEffect(() => {
    if (!isRecording && pendingFlip) {
      console.log('🔄 Native MediaRecorder has fully released file handles. Safe to flip lenses now.');
      setPendingFlip(false); // Reset state machine trigger
      shouldResumeRecordingRef.current = true; // Signal onCameraReady to auto-resume
      
      // Physically change camera lens now that pipeline is completely idle
      setCameraFacing(prev => (prev === 'front' ? 'back' : 'front'));
      setZoom(1);
    }
  }, [isRecording, pendingFlip]);

  // 🔥 STEP 3: AUTO RESUME CHUNKS (Naye lens preview load hote hi automatic recording resume)
  const handleCameraReady = useCallback(async () => {
    if (shouldResumeRecordingRef.current) {
      shouldResumeRecordingRef.current = false; // Reset instant ref
      console.log('📸 New camera stream layer successfully bound. Resuming recording pipe...');
      
      // 400ms buffer window to avoid visual stutter during hardware initialization threads
      setTimeout(async () => {
        try {
          recordingStartTimeRef.current = Date.now();
          speedChangesRef.current = [{ time: 0, speed: speed }];
          await startRecording(handleAddClip, timerDuration, speed, { resolution, frameRate, colorMode });
          console.log('🟢 Chained next video chunk smoothly on the inverted lens!');
        } catch (error) {
          console.warn('❌ Failed to resume video stream context:', error);
        } finally {
          setIsSwitchingLens(false); // Unlock the user UI controls
        }
      }, 400);
    } else {
      setIsSwitchingLens(false);
    }
  }, [startRecording, handleAddClip, timerDuration, speed, resolution, frameRate, colorMode]);

  const normalizedZoom = React.useMemo(() => {
    return Math.min(Math.max((zoom - 1) / 3, 0), 1);
  }, [zoom]);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const handleToggleGrid = useCallback(() => {
    setGridEnabled(prev => !prev);
  }, []);

  const handleAddClip = useCallback((clip: CameraClip | null) => {
    if (!clip) {
      recordingStartTimeRef.current = null;
      speedChangesRef.current = [];
      return;
    }
    
    if (clip.type === 'video' && recordingStartTimeRef.current !== null) {
      const recordingDuration = (Date.now() - recordingStartTimeRef.current) / 1000;
      let videoDuration = clip.duration > 0 ? clip.duration : recordingDuration;
      
      if (clip.duration === 0 && recordingDuration > 0) {
        clip.duration = recordingDuration;
      }
      const changes = [...speedChangesRef.current];
      
      if (changes.length > 0 && videoDuration > 0) {
        const segments: SpeedSegment[] = [];
        
        for (let i = 0; i < changes.length; i++) {
          const change = changes[i];
          const startTime = Math.min(Math.max(change.time, 0), videoDuration);
          const speed = change.speed;
          
          let endTime: number;
          if (i < changes.length - 1) {
            endTime = Math.min(Math.max(changes[i + 1].time, startTime), videoDuration);
          } else {
            endTime = videoDuration;
          }
          
          if (endTime > startTime) {
            segments.push({ startTime, endTime, speed });
          }
        }
        if (segments.length > 0 && (segments.length > 1 || segments.some(seg => seg.speed !== 1))) {
          clip.speedSegments = segments;
        }
      } else if (currentSpeedRef.current !== 1 && videoDuration > 0) {
        clip.speedSegments = [{
          startTime: 0,
          endTime: videoDuration,
          speed: currentSpeedRef.current,
        }];
      }
    }
    
    recordingStartTimeRef.current = null;
    speedChangesRef.current = [];
    setClips(prev => [...prev, clip]);
  }, []);

  const handleCapturePressIn = useCallback(() => {
    setIsHoldingCapture(true);
  }, []);

  const handleCapturePressOut = useCallback(async () => {
    const wasHolding = isHoldingCapture;
    setIsHoldingCapture(false);

    if (mode === CameraModeEnum.Photo && wasHolding) {
      const clip = await takePhoto();
      handleAddClip(clip);
    }
  }, [mode, isHoldingCapture, takePhoto, handleAddClip]);

  const handleToggleFlash = useCallback(() => {
    setFlash(current =>
      current === FlashModeEnum.On ? FlashModeEnum.Off : FlashModeEnum.On,
    );
  }, []);

  const handleDeleteClip = useCallback((id: string) => {
    setClips(prev => prev.filter(clip => clip.id !== id));
  }, []);

  const handleOpenClip = useCallback((clip: CameraClip) => {
    setActiveClip(clip);
  }, []);

  const handleCloseClip = useCallback(() => {
    setActiveClip(null);
  }, []);

  const handleOpenGallery = useCallback(async () => {
    let permission = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (permission.status !== 'granted') {
      console.warn('Media library permission not granted');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    if (!asset.uri) {
      return;
    }

    const makeId = () =>
      `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const isVideo = asset.type === 'video';
    const duration = isVideo ? asset.duration ?? 0 : 0;

    const newClip: CameraClip = {
      id: makeId(),
      uri: asset.uri,
      duration,
      type: isVideo ? 'video' : 'photo',
      source: 'gallery',
      speed: isVideo ? speed : undefined,
    };

    setClips(prev => [...prev, newClip]);
  }, []);

  const handleSpeedChange = useCallback((newSpeed: SpeedMultiplier) => {
    setSpeed(newSpeed);
    
    if (isRecording && recordingStartTimeRef.current !== null) {
      const currentTime = (Date.now() - recordingStartTimeRef.current) / 1000;
      speedChangesRef.current.push({
        time: currentTime,
        speed: newSpeed,
      });
      currentSpeedRef.current = newSpeed;
    }
  }, [isRecording]);

  const handleCapturePress = useCallback(async () => {
    if (isSwitchingLens || pendingFlip) return;

    if (mode === CameraModeEnum.Video) {
        if (isRecording) {
          await stopRecording();
        } else {
        recordingStartTimeRef.current = Date.now();
        speedChangesRef.current = [];
        currentSpeedRef.current = speed;
        speedChangesRef.current.push({ time: 0, speed: speed });
        
        await startRecording(handleAddClip, timerDuration, speed, { resolution, frameRate, colorMode });
      }
    }
  }, [handleAddClip, isRecording, mode, startRecording, stopRecording, timerDuration, speed, resolution, frameRate, colorMode, isSwitchingLens, pendingFlip]);

  const handleNextPress = useCallback(() => {
    if (clips.length === 0) {
      return;
    }
    onNext(clips);
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
        const elapsedMs = Date.now() - start;
        setRecordingSeconds(Math.floor(elapsedMs / 1000));
      }, 500);
    } else {
      setRecordingSeconds(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);

  const formatTimer = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={cameraStyles.permissionContainer}>
        <ActivityIndicator color="#ffffff" />
        <Text style={cameraStyles.permissionText}>Checking camera permissions…</Text>
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={cameraStyles.permissionContainer}>
        <Text style={cameraStyles.permissionText}>
          We need access to your camera and microphone to capture photos and videos.
        </Text>
        <TouchableOpacity style={cameraStyles.permissionButton} onPress={requestPermissions} disabled={isRequesting}>
          <Text style={cameraStyles.permissionButtonText}> Grant permission </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={cameraStyles.cameraContainer}>
      <View style={cameraStyles.cameraPreview}>
        <CameraView
          ref={cameraRef}
          style={cameraStyles.cameraPreview}
          facing={cameraFacing}
          flash={flash === FlashModeEnum.On ? 'on' : 'off'}
          enableTorch={flash === FlashModeEnum.On}
          mode={mode === CameraModeEnum.Video ? 'video' : 'picture'}
          zoom={normalizedZoom}
          videoQuality={resolution === '4k' ? '2160p' : '1080p'}
          onCameraReady={handleCameraReady} 
        />

        {/* --- BLUR TRANSITION LAYER --- */}
        {isSwitchingLens && (
          <View style={styles.switchingOverlay}>
            <ActivityIndicator color="#ffffff" size="large" />
            <Text style={styles.switchingText}>Flipping Lens...</Text>
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

        {isRecording && (
          <View style={cameraStyles.recordingTimerContainer}>
            <View style={cameraStyles.recordingDot} />
            <Text style={cameraStyles.recordingTimerText}>
              {formatTimer(recordingSeconds)}
            </Text>
          </View>
        )}

        <View style={cameraStyles.topBar}>
          <TouchableOpacity style={cameraStyles.backButton} onPress={onBack}>
            <BackArrow />
          </TouchableOpacity>
          <View style={cameraStyles.modeToggleContainer}>
            <ModeToggle mode={mode} onChangeMode={handleChangeMode} />
          </View>
        </View>

        <View style={cameraStyles.flashOverlay}>
          <FlashToggle flash={flash} onToggle={handleToggleFlash} />
        </View>

        <View style={cameraStyles.timerSelectorOverlay}>
          <TimerSelector duration={timerDuration} onDurationChange={setTimerDuration} disabled={mode === CameraModeEnum.Photo} />
        </View>

        <View style={cameraStyles.speedSelectorOverlay}>
          <SpeedSelector speed={speed} onSpeedChange={handleSpeedChange} disabled={mode === CameraModeEnum.Photo} />
        </View>

        <View style={cameraStyles.hdSelectorOverlay}>
          <HDSelector resolution={resolution} frameRate={frameRate} colorMode={colorMode} onResolutionChange={setResolution} onFrameRateChange={setFrameRate} onColorModeChange={setColorMode} cameraFacing={cameraFacing} />
        </View>
      </View>

      <View style={cameraStyles.bottomBar}>
        <View style={cameraStyles.bottomControlsRow}>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <GalleryButton onPress={handleOpenGallery} />
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <CaptureButton mode={mode} isRecording={isRecording} onPress={handleCapturePress} onPressIn={handleCapturePressIn} onPressOut={handleCapturePressOut} disabled={!hasPermission || isSwitchingLens} />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <CameraSwitchButton onPress={handleSwitchCamera} />
            {clips.length > 0 && (
              <TouchableOpacity style={cameraStyles.nextButton} onPress={handleNextPress} activeOpacity={0.8}>
                <Text style={cameraStyles.nextButtonText}>Next {'\u003e'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ZoomButtons zoom={zoom} onZoomChange={handleZoomChange} disabled={!hasPermission || isSwitchingLens} />
        <ClipList clips={clips} onDeleteClip={handleDeleteClip} onPressClip={handleOpenClip} />
      </View>

      {activeClip && (
        <ClipPlayerOverlay clip={activeClip} onClose={handleCloseClip} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  switchingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  switchingText: {
    color: '#ffffff',
    marginTop: 14,
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default CameraScreen;