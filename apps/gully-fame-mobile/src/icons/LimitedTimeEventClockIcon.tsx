import React from "react";
import { Svg, Circle, Path } from "react-native-svg";

export const LimitedTimeEventClockIcon = ({
  size = 20,
  strokeWidth = 1.368,
  circleSize = 12,
  circleRadius = 9,
  color = "#EC9A15",
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 8V12L15 15"
        stroke="#EC9A15"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Circle
        cx={circleSize}
        cy={circleSize}
        r={circleRadius}
        stroke={color}
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
};
