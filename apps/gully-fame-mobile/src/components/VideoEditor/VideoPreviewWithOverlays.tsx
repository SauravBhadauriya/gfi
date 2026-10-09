import React, { useState } from "react";
import { View, StyleSheet, LayoutChangeEvent } from "react-native";
import { VideoView } from "expo-video";
import CaptionOverlay from "./CaptionOverlay";
import FilterAdjustmentOverlay from "./FilterAdjustmentOverlay";
import DoodleCanvasOverlay from "./DoodleCanvasOverlay";
import StickerLayer from "./StickerLayer";
import OverlayLayer from "./OverlayLayer";
import CutoutOverlay from "./CutoutOverlay";
import type { VideoFilter } from "./FiltersToolPanel";
import type { VideoAdjustments } from "./AdjustToolPanel";
import type { DoodlePath } from "./DoodlesToolPanel";
import type { StickerItem } from "./StickersToolPanel";
import type { OverlayItem } from "./OverlayToolPanel";
import type { CutoutSettings } from "./CutoutToolPanel";
import type { Caption } from "./CaptionsToolPanel";

interface VideoPreviewWithOverlaysProps {
  player: any; // VideoPlayer from expo-video
  currentTime: number;
  captions: Caption[];
  filter: VideoFilter;
  adjustments: VideoAdjustments;
  doodles: DoodlePath[];
  stickers: StickerItem[];
  overlays: OverlayItem[];
  cutoutSettings: CutoutSettings;
  selectedTool: string | null;
  isDrawingMode?: boolean;
  doodleBrushColor?: string;
  doodleBrushSize?: number;
  onDoodleComplete?: (doodle: DoodlePath) => void;
  onStickerUpdate?: (sticker: StickerItem) => void;
}

export default function VideoPreviewWithOverlays({
  player,
  currentTime,
  captions,
  filter,
  adjustments,
  doodles,
  stickers,
  overlays,
  cutoutSettings,
  selectedTool,
  isDrawingMode = false,
  doodleBrushColor = "#FFFFFF",
  doodleBrushSize = 5,
  onDoodleComplete,
  onStickerUpdate,
}: VideoPreviewWithOverlaysProps) {
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);

  const handleVideoLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setVideoWidth(width);
    setVideoHeight(height);
  };

  return (
    <View style={styles.container} onLayout={handleVideoLayout}>
      {/* Video Player */}
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
      />

      {/* Layer Order (back to front):
          1. Cutout effect (behind video content)
          2. Filter & Adjustments
          3. Doodles
          4. Stickers
          5. Overlays
          6. Captions (top)
      */}

      {/* Cutout overlay (simulates background) */}
      <CutoutOverlay cutoutSettings={cutoutSettings} />

      {/* Filters & Adjustments */}
      <FilterAdjustmentOverlay filter={filter} adjustments={adjustments} />

      {/* Doodles with drawing canvas */}
      {selectedTool === "doodles" && (
        <DoodleCanvasOverlay
          doodles={doodles}
          videoWidth={videoWidth}
          videoHeight={videoHeight}
          isDrawing={isDrawingMode}
          brushColor={doodleBrushColor}
          brushSize={doodleBrushSize}
          onDoodleComplete={onDoodleComplete || (() => {})}
        />
      )}

      {/* Render completed doodles */}
      {doodles.length > 0 && selectedTool !== "doodles" && (
        <View style={styles.doodlesContainer}>
          {doodles.map((doodle) => (
            <DoodleItem key={doodle.id} doodle={doodle} />
          ))}
        </View>
      )}

      {/* Stickers */}
      {stickers.length > 0 && (
        <StickerLayer
          stickers={stickers}
          videoWidth={videoWidth}
          videoHeight={videoHeight}
          onUpdate={onStickerUpdate}
        />
      )}

      {/* Overlays */}
      {overlays.length > 0 && (
        <OverlayLayer
          overlays={overlays}
          videoWidth={videoWidth}
          videoHeight={videoHeight}
          currentTime={currentTime}
        />
      )}

      {/* Captions */}
      {captions.length > 0 && (
        <CaptionOverlay
          captions={captions}
          currentTime={currentTime}
          videoWidth={videoWidth}
          videoHeight={videoHeight}
        />
      )}
    </View>
  );
}

/**
 * Simple component to render a completed doodle path using react-native-svg
 */
function DoodleItem({ doodle }: { doodle: DoodlePath }) {
  const { Svg, Path: SvgPath } = require("react-native-svg");

  const pathString = doodle.points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      return `L ${point.x} ${point.y}`;
    })
    .join(" ");

  return (
    <Svg
      style={styles.doodleSvg}
      pointerEvents="none"
    >
      <SvgPath
        d={pathString}
        stroke={doodle.color}
        strokeWidth={doodle.width}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
    aspectRatio: 9 / 16,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  doodlesContainer: {
    ...StyleSheet.absoluteFill,
    pointerEvents: "none",
  },
  doodleSvg: {
    ...StyleSheet.absoluteFill,
    pointerEvents: "none",
  },
});
