import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EDITOR_ACCENT, ICON_TOOLBAR, LABEL_TOOLBAR } from "./editorTheme";

export type ToolId =
  | "audio"
  | "text"
  | "voice"
  | "links"
  | "captions"
  | "doodles"
  | "adjust"
  | "filters"
  | "overlay"
  | "soundfx"
  | "cutout"
  | "stickers"
  | "paste";

interface Tool {
  id: ToolId;
  label: string;
  icon: string;
}

interface BottomToolbarProps {
  selectedTool: ToolId | null;
  onSelectTool: (tool: ToolId) => void;
}

const TOOLS: Tool[] = [
  { id: "audio", label: "Audio", icon: "music" },
  { id: "text", label: "Text", icon: "text" },
  { id: "voice", label: "Voice", icon: "microphone" },
  { id: "links", label: "Links", icon: "link" },
  { id: "captions", label: "Captions", icon: "closed-caption" },
  { id: "doodles", label: "Doodles", icon: "pencil" },
  { id: "adjust", label: "Adjust", icon: "tune" },
  { id: "filters", label: "Filters", icon: "palette" },
  { id: "overlay", label: "Overlay", icon: "layers" },
  { id: "soundfx", label: "Sound FX", icon: "volume-high" },
  { id: "cutout", label: "Cutout", icon: "content-cut" },
  { id: "stickers", label: "Stickers", icon: "sticker" },
  { id: "paste", label: "Paste", icon: "content-paste" },
];

const BottomToolbar: React.FC<BottomToolbarProps> = ({
  selectedTool,
  onSelectTool,
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {TOOLS.map((tool) => {
          const isSelected = selectedTool === tool.id;
          return (
            <TouchableOpacity
              key={tool.id}
              style={styles.toolButton}
              onPress={() => onSelectTool(tool.id)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={tool.icon as any}
                size={ICON_TOOLBAR}
                color={isSelected ? EDITOR_ACCENT : "#fff"}
              />
              <Text
                style={[
                  styles.toolLabel,
                  isSelected && styles.toolLabelActive,
                ]}
              >
                {tool.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
    borderTopWidth: 1,
    borderTopColor: "#222",
    paddingTop: 8,
  },
  // No flex here: a flexed horizontal ScrollView collapsed to zero height.
  scrollView: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: 12,
    gap: 8,
  },
  toolButton: {
    alignItems: "center",
    minWidth: 58,
  },
  toolLabel: {
    color: "#fff",
    fontSize: LABEL_TOOLBAR,
    marginTop: 4,
    fontWeight: "500",
  },
  toolLabelActive: {
    color: EDITOR_ACCENT,
  },
});

export default BottomToolbar;
