import React from "react";
import { Svg, Circle, Path } from "react-native-svg";

export const PlayIconCircular = ({ color = "#fff", size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="12"
      cy="12"
      r="10"
      fill="rgba(0,0,0,0.6)"
      stroke={color}
      strokeWidth={2}
    />
    <Path d="M10 8l6 4-6 4V8z" fill={color} />
  </Svg>
);
