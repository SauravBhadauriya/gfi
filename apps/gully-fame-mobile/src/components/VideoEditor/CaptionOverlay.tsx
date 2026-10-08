import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Caption } from "./CaptionsToolPanel";

interface CaptionOverlayProps {
  captions: Caption[];
  currentTime: number;
  videoWidth: number;
  videoHeight: number;
}

export default function CaptionOverlay({
  captions,
  currentTime,
  videoWidth,
  videoHeight,
}: CaptionOverlayProps) {
  const [visibleCaption, setVisibleCaption] = useState<Caption | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Find caption that should be visible at current time
    const currentCaption = captions.find(
      (cap) => currentTime >= cap.startTime && currentTime <= cap.endTime
    );

    if (currentCaption?.id !== visibleCaption?.id) {
      if (currentCaption) {
        // New caption appeared
        setVisibleCaption(currentCaption);

        // Reset animations
        fadeAnim.setValue(0);
        slideAnim.setValue(50);

        // Animate based on caption animation type
        if (currentCaption.animation === "fade") {
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        } else if (currentCaption.animation === "slide") {
          fadeAnim.setValue(1);
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }).start();
        } else {
          // No animation or typewriter (instant appear)
          fadeAnim.setValue(1);
          slideAnim.setValue(0);
        }
      } else {
        // No caption at current time
        if (visibleCaption?.animation === "fade") {
          // Fade out
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setVisibleCaption(null));
        } else {
          setVisibleCaption(null);
        }
      }
    }
  }, [currentTime, captions, visibleCaption]);

  if (!visibleCaption) return null;

  // Calculate position based on caption position setting
  const getPositionStyle = () => {
    const baseStyle = {
      width: videoWidth * 0.85,
      alignSelf: "center" as const,
    };

    switch (visibleCaption.position) {
      case "top":
        return { ...baseStyle, top: videoHeight * 0.1 };
      case "center":
        return { ...baseStyle, top: videoHeight * 0.45 };
      case "bottom":
      default:
        return { ...baseStyle, bottom: videoHeight * 0.1 };
    }
  };

  const animationStyle =
    visibleCaption.animation === "fade"
      ? { opacity: fadeAnim }
      : visibleCaption.animation === "slide"
      ? { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      : { opacity: 1 };

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.captionContainer,
          getPositionStyle(),
          animationStyle,
        ]}
      >
        <Text
          style={[
            styles.captionText,
            {
              fontSize: visibleCaption.fontSize,
              fontFamily: visibleCaption.fontFamily,
              color: visibleCaption.color,
              backgroundColor: visibleCaption.backgroundColor,
              textAlign: "center",
            },
          ]}
        >
          {visibleCaption.text}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  captionContainer: {
    position: "absolute",
    paddingHorizontal: 16,
  },
  captionText: {
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    overflow: "hidden",
  },
});
