import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { CAPTURE_MIN_DURATION, CAPTURE_ORANGE, iconShadow } from "./theme";

interface TopBarProps {
  topInset: number;
  /** Durations (seconds) of recorded clips, one segment each. */
  segments: number[];
  /** Seconds of the clip currently being recorded (0 when idle). */
  liveSeconds?: number;
  maxDuration: number;
  showProgress?: boolean;
  onClose: () => void;
  onFlip: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  topInset,
  segments,
  liveSeconds = 0,
  maxDuration,
  showProgress = true,
  onClose,
  onFlip,
}) => {
  const max = maxDuration > 0 ? maxDuration : 60;
  const pct = (seconds: number) => `${Math.min(100, (seconds / max) * 100)}%` as const;

  return (
    <View style={[styles.container, { paddingTop: topInset + 8 }]} pointerEvents="box-none">
      <View style={[styles.progressTrack, !showProgress && styles.hidden]}>
        {segments.map((seconds, i) => (
          <View key={i} style={[styles.segment, { width: pct(seconds) }]} />
        ))}
        {liveSeconds > 0 && <View style={[styles.segment, { width: pct(liveSeconds) }]} />}
        <View style={[styles.minMarker, { left: pct(CAPTURE_MIN_DURATION) }]} />
      </View>

      <View style={styles.row} pointerEvents="box-none">
        <TouchableOpacity style={styles.iconBtn} onPress={onClose} hitSlop={10} accessibilityLabel="Close camera">
          <Ionicons name="close" size={32} color="#fff" style={iconShadow} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onFlip} hitSlop={10} accessibilityLabel="Flip camera">
          <Ionicons name="sync-outline" size={30} color="#fff" style={iconShadow} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 12, zIndex: 50 },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    flexDirection: "row",
    overflow: "hidden",
  },
  hidden: { opacity: 0 },
  segment: {
    height: "100%",
    backgroundColor: CAPTURE_ORANGE,
    borderRightWidth: 2,
    borderRightColor: "#fff",
  },
  minMarker: { position: "absolute", top: 0, bottom: 0, width: 3, backgroundColor: "#FF2D2D" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14 },
  iconBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
});

export default TopBar;
