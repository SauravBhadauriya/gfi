/**
 * Audio Library Modal
 * Browse and select background music for reels
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SearchBar,
  ActivityIndicator,
  Modal,
  Dimensions,
  TextInput,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

export interface Audio {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail?: string;
  url?: string;
}

interface AudioLibraryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (audio: Audio) => void;
  selectedAudioId?: string;
}

// ============================================================================
// MOCK DATA - Replace with real API calls
// ============================================================================

const MOCK_AUDIO_LIBRARY: Audio[] = [
  { id: 'audio_1', title: 'Summer Vibes', artist: 'The Beats', duration: 180 },
  { id: 'audio_2', title: 'Night Drive', artist: 'Synthwave Dreams', duration: 240 },
  { id: 'audio_3', title: 'Happy Day', artist: 'Indie Pop', duration: 210 },
  { id: 'audio_4', title: 'Chill Lofi', artist: 'Lofi Hip Hop', duration: 300 },
  { id: 'audio_5', title: 'Energetic', artist: 'EDM Masters', duration: 200 },
  { id: 'audio_6', title: 'Romantic', artist: 'Soft Classics', duration: 220 },
  { id: 'audio_7', title: 'Upbeat Party', artist: 'Party Kings', duration: 190 },
  { id: 'audio_8', title: 'Sad Piano', artist: 'Classical Mix', duration: 270 },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const AudioLibraryModal: React.FC<AudioLibraryModalProps> = ({
  visible,
  onClose,
  onSelect,
  selectedAudioId,
}) => {
  const [audioList, setAudioList] = useState<Audio[]>(MOCK_AUDIO_LIBRARY);
  const [filteredAudio, setFilteredAudio] = useState<Audio[]>(MOCK_AUDIO_LIBRARY);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Fetch audio library from backend (implement later)
  useEffect(() => {
    if (!visible) return;

    const loadAudioLibrary = async () => {
      try {
        setIsLoading(true);
        
        // TODO: Replace with real API call
        // const response = await apiClient.get('/audio/library');
        // setAudioList(response.data.audios || MOCK_AUDIO_LIBRARY);
        
        setAudioList(MOCK_AUDIO_LIBRARY);
        setFilteredAudio(MOCK_AUDIO_LIBRARY);
      } catch (error) {
        console.error('[AudioLibrary] Failed to load audio:', error);
        setAudioList(MOCK_AUDIO_LIBRARY);
        setFilteredAudio(MOCK_AUDIO_LIBRARY);
      } finally {
        setIsLoading(false);
      }
    };

    loadAudioLibrary();
  }, [visible]);

  // Search filter
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredAudio(audioList);
      return;
    }

    const filtered = audioList.filter(
      audio =>
        audio.title.toLowerCase().includes(query.toLowerCase()) ||
        audio.artist.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredAudio(filtered);
  }, [audioList]);

  // Handle selection
  const handleSelectAudio = useCallback((audio: Audio) => {
    console.log('[AudioLibrary] Selected:', audio.id, audio.title);
    onSelect(audio);
    onClose();
  }, [onSelect, onClose]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Render audio item
  const renderAudioItem = ({ item }: { item: Audio }) => {
    const isSelected = selectedAudioId === item.id;
    const isPlaying = playingId === item.id;

    return (
      <TouchableOpacity
        style={[styles.audioItem, isSelected && styles.audioItemActive]}
        onPress={() => handleSelectAudio(item)}
        activeOpacity={0.7}
      >
        {/* Play Button */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => setPlayingId(isPlaying ? null : item.id)}
        >
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        {/* Audio Info */}
        <View style={styles.audioInfo}>
          <Text style={styles.audioTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.audioArtist} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>

        {/* Duration */}
        <Text style={styles.duration}>
          {formatDuration(item.duration)}
        </Text>

        {/* Selected Indicator */}
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Audio</Text>
          <View style={{ width: 30 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search songs..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <Text style={styles.searchIcon}>🔍</Text>
        </View>

        {/* No Audio Selected Option */}
        <TouchableOpacity
          style={[styles.audioItem, !selectedAudioId && styles.audioItemActive]}
          onPress={() => {
            onSelect({ id: '', title: 'No Music', artist: '', duration: 0 });
            onClose();
          }}
        >
          <View style={styles.audioInfo}>
            <Text style={styles.audioTitle}>No Music</Text>
            <Text style={styles.audioArtist}>Remove audio track</Text>
          </View>
          {!selectedAudioId && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Audio List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#EC9A15" />
            <Text style={styles.loadingText}>Loading audio library...</Text>
          </View>
        ) : filteredAudio.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No audio found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAudio}
            renderItem={renderAudioItem}
            keyExtractor={item => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            scrollEnabled={true}
          />
        )}
      </View>
    </Modal>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
  },
  closeButton: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    position: 'relative',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingRight: 40,
    fontSize: 14,
  },
  searchIcon: {
    position: 'absolute',
    right: 12,
    top: 10,
    fontSize: 18,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  audioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  audioItemActive: {
    backgroundColor: 'rgba(236, 154, 21, 0.15)',
    borderColor: '#EC9A15',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(236, 154, 21, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playIcon: {
    fontSize: 16,
    color: '#EC9A15',
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  audioArtist: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  duration: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginRight: 12,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EC9A15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
