import React, { useState } from "react";
import { View, Image, StyleSheet, PanResponder, Animated } from "react-native";
import type { StickerItem } from "./StickersToolPanel";

interface StickerLayerProps {
  stickers: StickerItem[];
  videoWidth: number;
  videoHeight: number;
  onUpdate?: (sticker: StickerItem) => void;
}

export default function StickerLayer({
  stickers,
  videoWidth,
  videoHeight,
  onUpdate,
}: StickerLayerProps) {
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {stickers.map((sticker) => (
        <StickerItem
          key={sticker.id}
          sticker={sticker}
          videoWidth={videoWidth}
          videoHeight={videoHeight}
          isSelected={selectedStickerId === sticker.id}
          onSelect={() => setSelectedStickerId(sticker.id)}
          onUpdate={onUpdate}
        />
      ))}
    </View>
  );
}

interface StickerItemProps {
  sticker: StickerItem;
  videoWidth: number;
  videoHeight: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate?: (sticker: StickerItem) => void;
}

function StickerItem({
  sticker,
  videoWidth,
  videoHeight,
  isSelected,
  onSelect,
  onUpdate,
}: StickerItemProps) {
  const [pan] = useState(new Animated.ValueXY());
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        onSelect();
      },
      onPanResponderMove: (evt, { dx, dy }) => {
        // Calculate new position (normalized to 0-1)
        const newX = sticker.x + dx / videoWidth;
        const newY = sticker.y + dy / videoHeight;

        // Clamp to bounds (with some tolerance for sticker size)
        const clampedX = Math.max(0, Math.min(1, newX));
        const clampedY = Math.max(0, Math.min(1, newY));

        if (onUpdate) {
          onUpdate({
            ...sticker,
            x: clampedX,
            y: clampedY,
          });
        }
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  const stickerSizeWidth = 80 * sticker.scale;
  const stickerSizeHeight = 80 * sticker.scale;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.stickerContainer,
        {
          position: "absolute",
          left: sticker.x * videoWidth - stickerSizeWidth / 2,
          top: sticker.y * videoHeight - stickerSizeHeight / 2,
          width: stickerSizeWidth,
          height: stickerSizeHeight,
          transform: [{ rotate: `${sticker.rotation}deg` }],
        },
      ]}
    >
      <Image
        source={{ uri: sticker.imageUrl }}
        style={[
          styles.stickerImage,
          isSelected && styles.selectedSticker,
        ]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    pointerEvents: "box-none",
  },
  stickerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  stickerImage: {
    width: "100%",
    height: "100%",
  },
  selectedSticker: {
    borderWidth: 2,
    borderColor: "#EC9A15",
    borderRadius: 4,
  },
});
