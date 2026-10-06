import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated as RNAnimated,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { CameraClip } from "../../types/camera.types";
import type { FilterConfig } from "../../types/filters";
import type { TextOverlay } from "../../types/textOverlay.types";
import {
  clampTrimPoints,
  getTotalTimelineDuration,
  getClipAtTimelineTime,
  calculateTimelinePositions,
} from "../../utils/timelineHelpers";
import { generateThumbnailsForClips } from "../../utils/thumbnailGenerator";
import AddClipOverlay from "../AddClipOverlay";
import DraggableTextOverlays from "../DraggableTextOverlays";
import TextEditorModal from "../TextEditorModal";
import MultiClipPlayer from "./MultiClipPlayer";
import MultiClipTimeline from "./MultiClipTimeline";
import EnhancedTimelineControls from "../EnhancedTimelineControls";
import PreviewActionButtons from "../PreviewActionButtons";
import { GestureSticker } from "./GestureSticker";

// Live Gully Fame API Services
import { listAudio } from "@/api/services/musicLibraryService";
import { listFilters } from "@/api/services/filterLibraryService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ActiveOverlay {
  id: string;
  type: "image" | "emoji";
  content: string | number;
}

interface TimelineEditorProps {
  clips: CameraClip[];
  onClipsUpdate: (clips: CameraClip[]) => void;
  onBack?: () => void;
  onNext?: () => void;
  onAddClip?: (source: "camera" | "gallery") => void;
  onAddClipFromGallery?: (clip: CameraClip) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  selectedFilter?: FilterConfig;

  overlays?: ActiveOverlay[];
  activeOverlayId?: string | null;
  onSelectOverlay?: (type: "image" | "emoji", content: string | number) => void;
  onDeleteOverlay?: (id: string) => void;
  setActiveOverlayId?: (id: string | null) => void;
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({
  clips,
  onClipsUpdate,
  onBack,
  onNext,
  onAddClip,
  onAddClipFromGallery,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  selectedFilter,
  overlays = [],
  activeOverlayId = null,
  onSelectOverlay,
  onDeleteOverlay,
  setActiveOverlayId,
}) => {
  const insets = useSafeAreaInsets();

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | undefined>();
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const [isReady, setIsReady] = useState(false);
  const [showAddClipOverlay, setShowAddClipOverlay] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<FilterConfig | null>(
    selectedFilter || clips.find((c) => c.filterPreset)?.filterPreset || null
  );
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [selectedTextOverlay, setSelectedTextOverlay] = useState<TextOverlay | null>(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);

  // Background audio & filter states
  const [selectedMusicTrack, setSelectedMusicTrack] = useState<any | null>(null);
  const [backendTracks, setBackendTracks] = useState<any[]>([]);
  const [backendFilters, setBackendFilters] = useState<any[]>([]);

  // Fetch Live Backend Data
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const audioRes = await listAudio("trending", 1, 50);
        if (audioRes.success && audioRes.data?.tracks) {
          setBackendTracks(audioRes.data.tracks);
        }
      } catch (e) {
        console.warn("Failed to load backend audio tracks:", e);
      }

