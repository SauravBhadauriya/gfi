import React from "react";
import Svg, { Path, Rect, Circle } from "react-native-svg";

// Small Gully Fame profile icons, drawn for this app.

export const GridTabIcon = ({ size = 22, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7.5" height="7.5" rx="1.6" stroke={color} strokeWidth={1.8} />
    <Rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" stroke={color} strokeWidth={1.8} />
    <Rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" stroke={color} strokeWidth={1.8} />
    <Rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" stroke={color} strokeWidth={1.8} />
  </Svg>
);

export const ReelsTabIcon = ({ size = 22, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="16" rx="4" stroke={color} strokeWidth={1.8} />
    <Path d="M10 9.2v5.6l4.6-2.8L10 9.2z" fill={color} />
  </Svg>
);

export const PhotoTabIcon = ({ size = 22, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="16" rx="4" stroke={color} strokeWidth={1.8} />
    <Circle cx="9" cy="9.5" r="1.8" stroke={color} strokeWidth={1.6} />
    <Path d="M4 17.5l5-4.5 3.5 3 3-2.5L20 17" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
  </Svg>
);

export const PlusIcon = ({ size = 22, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const AddContentIcon = ({ size = 24, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke={color} strokeWidth={1.8} />
    <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const MultiItemBadgeIcon = ({ size = 16, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="7" y="3" width="14" height="14" rx="3" stroke={color} strokeWidth={2} />
    <Path d="M17 21H6a3 3 0 0 1-3-3V7" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const HeartOutlineIcon = ({ size = 22, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 20.3s-7.6-4.6-9.2-9.4C1.9 8 3.6 4.8 6.9 4.5c2-.2 3.6.9 5.1 2.7 1.5-1.8 3.1-2.9 5.1-2.7 3.3.3 5 3.5 4.1 6.4-1.6 4.8-9.2 9.4-9.2 9.4z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </Svg>
);
