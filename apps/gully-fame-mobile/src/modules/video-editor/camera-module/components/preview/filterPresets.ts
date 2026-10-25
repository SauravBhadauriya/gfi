import type { ViewStyle } from "react-native";

import type { EditorAdjust, EditorFilter } from "@/types/editor.types";

/**
 * Preview-screen colour filters. One recipe drives both the live preview
 * (React Native `filter` style + a tint view) and the FFmpeg export, so the
 * baked file matches what the user saw.
 */
export type FilterId = "normal" | "warm" | "cool" | "bw" | "vintage" | "vivid";

interface FilterRecipe {
  grayscale?: number;
  sepia?: number;
  saturate?: number;
  brightness?: number;
  contrast?: number;
  /** Colour laid over the filtered media with normal alpha blending. */
  tint?: { rgb: [number, number, number]; alpha: number };
}

export const FILTERS: { id: FilterId; label: string; recipe: FilterRecipe }[] = [
  { id: "normal", label: "Normal", recipe: {} },
  { id: "warm", label: "Warm", recipe: { sepia: 0.25, saturate: 1.2, brightness: 1.03, contrast: 1.05, tint: { rgb: [255, 140, 40], alpha: 0.1 } } },
  { id: "cool", label: "Cool", recipe: { saturate: 0.95, brightness: 1.02, contrast: 1.05, tint: { rgb: [40, 120, 255], alpha: 0.14 } } },
  { id: "bw", label: "B&W", recipe: { grayscale: 1, contrast: 1.15 } },
  { id: "vintage", label: "Vintage", recipe: { sepia: 0.55, saturate: 0.85, brightness: 1.05, contrast: 0.9, tint: { rgb: [255, 214, 160], alpha: 0.1 } } },
  { id: "vivid", label: "Vivid", recipe: { saturate: 1.6, brightness: 1.02, contrast: 1.15 } },
];

export const DEFAULT_FILTER_INTENSITY = 1;

/**
 * Backend filters (GET /public/filters) are a name plus an asset; the app
 * renders filters on-device, so a backend filter maps to the preset whose
 * id or label matches its name. Returns null when there is no such preset.
 */
export function matchPresetByName(name?: string | null): FilterId | null {
  const key = String(name || "").trim().toLowerCase().replace(/[^a-z&]/g, "");
  if (!key) return null;
  const preset = FILTERS.find(
    (f) => f.id === key || f.label.toLowerCase().replace(/[^a-z&]/g, "") === key || (key === "blackwhite" && f.id === "bw")
  );
  return preset && preset.id !== "normal" ? preset.id : null;
}

/** The recipe scaled by intensity (0 = no change, 1 = full preset). */
function scaledRecipe(filter: EditorFilter | null): Required<Omit<FilterRecipe, "tint">> & Pick<FilterRecipe, "tint"> {
  const recipe = FILTERS.find((f) => f.id === filter?.id)?.recipe ?? {};
  const t = filter ? Math.min(1, Math.max(0, filter.intensity)) : 0;
  const toward = (target: number | undefined, identity: number) => identity + ((target ?? identity) - identity) * t;
  return {
    grayscale: toward(recipe.grayscale, 0),
    sepia: toward(recipe.sepia, 0),
    saturate: toward(recipe.saturate, 1),
    brightness: toward(recipe.brightness, 1),
    contrast: toward(recipe.contrast, 1),
    tint: recipe.tint && t > 0 ? { rgb: recipe.tint.rgb, alpha: recipe.tint.alpha * t } : undefined,
  };
}

export const isFilterActive = (filter: EditorFilter | null) =>
  !!filter && filter.id !== "normal" && filter.intensity > 0;

/**
 * `filter` style for the view that wraps the media.
 * Android composes the list with ColorMatrix.preConcat, so the LAST entry is applied
 * to the pixels first. Listed so the pixels see: grayscale, sepia, saturate, brightness, contrast
 * (the order the export uses).
 */
export function previewFilterStyle(filter: EditorFilter | null, adjust?: EditorAdjust | null): ViewStyle["filter"] {
  const ops: any[] = [];

  // Adjust goes first in the list, so it is applied after the preset.
  if (adjust) {
    const contrast = 1 + adjust.contrast / 100;
    const saturate = 1 + adjust.saturation / 100;
    const brightness = (1 + adjust.brightness / 100) * (1 + adjust.exposure / 100);
    if (contrast !== 1) ops.push({ contrast });
    if (saturate !== 1) ops.push({ saturate });
    if (brightness !== 1) ops.push({ brightness });
  }

  if (isFilterActive(filter)) {
    const r = scaledRecipe(filter);
    if (r.contrast !== 1) ops.push({ contrast: r.contrast });
    if (r.brightness !== 1) ops.push({ brightness: r.brightness });
    if (r.saturate !== 1) ops.push({ saturate: r.saturate });
    if (r.sepia !== 0) ops.push({ sepia: r.sepia });
    if (r.grayscale !== 0) ops.push({ grayscale: r.grayscale });
  }
  return ops.length ? ops : undefined;
}