      try {
        const filterRes = await listFilters(undefined, 1, 50);
        if (filterRes.success && filterRes.data?.filters) {
          setBackendFilters(filterRes.data.filters);
        }
      } catch (e) {
        console.warn("Failed to load backend filters:", e);
      }
    };
    fetchBackendData();
  }, []);

  // Trash Bin & Sticker Drag Handlers
  const [isDraggingSticker, setIsDraggingSticker] = useState(false);
  const [isHoveringTrash, setIsHoveringTrash] = useState(false);
  const trashOpacity = useRef(new RNAnimated.Value(0)).current;

  const handleStickerDragStart = useCallback(() => setIsDraggingSticker(true), []);
  const handleStickerDragUpdate = useCallback((x: number, y: number) => {}, []);
  const handleStickerDragEnd = useCallback(() => setIsDraggingSticker(false), []);

  const [previewDimensions, setPreviewDimensions] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.42,
  });

  const isDraggingTimeline = useRef(false);
  const totalDuration = getTotalTimelineDuration(clips);

  const currentClipUri = useMemo(() => {
    if (selectedClipId) {
      const clip = clips.find((c) => c.id === selectedClipId);
      return clip?.uri || (clips.length > 0 ? clips[0].uri : "");
    }
    return clips.length > 0 ? clips[0].uri : "";
  }, [selectedClipId, clips]);

  useEffect(() => {
    setIsReady(false);
    generateThumbnailsForClips(clips)
      .then((thumbs) => {
        setThumbnails(thumbs);
        setIsReady(true);
      })
      .catch((error) => {
        console.warn("Thumbnails error:", error);
        setIsReady(true);
      });
  }, [clips]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentTime >= totalDuration - 0.1) setCurrentTime(0);
      setIsPlaying(true);
    }
  }, [isPlaying, currentTime, totalDuration]);

  const handleTimelineSeek = useCallback(
    (time: number) => {
      const clampedTime = Math.max(0, Math.min(time, totalDuration));
      setCurrentTime(clampedTime);
      setIsPlaying(false);
    },
    [totalDuration]
  );

  const handleClipPress = useCallback((clip: CameraClip) => {
    setSelectedClipId((prev) => (prev === clip.id ? undefined : clip.id));
  }, []);

  // ✂️ Live Video Split
  const handleSplitClip = useCallback(() => {
    const currentClipData = getClipAtTimelineTime(clips, currentTime);

    if (!currentClipData) {
      Alert.alert("Split Error", "No video clip found at current playhead position.");
      return;
    }

    const { clip, localTime } = currentClipData;
    const clipStart = clip.timelineStart ?? 0;
    const clipEnd = clip.timelineEnd ?? 0;

    if (currentTime <= clipStart + 0.2 || currentTime >= clipEnd - 0.2) {
      Alert.alert("Cannot Split", "Playhead is too close to the clip boundary.");
      return;
    }

    const splitPoint = localTime;

    const firstHalf: CameraClip = {
      ...clip,
      id: `clip-${Date.now().toString(36)}-1`,
      trimEnd: splitPoint,
    };

    const secondHalf: CameraClip = {
      ...clip,
      id: `clip-${Date.now().toString(36)}-2`,
      trimStart: splitPoint,
    };

    const targetIndex = clips.findIndex((c) => c.id === clip.id);
    const updatedClips = [...clips];
    updatedClips.splice(targetIndex, 1, firstHalf, secondHalf);

    const repositionedClips = calculateTimelinePositions(updatedClips);

    setSelectedClipId(undefined);
    onClipsUpdate(repositionedClips);
  }, [clips, currentTime, onClipsUpdate]);

  const handleDeleteClip = useCallback(() => {
    if (!selectedClipId) return;
    const newClips = clips.filter((c) => c.id !== selectedClipId);
    if (newClips.length === 0) {
      onBack?.();
      return;
    }
    const positionedClips = calculateTimelinePositions(newClips);
    setSelectedClipId(undefined);
    onClipsUpdate(positionedClips);
  }, [selectedClipId, clips, onClipsUpdate, onBack]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const currentClipForText = useMemo(
    () => getClipAtTimelineTime(clips, currentTime)?.clip || clips[0] || null,
    [clips, currentTime]
  );
  const currentTextOverlays = useMemo(
    () => currentClipForText?.textOverlays || [],
    [currentClipForText]
  );

  const handleTextOverlayPress = useCallback((overlay: TextOverlay) => {
    setSelectedTextOverlay(overlay);
    setSelectedOverlayId(overlay.id);
    setShowTextEditor(true);
  }, []);

  const handleTextOverlaySave = useCallback(
    (overlay: TextOverlay) => {
      if (!currentClipForText) return;
      const existingOverlays = currentClipForText.textOverlays || [];
      const existingIndex = existingOverlays.findIndex((o) => o.id === overlay.id);
      let updatedOverlays =
        existingIndex >= 0
          ? existingOverlays.map((o, i) => (i === existingIndex ? overlay : o))
          : [...existingOverlays, overlay];
      onClipsUpdate(
        clips.map((clip) =>
          clip.id === currentClipForText.id ? { ...clip, textOverlays: updatedOverlays } : clip
        )
      );
      setSelectedOverlayId(null);
      setShowTextEditor(false);
    },
    [currentClipForText, clips, onClipsUpdate]
  );

  const handleTextOverlayDelete = useCallback(
    (overlayId: string) => {
      if (!currentClipForText) return;
      const updatedOverlays = (currentClipForText.textOverlays || []).filter(
        (o) => o.id !== overlayId
      );
      onClipsUpdate(
        clips.map((clip) =>
          clip.id === currentClipForText.id ? { ...clip, textOverlays: updatedOverlays } : clip
        )
      );
      setSelectedOverlayId(null);
      setSelectedTextOverlay(null);
      setShowTextEditor(false);
    },
    [currentClipForText, clips, onClipsUpdate]
  );

  const handleTextOverlayUpdate = useCallback(
    (overlay: TextOverlay) => {
      if (!currentClipForText) return;
      const existingOverlays = currentClipForText.textOverlays || [];
      const existingIndex = existingOverlays.findIndex((o) => o.id === overlay.id);
      if (existingIndex >= 0) {
        const updatedOverlays = [...existingOverlays];
        updatedOverlays[existingIndex] = overlay;
        onClipsUpdate(
          clips.map((clip) =>
            clip.id === currentClipForText.id ? { ...clip, textOverlays: updatedOverlays } : clip
          )
        );
      }
    },
    [currentClipForText, clips, onClipsUpdate]
  );

  const handleTextEditorClose = useCallback(() => {
    setShowTextEditor(false);
    setSelectedTextOverlay(null);
    setSelectedOverlayId(null);
  }, []);

  const handleAddPress = useCallback(() => {
    setShowAddClipOverlay(true);
  }, []);

  const handleSelectCamera = useCallback(() => {
    setShowAddClipOverlay(false);
    onAddClip?.("camera");
  }, [onAddClip]);

  const handleSelectGallery = useCallback(
    (newClip: CameraClip) => {
      setShowAddClipOverlay(false);
      if (onAddClipFromGallery) onAddClipFromGallery(newClip);
      else onClipsUpdate(calculateTimelinePositions([...clips, newClip]));
    },
    [onAddClipFromGallery, clips, onClipsUpdate]
  );

  if (clips.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "#fff", alignSelf: "center", marginTop: 100 }}>
          No clips to edit
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />

      {/* 1. TOP HEADER (With Dynamic Notch Padding) */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={onBack} style={styles.headerIconBtn}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.projectTitleDropdown}>
          <Text style={styles.projectTitleText}>Welcome to Edits</Text>
          <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerRightGroup}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="search" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.hdTag}>HD</Text>

          <TouchableOpacity style={styles.nextPillBtn} onPress={onNext}>
            <Text style={styles.nextPillText}>Next {">"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. VIDEO PREVIEW AREA */}
      <View
        style={styles.videoPreviewArea}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setPreviewDimensions({ width, height });
        }}
      >
        <MultiClipPlayer
          clips={clips}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onTimeUpdate={setCurrentTime}
          onLoad={() => setIsReady(true)}
          onEnd={() => setIsPlaying(false)}
          filter={currentFilter || undefined}
          isDraggingTimeline={isDraggingTimeline.current}
        />

        {currentClipForText && (
          <DraggableTextOverlays
            overlays={currentTextOverlays}
            containerWidth={previewDimensions.width}
            containerHeight={previewDimensions.height}
            currentTime={currentTime}
            onOverlayUpdate={handleTextOverlayUpdate}
            onOverlayPress={handleTextOverlayPress}
            selectedOverlayId={selectedOverlayId}
          />
        )}

        {overlays.map((overlayItem) => (
          <GestureSticker
            key={overlayItem.id}
            id={overlayItem.id}
            type={overlayItem.type}
            content={overlayItem.content as string}
            isActive={activeOverlayId === overlayItem.id}
            onSelect={() => setActiveOverlayId?.(overlayItem.id)}
            onDragStart={handleStickerDragStart}
            onDragUpdate={handleStickerDragUpdate}
            onDragEnd={handleStickerDragEnd}
          />
        ))}

        {!isPlaying && (
          <TouchableOpacity style={styles.playCenterOverlay} onPress={togglePlayPause}>
            <View style={styles.playCircle}>
              <Ionicons name="play" size={28} color="#EC9A15" style={{ marginLeft: 3 }} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* 3. PLAYER CONTROLS ROW */}
      <View style={styles.playerControlsRow}>
        <TouchableOpacity style={styles.playPauseBtn} onPress={togglePlayPause}>
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={22}
            color="#EC9A15"
          />
        </TouchableOpacity>

        <View style={styles.timeDisplayContainer}>
          <Text style={styles.timeMainText}>
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </Text>
          <Text style={styles.timeSubText}>
            {(currentTime % 1 !== 0 ? currentTime.toFixed(1) : Math.floor(currentTime))}s
          </Text>
        </View>

        <View style={styles.undoRedoGroup}>
          <TouchableOpacity onPress={onUndo} disabled={!canUndo} style={[styles.undoRedoBtn, !canUndo && styles.disabledBtn]}>
            <Ionicons name="arrow-undo" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRedo} disabled={!canRedo} style={[styles.undoRedoBtn, !canRedo && styles.disabledBtn]}>
            <Ionicons name="arrow-redo" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. MULTI-TRACK TIMELINE */}
      <View style={styles.timelineContainer}>
        {isReady && (
          <MultiClipTimeline
            clips={clips}
            currentTime={currentTime}
            selectedClipId={selectedClipId}
            selectedMusicTrack={selectedMusicTrack}
            thumbnails={thumbnails}
            onClipPress={handleClipPress}
            onTimelineSeek={handleTimelineSeek}
          />
        )}

        <TouchableOpacity style={styles.floatingAddButton} onPress={handleAddPress}>
          <Ionicons name="add" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* 5. DYNAMIC BOTTOM TOOLBAR */}
      <View style={[styles.bottomToolbarContainer, { paddingBottom: Math.max(insets.bottom, 6) }]}>
        {isReady && (
          selectedClipId ? (
            /* CLIP EDIT TOOLBAR */
            <EnhancedTimelineControls
              currentTime={currentTime}
              duration={totalDuration}
              onTimeChange={setCurrentTime}
              onPlayPause={togglePlayPause}
              isPlaying={isPlaying}
              onDelete={handleDeleteClip}
              onSplit={handleSplitClip}
              onVolume={() => Alert.alert("Volume", "Adjust track audio volume")}
              onTextPress={() => {
                setSelectedTextOverlay(null);
                setSelectedOverlayId(null);
                setShowTextEditor(true);
              }}
              onDuplicate={() => {
                if (selectedClipId) {
                  const target = clips.find((c) => c.id === selectedClipId);
                  if (target) {
                    const dup: CameraClip = {
                      ...target,
                      id: `clip-${Date.now().toString(36)}`,
                    };
                    onClipsUpdate(calculateTimelinePositions([...clips, dup]));
                  }
                }
              }}
            />
          ) : (
            /* ROOT TOOLBAR */
            <PreviewActionButtons
              displayUri={currentClipUri}
              onFilter={(filter) => {
                setCurrentFilter(filter);
                const updatedClips = clips.map((clip) => {
                  if (!selectedClipId || clip.id === selectedClipId) {
                    if (!filter) {
                      const { filterPreset, ...clipWithoutFilter } = clip;
                      return clipWithoutFilter;
                    }
                    return { ...clip, filterPreset: filter };
                  }
                  return clip;
                });
                onClipsUpdate(updatedClips);
              }}
              onOverlay={() => Alert.alert("Overlay", "Add Picture-in-Picture overlay")}
              onText={() => {
                setSelectedTextOverlay(null);
                setSelectedOverlayId(null);
                setShowTextEditor(true);
              }}
              onSticker={(sticker) => onSelectOverlay?.('emoji', sticker ?? '')}
              onMusic={(musicTrack) => {
                if (musicTrack) {
                  setSelectedMusicTrack(musicTrack);
                }
              }}
              onVoiceAdd={(v) => Alert.alert("Voice", "Record voiceover")}
              onSoundFXAdd={(s) => Alert.alert("Sound FX", "Sound effects")}
              onCaptionAdd={(c) => Alert.alert("Captions", "Generate Captions")}
              onAdjustChange={(a) => Alert.alert("Adjust", "Color grading options")}
              onCutoutAdd={(c) => Alert.alert("Cutout", "Smart Cutout")}
              onLinkAdd={(l) => Alert.alert("Links", "Add Link Overlay")}
              onPaste={(p) => Alert.alert("Paste", "Content pasted")}
              startTime={currentTime}
              audioTracks={[]}
              masterVolume={1}
            />
          )
        )}
      </View>

      <AddClipOverlay
        visible={showAddClipOverlay}
        onClose={() => setShowAddClipOverlay(false)}
        onSelectCamera={handleSelectCamera}
        onSelectGallery={handleSelectGallery}
      />

      <TextEditorModal
        visible={showTextEditor}
        overlay={selectedTextOverlay}
        onSave={handleTextOverlaySave}
        onDelete={handleTextOverlayDelete}
        onClose={handleTextEditorClose}
        containerWidth={previewDimensions.width}
        containerHeight={previewDimensions.height}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    flexDirection: "column",
  },
  topHeader: {
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#000000",
    zIndex: 50,
  },
  headerIconBtn: {
    padding: 4,
  },
  projectTitleDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  projectTitleText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  headerRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  hdTag: {
    color: "#EC9A15",
    fontSize: 12,
    fontWeight: "800",
    marginHorizontal: 4,
  },
  nextPillBtn: {
    backgroundColor: "#EC9A15",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
  },
  nextPillText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "800",
  },
  videoPreviewArea: {
    height: SCREEN_HEIGHT * 0.42,
    width: "100%",
    backgroundColor: "#000000",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  playCenterOverlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#EC9A15",
  },
  playerControlsRow: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    backgroundColor: "#0F0F0F",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  playPauseBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  timeDisplayContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  timeMainText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  timeSubText: {
    color: "#EC9A15",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  undoRedoGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  undoRedoBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledBtn: {
    opacity: 0.3,
  },
  timelineContainer: {
    flex: 1,
    backgroundColor: "#0F0F0F",
    position: "relative",
  },
  floatingAddButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EC9A15",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 100,
  },
  bottomToolbarContainer: {
    minHeight: 65,
    backgroundColor: "#000000",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
  },
});

export default TimelineEditor;
