import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Clip } from "@/types/editor.types";

const PX_PER_SECOND = 40;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ClipItemProps {
  clip: Clip;
  isSelected: boolean;
  onPress: (clipId: string) => void;
  onDelete: (clipId: string) => void;
}

const ClipItem: React.FC<ClipItemProps> = ({
  clip,
  isSelected,
  onPress,
  onDelete,
}) => {
  const clipDuration = (clip.trimEnd || clip.duration) - (clip.trimStart || 0);
  const clipWidth = Math.max(clipDuration * PX_PER_SECOND, 40);

  // Generate placeholder frame thumbnails
  const thumbnailCount = Math.max(1, Math.floor(clipDuration / 1));
  const thumbnails = useMemo(() => {
    const frames = [];
    for (let i = 0; i < thumbnailCount; i++) {
      frames.push(`frame-${i}`);
    }
    return frames;
  }, [thumbnailCount]);

  return (
    <View style={[styles.container, { width: clipWidth }]}>
      <TouchableOpacity
        style={[
          styles.clipBox,
          isSelected && styles.clipBoxSelected,
          { width: clipWidth },
        ]}
        onPress={() => onPress(clip.id)}
        activeOpacity={0.7}
      >
        {/* Thumbnail strip */}
        <View style={styles.thumbnailStrip}>
          {thumbnails.map((_, index) => (
            <View
              key={index}
              style={[
                styles.thumbnail,
                {
                  width: clipWidth / thumbnailCount,
                },
              ]}
            >
              <View style={styles.placeholderThumbnail} />
            </View>
          ))}
        </View>

        {/* Selected state badge */}
        {isSelected && (
          <View style={styles.editBadge}>
            <Ionicons name="pencil" size={12} color="#000" />
          </View>
        )}
      </TouchableOpacity>

      {/* Delete button (visible on long press or selection) */}
      {isSelected && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(clip.id)}
        >
          <Ionicons name="close" size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 2,
    position: "relative",
  },
  clipBox: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#2a2a2a",
    height: 64,
    borderWidth: 2,
    borderColor: "transparent",
  },
  clipBoxSelected: {
    borderColor: "#EC9A15",
  },
  thumbnailStrip: {
    flex: 1,
    flexDirection: "row",
  },
  thumbnail: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRightWidth: 0.5,
    borderRightColor: "#111",
  },
  placeholderThumbnail: {
    flex: 1,
    backgroundColor: "#333",
  },
  editBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EC9A15",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ff3333",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 101,
  },
});

export default ClipItem;
