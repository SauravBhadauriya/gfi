import React, { useState, useRef } from "react";
import {
  View,
  PanResponder,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Svg, Path as SvgPath } from "react-native-svg";
import type { DoodlePath } from "./DoodlesToolPanel";

interface DoodleCanvasOverlayProps {
  doodles: DoodlePath[];
  videoWidth: number;
  videoHeight: number;
  isDrawing: boolean;
  brushColor: string;
  brushSize: number;
  onDoodleComplete: (doodle: DoodlePath) => void;
}

interface Point {
  x: number;
  y: number;
}

export default function DoodleCanvasOverlay({
  doodles,
  videoWidth,
  videoHeight,
  isDrawing,
  brushColor,
  brushSize,
  onDoodleComplete,
}: DoodleCanvasOverlayProps) {
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [startTime] = useState(Date.now());

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isDrawing,
      onMoveShouldSetPanResponder: () => isDrawing,
      onPanResponderGrant: () => {
        setCurrentPath([]);
      },
      onPanResponderMove: (evt, { dx, dy, x0, y0 }) => {
        if (isDrawing) {
          const point: Point = {
            x: evt.nativeEvent.pageX || x0 + dx,
            y: evt.nativeEvent.pageY || y0 + dy,
          };
          setCurrentPath((prev) => [...prev, point]);
        }
      },
      onPanResponderRelease: () => {
        if (isDrawing && currentPath.length > 0) {
          const doodle: DoodlePath = {
            id: `doodle-${Date.now()}`,
            points: currentPath,
            color: brushColor,
            width: brushSize,
            timestamp: Date.now() - startTime,
            duration: 5000, // Default 5 seconds
          };
          onDoodleComplete(doodle);
          setCurrentPath([]);
        }
      },
    })
  ).current;

  if (!isDrawing) return null;

  // Convert points to SVG path string
  const pathString = currentPath
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      return `L ${point.x} ${point.y}`;
    })
    .join(" ");

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          width: videoWidth,
          height: videoHeight,
        },
      ]}
    >
      <Svg
        width={videoWidth}
        height={videoHeight}
        style={styles.svg}
        pointerEvents="none"
      >
        {/* Render all completed doodles */}
        {doodles.map((doodle) => {
          const doodlePathString = doodle.points
            .map((point, index) => {
              if (index === 0) {
                return `M ${point.x} ${point.y}`;
              }
              return `L ${point.x} ${point.y}`;
            })
            .join(" ");

          return (
            <SvgPath
              key={doodle.id}
              d={doodlePathString}
              stroke={doodle.color}
              strokeWidth={doodle.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          );
        })}

        {/* Render current drawing path */}
        {pathString && (
          <SvgPath
            d={pathString}
            stroke={brushColor}
            strokeWidth={brushSize}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "transparent",
  },
  svg: {
    backgroundColor: "transparent",
  },
});
