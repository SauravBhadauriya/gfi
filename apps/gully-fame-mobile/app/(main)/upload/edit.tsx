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
import { exportAndCombineClips } from "@modules/video-editor/camera-module/utils/videoExporter";
import type { CameraClipArray } from "@modules/video-editor/camera-module/types/camera.types";
import EditableTimeline from "@/components/VideoEditor/EditableTimeline";
// import AudioToolPanel from "@/components/VideoEditor/AudioToolPanel"; // Temporarily disabled - needs native rebuild
import AudioTrack from "@/components/VideoEditor/AudioTrack";
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
import {
  exportVideo,
  uploadVideoToBackend,
  ExportProgress,
} from "@/services/videoExportService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Editor tool types matching Instagram Edits
type EditorTool =
  | "audio"
  | "text"
  | "voice"
  | "links"
  | "captions"
  | "doodles"
  | "adjust"
  | "filters"
  | "overlay"
  | "soundfx"
  | "cutout"
  | "stickers";

export default function EditScreen() {
  const params = useLocalSearchParams();
  const [clips, setClips] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedTool, setSelectedTool] = useState<EditorTool | null>(null);
  const [hdEnabled, setHdEnabled] = useState(true);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedClipIndex, setSelectedClipIndex] = useState<number | null>(null);

  // Audio clips state
  const [audioClips, setAudioClips] = useState<any[]>([]);

  // Text overlays state
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);

  // Captions state
  const [captions, setCaptions] = useState<Caption[]>([]);

  // Video adjustments state
  const [adjustments, setAdjustments] = useState<VideoAdjustments>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    exposure: 0,
    temperature: 0,
    vignette: 0,
    sharpen: 0,
  });

  // Video filter state
  const [filter, setFilter] = useState<VideoFilter>({
    id: "none",
    name: "Original",
    type: "none",
    intensity: 100,
  });

  // Doodles state
  const [doodles, setDoodles] = useState<DoodlePath[]>([]);

  // Phase 6 states
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [cutoutSettings, setCutoutSettings] = useState<CutoutSettings>({
    enabled: false,
    feathering: 50,
    threshold: 50,
    backgroundColor: "transparent",
  });

  // Export state
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

  // Undo/redo stacks
  const undoStack = useRef<any[][]>([]);
  const redoStack = useRef<any[][]>([]);

  // Timeline state
  const [timelineScrollX, setTimelineScrollX] = useState(0);

  // Video player
  const currentVideoUri = clips[0]?.uri || "";
  const player = useVideoPlayer(currentVideoUri, (player) => {
    if (currentVideoUri) {
      player.loop = false;
      // Don't auto-play, wait for user to press play button
    }
  });

  // Parse clips from params
  useEffect(() => {
    if (params.clips) {
      try {
        const parsedClips = JSON.parse(params.clips as string);
        setClips(parsedClips);
        // Calculate total duration
        const totalDuration = parsedClips.reduce(
          (sum: number, clip: any) => sum + (clip.duration || 0),
          0
        );
        setDuration(totalDuration);
      } catch (e) {
        console.error("[EditScreen] Failed to parse clips:", e);
      }
    }
  }, [params.clips]);

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
      } else {
        player.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [player, isPlaying]);

  // Handle tool selection
  const handleToolSelect = useCallback(
    (tool: EditorTool) => {
      setSelectedTool(tool === selectedTool ? null : tool);
    },
    [selectedTool]
  );

  // Handle adding audio from AudioToolPanel
  const handleAddAudio = useCallback(
    (audioTrack: any) => {
      const newAudioClip = {
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
      };
      saveToUndoStack();
      setAudioClips([...audioClips, newAudioClip]);
    },
    [audioClips, currentTime]
  );

  // Handle adding text from TextToolPanel
  const handleAddText = useCallback(
    (textOverlay: Omit<TextOverlay, "id">) => {
      const newTextOverlay: TextOverlay = {
        ...textOverlay,
        id: `text-${Date.now()}`,
      };
      saveToUndoStack();
      setTextOverlays([...textOverlays, newTextOverlay]);
    },
    [textOverlays]
  );

  // Handle adding voice recording from VoiceToolPanel
  const handleAddVoice = useCallback(
    (voiceRecording: { uri: string; duration: number; title: string }) => {
      const newVoiceClip = {
        id: `voice-${Date.now()}`,
        trackId: null,
        title: voiceRecording.title,
        artist: "Voice Recording",
        url: voiceRecording.uri,
        startTime: currentTime,
        duration: voiceRecording.duration,
        volume: 1.0,
        trimStart: 0,
        trimEnd: 0,
        originalDuration: voiceRecording.duration,
      };
      saveToUndoStack();
      setAudioClips([...audioClips, newVoiceClip]);
    },
    [audioClips, currentTime]
  );

  // Handle captions generated from CaptionsToolPanel
  const handleCaptionsGenerated = useCallback((generatedCaptions: Caption[]) => {
    saveToUndoStack();
    setCaptions(generatedCaptions);
  }, []);

  // Handle adjustments change from AdjustToolPanel
  const handleAdjustmentsChange = useCallback((newAdjustments: VideoAdjustments) => {
    setAdjustments(newAdjustments);
  }, []);

  // Handle filter change from FiltersToolPanel
  const handleFilterChange = useCallback((newFilter: VideoFilter) => {
    setFilter(newFilter);
  }, []);

  // Handle doodles change from DoodlesToolPanel
  const handleDoodlesChange = useCallback((newDoodles: DoodlePath[]) => {
    saveToUndoStack();
    setDoodles(newDoodles);
  }, []);

  // Handle adding sound FX from SoundFXToolPanel
  const handleAddSoundFX = useCallback(
    (soundFX: { id: string; name: string; url: string; duration: number }) => {
      const newSoundFX = {
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
      };
      saveToUndoStack();
      setAudioClips([...audioClips, newSoundFX]);
    },
    [audioClips, currentTime]
  );

  // Handle adding sticker from StickersToolPanel
  const handleAddSticker = useCallback(
    (sticker: Omit<StickerItem, "id">) => {
      const newSticker: StickerItem = {
        ...sticker,
        id: `sticker-${Date.now()}`,
      };
      saveToUndoStack();
      setStickers([...stickers, newSticker]);
    },
    [stickers]
  );

  // Handle adding overlay from OverlayToolPanel
  const handleAddOverlay = useCallback(
    (overlay: Omit<OverlayItem, "id">) => {
      const newOverlay: OverlayItem = {
        ...overlay,
        id: `overlay-${Date.now()}`,
      };
      saveToUndoStack();
      setOverlays([...overlays, newOverlay]);
    },
    [overlays]
  );

  // Handle cutout settings from CutoutToolPanel
  const handleApplyCutout = useCallback((settings: CutoutSettings) => {
    setCutoutSettings(settings);
  }, []);



  // Save state to undo stack before making changes
  const saveToUndoStack = useCallback(() => {
    undoStack.current.push([...clips]);
    redoStack.current = []; // Clear redo stack on new action
    setCanUndo(true);
    setCanRedo(false);
  }, [clips]);

  // Handle clips change from EditableTimeline
  const handleClipsChange = useCallback(
    (newClips: any[]) => {
      saveToUndoStack();
      setClips(newClips);

      // Recalculate total duration
      const totalDuration = newClips.reduce(
        (sum: number, clip: any) => sum + (clip.duration || 0),
        0
      );
      setDuration(totalDuration);
    },
    [saveToUndoStack]
  );

  // Handle clip selection
  const handleClipSelect = useCallback((index: number) => {
    setSelectedClipIndex(index);
  }, []);

  // Handle undo
  const performUndo = useCallback(() => {
    if (undoStack.current.length === 0) return;

    const previousState = undoStack.current.pop()!;
    redoStack.current.push([...clips]);

    setClips(previousState);
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);

    // Recalculate duration
    const totalDuration = previousState.reduce(
      (sum: number, clip: any) => sum + (clip.duration || 0),
      0
    );
    setDuration(totalDuration);
  }, [clips]);

  // Handle redo
  const performRedo = useCallback(() => {
    if (redoStack.current.length === 0) return;

    const nextState = redoStack.current.pop()!;
    undoStack.current.push([...clips]);

    setClips(nextState);
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);

    // Recalculate duration
    const totalDuration = nextState.reduce(
      (sum: number, clip: any) => sum + (clip.duration || 0),
      0
    );
    setDuration(totalDuration);
  }, [clips]);

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
      // Export video with all layers and effects
      const exportedUri = await exportVideo(
        {
          clips,
          audioClips,
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
          setExportProgress(progress);
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

  // Editor tools configuration
  const editorTools: Array<{ id: EditorTool; label: string; icon: string }> = [
    { id: "audio", label: "Audio", icon: "musical-note" },
    { id: "text", label: "Text", icon: "text" },
    { id: "voice", label: "Voice", icon: "mic" },
    { id: "links", label: "Links", icon: "link" },
    { id: "captions", label: "Captions", icon: "chatbox-ellipses" },
    { id: "doodles", label: "Doodles", icon: "brush" },
    { id: "adjust", label: "Adjust", icon: "options" },
    { id: "filters", label: "Filters", icon: "color-filter" },
    { id: "overlay", label: "Overlay", icon: "layers" },
    { id: "soundfx", label: "Sound FX", icon: "volume-high" },
    { id: "cutout", label: "Cutout", icon: "cut" },
    { id: "stickers", label: "Stickers", icon: "happy" },
  ];

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
            disabled={isExporting}
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
            <>
              <VideoView
                player={player}
                style={styles.video}
                contentFit="contain"
                nativeControls={false}
              />
              {/* Caption Overlay */}
              {captions.length > 0 && (
                <CaptionOverlay
                  captions={captions}
                  currentTime={currentTime}
                  videoWidth={SCREEN_WIDTH * 0.5}
                  videoHeight={(SCREEN_WIDTH * 0.5 * 16) / 9}
                />
              )}
            </>
          ) : (
            <View style={styles.videoPlaceholder}>
              <MaterialIcons name="videocam" size={48} color="#666" />
              <Text style={styles.videoPlaceholderText}>No video</Text>
            </View>
          )}
        </View>
      </View>

      {/* Playback Controls */}
      <View style={styles.playbackControls}>
        <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.speedButton}>
          <MaterialCommunityIcons name="speedometer" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.timeDisplay}>
          <Text style={styles.timeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.undoButton, !canUndo && styles.controlButtonDisabled]}
          onPress={performUndo}
          disabled={!canUndo}
        >
          <MaterialIcons
            name="undo"
            size={24}
            color={canUndo ? "#fff" : "#666"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.redoButton, !canRedo && styles.controlButtonDisabled]}
          onPress={performRedo}
          disabled={!canRedo}
        >
          <MaterialIcons
            name="redo"
            size={24}
            color={canRedo ? "#fff" : "#666"}
          />
        </TouchableOpacity>
      </View>

      {/* Timeline */}
      <View style={styles.timelineContainer}>
        {/* Overlay track (above main track) */}
        <View style={styles.overlayTrack}>
          <Text style={styles.trackLabel}>Overlay</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.trackScrollView}
          >
            {/* Overlay clips will go here */}
          </ScrollView>
        </View>

        {/* Main video track */}
        <View style={styles.mainTrack}>
          <Text style={styles.trackLabel}>Video</Text>
          <EditableTimeline
            clips={clips}
            onClipsChange={handleClipsChange}
            currentTime={currentTime}
            onTimeChange={setCurrentTime}
            selectedClipIndex={selectedClipIndex}
            onClipSelect={handleClipSelect}
          />
        </View>

        {/* Audio track */}
        <AudioTrack
          audioClips={audioClips}
          onAudioClipsChange={setAudioClips}
          currentTime={currentTime}
          videoDuration={duration}
        />
      </View>

      {/* Bottom Toolbar */}
      <SafeAreaView style={styles.bottomToolbar} edges={["bottom"]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarContent}
        >
          {editorTools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={[
                styles.toolButton,
                selectedTool === tool.id && styles.toolButtonActive,
              ]}
              onPress={() => handleToolSelect(tool.id)}
            >
              <Ionicons
                name={tool.icon as any}
                size={24}
                color={selectedTool === tool.id ? "#EC9A15" : "#fff"}
              />
              <Text
                style={[
                  styles.toolLabel,
                  selectedTool === tool.id && styles.toolLabelActive,
                ]}
              >
                {tool.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Tool-specific panels */}
      {selectedTool === "audio" && (
        <View style={styles.disabledPanel}>
          <Text style={styles.disabledText}>
            Audio feature temporarily disabled. Requires native rebuild with expo-av.
          </Text>
          <TouchableOpacity onPress={() => setSelectedTool(null)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
        // <AudioToolPanel
        //   onClose={() => setSelectedTool(null)}
        //   onAddAudio={handleAddAudio}
        // />
      )}

      {selectedTool === "text" && (
        <TextToolPanel
          onClose={() => setSelectedTool(null)}
          onAddText={handleAddText}
          videoDuration={duration}
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
          videoDuration={duration}
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
          onClose={() => setSelectedTool(null)}
          onDoodlesChange={handleDoodlesChange}
          currentTime={currentTime}
          videoDuration={duration}
          initialDoodles={doodles}
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
          videoDuration={duration}
        />
      )}

      {selectedTool === "overlay" && (
        <OverlayToolPanel
          onClose={() => setSelectedTool(null)}
          onAddOverlay={handleAddOverlay}
          currentTime={currentTime}
          videoDuration={duration}
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

      {/* Generic tool panel for remaining tools */}
      {selectedTool &&
        selectedTool !== "audio" &&
        selectedTool !== "text" &&
        selectedTool !== "voice" &&
        selectedTool !== "captions" &&
        selectedTool !== "adjust" &&
        selectedTool !== "filters" &&
        selectedTool !== "doodles" &&
        selectedTool !== "soundfx" &&
        selectedTool !== "stickers" &&
        selectedTool !== "overlay" &&
        selectedTool !== "cutout" && (
          <View style={styles.toolPanel}>
            <View style={styles.toolPanelHeader}>
              <Text style={styles.toolPanelTitle}>
                {selectedTool.toUpperCase()}
              </Text>
              <TouchableOpacity onPress={() => setSelectedTool(null)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.toolPanelText}>
              {selectedTool} tool panel - Coming in next phase
            </Text>
          </View>
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
    borderRadius: 12,
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

  // Playback Controls
  playbackControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  speedButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  timeDisplay: {
    flex: 1,
    alignItems: "center",
  },
  timeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  undoButton: {
    padding: 8,
  },
  redoButton: {
    padding: 8,
  },
  controlButtonDisabled: {
    opacity: 0.3,
  },

  // Timeline
  timelineContainer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    paddingTop: 8,
  },
  overlayTrack: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  mainTrack: {
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  trackLabel: {
    color: "#888",
    fontSize: 10,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },

  // Bottom Toolbar
  bottomToolbar: {
    backgroundColor: "#000",
    borderTopWidth: 1,
    borderTopColor: "#222",
    paddingTop: 12,
  },
  toolbarContent: {
    paddingHorizontal: 16,
    gap: 24,
  },
  toolButton: {
    alignItems: "center",
    minWidth: 60,
  },
  toolButtonActive: {
    // Active state styling
  },
  toolLabel: {
    color: "#fff",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "500",
  },
  toolLabelActive: {
    color: "#EC9A15",
  },

  // Tool Panel
  toolPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  toolPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  toolPanelTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  toolPanelText: {
    color: "#888",
    fontSize: 14,
  },

  // Export Progress Modal
  exportModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  exportModalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 32,
    width: "80%",
    alignItems: "center",
  },
  exportModalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  exportModalMessage: {
    color: "#888",
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: "#2a2a2a",
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
    fontSize: 16,
    fontWeight: "600",
  },

  // Disabled Panel
  disabledPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 32,
    alignItems: "center",
  },
  disabledText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  closeButtonText: {
    color: "#EC9A15",
    fontSize: 16,
    fontWeight: "600",
  },
});
