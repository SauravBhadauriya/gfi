// PATH: apps/gully-fame-mobile/src/modules/video-editor/camera-module/components/timeline/TimelineEditor.tsx

import React, { useCallback, useState, useMemo, useRef, useEffect } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, ScrollView, Modal, TextInput, Alert, SafeAreaView, ActivityIndicator } from "react-native";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import type { CameraClip } from "../../types/camera.types";
import MultiClipPlayer from "./MultiClipPlayer";
import { musicLibraryService } from "../../../../../api/services/musicLibraryService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type TrackCategory = 'visual' | 'audio';
type TrackType = 'adjust' | 'text' | 'voice' | 'audio' | 'captions' | 'overlay' | 'soundfx' | 'sticker' | 'link' | 'cutout';

interface TrackItem {
  id: string;
  type: TrackType;
  category: TrackCategory;
  label: string;
  color: string;
  startPos: number; // exact start time in seconds
  duration: number; // length in seconds
}

interface TimelineEditorProps {
  clips: CameraClip[];
  onClipsUpdate: (clips: CameraClip[]) => void;
  onBack?: () => void;
  onNext?: () => void;
  onAddClip?: (source: "camera" | "gallery") => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

// --- EFFECTS & STICKERS (Not track data) ---
const DUMMY_FILTERS = ['Paris', 'Vintage', 'Cinematic', 'B&W', 'Cool', 'Warm'];
const DUMMY_STICKERS = ['🔥', '❤️', '😂', '✨', '🎵', '💯'];

interface AudioTrack {
  _id: string;
  title: string;
  artist: string;
  duration: number;
  audioUrl?: string;
  usageCount?: number;
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({
  clips, onClipsUpdate, onBack, onNext, onAddClip, onUndo, onRedo,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [localClips, setLocalClips] = useState<CameraClip[]>(clips);
  
  // Custom Tracks State
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  // Modals System
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');

  // Audio Library State (Real API)
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Load audio tracks from real API when modal opens
  const loadAudioTracks = async () => {
    try {
      setAudioLoading(true);
      setAudioError(null);
      const result = await musicLibraryService.listAudio("trending", 1, 20);
      if (result.success && result.data?.tracks) {
        setAudioTracks(result.data.tracks);
      } else {
        setAudioError('Failed to load audio tracks');
      }
    } catch (error) {
      console.error('[TimelineEditor] Error loading audio tracks:', error);
      setAudioError('Error loading audio library');
    } finally {
      setAudioLoading(false);
    }
  };

  // Load audio tracks on component mount or when modal opens
  useEffect(() => {
    if (activeModal === 'audio' && audioTracks.length === 0 && !audioLoading) {
      loadAudioTracks();
    }
  }, [activeModal]);

  const totalDuration = useMemo(() => localClips.reduce((acc, c) => acc + (c.duration || 3), 0), [localClips]);

  const PIXELS_PER_SECOND = 60;
  const totalTimelineWidth = totalDuration * PIXELS_PER_SECOND;

  const togglePlayPause = useCallback(() => {
    if (isPlaying) setIsPlaying(false);
    else {
      if (currentTime >= totalDuration - 0.1) setCurrentTime(0);
      setIsPlaying(true);
    }
  }, [isPlaying, currentTime, totalDuration]);

  const handleTimelineScroll = useCallback((scrollX: number) => {
    if (!isPlaying) {
      const validScroll = Math.max(0, scrollX);
      const newTime = validScroll / PIXELS_PER_SECOND;
      setCurrentTime(Math.min(newTime, totalDuration));
    }
  }, [isPlaying, totalDuration]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // --- 📍 REAL-TIME EXACT POSITIONING ---
  const handleAddTrack = (type: TrackType, category: TrackCategory, label: string, color: string, defaultDuration: number = 3) => {
    const newTrack: TrackItem = {
      id: `${type}-${Date.now()}`,
      type,
      category,
      label,
      color,
      startPos: currentTime, // Track always starts EXACTLY at playhead
      duration: Math.min(defaultDuration, totalDuration - currentTime),
    };
    setTracks(prev => [newTrack, ...prev]);
    setSelectedTrackId(newTrack.id);
    setActiveModal(null);
  };

  // --- 🎚️ REAL-TIME TRIM & MOVE EDITOR ---
  const adjustSelectedTrack = (action: 'move_left' | 'move_right' | 'trim_left' | 'trim_right') => {
    if (!selectedTrackId) return;
    setTracks(prev => prev.map(t => {
      if (t.id !== selectedTrackId) return t;
      let { startPos, duration } = t;

      const STEP = 0.5; // Change by 0.5 seconds per click
      if (action === 'move_left') startPos = Math.max(0, startPos - STEP);
      if (action === 'move_right') startPos = Math.min(totalDuration - duration, startPos + STEP);
      if (action === 'trim_left') duration = Math.max(1, duration - STEP);
      if (action === 'trim_right') duration = Math.min(totalDuration - startPos, duration + STEP);

      return { ...t, startPos, duration };
    }));
  };

  const deleteSelectedTrack = () => {
    setTracks(prev => prev.filter(t => t.id !== selectedTrackId));
    setSelectedTrackId(null);
  };

  // --- ✂️ REAL-TIME SPLIT VIDEO LOGIC ---
  const handleSplitVideo = () => {
    let accTime = 0;
    let splitIdx = -1;
    let localTimeInClip = 0;

    for (let i = 0; i < localClips.length; i++) {
      const clipDuration = localClips[i].duration || 3;
      if (currentTime > accTime && currentTime < accTime + clipDuration) {
        splitIdx = i;
        localTimeInClip = currentTime - accTime;
        break;
      }
      accTime += clipDuration;
    }

    if (splitIdx !== -1) {
      const targetClip = localClips[splitIdx];
      const clipDuration = targetClip.duration || 3;
      
      if (localTimeInClip > 0.5 && (clipDuration - localTimeInClip) > 0.5) {
        const leftClip: CameraClip = { ...targetClip, id: `${targetClip.id}-L`, duration: localTimeInClip };
        const rightClip: CameraClip = { ...targetClip, id: `${targetClip.id}-R`, duration: clipDuration - localTimeInClip };
        
        const updatedClips = [...localClips];
        updatedClips.splice(splitIdx, 1, leftClip, rightClip);
        setLocalClips(updatedClips);
        onClipsUpdate(updatedClips);
        Alert.alert("✂️ Split Done!", "Video successfully split at playhead position.");
      } else {
        Alert.alert("⚠️ Cannot Split", "Playhead is too close to the clip edge.");
      }
    }
  };

  if (clips.length === 0) return <View style={styles.container}><Text style={{ color: '#fff', alignSelf: 'center', marginTop: 100 }}>No clips to edit</Text></View>;

  return (
    <View style={styles.container}>
      
      {/* 1. TOP HEADER */}
      <View style={styles.topHeader}>
         <TouchableOpacity style={styles.iconButtonDark} onPress={onBack}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none"><Path d="M19 9L12 16L5 9" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></Svg>
         </TouchableOpacity>
         <View style={styles.editsPill}>
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}><Rect x="4" y="4" width="12" height="16" rx="4" stroke="#FF007F" strokeWidth="2" /><Rect x="8" y="4" width="12" height="16" rx="4" stroke="#7F00FF" strokeWidth="2" /></Svg>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>Open in Edits</Text>
         </View>
         <TouchableOpacity style={styles.exportButton} onPress={onNext}>
            <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold' }}>Next ⟩</Text>
         </TouchableOpacity>
      </View>

      {/* 2. VIDEO PREVIEW AREA */}
      <View style={styles.videoPreviewArea}>
        <View style={styles.videoBox}>
          <MultiClipPlayer clips={localClips} currentTime={currentTime} isPlaying={isPlaying} onTimeUpdate={setCurrentTime} onEnd={() => setIsPlaying(false)} isDraggingTimeline={false} />
        </View>
      </View>

      {/* 🎛️ TRACK EDITOR ACTIONS (Only visible when a track is tapped) */}
      {selectedTrackId && (
        <View style={styles.trackEditorBar}>
            <TouchableOpacity style={styles.editActionBtn} onPress={() => adjustSelectedTrack('move_left')}><Text style={styles.editActionBtnText}>← Move</Text></TouchableOpacity>
            <TouchableOpacity style={styles.editActionBtn} onPress={() => adjustSelectedTrack('move_right')}><Text style={styles.editActionBtnText}>Move →</Text></TouchableOpacity>
            <TouchableOpacity style={styles.editActionBtn} onPress={() => adjustSelectedTrack('trim_left')}><Text style={styles.editActionBtnText}>Trim -</Text></TouchableOpacity>
            <TouchableOpacity style={styles.editActionBtn} onPress={() => adjustSelectedTrack('trim_right')}><Text style={styles.editActionBtnText}>Trim +</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.editActionBtn, {backgroundColor: '#d32f2f'}]} onPress={deleteSelectedTrack}><Text style={styles.editActionBtnText}>🗑 Delete</Text></TouchableOpacity>
        </View>
      )}

      {/* 3. PLAYBACK CONTROLS ROW */}
      <View style={styles.playbackControlsRow}>
        <TouchableOpacity style={styles.playPauseBtn} onPress={togglePlayPause}>
          {isPlaying ? (
             <Svg width="18" height="18" viewBox="0 0 24 24" fill="none"><Rect x="6" y="4" width="4" height="16" fill="#FFF" rx="1" /><Rect x="14" y="4" width="4" height="16" fill="#FFF" rx="1" /></Svg>
          ) : (
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none"><Path d="M5 3L19 12L5 21V3Z" fill="#FFF" /></Svg>
          )}
        </TouchableOpacity>

        <View style={styles.timerCenter}>
            <Text style={styles.timeTextWhite}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeTextGray}> / {formatTime(totalDuration)}</Text>
        </View>

