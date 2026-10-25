import React from "react";
import { Svg, Path } from "react-native-svg";

export const CaretRightIcon = ({ size = 20, strokeWidth = 2.5 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke="#ffffff"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
