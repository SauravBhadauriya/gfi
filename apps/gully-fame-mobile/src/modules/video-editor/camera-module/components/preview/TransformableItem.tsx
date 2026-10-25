import React, { useEffect, useState } from "react";
import { StyleSheet, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

export interface ItemTransform {
  /** Centre, normalized 0..1 to the media frame. */
  x: number;
  y: number;
  scale: number;
  /** Degrees, clockwise. */
  rotation: number;
}

interface TransformableItemProps extends ItemTransform {
  frameWidth: number;
  frameHeight: number;
  /** Absolute screen Y above which a release deletes the item. */
  trashTop: number;
  children: React.ReactNode;
  onTap?: () => void;
  onDragChange?: (dragging: boolean, overTrash: boolean) => void;
  onCommit: (transform: ItemTransform) => void;
  onDelete: () => void;
  /** Unscaled size of the item, reported for export. */
  onMeasure?: (width: number, height: number) => void;
}

/**
 * Wraps an overlay (text or sticker) with drag, pinch, rotate and tap.
 * Live transforms run on the UI thread; the final transform is committed once on release.
 */
const TransformableItem: React.FC<TransformableItemProps> = ({
  x,
  y,
  scale,
  rotation,
  frameWidth,
  frameHeight,
  trashTop,
  children,
  onTap,
  onDragChange,
  onCommit,
  onDelete,
  onMeasure,
}) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const pinch = useSharedValue(1);
  const turn = useSharedValue(0);
  const overTrash = useSharedValue(false);

  // Committed props moved the item; drop the live offsets.
  useEffect(() => {
    tx.value = 0;
    ty.value = 0;
    pinch.value = 1;
    turn.value = 0;
  }, [x, y, scale, rotation, tx, ty, pinch, turn]);

  const commit = (dx: number, dy: number, s: number, r: number, deleteIt: boolean) => {
    onDragChange?.(false, false);
    if (deleteIt) {
      onDelete();
      return;
    }
    onCommit({
      x: Math.min(1, Math.max(0, x + dx / frameWidth)),
      y: Math.min(1, Math.max(0, y + dy / frameHeight)),
      scale: Math.min(8, Math.max(0.2, scale * s)),
      rotation: rotation + r,
    });
  };

  const reportDrag = (dragging: boolean, trash: boolean) => onDragChange?.(dragging, trash);

  const pan = Gesture.Pan()
    .onStart(() => {
      runOnJS(reportDrag)(true, false);
    })
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
      const isOver = e.absoluteY > trashTop;
      if (isOver !== overTrash.value) {
        overTrash.value = isOver;
        runOnJS(reportDrag)(true, isOver);
      }
    })
    .onEnd(() => {
      runOnJS(commit)(tx.value, ty.value, pinch.value, turn.value, overTrash.value);
      overTrash.value = false;
    });

  const pinchGesture = Gesture.Pinch().onUpdate((e) => {
    pinch.value = e.scale;
  });

  const rotate = Gesture.Rotation().onUpdate((e) => {
    turn.value = (e.rotation * 180) / Math.PI;
  });

  const tap = Gesture.Tap().onEnd(() => {
    if (onTap) runOnJS(onTap)();
  });

  const gesture = Gesture.Race(Gesture.Simultaneous(pan, pinchGesture, rotate), tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale * pinch.value },
      { rotate: `${rotation + turn.value}deg` },
    ],
    opacity: overTrash.value ? 0.5 : 1,
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.width || height !== size.height) {
      setSize({ width, height });
      onMeasure?.(width, height);
    }
  };

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        onLayout={handleLayout}
        style={[
          styles.item,
          { left: x * frameWidth - size.width / 2, top: y * frameHeight - size.height / 2 },
          animatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  item: { position: "absolute" },
});

export default TransformableItem;
