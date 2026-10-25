import React from "react";
import { Svg, Path } from "react-native-svg";

export const SoundFXIcon = ({ size = 20, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2v20M8 6h8M8 12h8M8 18h8"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);