        <TouchableOpacity style={styles.splitBtn} onPress={handleSplitVideo}>
           <Text style={{color: '#FFF', fontSize: 12, fontWeight: 'bold'}}>✂️ SPLIT</Text>
        </TouchableOpacity>
      </View>

      {/* 4. THE MASTER MULTI-TRACK TIMELINE */}
      <View style={styles.timelineArea}>
        {/* Playhead Center Static Guide Line */}
        <View style={styles.playheadLineContainer} pointerEvents="none">
            <View style={styles.playheadDot} />
            <View style={styles.playheadLine} />
        </View>

        {/* 🔥 VERTICAL SCROLLER: Enables unlimited tracks without breaking layout */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
          <View style={{ flexDirection: 'row' }}>
            
            {/* Left Track Icons Panel (Sticky Left, Scrolls Vertically) */}
            <View style={styles.leftTrackIconsPanel}>
                <View style={styles.rulerPlaceholder} />
                {tracks.map(t => (
                    <View key={`icon-${t.id}`} style={styles.trackIconBox}>
                        <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          {t.category === 'visual' 
                              ? <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              : <Path d="M11 5L6 9H2v6h4l5 4V5z M15.54 8.46a5 5 0 010 7.07 M19.07 4.93a10 10 0 010 14.14" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          }
                        </Svg>
                    </View>
                ))}
                <View style={[styles.trackIconBox, { height: 50 }]}><Text style={{fontSize: 16}}>🎞️</Text></View>
            </View>

            {/* 🔥 HORIZONTAL SCROLLER: Timeline moving with time */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} onScroll={(e) => handleTimelineScroll(e.nativeEvent.contentOffset.x)} scrollEventThrottle={16} contentContainerStyle={{ paddingHorizontal: SCREEN_WIDTH / 2 - 40 }}>
              <View style={{ width: totalTimelineWidth + 100, paddingVertical: 5 }}>
                 
                 {/* Ruler Row */}
                 <View style={styles.rulerContainer}>
                   {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
                     <View key={i} style={[styles.rulerTickWrapper, { left: i * PIXELS_PER_SECOND }]}>
                        <View style={styles.rulerTick} />
                        {i % 2 === 0 && <Text style={styles.rulerText}>{i}s</Text>}
                     </View>
                   ))}
                 </View>

