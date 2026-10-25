import React from "react";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface TrashZoneProps {
  bottomInset: number;
  /** An item is being dragged over the zone: release deletes it. */
  active: boolean;
}

/** Shown while dragging a text or sticker; releasing over it deletes the item. */
const TrashZone: React.FC<TrashZoneProps> = ({ bottomInset, active }) => (
  <View style={[styles.trash, { bottom: bottomInset + 40 }]} pointerEvents="none">
    <View style={[styles.circle, active && styles.circleActive]}>
      <MaterialCommunityIcons name="delete-outline" size={28} color="#fff" />
    </View>
  </View>
);

const styles = StyleSheet.create({
  trash: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  circleActive: { backgroundColor: "#FF3B30", borderColor: "#FF3B30", transform: [{ scale: 1.2 }] },
});

export default TrashZone;
