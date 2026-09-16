import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  Animated,
} from "react-native";
import Svg, { Rect } from "react-native-svg";

const { width } = Dimensions.get("window");

export interface AudioTrimData {
  startTime: number;
  endTime: number;
  duration: number;
}

interface AudioTrimViewProps {
  duration: number;
  onTrimChange?: (trimData: AudioTrimData) => void;
  onComplete?: (trimData: AudioTrimData) => void;
}

const AudioTrimView: React.FC<AudioTrimViewProps> = ({
  duration,
  onTrimChange,
  onComplete,
}) => {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(duration);
  const startX = useRef(new Animated.Value(0)).current;
  const endX = useRef(new Animated.Value(width - 40)).current;

  const startPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const newX = Math.max(0, Math.min(gestureState.moveX - 20, width - 100));
        startX.setValue(newX);
        const newStartTime = (newX / (width - 40)) * duration;
        setStartTime(newStartTime);
        onTrimChange?.({
          startTime: newStartTime,
          endTime,
          duration,
        });
      },
    })
  ).current;

  const endPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const newX = Math.max(100, Math.min(gestureState.moveX - 20, width - 40));
        endX.setValue(newX);
        const newEndTime = (newX / (width - 40)) * duration;
        setEndTime(newEndTime);
        onTrimChange?.({
          startTime,
          endTime: newEndTime,
          duration,
        });
      },
      onPanResponderRelease: () => {
        onComplete?.({
          startTime,
          endTime,
          duration,
        });
      },
    })
  ).current;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trim Audio</Text>

      <View style={styles.timeline}>
        <View style={styles.waveform}>
          <Svg width={width - 40} height={60} viewBox={`0 0 ${width - 40} 60`}>
            {Array.from({ length: 20 }).map((_, i) => (
              <Rect
                key={i}
                x={i * ((width - 40) / 20) + 2}
                y={30 - Math.random() * 20}
                width={((width - 40) / 20) - 4}
                height={Math.random() * 40}
                fill="#ec9a15"
                opacity={0.6}
              />
            ))}
          </Svg>
        </View>

        <Animated.View
          style={[styles.trimHandle, styles.startHandle, { left: startX }]}
          {...startPanResponder.panHandlers}
        >
          <View style={styles.handle} />
        </Animated.View>

        <Animated.View
          style={[styles.trimHandle, styles.endHandle, { right: Animated.subtract(width - 40, endX) }]}
          {...endPanResponder.panHandlers}
        >
          <View style={styles.handle} />
        </Animated.View>
      </View>

      <View style={styles.timeInfo}>
        <View>
          <Text style={styles.timeLabel}>Start</Text>
          <Text style={styles.time}>{formatTime(startTime)}</Text>
        </View>
        <View style={styles.centerInfo}>
          <Text style={styles.timeLabel}>Duration</Text>
          <Text style={styles.time}>{formatTime(endTime - startTime)}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.timeLabel}>End</Text>
          <Text style={styles.time}>{formatTime(endTime)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={() =>
          onComplete?.({
            startTime,
            endTime,
            duration,
          })
        }
      >
        <Text style={styles.confirmText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    marginVertical: 12,
  },
  title: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  timeline: {
    position: "relative",
    marginVertical: 16,
    height: 80,
  },
  waveform: {
    width: "100%",
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
  },
  trimHandle: {
    position: "absolute",
    width: 40,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    top: 0,
  },
  startHandle: {
    left: 0,
  },
  endHandle: {
    right: 0,
  },
  handle: {
    width: 3,
    height: 70,
    backgroundColor: "#ec9a15",
    borderRadius: 2,
  },
  timeInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 12,
  },
  timeLabel: {
    color: "#999",
    fontSize: 11,
    marginBottom: 4,
  },
  time: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  centerInfo: {
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#ec9a15",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  confirmText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default AudioTrimView;
