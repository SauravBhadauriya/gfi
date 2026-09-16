import { Video } from "expo-video";
import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Modal,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from "react-native-reanimated";
import type { CameraClip } from "../types/camera.types";
import { FilterConfig } from "../types/filters";
import type { TextOverlay } from "../types/textOverlay.types";
import { hasFilterChanges } from "../utils/filterHelpers";
import AddClipOverlay from "./AddClipOverlay";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import DraggableTextOverlays from "./DraggableTextOverlays";
import FilteredImage from "./FilteredImage";
import FilteredVideo from "./FilteredVideo";
import PreviewActionButtons from "./PreviewActionButtons";
import TextEditorModal from "./TextEditorModal";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const FRAME_WIDTH = 40;
const FRAME_HEIGHT = 50;

interface ModernPreviewEditorProps {
  clip: CameraClip;
  onBack?: () => void;
  onNext?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onPreset?: () => void;
  onSpeedChange?: (speed: number) => void;
  onAddClip?: (source: "camera" | "gallery") => void;
  onAddClipFromGallery?: (clip: CameraClip) => void;
  onClipUpdate?: (updatedClip: CameraClip) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onVideoPlaybackStatusUpdate?: (status: any) => void;
  onSelectMusic?: (track: any) => void;
}

const ModernPreviewEditor: React.FC<ModernPreviewEditorProps> = ({
  clip,
  onBack,
  onNext,
  onUndo,
  onRedo,
  onDelete,
  onPreset,
  onSpeedChange,
  onAddClip,
  onAddClipFromGallery,
  onClipUpdate,
  canUndo = false,
  canRedo = false,
  onVideoPlaybackStatusUpdate,
  onSelectMusic,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedSpeed, setSelectedSpeed] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterConfig | null>(
    clip.filterPreset || null
  );

  // ✂️ TRIM STATES
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [showTrimHandles, setShowTrimHandles] = useState(false);

  // 🎵 INSTAGRAM STYLE MUSIC ENGINE STATES
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [showMusicAdjuster, setShowMusicAdjuster] = useState(false);
  const [musicOffset, setMusicOffset] = useState(0); 
  const [selectedTrackName, setSelectedTrackName] = useState("Braj Ras Ringtone");

  // Premium Custom Curated Tracking Feed Mock Matrix Data
  const TRENDING_TRACKS = [
    { id: "1", title: "Millionaire", artist: "Yo Yo Honey Singh", duration: "0:30", views: "2.5M" },
    { id: "2", title: "Softly", artist: "Karan Aujla", duration: "0:30", views: "4.1M" },
    { id: "3", title: "Tauba Tauba", artist: "Karan Aujla / Vicky Kaushal", duration: "0:30", views: "1.8M" },
    { id: "4", title: "Big Dawgs", artist: "Hanumankind", duration: "0:30", views: "5.2M" },
    { id: "5", title: "Braj Ras Ringtone", artist: "Traditional Devotional", duration: "0:30", views: "900K" },
  ];

  React.useEffect(() => {
    setSelectedFilter(clip.filterPreset || null);
  }, [clip.filterPreset]);

  const videoRef = useRef<Video>(null);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const isDragging = useRef(false);
  const wasPlaying = useRef(false);
  const lastUpdateTime = useRef(0);
  const currentPlaybackRateRef = useRef(1);
  const isChangingRateRef = useRef(false);
  const [showAddClipOverlay, setShowAddClipOverlay] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [selectedTextOverlay, setSelectedTextOverlay] = useState<TextOverlay | null>(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });

  // ⚡ Reanimated Values
  const playButtonScale = useSharedValue(1);
  const timelineOpacity = useSharedValue(1);

  const playButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: playButtonScale.value }],
    };
  });

  const timelineAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: timelineOpacity.value,
    };
  });

  const isVideo = clip.type === "video";

  const handleDeletePress = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    setShowDeleteModal(false);
    onDelete?.();
  }, [onDelete]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  const speedSegments = React.useMemo(() => {
    return clip.speedSegments && clip.speedSegments.length > 0 ? clip.speedSegments : null;
  }, [clip.speedSegments]);

  const getSpeedAtTime = React.useCallback(
    (time: number): number => {
      if (!speedSegments) return selectedSpeed;

      for (const seg of speedSegments) {
        if (time >= seg.startTime && time < seg.endTime) {
          return seg.speed;
        }
      }
      return speedSegments[speedSegments.length - 1]?.speed ?? selectedSpeed;
    },
    [speedSegments, selectedSpeed]
  );

  const speedLabels: Record<number, string> = {
    0.5: "0.5x",
    1: "1x",
    2: "2x",
    3: "3x",
    5: "5x",
  };

  const frames = React.useMemo(() => {
    if (!isVideo) return [];
    if (duration === 0) return [];
    const frameCount = Math.max(10, Math.ceil(duration * 3)); 
    return Array.from({ length: frameCount }, (_, i) => ({
      id: `frame-${i}`,
      time: (i / frameCount) * duration,
    }));
  }, [duration, isVideo]);

  const totalWidth = frames.length > 0 ? frames.length * FRAME_WIDTH : 0;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleLoad = useCallback(
    (status: any) => {
      if (status.isLoaded && status.durationMillis) {
        const dur = status.durationMillis / 1000;
        setDuration(dur);
        setTrimStart(0);    
        setTrimEnd(dur);     
        setIsReady(true);

        if (speedSegments && videoRef.current) {
          const initialSpeed = getSpeedAtTime(0);
          currentPlaybackRateRef.current = initialSpeed;
          videoRef.current.setRateAsync(initialSpeed, true).catch(console.warn);
        }
      }
    },
    [speedSegments, getSpeedAtTime]
  );

  const handlePlaybackStatus = useCallback(
    (status: any) => {
      if (!status.isLoaded || isDragging.current) return;

      onVideoPlaybackStatusUpdate?.(status);

      if (status.durationMillis && status.positionMillis !== undefined) {
        const time = status.positionMillis / 1000;
        const dur = status.durationMillis / 1000;

        // 🛠️ Loop Threshold Guard: Break infinite frame updates re-render depth
        if (Math.abs(currentTime - time) > 0.25) {
          setCurrentTime(time);
        }

        if (isPlaying && !status.isPlaying && !isChangingRateRef.current && videoRef.current) {
          videoRef.current.playAsync().catch(console.warn);
        }

        if (speedSegments && videoRef.current && isPlaying && !isChangingRateRef.current) {
          const targetSpeed = getSpeedAtTime(time);
          if (Math.abs(targetSpeed - currentPlaybackRateRef.current) > 0.01) {
            isChangingRateRef.current = true;
            currentPlaybackRateRef.current = targetSpeed;

            videoRef.current
              .setRateAsync(targetSpeed, true)
              .then(() => {
                setTimeout(() => {
                  if (isPlaying && videoRef.current && !isDragging.current) {
                    videoRef.current
                      .getStatusAsync()
                      .then((s: any) => {
                        if (s.isLoaded && !s.isPlaying) {
                          videoRef.current?.playAsync().catch(console.warn);
                        }
                      })
                      .catch(console.warn);
                  }
                  isChangingRateRef.current = false;
                }, 100);
              })
              .catch((err) => {
                console.warn("Error changing playback rate:", err);
                isChangingRateRef.current = false;
              });
          }
        }

        if (isPlaying && scrollViewRef.current && totalWidth > 0) {
          const progress = time / dur;
          const scrollX = Math.max(0, progress * totalWidth - SCREEN_WIDTH / 2);
          scrollViewRef.current.scrollTo({ x: scrollX, y: 0, animated: false });
        }

        if (time >= trimEnd - 0.1 && status.isPlaying && videoRef.current) {
          setIsPlaying(false);
          videoRef.current.pauseAsync();

          setTimeout(async () => {
            if (videoRef.current) {
              await videoRef.current.setPositionAsync(trimStart * 1000); 
              setCurrentTime(trimStart);
              
              if (totalWidth > 0) {
                const progress = trimStart / duration;
                const scrollX = Math.max(0, progress * totalWidth - SCREEN_WIDTH / 2);
                scrollViewRef.current?.scrollTo({ x: scrollX, y: 0, animated: true });
              }

              if (speedSegments) {
                const initialSpeed = getSpeedAtTime(trimStart);
                currentPlaybackRateRef.current = initialSpeed;
                await videoRef.current.setRateAsync(initialSpeed, true);
              } else {
                await videoRef.current.setRateAsync(selectedSpeed, true);
              }

              await videoRef.current.playAsync();
              setIsPlaying(true);
              
              onVideoPlaybackStatusUpdate?.({ isLoaded: true, didJustFinish: true });
            }
          }, 500); 
        }
      }
    },
    [isPlaying, totalWidth, speedSegments, getSpeedAtTime, selectedSpeed, trimStart, trimEnd, duration, currentTime, onVideoPlaybackStatusUpdate]
  );

  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current || !isReady) return;

    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        if (currentTime >= trimEnd - 0.1) {
          await videoRef.current.setPositionAsync(trimStart * 1000);
          setCurrentTime(trimStart);
          scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
          if (speedSegments) {
            const initialSpeed = getSpeedAtTime(trimStart);
            currentPlaybackRateRef.current = initialSpeed;
            await videoRef.current.setRateAsync(initialSpeed, true);
          }
        } else {
          if (speedSegments) {
            const targetSpeed = getSpeedAtTime(currentTime);
            currentPlaybackRateRef.current = targetSpeed;
            await videoRef.current.setRateAsync(targetSpeed, true);
          }
        }
        await videoRef.current.playAsync();
        setIsPlaying(true);
        
        onVideoPlaybackStatusUpdate?.({ isLoaded: true, didJustFinish: true });
      }
    } catch (error) {
      console.warn("Play/Pause error:", error);
    }
  }, [isPlaying, isReady, currentTime, trimStart, trimEnd, speedSegments, getSpeedAtTime, onVideoPlaybackStatusUpdate]);

  const seekTo = useCallback(
    async (time: number) => {
      if (!videoRef.current || !isReady) return;
      const clampedTime = Math.max(trimStart, Math.min(time, trimEnd));
      try {
        await videoRef.current.setPositionAsync(clampedTime * 1000);
        setCurrentTime(clampedTime);

        if (speedSegments) {
          const targetSpeed = getSpeedAtTime(clampedTime);
          currentPlaybackRateRef.current = targetSpeed;
          await videoRef.current.setRateAsync(targetSpeed, true);
        }
      } catch (error) {
        console.warn("Seek error:", error);
      }
    },
    [isReady, trimStart, trimEnd, speedSegments, getSpeedAtTime]
  );

  const handleScroll = useCallback(
    (event: any) => {
      if (!isDragging.current || !isReady || duration === 0) return;

      const scrollX = event.nativeEvent.contentOffset.x;
      const progress = (scrollX + SCREEN_WIDTH / 2) / totalWidth;
      const time = Math.max(0, Math.min(progress * duration, duration));

      const now = Date.now();
      if (now - lastUpdateTime.current > 50) {
        lastUpdateTime.current = now;
        seekTo(time);
      } else {
        setCurrentTime(time);
      }
    },
    [isReady, duration, totalWidth, seekTo]
  );

  const handleScrollBegin = useCallback(() => {
    isDragging.current = true;
    wasPlaying.current = isPlaying;

    if (isPlaying && videoRef.current) {
      videoRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const handleScrollEnd = useCallback(
    (event: any) => {
      const scrollX = event.nativeEvent.contentOffset.x;
      const progress = (scrollX + SCREEN_WIDTH / 2) / totalWidth;
      const time = Math.max(0, Math.min(progress * duration, duration));

      seekTo(time);

      setTimeout(() => {
        isDragging.current = false;

        if (wasPlaying.current && videoRef.current) {
          videoRef.current.playAsync();
          setIsPlaying(true);
        }
      }, 100);
    },
    [duration, totalWidth, seekTo]
  );

  const handleSpeedChange = useCallback(
    (speed: number) => {
      setSelectedSpeed(speed);
      onSpeedChange?.(speed);

      if (!speedSegments && videoRef.current && isReady) {
        videoRef.current.setRateAsync(speed, true);
        currentPlaybackRateRef.current = speed;
      }
    },
    [isReady, onSpeedChange, speedSegments]
  );

  const handleAddPress = useCallback(() => {
    setShowAddClipOverlay(true);
  }, []);

  const handleSelectCamera = useCallback(() => {
    setShowAddClipOverlay(false);
    onAddClip?.("camera");
  }, [onAddClip]);

  const handleSelectGallery = useCallback(
    (newClip: CameraClip) => {
      onAddClipFromGallery?.(newClip);
    },
    [onAddClipFromGallery]
  );

  const handleFilter = useCallback(
    (filter: FilterConfig) => {
      if (filter.name === "Original" || !hasFilterChanges(filter)) {
        setSelectedFilter(null);
        if (onClipUpdate) {
          const { filterPreset, ...clipWithoutFilter } = clip;
          onClipUpdate({ ...clipWithoutFilter });
        }
      } else {
        setSelectedFilter(filter);
        if (onClipUpdate) {
          onClipUpdate({ ...clip, filterPreset: filter });
        }
      }
    },
    [clip, onClipUpdate]
  );

  const handleOverlay = useCallback(() => {
    console.log("Overlay pressed");
  }, []);

  const handleText = useCallback(() => {
    setSelectedTextOverlay(null);
    setShowTextEditor(true);
  }, []);

  const handleTextOverlayPress = useCallback((overlay: TextOverlay) => {
    setSelectedTextOverlay(overlay);
    setSelectedOverlayId(overlay.id);
    setShowTextEditor(true);
  }, []);

  const handleTextOverlaySave = useCallback(
    (overlay: TextOverlay) => {
      const existingOverlays = clip.textOverlays || [];
      const existingIndex = existingOverlays.findIndex((o) => o.id === overlay.id);

      let updatedOverlays: TextOverlay[];
      if (existingIndex >= 0) {
        updatedOverlays = [...existingOverlays];
        updatedOverlays[existingIndex] = overlay;
      } else {
        updatedOverlays = [...existingOverlays, overlay];
      }

      const updatedClip = { ...clip, textOverlays: updatedOverlays };
      onClipUpdate?.(updatedClip);
      setSelectedOverlayId(null);
    },
    [clip, onClipUpdate]
  );

  const handleTextOverlayDelete = useCallback(
    (overlayId: string) => {
      const existingOverlays = clip.textOverlays || [];
      const updatedOverlays = existingOverlays.filter((o) => o.id !== overlayId);
      const updatedClip = { ...clip, textOverlays: updatedOverlays };
      onClipUpdate?.(updatedClip);
      setSelectedOverlayId(null);
      setSelectedTextOverlay(null);
    },
    [clip, onClipUpdate]
  );

  const handleTextOverlayUpdate = useCallback(
    (overlay: TextOverlay) => {
      const existingOverlays = clip.textOverlays || [];
      const existingIndex = existingOverlays.findIndex((o) => o.id === overlay.id);

      if (existingIndex >= 0) {
        const updatedOverlays = [...existingOverlays];
        updatedOverlays[existingIndex] = overlay;
        const updatedClip = { ...clip, textOverlays: updatedOverlays };
        onClipUpdate?.(updatedClip);
      }
    },
    [clip, onClipUpdate]
  );

  const handleTextEditorClose = useCallback(() => {
    setShowTextEditor(false);
    setSelectedTextOverlay(null);
    setSelectedOverlayId(null);
  }, []);

  const handleTrim = useCallback(() => {
    setShowTrimHandles(!showTrimHandles);
    if (!showTrimHandles && isVideo && videoRef.current) {
      videoRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }, [showTrimHandles, isVideo]);

  const handleSticker = useCallback((sticker?: string | number) => {
    if (sticker !== undefined) {
      console.log("Sticker selected:", sticker);
    }
  }, []);

  // 🛠️ FIX 2: Correctly mapped from ReferenceError to launch picker window sheet
  const handleMusic = useCallback(() => {
    setShowMusicPicker(true);
    if (videoRef.current) {
      videoRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      
      {/* 🎥 FULL SCREEN IMMERSIVE PREVIEW BACKDROP BASE LAYER */}
      <TouchableOpacity
        style={styles.fullScreenPreviewContainer}
        activeOpacity={1}
        onPress={isVideo ? togglePlayPause : undefined}
        disabled={!isVideo}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setPreviewDimensions({ width, height });
        }}
      >
        {isVideo ? (
          <FilteredVideo
            videoRef={videoRef}
            source={{ uri: clip.uri }}
            style={styles.mediaFullScreen}
            resizeMode="cover" 
            shouldPlay={false}
            isLooping={false}
            rate={speedSegments ? currentPlaybackRateRef.current : selectedSpeed}
            onLoad={handleLoad}
            onPlaybackStatusUpdate={handlePlaybackStatus}
            progressUpdateIntervalMillis={33}
            filter={selectedFilter || undefined}
          />
        ) : (
          <FilteredImage
            source={{ uri: clip.uri }}
            style={styles.mediaFullScreen}
            resizeMode="cover"
            filter={selectedFilter || undefined}
          />
        )}

        {!isPlaying && isVideo && (
          <View style={styles.playOverlay}>
            <Animated.View style={playButtonAnimatedStyle}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayPause}
                onPressIn={() => { playButtonScale.value = withSpring(0.9); }}
                onPressOut={() => { playButtonScale.value = withSpring(1); }}
              >
                <View style={styles.playButtonInner}>
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <Path d="M8 5v14l11-7L8 5z" fill="#ffffff" />
                  </Svg>
                </View>
                <View style={styles.playButtonRing} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {isPlaying && isVideo && duration > 0 && (
          <View style={styles.progressBarOverlay}>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${(currentTime / duration) * 100}%` }]} />
            </View>
          </View>
        )}

        {isVideo && isReady && (
          <View style={styles.timeDisplay}>
            <View style={styles.timeDisplayInner}>
              <Text style={styles.timeTextCurrent}>{formatTime(currentTime)}</Text>
              <View style={styles.timeSeparator} />
              <Text style={styles.timeTextTotal}>{formatTime(duration)}</Text>
            </View>
          </View>
        )}

        {isReady && clip.textOverlays && clip.textOverlays.length > 0 && (
          <DraggableTextOverlays
            overlays={clip.textOverlays}
            containerWidth={previewDimensions.width}
            containerHeight={previewDimensions.height}
            currentTime={isVideo ? currentTime : undefined}
            onOverlayUpdate={handleTextOverlayUpdate}
            onOverlayPress={handleTextOverlayPress}
            selectedOverlayId={selectedOverlayId}
          />
        )}
      </TouchableOpacity>

      {/* 🎛️ TRANSPARENT CONTROL OVERLAY CHANNELS CONTAINER LAYER */}
      <View style={styles.floatingControlsContainer} pointerEvents="box-none">
        
        {/* Top Floating Action Tray Header */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topButton} onPress={onBack}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>

          <View style={styles.mediaInfo}>
            <Text style={styles.mediaInfoText}>{isVideo ? formatTime(duration) : "Photo"}</Text>
            {isVideo && <Text style={styles.speedInfoText}>{speedLabels[selectedSpeed]}</Text>}
          </View>

          <TouchableOpacity style={[styles.topButton, styles.nextButton]} onPress={onNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Control Clustered Row Panels */}
        <View style={styles.bottomControlsCluster} pointerEvents="box-none">
          
          {/* Primary Action Row Controllers */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleDeletePress} activeOpacity={0.7}>
              <View style={styles.deleteIconContainer}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#ff4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleAddPress}>
              <View style={styles.addIcon}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 5v14M5 12h14" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <Text style={styles.actionButtonTextPrimary}>Add</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleTrim}>
              <View style={[styles.trimIconContainer, showTrimHandles && styles.trimIconContainerActive]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M3 12h18M9 6l-6 6 6 6M15 6l6 6-6 6" stroke={showTrimHandles ? "#ec9a15" : "#888888"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <Text style={[styles.actionButtonText, showTrimHandles && { color: "#ec9a15" }]}>Trim</Text>
            </TouchableOpacity>
          </View>

          {/* 🎞️ FIXED TRIM TIMELINE PANEL */}
          {showTrimHandles && isVideo && (
            <View style={styles.trimAdjusterContainer}>
              <View style={styles.trimInfoRow}>
                <Text style={styles.trimTimeText}>Trim Start: {formatTime(trimStart)}</Text>
                <Text style={styles.trimTimeText}>Trim End: {formatTime(trimEnd)}</Text>
              </View>
              <View style={styles.trimButtonsRow}>
                <View style={styles.trimGroup}>
                  <TouchableOpacity 
                    style={styles.trimAdjustButton} 
                    onPress={() => {
                      const newStart = Math.max(0, trimStart - 0.5);
                      setTrimStart(newStart);
                      setCurrentTime(newStart);
                      videoRef.current?.setPositionAsync(newStart * 1000).catch(console.warn);
                      onClipUpdate?.({ ...clip, trimStart: newStart, trimEnd });
                    }}
                  >
                    <Text style={styles.trimAdjustButtonText}>-0.5s</Text>
                  </TouchableOpacity>
                  <Text style={styles.trimGroupLabel}>Start Point</Text>
                  <TouchableOpacity 
                    style={styles.trimAdjustButton} 
                    onPress={() => {
                      const newStart = Math.min(trimEnd - 1, trimStart + 0.5);
                      setTrimStart(newStart);
                      setCurrentTime(newStart);
                      videoRef.current?.setPositionAsync(newStart * 1000).catch(console.warn);
                      onClipUpdate?.({ ...clip, trimStart: newStart, trimEnd });
                    }}
                  >
                    <Text style={styles.trimAdjustButtonText}>+0.5s</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.trimGroup}>
                  <TouchableOpacity 
                    style={styles.trimAdjustButton} 
                    onPress={() => {
                      const newEnd = Math.max(trimStart + 1, trimEnd - 0.5);
                      setTrimEnd(newEnd);
                      setCurrentTime(newEnd);
                      videoRef.current?.setPositionAsync(newEnd * 1000).catch(console.warn);
                      onClipUpdate?.({ ...clip, trimStart, trimEnd: newEnd });
                    }}
                  >
                    <Text style={styles.trimAdjustButtonText}>-0.5s</Text>
                  </TouchableOpacity>
                  <Text style={styles.trimGroupLabel}>End Point</Text>
                  <TouchableOpacity 
                    style={styles.trimAdjustButton} 
                    onPress={() => {
                      const newEnd = Math.min(duration, trimEnd + 0.5);
                      setTrimEnd(newEnd);
                      setCurrentTime(newEnd);
                      videoRef.current?.setPositionAsync(newEnd * 1000).catch(console.warn);
                      onClipUpdate?.({ ...clip, trimStart, trimEnd: newEnd });
                    }}
                  >
                    <Text style={styles.trimAdjustButtonText}>+0.5s</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Main Scroller Timeline Track */}
          {isReady && (
            <View style={styles.timelineSection}>
              <View style={styles.timelineControls}>
                <TouchableOpacity
                  style={[styles.timelineControl, !canUndo && styles.timelineControlDisabled]}
                  onPress={onUndo}
                  disabled={!canUndo}
                  activeOpacity={canUndo ? 0.7 : 1}
                >
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <Path d="M3 7v6h6M3 7l6-6M3 7l6 6" stroke={canUndo ? "#888888" : "#444444"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </TouchableOpacity>

                {isVideo ? (
                  <TouchableOpacity style={styles.playButtonBottom} onPress={togglePlayPause}>
                    {isPlaying ? (
                      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                        <Path d="M10 4H6v16h4V4zM18 4h-4v16h4V4z" fill="#ffffff" />
                      </Svg>
                    ) : (
                      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                        <Path d="M8 5v14l11-7L8 5z" fill="#ffffff" />
                      </Svg>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.playButtonBottom} />
                )}

                <TouchableOpacity
                  style={[styles.timelineControl, !canRedo && styles.timelineControlDisabled]}
                  onPress={onRedo}
                  disabled={!canRedo}
                  activeOpacity={canRedo ? 0.7 : 1}
                >
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <Path d="M21 7v6h-6M21 7l-6-6M21 7l-6 6" stroke={canRedo ? "#888888" : "#444444"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </TouchableOpacity>
              </View>

              {isVideo && duration > 0 && (
                <Animated.View style={[styles.timelineWrapper, timelineAnimatedStyle]}>
                  <Animated.ScrollView
                    ref={scrollViewRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}
                    onScroll={handleScroll}
                    onScrollBeginDrag={handleScrollBegin}
                    onScrollEndDrag={handleScrollEnd}
                    onMomentumScrollEnd={handleScrollEnd}
                    contentContainerStyle={[styles.timelineContent, { width: totalWidth + SCREEN_WIDTH }]}
                  >
                    <View style={styles.timelineTrack}>
                      <View style={{ width: SCREEN_WIDTH / 2 }} />

                      {frames.map((frame, index) => {
                        const isActive = currentTime >= frame.time && currentTime < frame.time + duration / frames.length;
                        return (
                          <View key={frame.id} style={styles.frame}>
                            <View style={[styles.frameContent, isActive && styles.frameContentActive]}>
                              {index % 3 === 0 && <View style={styles.frameThumbnail} />}
                              {index % 10 === 0 && <Text style={styles.frameTime}>{formatTime(frame.time)}</Text>}
                            </View>
                            {isActive && <View style={styles.frameActiveIndicator} />}
                          </View>
                        );
                      })}

                      <View style={{ width: SCREEN_WIDTH / 2 }} />
                    </View>
                  </Animated.ScrollView>

                  <View style={styles.centerIndicator}>
                    <View style={styles.centerLine} />
                  </View>
                </Animated.View>
              )}

              {isVideo && (
                <View style={styles.speedControls}>
                  {[0.5, 1, 2, 3, 5].map((speed) => (
                    <TouchableOpacity
                      key={speed}
                      style={[styles.speedButton, selectedSpeed === speed && styles.speedButtonActive]}
                      onPress={() => handleSpeedChange(speed)}
                    >
                      <Text style={[styles.speedButtonText, selectedSpeed === speed && styles.speedButtonTextActive]}>
                        {speedLabels[speed]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Action Tray Bottom Icons */}
          {isReady && (
            <PreviewActionButtons
              displayUri={clip.uri}
              onFilter={handleFilter}
              onOverlay={handleOverlay}
              onText={handleText}
              onSticker={handleSticker}
              onMusic={handleMusic} // Linked perfectly to choice sheet launcher function
              onVoiceAdd={(voice) => {
                const updatedClip = { ...clip, voiceOverlays: [...(clip.voiceOverlays || []), voice] };
                onClipUpdate?.(updatedClip);
              }}
              onSoundFXAdd={(sound) => {
                const updatedClip = { ...clip, soundEffects: [...(clip.soundEffects || []), sound] };
                onClipUpdate?.(updatedClip);
              }}
              onCaptionAdd={(caption) => {
                const updatedClip = { ...clip, captions: [...(clip.captions || []), caption] };
                onClipUpdate?.(updatedClip);
              }}
              onAdjustChange={(settings) => {
                const updatedClip = { ...clip, adjustSettings: settings };
                onClipUpdate?.(updatedClip);
              }}
              onCutoutAdd={(cutout) => {
                const updatedClip = { ...clip, cutouts: [...(clip.cutouts || []), cutout] };
                onClipUpdate?.(updatedClip);
              }}
              onLinkAdd={(link) => {
                const updatedClip = { ...clip, links: [...(clip.links || []), link] };
                onClipUpdate?.(updatedClip);
              }}
              onPaste={(content) => {
                const textOverlay = {
                  id: `text-${Date.now()}`,
                  text: content,
                  x: 0.5,
                  y: 0.5,
                  fontSize: 24,
                  fontWeight: "600",
                  color: "#ffffff",
                  textAlign: "center" as const,
                  opacity: 1,
                };
                const updatedClip = { ...clip, textOverlays: [...(clip.textOverlays || []), textOverlay] };
                onClipUpdate?.(updatedClip);
              }}
              startTime={currentTime}
            />
          )}
        </View>
      </View>

      {/* 🎵 INSTAGRAM-STYLE MUSIC PICKER BOTTOM SHEET MODAL */}
      <Modal
        visible={showMusicPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMusicPicker(false)}
      >
        <View style={styles.musicPickerOverlay}>
          <TouchableOpacity style={styles.transparentBackdrop} activeOpacity={1} onPress={() => setShowMusicPicker(false)} />
          
          <View style={styles.musicPickerContainer}>
            <View style={styles.sheetNotch} />
            
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Choose Music</Text>
              <TouchableOpacity onPress={() => setShowMusicPicker(false)}>
                <Text style={{ color: '#aaa', fontSize: 14, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchBarWrapper}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                <Path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="#888" />
              </Svg>
              <Text style={{ color: '#888', fontSize: 13 }}>Search music or artists...</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 16, paddingHorizontal: 20, marginBottom: 12 }}>
              <Text style={{ color: '#ec9a15', fontWeight: '700', fontSize: 13, borderBottomWidth: 2, borderBottomColor: '#ec9a15', paddingBottom: 4 }}>For You</Text>
              <Text style={{ color: '#888', fontWeight: '600', fontSize: 13 }}>Trending</Text>
              <Text style={{ color: '#888', fontWeight: '600', fontSize: 13 }}>Saved</Text>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
              {TRENDING_TRACKS.map((track) => (
                <TouchableOpacity
                  key={track.id}
                  style={styles.trackItemRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedTrackName(track.title); 
                    setShowMusicPicker(false);        
                    setShowMusicAdjuster(true);       // Automatically triggers Trimmer adjustment pane open
                  }}
                >
                  <View style={styles.albumArtPlaceholder}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="#ec9a15" />
                    </Svg>
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{track.title}</Text>
                    <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{track.artist} • {track.views}</Text>
                  </View>

                  <View style={styles.trackPlayPreviewButton}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path d="M8 5v14l11-7z" fill="#fff" />
                    </Svg>
                  </View>
                </TouchableOpacity>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🎵 INSTAGRAM STYLE MUSIC SLIDER OVERLAY SHEET */}
      {showMusicAdjuster && (
        <View style={styles.musicAdjusterModal}>
          <View style={styles.musicHeader}>
            <Text style={styles.musicTitle}>Adjust Audio Track</Text>
            <TouchableOpacity 
              style={styles.musicDoneButton} 
              onPress={() => {
                setShowMusicAdjuster(false);
                onClipUpdate?.({
                  ...clip,
                  musicOffset: musicOffset
                });
              }}
            >
              <Text style={styles.musicDoneText}>Done</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.trackNameDisplay}>🎵 {selectedTrackName}</Text>

          <View style={styles.waveformWrapper}>
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const calculatedOffset = Math.floor(offsetX / 10); 
                
                // Active threshold check protecting performance depth values
                if(musicOffset !== calculatedOffset) {
                  setMusicOffset(calculatedOffset);
                }
              }}
              contentContainerStyle={{ paddingHorizontal: SCREEN_WIDTH / 2 - 20 }}
            >
              {Array.from({ length: 60 }).map((_, i) => (
                <View key={i} style={styles.waveContainer}>
                  <View style={[styles.waveBar, { height: 15 + Math.sin(i) * 20 }]} />
                  {i % 5 === 0 && <Text style={styles.waveTimeLabel}>0:{i.toString().padStart(2, '0')}</Text>}
                </View>
              ))}
            </Animated.ScrollView>
            <View style={styles.musicCenterIndicator} />
          </View>
          <Text style={styles.musicStatusText}>Music loops from: 0:{musicOffset.toString().padStart(2, '0')}</Text>
        </View>
      )}

      <AddClipOverlay visible={showAddClipOverlay} onClose={() => setShowAddClipOverlay(false)} onSelectCamera={handleSelectCamera} onSelectGallery={handleSelectGallery} />
      <DeleteConfirmationModal visible={showDeleteModal} onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel} clipType={clip.type} />
      <TextEditorModal visible={showTextEditor} overlay={selectedTextOverlay} onSave={handleTextOverlaySave} onDelete={handleTextOverlayDelete} onClose={handleTextEditorClose} containerWidth={previewDimensions.width} containerHeight={previewDimensions.height} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  /* 🎥 MAXIMUM IMMERSIVE PREVIEW VIEW STYLES BOUNDS */
  fullScreenPreviewContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  mediaFullScreen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  /* 🎛️ FLOATING LAYER PACKETS */
  floatingControlsContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    justifyContent: "space-between",
  },
  bottomControlsCluster: {
    width: "100%",
    backgroundColor: "transparent",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: "rgba(0, 0, 0, 0.4)", 
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  nextButton: {
    backgroundColor: "#ec9a15",
    paddingHorizontal: 24,
    borderWidth: 0,
    shadowColor: "#ec9a15",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "700",
  },
  mediaInfo: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mediaInfoText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  speedInfoText: {
    color: "#ec9a15",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  playButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  playButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ec9a15",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ec9a15",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 2,
  },
  playButtonRing: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: "rgba(236, 154, 21, 0.4)",
    zIndex: 1,
  },
  progressBarOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 3,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 100,
  },
  progressBarTrack: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    height: 3,
  },
  progressBarFill: {
    height: 3,
    backgroundColor: "#ec9a15",
  },
  timeDisplay: {
    position: "absolute",
    bottom: 260, 
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  timeDisplayInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timeTextCurrent: {
    color: "#ec9a15",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  timeSeparator: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 8,
  },
  timeTextTotal: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(10, 10, 10, 0.75)", 
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  actionButton: {
    alignItems: "center",
    gap: 4,
  },
  deleteIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 68, 68, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#ff4444",
    fontSize: 10,
    fontWeight: "600",
  },
  actionButtonPrimary: {
    alignItems: "center",
  },
  addIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "500",
  },
  actionButtonTextPrimary: {
    color: "#7C3AED",
    fontSize: 10,
    fontWeight: "600",
  },
  trimIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  trimIconContainerActive: {
    backgroundColor: "rgba(236, 154, 21, 0.3)",
  },
  timelineSection: {
    backgroundColor: "rgba(10, 10, 10, 0.85)",
    paddingVertical: 10,
  },
  timelineControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 50,
    marginBottom: 8,
  },
  timelineControl: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  timelineControlDisabled: {
    opacity: 0.3,
  },
  playButtonBottom: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ec9a15",
    justifyContent: "center",
    alignItems: "center",
  },
  timelineWrapper: {
    height: 60,
    marginBottom: 8,
  },
  timelineContent: {
    paddingVertical: 6,
  },
  timelineTrack: {
    flexDirection: "row",
    height: FRAME_HEIGHT,
  },
  frame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    marginRight: 2,
  },
  frameContent: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  frameContentActive: {
    borderColor: "#ffffff",
    borderWidth: 2,
  },
  frameThumbnail: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#2a2a2a",
    opacity: 0.2,
  },
  frameActiveIndicator: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: 3,
    backgroundColor: "#ec9a15",
  },
  frameTime: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 8,
    fontFamily: "monospace",
  },
  centerIndicator: {
    position: "absolute",
    left: SCREEN_WIDTH / 2,
    top: 0,
    width: 2,
    height: FRAME_HEIGHT,
    zIndex: 20,
  },
  centerLine: {
    width: 2,
    height: FRAME_HEIGHT,
    backgroundColor: "#ec9a15",
  },
  speedControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 4,
  },
  speedButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    minWidth: 55,
    alignItems: "center",
  },
  speedButtonActive: {
    backgroundColor: "#ec9a15",
  },
  speedButtonText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "700",
  },
  speedButtonTextActive: {
    color: "#000000",
  },
  trimAdjusterContainer: {
    backgroundColor: "rgba(18, 18, 18, 0.9)",
    padding: 12,
  },
  trimInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  trimTimeText: {
    color: "#ec9a15",
    fontSize: 12,
    fontWeight: "600",
  },
  trimButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  trimGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trimGroupLabel: {
    color: "#ffffff",
    fontSize: 11,
  },
  trimAdjustButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trimAdjustButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  /* 🎵 INSTAGRAM STYLE MUSIC PICKER UI MATRICES */
  musicPickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  transparentBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  musicPickerContainer: {
    backgroundColor: "#161616",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "70%",
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  sheetNotch: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  pickerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  trackItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  albumArtPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  trackPlayPreviewButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  musicAdjusterModal: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(10, 10, 10, 0.98)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 40,
    paddingHorizontal: 16,
    zIndex: 999,
  },
  musicHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  musicTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  musicDoneButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  musicDoneText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  trackNameDisplay: {
    color: "#ec9a15",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  waveformWrapper: {
    height: 80,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    overflow: "hidden",
  },
  waveContainer: {
    width: 6,
    marginHorizontal: 2,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  waveBar: {
    width: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 2,
  },
  waveTimeLabel: {
    position: "absolute",
    bottom: 4,
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 8,
  },
  musicCenterIndicator: {
    position: "absolute",
    width: 4,
    height: 50,
    backgroundColor: "#ec9a15",
    borderRadius: 2,
    zIndex: 10,
  },
  musicStatusText: {
    color: "#888888",
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },
});

export default ModernPreviewEditor;