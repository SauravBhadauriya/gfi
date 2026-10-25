import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import type { EditorAdjust, EditorFilter } from "@/types/editor.types";
import { previewFilterStyle, previewTintColor } from "./filterPresets";

export type PreviewMediaType = "video" | "photo";

export interface PreviewClip {
  id: string;
  uri: string;
  duration: number;
  trimStart?: number;
  trimEnd?: number;
  type?: PreviewMediaType;
}

interface PreviewMediaProps {
  mediaType: PreviewMediaType;
  clips: PreviewClip[];
  /** False when the screen is blurred or a sheet needs the video paused. */
  active: boolean;
  /** Show the mute toggle (only when no music track is selected). */
  showMuteToggle: boolean;
  topInset: number;
  /**
   * Edit layers drawn over the media, inside the rounded frame. A function receives the
   * playback time in seconds (undefined for photos), so only this component re-renders on ticks.
   */
  overlay?: React.ReactNode | ((time: number | undefined) => React.ReactNode);
  onFrameLayout?: (size: { width: number; height: number }) => void;
  /** Colour filter and adjust shown live on the media (not on the overlays). */
  filter?: EditorFilter | null;
  adjust?: EditorAdjust | null;
  /** Called with the playback time (seconds on the whole sequence). */
  onTime?: (time: number) => void;
}

export const MEDIA_RADIUS = 30;

/** Plays all clips back to back on one player, looping the sequence. */
const VideoSequence: React.FC<Omit<PreviewMediaProps, "mediaType" | "overlay" | "onFrameLayout"> & { onClock: (t: number) => void }> = ({
  clips,
  active,
  showMuteToggle,
  topInset,
  filter,
  adjust,
  onClock,
}) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const single = clips.length <= 1;

  const player = useVideoPlayer(clips[0]?.uri ?? null, p => {
    p.loop = single;
    p.timeUpdateEventInterval = 0.1;
    p.play();
  });

  // Report the time on the whole sequence (previous clips' lengths + position in this clip).
  useEffect(() => {
    const before = clips.slice(0, index).reduce((sum, c) => sum + ((c.trimEnd ?? c.duration) - (c.trimStart ?? 0)), 0);
    const start = clips[index]?.trimStart ?? 0;
    const sub = player.addListener("timeUpdate", ({ currentTime }) => onClock(before + Math.max(0, currentTime - start)));
    return () => sub.remove();
  }, [player, clips, index, onClock]);

  // Advance to the next clip when one finishes (multi-clip only).
  useEffect(() => {
    if (single) return;
    const sub = player.addListener("playToEnd", () => {
      setIndex(i => (i + 1) % clips.length);
    });
    return () => sub.remove();
  }, [player, single, clips.length]);

  useEffect(() => {
    if (single || !clips[index]) return;
    player.replaceAsync({ uri: clips[index].uri }).then(() => {
      if (!paused && active) player.play();
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    if (active && !paused) player.play();
    else player.pause();
  }, [active, paused, player]);

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  const togglePlay = useCallback(() => setPaused(p => !p), []);

  return (
    <>
      <FilteredMedia filter={filter} adjust={adjust}>
        {/* TextureView: a SurfaceView would bypass the filter's colour matrix on Android. */}
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} surfaceType="textureView" />
      </FilteredMedia>
      <Pressable style={StyleSheet.absoluteFill} onPress={togglePlay} accessibilityLabel={paused ? "Play" : "Pause"}>
        {paused && (
          <View style={styles.playBadge} pointerEvents="none">
            <Ionicons name="play" size={34} color="#fff" />
          </View>
        )}
      </Pressable>
      {showMuteToggle && (
        <TouchableOpacity
          style={[styles.muteBtn, { top: topInset + 4 }]}
          onPress={() => setMuted(m => !m)}
          accessibilityLabel={muted ? "Unmute" : "Mute"}
        >
          <MaterialCommunityIcons name={muted ? "volume-off" : "volume-high"} size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </>
  );
};

/** Media with the colour filter applied, plus the filter's tint layer on top. */
export const FilteredMedia: React.FC<{
  filter?: EditorFilter | null;
  adjust?: EditorAdjust | null;
  children: React.ReactNode;
}> = ({ filter, adjust, children }) => {
  const tint = previewTintColor(filter ?? null);
  return (
    <>
      {/* Never flattened: removing the filter would otherwise re-parent the native video view and crash. */}
      <View collapsable={false} style={[StyleSheet.absoluteFill, { filter: previewFilterStyle(filter ?? null, adjust ?? null) }]}>
        {children}
      </View>
      {tint && <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} pointerEvents="none" />}
    </>
  );
};

const PreviewMedia: React.FC<PreviewMediaProps> = props => {
  const { mediaType, clips, overlay, onFrameLayout, filter, adjust, onTime } = props;
  const [time, setTime] = useState<number | undefined>(mediaType === "video" ? 0 : undefined);
  const onClock = useCallback(
    (t: number) => {
      setTime(t);
      onTime?.(t);
    },
    [onTime]
  );
  return (
    <View
      style={styles.frame}
      onLayout={e => onFrameLayout?.({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      {mediaType === "photo" ? (
        clips[0] ? (
          <FilteredMedia filter={filter} adjust={adjust}>
            <Image source={{ uri: clips[0].uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          </FilteredMedia>
        ) : null
      ) : (
        <VideoSequence {...props} onClock={onClock} />
      )}
      {typeof overlay === "function" ? overlay(time) : overlay}
    </View>
  );
};

const styles = StyleSheet.create({
  frame: { flex: 1, borderRadius: MEDIA_RADIUS, overflow: "hidden", backgroundColor: "#111" },
  playBadge: {
    position: "absolute",
    alignSelf: "center",
    top: "45%",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 4,
  },
  muteBtn: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default PreviewMedia;
