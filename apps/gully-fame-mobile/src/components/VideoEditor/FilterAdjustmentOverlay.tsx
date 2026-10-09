import React from "react";
import { View, StyleSheet } from "react-native";
import type { VideoFilter } from "./FiltersToolPanel";
import type { VideoAdjustments } from "./AdjustToolPanel";

interface FilterAdjustmentOverlayProps {
  filter: VideoFilter;
  adjustments: VideoAdjustments;
}

/**
 * Returns a color overlay style that approximates the filter effect
 */
function getFilterOverlayStyle(filter: VideoFilter): React.CSSProperties | null {
  if (!filter || filter.type === "none") return null;

  const intensity = (filter.intensity ?? 100) / 100;

  const overlayStyles: Record<string, React.CSSProperties> = {
    blackwhite: {
      backgroundColor: `rgba(100, 100, 100, ${0.3 * intensity})`,
    },
    sepia: {
      backgroundColor: `rgba(112, 66, 20, ${0.3 * intensity})`,
    },
    vintage: {
      backgroundColor: `rgba(150, 100, 50, ${0.25 * intensity})`,
    },
    warm: {
      backgroundColor: `rgba(255, 120, 0, ${0.15 * intensity})`,
    },
    cool: {
      backgroundColor: `rgba(0, 100, 255, ${0.15 * intensity})`,
    },
    dramatic: {
      backgroundColor: `rgba(0, 0, 0, ${0.25 * intensity})`,
    },
    soft: {
      backgroundColor: `rgba(255, 255, 255, ${0.15 * intensity})`,
    },
    vivid: {
      backgroundColor: `rgba(255, 0, 100, ${0.1 * intensity})`,
    },
    fade: {
      backgroundColor: `rgba(200, 200, 200, ${0.2 * intensity})`,
    },
  };

  return overlayStyles[filter.type] || null;
}

/**
 * Returns adjustment overlay styles for brightness, contrast, saturation
 */
function getAdjustmentOverlayStyles(
  adjustments: VideoAdjustments
): Array<React.CSSProperties> {
  const overlays: Array<React.CSSProperties> = [];

  // Brightness adjustment: positive = white overlay, negative = black overlay
  if (adjustments.brightness !== 0) {
    const brightness = Math.max(-100, Math.min(100, adjustments.brightness));
    if (brightness > 0) {
      // Brighter: white overlay
      overlays.push({
        backgroundColor: `rgba(255, 255, 255, ${(brightness / 100) * 0.3})`,
      });
    } else {
      // Darker: black overlay
      overlays.push({
        backgroundColor: `rgba(0, 0, 0, ${(Math.abs(brightness) / 100) * 0.3})`,
      });
    }
  }

  // Contrast adjustment: positive = darker border, negative = lighter
  if (adjustments.contrast !== 0) {
    const contrast = Math.max(-100, Math.min(100, adjustments.contrast));
    if (contrast > 0) {
      // Increased contrast: darken edges
      overlays.push({
        backgroundColor: `rgba(0, 0, 0, ${(contrast / 100) * 0.15})`,
      });
    }
  }

  // Saturation adjustment: shown via overlay tint
  if (adjustments.saturation !== 0) {
    const saturation = Math.max(-100, Math.min(100, adjustments.saturation));
    if (saturation < 0) {
      // Desaturated: grayish overlay
      overlays.push({
        backgroundColor: `rgba(128, 128, 128, ${(Math.abs(saturation) / 100) * 0.1})`,
      });
    }
  }

  return overlays;
}

export default function FilterAdjustmentOverlay({
  filter,
  adjustments,
}: FilterAdjustmentOverlayProps) {
  const filterStyle = getFilterOverlayStyle(filter);
  const adjustmentStyles = getAdjustmentOverlayStyles(adjustments);

  return (
    <>
      {/* Filter overlay */}
      {filterStyle && (
        <View
          style={[
            styles.overlay,
            filterStyle as any,
          ]}
        />
      )}

      {/* Adjustment overlays */}
      {adjustmentStyles.map((style, index) => (
        <View
          key={`adjustment-${index}`}
          style={[
            styles.overlay,
            style as any,
          ]}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    pointerEvents: "none",
  },
});
