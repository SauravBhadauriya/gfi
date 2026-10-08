import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export interface TextOverlay {
  id: string;
  text: string;
  x: number; // Position (0-1 relative to video width)
  y: number; // Position (0-1 relative to video height)
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  alignment: "left" | "center" | "right";
  startTime: number; // When text appears
  endTime: number; // When text disappears
  animation: "none" | "fade" | "slide" | "bounce";
  rotation: number;
  opacity: number;
}

interface TextToolPanelProps {
  onClose: () => void;
  onAddText: (textOverlay: Omit<TextOverlay, "id">) => void;
  videoDuration: number;
  currentTime: number;
}

const PRESET_COLORS = [
  "#FFFFFF", // White
  "#000000", // Black
  "#EC9A15", // Brand Orange
  "#FF3B30", // Red
  "#34C759", // Green
  "#007AFF", // Blue
  "#5856D6", // Purple
  "#FF9500", // Orange
  "#FFCC00", // Yellow
  "#FF2D55", // Pink
];

const FONT_FAMILIES = [
  "System",
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Courier",
  "Georgia",
  "Verdana",
];

const ANIMATIONS = [
  { id: "none", label: "None", icon: "ban" },
  { id: "fade", label: "Fade", icon: "contrast" },
  { id: "slide", label: "Slide", icon: "arrow-forward" },
  { id: "bounce", label: "Bounce", icon: "trending-up" },
];

