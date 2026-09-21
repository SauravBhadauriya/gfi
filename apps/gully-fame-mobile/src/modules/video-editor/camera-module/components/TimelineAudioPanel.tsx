import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import AdvancedAudioEditor from './AdvancedAudioEditor';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

interface TimelineAudioPanelProps {
  tracks: AudioTrack[];
  onUpdateTracks: (tracks: AudioTrack[]) => void;
  maxDuration: number;
  onAddTrack?: () => void;
  onApplyEffects?: (trackId: string) => void;
}

const TimelineAudioPanel: React.FC<TimelineAudioPanelProps> = ({
  tracks,
  onUpdateTracks,
  maxDuration,
  onAddTrack,
  onApplyEffects,
}) => {
  const [masterVolume, setMasterVolume] = useState(100);

  const handleUpdateTrack = useCallback(
    (trackId: string, updates: Partial<AudioTrack>) => {
      const updated = tracks.map((t) =>
        t.id === trackId ? { ...t, ...updates } : t
      );
      onUpdateTracks(updated);
    },
    [tracks, onUpdateTracks]
  );

  const handleDeleteTrack = useCallback(
    (trackId: string) => {
      const updated = tracks.filter((t) => t.id !== trackId);
      onUpdateTracks(updated);
    },
    [tracks, onUpdateTracks]
  );

  const totalDuration = tracks.reduce((max, t) => Math.max(max, t.duration), 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Tracks</Text>
            <Text style={styles.statValue}>{tracks.length}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{totalDuration.toFixed(1)}s</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Max</Text>
            <Text style={styles.statValue}>{maxDuration.toFixed(1)}s</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Master Volume Control */}
        <View style={styles.masterVolumeSection}>
          <View style={styles.masterVolumeHeader}>
            <Text style={styles.masterVolumeLabel}>Master Volume</Text>
            <Text style={styles.masterVolumeValue}>{Math.round(masterVolume)}%</Text>
          </View>
          <View style={styles.masterVolumeSlider}>
            <TouchableOpacity onPress={() => setMasterVolume(Math.max(0, masterVolume - 10))}>
              <MaterialCommunityIcons name="minus" size={18} color="#9ca3af" />
            </TouchableOpacity>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={masterVolume}
              onValueChange={setMasterVolume}
              minimumTrackTintColor="#10b981"
              maximumTrackTintColor="#374151"
            />
            <TouchableOpacity onPress={() => setMasterVolume(Math.min(100, masterVolume + 10))}>
              <MaterialCommunityIcons name="plus" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tracks */}
        {tracks.length > 0 ? (
          <AdvancedAudioEditor
            tracks={tracks}
            onUpdateTrack={handleUpdateTrack}
            onDeleteTrack={handleDeleteTrack}
            onApplyEffects={onApplyEffects || (() => {})}
            maxDuration={maxDuration}
          />
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="music-off" size={48} color="#6b7280" />
            <Text style={styles.emptyStateTitle}>No Audio Tracks</Text>
            <Text style={styles.emptyStateText}>Add music, voiceovers, or sound effects to your video</Text>
          </View>
        )}

        {/* Add Track Button */}
        {onAddTrack && (
          <TouchableOpacity style={styles.addButton} onPress={onAddTrack}>
            <MaterialCommunityIcons name="plus-circle" size={24} color="#3b82f6" />
            <Text style={styles.addButtonText}>Add Audio Track</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#374151',
  },
  content: {
    flex: 1,
    paddingVertical: 12,
  },
  masterVolumeSection: {
    marginHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  masterVolumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  masterVolumeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  masterVolumeValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  masterVolumeSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 36,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d1d5db',
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
});

export default TimelineAudioPanel;
