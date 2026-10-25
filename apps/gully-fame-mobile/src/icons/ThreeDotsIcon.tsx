import React from "react";
import { Svg, Circle } from "react-native-svg";

export const ThreeDotsIcon = ({ color = "#fff", size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="1.5" fill={color} />
    <Circle cx="12" cy="5" r="1.5" fill={color} />
    <Circle cx="12" cy="19" r="1.5" fill={color} />
  </Svg>
);
