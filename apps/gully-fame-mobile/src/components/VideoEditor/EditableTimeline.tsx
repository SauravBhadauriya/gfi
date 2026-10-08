import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TimelineClip from "./TimelineClip";
import * as ImagePicker from "expo-image-picker";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Clip {
  id: string;
  uri: string;
  duration: number;
  trimStart?: number;
  trimEnd?: number;
  type: "video" | "photo";
  source: "camera" | "gallery";
}

interface EditableTimelineProps {
  clips: Clip[];
  onClipsChange: (clips: Clip[]) => void;
  selectedClipIndex: number | null;
  onSelectClip: (index: number | null) => void;
  currentTime: number;
  onSeek?: (time: number) => void;
}

const EditableTimeline: React.FC<EditableTimelineProps> = ({
  clips,
  onClipsChange,
  selectedClipIndex,
  onSelectClip,
  currentTime,
  onSeek,
}) => {
  const [scrollX, setScrollX] = useState(0);

  // Handle clip trim start
  const handleTrimStart = useCallback(
    (index: number, time: number) => {
      const updatedClips = [...clips];
      updatedClips[index] = {
        ...updatedClips[index],
        trimStart: time,
      };
      onClipsChange(updatedClips);
    },
    [clips, onClipsChange]
  );

  // Handle clip trim end
  const handleTrimEnd = useCallback(
    (index: number, time: number) => {
      const updatedClips = [...clips];
      updatedClips[index] = {
        ...updatedClips[index],
        trimEnd: time,
      };
      onClipsChange(updatedClips);
    },
    [clips, onClipsChange]
  );

  // Handle clip delete
  const handleDelete = useCallback(
    (index: number) => {
      Alert.alert(
        "Delete Clip",
        "Are you sure you want to delete this clip?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              const updatedClips = clips.filter((_, i) => i !== index);
              onClipsChange(updatedClips);
              if (selectedClipIndex === index) {
                onSelectClip(null);
              } else if (selectedClipIndex !== null && selectedClipIndex > index) {
                onSelectClip(selectedClipIndex - 1);
              }
            },
          },
        ]
      );
    },
    [clips, onClipsChange, selectedClipIndex, onSelectClip]
  );

  // Handle clip duplicate
  const handleDuplicate = useCallback(
    (index: number) => {
      const clipToDuplicate = clips[index];
      const newClip = {
        ...clipToDuplicate,
        id: `${clipToDuplicate.id}-copy-${Date.now()}`,
      };
      const updatedClips = [...clips];
      updatedClips.splice(index + 1, 0, newClip);
      onClipsChange(updatedClips);
    },
    [clips, onClipsChange]
  );

  // Handle add clip from gallery
  const handleAddClip = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newClip: Clip = {
          id: `clip-${Date.now()}`,
          uri: asset.uri,
          duration: asset.duration || 1,
          type: "video",
          source: "gallery",
        };
        onClipsChange([...clips, newClip]);
      }
    } catch (error) {
      console.error("[EditableTimeline] Add clip error:", error);
      Alert.alert("Error", "Failed to add clip from gallery");
    }
  }, [clips, onClipsChange]);

  // Handle split at playhead
  const handleSplitAtPlayhead = useCallback(() => {
    if (selectedClipIndex === null) {
      Alert.alert("No clip selected", "Please select a clip to split");
      return;
    }

    const selectedClip = clips[selectedClipIndex];
    
    // Calculate clip's timeline position
    let clipStartTime = 0;
    for (let i = 0; i < selectedClipIndex; i++) {
      const clip = clips[i];
      clipStartTime += (clip.trimEnd || clip.duration) - (clip.trimStart || 0);
    }
    
    const clipDuration = (selectedClip.trimEnd || selectedClip.duration) - (selectedClip.trimStart || 0);
    const clipEndTime = clipStartTime + clipDuration;

    // Check if playhead is within this clip
    if (currentTime < clipStartTime || currentTime > clipEndTime) {
      Alert.alert("Invalid split", "Playhead must be within the selected clip");
      return;
    }

    const splitTimeInClip = currentTime - clipStartTime;
    const splitTimeInOriginal = (selectedClip.trimStart || 0) + splitTimeInClip;

    // Create two clips from the split
    const firstClip: Clip = {
      ...selectedClip,
      id: `${selectedClip.id}-split1-${Date.now()}`,
      trimEnd: splitTimeInOriginal,
    };

    const secondClip: Clip = {
      ...selectedClip,
      id: `${selectedClip.id}-split2-${Date.now()}`,
      trimStart: splitTimeInOriginal,
    };

    const updatedClips = [...clips];
    updatedClips.splice(selectedClipIndex, 1, firstClip, secondClip);
    onClipsChange(updatedClips);
    onSelectClip(selectedClipIndex + 1);
  }, [clips, selectedClipIndex, currentTime, onClipsChange, onSelectClip]);

  return (
    <View style={styles.container}>
      {/* Timeline controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleSplitAtPlayhead}
          disabled={selectedClipIndex === null}
        >
          <Ionicons
            name="cut"
            size={20}
            color={selectedClipIndex !== null ? "#fff" : "#666"}
          />
        </TouchableOpacity>
      </View>

      {/* Scrollable timeline with clips */}
      <View style={styles.timelineWrapper}>
        {/* Fixed playhead in center */}
        <View style={styles.playheadContainer} pointerEvents="none">
          <View style={styles.playhead} />
          <View style={styles.playheadLine} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
          style={styles.timeline}
          contentContainerStyle={styles.timelineContent}
        >
          {clips.map((clip, index) => (
            <TimelineClip
              key={clip.id}
              clip={clip}
              index={index}
              isSelected={selectedClipIndex === index}
              onSelect={() => onSelectClip(index)}
              onDelete={() => handleDelete(index)}
              onTrimStart={(time) => handleTrimStart(index, time)}
              onTrimEnd={(time) => handleTrimEnd(index, time)}
              onDuplicate={() => handleDuplicate(index)}
            />
          ))}

          {/* Add clip button */}
          <TouchableOpacity style={styles.addClipButton} onPress={handleAddClip}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controls: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
  },
  controlButton: {
    padding: 8,
  },
  timelineWrapper: {
    flex: 1,
    position: "relative",
  },
  playheadContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    zIndex: 10,
    alignItems: "center",
  },
  playhead: {
    width: 3,
    height: 12,
    backgroundColor: "#fff",
    borderRadius: 1.5,
  },
  playheadLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#fff",
  },
  timeline: {
    flex: 1,
  },
  timelineContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SCREEN_WIDTH / 2,
    gap: 8,
  },
  addClipButton: {
    width: 60,
    height: 60,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#666",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default EditableTimeline;