                 {/* Custom Tracks Rendering */}
                 {tracks.map((track) => {
                     const isSelected = selectedTrackId === track.id;
                     return (
                     <View key={track.id} style={styles.trackRowGeneric}>
                        <TouchableOpacity 
                            activeOpacity={0.9}
                            onPress={() => setSelectedTrackId(track.id)}
                            style={[
                                styles.genericClipBlock, 
                                { backgroundColor: track.color, width: track.duration * PIXELS_PER_SECOND, left: track.startPos * PIXELS_PER_SECOND },
                                isSelected && { borderWidth: 2, borderColor: '#FFF' }
                            ]}
                        >
                            <Text style={styles.genericClipText} numberOfLines={1}>{track.label}</Text>
                            {/* Waveforms for Audio */}
                            {track.category === 'audio' && (
                                <View style={styles.waveformContainer}>
                                    <Svg width="100%" height="20" viewBox="0 0 100 20" preserveAspectRatio="none" opacity="0.3">
                                        <Path d="M0 10 Q 5 20, 10 10 T 20 10 T 30 15 T 40 5 T 50 10 T 60 20 T 70 5 T 80 15 T 90 10 T 100 10" stroke="#FFF" strokeWidth="2" fill="none" />
                                    </Svg>
                                </View>
                            )}
                            <View style={styles.trimHandleLeft}><View style={styles.trimHandleKnob} /></View>
                            <View style={styles.trimHandleRight}><View style={styles.trimHandleKnob} /></View>
                        </TouchableOpacity>
                     </View>
                 )})}

