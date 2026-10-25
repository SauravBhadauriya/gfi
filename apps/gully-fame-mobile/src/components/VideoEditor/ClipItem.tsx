import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import type { Clip } from "@/types/editor.types";
import { videoThumbnails } from "@modules/video-editor/camera-module/utils/thumbnails";
import { clipLength, clipStart } from "./useClipSequence";
import { EDITOR_ACCENT } from "./editorTheme";

interface ClipItemProps {
  clip: Clip;
  width: number;
  height: number;
  /** Width of one thumbnail tile (one second of timeline). */
  tileWidth: number;
  isSelected: boolean;
  onPress: (clipId: string) => void;
  onDelete: (clipId: string) => void;
}

type ThumbState = { status: "loading" } | { status: "ready"; frames: string[] } | { status: "error" };

/** One clip on the main track: real frames tiled across its width (photos tile the photo). */
const ClipItem: React.FC<ClipItemProps> = ({ clip, width, height, tileWidth, isSelected, onPress, onDelete }) => {
  const [thumbs, setThumbs] = useState<ThumbState>(
    clip.type === "photo" ? { status: "ready", frames: [clip.uri] } : { status: "loading" }
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (clip.type === "photo") {
      setThumbs({ status: "ready", frames: [clip.uri] });
      return;
    }
    let cancelled = false;
    setThumbs({ status: "loading" });
    videoThumbnails(clip.uri, clipStart(clip), clipLength(clip))
      .then((frames) => !cancelled && setThumbs({ status: "ready", frames }))
      .catch((error) => {
        if (!cancelled) setThumbs({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [clip.uri, clip.type, clip.trimStart, clip.trimEnd, clip.duration, attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  const tiles = Math.max(1, Math.round(width / tileWidth));

  return (
    <TouchableOpacity
      style={[styles.clip, { width, height }, isSelected && styles.selected]}
      onPress={() => onPress(clip.id)}
      activeOpacity={0.8}
    >
      {thumbs.status === "ready" ? (
        <View style={styles.strip}>
          {Array.from({ length: tiles }, (_, i) => {
            const frame = thumbs.frames[Math.min(thumbs.frames.length - 1, Math.floor((i * thumbs.frames.length) / tiles))];
            return <Image key={i} source={{ uri: frame }} style={{ width: width / tiles, height }} contentFit="cover" />;
          })}
        </View>
      ) : thumbs.status === "loading" ? (
        <View style={styles.placeholder}>
          <ActivityIndicator size="small" color="#888" />
        </View>
      ) : (
        <TouchableOpacity style={styles.placeholder} onPress={retry} accessibilityLabel="Retry thumbnails">
          <Ionicons name="refresh" size={16} color="#fff" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}

      {isSelected && (
        <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(clip.id)} hitSlop={8} accessibilityLabel="Delete clip">
          <Ionicons name="close" size={14} color="#fff" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  clip: {
    position: "absolute",
    top: 0,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#333",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selected: { borderColor: EDITOR_ACCENT },
  strip: { flexDirection: "row", flex: 1 },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#333" },
  retryText: { color: "#fff", fontSize: 10, marginTop: 2 },
  deleteButton: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ClipItem;
