import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import type { PreviewMediaType } from "./PreviewMedia";

export type PreviewBarTool = "editClips" | "editPhoto" | "music" | "text";

interface PreviewBottomBarProps {
  mediaType: PreviewMediaType;
  bottomInset: number;
  busy?: boolean;
  onPress: (tool: PreviewBarTool) => void;
  onNext: () => void;
}

const NEXT_YELLOW = "#FFD000";

const BarButton: React.FC<{ icon: string; label: string; onPress: () => void }> = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.button} onPress={onPress} accessibilityLabel={label}>
    <MaterialCommunityIcons name={icon as any} size={40} color="#fff" />
    <Text style={styles.label}>{label}</Text>
  </TouchableOpacity>
);

const PreviewBottomBar: React.FC<PreviewBottomBarProps> = ({ mediaType, bottomInset, busy, onPress, onNext }) => (
  <View style={[styles.bar, { paddingBottom: bottomInset + 10 }]}>
    {mediaType === "video" ? (
      <BarButton icon="movie-open-edit-outline" label="Edit Clips" onPress={() => onPress("editClips")} />
    ) : (
      <BarButton icon="crop-rotate" label="Edit Photo" onPress={() => onPress("editPhoto")} />
    )}
    <BarButton icon="music-note-plus" label="Music" onPress={() => onPress("music")} />
    <BarButton icon="alpha-t-box-outline" label="Text" onPress={() => onPress("text")} />

    <View style={styles.spacer} />

    <TouchableOpacity style={styles.next} onPress={onNext} disabled={busy} accessibilityLabel="Next">
      {busy ? <ActivityIndicator color="#000" /> : <Text style={styles.nextText}>Next</Text>}
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingTop: 14, gap: 14, backgroundColor: "#000" },
  button: { alignItems: "center", minWidth: 52 },
  label: { color: "#fff", fontSize: 12, fontWeight: "600", marginTop: 4 },
  spacer: { flex: 1 },
  next: {
    width: 94,
    height: 64,
    borderRadius: 6,
    backgroundColor: NEXT_YELLOW,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: { color: "#000", fontSize: 18, fontWeight: "800" },
});

export default PreviewBottomBar;