                 {/* MAIN VIDEO TRACK */}
                 <View style={styles.trackRowVideo}>
                    <View style={[styles.videoClipBlock, { width: totalTimelineWidth }]}>
                        <View style={styles.trimHandleLeft} />
                        <View style={styles.framesContainer}>
                            {localClips.map((clip, index) => (
                                <View key={`${clip.id}-${index}`} style={[styles.frameMockup, { width: (clip.duration || 3) * PIXELS_PER_SECOND }]}>
                                    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" opacity="0.4">
                                        <Path d="M4 16L8 12L12 16M10 14L14 10L20 16" stroke="#FFF" strokeWidth="2"/><Circle cx="8" cy="8" r="2" stroke="#FFF" strokeWidth="2"/>
                                    </Svg>
                                </View>
                            ))}
                        </View>
                        <View style={styles.trimHandleRight} />
                    </View>
                    <TouchableOpacity style={styles.inlineAddButton} onPress={() => onAddClip?.('gallery')}>
                        <Svg width="16" height="16" viewBox="0 0 24 24" fill="none"><Path d="M12 5V19M5 12H19" stroke="#000" strokeWidth="3" strokeLinecap="round" /></Svg>
                    </TouchableOpacity>
                 </View>

              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </View>
      <Text style={styles.helperText}>Tap on a track to trim/move. Use Playhead to set insert position.</Text>

