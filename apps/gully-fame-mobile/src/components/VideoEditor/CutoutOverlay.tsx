import React from "react";
import { View, Image, StyleSheet } from "react-native";
import type { CutoutSettings } from "./CutoutToolPanel";

interface CutoutOverlayProps {
  cutoutSettings: CutoutSettings;
}

export default function CutoutOverlay({ cutoutSettings }: CutoutOverlayProps) {
  if (!cutoutSettings.enabled) return null;

  let backgroundColor: string | undefined;

  // Determine background color/image
  if (cutoutSettings.backgroundColor === "image" && cutoutSettings.backgroundImage) {
    // For image background, use Image component
    return (
      <Image
        source={{ uri: cutoutSettings.backgroundImage }}
        style={[styles.overlay, { opacity: 0.6 }]}
        resizeMode="cover"
      />
    );
  } else if (cutoutSettings.backgroundColor === "transparent") {
    // Don't render anything for transparent
    return null;
  } else {
    // Use specified background color
    backgroundColor = cutoutSettings.backgroundColor || "transparent";
  }

  return (
    <View
      style={[
        styles.overlay,
        {
          backgroundColor,
          opacity: 0.5,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    pointerEvents: "none",
  },
});
