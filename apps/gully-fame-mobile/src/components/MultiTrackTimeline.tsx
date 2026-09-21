import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import Svg, { Path, Rect, Circle } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ============================================================================
// TRACK TYPE DEFINITIONS & CONSTANTS
// ============================================================================

export interface TimelineTrack {
  id: string;
  type: "video" | "music" | "text" | "voiceover" | "soundfx" | "adjust" | "filter";
  label: string;
  startTime: number; // seconds
  duration: number; // seconds
  data?: any; // title, artist, text content, etc.
  isMuted?: boolean;
}

export interface MultiTrackTimelineProps {
  tracks: TimelineTrack[];
  videoDuration: number;
  currentTime: number;
  onTrackUpdate: (trackId: string, updates: Partial<TimelineTrack>) => void;
  onTrackDelete: (trackId: string) => void;
  onTrackSelect: (trackId: string) => void;
  selectedTrackId: string | null;
  onPlayheadMove?: (time: number) => void;
}

// Color mapping for track types
const TRACK_COLORS: Record<string, string> = {
  video: "#1a1a1a",
  music: "#EC9A15", // orange theme
  text: "#A78BFA", // purple
  voiceover: "#EC4899", // magenta/pink
  soundfx: "#F59E0B", // amber
  adjust: "#EC9A15", // orange (same as music for consistency with reference)
  filter: "#6366F1", // indigo
};

const PIXELS_PER_SECOND = 60;
const TRACK_HEIGHT = 60;
const TRIM_HANDLE_WIDTH = 8;

// ============================================================================
// MULTITRACK TIMELINE COMPONENT
// ============================================================================

