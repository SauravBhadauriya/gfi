import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Alert,
  PanResponderGestureState,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface AudioClip {
  id: string;
  trackId: string;
  title: string;
  artist: string;
  url: string;
  startTime: number; // Start time in video timeline
  duration: number; // Duration in seconds
  volume: number; // 0-1
  trimStart: number; // Trim from start of audio
  trimEnd: number; // Trim from end of audio
  originalDuration: number; // Original audio duration
}

interface AudioTrackProps {
  audioClips: AudioClip[];
  onAudioClipsChange: (clips: AudioClip[]) => void;
  currentTime: number;
  videoDuration: number;
}

const PIXELS_PER_SECOND = 10;

export default function AudioTrack({
  audioClips,
  onAudioClipsChange,
  currentTime,
  videoDuration,
}: AudioTrackProps) {
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Handle clip selection
  const handleClipPress = (clipId: string) => {
    setSelectedClipId(clipId === selectedClipId ? null : clipId);
  };

  // Handle clip delete
  const handleDeleteClip = (clipId: string) => {
    Alert.alert("Delete Audio", "Remove this audio clip?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updatedClips = audioClips.filter((clip) => clip.id !== clipId);
          onAudioClipsChange(updatedClips);
          setSelectedClipId(null);
        },
      },
    ]);
  };

  // Handle volume change
  const handleVolumeChange = (clipId: string, volume: number) => {
    const updatedClips = audioClips.map((clip) =>
      clip.id === clipId ? { ...clip, volume: Math.max(0, Math.min(1, volume)) } : clip
    );
    onAudioClipsChange(updatedClips);
  };

  // Render individual audio clip
  const renderAudioClip = (clip: AudioClip) => {
    const clipWidth = clip.duration * PIXELS_PER_SECOND;
    const isSelected = selectedClipId === clip.id;

    // Create pan responder for trim handles
    const createTrimPanResponder = (side: "left" | "right") => {
      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState: PanResponderGestureState) => {
          const deltaSeconds = gestureState.dx / PIXELS_PER_SECOND;

          if (side === "left") {
            // Trim from start
            const newTrimStart = Math.max(
              0,
              Math.min(
                clip.originalDuration - 0.5,
                clip.trimStart + deltaSeconds
              )
            );
            const newDuration = clip.originalDuration - newTrimStart - clip.trimEnd;

            if (newDuration >= 0.5) {
              const updatedClips = audioClips.map((c) =>
                c.id === clip.id
                  ? { ...c, trimStart: newTrimStart, duration: newDuration }
                  : c
              );
              onAudioClipsChange(updatedClips);
            }
          } else {
            // Trim from end
            const newTrimEnd = Math.max(
              0,
              Math.min(
                clip.originalDuration - 0.5,
                clip.trimEnd - deltaSeconds
              )
            );
            const newDuration = clip.originalDuration - clip.trimStart - newTrimEnd;

            if (newDuration >= 0.5) {
              const updatedClips = audioClips.map((c) =>
                c.id === clip.id
                  ? { ...c, trimEnd: newTrimEnd, duration: newDuration }
                  : c
              );
              onAudioClipsChange(updatedClips);
            }
          }
        },
      });
    };

    const leftTrimPanResponder = createTrimPanResponder("left");
    const rightTrimPanResponder = createTrimPanResponder("right");

    return (
      <TouchableOpacity
        key={clip.id}
        style={[
          styles.audioClip,
          { width: clipWidth },
          isSelected && styles.audioClipSelected,
        ]}
        onPress={() => handleClipPress(clip.id)}
        activeOpacity={0.8}
      >
        {/* Waveform representation (simplified) */}
        <View style={styles.waveformContainer}>
          {Array.from({ length: Math.floor(clipWidth / 4) }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: 10 + Math.random() * 30,
                  opacity: 0.3 + Math.random() * 0.7,
                },
              ]}
            />
          ))}
        </View>

        {/* Clip info overlay */}
        <View style={styles.audioClipInfo}>
          <View style={styles.audioClipHeader}>
            <Ionicons name="musical-note" size={12} color="#fff" />
            <Text style={styles.audioClipTitle} numberOfLines={1}>
              {clip.title}
            </Text>
          </View>
          <Text style={styles.audioClipArtist} numberOfLines={1}>
            {clip.artist}
          </Text>
        </View>

        {/* Volume indicator */}
        <View style={styles.volumeIndicator}>
          <Ionicons
            name={clip.volume === 0 ? "volume-mute" : "volume-medium"}
            size={12}
            color="#fff"
          />
          <Text style={styles.volumeText}>{Math.round(clip.volume * 100)}%</Text>
        </View>

        {/* Trim handles */}
        {isSelected && (
          <>
            <View
              style={styles.trimHandleLeft}
              {...leftTrimPanResponder.panHandlers}
            />
            <View
              style={styles.trimHandleRight}
              {...rightTrimPanResponder.panHandlers}
            />
          </>
        )}

        {/* Delete button (when selected) */}
        {isSelected && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteClip(clip.id)}
          >
            <Ionicons name="trash" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // Calculate playhead position
  const playheadPosition = currentTime * PIXELS_PER_SECOND;

  return (
    <View style={styles.container}>
      <View style={styles.trackHeader}>
        <Text style={styles.trackLabel}>Audio</Text>
        <View style={styles.trackControls}>
          <TouchableOpacity style={styles.trackButton}>
            <Ionicons name="volume-medium" size={16} color="#888" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.timelineWrapper}>
        {/* Fixed playhead in center */}
        <View style={styles.playheadContainer}>
          <View style={styles.playheadLine} />
        </View>

        {/* Scrollable audio clips */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          style={styles.timelineScroll}
          contentContainerStyle={[
            styles.timelineContent,
            { paddingHorizontal: SCREEN_WIDTH / 2 },
          ]}
        >
          {audioClips.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No audio added</Text>
            </View>
          ) : (
            audioClips.map((clip) => renderAudioClip(clip))
          )}
        </ScrollView>
      </View>

      {/* Volume controls (when clip selected) */}
      {selectedClipId && (
        <View style={styles.volumeControls}>
          {audioClips
            .filter((clip) => clip.id === selectedClipId)
            .map((clip) => (
              <View key={clip.id} style={styles.volumeSliderContainer}>
                <Text style={styles.volumeLabel}>Volume</Text>
                <View style={styles.volumeSlider}>
                  <TouchableOpacity
                    onPress={() => handleVolumeChange(clip.id, clip.volume - 0.1)}
                  >
                    <Ionicons name="remove-circle" size={24} color="#888" />
                  </TouchableOpacity>
                  <View style={styles.volumeBar}>
                    <View
                      style={[
                        styles.volumeBarFill,
                        { width: `${clip.volume * 100}%` },
                      ]}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => handleVolumeChange(clip.id, clip.volume + 0.1)}
                  >
                    <Ionicons name="add-circle" size={24} color="#888" />
                  </TouchableOpacity>
                  <Text style={styles.volumeValue}>
                    {Math.round(clip.volume * 100)}%
                  </Text>
                </View>
              </View>
            ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0a0a0a",
  },
  trackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  trackLabel: {
    color: "#888",
    fontSize: 10,
    fontWeight: "600",
  },
  trackControls: {
    flexDirection: "row",
    gap: 8,
  },
  trackButton: {
    padding: 4,
  },
  timelineWrapper: {
    height: 60,
    position: "relative",
  },
  playheadContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    zIndex: 10,
    alignItems: "center",
    pointerEvents: "none",
  },
  playheadLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#fff",
  },
  timelineScroll: {
    flex: 1,
  },
  timelineContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyContainer: {
    width: SCREEN_WIDTH - 40,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 6,
    borderStyle: "dashed",
  },
  emptyText: {
    color: "#666",
    fontSize: 12,
  },
  audioClip: {
    height: 50,
    backgroundColor: "#2a2a2a",
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
    borderWidth: 2,
    borderColor: "transparent",
  },
  audioClipSelected: {
    borderColor: "#EC9A15",
  },
  waveformContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 4,
  },
  waveformBar: {
    width: 2,
    backgroundColor: "#EC9A15",
    borderRadius: 1,
  },
  audioClipInfo: {
    position: "absolute",
    top: 4,
    left: 6,
    right: 30,
  },
  audioClipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  audioClipTitle: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    flex: 1,
  },
  audioClipArtist: {
    color: "#aaa",
    fontSize: 9,
    marginLeft: 16,
  },
  volumeIndicator: {
    position: "absolute",
    bottom: 4,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  volumeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "600",
  },
  trimHandleLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: "#EC9A15",
  },
  trimHandleRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: "#EC9A15",
  },
  deleteButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#ff3b30",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  volumeControls: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  volumeSliderContainer: {
    gap: 8,
  },
  volumeLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  volumeSlider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  volumeBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#2a2a2a",
    borderRadius: 2,
    overflow: "hidden",
  },
  volumeBarFill: {
    height: "100%",
    backgroundColor: "#EC9A15",
  },
  volumeValue: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "right",
  },
});
