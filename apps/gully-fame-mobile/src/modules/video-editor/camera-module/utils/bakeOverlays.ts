import * as FileSystem from "expo-file-system/legacy";
import { Asset } from "expo-asset";

import type { TextItem } from "@/types/editor.types";
import { toFFmpegPath } from "./ffmpeg";
import {
  TEXT_FONTS,
  TEXT_PAD_X,
  TEXT_PAD_Y,
  fontById,
  resolveTextColors,
} from "../components/preview/textStyles";

/** The on-screen media frame the edits were placed in (media shown with contentFit="cover"). */
export interface FrameSize {
  width: number;
  height: number;
}

const FONTS_DIR = `${FileSystem.cacheDirectory}ass-fonts/`;

/** Copies the bundled TTFs to one folder libass can load them from. */
export async function ensureFonts(): Promise<string> {
  await FileSystem.makeDirectoryAsync(FONTS_DIR, { intermediates: true });
  for (const font of TEXT_FONTS) {
    const target = `${FONTS_DIR}${font.id}.ttf`;
    if ((await FileSystem.getInfoAsync(target)).exists) continue;
    const [asset] = await Asset.loadAsync(font.file);
    if (!asset.localUri) throw new Error(`Font ${font.label} could not be loaded`);
    await FileSystem.copyAsync({ from: asset.localUri, to: target });
  }
  return toFFmpegPath(FONTS_DIR);
}

/** "#RRGGBB" or "rgba(r,g,b,a)" to ASS "&HAABBGGRR" (ASS alpha: 00 opaque, FF transparent). */
function assColor(color: string): string {
  let r = 255, g = 255, b = 255, a = 1;
  const rgba = color.match(/rgba?\(([^)]+)\)/);
  if (rgba) {
    [r, g, b] = rgba[1].split(",").slice(0, 3).map((v) => Number(v.trim()));
    a = Number(rgba[1].split(",")[3] ?? 1);
  } else {
    const n = parseInt(color.replace("#", ""), 16);
    r = (n >> 16) & 255;
    g = (n >> 8) & 255;
    b = n & 255;
  }
  const hex = (v: number) => Math.round(v).toString(16).padStart(2, "0").toUpperCase();
  return `&H${hex((1 - a) * 255)}${hex(b)}${hex(g)}${hex(r)}`;
}

const assText = (s: string) => s.replace(/\\/g, "/").replace(/[{}]/g, (c) => (c === "{" ? "(" : ")"));
const fmt = (v: number) => v.toFixed(1);

/**
 * Builds an ASS script that reproduces the preview texts in media pixel space.
 * The preview shows media with contentFit="cover", so frame coordinates are mapped
 * back through the same scale and crop.
 */
export function buildTextAss(texts: TextItem[], frame: FrameSize, media: { width: number; height: number }) {
  const s = Math.max(frame.width / media.width, frame.height / media.height);
  const offX = (frame.width - media.width * s) / 2;
  const offY = (frame.height - media.height * s) / 2;

  const events = texts.map((t) => {
    const font = fontById(t.fontFamily);
    const scale = t.scale ?? 1;
    const fontPx = (t.fontSize * frame.width * scale) / s;
    const colors = resolveTextColors(t.color, t.background ?? "none");
    const cx = (t.x * frame.width - offX) / s;
    const cy = (t.y * frame.height - offY) / s;
    const padX = colors.box ? fontPx * TEXT_PAD_X : 0;
    const padY = colors.box ? fontPx * TEXT_PAD_Y : 0;
    const halfInner = ((t.boxWidth ?? 0) * frame.width * scale) / s / 2 - padX;
    const align = t.alignment ?? "center";
    const [an, px] = align === "left" ? [4, cx - halfInner] : align === "right" ? [6, cx + halfInner] : [5, cx];

    const tags = [
      `\\an${an}`,
      `\\pos(${fmt(px)},${fmt(cy)})`,
      `\\org(${fmt(cx)},${fmt(cy)})`,
      `\\frz${fmt(-t.rotation)}`,
      `\\fn${font.assFamily}`,
      "\\b1",
      `\\fs${fmt(fontPx * font.assSizeFactor)}`,
      `\\c${assColor(colors.text)}`,
      colors.box ? `\\3c${assColor(colors.box)}\\xbord${fmt(padX)}\\ybord${fmt(padY)}` : "\\bord0",
      "\\shad0",
    ].join("");
    const body = (t.lines?.length ? t.lines : t.text.split("\n")).map(assText).join("\\N");
    return `Dialogue: 0,0:00:00.00,9:59:59.00,${colors.box ? "Box" : "Plain"},,0,0,0,,{${tags}}${body}`;
  });

  return [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${media.width}`,
    `PlayResY: ${media.height}`,
    "WrapStyle: 2",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    "Style: Plain,Rubik,48,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,5,0,0,0,1",
    "Style: Box,Rubik,48,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,3,0,0,5,0,0,0,1",
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ...events,
    "",
  ].join("\n");
}
