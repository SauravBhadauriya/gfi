import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { CAPTURE_ORANGE, iconShadow } from "./theme";

export type RailFlashMode = "off" | "on" | "torch" | "auto";

interface ToolRailProps {
  top: number;
  maxDuration: number;
  countdown: number;
  speed: number;
  flash: RailFlashMode;
  hasSound: boolean;
  hasEffect: boolean;
  showFlash: boolean;
  disabled?: boolean;
  onSound: () => void;
  onDuration: () => void;
  onTimer: () => void;
  onEffects: () => void;
  onSpeed: () => void;
  onFlash: () => void;
}

interface RailButtonProps {
  label?: string;
  active?: boolean;
  onPress: () => void;
  children: React.ReactNode;
  accessibilityLabel: string;
}

const RailButton: React.FC<RailButtonProps> = ({ label, active, onPress, children, accessibilityLabel }) => (
  <TouchableOpacity style={styles.button} onPress={onPress} hitSlop={6} accessibilityLabel={accessibilityLabel}>
    {children}
    {!!label && <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>}
  </TouchableOpacity>
);

const ToolRail: React.FC<ToolRailProps> = ({
  top,
  maxDuration,
  countdown,
  speed,
  flash,
  hasSound,
  hasEffect,
  showFlash,
  disabled,
  onSound,
  onDuration,
  onTimer,
  onEffects,
  onSpeed,
  onFlash,
}) => {
  const [expanded, setExpanded] = useState(false);
  const color = (active: boolean) => (active ? CAPTURE_ORANGE : "#fff");

  return (
    <View style={[styles.rail, { top }, disabled && styles.disabled]} pointerEvents={disabled ? "none" : "box-none"}>
      <RailButton onPress={onSound} active={hasSound} label={hasSound ? "Sound" : undefined} accessibilityLabel="Add sound">
        <MaterialCommunityIcons name="music-note-plus" size={30} color={color(hasSound)} style={iconShadow} />
      </RailButton>

      <RailButton onPress={onDuration} accessibilityLabel={`Max duration ${maxDuration} seconds`}>
        <View style={styles.durationCircle}>
          <Text style={styles.durationText}>{maxDuration}</Text>
        </View>
      </RailButton>

      <RailButton
        onPress={onTimer}
        active={countdown > 0}
        label={countdown > 0 ? `${countdown}s` : undefined}
        accessibilityLabel="Countdown timer"
      >
        <MaterialCommunityIcons name="timer-outline" size={30} color={color(countdown > 0)} style={iconShadow} />
      </RailButton>

      <RailButton onPress={onEffects} active={hasEffect} accessibilityLabel="Effects">
        <MaterialCommunityIcons name="face-man-shimmer-outline" size={30} color={color(hasEffect)} style={iconShadow} />
      </RailButton>

      {expanded && (
        <>
          <RailButton onPress={onSpeed} active={speed !== 1} label={`${speed}x`} accessibilityLabel="Speed">
            <MaterialCommunityIcons name="speedometer" size={28} color={color(speed !== 1)} style={iconShadow} />
          </RailButton>
          {showFlash && (
            <RailButton onPress={onFlash} active={flash !== "off"} accessibilityLabel={`Flash ${flash}`}>
              <MaterialCommunityIcons
                name={flash === "off" ? "flash-off" : flash === "on" || flash === "auto" ? "flash" : "flashlight"}
                size={28}
                color={color(flash !== "off")}
                style={iconShadow}
              />
            </RailButton>
          )}
        </>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => setExpanded(v => !v)}
        hitSlop={6}
        accessibilityLabel={expanded ? "Show fewer tools" : "Show more tools"}
      >
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={28} color="#fff" style={iconShadow} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  rail: { position: "absolute", right: 14, alignItems: "center", gap: 18, zIndex: 40 },
  disabled: { opacity: 0.3 },
  button: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  label: { color: "#fff", fontSize: 10, fontWeight: "700", marginTop: 2, ...iconShadow },
  labelActive: { color: CAPTURE_ORANGE },
  durationCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  durationText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});

export default ToolRail;
