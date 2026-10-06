import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  runOnJS, 
  withSpring,
  withTiming
} from 'react-native-reanimated';
import type { CameraClip } from '../../types/camera.types';

interface TimelineClipProps {
  clip: CameraClip;
  width: number;
  thumbnailUri?: string; // 🚀 Added from parent
  isSelected: boolean;
  pixelsPerSecond: number;
  onPress?: (clip: CameraClip) => void;
  onTrimStart?: (clip: CameraClip, newStart: number) => void;
  onTrimEnd?: (clip: CameraClip, newEnd: number) => void;
  onDragStart?: (clip: CameraClip) => void; // 🚀 For Reordering
  onDrag?: (clip: CameraClip, pageX: number) => void; // 🚀 For Reordering
  onDragEnd?: (clip: CameraClip) => void; // 🚀 For Reordering
}

const HANDLE_WIDTH = 16;

const TimelineClip: React.FC<TimelineClipProps> = ({
  clip,
  width,
  thumbnailUri,
  isSelected,
  pixelsPerSecond,
  onPress,
  onTrimStart,
  onTrimEnd,
  onDragStart,
  onDrag,
  onDragEnd
}) => {
  // ⚡ Speed Configuration
  const speedConfig = clip.speedConfig || { type: 'constant', value: 1 };
  const speedValue = speedConfig.type === 'constant' ? (speedConfig.value ?? 1) : 1;

  // ⚡ Reanimated Values for Smooth Real-time Trimming
  const leftTrimOffset = useSharedValue(0);
  const rightTrimOffset = useSharedValue(0);
  const isDraggingState = useSharedValue(false);

  // --- GESTURES ---

  // 1. Tap to Select
  const tapGesture = Gesture.Tap().onEnd(() => {
    if (onPress) runOnJS(onPress)(clip);
  });

  // 2. Long Press to Reorder (Drag & Drop)
  const longPressDragGesture = Gesture.Pan()
    .activateAfterLongPress(250) // Wait 250ms before allowing drag (Instagram style)
    .onStart(() => {
      isDraggingState.value = true;
      if (onDragStart) runOnJS(onDragStart)(clip);
    })
    .onUpdate((e) => {
      if (onDrag) runOnJS(onDrag)(clip, e.absoluteX);
    })
    .onEnd(() => {
      isDraggingState.value = false;
      if (onDragEnd) runOnJS(onDragEnd)(clip);
    });

  // Combine Tap and LongPress
  const clipGestures = Gesture.Simultaneous(tapGesture, longPressDragGesture);

  // 3. Left Handle Drag (Trim Start)
  const leftTrimDrag = Gesture.Pan()
    .onUpdate((e) => {
      // Real-time UI update (constrained so it doesn't cross the right side)
      leftTrimOffset.value = Math.max(0, Math.min(e.translationX, width - HANDLE_WIDTH * 2));
    })
    .onEnd((e) => {
      const translation = leftTrimOffset.value;
      leftTrimOffset.value = withTiming(0, { duration: 100 }); // Snap back to 0 as parent updates width

      if (!onTrimStart) return;
      const timeDelta = (translation / pixelsPerSecond) * speedValue;
      const currentStart = clip.trimStart ?? 0;
      const newStart = Math.max(0, currentStart + timeDelta);
      
      const limitEnd = clip.trimEnd ?? clip.duration;
      if (newStart < limitEnd) {
        runOnJS(onTrimStart)(clip, newStart);
      }
    });

  // 4. Right Handle Drag (Trim End)
  const rightTrimDrag = Gesture.Pan()
    .onUpdate((e) => {
      // Negative translation because dragging left shrinks the clip
      rightTrimOffset.value = Math.min(0, Math.max(e.translationX, -(width - HANDLE_WIDTH * 2)));
    })
    .onEnd((e) => {
      const translation = rightTrimOffset.value;
      rightTrimOffset.value = withTiming(0, { duration: 100 });

      if (!onTrimEnd) return;
      const timeDelta = (translation / pixelsPerSecond) * speedValue;
      const currentEnd = clip.trimEnd ?? clip.duration ?? 0;
      const newEnd = Math.min(clip.duration ?? currentEnd, currentEnd + timeDelta);
      
      const limitStart = clip.trimStart ?? 0;
      if (newEnd > limitStart) {
        runOnJS(onTrimEnd)(clip, newEnd);
      }
    });

  // --- ANIMATED STYLES ---

  // Main Clip Container Style (Squeezes during trim, pops out during reorder)
  const animatedClipStyle = useAnimatedStyle(() => {
    return {
      marginLeft: leftTrimOffset.value,
      marginRight: -rightTrimOffset.value,
      width: width - leftTrimOffset.value + rightTrimOffset.value,
      transform: [
        { scale: withSpring(isDraggingState.value ? 1.05 : 1) } // Pops out slightly when drag-and-dropping
      ],
      opacity: isDraggingState.value ? 0.8 : 1,
      zIndex: isDraggingState.value ? 100 : 1,
    };
  });

  return (
    <GestureDetector gesture={clipGestures}>
      <Animated.View style={[styles.clipContainer, animatedClipStyle]}>
        
        {/* Background Thumbnail or Fallback */}
        {thumbnailUri ? (
          <Image 
            source={{ uri: thumbnailUri }} 
            style={styles.thumbnail} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.fallbackBackground}>
            <Text style={styles.clipText} numberOfLines={1}>
              {clip.type === 'video' ? `Vid (${speedValue}x)` : 'Photo'}
            </Text>
          </View>
        )}

        {/* Selected Overlay (Thick Borders Top/Bottom) */}
        {isSelected && <View style={styles.selectedOverlay} />}

        {/* Left Trim Handle */}
        {isSelected && clip.type === 'video' && (
          <GestureDetector gesture={leftTrimDrag}>
            <View style={styles.leftHandle}>
               {/* Grip lines */}
               <View style={styles.gripLine} />
            </View>
          </GestureDetector>
        )}

        {/* Right Trim Handle */}
        {isSelected && clip.type === 'video' && (
          <GestureDetector gesture={rightTrimDrag}>
            <View style={styles.rightHandle}>
               <View style={styles.gripLine} />
            </View>
          </GestureDetector>
        )}
        
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  clipContainer: {
    height: 50,
    backgroundColor: '#222',
    borderRadius: 6,
    marginHorizontal: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  fallbackBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clipText: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: '600',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFill,
    borderColor: '#ffffff', // Instagram uses white or yellow borders for active clips
    borderTopWidth: 2,
    borderBottomWidth: 2,
    pointerEvents: 'none', // Allows touches to pass through to handles
  },
  leftHandle: {
    position: 'absolute',
    left: 0,
    width: HANDLE_WIDTH,
    height: '100%',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    zIndex: 10,
  },
  rightHandle: {
    position: 'absolute',
    right: 0,
    width: HANDLE_WIDTH,
    height: '100%',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    zIndex: 10,
  },
  gripLine: {
    width: 2,
    height: 16,
    backgroundColor: '#000000',
    borderRadius: 2,
  }
});

export default TimelineClip;