      {/* 5. FULL BOTTOM TOOL TRAY (Matching exact sequence) */}
      <View style={styles.bottomToolTray}>
         <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolsScroll}>
          <TouchableOpacity style={styles.toolItem} onPress={() => setActiveModal('audio')}><Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Path d="M9 18V5L21 3V13" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><Circle cx="6" cy="18" r="3" stroke="#FFF" strokeWidth="2"/><Circle cx="18" cy="16" r="3" stroke="#FFF" strokeWidth="2"/></Svg><Text style={styles.toolLabel}>Audio</Text></TouchableOpacity>
          <TouchableOpacity style={styles.toolItem} onPress={() => setActiveModal('text')}><Text style={styles.aaText}>Aa</Text><Text style={styles.toolLabel}>Text</Text></TouchableOpacity>
          <TouchableOpacity style={styles.toolItem} onPress={() => setActiveModal('voice')}><Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><Path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg><Text style={styles.toolLabel}>Voice</Text></TouchableOpacity>
          <TouchableOpacity style={styles.toolItem} onPress={() => setActiveModal('link')}><Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><Path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg><Text style={styles.toolLabel}>Links</Text></TouchableOpacity>
          <TouchableOpacity style={styles.toolItem} onPress={() => setActiveModal('captions')}><Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Rect x="2" y="5" width="20" height="14" rx="3" stroke="#FFF" strokeWidth="2"/><Path d="M9 10C8.4477 10 8 10.4477 8 11V13C8 13.5523 8.4477 14 9 14H10" stroke="#FFF" strokeWidth="2" strokeLinecap="round"/><Path d="M15 10C14.4477 10 14 10.4477 14 11V13C14 13.5523 14.4477 14 15 14H16" stroke="#FFF" strokeWidth="2" strokeLinecap="round"/></Svg><Text style={styles.toolLabel}>Captions</Text></TouchableOpacity>
          <TouchableOpacity style={styles.toolItem} onPress={() => setActiveModal('adjust_menu')}><Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="5" stroke="#FFF" strokeWidth="2"/><Path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="#FFF" strokeWidth="2" strokeLinecap="round"/></Svg><Text style={styles.toolLabel}>Adjust</Text></TouchableOpacity>
          <TouchableOpacity style={styles.toolItem} onPress={() => setActiveModal('filters')}><Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="8" stroke="#FFF" strokeWidth="2"/><Circle cx="12" cy="12" r="3" stroke="#FFF" strokeWidth="2"/></Svg><Text style={styles.toolLabel}>Filters</Text></TouchableOpacity>
          <TouchableOpacity style={styles.toolItem} onPress={() => setActiveModal('overlay')}><Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Rect x="3" y="3" width="14" height="14" rx="2" stroke="#FFF" strokeWidth="2"/><Rect x="7" y="7" width="14" height="14" rx="2" stroke="#FFF" strokeWidth="2"/><Path d="M10 14H18M14 10V18" stroke="#FFF" strokeWidth="2" strokeLinecap="round"/></Svg><Text style={styles.toolLabel}>Overlay</Text></TouchableOpacity>
          <TouchableOpacity style={styles.toolItem} onPress={() => setActiveModal('soundfx')}><Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" stroke="#FFF" strokeWidth="2" strokeLinejoin="round"/></Svg><Text style={styles.toolLabel}>Sound FX</Text></TouchableOpacity>
          <TouchableOpacity style={styles.toolItem} onPress={() => setActiveModal('cutout')}><Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Path d="M6 6A2 2 0 1 1 2 6A2 2 0 0 1 6 6ZM10 6L14 18M14 6L10 18" stroke="#FFF" strokeWidth="2" strokeLinecap="round"/><Circle cx="18" cy="18" r="2" stroke="#FFF" strokeWidth="2"/><Circle cx="6" cy="18" r="2" stroke="#FFF" strokeWidth="2"/></Svg><Text style={styles.toolLabel}>Cutout</Text></TouchableOpacity>
          <TouchableOpacity style={styles.toolItem} onPress={() => setActiveModal('sticker')}><Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Rect x="3" y="3" width="18" height="18" rx="5" stroke="#FFF" strokeWidth="2"/><Path d="M8 10V10.01M16 10V10.01" stroke="#FFF" strokeWidth="2" strokeLinecap="round"/><Path d="M8 15C9.33333 16.5 14.6667 16.5 16 15" stroke="#FFF" strokeWidth="2" strokeLinecap="round"/></Svg><Text style={styles.toolLabel}>Stickers</Text></TouchableOpacity>
          <TouchableOpacity style={styles.toolItem} onPress={() => Alert.alert("Paste", "Clipboard empty.")}><Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" stroke="#FFF" strokeWidth="2" strokeLinecap="round"/><Rect x="8" y="2" width="8" height="4" rx="1" stroke="#FFF" strokeWidth="2"/></Svg><Text style={styles.toolLabel}>Paste</Text></TouchableOpacity>
         </ScrollView>
      </View>

      {/* --- ALL FUNCTIONAL MODALS --- */}
      <Modal visible={activeModal === 'audio'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, {height: '60%'}]}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Audio Library</Text><TouchableOpacity onPress={() => setActiveModal(null)}><Text style={{color:'#FFF', fontSize: 20}}>✕</Text></TouchableOpacity></View>
            {audioLoading && (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size="large" color="#D81B60" />
                <Text style={{color: '#AAA', marginTop: 12}}>Loading audio tracks...</Text>
              </View>
            )}
            {audioError && !audioLoading && (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20}}>
                <Text style={{color: '#FF6B6B', textAlign: 'center', marginBottom: 12}}>{audioError}</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={loadAudioTracks}>
                  <Text style={{color: '#000', fontWeight: 'bold'}}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            {!audioLoading && !audioError && audioTracks.length === 0 && (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{color: '#888'}}>No audio tracks available</Text>
              </View>
            )}
            {!audioLoading && !audioError && audioTracks.length > 0 && (
              <ScrollView>
                {audioTracks.map(track => {
                  const usageDisplay = track.usageCount 
                    ? track.usageCount >= 100000 
                      ? `${Math.floor(track.usageCount / 100000)}L reels`
                      : `${track.usageCount} uses`
                    : 'No usage data';
                  
                  return (
                    <TouchableOpacity 
                      key={track._id} 
                      style={styles.listItem} 
                      onPress={() => handleAddTrack('audio', 'audio', track.title, '#D81B60', track.duration || 6)}
                    >
                      <View style={styles.albumArt}><Text>🎵</Text></View>
                      <View style={{flex: 1}}>
                        <Text style={{color: '#FFF', fontWeight: 'bold'}}>{track.title}</Text>
                        <Text style={{color: '#888', fontSize: 12}}>{track.artist} • {usageDisplay}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={activeModal === 'sticker'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, {height: '40%'}]}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Stickers</Text><TouchableOpacity onPress={() => setActiveModal(null)}><Text style={{color:'#FFF', fontSize: 20}}>✕</Text></TouchableOpacity></View>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', padding: 20, gap: 20, justifyContent: 'center'}}>
              {DUMMY_STICKERS.map(s => (
                <TouchableOpacity key={s} onPress={() => handleAddTrack('sticker', 'visual', `Emoji ${s}`, '#FFC107', 3)}><Text style={{fontSize: 40}}>{s}</Text></TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={activeModal === 'text'} animationType="fade" transparent>
        <View style={[styles.modalOverlay, {justifyContent: 'flex-start', paddingTop: 60}]}>
          <View style={{flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20}}>
            <TouchableOpacity style={styles.doneBtnDark} onPress={() => { handleAddTrack('text', 'visual', textInput || 'Text Layer', '#8A2BE2', 4); setTextInput(''); }}>
                <Text style={{color: '#FFF', fontWeight: 'bold'}}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <TextInput style={{color: '#FFF', fontSize: 36, fontWeight: 'bold', textAlign: 'center'}} placeholder="Type here..." placeholderTextColor="#666" value={textInput} onChangeText={setTextInput} autoFocus />
          </View>
        </View>
      </Modal>

      <Modal visible={activeModal === 'adjust_menu'} animationType="slide" transparent>
        <View style={styles.modalOverlay}><View style={styles.modalSheet}><View style={styles.modalHeader}><Text style={styles.modalTitle}>W Adjust</Text><TouchableOpacity onPress={() => handleAddTrack('adjust', 'visual', 'Adjustments', '#E64A19', totalDuration)}><Text style={{color:'#FFF', fontSize: 20}}>✓</Text></TouchableOpacity></View>
            <ScrollView>
                {['Brightness', 'Contrast', 'Highlights', 'Shadows'].map(lbl => (
                    <View key={lbl} style={{paddingHorizontal: 20, paddingVertical: 15}}><View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10}}><Text style={{color: '#FFF'}}>{lbl}</Text><Text style={{color: '#FFF'}}>0</Text></View><View style={{height: 4, backgroundColor: '#333', borderRadius: 2}}><View style={{width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF', position: 'absolute', left: '47%', top: -8}} /></View></View>
                ))}
            </ScrollView>
        </View></View>
      </Modal>

      <Modal visible={activeModal === 'filters'} animationType="slide" transparent>
        <View style={styles.modalOverlay}><View style={styles.modalSheet}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Filters</Text><TouchableOpacity onPress={() => setActiveModal(null)}><Text style={{color:'#FFF', fontSize: 20}}>✕</Text></TouchableOpacity></View>
            <ScrollView horizontal style={{padding: 15}}>
              {DUMMY_FILTERS.map(f => (
                <TouchableOpacity key={f} style={styles.filterPill} onPress={() => handleAddTrack('adjust', 'visual', `Filter: ${f}`, '#E64A19', totalDuration)}><Text style={{color:'#FFF'}}>{f}</Text></TouchableOpacity>
              ))}
            </ScrollView>
        </View></View>
      </Modal>

      <Modal visible={activeModal === 'captions'} animationType="slide" transparent>
        <View style={styles.modalOverlay}><View style={styles.modalSheet}><View style={styles.modalHeader}><TouchableOpacity onPress={() => setActiveModal(null)}><Text style={{color:'#FFF', fontSize: 20}}>✕</Text></TouchableOpacity><Text style={styles.modalTitle}>Captions</Text><View style={{width:20}}/></View>
            <View style={{padding: 20}}>
                <View style={styles.captionRow}><Text style={styles.captionLabel}>CC  Generate from</Text><Text style={styles.captionValue}>All audio ⟩</Text></View>
                <View style={styles.captionRow}><Text style={styles.captionLabel}>||| Spoken language</Text><Text style={styles.captionValue}>Auto-detect ⟩</Text></View>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => handleAddTrack('captions', 'visual', 'Captions', '#E64A19', totalDuration)}><Text style={{color:'#000', fontWeight:'bold'}}>Generate captions</Text></TouchableOpacity>
            </View>
        </View></View>
      </Modal>

      <Modal visible={activeModal === 'voice'} animationType="slide" transparent>
        <View style={styles.modalOverlay}><View style={[styles.modalSheet, {height: 350, alignItems: 'center'}]}><View style={{width: '100%', flexDirection: 'row', justifyContent: 'space-between', padding: 20}}><TouchableOpacity onPress={() => setActiveModal(null)}><Text style={{color: '#FFF', fontSize: 20}}>✕</Text></TouchableOpacity><Text style={{color: '#FFF', fontSize: 16, fontWeight: 'bold'}}>Add your script here...</Text><View style={{width: 20}}/></View>
            <TouchableOpacity style={{width: 80, height: 80, borderRadius: 40, backgroundColor: '#D81B60', marginTop: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#FFF'}} onPress={() => handleAddTrack('voice', 'audio', 'Voiceover', '#D81B60', 5)} />
            <Text style={{color: '#AAA', marginTop: 20}}>Tap to record dummy voice</Text>
        </View></View>
      </Modal>

      <Modal visible={activeModal === 'link' || activeModal === 'overlay' || activeModal === 'soundfx' || activeModal === 'cutout'} animationType="slide" transparent>
        <View style={styles.modalOverlay}><View style={styles.modalSheet}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Action</Text><TouchableOpacity onPress={() => setActiveModal(null)}><Text style={{color:'#FFF', fontSize: 20}}>✕</Text></TouchableOpacity></View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => handleAddTrack('overlay', 'visual', 'Extra Layer', '#0095f6', 4)}><Text style={{color:'#000', fontWeight:'bold'}}>Apply Feature to Timeline</Text></TouchableOpacity>
        </View></View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
  iconButtonDark: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 18 },
  editsPill: { flexDirection: 'row', alignItems: 'center' },
  exportButton: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  
  videoPreviewArea: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', paddingVertical: 10 },
  videoBox: { width: SCREEN_WIDTH * 0.55, height: SCREEN_HEIGHT * 0.4, backgroundColor: '#1A1A1A', borderRadius: 8, overflow: 'hidden' },
  
  trackEditorBar: { flexDirection: 'row', backgroundColor: '#1C1C1E', padding: 8, justifyContent: 'space-around', borderBottomWidth: 1, borderColor: '#333' },
  editActionBtn: { backgroundColor: '#333', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  editActionBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  playbackControlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginVertical: 12 },
  playPauseBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 18 },
  timerCenter: { flexDirection: 'row', alignItems: 'center', position: 'absolute', left: 0, right: 0, justifyContent: 'center', zIndex: -1 },
  timeTextWhite: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  timeTextGray: { color: '#888' },
  splitBtn: { backgroundColor: '#222', borderWidth: 1, borderColor: '#444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },

  timelineArea: { height: 260, backgroundColor: '#0A0A0A', position: 'relative', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#222' },
  leftTrackIconsPanel: { width: 35, backgroundColor: '#111', zIndex: 10, paddingTop: 20 },
  trackIconBox: { height: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 4, borderBottomWidth: 0.5, borderColor: '#222' },
  rulerPlaceholder: { height: 20 },

  playheadLineContainer: { position: 'absolute', left: SCREEN_WIDTH / 2, top: 0, bottom: 0, width: 2, backgroundColor: '#FFF', zIndex: 99, alignItems: 'center' },
  playheadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF', top: 4 },
  playheadLine: { width: 2, flex: 1, backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.5 },
  
  rulerContainer: { height: 20, position: 'relative', marginBottom: 5 },
  rulerTickWrapper: { position: 'absolute', top: 5, alignItems: 'center', width: 20, marginLeft: -10 },
  rulerTick: { width: 1, height: 4, backgroundColor: '#555' },
  rulerText: { color: '#666', fontSize: 9, marginTop: 4, fontWeight: 'bold' },
  
  trackRowGeneric: { height: 40, position: 'relative', marginBottom: 4 },
  genericClipBlock: { position: 'absolute', height: '100%', borderRadius: 6, justifyContent: 'center', paddingHorizontal: 10, overflow: 'hidden' },
  genericClipText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', zIndex: 2 },
  trimHandleLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 12, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  trimHandleRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 12, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  trimHandleKnob: { width: 2, height: 10, backgroundColor: '#FFF', borderRadius: 1 },
  waveformContainer: { position: 'absolute', left: 0, right: 0, bottom: 2, height: 20 },

  trackRowVideo: { height: 50, position: 'relative', marginTop: 4 },
  videoClipBlock: { position: 'absolute', height: '100%', flexDirection: 'row', backgroundColor: '#222', borderRadius: 6, overflow: 'hidden' },
  framesContainer: { flex: 1, flexDirection: 'row' },
  frameMockup: { height: '100%', borderRightWidth: 1, borderColor: '#111', justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' },
  inlineAddButton: { position: 'absolute', right: -40, top: 10, width: 30, height: 30, borderRadius: 8, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },

  bottomToolTray: { paddingBottom: 25, backgroundColor: '#000', paddingTop: 15 },
  toolsScroll: { paddingHorizontal: 16, gap: 24 },
  toolItem: { alignItems: 'center', justifyContent: 'center', width: 45 },
  toolLabel: { color: '#FFF', fontSize: 11, fontWeight: '600', marginTop: 8 },
  aaText: { color: '#FFF', fontSize: 24, fontWeight: 'bold', fontFamily: 'serif' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 40, paddingTop: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 0.5, borderColor: '#333' },
  modalTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderColor: '#333' },
  albumArt: { width: 40, height: 40, backgroundColor: '#FFF', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  inputField: { backgroundColor: '#2C2C2E', color: '#FFF', padding: 12, borderRadius: 8, marginBottom: 16 },
  primaryBtn: { backgroundColor: '#FFF', padding: 14, borderRadius: 8, alignItems: 'center', marginHorizontal: 16, marginTop: 10 },
  captionRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  captionLabel: { color: '#FFF' }, captionValue: { color: '#888' },
  filterPill: { backgroundColor: '#333', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, marginRight: 12, height: 36 },
  doneBtnDark: { backgroundColor: '#333', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  helperText: { color: '#555', fontSize: 11, textAlign: 'center', marginVertical: 4 },
});

export default TimelineEditor;