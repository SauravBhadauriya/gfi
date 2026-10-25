import React from "react";
import { Svg, Circle, Path, G } from "react-native-svg";

export const MedalIcon = ({
  rank,
  size = 40,
}: {
  rank: number;
  size?: number;
}) => {
  const colors = {
    1: { bg: "#FFD700", text: "#000", ribbon: "#DC143C" }, // Gold
    2: { bg: "#C0C0C0", text: "#000", ribbon: "#DC143C" }, // Silver
    3: { bg: "#CD7F32", text: "#fff", ribbon: "#DC143C" }, // Bronze
  };
  const color = colors[rank as keyof typeof colors] || {
    bg: "#666",
    text: "#fff",
    ribbon: "#DC143C",
  };

  // Roman numeral paths - better positioned
  const romanPaths = {
    1: "M20 22 L20 28", // I - vertical line centered
    2: "M16 22 L24 22 M16 24 L24 24", // II - two horizontal lines
    3: "M16 22 L24 22 M16 24 L24 24 M16 26 L24 26", // III - three horizontal lines
  };

  return (
    <Svg width={size} height={size * 1.25} viewBox="0 0 40 50">
      <G>
        {/* Ribbon - Top portion */}
        <Path d="M16 0 L24 0 L24 8 L16 8 Z" fill={color.ribbon} />
        {/* Ribbon - Loop/hanging part */}
        <Path d="M16 8 Q20 10 24 8 Q20 14 16 8" fill={color.ribbon} />
        {/* Medal Body - Circular */}
        <Circle
          cx="20"
          cy="28"
          r="12"
          fill={color.bg}
          stroke="#8B0000"
          strokeWidth="1.5"
        />
        {/* Roman Numeral */}
        <Path
          d={romanPaths[rank as keyof typeof romanPaths] || romanPaths[1]}
          stroke={color.text}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
};
