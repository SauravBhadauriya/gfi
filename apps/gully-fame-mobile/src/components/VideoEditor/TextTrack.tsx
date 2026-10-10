import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { TextItem } from "@/types/editor.types";

const PX_PER_SECOND = 40;
const TRACK_HEIGHT = 40;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface TextTrackProps {
  texts: TextItem[];
  selectedTextId: string | null;
  onSelectText: (textId: string) => void;
  onDeleteText: (textId: string) => void;
}

const TextTrack: React.FC<TextTrackProps> = ({
  texts,
  selectedTextId,
  onSelectText,
  onDeleteText,
}) => {
  if (texts.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        <View style={styles.content}>
          {texts.map((text) => {
            const startX = text.startTime * PX_PER_SECOND;
            const width = Math.max(text.duration * PX_PER_SECOND, 40);

            return (
              <TouchableOpacity
                key={text.id}
                style={[
                  styles.textItem,
                  {
                    left: startX + SCREEN_WIDTH / 2,
                    width,
                  },
                  selectedTextId === text.id && styles.textItemSelected,
                ]}
                onPress={() => onSelectText(text.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.textLabel,
                    {
                      color: text.color,
                    },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {text.text}
                </Text>

                {/* Delete button (visible when selected) */}
                {selectedTextId === text.id && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => onDeleteText(text.id)}
                  >
                    <Ionicons name="close" size={12} color="#fff" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: TRACK_HEIGHT,
    backgroundColor: "#0a0a0a",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    position: "relative",
    minWidth: "100%",
    height: TRACK_HEIGHT,
    paddingHorizontal: SCREEN_WIDTH / 2,
  },
  textItem: {
    position: "absolute",
    height: TRACK_HEIGHT - 4,
    top: 2,
    borderRadius: 4,
    backgroundColor: "rgba(100, 180, 220, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(100, 180, 220, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  textItemSelected: {
    backgroundColor: "rgba(100, 180, 220, 0.6)",
    borderColor: "#64B4DC",
    borderWidth: 2,
  },
  textLabel: {
    fontSize: 9,
    fontWeight: "600",
  },
  deleteButton: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ff3333",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TextTrack;