export const MultiTrackTimeline: React.FC<MultiTrackTimelineProps> = ({
  tracks,
  videoDuration,
  currentTime,
  onTrackUpdate,
  onTrackDelete,
  onTrackSelect,
  selectedTrackId,
  onPlayheadMove,
}) => {
  const timelineWidth = videoDuration * PIXELS_PER_SECOND;
  const [selectedActionTrackId, setSelectedActionTrackId] = useState<string | null>(null);

  const playheadX = useSharedValue(currentTime * PIXELS_PER_SECOND);

  React.useEffect(() => {
    playheadX.value = withSpring(currentTime * PIXELS_PER_SECOND);
  }, [currentTime, playheadX]);

  const handleTrackDrag = useCallback(
    (trackId: string, event: PanGestureHandlerEventPayload) => {
      const track = tracks.find((t) => t.id === trackId);
      if (!track) return;

      const deltaX = event.translationX;
      const deltaSeconds = deltaX / PIXELS_PER_SECOND;
      const newStartTime = Math.max(0, track.startTime + deltaSeconds);

      // Ensure track doesn't exceed video duration
      const newEndTime = newStartTime + track.duration;
      if (newEndTime <= videoDuration) {
        onTrackUpdate(trackId, { startTime: newStartTime });
      }
    },
    [tracks, videoDuration, onTrackUpdate]
  );

  const handleLeftTrimDrag = useCallback(
    (trackId: string, event: PanGestureHandlerEventPayload) => {
      const track = tracks.find((t) => t.id === trackId);
      if (!track) return;

      const deltaX = event.translationX;
      const deltaSeconds = deltaX / PIXELS_PER_SECOND;
      const newStartTime = Math.max(0, track.startTime + deltaSeconds);

      // Ensure trimmed start doesn't exceed end
      if (newStartTime < track.startTime + track.duration) {
        const newDuration = track.duration - (newStartTime - track.startTime);
        onTrackUpdate(trackId, { startTime: newStartTime, duration: newDuration });
      }
    },
    [tracks, onTrackUpdate]
  );

  const handleRightTrimDrag = useCallback(
    (trackId: string, event: PanGestureHandlerEventPayload) => {
      const track = tracks.find((t) => t.id === trackId);
      if (!track) return;

      const deltaX = event.translationX;
      const deltaSeconds = deltaX / PIXELS_PER_SECOND;
      const newEndTime = track.startTime + track.duration + deltaSeconds;

      // Ensure trimmed end doesn't go before start and stays within video
      if (newEndTime > track.startTime && newEndTime <= videoDuration) {
        const newDuration = newEndTime - track.startTime;
        onTrackUpdate(trackId, { duration: newDuration });
      }
    },
    [tracks, videoDuration, onTrackUpdate]
  );

  const videoTrack = tracks.find((t) => t.type === "video");
  const audioTracks = tracks.filter((t) => t.type !== "video");

  return (
    <GestureHandlerRootView style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.timelineScroll}
        contentContainerStyle={{ width: Math.max(timelineWidth, SCREEN_WIDTH - 40) }}
      >
        {/* Video track */}
        {videoTrack && (
          <View style={styles.trackRow}>
            <View style={styles.trackLabel}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Rect x="4" y="4" width="16" height="16" stroke="#999" strokeWidth="1.5" />
              </Svg>
              <Text style={styles.trackLabelText}>{videoTrack.label}</Text>
            </View>
            <View style={styles.trackContent}>
              <TrackSegment
                track={videoTrack}
                isSelected={selectedTrackId === videoTrack.id}
                onSelect={onTrackSelect}
                onTrimLeftStart={(evt) => handleLeftTrimDrag(videoTrack.id, evt.nativeEvent)}
                onTrimRightStart={(evt) => handleRightTrimDrag(videoTrack.id, evt.nativeEvent)}
                onDragStart={(evt) => handleTrackDrag(videoTrack.id, evt.nativeEvent)}
              />
            </View>
          </View>
        )}

        {/* Audio and effect tracks */}
        {audioTracks.map((track) => (
          <View key={track.id} style={styles.trackRow}>
            <View style={styles.trackLabel}>
              <TrackTypeIcon type={track.type} />
              <Text style={styles.trackLabelText} numberOfLines={1}>
                {track.label}
              </Text>
            </View>
            <View style={styles.trackContent}>
              <PanGestureHandler
                onGestureEvent={(evt) => handleTrackDrag(track.id, evt.nativeEvent)}
              >
                <Animated.View style={styles.gestureArea}>
                  <TrackSegment
                    track={track}
                    isSelected={selectedTrackId === track.id}
                    onSelect={() => {
                      onTrackSelect(track.id);
                      setSelectedActionTrackId(track.id);
                    }}
                    onTrimLeftStart={(evt) => handleLeftTrimDrag(track.id, evt.nativeEvent)}
                    onTrimRightStart={(evt) => handleRightTrimDrag(track.id, evt.nativeEvent)}
                    onDragStart={(evt) => handleTrackDrag(track.id, evt.nativeEvent)}
                  />
                </Animated.View>
              </PanGestureHandler>
            </View>
          </View>
        ))}

        {/* Playhead */}
        <Animated.View
          style={[
            styles.playhead,
            {
              transform: [{ translateX: playheadX }],
            },
          ]}
        >
          <View style={styles.playheadDot} />
          <View style={styles.playheadLine} />
        </Animated.View>
      </ScrollView>

      {/* Action bar for selected track */}
      {selectedActionTrackId && (
        <TrackActionBar
          trackId={selectedActionTrackId}
          track={tracks.find((t) => t.id === selectedActionTrackId)}
          onDelete={() => {
            onTrackDelete(selectedActionTrackId);
            setSelectedActionTrackId(null);
          }}
          onCopy={() => {
            const track = tracks.find((t) => t.id === selectedActionTrackId);
            if (track) {
              const newTrack: TimelineTrack = {
                ...track,
                id: `${track.id}-copy-${Date.now()}`,
                startTime: track.startTime + track.duration + 0.1,
              };
              onTrackUpdate(newTrack.id, newTrack);
            }
          }}
          onDuplicate={() => {
            const track = tracks.find((t) => t.id === selectedActionTrackId);
            if (track) {
              const newTrack: TimelineTrack = {
                ...track,
                id: `${track.id}-dup-${Date.now()}`,
              };
              onTrackUpdate(newTrack.id, newTrack);
            }
          }}
          onFadeAudio={() => {
            Alert.alert("Fade Audio", "Fade effect will be applied to this audio track");
          }}
          onSlip={() => {
            Alert.alert("Slip", "Trim points shifted without changing position");
          }}
          onEnhance={() => {
            Alert.alert("Enhance", "Enhancement options for this track");
          }}
        />
      )}
    </GestureHandlerRootView>
  );
};

