import React from "react";
import { Svg, Circle, Path } from "react-native-svg";

export const MyFameIcon = ({ color }: { color: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="5" stroke={color} strokeWidth="1" />
    <Path
      d="M3 21c0-3.87 3.13-7 7-7h4c3.87 0 7 3.13 7 7"
      stroke={color}
      strokeWidth="1"
      strokeLinecap="round"
    />
  </Svg>
);
