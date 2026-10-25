import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import Svg, { Path } from "react-native-svg";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeSticker, removeText, updateSticker, updateText } from "@/store/slices/editorSlice";
import type { LayerBase } from "@/types/editor.types";
import TransformableItem from "./TransformableItem";
import { TEXT_PAD_X, TEXT_PAD_Y, fontById, resolveTextColors } from "./textStyles";

interface EditLayersProps {
  frameWidth: number;
  frameHeight: number;
  /** Absolute screen Y below which a released item is deleted. */
  trashTop: number;
  /** Playback time in seconds; undefined shows every layer (photos). */
  time?: number;
  hiddenTextId?: string | null;
  onEditText: (id: string) => void;
  onDragChange: (dragging: boolean, overTrash: boolean) => void;
}

/** Layers are on screen from startTime until endTime (null = the end). */
export const isVisibleAt = (layer: Pick<LayerBase, "startTime" | "endTime">, time: number | undefined) =>
  time === undefined || (time >= layer.startTime && (layer.endTime === null || time < layer.endTime));

/**
 * The ONE renderer for everything placed over the media: texts, stickers, doodles and captions.
 * Used by the preview screen and the editor, reading the shared editorSlice, so an item added
 * in one shows in the other. (Filter and adjust apply to the media itself: see FilteredMedia.)
 */
const EditLayers: React.FC<EditLayersProps> = ({
  frameWidth,
  frameHeight,
  trashTop,
  time,
  hiddenTextId,
  onEditText,
  onDragChange,
}) => {
  const dispatch = useAppDispatch();
  const texts = useAppSelector((state) => state.editor.texts);
  const stickers = useAppSelector((state) => state.editor.stickers);
  const doodles = useAppSelector((state) => state.editor.doodles);
  const captions = useAppSelector((state) => state.editor.captions);

  if (!frameWidth || !frameHeight) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Doodles sit under stickers and text. */}
      {doodles.some((d) => isVisibleAt(d, time)) && (
        <Svg width={frameWidth} height={frameHeight} style={StyleSheet.absoluteFill} pointerEvents="none">
          {doodles
            .filter((d) => isVisibleAt(d, time) && d.points.length > 0)
            .map((d) => (
              <Path
                key={d.id}
                d={d.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x * frameWidth} ${p.y * frameHeight}`).join(" ")}
                stroke={d.color}
                strokeWidth={d.width * frameWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
        </Svg>
      )}

      {stickers
        .filter((s) => isVisibleAt(s, time))
        .map((s) => (
          <TransformableItem
            key={s.id}
            x={s.x}
            y={s.y}
            scale={s.scale}
            rotation={s.rotation}
            frameWidth={frameWidth}
            frameHeight={frameHeight}
            trashTop={trashTop}
            onDragChange={onDragChange}
            onCommit={(tr) => dispatch(updateSticker({ id: s.id, updates: tr }))}
            onDelete={() => dispatch(removeSticker(s.id))}
          >
            <Image
              source={{ uri: s.imageUrl }}
              style={{ width: s.size * frameWidth, height: s.size * frameWidth }}
              contentFit="contain"
            />
          </TransformableItem>
        ))}

      {texts
        .filter((t) => t.id !== hiddenTextId && isVisibleAt(t, time))
        .map((t) => {
          const font = fontById(t.fontFamily);
          const fontPx = t.fontSize * frameWidth;
          const colors = resolveTextColors(t.color, t.background ?? "none");
          return (
            <TransformableItem
              key={t.id}
              x={t.x}
              y={t.y}
              scale={t.scale ?? 1}
              rotation={t.rotation}
              frameWidth={frameWidth}
              frameHeight={frameHeight}
              trashTop={trashTop}
              onTap={() => onEditText(t.id)}
              onDragChange={onDragChange}
              onCommit={(tr) => dispatch(updateText({ id: t.id, updates: tr }))}
              onDelete={() => dispatch(removeText(t.id))}
              onMeasure={(w, h) =>
                dispatch(updateText({ id: t.id, updates: { boxWidth: w / frameWidth, boxHeight: h / frameHeight } }))
              }
            >
              <View
                style={[
                  styles.box,
                  colors.box && {
                    backgroundColor: colors.box,
                    paddingHorizontal: fontPx * TEXT_PAD_X,
                    paddingVertical: fontPx * TEXT_PAD_Y,
                  },
                ]}
              >
                {/* Part of the picture, so ignore the system font scale (export can't apply it). */}
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: font.rnFamily,
                    fontSize: fontPx,
                    color: colors.text,
                    textAlign: t.alignment ?? "center",
                    maxWidth: frameWidth * 0.9,
                  }}
                  onTextLayout={(e) => {
                    const lines = e.nativeEvent.lines.map((l) => l.text.replace(/\s+$/, ""));
                    if (JSON.stringify(lines) !== JSON.stringify(t.lines)) {
                      dispatch(updateText({ id: t.id, updates: { lines } }));
                    }
                  }}
                >
                  {t.text}
                </Text>
              </View>
            </TransformableItem>
          );
        })}

      {/* Captions: one line block at top / centre / bottom of the frame. */}
      {captions
        .filter((c) => isVisibleAt(c, time))
        .map((c) => (
          <View
            key={c.id}
            pointerEvents="none"
            style={[
              styles.caption,
              c.position === "top" ? { top: frameHeight * 0.08 } : c.position === "center" ? { top: frameHeight * 0.45 } : { bottom: frameHeight * 0.1 },
            ]}
          >
            <View style={{ backgroundColor: c.backgroundColor, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "center" }}>
              <Text
                allowFontScaling={false}
                style={{
                  color: c.color,
                  fontSize: Math.round(c.fontSize * (frameWidth / 360)),
                  fontFamily: c.fontFamily === "System" ? undefined : c.fontFamily,
                  textAlign: "center",
                  // The box is measured around the text; without this a sub-pixel difference wraps the last word.
                  flexShrink: 0,
                  minWidth: "100%",
                }}
              >
                {c.text}
              </Text>
            </View>
          </View>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  box: { borderRadius: 8 },
  caption: { position: "absolute", left: 0, right: 0 },
});

export default EditLayers;
