import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, Animated as RNAnimated, Alert } from "react-native";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import type { CameraClip } from "../../types/camera.types";
import type { FilterConfig } from "../../types/filters";
import type { TextOverlay } from "../../types/textOverlay.types";
import { hasFilterChanges } from "../../utils/filterHelpers";
import {
  clampTrimPoints,
  getTotalTimelineDuration,
  getClipAtTimelineTime,
  calculateTimelinePositions,
} from "../../utils/timelineHelpers";
import { generateThumbnailsForClips } from "../../utils/thumbnailGenerator";
import AddClipOverlay from "../AddClipOverlay";
import DraggableTextOverlays from "../DraggableTextOverlays";
import PreviewActionButtons from "../PreviewActionButtons";
import TextEditorModal from "../TextEditorModal";
import MultiClipPlayer from "./MultiClipPlayer";
import MultiClipTimeline from "./MultiClipTimeline";
import SpeedSelector, { SpeedSelection } from "../SpeedSelector";

import { GestureSticker } from "./GestureSticker";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ActiveOverlay {
  id: string;
  type: 'image' | 'emoji';
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
  onSelectOverlay?: (type: 'image' | 'emoji', content: string | number) => void;
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
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | undefined>();
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const [isReady, setIsReady] = useState(false);
  const [showAddClipOverlay, setShowAddClipOverlay] = useState(false);
  const [showTrimHandles, setShowTrimHandles] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<FilterConfig | null>(
    selectedFilter || clips.find((c) => c.filterPreset)?.filterPreset || null
  );
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [selectedTextOverlay, setSelectedTextOverlay] = useState<TextOverlay | null>(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  
  // 🔥 Trash Bin Animation States
  const [isDraggingSticker, setIsDraggingSticker] = useState(false);
  const [isHoveringTrash, setIsHoveringTrash] = useState(false);
  const trashOpacity = useRef(new RNAnimated.Value(0)).current;

  const [previewDimensions, setPreviewDimensions] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.15,
  });

  useEffect(() => {
    if (selectedFilter) setCurrentFilter(selectedFilter);
  }, [selectedFilter]);

  const isDraggingTimeline = useRef(false);
  const totalDuration = getTotalTimelineDuration(clips);

  const selectedClipSpeedConfig = useMemo((): SpeedSelection => {
    if (selectedClipId) {
      const target = clips.find((c) => c.id === selectedClipId);
      // @ts-ignore
      return target?.speedConfig || { type: 'constant', value: 1 };
    }
    return { type: 'constant', value: 1 };
  }, [selectedClipId, clips]);

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
      .then((thumbs) => { setThumbnails(thumbs); setIsReady(true); })
      .catch((error) => { console.warn("Thumbnails error:", error); setIsReady(true); });
  }, [clips]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentTime >= totalDuration - 0.1) setCurrentTime(0);
      setIsPlaying(true);
    }
  }, [isPlaying, currentTime, totalDuration]);

  const lastSeekTimeRef = useRef(0);
  const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSeekRef = useRef<number | null>(null);

  const handleTimelineSeek = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, totalDuration));
    setCurrentTime(clampedTime);
    setIsPlaying(false);
    isDraggingTimeline.current = true;

    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    pendingSeekRef.current = clampedTime;

    const now = Date.now();
    if (now - lastSeekTimeRef.current < 150) {
      seekTimeoutRef.current = setTimeout(() => {
        if (pendingSeekRef.current !== null) {
          setCurrentTime(pendingSeekRef.current);
          pendingSeekRef.current = null;
          lastSeekTimeRef.current = Date.now();
        }
        isDraggingTimeline.current = false;
      }, 150);
      return;
    }

    lastSeekTimeRef.current = now;
    pendingSeekRef.current = null;

    setTimeout(() => { isDraggingTimeline.current = false; }, 200);
  }, [totalDuration]);

  // --- TRASH LOGIC START ---
  const TRASH_ZONE_Y = previewDimensions.height - 80; 
  const TRASH_ZONE_X_MIN = (SCREEN_WIDTH / 2) - 40;
  const TRASH_ZONE_X_MAX = (SCREEN_WIDTH / 2) + 40;

  const handleStickerDragStart = useCallback(() => {
    setIsDraggingSticker(true);
    RNAnimated.spring(trashOpacity, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [trashOpacity]);

  const handleStickerDragUpdate = useCallback((x: number, y: number) => {
    // Check agar sticker Trash zone ke andar aaya
    const inTrashZone = y > TRASH_ZONE_Y && x > TRASH_ZONE_X_MIN && x < TRASH_ZONE_X_MAX;
    setIsHoveringTrash(inTrashZone);
  }, [TRASH_ZONE_Y, TRASH_ZONE_X_MIN, TRASH_ZONE_X_MAX]);

  const handleStickerDragEnd = useCallback((id: string, x: number, y: number) => {
    setIsDraggingSticker(false);
    setIsHoveringTrash(false);
    
    RNAnimated.timing(trashOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Agar delete zone mein chora, toh sticker remove kardo
    if (y > TRASH_ZONE_Y && x > TRASH_ZONE_X_MIN && x < TRASH_ZONE_X_MAX) {
      if (onDeleteOverlay) onDeleteOverlay(id);
    }
  }, [TRASH_ZONE_Y, TRASH_ZONE_X_MIN, TRASH_ZONE_X_MAX, onDeleteOverlay, trashOpacity]);
  // --- TRASH LOGIC END ---

  const handleClipPress = useCallback((clip: CameraClip) => {
    setSelectedClipId(clip.id);
  }, []);

  const handleSpeedSelectionChange = useCallback((selection: SpeedSelection) => {
    if (!selectedClipId) return;
    const updatedClips = clips.map((c) => {
      if (c.id === selectedClipId) {
        return { ...c, speedConfig: selection, durationMultiplier: selection.type === 'constant' ? (1 / (selection.value as number)) : 1.0 };
      }
      return c;
    });
    onClipsUpdate(calculateTimelinePositions(updatedClips));
  }, [selectedClipId, clips, onClipsUpdate]);

  const handleTrimStart = useCallback((clip: CameraClip, newTrimStart: number) => {
    const updatedClips = clips.map((c) => c.id === clip.id ? clampTrimPoints({ ...c, trimStart: newTrimStart }) : c);
    onClipsUpdate(calculateTimelinePositions(updatedClips));
  }, [clips, onClipsUpdate]);

  const handleTrimEnd = useCallback((clip: CameraClip, newTrimEnd: number) => {
    const updatedClips = clips.map((c) => c.id === clip.id ? clampTrimPoints({ ...c, trimEnd: newTrimEnd }) : c);
    onClipsUpdate(calculateTimelinePositions(updatedClips));
  }, [clips, onClipsUpdate]);

  const handleClipReorder = useCallback((fromIndex: number, toIndex: number) => {
    const newClips = [...clips];
    const [movedClip] = newClips.splice(fromIndex, 1);
    newClips.splice(toIndex, 0, movedClip);
    onClipsUpdate(calculateTimelinePositions(newClips));
  }, [clips, onClipsUpdate]);

  const handleDeleteClip = useCallback(() => {
    if (!selectedClipId) {
      const clipAtTime = getClipAtTimelineTime(clips, currentTime);
      if (clipAtTime) setSelectedClipId(clipAtTime.clip.id);
      return;
    }
    const newClips = clips.filter((c) => c.id !== selectedClipId);
    if (newClips.length === 0) { onBack?.(); return; }
    const positionedClips = calculateTimelinePositions(newClips);
    if (currentTime > getTotalTimelineDuration(positionedClips)) setCurrentTime(getTotalTimelineDuration(positionedClips));
    setSelectedClipId(undefined);
    onClipsUpdate(positionedClips);
  }, [selectedClipId, clips, currentTime, onClipsUpdate, onBack]);

  const handleTimelineScroll = useCallback((scrollX: number) => {
    isDraggingTimeline.current = true;
    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    seekTimeoutRef.current = setTimeout(() => { isDraggingTimeline.current = false; }, 200);
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const handleFilter = useCallback((filter: FilterConfig) => {
    setCurrentFilter(filter);
    const clipsToUpdate = selectedClipId ? clips.filter((c) => c.id === selectedClipId) : clips;
    const updatedClips = clips.map((clip) => {
      if (clipsToUpdate.some((c) => c.id === clip.id)) {
        if (filter.name === "Original" || !hasFilterChanges(filter)) {
          const { filterPreset, ...clipWithoutFilter } = clip;
          return { ...clipWithoutFilter };
        } else {
          return { ...clip, filterPreset: filter };
        }
      }
      return clip;
    });
    onClipsUpdate(updatedClips);
  }, [selectedClipId, clips, onClipsUpdate]);

  const handleOverlay = useCallback(() => { 
    Alert.alert("Overlay", "Overlay feature - Coming soon with more options!");
  }, []);
  const handleText = useCallback(() => { setSelectedTextOverlay(null); setSelectedOverlayId(null); setShowTextEditor(true); }, []);
  
  const currentClipForText = useMemo(() => getClipAtTimelineTime(clips, currentTime)?.clip || clips[0] || null, [clips, currentTime]);
  const currentTextOverlays = useMemo(() => currentClipForText?.textOverlays || [], [currentClipForText]);

  const handleTextOverlayPress = useCallback((overlay: TextOverlay) => {
    setSelectedTextOverlay(overlay); setSelectedOverlayId(overlay.id); setShowTextEditor(true);
  }, []);

  const handleTextOverlaySave = useCallback((overlay: TextOverlay) => {
    if (!currentClipForText) return;
    const existingOverlays = currentClipForText.textOverlays || [];
    const existingIndex = existingOverlays.findIndex((o) => o.id === overlay.id);
    let updatedOverlays = existingIndex >= 0 ? existingOverlays.map((o, i) => i === existingIndex ? overlay : o) : [...existingOverlays, overlay];
    onClipsUpdate(clips.map((clip) => clip.id === currentClipForText.id ? { ...clip, textOverlays: updatedOverlays } : clip));
    setSelectedOverlayId(null); setShowTextEditor(false);
  }, [currentClipForText, clips, onClipsUpdate]);

  const handleTextOverlayDelete = useCallback((overlayId: string) => {
    if (!currentClipForText) return;
    const updatedOverlays = (currentClipForText.textOverlays || []).filter((o) => o.id !== overlayId);
    onClipsUpdate(clips.map((clip) => clip.id === currentClipForText.id ? { ...clip, textOverlays: updatedOverlays } : clip));
    setSelectedOverlayId(null); setSelectedTextOverlay(null); setShowTextEditor(false);
  }, [currentClipForText, clips, onClipsUpdate]);

  const handleTextOverlayUpdate = useCallback((overlay: TextOverlay) => {
    if (!currentClipForText) return;
    const existingOverlays = currentClipForText.textOverlays || [];
    const existingIndex = existingOverlays.findIndex((o) => o.id === overlay.id);
    if (existingIndex >= 0) {
      const updatedOverlays = [...existingOverlays]; updatedOverlays[existingIndex] = overlay;
      onClipsUpdate(clips.map((clip) => clip.id === currentClipForText.id ? { ...clip, textOverlays: updatedOverlays } : clip));
    }
  }, [currentClipForText, clips, onClipsUpdate]);

  const handleTextEditorClose = useCallback(() => { setShowTextEditor(false); setSelectedTextOverlay(null); setSelectedOverlayId(null); }, []);
  
  const handleMusic = useCallback(() => { 
    Alert.alert("Music", "Music library - Access your music files");
  }, []);
  const handleVoiceAdd = useCallback((voice: any) => { 
    Alert.alert("Voice Over", `Added voice: ${voice?.name || 'Voice'}`);
  }, []);
  const handleSoundFXAdd = useCallback((sound: any) => { 
    Alert.alert("Sound FX", `Added sound effect: ${sound?.name || 'Sound'}`);
  }, []);
  const handleCaptionAdd = useCallback((caption: any) => { 
    Alert.alert("Captions", "Caption added to timeline");
  }, []);
  const handleAdjustChange = useCallback((settings: any) => { 
    console.log("Adjust settings applied:", settings);
  }, []);
  const handleOverlayEffectAdd = useCallback((effect: any) => {
    console.log("✨ Overlay effect added:", effect);
  }, []);
  const handleCutoutAdd = useCallback((cutout: any) => { 
    Alert.alert("Cutout", "Cutout effect applied");
  }, []);
  const handleLinkAdd = useCallback((link: any) => { 
    Alert.alert("Links", `Added link: ${link?.url || 'Link'}`);
  }, []);
  const handlePaste = useCallback((content: string) => { 
    Alert.alert("Paste", "Content pasted to timeline");
  }, []);

  const handleAddPress = useCallback(() => { setShowAddClipOverlay(true); }, []);
  const handleSelectCamera = useCallback(() => { setShowAddClipOverlay(false); onAddClip?.("camera"); }, [onAddClip]);
  const handleSelectGallery = useCallback((newClip: CameraClip) => {
    setShowAddClipOverlay(false);
    if (onAddClipFromGallery) onAddClipFromGallery(newClip);
    else onClipsUpdate(calculateTimelinePositions([...clips, newClip]));
  }, [onAddClipFromGallery, clips, onClipsUpdate]);

  const handleTrim = useCallback(() => {
    setShowTrimHandles((prev) => !prev);
    if (!showTrimHandles && isPlaying) setIsPlaying(false);
  }, [showTrimHandles, isPlaying]);

  if (clips.length === 0) {
    console.warn('⚠️ TimelineEditor: No clips to render!');
    return <View style={styles.container}><Text style={{ color: '#fff', alignSelf: 'center', marginTop: 100 }}>No clips to edit</Text></View>;
  }

  console.log('✅ TimelineEditor: Rendering with', clips.length, 'clips - First clip:', clips[0]?.uri?.substring(0, 50));

  return (
    <View style={styles.container}>
      
      {/* TOP HEADER */}
      <View style={styles.topHeader}>
         <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
               <Path d="M18 6L6 18M6 6l12 12" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
         </TouchableOpacity>
         
         <View style={{flexDirection: 'row', alignItems: 'center'}}>
           <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginRight: 4 }}>New project</Text>
           <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"><Path d="M6 9l6 6 6-6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
         </View>
         
         <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
           <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 12}}>HD</Text>
           <TouchableOpacity style={styles.exportButton} onPress={onNext}>
              <Text style={{ color: '#000', fontSize: 14, fontWeight: '800' }}>Export</Text>
           </TouchableOpacity>
         </View>
      </View>

      {/* VIDEO PREVIEW AREA - TOP */}
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

        {currentClipForText && <DraggableTextOverlays overlays={currentTextOverlays} containerWidth={previewDimensions.width} containerHeight={previewDimensions.height} currentTime={currentTime} onOverlayUpdate={handleTextOverlayUpdate} onOverlayPress={handleTextOverlayPress} selectedOverlayId={selectedOverlayId} />}

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
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none"><Path d="M8 5v14l11-7L8 5z" fill="#ffffff" /></Svg>
             </View>
          </TouchableOpacity>
        )}
      </View>

      {/* EDITING AREA - BOTTOM (3 COLUMN LAYOUT) */}
      <View style={styles.editingAreaContainer}>
        
        {/* LEFT COLUMN - CONTROLS */}
        <View style={styles.leftControls}>
          {/* Play/Pause Button - Orange Circle */}
          <TouchableOpacity style={styles.playButtonLarge} onPress={togglePlayPause}>
            {isPlaying ? (
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="#000" /></Svg>
            ) : (
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M8 5v14l11-7L8 5z" fill="#000" /></Svg>
            )}
          </TouchableOpacity>

          {/* Add Audio Button */}
          <TouchableOpacity style={styles.addAudioButton}>
            <Text style={{ fontSize: 16, color: '#fff' }}>+</Text>
            <Text style={{ fontSize: 9, color: '#888', marginTop: 2 }}>Add</Text>
            <Text style={{ fontSize: 9, color: '#888' }}>audio</Text>
          </TouchableOpacity>

          {/* Delete Button */}
          {selectedClipId && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteClip}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="9" fill="none" stroke="#ff4d4d" strokeWidth="2" />
                <Path d="M7 12h10" stroke="#ff4d4d" strokeWidth="2" strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          )}
        </View>

        {/* CENTER COLUMN - TIMELINE */}
        <View style={styles.centerEditingArea}>
          <View style={styles.timelineWrapper}>
            <View style={styles.playheadLine} pointerEvents="none" />
            
            {isReady && (
              <MultiClipTimeline
                clips={clips}
                currentTime={currentTime}
                selectedClipId={selectedClipId}
                thumbnails={thumbnails}
                onClipPress={handleClipPress}
                onTrimStart={showTrimHandles ? handleTrimStart : undefined}
                onTrimEnd={showTrimHandles ? handleTrimEnd : undefined}
                onClipReorder={handleClipReorder}
                onTimelineSeek={handleTimelineSeek}
                onScroll={handleTimelineScroll}
              />
            )}
            
            <TouchableOpacity style={styles.floatingAddButton} onPress={handleAddPress}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M12 5v14M5 12h14" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></Svg>
            </TouchableOpacity>
          </View>

          {/* Time Display & Controls Row */}
          <View style={styles.timeControlsRow}>
            <View style={styles.timeDisplaySmall}>
              <Text style={styles.timeText}>{formatTime(currentTime)} / {formatTime(totalDuration)}</Text>
              <Text style={styles.secondsText}>{(currentTime % 1 !== 0 ? currentTime.toFixed(1) : Math.floor(currentTime))}s</Text>
            </View>
          </View>
        </View>

        {/* RIGHT COLUMN - CONTROLS */}
        <View style={styles.rightControls}>
          {/* Undo Button */}
          <TouchableOpacity onPress={onUndo} disabled={!canUndo} style={{ opacity: canUndo ? 1 : 0.4, padding: 8 }}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M9 14L4 9l5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><Path d="M4 9h10c3.3 0 6 2.7 6 6s-2.7 6-6 6H9" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
          </TouchableOpacity>

          {/* Redo Button */}
          <TouchableOpacity onPress={onRedo} disabled={!canRedo} style={{ opacity: canRedo ? 1 : 0.4, padding: 8 }}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M15 14l5-5-5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><Path d="M20 9H10C6.7 9 4 11.7 4 15s2.7 6 6 6h5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
          </TouchableOpacity>

          {/* Volume/Audio Icon */}
          <TouchableOpacity style={styles.volumeButton}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M3 9v6a2 2 0 002 2h4l5 5v-16l-5 5H5a2 2 0 00-2 2z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
          </TouchableOpacity>
        </View>
      </View>

      {/* BOTTOM TOOLBAR */}
      <View style={styles.bottomToolbar}>
        {isReady && (
          <PreviewActionButtons
            displayUri={currentClipUri}
            onFilter={handleFilter}
            onOverlay={handleOverlay}
            onText={handleText}
            onSticker={(type, content) => onSelectOverlay?.(type, content)} 
            onMusic={handleMusic}
            onVoiceAdd={handleVoiceAdd}
            onSoundFXAdd={handleSoundFXAdd}
            onCaptionAdd={handleCaptionAdd}
            onAdjustChange={handleAdjustChange}
            onOverlayEffectAdd={handleOverlayEffectAdd}
            onCutoutAdd={handleCutoutAdd}
            onLinkAdd={handleLinkAdd}
            onPaste={handlePaste}
            startTime={currentTime}
            onTTSGenerate={() => console.log('TTS Generate')}
            onUpdateAudioTracks={() => console.log('Audio Tracks Updated')}
            onUpdateAudioMix={() => console.log('Audio Mix Updated')}
            audioTracks={[]}
            masterVolume={1}
          />
        )}
      </View>

      <AddClipOverlay visible={showAddClipOverlay} onClose={() => setShowAddClipOverlay(false)} onSelectCamera={handleSelectCamera} onSelectGallery={handleSelectGallery} />
      <TextEditorModal visible={showTextEditor} overlay={selectedTextOverlay} onSave={handleTextOverlaySave} onDelete={handleTextOverlayDelete} onClose={handleTextEditorClose} containerWidth={previewDimensions.width} containerHeight={previewDimensions.height} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A", flexDirection: 'column' },
  
  topHeader: {
    height: 56, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#0A0A0A', 
    zIndex: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  exportButton: { 
    backgroundColor: '#fff', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20 
  },

  /* VIDEO PREVIEW AREA - TOP */
  videoPreviewArea: {
    height: SCREEN_HEIGHT * 0.30,
    width: '100%',
    backgroundColor: '#000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },

  playCenterOverlay: { 
    position: 'absolute', 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 5 
  }, 
  playCircle: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  /* EDITING AREA - 3 COLUMN LAYOUT */
  editingAreaContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },

  /* LEFT COLUMN - CONTROLS */
  leftControls: {
    width: 70,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 12,
    gap: 12,
    borderRightWidth: 0.5,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },

  playButtonLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ec9a15',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },

  addAudioButton: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },

  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* CENTER COLUMN - EDITING AREA */
  centerEditingArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'column',
  },

  timelineWrapper: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },

  playheadLine: {
    position: 'absolute', 
    left: '50%', 
    top: 0, 
    bottom: 0, 
    width: 2,
    backgroundColor: '#fff', 
    zIndex: 99,
  },

  floatingAddButton: {
    position: 'absolute', 
    right: 10, 
    bottom: 10, 
    width: 36, 
    height: 36,
    borderRadius: 6, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 3, 
    elevation: 4, 
    zIndex: 100,
  },

  timeControlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },

  timeDisplaySmall: {
    alignItems: 'center',
  },

  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  secondsText: {
    color: '#888',
    fontSize: 10,
    marginTop: 1,
    fontWeight: '400',
  },

  /* RIGHT COLUMN - CONTROLS */
  rightControls: {
    width: 60,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 12,
    gap: 8,
    borderLeftWidth: 0.5,
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
  },

  volumeButton: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* BOTTOM TOOLBAR */
  bottomToolbar: { 
    height: 65, 
    backgroundColor: '#0A0A0A', 
    justifyContent: 'center', 
    borderTopWidth: 0.5, 
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },

  /* Legacy/hidden styles */
  mainEditingArea: { display: 'none' },
  videoCanvas: { display: 'none' },
  trashContainer: { display: 'none' },
  trashCircle: { display: 'none' },
  trashCircleHover: { display: 'none' },
  controlRibbon: { display: 'none' },
  timeCurrent: { display: 'none' },
  timeDuration: { display: 'none' },
  timelineArea: { display: 'none' },
  timeDisplayRow: { display: 'none' },
  contextActionsRow: { display: 'none' },
  actionButton: { display: 'none' },
  actionButtonText: { display: 'none' },
  toolbarArea: { display: 'none' },
});

export default TimelineEditor;