export default function TextToolPanel({
  onClose,
  onAddText,
  videoDuration,
  currentTime,
}: TextToolPanelProps) {
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState("System");
  const [color, setColor] = useState("#FFFFFF");
  const [backgroundColor, setBackgroundColor] = useState("transparent");
  const [alignment, setAlignment] = useState<"left" | "center" | "right">("center");
  const [animation, setAnimation] = useState<"none" | "fade" | "slide" | "bounce">("none");
  const [startTime, setStartTime] = useState(currentTime);
  const [duration, setDuration] = useState(3);
  const [showColorPicker, setShowColorPicker] = useState<"text" | "background" | null>(null);
  const [showFontPicker, setShowFontPicker] = useState(false);

  const handleAddText = () => {
    if (text.trim().length === 0) {
      Alert.alert("Error", "Please enter some text");
      return;
    }

    const textOverlay: Omit<TextOverlay, "id"> = {
      text: text.trim(),
      x: 0.5, // Center
      y: 0.5, // Center
      fontSize,
      fontFamily,
      color,
      backgroundColor,
      alignment,
      startTime,
      endTime: Math.min(startTime + duration, videoDuration),
      animation,
      rotation: 0,
      opacity: 1,
    };

    onAddText(textOverlay);
    onClose();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>TEXT</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Text Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Text Content</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your text..."
            placeholderTextColor="#666"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={200}
          />
          <Text style={styles.charCount}>{text.length}/200</Text>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Preview</Text>
          <View style={styles.previewContainer}>
            <Text
              style={[
                styles.previewText,
                {
                  fontSize,
                  fontFamily,
                  color,
                  backgroundColor:
                    backgroundColor === "transparent"
                      ? "transparent"
                      : backgroundColor,
                  textAlign: alignment,
                },
              ]}
            >
              {text || "Your text here"}
            </Text>
          </View>
        </View>

        {/* Font Size */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Font Size: {fontSize}</Text>
          <View style={styles.sliderContainer}>
            <TouchableOpacity
              onPress={() => setFontSize(Math.max(12, fontSize - 2))}
            >
              <Ionicons name="remove-circle" size={28} color="#888" />
            </TouchableOpacity>
            <View style={styles.sliderBar}>
              <View
                style={[
                  styles.sliderFill,
                  { width: `${((fontSize - 12) / 60) * 100}%` },
                ]}
              />
            </View>
            <TouchableOpacity
              onPress={() => setFontSize(Math.min(72, fontSize + 2))}
            >
              <Ionicons name="add-circle" size={28} color="#888" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Font Family */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Font</Text>
          <TouchableOpacity
            style={styles.fontButton}
            onPress={() => setShowFontPicker(!showFontPicker)}
          >
            <Text style={styles.fontButtonText}>{fontFamily}</Text>
            <Ionicons name="chevron-down" size={20} color="#888" />
          </TouchableOpacity>
          {showFontPicker && (
            <View style={styles.fontPicker}>
              {FONT_FAMILIES.map((font) => (
                <TouchableOpacity
                  key={font}
                  style={[
                    styles.fontOption,
                    fontFamily === font && styles.fontOptionActive,
                  ]}
                  onPress={() => {
                    setFontFamily(font);
                    setShowFontPicker(false);
                  }}
                >
                  <Text style={styles.fontOptionText}>{font}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Text Color */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Text Color</Text>
          <TouchableOpacity
            style={styles.colorButton}
            onPress={() =>
              setShowColorPicker(showColorPicker === "text" ? null : "text")
            }
          >
            <View style={[styles.colorSwatch, { backgroundColor: color }]} />
            <Text style={styles.colorButtonText}>{color}</Text>
            <Ionicons name="chevron-down" size={20} color="#888" />
          </TouchableOpacity>
          {showColorPicker === "text" && (
            <View style={styles.colorPicker}>
              {PRESET_COLORS.map((presetColor) => (
                <TouchableOpacity
                  key={presetColor}
                  style={[
                    styles.colorOption,
                    { backgroundColor: presetColor },
                    color === presetColor && styles.colorOptionActive,
                  ]}
                  onPress={() => {
                    setColor(presetColor);
                    setShowColorPicker(null);
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* Background Color */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Background</Text>
          <TouchableOpacity
            style={styles.colorButton}
            onPress={() =>
              setShowColorPicker(
                showColorPicker === "background" ? null : "background"
              )
            }
          >
            <View
              style={[
                styles.colorSwatch,
                {
                  backgroundColor:
                    backgroundColor === "transparent" ? "#2a2a2a" : backgroundColor,
                },
              ]}
            >
              {backgroundColor === "transparent" && (
                <Ionicons name="ban" size={16} color="#888" />
              )}
            </View>
            <Text style={styles.colorButtonText}>
              {backgroundColor === "transparent" ? "None" : backgroundColor}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#888" />
          </TouchableOpacity>
          {showColorPicker === "background" && (
            <View style={styles.colorPicker}>
              <TouchableOpacity
                style={[
                  styles.colorOption,
                  { backgroundColor: "#2a2a2a" },
                  backgroundColor === "transparent" && styles.colorOptionActive,
                ]}
                onPress={() => {
                  setBackgroundColor("transparent");
                  setShowColorPicker(null);
                }}
              >
                <Ionicons name="ban" size={16} color="#888" />
              </TouchableOpacity>
              {PRESET_COLORS.map((presetColor) => (
                <TouchableOpacity
                  key={presetColor}
                  style={[
                    styles.colorOption,
                    { backgroundColor: presetColor },
                    backgroundColor === presetColor && styles.colorOptionActive,
                  ]}
                  onPress={() => {
                    setBackgroundColor(presetColor);
                    setShowColorPicker(null);
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* Alignment */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Alignment</Text>
          <View style={styles.alignmentButtons}>
            <TouchableOpacity
              style={[
                styles.alignmentButton,
                alignment === "left" && styles.alignmentButtonActive,
              ]}
              onPress={() => setAlignment("left")}
            >
              <MaterialCommunityIcons
                name="format-align-left"
                size={24}
                color={alignment === "left" ? "#000" : "#fff"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.alignmentButton,
                alignment === "center" && styles.alignmentButtonActive,
              ]}
              onPress={() => setAlignment("center")}
            >
              <MaterialCommunityIcons
                name="format-align-center"
                size={24}
                color={alignment === "center" ? "#000" : "#fff"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.alignmentButton,
                alignment === "right" && styles.alignmentButtonActive,
              ]}
              onPress={() => setAlignment("right")}
            >
              <MaterialCommunityIcons
                name="format-align-right"
                size={24}
                color={alignment === "right" ? "#000" : "#fff"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Animation */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Animation</Text>
          <View style={styles.animationButtons}>
            {ANIMATIONS.map((anim) => (
              <TouchableOpacity
                key={anim.id}
                style={[
                  styles.animationButton,
                  animation === anim.id && styles.animationButtonActive,
                ]}
                onPress={() => setAnimation(anim.id as any)}
              >
                <Ionicons
                  name={anim.icon as any}
                  size={20}
                  color={animation === anim.id ? "#000" : "#fff"}
                />
                <Text
                  style={[
                    styles.animationButtonText,
                    animation === anim.id && styles.animationButtonTextActive,
                  ]}
                >
                  {anim.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Timing */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Start: {startTime.toFixed(1)}s | Duration: {duration.toFixed(1)}s
          </Text>
          <View style={styles.timingControls}>
            <View style={styles.timingControl}>
              <Text style={styles.timingLabel}>Start</Text>
              <View style={styles.timingButtons}>
                <TouchableOpacity
                  onPress={() => setStartTime(Math.max(0, startTime - 0.5))}
                >
                  <Ionicons name="remove-circle" size={24} color="#888" />
                </TouchableOpacity>
                <Text style={styles.timingValue}>{startTime.toFixed(1)}s</Text>
                <TouchableOpacity
                  onPress={() =>
                    setStartTime(Math.min(videoDuration - 0.5, startTime + 0.5))
                  }
                >
                  <Ionicons name="add-circle" size={24} color="#888" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.timingControl}>
              <Text style={styles.timingLabel}>Duration</Text>
              <View style={styles.timingButtons}>
                <TouchableOpacity
                  onPress={() => setDuration(Math.max(0.5, duration - 0.5))}
                >
                  <Ionicons name="remove-circle" size={24} color="#888" />
                </TouchableOpacity>
                <Text style={styles.timingValue}>{duration.toFixed(1)}s</Text>
                <TouchableOpacity
                  onPress={() => setDuration(duration + 0.5)}
                >
                  <Ionicons name="add-circle" size={24} color="#888" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddText}>
          <Text style={styles.addButtonText}>Add Text</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  textInput: {
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    padding: 12,
    color: "#fff",
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: "top",
  },
  charCount: {
    color: "#666",
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
  },
  previewContainer: {
    backgroundColor: "#000",
    borderRadius: 10,
    padding: 20,
    minHeight: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  previewText: {
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sliderBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#2a2a2a",
    borderRadius: 3,
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: "#EC9A15",
  },
  fontButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    padding: 12,
  },
  fontButtonText: {
    color: "#fff",
    fontSize: 15,
  },
  fontPicker: {
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    marginTop: 8,
    overflow: "hidden",
  },
  fontOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  fontOptionActive: {
    backgroundColor: "#EC9A15",
  },
  fontOptionText: {
    color: "#fff",
    fontSize: 15,
  },
  colorButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#666",
    justifyContent: "center",
    alignItems: "center",
  },
  colorButtonText: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
  },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  colorOptionActive: {
    borderColor: "#EC9A15",
  },
  alignmentButtons: {
    flexDirection: "row",
    gap: 12,
  },
  alignmentButton: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  alignmentButtonActive: {
    backgroundColor: "#EC9A15",
  },
  animationButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  animationButton: {
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  animationButtonActive: {
    backgroundColor: "#EC9A15",
  },
  animationButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  animationButtonTextActive: {
    color: "#000",
  },
  timingControls: {
    gap: 16,
  },
  timingControl: {
    gap: 8,
  },
  timingLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  timingButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timingValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  addButton: {
    backgroundColor: "#EC9A15",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  addButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
});
