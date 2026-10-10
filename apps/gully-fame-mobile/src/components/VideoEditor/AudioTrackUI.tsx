import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { AudioTrack } from "@/types/editor.types";

const PX_PER_SECOND = 40;
const TRACK_HEIGHT = 40;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface AudioTrackUIProps {
  audioTracks: AudioTrack[];
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
  onDeleteTrack: (trackId: string) => void;
  onVolumeChange?: (trackId: string, volume: number) => void;
}

const AudioTrackUI: React.FC<AudioTrackUIProps> = ({
  audioTracks,
  selectedTrackId,
  onSelectTrack,
  onDeleteTrack,
  onVolumeChange,
}) => {
  if (audioTracks.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        <View style={styles.content}>
          {audioTracks.map((track) => {
            const startX = track.startTime * PX_PER_SECOND;
            const trimStart = track.trimStart || 0;
            const trimEnd = track.trimEnd || track.originalDuration;
            const displayDuration = trimEnd - trimStart;
            const width = Math.max(displayDuration * PX_PER_SECOND, 40);

            return (
              <TouchableOpacity
                key={track.id}
                style={[
                  styles.audioItem,
                  {
                    left: startX + SCREEN_WIDTH / 2,
                    width,
                  },
                  selectedTrackId === track.id && styles.audioItemSelected,
                ]}
                onPress={() => onSelectTrack(track.id)}
                activeOpacity={0.7}
              >
                <View style={styles.audioContent}>
                  <View style={styles.audioInfo}>
                    <Text
                      style={styles.audioTitle}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {track.title}
                    </Text>
                    <Text
                      style={styles.audioArtist}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {track.artist}
                    </Text>
                  </View>

                  {/* Volume indicator */}
                  <View style={styles.volumeIndicator}>
                    <Ionicons
                      name="volume-high"
                      size={12}
                      color="#fff"
                      style={{ opacity: track.volume }}
                    />
                  </View>

                  {/* Delete button (visible when selected) */}
                  {selectedTrackId === track.id && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => onDeleteTrack(track.id)}
                    >
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: TRACK_HEIGHT,
    backgroundColor: "#0a0a0a",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    position: "relative",
    minWidth: "100%",
    height: TRACK_HEIGHT,
    paddingHorizontal: SCREEN_WIDTH / 2,
  },
  audioItem: {
    position: "absolute",
    height: TRACK_HEIGHT - 4,
    top: 2,
    borderRadius: 4,
    backgroundColor: "#6B4C9A",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 6,
  },
  audioItemSelected: {
    backgroundColor: "#8B5FB3",
    borderWidth: 1,
    borderColor: "#fff",
  },
  audioContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  audioInfo: {
    flex: 1,
    marginRight: 4,
  },
  audioTitle: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  audioArtist: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 8,
    marginTop: 1,
  },
  volumeIndicator: {
    width: 12,
    height: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  deleteButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ff3333",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AudioTrackUI;