// ============================================================================
// TRACK SEGMENT COMPONENT
// ============================================================================

interface TrackSegmentProps {
  track: TimelineTrack;
  isSelected: boolean;
  onSelect: (trackId: string) => void;
  onTrimLeftStart: (evt: any) => void;
  onTrimRightStart: (evt: any) => void;
  onDragStart: (evt: any) => void;
}

const TrackSegment: React.FC<TrackSegmentProps> = ({
  track,
  isSelected,
  onSelect,
  onTrimLeftStart,
  onTrimRightStart,
  onDragStart,
}) => {
  const segmentX = track.startTime * PIXELS_PER_SECOND;
  const segmentWidth = track.duration * PIXELS_PER_SECOND;
  const backgroundColor = TRACK_COLORS[track.type] || "#999";

  return (
    <View
      style={[
        styles.segment,
        {
          left: segmentX,
          width: segmentWidth,
          backgroundColor,
          borderColor: isSelected ? "#fff" : "transparent",
          borderWidth: isSelected ? 2 : 0,
        },
      ]}
    >
      {/* Left trim handle */}
      <PanGestureHandler onGestureEvent={onTrimLeftStart}>
        <TouchableOpacity
          style={styles.trimHandleLeft}
          activeOpacity={0.7}
          onLongPress={() => onSelect(track.id)}
        >
          <View style={styles.trimHandleIndicator} />
        </TouchableOpacity>
      </PanGestureHandler>

      {/* Main segment content */}
      <PanGestureHandler onGestureEvent={onDragStart}>
        <TouchableOpacity
          style={styles.segmentContent}
          activeOpacity={0.8}
          onPress={() => onSelect(track.id)}
        >
          <Text style={styles.segmentText} numberOfLines={1}>
            {track.label}
          </Text>
        </TouchableOpacity>
      </PanGestureHandler>

      {/* Right trim handle */}
      <PanGestureHandler onGestureEvent={onTrimRightStart}>
        <TouchableOpacity
          style={styles.trimHandleRight}
          activeOpacity={0.7}
          onLongPress={() => onSelect(track.id)}
        >
          <View style={styles.trimHandleIndicator} />
        </TouchableOpacity>
      </PanGestureHandler>
    </View>
  );
};

// ============================================================================
// TRACK ACTION BAR COMPONENT
// ============================================================================

interface TrackActionBarProps {
  trackId: string;
  track?: TimelineTrack;
  onDelete: () => void;
  onCopy: () => void;
  onDuplicate: () => void;
  onFadeAudio: () => void;
  onSlip: () => void;
  onEnhance: () => void;
}

