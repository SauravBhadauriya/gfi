/**
 * Fonts available to preview text. Each one is loaded in app/_layout.tsx (rnFamily)
 * and its TTF is handed to FFmpeg/libass at export (assFamily + file).
 * assSizeFactor converts a React Native fontSize (em size) to a libass \fs value:
 * libass sizes fonts by usWinAscent + usWinDescent (read from each TTF's OS/2 table).
 */
export interface TextFont {
  id: string;
  label: string;
  rnFamily: string;
  assFamily: string;
  assSizeFactor: number;
  file: number;
}

export const TEXT_FONTS: TextFont[] = [
  {
    id: "rubik",
    label: "Bold",
    rnFamily: "Rubik_700Bold",
    assFamily: "Rubik",
    assSizeFactor: 1.532,
    file: require("@expo-google-fonts/rubik/700Bold/Rubik_700Bold.ttf"),
  },
  {
    id: "playfair",
    label: "Serif",
    rnFamily: "PlayfairDisplay_700Bold",
    assFamily: "Playfair Display",
    assSizeFactor: 1.41,
    file: require("@expo-google-fonts/playfair-display/700Bold/PlayfairDisplay_700Bold.ttf"),
  },
  {
    id: "inter",
    label: "Clean",
    rnFamily: "Inter_700Bold",
    assFamily: "Inter",
    assSizeFactor: 1.43,
    file: require("@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf"),
  },
];

export const fontById = (id?: string) => TEXT_FONTS.find(f => f.id === id) ?? TEXT_FONTS[0];

export const TEXT_COLORS = ["#FFFFFF", "#000000", "#FFD000", "#FF3B30", "#FF2D92", "#34C759", "#0A84FF", "#AF52DE"];

/** none: plain text; solid: box in the chosen colour; translucent: dark see-through box. */
export type TextBackground = "none" | "solid" | "translucent";

/** Default font size as a fraction of the media frame width. */
export const DEFAULT_TEXT_SIZE = 0.075;
/** Box padding as a fraction of the font size. */
export const TEXT_PAD_X = 0.35;
export const TEXT_PAD_Y = 0.15;

const isLight = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 > 160;
};

/** Resolves what is drawn: text colour and box colour for a style choice. */
export function resolveTextColors(color: string, background: TextBackground) {
  if (background === "solid") return { text: isLight(color) ? "#000000" : "#FFFFFF", box: color };
  if (background === "translucent") return { text: color, box: "rgba(0,0,0,0.55)" };
  return { text: color, box: undefined };
}
