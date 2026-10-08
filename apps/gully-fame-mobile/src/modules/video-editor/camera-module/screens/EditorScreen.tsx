import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { CameraClip, CameraClipArray } from '../types/camera.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Editor tool types
type EditorTool = 
  | 'audio' 
  | 'text' 
  | 'voice' 
  | 'links' 
  | 'captions' 
  | 'doodles' 
  | 'adjust' 
  | 'filters' 
  | 'overlay' 
  | 'soundfx' 
  | 'cutout' 
  | 'stickers';

interface EditorScreenProps {
  clips: CameraClipArray;
  onBack?: () => void;
  onNext?: (editedClips: CameraClipArray) => void;
  initialMusic?: {
    uri: string;
    title: string;
    artist: string;
    startTime: number;
  };
}

const EditorScreen: React.FC<EditorScreenProps> = ({
  clips,
  onBack,
  onNext,
  initialMusic,
}) => {
  const insets = useSafeAreaInsets();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedTool, setSelectedTool] = useState<EditorTool | null>(null);
  const [hdEnabled, setHdEnabled] = useState(true);
  const [editedClips, setEditedClips] = useState<CameraClipArray>(clips);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  // Timeline scroll
  const timelineScrollRef = useRef<ScrollView>(null);
  const [timelineScrollX, setTimelineScrollX] = useState(0);
  
  // Video player
  const currentVideoUri = editedClips[0]?.uri || '';
  const player = useVideoPlayer(currentVideoUri, (player) => {
    if (currentVideoUri) {
      player.loop = false;
      player.play();
    }
  });

  // Calculate total duration from all clips
  useEffect(() => {
    const totalDuration = editedClips.reduce((sum, clip) => sum + (clip.duration || 0), 0);
    setDuration(totalDuration);
  }, [editedClips]);

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
  const handleToolSelect = useCallback((tool: EditorTool) => {
    setSelectedTool(tool === selectedTool ? null : tool);
  }, [selectedTool]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle undo/redo
  const handleUndo = () => {
    // TODO: Implement undo stack
    console.log('Undo pressed');
  };

  const handleRedo = () => {
    // TODO: Implement redo stack
    console.log('Redo pressed');
  };

  // Handle next
  const handleNext = () => {
    onNext?.(editedClips);
  };

  // Render timeline clips with thumbnails
  const renderTimelineClips = () => {
    return editedClips.map((clip, index) => (
      <View key={clip.id} style={styles.timelineClip}>
        <View style={styles.timelineClipThumbnail}>
          {/* TODO: Add actual thumbnail image */}
          <View style={styles.timelineClipPlaceholder}>
            <MaterialIcons name="video-library" size={20} color="#666" />
          </View>
        </View>
        <View style={styles.timelineClipHandle} />
        <View style={[styles.timelineClipHandle, styles.timelineClipHandleRight]} />
      </View>
    ));
  };

  // Editor tools configuration
  const editorTools: Array<{ id: EditorTool; label: string; icon: string }> = [
    { id: 'audio', label: 'Audio', icon: 'musical-note' },
    { id: 'text', label: 'Text', icon: 'text' },
    { id: 'voice', label: 'Voice', icon: 'mic' },
    { id: 'links', label: 'Links', icon: 'link' },
    { id: 'captions', label: 'Captions', icon: 'chatbox-ellipses' },
    { id: 'doodles', label: 'Doodles', icon: 'brush' },
    { id: 'adjust', label: 'Adjust', icon: 'options' },
    { id: 'filters', label: 'Filters', icon: 'color-filter' },
    { id: 'overlay', label: 'Overlay', icon: 'layers' },
    { id: 'soundfx', label: 'Sound FX', icon: 'volume-high' },
    { id: 'cutout', label: 'Cutout', icon: 'cut' },
    { id: 'stickers', label: 'Stickers', icon: 'happy' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.closeButton} onPress={onBack}>
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
            <Text style={[styles.hdButtonText, hdEnabled && styles.hdButtonTextActive]}>
              HD
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="chevron-forward" size={16} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Video Preview */}
      <View style={styles.videoContainer}>
        <View style={styles.videoWrapper}>
          {currentVideoUri && (
            <VideoView
              player={player}
              style={styles.video}
              contentFit="contain"
              nativeControls={false}
            />
          )}
        </View>
      </View>

      {/* Playback Controls */}
      <View style={styles.playbackControls}>
        <TouchableOpacity 
          style={styles.playButton}
          onPress={togglePlayPause}
        >
          <Ionicons 
            name={isPlaying ? 'pause' : 'play'} 
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
          onPress={handleUndo}
          disabled={!canUndo}
        >
          <MaterialIcons name="undo" size={24} color={canUndo ? '#fff' : '#666'} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.redoButton, !canRedo && styles.controlButtonDisabled]}
          onPress={handleRedo}
          disabled={!canRedo}
        >
          <MaterialIcons name="redo" size={24} color={canRedo ? '#fff' : '#666'} />
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
          <View style={styles.timelineWrapper}>
            {/* Fixed playhead in center */}
            <View style={styles.playheadContainer}>
              <View style={styles.playhead} />
              <View style={styles.playheadLine} />
            </View>

            {/* Scrollable timeline */}
            <ScrollView
              ref={timelineScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(e) => setTimelineScrollX(e.nativeEvent.contentOffset.x)}
              style={styles.timelineScroll}
              contentContainerStyle={styles.timelineContent}
            >
              {renderTimelineClips()}
              
              {/* Add clip button */}
              <TouchableOpacity style={styles.addClipButton}>
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

        {/* Audio track */}
        <View style={styles.audioTrack}>
          <Text style={styles.trackLabel}>Audio</Text>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.trackScrollView}
          >
            {/* Audio clips/waveform will go here */}
          </ScrollView>
        </View>
      </View>

      {/* Bottom Toolbar */}
      <View style={[styles.bottomToolbar, { paddingBottom: insets.bottom }]}>
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
                color={selectedTool === tool.id ? '#EC9A15' : '#fff'} 
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
      </View>

      {/* Tool-specific bottom sheet will be rendered here based on selectedTool */}
      {selectedTool && (
        <View style={styles.toolPanel}>
          <Text style={styles.toolPanelTitle}>{selectedTool.toUpperCase()} Tool</Text>
          <Text style={styles.toolPanelText}>Tool panel for {selectedTool}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#000',
  },
  closeButton: {
    padding: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  titleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  titleIcon: {
    marginLeft: 4,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderColor: '#666',
  },
  hdButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  hdButtonTextActive: {
    color: '#fff',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  nextButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },

  // Video Preview
  videoContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  videoWrapper: {
    width: SCREEN_WIDTH * 0.5,
    aspectRatio: 9 / 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  video: {
    width: '100%',
    height: '100%',
  },

  // Playback Controls
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
    backgroundColor: '#0a0a0a',
    paddingTop: 8,
  },
  overlayTrack: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  mainTrack: {
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  audioTrack: {
    height: 50,
  },
  trackLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  timelineWrapper: {
    flex: 1,
    position: 'relative',
  },
  playheadContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    zIndex: 10,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  playhead: {
    width: 3,
    height: 12,
    backgroundColor: '#fff',
    borderRadius: 1.5,
  },
  playheadLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#fff',
  },
  timelineScroll: {
    flex: 1,
  },
  timelineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH / 2,
    gap: 4,
  },
  timelineClip: {
    width: 120,
    height: 60,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  timelineClipThumbnail: {
    width: '100%',
    height: '100%',
  },
  timelineClipPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  timelineClipHandle: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: '#EC9A15',
  },
  timelineClipHandleRight: {
    left: undefined,
    right: 0,
  },
  addClipButton: {
    width: 60,
    height: 60,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#666',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackScrollView: {
    flex: 1,
  },

  // Bottom Toolbar
  bottomToolbar: {
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: 12,
  },
  toolbarContent: {
    paddingHorizontal: 16,
    gap: 24,
  },
  toolButton: {
    alignItems: 'center',
    minWidth: 60,
  },
  toolButtonActive: {
    // Active state styling
  },
  toolLabel: {
    color: '#fff',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  toolLabelActive: {
    color: '#EC9A15',
  },

  // Tool Panel
  toolPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  toolPanelTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  toolPanelText: {
    color: '#888',
    fontSize: 14,
  },
});

export default EditorScreen;
