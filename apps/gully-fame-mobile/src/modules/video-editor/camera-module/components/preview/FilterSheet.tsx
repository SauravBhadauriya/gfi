import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";

import type { EditorFilter } from "@/types/editor.types";
import { runFFmpeg, toFFmpegPath } from "../../utils/ffmpeg";
import { DEFAULT_FILTER_INTENSITY, FILTERS } from "./filterPresets";
import { FilteredMedia, type PreviewMediaType } from "./PreviewMedia";

interface FilterSheetProps {
  mediaType: PreviewMediaType;
  /** First clip (video) or the photo, used for the preset thumbnails. */
  sourceUri: string;
  filter: EditorFilter | null;
  bottomInset: number;
  onChange: (filter: EditorFilter | null) => void;
  onDone: () => void;
}

const YELLOW = "#FFD000";

/** One small frame of a video for the preset thumbnails. */
async function videoThumbnail(uri: string): Promise<string> {
  const out = toFFmpegPath(`${FileSystem.cacheDirectory}filter_thumb_${Date.now()}.jpg`);
  await runFFmpeg(["-i", toFFmpegPath(uri), "-frames:v", "1", "-update", "1", "-vf", "scale=-2:240", "-q:v", "4", "-y", out], "filter thumbnail");
  return `file://${out}`;
}

/** Bottom sheet: preset strip with live thumbnails and an intensity slider. Changes apply instantly. */
const FilterSheet: React.FC<FilterSheetProps> = ({ mediaType, sourceUri, filter, bottomInset, onChange, onDone }) => {
  const [thumb, setThumb] = useState<string | null>(mediaType === "photo" ? sourceUri : null);
  const selectedId = filter?.id ?? "normal";
  const active = !!filter && filter.id !== "normal";

  useEffect(() => {
    if (mediaType === "photo") return;
    let cancelled = false;
    videoThumbnail(sourceUri)
      .then((uri) => !cancelled && setThumb(uri))
      .catch(() => {}); // runFFmpeg already logged it; the strip still works without pictures.
    return () => {
      cancelled = true;
    };
  }, [mediaType, sourceUri]);

  const choose = (id: string) => {
    if (id === "normal") onChange(null);
    else onChange({ id, intensity: id === filter?.id ? filter.intensity : DEFAULT_FILTER_INTENSITY });
  };

  return (
    <View style={[styles.sheet, { paddingBottom: bottomInset + 12 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Filters</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={onDone} accessibilityLabel="Done">
          <Ionicons name="checkmark" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={[styles.sliderRow, !active && styles.disabled]} pointerEvents={active ? "auto" : "none"}>
        <Text style={styles.sliderLabel}>Intensity</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          value={filter?.intensity ?? DEFAULT_FILTER_INTENSITY}
          onValueChange={(intensity) => filter && onChange({ id: filter.id, intensity })}
          minimumTrackTintColor={YELLOW}
          maximumTrackTintColor="rgba(255,255,255,0.3)"
          thumbTintColor={YELLOW}
          accessibilityLabel="Filter intensity"
        />
        <Text style={styles.sliderValue}>{Math.round((filter?.intensity ?? DEFAULT_FILTER_INTENSITY) * 100)}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {FILTERS.map((preset) => {
          const selected = preset.id === selectedId;
          return (
            <TouchableOpacity key={preset.id} style={styles.item} onPress={() => choose(preset.id)} accessibilityLabel={`Filter ${preset.label}`}>
              <View style={[styles.thumb, selected && styles.thumbSelected]}>
                {thumb ? (
                  <FilteredMedia filter={{ id: preset.id, intensity: DEFAULT_FILTER_INTENSITY }}>
                    <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  </FilteredMedia>
                ) : (
                  <ActivityIndicator color="#fff" />
                )}
              </View>
              <Text style={[styles.label, selected && styles.labelSelected]}>{preset.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#111",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 12,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  title: { color: "#fff", fontSize: 16, fontWeight: "700" },
  doneBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: YELLOW, alignItems: "center", justifyContent: "center" },
  sliderRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginTop: 6 },
  disabled: { opacity: 0.35 },
  sliderLabel: { color: "#fff", fontSize: 13, fontWeight: "600", width: 64 },
  slider: { flex: 1, height: 36 },
  sliderValue: { color: "#fff", fontSize: 13, fontWeight: "600", width: 32, textAlign: "right" },
  strip: { paddingHorizontal: 12, gap: 10, paddingTop: 8 },
  item: { alignItems: "center", width: 64 },
  thumb: {
    width: 62,
    height: 84,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#222",
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbSelected: { borderColor: YELLOW },
  label: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "600", marginTop: 6 },
  labelSelected: { color: YELLOW },
});

export default FilterSheet;
