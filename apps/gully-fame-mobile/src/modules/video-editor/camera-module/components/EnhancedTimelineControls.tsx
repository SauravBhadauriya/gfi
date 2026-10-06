import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import ScriptEditorModal from './ScriptEditorModal';
import VoiceEffectsModal from './VoiceEffectsModal';
import TextToSpeechModal from './TextToSpeechModal';
import TimelineAudioPanel from './TimelineAudioPanel';
import type { TextToSpeechConfig } from '../types/audioEffects.types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TimelineControlsProps {
  currentTime: number;
  duration: number;
  onTimeChange: (time: number) => void;
  onPlayPause: () => void;
  isPlaying: boolean;
  onSplit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onCrop?: () => void;
  onSlip?: () => void;
  onVolume?: () => void;
  onFade?: () => void;
  onCopy?: () => void;
  onVoiceEnhance?: () => void;
  onAudioFX?: () => void;
  onFilterPress?: () => void;
  onTextPress?: () => void;
}

interface AudioTrack {
  id: string;
  name: string;
  type: 'music' | 'voiceover' | 'sound_effect' | 'tts';
  duration: number;
  volume: number;
  isMuted: boolean;
  canCrop: boolean;
  canFade: boolean;
}

const EnhancedTimelineControls: React.FC<TimelineControlsProps> = ({
  currentTime,
  duration,
  onTimeChange,
  onPlayPause,
  isPlaying,
  onSplit,
  onDelete,
  onDuplicate,
  onCrop,
  onSlip,
  onVolume,
  onFade,
  onCopy,
  onVoiceEnhance,
  onAudioFX,
  onFilterPress,
  onTextPress,
}) => {
  const [showScriptEditor, setShowScriptEditor] = useState(false);
  const [showVoiceEffects, setShowVoiceEffects] = useState(false);
  const [showTextToSpeech, setShowTextToSpeech] = useState(false);
  const [showAudioPanel, setShowAudioPanel] = useState(false);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);

  const handleAddAudio = useCallback((config: TextToSpeechConfig) => {
    const { text, voice, rate } = config;
    const newTrack: AudioTrack = {
      id: `audio_${Date.now()}`,
      name: `TTS - ${voice}`,
      type: 'tts',
      duration: Math.ceil(text.length / 5) * (2 - rate),
      volume: 80,
      isMuted: false,
      canCrop: true,
      canFade: true,
    };
    setAudioTracks(prev => [...prev, newTrack]);
  }, []);

  const handleUpdateTracks = useCallback((tracks: AudioTrack[]) => {
    setAudioTracks(tracks);
  }, []);

  const tools = [
    { id: 'split', label: 'Split', icon: 'content-cut', type: 'material', action: onSplit || onCrop },
    { id: 'volume', label: 'Volume', icon: 'volume-medium-outline', type: 'ion', action: onVolume },
    { id: 'audioFx', label: 'Audio FX', icon: 'options-outline', type: 'ion', action: onAudioFX || (() => setShowAudioPanel(true)) },
    { id: 'voiceEnhance', label: 'Voice enhance', icon: 'microphone-outline', type: 'material', action: onVoiceEnhance || (() => setShowVoiceEffects(true)) },
    { id: 'delete', label: 'Delete', icon: 'trash-can-outline', type: 'material', action: onDelete, danger: true },
    { id: 'fade', label: 'Fade audio', icon: 'chart-bell-curve-cumulative', type: 'material', action: onFade },
    { id: 'copy', label: 'Copy', icon: 'content-copy', type: 'material', action: onCopy },
    { id: 'duplicate', label: 'Duplicate', icon: 'content-duplicate', type: 'material', action: onDuplicate },
    { id: 'slip', label: 'Slip', icon: 'arrow-all', type: 'material', action: onSlip },
    { id: 'text', label: 'Text', icon: 'format-text', type: 'material', action: onTextPress },
    { id: 'tts', label: 'TTS', icon: 'text-to-speech', type: 'material', action: () => setShowTextToSpeech(true) },
    { id: 'script', label: 'Script', icon: 'pencil-outline', type: 'material', action: () => setShowScriptEditor(true) },
    { id: 'filter', label: 'Filter', icon: 'color-filter-outline', type: 'ion', action: onFilterPress },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.controlsScroll}
        contentContainerStyle={styles.controlsContainer}
      >
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={styles.toolBtn}
            onPress={tool.action}
            activeOpacity={0.7}
          >
            {tool.type === 'material' ? (
              <MaterialCommunityIcons
                name={tool.icon as any}
                size={22}
                color={tool.danger ? '#FF3B30' : '#EC9A15'}
              />
            ) : (
              <Ionicons
                name={tool.icon as any}
                size={22}
                color={tool.danger ? '#FF3B30' : '#EC9A15'}
              />
            )}
            <Text style={[styles.toolLabel, tool.danger && { color: '#FF3B30' }]}>
              {tool.label}
            </Text>
            {tool.id === 'audioFx' && audioTracks.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{audioTracks.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modals */}
      <ScriptEditorModal
        visible={showScriptEditor}
        onClose={() => setShowScriptEditor(false)}
        onSave={(script) => {
          console.log('Script saved:', script);
        }}
      />

      <VoiceEffectsModal
        visible={showVoiceEffects}
        onClose={() => setShowVoiceEffects(false)}
        onSelectEffect={(effect) => {
          console.log('Effect selected:', effect);
        }}
        onSelectEnhancement={(enhancements) => {
          console.log('Enhancements selected:', enhancements);
        }}
      />

      <TextToSpeechModal
        visible={showTextToSpeech}
        onClose={() => setShowTextToSpeech(false)}
        onGenerate={handleAddAudio}
        startTime={currentTime}
      />

      {/* Audio Panel Modal */}
      {showAudioPanel && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Audio Tracks</Text>
              <TouchableOpacity onPress={() => setShowAudioPanel(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <TimelineAudioPanel
              tracks={audioTracks}
              onUpdateTracks={handleUpdateTracks}
              maxDuration={duration}
              onAddTrack={() => setShowTextToSpeech(true)}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
  },
  controlsScroll: {
    maxHeight: 70,
  },
  controlsContainer: {
    gap: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toolBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
    position: 'relative',
  },
  toolLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#D1D5DB',
    marginTop: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -2,
    backgroundColor: '#EC9A15',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#000',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default EnhancedTimelineControls;