/** Background colour for the tint view drawn over the filtered media, or undefined. */
export function previewTintColor(filter: EditorFilter | null): string | undefined {
  if (!isFilterActive(filter)) return undefined;
  const tint = scaledRecipe(filter).tint;
  return tint ? `rgba(${tint.rgb.join(",")},${tint.alpha.toFixed(3)})` : undefined;
}

type Mat3 = number[][];

const multiply = (a: Mat3, b: Mat3): Mat3 =>
  a.map((row) => [0, 1, 2].map((j) => row[0] * b[0][j] + row[1] * b[1][j] + row[2] * b[2][j]));

// Same coefficients as React Native's Android FilterHelper / android.graphics.ColorMatrix.
const grayscaleMatrix = (a: number): Mat3 => {
  const i = 1 - a;
  return [
    [0.2126 + 0.7874 * i, 0.7152 - 0.7152 * i, 0.0722 - 0.0722 * i],
    [0.2126 - 0.2126 * i, 0.7152 + 0.2848 * i, 0.0722 - 0.0722 * i],
    [0.2126 - 0.2126 * i, 0.7152 - 0.7152 * i, 0.0722 + 0.9278 * i],
  ];
};
const sepiaMatrix = (a: number): Mat3 => {
  const i = 1 - a;
  return [
    [0.393 + 0.607 * i, 0.769 - 0.769 * i, 0.189 - 0.189 * i],
    [0.349 - 0.349 * i, 0.686 + 0.314 * i, 0.168 - 0.168 * i],
    [0.272 - 0.272 * i, 0.534 - 0.534 * i, 0.131 + 0.869 * i],
  ];
};
const saturateMatrix = (s: number): Mat3 => {
  const i = 1 - s;
  return [
    [0.213 * i + s, 0.715 * i, 0.072 * i],
    [0.213 * i, 0.715 * i + s, 0.072 * i],
    [0.213 * i, 0.715 * i, 0.072 * i + s],
  ];
};
const scaleMatrix = (b: number): Mat3 => [
  [b, 0, 0],
  [0, b, 0],
  [0, 0, b],
];

const num = (v: number) => (Math.abs(v) < 1e-5 ? "0" : v.toFixed(4));

/**
 * FFmpeg filter chain (comma separated, no labels) reproducing the preview:
 * colorchannelmixer for grayscale/sepia/saturate/brightness, then one lutrgb
 * for contrast and the tint blend. Empty string when nothing to apply.
 */
export function ffmpegFilterChain(filter: EditorFilter | null): string {
  if (!isFilterActive(filter)) return "";
  const r = scaledRecipe(filter);
  const chain: string[] = [];

  // Applied to the pixel in this order: grayscale, sepia, saturate, brightness.
  let m: Mat3 = scaleMatrix(1);
  m = multiply(grayscaleMatrix(r.grayscale), m);
  m = multiply(sepiaMatrix(r.sepia), m);
  m = multiply(saturateMatrix(r.saturate), m);
  m = multiply(scaleMatrix(r.brightness), m);
  const isIdentity = m.every((row, i) => row.every((v, j) => Math.abs(v - (i === j ? 1 : 0)) < 1e-5));
  if (!isIdentity) {
    const names = ["r", "g", "b"];
    const params = m.flatMap((row, i) => row.map((v, j) => `${names[i]}${names[j]}=${num(v)}`));
    chain.push(`colorchannelmixer=${params.join(":")}`);
  }

  const hasContrast = Math.abs(r.contrast - 1) > 1e-5;
  if (hasContrast || r.tint) {
    // contrast: v*c + 127.5*(1-c), clamped; tint: v*(1-a) + a*T. lutrgb clamps the result.
    const channel = (k: number) => {
      let expr = hasContrast ? `clip(val*${num(r.contrast)}+${num(127.5 * (1 - r.contrast))},0,255)` : "val";
      if (r.tint) expr = `${expr}*${num(1 - r.tint.alpha)}+${num(r.tint.alpha * r.tint.rgb[k])}`;
      return expr.replace(/\+-/g, "-");
    };
    // Quoted so the commas inside clip() are not read as filter separators.
    chain.push(`lutrgb='r=${channel(0)}:g=${channel(1)}:b=${channel(2)}'`);
  }
  return chain.join(",");
}
