import React, { useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  LayoutAnimation,
  NativeModules,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import Playhead from "./Playhead";
import VideoTrack from "./VideoTrack";
import OverlayTrack from "./OverlayTrack";
import AudioTrackUI from "./AudioTrackUI";
import TextTrack from "./TextTrack";
import ControlsRow from "./ControlsRow";
import type { Clip, Overlay, AudioTrack, TextItem } from "@/types/editor.types";

const { UIManager } = NativeModules;
UIManager.setLayoutAnimationEnabledExperimental?.(true);

const PX_PER_SECOND = 40;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PLAYHEAD_HEIGHT = 400; // Should span all tracks

interface TimelineContainerProps {
  clips: Clip[];
  overlays: Overlay[];
  audioTracks: AudioTrack[];
  texts: TextItem[];
  currentTime: number;
  isPlaying: boolean;
  selectedItemId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onAddClip: () => void;
  onSelectClip: (clipId: string) => void;
  onDeleteClip: (clipId: string) => void;
  onSelectOverlay: (overlayId: string) => void;
  onDeleteOverlay: (overlayId: string) => void;
  onSelectAudio: (trackId: string) => void;
  onDeleteAudio: (trackId: string) => void;
  onSelectText: (textId: string) => void;
  onDeleteText: (textId: string) => void;
  onPlayPress: () => void;
  onUndoPress: () => void;
  onRedoPress: () => void;
  onTimeChange: (time: number) => void;
}

const TimelineContainer: React.FC<TimelineContainerProps> = ({
  clips,
  overlays,
  audioTracks,
  texts,
  currentTime,
  isPlaying,
  selectedItemId,
  canUndo,
  canRedo,
  onAddClip,
  onSelectClip,
  onDeleteClip,
  onSelectOverlay,
  onDeleteOverlay,
  onSelectAudio,
  onDeleteAudio,
  onSelectText,
  onDeleteText,
  onPlayPress,
  onUndoPress,
  onRedoPress,
  onTimeChange,
}) => {
  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Calculate total duration
  const totalDuration = clips.reduce(
    (sum, clip) => sum + ((clip.trimEnd || clip.duration) - (clip.trimStart || 0)),
    0
  );

  // Reanimated scroll handler
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
    // Update current time based on scroll position
    // This is read by the main component to update playhead
  });

  // Auto-scroll when playing
  useEffect(() => {
    if (isPlaying && scrollViewRef.current) {
      const targetScroll = Math.max(0, currentTime * PX_PER_SECOND - SCREEN_WIDTH / 2);
      scrollViewRef.current.scrollTo({
        x: targetScroll,
        animated: false,
      });
    }
  }, [currentTime, isPlaying]);

  // Animate track appearance/disappearance
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [clips.length, overlays.length, audioTracks.length, texts.length]);

  const hasClips = clips.length > 0;
  const hasOverlays = overlays.length > 0;
  const hasAudio = audioTracks.length > 0;
  const hasTexts = texts.length > 0;

  // Show empty state only if no clips
  if (!hasClips) {
    return (
      <View style={styles.container}>
        <ControlsRow
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={totalDuration}
          canUndo={canUndo}
          canRedo={canRedo}
          onPlayPress={onPlayPress}
          onUndoPress={onUndoPress}
          onRedoPress={onRedoPress}
        />
        <View style={styles.emptyStateContainer}>
          <VideoTrack
            clips={[]}
            selectedClipId={selectedItemId}
            onSelectClip={onSelectClip}
            onDeleteClip={onDeleteClip}
            onAddClip={onAddClip}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ControlsRow
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={totalDuration}
        canUndo={canUndo}
        canRedo={canRedo}
        onPlayPress={onPlayPress}
        onUndoPress={onUndoPress}
        onRedoPress={onRedoPress}
      />

      {/* Timeline area with all tracks */}
      <View style={styles.timelineArea}>
        {/* Overlay track (above video) */}
        {hasOverlays && (
          <OverlayTrack
            overlays={overlays}
            selectedOverlayId={selectedItemId}
            onSelectOverlay={onSelectOverlay}
            onDeleteOverlay={onDeleteOverlay}
          />
        )}

        {/* Video track */}
        <View style={styles.videoTrackWrapper}>
          <Animated.ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={scrollHandler}
            style={styles.timelineScroll}
          >
            <VideoTrack
              clips={clips}
              selectedClipId={selectedItemId}
              onSelectClip={onSelectClip}
              onDeleteClip={onDeleteClip}
              onAddClip={onAddClip}
            />
          </Animated.ScrollView>
          {/* Fixed playhead */}
          <Playhead height={64} />
        </View>

        {/* Audio track */}
        {hasAudio && (
          <AudioTrackUI
            audioTracks={audioTracks}
            selectedTrackId={selectedItemId}
            onSelectTrack={onSelectAudio}
            onDeleteTrack={onDeleteAudio}
          />
        )}

        {/* Text track */}
        {hasTexts && (
          <TextTrack
            texts={texts}
            selectedTextId={selectedItemId}
            onSelectText={onSelectText}
            onDeleteText={onDeleteText}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  timelineArea: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    overflow: "hidden",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  videoTrackWrapper: {
    position: "relative",
    height: 64,
    backgroundColor: "#0a0a0a",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  timelineScroll: {
    flex: 1,
  },
});

export default TimelineContainer;
