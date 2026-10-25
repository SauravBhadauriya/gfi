import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { CAPTURE_ORANGE } from "./theme";

const SIZE = 92;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface RecordButtonProps {
  variant?: "video" | "photo";
  isRecording: boolean;
  /** 0..1 fill of the outer ring while recording. */
  progress?: number;
  disabled?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  onPressOut?: () => void;
}

const RecordButton: React.FC<RecordButtonProps> = ({
  variant = "video",
  isRecording,
  progress = 0,
  disabled,
  onPress,
  onLongPress,
  onPressOut,
}) => {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const isPhoto = variant === "photo";
  const showRecording = isRecording && !isPhoto;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={isPhoto ? undefined : onLongPress}
      onPressOut={isPhoto ? undefined : onPressOut}
      delayLongPress={300}
      disabled={disabled}
      style={({ pressed }) => [styles.container, pressed && styles.pressed, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel={isPhoto ? "Take photo" : isRecording ? "Stop recording" : "Record"}
    >
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke="#fff" strokeWidth={STROKE} fill="none" />
        {showRecording && clamped > 0 && (
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={CAPTURE_ORANGE}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={CIRCUMFERENCE * (1 - clamped)}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        )}
      </Svg>
      <View style={[styles.inner, isPhoto && styles.innerPhoto, showRecording && styles.innerRecording]} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
  pressed: { transform: [{ scale: 0.95 }] },
  disabled: { opacity: 0.5 },
  inner: { width: SIZE - 22, height: SIZE - 22, borderRadius: (SIZE - 22) / 2, backgroundColor: CAPTURE_ORANGE },
  innerPhoto: { backgroundColor: "#fff" },
  innerRecording: { width: 34, height: 34, borderRadius: 8 },
});

export default RecordButton;
