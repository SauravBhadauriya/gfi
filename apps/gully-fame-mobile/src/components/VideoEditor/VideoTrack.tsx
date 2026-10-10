import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ClipItem from "./ClipItem";
import type { Clip } from "@/types/editor.types";

const PX_PER_SECOND = 40;
const TRACK_HEIGHT = 64;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface VideoTrackProps {
  clips: Clip[];
  selectedClipId: string | null;
  onSelectClip: (clipId: string) => void;
  onDeleteClip: (clipId: string) => void;
  onAddClip: () => void;
}

const VideoTrack: React.FC<VideoTrackProps> = ({
  clips,
  selectedClipId,
  onSelectClip,
  onDeleteClip,
  onAddClip,
}) => {
  const renderTransitionHandle = useCallback(() => {
    return (
      <View style={styles.transitionHandle}>
        <View style={styles.transitionHandleInner} />
      </View>
    );
  }, []);

  const renderAddButton = useCallback(() => {
    return (
      <TouchableOpacity
        style={styles.addButton}
        onPress={onAddClip}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    );
  }, [onAddClip]);

  if (clips.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No clips</Text>
        <TouchableOpacity
          style={styles.emptyAddButton}
          onPress={onAddClip}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={40} color="#EC9A15" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Render clips with transition handles */}
        {clips.map((clip, index) => (
          <View key={clip.id} style={styles.clipWrapper}>
            <ClipItem
              clip={clip}
              isSelected={selectedClipId === clip.id}
              onPress={() => onSelectClip(clip.id)}
              onDelete={onDeleteClip}
            />
            {index < clips.length - 1 && renderTransitionHandle()}
          </View>
        ))}

        {/* Add button at end */}
        {renderAddButton()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SCREEN_WIDTH / 2,
    paddingVertical: 8,
    gap: 2,
  },
  clipWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  transitionHandle: {
    width: 12,
    height: TRACK_HEIGHT - 16,
    borderRadius: 6,
    backgroundColor: "#fff",
    marginHorizontal: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  transitionHandleInner: {
    width: 3,
    height: "80%",
    backgroundColor: "#000",
    borderRadius: 1.5,
  },
  addButton: {
    width: 40,
    height: TRACK_HEIGHT - 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#EC9A15",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: TRACK_HEIGHT,
  },
  emptyStateText: {
    color: "#888",
    fontSize: 12,
    marginBottom: 8,
  },
  emptyAddButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default VideoTrack;
