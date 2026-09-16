// PATH: apps/gully-fame-mobile/src/modules/video-editor/screens/PreviewScreen.tsx

import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import ExportScreen from '../components/ExportScreen';
import TimelineEditor from '../components/timeline/TimelineEditor';
import MusicLibraryModal from '../components/MusicLibraryModal'; 
import StickerLibraryModal from '../components/StickerLibraryModal';
import MultiClipPlayer from '../components/timeline/MultiClipPlayer'; 

// 🔥 NEW IMPORTS: Text Editor aur Voiceover Studio
import TextEditorModal from '../components/TextEditorModal';
let VoiceoverStudioModal: any = null;

// Try to import VoiceoverStudioModal with fallback
try {
  const voiceoverModule = require('../components/VoiceoverStudioModal');
  VoiceoverStudioModal = voiceoverModule.default;
} catch (error) {
  console.warn('[PreviewScreen] Failed to load VoiceoverStudioModal, using mock:', error);
  // Fallback: render a dummy component
  VoiceoverStudioModal = ({ visible, onClose }: any) => null;
}

import { useUndoRedo } from '../hooks/useUndoRedo';
import { cameraStyles } from '../styles/cameraStyles';
import type { CameraClipArray } from '../types/camera.types';
import type { TextOverlay } from '../types/textOverlay.types'; // Used for TextEditor

interface ActiveOverlay {
  id: string;
  type: 'image' | 'emoji' | 'text';
  content: string | number;
}

