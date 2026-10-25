import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import type { PreviewMediaType } from "./PreviewMedia";

export type PreviewRailTool = "stickers" | "filters" | "voiceover" | "canvas";

interface PreviewToolRailProps {
  mediaType: PreviewMediaType;
  onPress: (tool: PreviewRailTool) => void;
}

const ICON_SIZE = 34;

const TOOLS: { id: PreviewRailTool; label: string; icon: React.ReactNode; videoOnly?: boolean }[] = [
  { id: "stickers", label: "Stickers", icon: <MaterialCommunityIcons name="sticker-emoji" size={ICON_SIZE} color="#fff" /> },
  { id: "filters", label: "Filters", icon: <Ionicons name="color-filter-outline" size={ICON_SIZE} color="#fff" /> },
  { id: "voiceover", label: "Voiceover", icon: <Ionicons name="mic-outline" size={ICON_SIZE} color="#fff" />, videoOnly: true },
  { id: "canvas", label: "Canvas", icon: <MaterialCommunityIcons name="crop" size={ICON_SIZE} color="#fff" /> },
];

/** Right-hand tool rail: label pill on the left, outlined icon on the right. */
const PreviewToolRail: React.FC<PreviewToolRailProps> = ({ mediaType, onPress }) => (
  <View style={styles.rail} pointerEvents="box-none">
    {TOOLS.filter(t => !t.videoOnly || mediaType === "video").map(tool => (
      <TouchableOpacity key={tool.id} style={styles.item} onPress={() => onPress(tool.id)} accessibilityLabel={tool.label}>
        <View style={styles.pill}>
          <Text style={styles.label}>{tool.label}</Text>
        </View>
        <View style={styles.iconBox}>{tool.icon}</View>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  rail: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 36,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 10 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  label: { color: "#fff", fontSize: 13, fontWeight: "600" },
  iconBox: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});

export default PreviewToolRail;
