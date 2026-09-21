import { VideoView, useVideoPlayer } from "expo-video";
import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import type { FilterConfig } from '../types/filters';
import { getFilterOverlayFromProperties } from '../utils/filterOverlays';

interface FilteredVideoProps {
  source: { uri: string };
  videoRef?: React.RefObject<any>;
  style?: ViewStyle;
  contentFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  shouldPlay?: boolean;
  isLooping?: boolean;
  rate?: number;
  onLoad?: (status: any) => void;
  onPlaybackStatusUpdate?: (status: any) => void;
  progressUpdateIntervalMillis?: number;
  filter?: FilterConfig;
}

/**
 * Video component with filter preview overlay
 * 
 * NOTE: expo-video doesn't support native visual filters natively.
 * This component uses View overlays with blend modes and opacity to simulate
 * filter effects for real-time preview. Filters are still applied properly
 * at export time using FFmpeg.
 */
const FilteredVideo: React.FC<FilteredVideoProps> = ({
  source,
  videoRef,
  style,
  contentFit = 'contain',
  shouldPlay = false,
  isLooping = false,
  rate = 1,
  onLoad,
  onPlaybackStatusUpdate,
  progressUpdateIntervalMillis,
  filter,
}) => {
  console.log('🎥 FilteredVideo: Rendering with source:', source?.uri?.substring(0, 50), 'has videoRef:', !!videoRef);
  
  const filterOverlayStyle = getFilterOverlayFromProperties(filter || { name: 'Original' });

  const player = useVideoPlayer(source, player => ({
    ...player,
    playWhenReady: shouldPlay,
    rate: rate,
    loop: isLooping,
  }));

  // Forward player to ref for parent control
  useEffect(() => {
    if (videoRef) {
      videoRef.current = player;
      console.log('✅ [FilteredVideo] Player forwarded to ref');
    }
  }, [player, videoRef]);

  // Emit load callback
  useEffect(() => {
    if (onLoad && player?.duration) {
      onLoad({ isLoaded: true, duration: player.duration });
    }
  }, [player?.duration, onLoad]);

  // Apply brightness/contrast adjustments using opacity overlay
  const getBrightnessOverlay = (): ViewStyle | null => {
    if (!filter) return null;

    const brightness = filter.brightness || 0;

    // Brightness adjustment
    if (brightness !== 0) {
      const brightnessOverlay: ViewStyle = {
        ...StyleSheet.absoluteFill,
        pointerEvents: 'none',
      };

      if (brightness > 0) {
        // Brighter - white overlay with low opacity
        brightnessOverlay.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        brightnessOverlay.opacity = Math.abs(brightness) * 0.5;
      } else {
        // Darker - black overlay with low opacity
        brightnessOverlay.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        brightnessOverlay.opacity = Math.abs(brightness) * 0.5;
      }

      return brightnessOverlay;
    }

    return null;
  };

  const brightnessOverlayStyle = getBrightnessOverlay();

  return (
    <View style={style}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit={contentFit}
        contentPosition="center"
      />
      
      {/* Filter color overlay - simulates filter effect */}
      {filterOverlayStyle && (
        <View style={filterOverlayStyle} />
      )}
      
      {/* Brightness overlay */}
      {brightnessOverlayStyle && (
        <View style={brightnessOverlayStyle} />
      )}
    </View>
  );
};

export default FilteredVideo;