interface PreviewScreenProps {
  clips: CameraClipArray;
  onBack?: () => void;
  onClipUpdate?: (clips: CameraClipArray) => void;
  onAddClip?: (source: 'camera' | 'gallery') => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PreviewScreen: React.FC<PreviewScreenProps> = ({ 
  clips, 
  onBack, 
  onClipUpdate, 
  onAddClip 
}) => {
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [updatedClips, setUpdatedClips] = useState<CameraClipArray>(clips);
  const [showExport, setShowExport] = useState(false);
  
  // Navigation States
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  
  // MODALS VISIBILITY STATES (Buttons wiring)
  const [isMusicModalVisible, setIsMusicModalVisible] = useState(false);
  const [isStickerModalVisible, setIsStickerModalVisible] = useState(false);
  
  // 🔥 TEXT EDITOR STATE
  const [isTextModeActive, setIsTextModeActive] = useState(false);
  const [selectedTextOverlay, setSelectedTextOverlay] = useState<TextOverlay | null>(null);
  
  // 🔥 VOICEOVER STUDIO STATE
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  
  // Player state
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Overlays state
  const [overlays, setOverlays] = useState<ActiveOverlay[]>([]);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const overlayCounterRef = useRef(0);

  const undoRedo = useUndoRedo(clips);

  // Calculate total duration (Required for Voiceover Studio)
  const totalDuration = React.useMemo(() => {
    return updatedClips.reduce((acc, clip) => acc + (clip.duration || 3), 0);
  }, [updatedClips]);

  useEffect(() => {
    if (clips && clips.length > 0) {
      setUpdatedClips(clips);
      undoRedo.reset(clips);
    }
  }, [clips]); 

  // Tool Handlers
  const handleAudioToolPress = () => setIsMusicModalVisible(true);
  const handleStickerToolPress = () => setIsStickerModalVisible(true);
  
  const handleTextToolPress = () => {
    setSelectedTextOverlay(null); // Clear selected to open fresh editor
    setIsTextModeActive(true);
  };
  
  const handleVoiceToolPress = () => setIsVoiceModeActive(true);

  const handleSelectOverlay = useCallback((type: 'image' | 'emoji' | 'text', content: string | number) => {
    overlayCounterRef.current += 1;
    const newOverlay: ActiveOverlay = {
      id: `overlay-${Date.now()}-${overlayCounterRef.current}`,
      type,
      content,
    };
    setOverlays(prev => [...prev, newOverlay]);
    setActiveOverlayId(newOverlay.id);
  }, []);

  const handleDeleteOverlay = useCallback((id: string) => {
    setOverlays(prev => prev.filter(item => item.id !== id));
    setActiveOverlayId(null);
  }, []);

  const handleNext = useCallback(() => setShowExport(true), []);

  if (!clips?.length || !updatedClips[currentClipIndex]) {
    return (
      <SafeAreaView style={[cameraStyles.previewContainer, styles.emptyContainer]}>
        <Text style={styles.emptyText}>No media found</Text>
      </SafeAreaView>
    );
  }

  if (showExport) {
    return (
      <ExportScreen clips={updatedClips} onBack={() => setShowExport(false)} onComplete={() => onBack?.()} />
    );
  }

  // ADVANCED CAPCUT STYLE EDITOR
  if (isAdvancedMode) {
    return (
      <View style={styles.container}>
        <TimelineEditor
          clips={updatedClips}
          onClipsUpdate={(newClips) => {
            undoRedo.addToHistory({ clips: updatedClips });
            setUpdatedClips(newClips);
            onClipUpdate?.(newClips);
          }}
          onBack={() => setIsAdvancedMode(false)}
          onNext={handleNext}
          onAddClip={(source) => onAddClip?.(source)}
          onAddClipFromGallery={() => {}}
          onUndo={() => {}}
          onRedo={() => {}}
          canUndo={undoRedo.canUndo}
          canRedo={undoRedo.canRedo}
          overlays={overlays}
          activeOverlayId={activeOverlayId}
          onSelectOverlay={handleSelectOverlay}
          onDeleteOverlay={handleDeleteOverlay}
          setActiveOverlayId={setActiveOverlayId}
        />
      </View>
    );
  }

  // INSTAGRAM REELS STYLE QUICK PREVIEW
  return (
    <View style={styles.container}>
      
      {/* 🎬 ASLI VIDEO PLAYER RUNNING IN BACKGROUND */}
      <View style={[StyleSheet.absoluteFillObject, { zIndex: 0, backgroundColor: '#000' }]}>
        <MultiClipPlayer
          clips={updatedClips}
          currentTime={currentTime}
          isPlaying={isPlaying}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity style={styles.audioExplorePill} onPress={handleAudioToolPress}>
            <View style={styles.audioThumbnail}>
              <Text style={styles.thumbnailText}>🎵</Text>
            </View>
            <View style={styles.audioPillTextContainer}>
              <Text style={styles.audioPillTitle}>Explore audio</Text>
              <Text style={styles.audioPillSubtitle}>Tap to browse</Text>
            </View>
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={styles.chevronIcon}>
              <Path d="M9 18L15 12L9 6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>

          <View style={styles.backButton} />
        </View>

        {/* BOTTOM CONTROLS AREA */}
        <View style={styles.bottomArea}>
          
          <TouchableOpacity style={styles.swipeUpContainer} onPress={() => setIsAdvancedMode(true)}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M18 15L12 9L6 15" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.swipeUpText}>Swipe up to edit</Text>
          </TouchableOpacity>

          {/* Horizontal Tools Row */}
          <View style={styles.toolsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolsScroll}>
              
              {/* AUDIO BUTTON */}
              <View style={styles.toolItem}>
                <TouchableOpacity style={styles.toolIconBox} onPress={handleAudioToolPress}>
                  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <Path d="M9 18V5L21 3V13" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <Circle cx="6" cy="18" r="3" stroke="#FFFFFF" strokeWidth="2"/>
                    <Circle cx="18" cy="16" r="3" stroke="#FFFFFF" strokeWidth="2"/>
                    <Path d="M22 8H16M19 5V11" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
                  </Svg>
                </TouchableOpacity>
                <Text style={styles.toolLabel}>Audio</Text>
              </View>

              {/* TEXT BUTTON */}
              <View style={styles.toolItem}>
                <TouchableOpacity style={styles.toolIconBox} onPress={handleTextToolPress}>
                  <Text style={styles.aaText}>Aa</Text>
                </TouchableOpacity>
                <Text style={styles.toolLabel}>Text</Text>
              </View>

              {/* VOICE BUTTON */}
              <View style={styles.toolItem}>
                <TouchableOpacity style={styles.toolIconBox} onPress={handleVoiceToolPress}>
                  <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <Path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <Path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </Svg>
                </TouchableOpacity>
                <Text style={styles.toolLabel}>Voice</Text>
              </View>

              {/* CAPTIONS BUTTON (Placeholder for now) */}
              <View style={styles.toolItem}>
                <TouchableOpacity style={styles.toolIconBox}>
                  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <Rect x="2" y="5" width="20" height="14" rx="3" stroke="#FFFFFF" strokeWidth="2"/>
                    <Path d="M9 10C8.44772 10 8 10.4477 8 11V13C8 13.5523 8.44772 14 9 14H10" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
                    <Path d="M15 10C14.4477 10 14 10.4477 14 11V13C14 13.5523 14.4477 14 15 14H16" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
                  </Svg>
                </TouchableOpacity>
                <Text style={styles.toolLabel}>Captions</Text>
              </View>

              {/* STICKERS BUTTON */}
              <View style={styles.toolItem}>
                <TouchableOpacity style={styles.toolIconBox} onPress={handleStickerToolPress}>
                  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <Rect x="3" y="3" width="18" height="18" rx="5" stroke="#FFFFFF" strokeWidth="2"/>
                    <Path d="M8 10V10.01M16 10V10.01" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
                    <Path d="M8 15C9.33333 16.5 14.6667 16.5 16 15" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
                  </Svg>
                </TouchableOpacity>
                <Text style={styles.toolLabel}>Stickers</Text>
              </View>
            </ScrollView>
          </View>

          {/* Footer Action Row */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.openEditsButton} onPress={() => setIsAdvancedMode(true)}>
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                <Rect x="4" y="4" width="16" height="16" rx="2" stroke="#FFFFFF" strokeWidth="2"/>
                <Path d="M9 4V20" stroke="#FFFFFF" strokeWidth="2"/>
              </Svg>
              <Text style={styles.openEditsText}>Open in Edits</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextBlueButton} onPress={handleNext}>
              <Text style={styles.nextBlueText}>Next</Text>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 4 }}>
                <Path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* -------------------- */}
      {/* ALL MODALS RENDERED HERE */}
      {/* -------------------- */}

      <MusicLibraryModal
        visible={isMusicModalVisible}
        onCancel={() => setIsMusicModalVisible(false)}
        selectedMusic={null}
        onSelect={(music) => {
          setIsMusicModalVisible(false);
        }}
      />

      <StickerLibraryModal
        visible={isStickerModalVisible}
        onClose={() => setIsStickerModalVisible(false)}
        onSelectSticker={(sticker) => {
          handleSelectOverlay('emoji', sticker);
        }}
      />

      <TextEditorModal 
        visible={isTextModeActive} 
        overlay={selectedTextOverlay} 
        onSave={(newTextOverlay) => {
          // You can push this overlay into your 'overlays' array or pass it to DraggableTextOverlays component later
          console.log("Saving text:", newTextOverlay);
          setIsTextModeActive(false);
        }} 
        onDelete={() => {
          setIsTextModeActive(false);
        }} 
        onClose={() => setIsTextModeActive(false)} 
        containerWidth={SCREEN_WIDTH} 
        containerHeight={SCREEN_HEIGHT} 
      />

      <VoiceoverStudioModal
        visible={isVoiceModeActive}
        onClose={() => setIsVoiceModeActive(false)}
        onSaveVoiceover={(audioUri, duration) => {
          console.log("Voiceover saved: ", audioUri, duration);
          setIsVoiceModeActive(false);
        }}
        totalDuration={totalDuration}
        currentTime={currentTime}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  emptyContainer: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' },
  emptyText: { color: '#FFFFFF', fontSize: 16 },
  safeArea: { flex: 1, justifyContent: 'space-between', zIndex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  audioExplorePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)', borderRadius: 30, paddingVertical: 6, paddingHorizontal: 10 },
  audioThumbnail: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#8B4513', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  thumbnailText: { fontSize: 14 },
  audioPillTextContainer: { marginRight: 8 },
  audioPillTitle: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  audioPillSubtitle: { color: '#CCC', fontSize: 11 },
  chevronIcon: { opacity: 0.8 },
  bottomArea: { paddingBottom: 20, paddingTop: 60 },
  swipeUpContainer: { alignItems: 'center', marginBottom: 20, opacity: 0.9 },
  swipeUpText: { color: '#FFF', fontSize: 14, fontWeight: '700', marginTop: 4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  toolsContainer: { marginBottom: 24 },
  toolsScroll: { paddingHorizontal: 16, gap: 12 },
  toolItem: { alignItems: 'center', width: 76 },
  toolIconBox: { width: 65, height: 65, backgroundColor: 'rgba(0, 0, 0, 0.6)', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  aaText: { color: '#FFF', fontSize: 26, fontWeight: 'bold', fontFamily: 'serif' },
  toolLabel: { color: '#FFF', fontSize: 12, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 40 },
  openEditsButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24 },
  openEditsText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  nextBlueButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24 },
  nextBlueText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});

export default PreviewScreen;