const TrackActionBar: React.FC<TrackActionBarProps> = ({
  track,
  onDelete,
  onCopy,
  onDuplicate,
  onFadeAudio,
  onSlip,
  onEnhance,
}) => {
  if (!track) return null;

  return (
    <View style={styles.actionBar}>
      <TouchableOpacity style={styles.actionButton} onPress={onEnhance}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2L15.09 8.26H22L16.45 12.69L18.54 19H12L6.46 14.57L0.91 19H7.45L9.54 12.69L4 8.26H10.91L12 2Z" fill="#EC9A15" />
        </Svg>
        <Text style={styles.actionLabel}>Enhance</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#FF6B6B" />
        </Svg>
        <Text style={styles.actionLabel}>Delete</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={onFadeAudio}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M3 9V5H5V9H3ZM9 9V5H7V9H9ZM15 9V5H13V9H15ZM21 9V5H19V9H21ZM3 15H21V13H3V15Z" fill="#999" />
        </Svg>
        <Text style={styles.actionLabel}>Fade audio</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={onCopy}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="#999" />
        </Svg>
        <Text style={styles.actionLabel}>Copy</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={onDuplicate}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M13 1H6C4.9 1 4 1.9 4 3V17H6V3H13V1ZM17 5H10C8.9 5 8 5.9 8 7V21C8 22.1 8.9 23 10 23H17C18.1 23 19 22.1 19 21V7C19 5.9 18.1 5 17 5ZM17 21H10V7H17V21Z" fill="#999" />
        </Svg>
        <Text style={styles.actionLabel}>Duplicate</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={onSlip}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M7 14C5.9 14 5 14.9 5 16C5 17.1 5.9 18 7 18C8.1 18 9 17.1 9 16C9 14.9 8.1 14 7 14ZM17 14C15.9 14 15 14.9 15 16C15 17.1 15.9 18 17 18C18.1 18 19 17.1 19 16C19 14.9 18.1 14 17 14ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12 6C9.79 6 8 7.79 8 10H10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 11 13.1 12 12 12H11V14H13C14.65 14 16 12.65 16 11C16 9.35 14.65 8 13 8C12.45 8 11.93 8.13 11.46 8.35C11.13 7.92 10.6 7.61 10 7.61V5.61C10.97 5.2 12.03 5.2 13 5.61V3C11 2 9 3 8 5V3H6V8C6 11.31 8.69 14 12 14C15.31 14 18 11.31 18 8C18 5.79 16.21 4 14 4C12.79 4 11.63 4.54 10.88 5.43C11.22 5.56 11.54 5.71 11.84 5.9C12.19 5.77 12.58 5.7 13 5.7C14.1 5.7 15 6.6 15 7.7C15 8.8 14.1 9.7 13 9.7H12V9.2C12.3 9.08 12.58 8.87 12.77 8.6C13.18 8.21 13.46 7.71 13.46 7.15C13.46 5.98 12.52 5.04 11.35 5.04C10.17 5.04 9.24 5.98 9.24 7.15C9.24 7.73 9.51 8.25 9.93 8.6C9.4 8.27 9 7.71 9 7.07C9 5.9 9.9 5 11 5C12.1 5 13 5.9 13 7C13 7.36 12.89 7.7 12.71 7.99C12.88 7.73 13 7.41 13 7.06C13 6.48 12.54 6 12 6C11.46 6 11 6.48 11 7.06V8H12C13.66 8 15 6.66 15 5C15 3.9 14.1 3 13 3C11.9 3 11 3.9 11 5V6C10.4 5.5 9.7 5.19 9 5.09V3H7V5.09C4.65 5.58 3 7.65 3 10C3 13.31 5.69 16 9 16C12.31 16 15 13.31 15 10H13C13 12.21 11.21 14 9 14C6.79 14 5 12.21 5 10H3C3 13.3 5.7 16 9 16Z" fill="#999" />
        </Svg>
        <Text style={styles.actionLabel}>Slip</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================================
// TRACK TYPE ICON COMPONENT
// ============================================================================

const TrackTypeIcon: React.FC<{ type: string }> = ({ type }) => {
  const iconProps = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
  };

  switch (type) {
    case "music":
      return (
        <Svg {...iconProps}>
          <Path d="M12 3V13.55C11.41 13.21 10.73 13 10 13C7.79 13 6 14.79 6 17C6 19.21 7.79 21 10 21C12.16 21 13.89 19.37 14 17.25V7H18V3H12Z" fill="#EC9A15" />
        </Svg>
      );
    case "text":
      return (
        <Svg {...iconProps}>
          <Path d="M3 13H21V11H3V13ZM3 6H21V4H3V6ZM3 20H21V18H3V20Z" fill="#A78BFA" />
        </Svg>
      );
    case "voiceover":
      return (
        <Svg {...iconProps}>
          <Path d="M12 14C13.66 14 14.99 12.66 14.99 11V5C14.99 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM17.3 11C17.3 14 14.76 16.1 12 16.1C9.24 16.1 6.7 14 6.7 11H5C5 14.41 7.72 17.23 11 17.72V21H13V17.72C16.28 17.23 19 14.41 19 11H17.3Z" fill="#EC4899" />
        </Svg>
      );
    case "soundfx":
      return (
        <Svg {...iconProps}>
          <Path d="M3 9V15H7L12 20V4L7 9H3Z" fill="#F59E0B" />
        </Svg>
      );
    case "adjust":
      return (
        <Svg {...iconProps}>
          <Path d="M19.43 12.98C19.47 12.65 19.5 12.33 19.5 12C19.5 11.67 19.47 11.35 19.43 11.02L21.49 9.37C21.73 9.15 21.81 8.79 21.66 8.5L19.66 5C19.51 4.71 19.15 4.64 18.88 4.78L16.54 5.85C16.04 5.5 15.48 5.22 14.87 5.03L14.5 2.42C14.46 2.07 14.16 1.8 13.79 1.8H10.21C9.84 1.8 9.54 2.07 9.5 2.42L9.13 5.03C8.52 5.22 7.96 5.5 7.46 5.85L5.12 4.78C4.85 4.64 4.49 4.71 4.34 5L2.34 8.5C2.19 8.79 2.27 9.15 2.51 9.37L4.57 11.02C4.53 11.35 4.5 11.67 4.5 12C4.5 12.33 4.53 12.65 4.57 12.98L2.51 14.63C2.27 14.85 2.19 15.21 2.34 15.5L4.34 19C4.49 19.29 4.85 19.36 5.12 19.22L7.46 18.15C7.96 18.5 8.52 18.78 9.13 18.97L9.5 21.58C9.54 21.93 9.84 22.2 10.21 22.2H13.79C14.16 22.2 14.46 21.93 14.5 21.58L14.87 18.97C15.48 18.78 16.04 18.5 16.54 18.15L18.88 19.22C19.15 19.36 19.51 19.29 19.66 19L21.66 15.5C21.81 15.21 21.73 14.85 21.49 14.63L19.43 12.98ZM12 15.5C10.07 15.5 8.5 13.93 8.5 12C8.5 10.07 10.07 8.5 12 8.5C13.93 8.5 15.5 10.07 15.5 12C15.5 13.93 13.93 15.5 12 15.5Z" fill="#EC9A15" />
        </Svg>
      );
    default:
      return (
        <Svg {...iconProps}>
          <Rect x="4" y="4" width="16" height="16" stroke="#999" strokeWidth="1.5" />
        </Svg>
      );
  }
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timelineScroll: {
    backgroundColor: "#111",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    maxHeight: 450,
  },
  trackRow: {
    flexDirection: "row",
    minHeight: TRACK_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  trackLabel: {
    width: 80,
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: "#0a0a0a",
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  trackLabelText: {
    color: "#999",
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
  trackContent: {
    flex: 1,
    position: "relative",
    backgroundColor: "#0f0f0f",
  },
  gestureArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  segment: {
    position: "absolute",
    height: TRACK_HEIGHT - 8,
    top: 4,
    borderRadius: 4,
    overflow: "hidden",
    flexDirection: "row",
  },
  trimHandleLeft: {
    width: TRIM_HANDLE_WIDTH,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  trimHandleRight: {
    width: TRIM_HANDLE_WIDTH,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  trimHandleIndicator: {
    width: 2,
    height: 16,
    backgroundColor: "#fff",
    borderRadius: 1,
  },
  segmentContent: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  segmentText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  playhead: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 2,
    height: "100%",
    zIndex: 10,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  playheadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#fff",
    marginTop: -6,
  },
  playheadLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#fff",
  },
  actionBar: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "space-around",
  },
  actionButton: {
    alignItems: "center",
    gap: 4,
    minWidth: 50,
  },
  actionLabel: {
    color: "#999",
    fontSize: 11,
    fontWeight: "600",
  },
});

export default MultiTrackTimeline;
