import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Overlay } from "@/types/editor.types";

const PX_PER_SECOND = 40;
const TRACK_HEIGHT = 48;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Checkerboard pattern for transparency
const CheckerboardPattern = () => (
  <View style={styles.checkerboard}>
    {Array.from({ length: 8 }).map((_, i) =>
      Array.from({ length: 8 }).map((_, j) => (
        <View
          key={`checker-${i}-${j}`}
          style={[
            styles.checkerCell,
            (i + j) % 2 === 0
              ? styles.checkerCellDark
              : styles.checkerCellLight,
          ]}
        />
      ))
    )}
  </View>
);

interface OverlayTrackProps {
  overlays: Overlay[];
  selectedOverlayId: string | null;
  onSelectOverlay: (overlayId: string) => void;
  onDeleteOverlay: (overlayId: string) => void;
}

const OverlayTrack: React.FC<OverlayTrackProps> = ({
  overlays,
  selectedOverlayId,
  onSelectOverlay,
  onDeleteOverlay,
}) => {
  if (overlays.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        <View style={styles.content}>
          <CheckerboardPattern />

          {/* Render overlay items */}
          {overlays.map((overlay) => {
            const startX = overlay.startTime * PX_PER_SECOND;
            const width = overlay.duration * PX_PER_SECOND;

            return (
              <TouchableOpacity
                key={overlay.id}
                style={[
                  styles.overlayItem,
                  {
                    left: startX + SCREEN_WIDTH / 2,
                    width: Math.max(width, 40),
                  },
                  selectedOverlayId === overlay.id && styles.overlayItemSelected,
                ]}
                onPress={() => onSelectOverlay(overlay.id)}
                activeOpacity={0.7}
              >
                <View style={styles.overlayContent}>
                  {selectedOverlayId === overlay.id && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => onDeleteOverlay(overlay.id)}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
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
  checkerboard: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    opacity: 0.3,
  },
  checkerCell: {
    width: 10,
    height: 10,
  },
  checkerCellDark: {
    backgroundColor: "#000",
  },
  checkerCellLight: {
    backgroundColor: "#fff",
  },
  overlayItem: {
    position: "absolute",
    height: TRACK_HEIGHT - 8,
    top: 4,
    borderRadius: 6,
    backgroundColor: "rgba(236, 154, 21, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayItemSelected: {
    backgroundColor: "rgba(236, 154, 21, 0.6)",
    borderColor: "#EC9A15",
    borderWidth: 2,
  },
  overlayContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  deleteButton: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ff3333",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default OverlayTrack;
