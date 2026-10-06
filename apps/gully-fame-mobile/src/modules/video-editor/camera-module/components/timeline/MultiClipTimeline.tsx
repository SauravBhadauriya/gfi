import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Dimensions, StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import Animated, {
  useAnimatedRef,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { CameraClip } from '../../types/camera.types';
import {
  calculateTimelinePositions,
  getTotalTimelineDuration,
} from '../../utils/timelineHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_TRACK_HEIGHT = 56;
const LAYER_TRACK_HEIGHT = 36;
const TRACK_HEADER_WIDTH = 48;
const PIXELS_PER_SECOND = 60;

interface MultiClipTimelineProps {
  clips: CameraClip[];
  currentTime: number;
  selectedClipId?: string;
  selectedMusicTrack?: any;
  thumbnails?: Map<string, string>;
  onClipPress?: (clip: CameraClip) => void;
  onTrimStart?: (clip: CameraClip, newTrimStart: number) => void;
  onTrimEnd?: (clip: CameraClip, newTrimEnd: number) => void;
  onClipReorder?: (fromIndex: number, toIndex: number) => void;
  onTimelineSeek?: (time: number) => void;
  onScroll?: (scrollX: number) => void;
}

const MultiClipTimeline: React.FC<MultiClipTimelineProps> = ({
  clips,
  currentTime,
  selectedClipId,
  selectedMusicTrack,
  thumbnails = new Map(),
  onClipPress,
  onTimelineSeek,
  onScroll,
}) => {
  const animatedScrollRef = useAnimatedRef<Animated.ScrollView>();
  const playheadPosition = useSharedValue(0);
  const isDraggingClip = useRef(false);
  const lastScrollTimeRef = useRef(0);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const positionedClips = useMemo(() => calculateTimelinePositions(clips), [clips]);
  const totalDuration = useMemo(() => getTotalTimelineDuration(clips), [clips]);
  const totalWidth = totalDuration * PIXELS_PER_SECOND;

  // Extract multi-track layers (Adjust, Text, Voice, Music)
  const { textBlocks, voiceBlocks, musicBlocks, adjustBlocks } = useMemo(() => {
    const texts: any[] = [];
    const voices: any[] = [];
    const musics: any[] = [];
    const adjusts: any[] = [];

    // Global selected music track rendering
    if (selectedMusicTrack) {
      musics.push({
        id: selectedMusicTrack._id || selectedMusicTrack.id || 'selected-music',
        name: selectedMusicTrack.title || selectedMusicTrack.name || 'Background Music',
        start: 0,
        duration: totalDuration || 15,
      });
    }

    positionedClips.forEach((clip) => {
      const clipStart = clip.timelineStart ?? 0;
      const clipDuration = (clip.timelineEnd ?? 0) - clipStart;

      if (clip.filterPreset) {
        adjusts.push({
          id: `adjust-${clip.id}`,
          name: clip.filterPreset.name || 'Adjust',
          start: clipStart,
          duration: clipDuration,
        });
      }

      (clip.textOverlays || []).forEach((txt, idx) => {
        texts.push({
          id: txt.id || `text-${clip.id}-${idx}`,
          text: txt.text || 'Text',
          start: clipStart,
          duration: clipDuration,
        });
      });

      (clip.voiceOverlays || []).forEach((voice, idx) => {
        voices.push({
          id: voice.id || `voice-${clip.id}-${idx}`,
          name: voice.name || `Voiceover ${idx + 1}`,
          start: clipStart,
          duration: voice.duration || clipDuration,
        });
      });
    });

    return {
      textBlocks: texts,
      voiceBlocks: voices,
      musicBlocks: musics,
      adjustBlocks: adjusts,
    };
  }, [positionedClips, selectedMusicTrack, totalDuration]);

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

  return (
    <View style={styles.container}>
      {/* Center Playhead Needle */}
      <View style={styles.centerPlayheadContainer} pointerEvents="none">
        <View style={styles.playheadCap} />
        <View style={styles.playheadLine} />
      </View>

      {/* Left Track Control Headers */}
      <View style={styles.trackHeadersColumn} pointerEvents="box-none">
        {adjustBlocks.length > 0 && (
          <View style={styles.headerCell}>
            <Ionicons name="color-filter-outline" size={18} color="#FF5722" />
          </View>
        )}
        {textBlocks.length > 0 && (
          <View style={styles.headerCell}>
            <Ionicons name="text-outline" size={18} color="#8B5CF6" />
          </View>
        )}
        {voiceBlocks.length > 0 && (
          <View style={styles.headerCell}>
            <Ionicons name="mic-outline" size={18} color="#E91E63" />
          </View>
        )}
        {musicBlocks.length > 0 && (
          <View style={styles.headerCell}>
            <Ionicons name="musical-notes-outline" size={18} color="#0284C7" />
          </View>
        )}
        <View style={[styles.headerCell, { height: VIDEO_TRACK_HEIGHT, marginTop: 4 }]}>
          <TouchableOpacity onPress={() => setIsVideoMuted(!isVideoMuted)}>
            <Ionicons
              name={isVideoMuted ? 'volume-mute' : 'volume-high-outline'}
              size={18}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Tracks */}
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

          {/* Orange Track: Adjustments */}
          {adjustBlocks.length > 0 && (
            <View style={styles.trackRow}>
              {adjustBlocks.map((block) => (
                <View
                  key={block.id}
                  style={[
                    styles.layerBlock,
                    styles.adjustBlock,
                    {
                      left: SCREEN_WIDTH / 2 + block.start * PIXELS_PER_SECOND,
                      width: Math.max(block.duration * PIXELS_PER_SECOND, 40),
                    },
                  ]}
                >
                  <Text style={styles.layerText} numberOfLines={1}>🎨 {block.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Purple Track: Text */}
          {textBlocks.length > 0 && (
            <View style={styles.trackRow}>
              {textBlocks.map((block) => (
                <View
                  key={block.id}
                  style={[
                    styles.layerBlock,
                    styles.textBlock,
                    {
                      left: SCREEN_WIDTH / 2 + block.start * PIXELS_PER_SECOND,
                      width: Math.max(block.duration * PIXELS_PER_SECOND, 40),
                    },
                  ]}
                >
                  <Text style={styles.layerText} numberOfLines={1}>T {block.text}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Pink Track: Voiceover */}
          {voiceBlocks.length > 0 && (
            <View style={styles.trackRow}>
              {voiceBlocks.map((block) => (
                <View
                  key={block.id}
                  style={[
                    styles.layerBlock,
                    styles.voiceBlock,
                    {
                      left: SCREEN_WIDTH / 2 + block.start * PIXELS_PER_SECOND,
                      width: Math.max(block.duration * PIXELS_PER_SECOND, 40),
                    },
                  ]}
                >
                  <Text style={styles.layerText} numberOfLines={1}>🎙️ {block.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Blue Track: Selected Music */}
          {musicBlocks.length > 0 && (
            <View style={styles.trackRow}>
              {musicBlocks.map((block) => (
                <View
                  key={block.id}
                  style={[
                    styles.layerBlock,
                    styles.musicBlock,
                    {
                      left: SCREEN_WIDTH / 2 + block.start * PIXELS_PER_SECOND,
                      width: Math.max(block.duration * PIXELS_PER_SECOND, 60),
                    },
                  ]}
                >
                  <Ionicons name="musical-note" size={14} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.layerText} numberOfLines={1}>{block.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Video Strip with Thumbnails */}
          <View style={styles.videoTrackRow}>
            <View style={{ width: SCREEN_WIDTH / 2 }} />

            {positionedClips.map((clip) => {
              const start = clip.timelineStart ?? 0;
              const end = clip.timelineEnd ?? 0;
              const clipWidth = Math.max((end - start) * PIXELS_PER_SECOND, 50);
              const isSelected = clip.id === selectedClipId;
              const thumbUri = thumbnails.get(clip.id) || clip.uri;

              return (
                <TouchableOpacity
                  key={clip.id}
                  activeOpacity={0.8}
                  onPress={() => onClipPress?.(clip)}
                  style={[
                    styles.videoClipTile,
                    { width: clipWidth },
                    isSelected && styles.videoClipTileSelected,
                  ]}
                >
                  {thumbUri ? (
                    <Image source={{ uri: thumbUri }} style={styles.clipThumbnailImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.clipThumbnailPlaceholder}>
                      <Ionicons name="videocam" size={20} color="#666" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

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
    backgroundColor: '#0F0F0F',
    position: 'relative',
  },
  centerPlayheadContainer: {
    position: 'absolute',
    left: SCREEN_WIDTH / 2 - 6,
    top: 0,
    bottom: 0,
    width: 12,
    alignItems: 'center',
    zIndex: 100,
  },
  playheadCap: {
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  playheadLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  trackHeadersColumn: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: TRACK_HEADER_WIDTH,
    backgroundColor: 'rgba(15, 15, 15, 0.9)',
    zIndex: 90,
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerCell: {
    height: LAYER_TRACK_HEIGHT,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContent: {
    paddingVertical: 10,
    justifyContent: 'flex-end',
  },
  multiTrackContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    gap: 4,
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
    marginTop: 4,
  },
  layerBlock: {
    position: 'absolute',
    height: '100%',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  layerText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
  adjustBlock: { backgroundColor: '#FF5722' },
  textBlock: { backgroundColor: '#8B5CF6' },
  voiceBlock: { backgroundColor: '#E91E63' },
  musicBlock: { backgroundColor: '#0284C7' },
  videoClipTile: {
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#222',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 2,
  },
  videoClipTileSelected: {
    borderColor: '#EC9A15',
  },
  clipThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  clipThumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
});

export default MultiClipTimeline;