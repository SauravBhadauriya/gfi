/**
 * Instagram-Style Video Editor
 * Features:
 * - Timeline with trim/reorder clips
 * - Audio selection & volume control
 * - Filters & effects
 * - Text overlays
 * - Stickers
 * - Cover selection
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

interface VideoClip {
  uri: string;
  duration: number;
  startTime: number;
  endTime: number;
  id: string;
}

interface TextOverlay {
  id: string;
  text: string;
  color: string;
  fontSize: number;
  animation: 'none' | 'fade' | 'slide' | 'typewriter';
  position: { x: number; y: number };
}

interface Sticker {
  id: string;
  imageUri: string;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
}

type FilterType = 'none' | 'vintage' | 'blackwhite' | 'warm' | 'cool' | 'vivid' | 'fade' | 'dramatic' | 'mono' | 'bright' | 'retro';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function VideoEditor() {
  const params = useLocalSearchParams();
  const videoRef = useRef<Video>(null);

  // Parse segments from camera
  const [clips, setClips] = useState<VideoClip[]>(() => {
    try {
      const segments = JSON.parse(params.segments as string || '[]');
      return segments.map((seg: any, idx: number) => ({
        uri: seg.uri,
        duration: seg.duration,
        startTime: 0,
        endTime: seg.duration,
        id: `clip-${idx}`,
      }));
    } catch {
      return [];
    }
  });

  const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<any>(null);
  const [audioVolume, setAudioVolume] = useState(0.5);
  const [originalVolume, setOriginalVolume] = useState(0.5);
  const [coverFrameTime, setCoverFrameTime] = useState(0);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showStickerModal, setShowStickerModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const totalDuration = clips.reduce((sum, clip) => sum + (clip.endTime - clip.startTime), 0);

  // =========================================================================
  // CLIP MANAGEMENT
  // =========================================================================

  const handleDeleteClip = (clipId: string) => {
    Alert.alert(
      'Delete Clip',
      'Are you sure you want to delete this clip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setClips(clips.filter(c => c.id !== clipId)),
        },
      ]
    );
  };

  const handleTrimClip = (clipId: string, startTime: number, endTime: number) => {
    setClips(clips.map(c => 
      c.id === clipId ? { ...c, startTime, endTime } : c
    ));
  };

  // =========================================================================
  // TEXT OVERLAY
  // =========================================================================

  const addTextOverlay = (text: string) => {
    const newOverlay: TextOverlay = {
      id: `text-${Date.now()}`,
      text,
      color: '#ffffff',
      fontSize: 24,
      animation: 'none',
      position: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 },
    };
    setTextOverlays([...textOverlays, newOverlay]);
    setShowTextModal(false);
  };

  // =========================================================================
  // FILTERS
  // =========================================================================

  const FILTERS: FilterType[] = [
    'none', 'vintage', 'blackwhite', 'warm', 'cool',
    'vivid', 'fade', 'dramatic', 'mono', 'bright', 'retro'
  ];

  // =========================================================================
  // NAVIGATION
  // =========================================================================

  const handleNext = async () => {
    if (clips.length === 0) {
      Alert.alert('No Clips', 'Please add at least one video clip');
      return;
    }

    // Navigate to post screen with all editor data
    router.push({
      pathname: '/(main)/reels/post',
      params: {
        clips: JSON.stringify(clips),
        filter: selectedFilter,
        textOverlays: JSON.stringify(textOverlays),
        stickers: JSON.stringify(stickers),
        audioId: selectedAudio?.id,
        audioVolume,
        originalVolume,
        coverFrame: coverFrameTime,
      },
    });
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <View style={styles.container}>
      {/* Video Preview */}
      <View style={styles.videoPreview}>
        {clips.length > 0 && (
          <VideoView
            player={useVideoPlayer(clips[0]?.uri || '', player => {
              player.loop = true;
              player.play();
            })}
            style={styles.video}
            contentFit="cover"
            nativeControls={false}
          />
        )}

        {/* Filter Overlay */}
        {selectedFilter !== 'none' && (
          <View style={[styles.filterOverlay, getFilterStyle(selectedFilter)]} />
        )}

        {/* Text Overlays */}
        {textOverlays.map(overlay => (
          <TouchableOpacity
            key={overlay.id}
            style={[styles.textOverlay, { left: overlay.position.x, top: overlay.position.y }]}
          >
            <Text style={[styles.overlayText, { color: overlay.color, fontSize: overlay.fontSize }]}>
              {overlay.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Timeline */}
      <View style={styles.timeline}>
        <Text style={styles.timelineTitle}>Timeline ({Math.floor(totalDuration)}s)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.clipsList}>
            {clips.map((clip, index) => (
              <View key={clip.id} style={styles.clipItem}>
                <View style={styles.clipThumbnail}>
                  <Text style={styles.clipNumber}>{index + 1}</Text>
                  <Text style={styles.clipDuration}>{Math.floor(clip.endTime - clip.startTime)}s</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteClipBtn}
                  onPress={() => handleDeleteClip(clip.id)}
                >
                  <Ionicons name="close-circle" size={20} color="#FF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Editor Tools */}
      <View style={styles.editorTools}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolsRow}>
          
          {/* Audio */}
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => setShowAudioModal(true)}
          >
            <Ionicons name="musical-notes" size={24} color="#fff" />
            <Text style={styles.toolLabel}>Audio</Text>
            {selectedAudio && <View style={styles.activeDot} />}
          </TouchableOpacity>

          {/* Filters */}
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="color-filter" size={24} color="#fff" />
            <Text style={styles.toolLabel}>Filters</Text>
            {selectedFilter !== 'none' && <View style={styles.activeDot} />}
          </TouchableOpacity>

          {/* Text */}
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => setShowTextModal(true)}
          >
            <Ionicons name="text" size={24} color="#fff" />
            <Text style={styles.toolLabel}>Text</Text>
            {textOverlays.length > 0 && <View style={styles.activeDot} />}
          </TouchableOpacity>

          {/* Stickers */}
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => setShowStickerModal(true)}
          >
            <Ionicons name="happy" size={24} color="#fff" />
            <Text style={styles.toolLabel}>Stickers</Text>
            {stickers.length > 0 && <View style={styles.activeDot} />}
          </TouchableOpacity>

          {/* Adjust */}
          <TouchableOpacity style={styles.toolButton}>
            <Ionicons name="options" size={24} color="#fff" />
            <Text style={styles.toolLabel}>Adjust</Text>
          </TouchableOpacity>

          {/* Cover */}
          <TouchableOpacity style={styles.toolButton}>
            <Ionicons name="image" size={24} color="#fff" />
            <Text style={styles.toolLabel}>Cover</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>

      {/* Audio Volume Controls */}
      {selectedAudio && (
        <View style={styles.audioControls}>
          <View style={styles.volumeRow}>
            <Ionicons name="musical-note" size={16} color="#EC9A15" />
            <Text style={styles.volumeLabel}>Music</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={audioVolume}
              onValueChange={setAudioVolume}
              minimumTrackTintColor="#EC9A15"
              maximumTrackTintColor="#666"
              thumbTintColor="#EC9A15"
            />
            <Text style={styles.volumeValue}>{Math.round(audioVolume * 100)}</Text>
          </View>

          <View style={styles.volumeRow}>
            <Ionicons name="mic" size={16} color="#fff" />
            <Text style={styles.volumeLabel}>Original</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={originalVolume}
              onValueChange={setOriginalVolume}
              minimumTrackTintColor="#EC9A15"
              maximumTrackTintColor="#666"
              thumbTintColor="#EC9A15"
            />
            <Text style={styles.volumeValue}>{Math.round(originalVolume * 100)}</Text>
          </View>
        </View>
      )}

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filtersList}>
                {FILTERS.map(filter => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.filterItem,
                      selectedFilter === filter && styles.filterItemActive
                    ]}
                    onPress={() => {
                      setSelectedFilter(filter);
                      setShowFilterModal(false);
                    }}
                  >
                    <View style={[styles.filterPreview, getFilterStyle(filter)]} />
                    <Text style={styles.filterName}>{filter}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Text Modal */}
      <Modal
        visible={showTextModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTextModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Text</Text>
              <TouchableOpacity onPress={() => setShowTextModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.textInput}
              placeholder="Enter text..."
              placeholderTextColor="#666"
              onSubmitEditing={(e) => addTextOverlay(e.nativeEvent.text)}
              autoFocus
            />

            <View style={styles.textOptions}>
              <Text style={styles.optionLabel}>Font Size</Text>
              <Text style={styles.optionLabel}>Color</Text>
              <Text style={styles.optionLabel}>Animation</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#EC9A15" />
          <Text style={styles.processingText}>Processing video...</Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getFilterStyle(filter: FilterType): any {
  const filterStyles: Record<FilterType, any> = {
    none: {},
    vintage: { backgroundColor: 'rgba(255, 220, 150, 0.3)' },
    blackwhite: { backgroundColor: 'rgba(0, 0, 0, 0.3)' },
    warm: { backgroundColor: 'rgba(255, 150, 100, 0.2)' },
    cool: { backgroundColor: 'rgba(100, 150, 255, 0.2)' },
    vivid: { backgroundColor: 'rgba(255, 100, 200, 0.15)' },
    fade: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
    dramatic: { backgroundColor: 'rgba(0, 0, 0, 0.4)' },
    mono: { backgroundColor: 'rgba(128, 128, 128, 0.3)' },
    bright: { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
    retro: { backgroundColor: 'rgba(200, 100, 50, 0.25)' },
  };
  return filterStyles[filter];
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoPreview: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  textOverlay: {
    position: 'absolute',
    padding: 8,
  },
  overlayText: {
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  timeline: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  timelineTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  clipsList: {
    flexDirection: 'row',
    gap: 8,
  },
  clipItem: {
    width: 80,
    height: 80,
    position: 'relative',
  },
  clipThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EC9A15',
  },
  clipNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  clipDuration: {
    color: '#EC9A15',
    fontSize: 12,
    marginTop: 4,
  },
  deleteClipBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#000',
    borderRadius: 10,
  },
  editorTools: {
    backgroundColor: '#0a0a0a',
    paddingVertical: 16,
  },
  toolsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 20,
  },
  toolButton: {
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  toolLabel: {
    color: '#fff',
    fontSize: 12,
  },
  activeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EC9A15',
  },
  audioControls: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  volumeLabel: {
    color: '#fff',
    fontSize: 12,
    width: 60,
  },
  slider: {
    flex: 1,
  },
  volumeValue: {
    color: '#EC9A15',
    fontSize: 12,
    width: 30,
    textAlign: 'right',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#000',
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EC9A15',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  nextButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  filtersList: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  filterItem: {
    alignItems: 'center',
    gap: 8,
  },
  filterItemActive: {
    opacity: 1,
  },
  filterPreview: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterName: {
    color: '#fff',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  textInput: {
    backgroundColor: '#333',
    color: '#fff',
    fontSize: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
  },
  textOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  optionLabel: {
    color: '#EC9A15',
    fontSize: 14,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
  },
});
