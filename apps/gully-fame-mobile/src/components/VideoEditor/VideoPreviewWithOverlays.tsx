import { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { VideoView } from "expo-video";
import { Image } from "expo-image";

import { useAppSelector } from "@/store/hooks";
import EditLayers from "@modules/video-editor/camera-module/components/preview/EditLayers";
import { FilteredMedia } from "@modules/video-editor/camera-module/components/preview/PreviewMedia";
import CutoutOverlay from "./CutoutOverlay";
import OverlayLayer from "./OverlayLayer";
import type { OverlayItem } from "./OverlayToolPanel";
import type { CutoutSettings } from "./CutoutToolPanel";

interface VideoPreviewWithOverlaysProps {
  player: any; // VideoPlayer from expo-video
  /** Set while a photo clip is on screen: drawn over the (paused) video. */
  photoUri?: string;
  currentTime: number;
  overlays: OverlayItem[];
  cutoutSettings: CutoutSettings;
  /** Screen Y below which a dragged layer is deleted. */
  trashTop: number;
  hiddenTextId?: string | null;
  onEditText: (id: string) => void;
  onDragChange: (dragging: boolean, overTrash: boolean) => void;
}

/**
 * The editor's preview: the media with the shared colour filter and adjust, then the shared
 * EditLayers (texts, stickers, doodles, captions), so it matches the preview screen.
 */
export default function VideoPreviewWithOverlays({
  player,
  photoUri,
  currentTime,
  overlays,
  cutoutSettings,
  trashTop,
  hiddenTextId,
  onEditText,
  onDragChange,
}: VideoPreviewWithOverlaysProps) {
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const filter = useAppSelector((state) => state.editor.filter);
  const adjust = useAppSelector((state) => state.editor.adjust);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setFrame({ width, height });
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <FilteredMedia filter={filter} adjust={adjust}>
        {/* cover = the same crop the preview screen and the export use. */}
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
          // TextureView shows the paused first frame (SurfaceView stayed black until play)
          // and lets colour filters apply to the video.
          surfaceType="textureView"
        />
        {photoUri && <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />}
      </FilteredMedia>

      <CutoutOverlay cutoutSettings={cutoutSettings} />

      <EditLayers
        frameWidth={frame.width}
        frameHeight={frame.height}
        trashTop={trashTop}
        time={currentTime}
        hiddenTextId={hiddenTextId}
        onEditText={onEditText}
        onDragChange={onDragChange}
      />

      {overlays.length > 0 && (
        <OverlayLayer overlays={overlays} videoWidth={frame.width} videoHeight={frame.height} currentTime={currentTime} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    overflow: "hidden",
  },
});
