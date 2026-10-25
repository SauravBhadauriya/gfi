import React from "react";
import { Svg, Rect } from "react-native-svg";

export const OverlayIcon = ({ size = 20, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={3}
      y={3}
      width={18}
      height={18}
      rx={2}
      stroke={color}
      strokeWidth={2}
    />
    <Rect
      x={7}
      y={7}
      width={10}
      height={10}
      rx={1}
      stroke={color}
      strokeWidth={2}
    />
  </Svg>
);
