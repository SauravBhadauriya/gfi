import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Dimensions, StyleSheet, View, Text } from 'react-native';
import Animated, {
  useAnimatedRef,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import type { CameraClip } from '../../types/camera.types';
import {
  calculateTimelinePositions,
  getTotalTimelineDuration,
} from '../../utils/timelineHelpers';
import TimelineClip from './TimelineClip';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_TRACK_HEIGHT = 60;
const LAYER_TRACK_HEIGHT = 36;
const PIXELS_PER_SECOND = 60; // 60 pixels per second of video for smooth scaling

interface MultiClipTimelineProps {
  clips: CameraClip[];
  currentTime: number;
  selectedClipId?: string;
  thumbnails?: Map<string, string>;
  onClipPress?: (clip: CameraClip) => void;
  onTrimStart?: (clip: CameraClip, newTrimStart: number) => void;
  onTrimEnd?: (clip: CameraClip, newTrimEnd: number) => void;
  onClipReorder?: (fromIndex: number, toIndex: number) => void;
  onTimelineSeek?: (time: number) => void;
  onScroll?: (scrollX: number) => void;
}

/**
 * CapCut / VN Style Multi-Track Timeline Editor
 * Automatically generates Text, Voice, and Music layers above the main video track
 */
const MultiClipTimeline: React.FC<MultiClipTimelineProps> = ({
  clips,
  currentTime,
  selectedClipId,
  thumbnails = new Map(),
  onClipPress,
  onTrimStart,
  onTrimEnd,
  onClipReorder,
  onTimelineSeek,
  onScroll,
}) => {
  const animatedScrollRef = useAnimatedRef<Animated.ScrollView>();
  const playheadPosition = useSharedValue(0);

  const isDraggingClip = useRef(false);
  const draggedClipIndex = useRef<number | null>(null);
  const [dragPreviewX, setDragPreviewX] = useState<number | null>(null);
  const lastScrollTimeRef = useRef(0);

  // 📈 Calculate master timeline positions
  const positionedClips = useMemo(() => calculateTimelinePositions(clips), [clips]);
  const totalDuration = useMemo(() => getTotalTimelineDuration(clips), [clips]);
  const totalWidth = totalDuration * PIXELS_PER_SECOND;

  // 🚀 EXTRACT MULTI-TRACK LAYERS FROM CLIPS
  const { textBlocks, voiceBlocks, musicBlocks } = useMemo(() => {
    const texts: any[] = [];
    const voices: any[] = [];
    const musics: any[] = [];

    positionedClips.forEach((clip) => {
      const clipStart = clip.timelineStart ?? 0;
      const clipDuration = (clip.timelineEnd ?? 0) - clipStart;

      // Extract Text Overlays
      (clip.textOverlays || []).forEach((txt, idx) => {
        texts.push({
          id: txt.id || `text-${clip.id}-${idx}`,
          text: txt.text || "Text",
          start: clipStart,
          duration: clipDuration, // Currently bounding to clip length
        });
      });

      // Extract Voiceovers
      (clip.voiceOverlays || []).forEach((voice, idx) => {
        voices.push({
          id: voice.id || `voice-${clip.id}-${idx}`,
          name: voice.name || `Voiceover ${idx + 1}`,
          start: clipStart,
          duration: voice.duration || clipDuration,
        });
      });

      // Extract Music / SoundFX
      (clip.soundEffects || []).forEach((snd, idx) => {
        musics.push({
          id: snd.id || `music-${clip.id}-${idx}`,
          name: snd.name || `Audio ${idx + 1}`,
          start: clipStart,
          duration: snd.duration || clipDuration,
        });
      });
    });

    return { textBlocks: texts, voiceBlocks: voices, musicBlocks: musics };
  }, [positionedClips]);

  // ⚡ Sync JS State to UI Thread Scroll Position
  useEffect(() => {
    const targetPosition = currentTime * PIXELS_PER_SECOND;
    playheadPosition.value = targetPosition;

    if (!isDraggingClip.current && animatedScrollRef.current) {
      const now = Date.now();
      if (now - lastScrollTimeRef.current > 16) {
        lastScrollTimeRef.current = now;
        const scrollX = Math.max(0, targetPosition - SCREEN_WIDTH / 2);
        animatedScrollRef.current.scrollTo({ x: scrollX, y: 0, animated: false });
      }
    }
  }, [currentTime, playheadPosition, animatedScrollRef]);

  // Drag & Drop Handlers (Original Logic kept intact)
  const handleClipDragStart = useCallback((clip: CameraClip) => {
    const index = clips.findIndex((c) => c.id === clip.id);
    if (index === -1) return;
    isDraggingClip.current = true;
    draggedClipIndex.current = index;
  }, [clips]);

  const handleClipDrag = useCallback((clip: CameraClip, pageX: number) => {
    if (draggedClipIndex.current === null) return;
    setDragPreviewX(pageX);
  }, []);

  const handleClipDragEnd = useCallback((clip: CameraClip) => {
    if (draggedClipIndex.current === null) return;
    const fromIndex = draggedClipIndex.current;
    
    if (dragPreviewX !== null && animatedScrollRef.current) {
      const targetTime = dragPreviewX / PIXELS_PER_SECOND;
      const targetIndex = positionedClips.findIndex(
        (c) => targetTime >= (c.timelineStart ?? 0) && targetTime < (c.timelineEnd ?? 0)
      );
      if (targetIndex !== -1 && targetIndex !== fromIndex) {
        onClipReorder?.(fromIndex, targetIndex);
      }
    }
    isDraggingClip.current = false;
    draggedClipIndex.current = null;
    setDragPreviewX(null);
  }, [dragPreviewX, positionedClips, onClipReorder, animatedScrollRef]);

  const handleScroll = useCallback((event: any) => {
    const scrollX = event.nativeEvent.contentOffset?.x || 0;
    onScroll?.(scrollX);
  }, [onScroll]);

  const handleTimelinePress = useCallback((event: any) => {
    if (isDraggingClip.current) return;
    const { locationX } = event.nativeEvent;
    const time = Math.max(0, (locationX - SCREEN_WIDTH / 2) / PIXELS_PER_SECOND);
    onTimelineSeek?.(Math.max(0, Math.min(time, totalDuration)));
  }, [totalDuration, onTimelineSeek]);

  // Fake waveform renderer for audio tracks
  const renderWaveform = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.3, overflow: 'hidden', marginLeft: 'auto', marginRight: 8 }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <View key={i} style={{ width: 2, height: 8 + Math.random() * 12, backgroundColor: '#fff', marginHorizontal: 1, borderRadius: 2 }} />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={animatedScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={[
          styles.timelineContent,
          { width: Math.max(totalWidth + SCREEN_WIDTH, SCREEN_WIDTH) },
        ]}
        onTouchEnd={handleTimelinePress}
      >
        <View style={styles.multiTrackContainer}>

          {/* 🟪 TRACK 1: Text Layers */}
          {textBlocks.length > 0 && (
            <View style={styles.trackRow}>
              {textBlocks.map((block) => (
                <View
                  key={block.id}
                  style={[styles.layerBlock, styles.textBlock, { left: SCREEN_WIDTH / 2 + block.start * PIXELS_PER_SECOND, width: block.duration * PIXELS_PER_SECOND }]}
                >
                  <Text style={styles.layerText} numberOfLines={1}>T  {block.text}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 🟪 TRACK 2: Voiceover Layers */}
          {voiceBlocks.length > 0 && (
            <View style={styles.trackRow}>
              {voiceBlocks.map((block) => (
                <View
                  key={block.id}
                  style={[styles.layerBlock, styles.voiceBlock, { left: SCREEN_WIDTH / 2 + block.start * PIXELS_PER_SECOND, width: block.duration * PIXELS_PER_SECOND }]}
                >
                  <Text style={styles.layerText} numberOfLines={1}>🎙️ {block.name}</Text>
                  {renderWaveform()}
                </View>
              ))}
            </View>
          )}

          {/* 🟪 TRACK 3: Music Layers */}
          {musicBlocks.length > 0 && (
            <View style={styles.trackRow}>
              {musicBlocks.map((block) => (
                <View
                  key={block.id}
                  style={[styles.layerBlock, styles.musicBlock, { left: SCREEN_WIDTH / 2 + block.start * PIXELS_PER_SECOND, width: block.duration * PIXELS_PER_SECOND }]}
                >
                  <Text style={styles.layerText} numberOfLines={1}>🎵 {block.name}</Text>
                  {renderWaveform()}
                </View>
              ))}
            </View>
          )}

          {/* 🎬 MAIN TRACK: Video Clips (Bottom Most) */}
          <View style={styles.videoTrackRow}>
            {/* Center Playhead Left Padding Offset */}
            <View style={{ width: SCREEN_WIDTH / 2 }} />

            {positionedClips.map((clip) => {
              const start = clip.timelineStart ?? 0;
              const end = clip.timelineEnd ?? 0;
              const clipWidth = (end - start) * PIXELS_PER_SECOND;
              const thumbnailUri = thumbnails.get(clip.id);

              return (
                <TimelineClip
                  key={clip.id}
                  clip={clip}
                  width={clipWidth}
                  thumbnailUri={thumbnailUri}
                  isSelected={clip.id === selectedClipId}
                  pixelsPerSecond={PIXELS_PER_SECOND}
                  onPress={onClipPress}
                  onTrimStart={onTrimStart}
                  onTrimEnd={onTrimEnd}
                  onDragStart={handleClipDragStart}
                  onDrag={handleClipDrag}
                  onDragEnd={handleClipDragEnd}
                />
              );
            })}

            {/* Right Padding Offset */}
            <View style={{ width: SCREEN_WIDTH / 2 }} />
          </View>
          
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111', // Matches the timeline area background
    position: 'relative',
  },
  timelineContent: {
    paddingVertical: 10,
    justifyContent: 'flex-end', // Pushes all tracks to stick together nicely
  },
  multiTrackContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    gap: 4, // Spacing between tracks
    height: '100%',
  },
  trackRow: {
    height: LAYER_TRACK_HEIGHT,
    position: 'relative',
    width: '100%',
  },
  videoTrackRow: {
    height: VIDEO_TRACK_HEIGHT,
    flexDirection: 'row',
    marginTop: 6,
  },
  layerBlock: {
    position: 'absolute',
    height: '100%',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  layerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
  
  /* CapCut / VN Exact Style Colors */
  textBlock: {
    backgroundColor: '#8B5CF6', // Purple for Text
  },
  voiceBlock: {
    backgroundColor: '#D946EF', // Magenta for Voiceovers
  },
  musicBlock: {
    backgroundColor: '#C026D3', // Pink for Audio/Music
  }
});

export default MultiClipTimeline;