import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addClip,
  removeClip,
  addOverlay,
  removeOverlay,
  addAudioTrack,
  removeAudioTrack,
  addText,
  removeText,
  setCurrentTime,
  setIsPlaying,
  setSelectedItemId,
  undo,
  redo,
  resetEditor,
} from "@/store/slices/editorSlice";
import { exportAndCombineClips } from "@modules/video-editor/camera-module/utils/videoExporter";
import type { CameraClipArray } from "@modules/video-editor/camera-module/types/camera.types";
import TimelineContainer from "@/components/VideoEditor/TimelineContainer";
import BottomToolbar, {
  ToolId,
} from "@/components/VideoEditor/BottomToolbar";
import AudioToolPanel from "@/components/VideoEditor/AudioToolPanel";
import TextToolPanel, {
  TextOverlay,
} from "@/components/VideoEditor/TextToolPanel";
import VoiceToolPanel from "@/components/VideoEditor/VoiceToolPanel";
import CaptionsToolPanel, {
  Caption,
} from "@/components/VideoEditor/CaptionsToolPanel";
import CaptionOverlay from "@/components/VideoEditor/CaptionOverlay";
import AdjustToolPanel, {
  VideoAdjustments,
} from "@/components/VideoEditor/AdjustToolPanel";
import FiltersToolPanel, {
  VideoFilter,
} from "@/components/VideoEditor/FiltersToolPanel";
import DoodlesToolPanel, {
  DoodlePath,
} from "@/components/VideoEditor/DoodlesToolPanel";
import SoundFXToolPanel from "@/components/VideoEditor/SoundFXToolPanel";
import StickersToolPanel, {
  StickerItem,
} from "@/components/VideoEditor/StickersToolPanel";
import OverlayToolPanel, {
  OverlayItem,
} from "@/components/VideoEditor/OverlayToolPanel";
import CutoutToolPanel, {
  CutoutSettings,
} from "@/components/VideoEditor/CutoutToolPanel";
import VideoPreviewWithOverlays from "@/components/VideoEditor/VideoPreviewWithOverlays";
import {
  exportVideo,
  uploadVideoToBackend,
  ExportProgress,
} from "@/services/videoExportService";
import * as ImagePicker from "expo-image-picker";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function EditScreen() {
  const params = useLocalSearchParams();
  const dispatch = useAppDispatch();

  // Redux state
  const clips = useAppSelector((state: any) => state.editor.clips);
  const overlays = useAppSelector((state: any) => state.editor.overlays);
  const audioTracks = useAppSelector((state: any) => state.editor.audioTracks);
  const texts = useAppSelector((state: any) => state.editor.texts);
  const currentTime = useAppSelector((state: any) => state.editor.currentTime);
  const isPlaying = useAppSelector((state: any) => state.editor.isPlaying);
  const selectedItemId = useAppSelector((state: any) => state.editor.selectedItemId);
  const undoStack = useAppSelector((state: any) => state.editor.undoStack);
  const redoStack = useAppSelector((state: any) => state.editor.redoStack);

  // Local state
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);
  const [hdEnabled, setHdEnabled] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

  // Local states for tool panels (not in Redux as they're UI-only)
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [adjustments, setAdjustments] = useState<VideoAdjustments>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    exposure: 0,
    temperature: 0,
    vignette: 0,
    sharpen: 0,
  });
  const [filter, setFilter] = useState<VideoFilter>({
    id: "none",
    name: "Original",
    type: "none",
    intensity: 100,
  });
  const [doodles, setDoodles] = useState<DoodlePath[]>([]);
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [cutoutSettings, setCutoutSettings] = useState<CutoutSettings>({
    enabled: false,
    feathering: 50,
    threshold: 50,
    backgroundColor: "transparent",
  });
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [doodleBrushColor, setDoodleBrushColor] = useState("#EC9A15");
  const [doodleBrushSize, setDoodleBrushSize] = useState(5);

  // Video player
  const currentVideoUri = clips[0]?.uri || "";
  const player = useVideoPlayer(currentVideoUri, (player) => {
    if (currentVideoUri) {
      player.loop = false;
    }
  });

  // Initialize editor state from params
  useEffect(() => {
    if (params.clips) {
      try {
        const parsedClips = JSON.parse(params.clips as string);
        parsedClips.forEach((clip: any) => {
          dispatch(
            addClip({
              id: clip.id || `clip-${Date.now()}`,
              uri: clip.uri,
              duration: clip.duration || 0,
              type: clip.type || "video",
              source: clip.source || "gallery",
            })
          );
        });
      } catch (e) {
        console.error("[EditScreen] Failed to parse clips:", e);
      }
    }

    return () => {
      // Cleanup on unmount
    };
  }, [params.clips, dispatch]);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(resetEditor());
    };
  }, [dispatch]);

  // Format time display (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle play/pause
  const togglePlayPause = useCallback(() => {
    if (player) {
      if (isPlaying) {
        player.pause();
        dispatch(setIsPlaying(false));
      } else {
        player.play();
        dispatch(setIsPlaying(true));
      }
    }
  }, [player, isPlaying, dispatch]);

  // Handle tool selection
  const handleToolSelect = useCallback(
    (tool: ToolId) => {
      setSelectedTool(tool === selectedTool ? null : tool);
    },
    [selectedTool]
  );

  // Handle adding clip from gallery
  const handleAddClip = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        dispatch(
          addClip({
            id: `clip-${Date.now()}`,
            uri: asset.uri,
            duration: asset.duration || 1,
            type: "video",
            source: "gallery",
          })
        );
      }
    } catch (error) {
      console.error("[EditScreen] Add clip error:", error);
      Alert.alert("Error", "Failed to add clip from gallery");
    }
  }, [dispatch]);

  // Handle adding audio
  const handleAddAudio = useCallback(
    (audioTrack: any) => {
      dispatch(
        addAudioTrack({
          id: `audio-${Date.now()}`,
          trackId: audioTrack._id,
          title: audioTrack.title,
          artist: audioTrack.artist,
          url: audioTrack.url,
          startTime: currentTime,
          duration: audioTrack.duration,
          volume: 0.8,
          trimStart: 0,
          trimEnd: 0,
          originalDuration: audioTrack.duration,
        })
      );
    },
    [currentTime, dispatch]
  );

  // Handle adding text
  const handleAddText = useCallback(
    (textOverlay: Omit<TextOverlay, "id">) => {
      const newTextOverlay: TextOverlay = {
        ...textOverlay,
        id: `text-${Date.now()}`,
      };
      setTextOverlays([...textOverlays, newTextOverlay]);
    },
    [textOverlays]
  );

  // Handle adding voice recording
  const handleAddVoice = useCallback(
    (voiceRecording: { uri: string; duration: number; title: string }) => {
      dispatch(
        addAudioTrack({
          id: `voice-${Date.now()}`,
          title: voiceRecording.title,
          artist: "Voice Recording",
          url: voiceRecording.uri,
          startTime: currentTime,
          duration: voiceRecording.duration,
          volume: 1.0,
          trimStart: 0,
          trimEnd: 0,
          originalDuration: voiceRecording.duration,
        })
      );
    },
    [currentTime, dispatch]
  );

  // Handle captions generated
  const handleCaptionsGenerated = useCallback((generatedCaptions: Caption[]) => {
    setCaptions(generatedCaptions);
  }, []);

  // Handle adjustments change
  const handleAdjustmentsChange = useCallback((newAdjustments: VideoAdjustments) => {
    setAdjustments(newAdjustments);
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((newFilter: VideoFilter) => {
    setFilter(newFilter);
  }, []);

  // Handle doodles change
  const handleDoodlesChange = useCallback((newDoodles: DoodlePath[]) => {
    setDoodles(newDoodles);
  }, []);

  // Handle adding sound FX
  const handleAddSoundFX = useCallback(
    (soundFX: { id: string; name: string; url: string; duration: number }) => {
      dispatch(
        addAudioTrack({
          id: `soundfx-${Date.now()}`,
          trackId: soundFX.id,
          title: soundFX.name,
          artist: "Sound FX",
          url: soundFX.url,
          startTime: currentTime,
          duration: soundFX.duration,
          volume: 1.0,
          trimStart: 0,
          trimEnd: 0,
          originalDuration: soundFX.duration,
        })
      );
    },
    [currentTime, dispatch]
  );

  // Handle adding sticker
  const handleAddSticker = useCallback(
    (sticker: Omit<StickerItem, "id">) => {
      const newSticker: StickerItem = {
        ...sticker,
        id: `sticker-${Date.now()}`,
      };
      setStickers([...stickers, newSticker]);
    },
    [stickers]
  );

  // Handle adding overlay
  const handleAddOverlay = useCallback(
    (overlay: Omit<OverlayItem, "id">) => {
      dispatch(
        addOverlay({
          id: `overlay-${Date.now()}`,
          type: overlay.type as "sticker" | "image" | "shape",
          uri: overlay.uri,
          startTime: overlay.startTime,
          duration: overlay.duration,
          x: overlay.x || 0,
          y: overlay.y || 0,
          width: overlay.width || 100,
          height: overlay.height || 100,
          rotation: overlay.rotation || 0,
          opacity: overlay.opacity || 1,
          scaleX: overlay.scaleX || 1,
          scaleY: overlay.scaleY || 1,
        })
      );
    },
    [dispatch]
  );

  // Handle cutout settings
  const handleApplyCutout = useCallback((settings: CutoutSettings) => {
    setCutoutSettings(settings);
  }, []);

  // Handle undo
  const performUndo = useCallback(() => {
    dispatch(undo());
  }, [dispatch]);

  // Handle redo
  const performRedo = useCallback(() => {
    dispatch(redo());
  }, [dispatch]);

  // Handle export/next
  const handleNext = async () => {
    if (clips.length === 0) {
      Alert.alert("No clips", "Please add at least one clip before exporting.");
      return;
    }

    setIsExporting(true);
    setExportProgress({
      stage: "compositing",
      progress: 0,
      message: "Starting export...",
    });

    try {
      // Calculate total duration
      const totalDuration = clips.reduce(
        (sum: number, clip: any) => sum + ((clip.trimEnd || clip.duration) - (clip.trimStart || 0)),
        0
      );

      // Export video with all layers and effects
      const exportedUri = await exportVideo(
        {
          clips,
          audioClips: audioTracks,
          textOverlays,
          captions,
          adjustments,
          filter,
          doodles,
          stickers,
          overlays,
          cutoutSettings,
          quality: hdEnabled ? "1080p" : "720p",
        },
        (progress) => {
          setExportProgress(progress as any);
        }
      );

      const competitionId = params.competitionId
        ? String(params.competitionId)
        : null;
      const competitionName = params.competitionName
        ? String(params.competitionName)
        : null;
      const entryFee = params.entryFee ? String(params.entryFee) : null;

      // Navigate to post screen with edited video
      router.push({
        pathname: "/(main)/upload/post",
        params: {
          clips: JSON.stringify([{ ...clips[0], uri: exportedUri }]),
          ...(competitionId && { competitionId }),
          ...(competitionName && { competitionName }),
          ...(entryFee && { entryFee }),
        },
      });
    } catch (error) {
      console.error("[EditScreen] Export error:", error);
      Alert.alert(
        "Export failed",
        error instanceof Error
          ? error.message
          : "Could not process this video. Please try again."
      );
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Top Bar */}
      <SafeAreaView style={styles.topBar} edges={["top"]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Welcome to Edits</Text>
          <Ionicons name="chevron-down" size={16} color="#fff" style={styles.titleIcon} />
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hdButton}
            onPress={() => setHdEnabled(!hdEnabled)}
          >
            <Text
              style={[styles.hdButtonText, hdEnabled && styles.hdButtonTextActive]}
            >
              HD
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            disabled={isExporting || clips.length === 0}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>Next</Text>
                <Ionicons name="chevron-forward" size={16} color="#000" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Video Preview */}
      <View style={styles.videoContainer}>
        <View style={styles.videoWrapper}>
          {currentVideoUri ? (
            <VideoPreviewWithOverlays
              player={player}
              currentTime={currentTime}
              captions={captions}
              filter={filter}
              adjustments={adjustments}
              doodles={doodles}
              stickers={stickers}
              overlays={overlays}
              cutoutSettings={cutoutSettings}
              selectedTool={selectedTool}
              isDrawingMode={isDrawingMode && selectedTool === "doodles"}
              doodleBrushColor={doodleBrushColor}
              doodleBrushSize={doodleBrushSize}
              onDoodleComplete={(doodle: any) => {
                setDoodles([...doodles, doodle]);
              }}
              onStickerUpdate={(updatedSticker: any) => {
                setStickers(
                  stickers.map((s) =>
                    s.id === updatedSticker.id ? updatedSticker : s
                  )
                );
              }}
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <MaterialIcons name="videocam" size={48} color="#666" />
              <Text style={styles.videoPlaceholderText}>No video</Text>
            </View>
          )}
        </View>
      </View>

      {/* Timeline */}
      <TimelineContainer
        clips={clips}
        overlays={overlays}
        audioTracks={audioTracks}
        texts={texts}
        currentTime={currentTime}
        isPlaying={isPlaying}
        selectedItemId={selectedItemId}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onAddClip={handleAddClip}
        onSelectClip={(clipId: string) => dispatch(setSelectedItemId(clipId))}
        onDeleteClip={(clipId: string) => dispatch(removeClip(clipId))}
        onSelectOverlay={(overlayId: string) => dispatch(setSelectedItemId(overlayId))}
        onDeleteOverlay={(overlayId: string) => dispatch(removeOverlay(overlayId))}
        onSelectAudio={(trackId: string) => dispatch(setSelectedItemId(trackId))}
        onDeleteAudio={(trackId: string) => dispatch(removeAudioTrack(trackId))}
        onSelectText={(textId: string) => dispatch(setSelectedItemId(textId))}
        onDeleteText={(textId: string) => dispatch(removeText(textId))}
        onPlayPress={togglePlayPause}
        onUndoPress={performUndo}
        onRedoPress={performRedo}
        onTimeChange={(time: number) => dispatch(setCurrentTime(time))}
      />

      {/* Bottom Toolbar */}
      <BottomToolbar selectedTool={selectedTool} onSelectTool={handleToolSelect} />

      {/* Tool-specific panels */}
      {selectedTool === "audio" && (
        <AudioToolPanel
          onClose={() => setSelectedTool(null)}
          onAddAudio={handleAddAudio}
        />
      )}

      {selectedTool === "text" && (
        <TextToolPanel
          onClose={() => setSelectedTool(null)}
          onAddText={handleAddText}
          videoDuration={clips.reduce(
            (sum: number, clip: any) => sum + ((clip.trimEnd || clip.duration) - (clip.trimStart || 0)),
            0
          )}
          currentTime={currentTime}
        />
      )}

      {selectedTool === "voice" && (
        <VoiceToolPanel
          onClose={() => setSelectedTool(null)}
          onAddVoice={handleAddVoice}
          currentTime={currentTime}
        />
      )}

      {selectedTool === "captions" && (
        <CaptionsToolPanel
          onClose={() => setSelectedTool(null)}
          onCaptionsGenerated={handleCaptionsGenerated}
          videoUri={currentVideoUri}
          videoDuration={clips.reduce(
            (sum: number, clip: any) => sum + ((clip.trimEnd || clip.duration) - (clip.trimStart || 0)),
            0
          )}
        />
      )}

      {selectedTool === "adjust" && (
        <AdjustToolPanel
          onClose={() => setSelectedTool(null)}
          onAdjustmentsChange={handleAdjustmentsChange}
          initialAdjustments={adjustments}
        />
      )}

      {selectedTool === "filters" && (
        <FiltersToolPanel
          onClose={() => setSelectedTool(null)}
          onFilterChange={handleFilterChange}
          currentFilter={filter}
          videoThumbnail={clips[0]?.thumbnail}
        />
      )}

      {selectedTool === "doodles" && (
        <DoodlesToolPanel
          onClose={() => {
            setSelectedTool(null);
            setIsDrawingMode(false);
          }}
          onDoodlesChange={handleDoodlesChange}
          currentTime={currentTime}
          videoDuration={clips.reduce(
            (sum: number, clip: any) => sum + ((clip.trimEnd || clip.duration) - (clip.trimStart || 0)),
            0
          )}
          initialDoodles={doodles}
          isDrawingMode={isDrawingMode}
          onDrawingModeChange={setIsDrawingMode}
          brushColor={doodleBrushColor}
          onBrushColorChange={setDoodleBrushColor}
          brushSize={doodleBrushSize}
          onBrushSizeChange={setDoodleBrushSize}
        />
      )}

      {selectedTool === "soundfx" && (
        <SoundFXToolPanel
          onClose={() => setSelectedTool(null)}
          onAddSoundFX={handleAddSoundFX}
          currentTime={currentTime}
        />
      )}

      {selectedTool === "stickers" && (
        <StickersToolPanel
          onClose={() => setSelectedTool(null)}
          onAddSticker={handleAddSticker}
          currentTime={currentTime}
          videoDuration={clips.reduce(
            (sum: number, clip: any) => sum + ((clip.trimEnd || clip.duration) - (clip.trimStart || 0)),
            0
          )}
        />
      )}

      {selectedTool === "overlay" && (
        <OverlayToolPanel
          onClose={() => setSelectedTool(null)}
          onAddOverlay={handleAddOverlay}
          currentTime={currentTime}
          videoDuration={clips.reduce(
            (sum: number, clip: any) => sum + ((clip.trimEnd || clip.duration) - (clip.trimStart || 0)),
            0
          )}
          existingOverlays={overlays}
        />
      )}

      {selectedTool === "cutout" && (
        <CutoutToolPanel
          onClose={() => setSelectedTool(null)}
          onApplyCutout={handleApplyCutout}
          currentSettings={cutoutSettings}
        />
      )}

      {/* Export Progress Modal */}
      {exportProgress && (
        <View style={styles.exportModal}>
          <View style={styles.exportModalContent}>
            <Text style={styles.exportModalTitle}>
              {exportProgress.stage === "compositing"
                ? "Compositing Layers"
                : exportProgress.stage === "rendering"
                ? "Rendering Video"
                : exportProgress.stage === "uploading"
                ? "Uploading"
                : "Complete!"}
            </Text>
            <Text style={styles.exportModalMessage}>
              {exportProgress.message}
            </Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${exportProgress.progress}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {exportProgress.progress.toFixed(0)}%
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  // Top Bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#000",
  },
  closeButton: {
    padding: 4,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 16,
  },
  titleText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  titleIcon: {
    marginLeft: 4,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchButton: {
    padding: 4,
  },
  hdButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#666",
  },
  hdButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  hdButtonTextActive: {
    color: "#fff",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    minWidth: 80,
    justifyContent: "center",
  },
  nextButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },

  // Video Preview
  videoContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  videoWrapper: {
    width: SCREEN_WIDTH * 0.5,
    aspectRatio: 9 / 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  videoPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlaceholderText: {
    color: "#666",
    fontSize: 14,
    marginTop: 8,
  },

  // Export Progress
  exportModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  exportModalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 24,
    width: "80%",
    alignItems: "center",
  },
  exportModalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  exportModalMessage: {
    color: "#888",
    fontSize: 14,
    marginBottom: 16,
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#EC9A15",
  },
  progressText: {
    color: "#EC9A15",
    fontSize: 14,
    fontWeight: "600",
  },
});
