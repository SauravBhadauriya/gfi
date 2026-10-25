import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { CAPTURE_YELLOW, iconShadow } from "./theme";

export type CaptureTab = "live" | "camera";

interface BottomTabsProps {
  bottomInset: number;
  activeTab: CaptureTab;
  galleryThumbUri?: string | null;
  onTabChange: (tab: CaptureTab) => void;
  onGallery: () => void;
}

const BottomTabs: React.FC<BottomTabsProps> = ({
  bottomInset,
  activeTab,
  galleryThumbUri,
  onTabChange,
  onGallery,
}) => (
  <View style={[styles.row, { paddingBottom: bottomInset + 8 }]}>
    <TouchableOpacity style={styles.side} onPress={onGallery} accessibilityLabel="Open gallery">
      <View style={styles.thumb}>
        {galleryThumbUri ? (
          <Image source={{ uri: galleryThumbUri }} style={styles.thumbImage} />
        ) : (
          <MaterialCommunityIcons name="image-multiple-outline" size={22} color="#fff" />
        )}
        <View style={styles.badge}>
          <MaterialCommunityIcons name="plus" size={12} color="#000" />
        </View>
      </View>
      <Text style={styles.sideLabel}>Gallery</Text>
    </TouchableOpacity>

    <View style={styles.tabs}>
      {(["live", "camera"] as CaptureTab[]).map(tab => {
        const active = activeTab === tab;
        return (
          <TouchableOpacity key={tab} style={styles.tab} onPress={() => onTabChange(tab)} accessibilityState={{ selected: active }}>
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab === "live" ? "Live" : "Camera"}</Text>
            <View style={[styles.underline, active && styles.underlineActive]} />
          </TouchableOpacity>
        );
      })}
    </View>

    {/* Mirrors the Gallery slot so the tabs stay centred. */}
    <View style={styles.side} />
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 10 },
  side: { minWidth: 72, alignItems: "center" },
  sideLabel: { alignSelf: "stretch", textAlign: "center", color: "#fff", fontSize: 12, marginTop: 4, ...iconShadow },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbImage: { width: "100%", height: "100%", borderRadius: 6 },
  badge: {
    position: "absolute",
    right: -6,
    bottom: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: CAPTURE_YELLOW,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: { flexDirection: "row", gap: 28, paddingBottom: 6 },
  tab: { alignItems: "center" },
  tabText: { color: "rgba(255,255,255,0.55)", fontSize: 16, fontWeight: "700" },
  tabTextActive: { color: "#fff" },
  underline: { marginTop: 6, width: 44, height: 3, borderRadius: 2, backgroundColor: "transparent" },
  underlineActive: { backgroundColor: CAPTURE_YELLOW },
});

export default BottomTabs;
