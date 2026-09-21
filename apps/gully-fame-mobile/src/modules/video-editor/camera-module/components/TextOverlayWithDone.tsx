import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { TextOverlay } from "../types/textOverlay.types";

interface TextOverlayWithDoneProps {
  overlay: TextOverlay;
  containerWidth: number;
  containerHeight: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDone: () => void;
  onDelete: () => void;
}

/**
 * Text overlay component with Done button that appears on video/photo
 * Shows Done, Edit, and Delete buttons when selected
 */
const TextOverlayWithDone: React.FC<TextOverlayWithDoneProps> = ({
  overlay,
  containerWidth,
  containerHeight,
  isSelected,
  onSelect,
  onEdit,
  onDone,
  onDelete,
}) => {
  const pan = React.useRef(new Animated.ValueXY()).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        onSelect();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  const textX = overlay.x * containerWidth;
  const textY = overlay.y * containerHeight;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: textX,
          top: textY,
          opacity: overlay.opacity,
          transform: [
            { rotate: `${overlay.rotation}deg` },
            { translateX: pan.x },
            { translateY: pan.y },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Text Content */}
      <View
        style={[
          styles.textWrapper,
          overlay.backgroundColor && {
            backgroundColor: overlay.backgroundColor,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              fontSize: overlay.fontSize,
              fontWeight: overlay.fontWeight,
              color: overlay.color,
              textAlign: overlay.textAlign,
              ...(overlay.strokeColor && overlay.strokeWidth > 0
                ? {
                    textShadowColor: overlay.strokeColor,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: overlay.strokeWidth,
                  }
                : {}),
            },
          ]}
        >
          {overlay.text}
        </Text>
      </View>

      {/* Selection Border */}
      {isSelected && <View style={styles.selectionBorder} />}

      {/* Action Buttons (Show when selected) */}
      {isSelected && (
        <View style={styles.actionButtons}>
          {/* Done Button */}
          <TouchableOpacity style={styles.doneButton} onPress={onDone} activeOpacity={0.7}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 6L9 17l-5-5"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.buttonLabel}>Done</Text>
          </TouchableOpacity>

          {/* Edit Button */}
          <TouchableOpacity style={styles.editButton} onPress={onEdit} activeOpacity={0.7}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                stroke="#a78bfa"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                stroke="#a78bfa"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.buttonLabel}>Edit</Text>
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete} activeOpacity={0.7}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                fill="#ff6b6b"
              />
            </Svg>
            <Text style={styles.buttonLabel}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 10,
  },
  textWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    textAlignVertical: "center",
  },
  selectionBorder: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderWidth: 2,
    borderColor: "#a78bfa",
    borderRadius: 4,
    borderStyle: "dashed",
  },
  actionButtons: {
    position: "absolute",
    top: -50,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "rgba(167, 139, 250, 0.3)",
    borderWidth: 1,
    borderColor: "#a78bfa",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "rgba(167, 139, 250, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.5)",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    borderWidth: 1,
    borderColor: "#ff6b6b",
  },
  buttonLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#ffffff",
  },
});

export default TextOverlayWithDone;
