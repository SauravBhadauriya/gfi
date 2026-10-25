import React from "react";
import { Svg, Path } from "react-native-svg";

export const SoundOffIcon = ({ size = 20, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9v6h4l5 5V4L7 9H3zM17 5l-6 6M17 19l-6-6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
