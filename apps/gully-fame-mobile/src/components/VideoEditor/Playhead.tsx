import React from "react";
import { View, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";

interface PlayheadProps {
  height: number;
}

const Playhead: React.FC<PlayheadProps> = ({ height }) => {
  return (
    <Animated.View
      style={[
        styles.playhead,
        {
          height,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  playhead: {
    position: "absolute",
    width: 2,
    backgroundColor: "#fff",
    left: "50%",
    marginLeft: -1,
    zIndex: 100,
  },
});

export default Playhead;
