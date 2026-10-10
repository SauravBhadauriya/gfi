import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

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
  | "stickers";

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
];

const BottomToolbar: React.FC<BottomToolbarProps> = ({
  selectedTool,
  onSelectTool,
}) => {
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
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
                size={24}
                color={isSelected ? "#EC9A15" : "#fff"}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
    borderTopWidth: 1,
    borderTopColor: "#222",
    paddingTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    gap: 20,
    paddingBottom: 8,
  },
  toolButton: {
    alignItems: "center",
    minWidth: 60,
  },
  toolLabel: {
    color: "#fff",
    fontSize: 10,
    marginTop: 4,
    fontWeight: "500",
  },
  toolLabelActive: {
    color: "#EC9A15",
  },
});

export default BottomToolbar;
export type { ToolId };
