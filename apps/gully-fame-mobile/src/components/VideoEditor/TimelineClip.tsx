import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as VideoThumbnails from "expo-video-thumbnails";

interface TimelineClipProps {
  clip: {
    id: string;
    uri: string;
    duration: number;
    trimStart?: number;
    trimEnd?: number;
  };
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTrimStart: (time: number) => void;
  onTrimEnd: (time: number) => void;
  onDuplicate: () => void;
}

const TimelineClip: React.FC<TimelineClipProps> = ({
  clip,
  index,
  isSelected,
  onSelect,
  onDelete,
  onTrimStart,
  onTrimEnd,
  onDuplicate,
}) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  // Generate thumbnail
  React.useEffect(() => {
    const generateThumbnail = async () => {
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(clip.uri, {
          time: (clip.trimStart || 0) * 1000,
        });
        setThumbnail(uri);
      } catch (error) {
        console.error("[TimelineClip] Thumbnail generation failed:", error);
      }
    };
    generateThumbnail();
  }, [clip.uri, clip.trimStart]);

  // Left trim handle pan responder
  const leftHandlePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setIsDraggingLeft(true);
    },
    onPanResponderMove: (_, gestureState) => {
      // Calculate new trim start based on drag distance
      // Each 10px = 0.1 second
      const deltaSeconds = gestureState.dx / 100;
      const currentTrimStart = clip.trimStart || 0;
      const newTrimStart = Math.max(
        0,
        Math.min(currentTrimStart + deltaSeconds, (clip.trimEnd || clip.duration) - 0.1)
      );
      onTrimStart(newTrimStart);
    },
    onPanResponderRelease: () => {
      setIsDraggingLeft(false);
    },
  });

  // Right trim handle pan responder
  const rightHandlePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setIsDraggingRight(true);
    },
    onPanResponderMove: (_, gestureState) => {
      // Calculate new trim end based on drag distance
      const deltaSeconds = gestureState.dx / 100;
      const currentTrimEnd = clip.trimEnd || clip.duration;
      const newTrimEnd = Math.max(
        (clip.trimStart || 0) + 0.1,
        Math.min(currentTrimEnd + deltaSeconds, clip.duration)
      );
      onTrimEnd(newTrimEnd);
    },
    onPanResponderRelease: () => {
      setIsDraggingRight(false);
    },
  });

  const handleLongPress = () => {
    Alert.alert(
      "Clip Options",
      `Clip ${index + 1}`,
      [
        {
          text: "Duplicate",
          onPress: onDuplicate,
        },
        {
          text: "Delete",
          onPress: onDelete,
          style: "destructive",
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const trimmedDuration = (clip.trimEnd || clip.duration) - (clip.trimStart || 0);

  return (
    <TouchableOpacity
      style={[styles.clipContainer, isSelected && styles.clipContainerSelected]}
      onPress={onSelect}
      onLongPress={handleLongPress}
      activeOpacity={0.8}
    >
      {/* Clip thumbnail */}
      <View style={styles.clipContent}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <MaterialIcons name="video-library" size={24} color="#666" />
          </View>
        )}

        {/* Clip info overlay */}
        <View style={styles.clipInfo}>
          <Text style={styles.clipIndex}>{index + 1}</Text>
          <Text style={styles.clipDuration}>{trimmedDuration.toFixed(1)}s</Text>
        </View>
      </View>

      {/* Left trim handle */}
      <View
        {...leftHandlePanResponder.panHandlers}
        style={[
          styles.trimHandle,
          styles.trimHandleLeft,
          isDraggingLeft && styles.trimHandleDragging,
        ]}
      >
        <View style={styles.trimHandleBar} />
      </View>

      {/* Right trim handle */}
      <View
        {...rightHandlePanResponder.panHandlers}
        style={[
          styles.trimHandle,
          styles.trimHandleRight,
          isDraggingRight && styles.trimHandleDragging,
        ]}
      >
        <View style={styles.trimHandleBar} />
      </View>

      {/* Delete button when selected */}
      {isSelected && (
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <MaterialIcons name="close" size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  clipContainer: {
    width: 120,
    height: 60,
    backgroundColor: "#1a1a1a",
    borderRadius: 6,
    overflow: "visible",
    position: "relative",
    borderWidth: 2,
    borderColor: "transparent",
  },
  clipContainerSelected: {
    borderColor: "#EC9A15",
  },
  clipContent: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
  },
  clipInfo: {
    position: "absolute",
    bottom: 4,
    left: 4,
    right: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clipIndex: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  clipDuration: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  trimHandle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  trimHandleLeft: {
    left: -2,
    backgroundColor: "#EC9A15",
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  trimHandleRight: {
    right: -2,
    backgroundColor: "#EC9A15",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  trimHandleDragging: {
    backgroundColor: "#FFA500",
  },
  trimHandleBar: {
    width: 2,
    height: 20,
    backgroundColor: "#fff",
    borderRadius: 1,
  },
  deleteButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ff4444",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
});

export default TimelineClip;
