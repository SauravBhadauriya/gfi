import React from "react";
import { Svg, Path } from "react-native-svg";

export const SoundOnIcon = ({ size = 20, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9v6h4l5 5V4L7 9H3zM16 10c0-2-1.5-3.5-3.5-3.5M16 14c0 2-1.5 3.5-3.5 3.5M19 8c0 4-3 7-7 7M19 16c0 4-3 7-7 7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
