import React from "react";
import { Svg, Path, Rect } from "react-native-svg";

export const ReelIcon = ({ color }: { color: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="2"
      stroke={color}
      strokeWidth="1"
    />
    <Path d="M10 8l6 4-6 4V8z" fill={color} />
  </Svg>
);
