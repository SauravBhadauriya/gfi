import { Video } from 'expo-video';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import type { FilterConfig } from '../types/filters';
import { getFilterOverlayFromProperties } from '../utils/filterOverlays';

interface FilteredVideoProps {
  source: { uri: string };
  style?: ViewStyle;
  resizeMode?: 'contain' | 'cover' | 'fill';
  shouldPlay?: boolean;
  isLooping?: boolean;
  rate?: number;
  onLoad?: (status: any) => void;
  onPlaybackStatusUpdate?: (status: any) => void;
  progressUpdateIntervalMillis?: number;
  filter?: FilterConfig;
  videoRef?: React.RefObject<Video | null>;
}

/**
 * Video component with filter preview overlay
 * 
 * NOTE: expo-av Video doesn't support native visual filters.
 * This component uses View overlays with blend modes and opacity to simulate
 * filter effects for real-time preview. Filters are still applied properly
 * at export time using FFmpeg.
 */
const FilteredVideo: React.FC<FilteredVideoProps> = ({
  source,
  style,
  resizeMode = 'contain',
  shouldPlay = false,
  isLooping = false,
  rate = 1,
  onLoad,
  onPlaybackStatusUpdate,
  progressUpdateIntervalMillis,
  filter,
  videoRef,
}) => {
  console.log('🎥 FilteredVideo: Rendering with source:', source?.uri?.substring(0, 50), 'style:', style);
  
  const filterOverlayStyle = getFilterOverlayFromProperties(filter || { name: 'Original' });

  // Apply brightness/contrast adjustments using opacity overlay
  const getBrightnessOverlay = (): ViewStyle | null => {
    if (!filter) return null;

    const brightness = filter.brightness || 0;

    // Brightness adjustment
    if (brightness !== 0) {
      const brightnessOverlay: ViewStyle = {
        ...StyleSheet.absoluteFillObject,
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
    <View style={style} onLayout={(e) => {
      const { width, height } = e.nativeEvent.layout;
      console.log('🎥 FilteredVideo: Container layout:', { width, height });
    }}>
      <Video
        ref={videoRef as React.RefObject<Video>}
        style={StyleSheet.absoluteFill}
        source={source}
        useNativeControls={false}
        resizeMode={resizeMode}
        shouldPlay={shouldPlay}
        isLooping={isLooping}
        rate={rate}
        onLoad={(status) => {
          console.log('🎥 FilteredVideo: Video onLoad triggered', status?.isLoaded);
          onLoad?.(status);
        }}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        progressUpdateIntervalMillis={progressUpdateIntervalMillis || 100}
        // Performance optimizations
        usePoster={false}
        posterSource={undefined}
        // Reduce memory usage
        positionMillis={undefined}
        // Enable hardware acceleration
        allowsExternalPlayback={false}
        staysActiveInBackground={false}
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
