import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listAudio, type AudioSortOption } from '@/api/services/musicLibraryService';

interface MusicLibraryModalProps {
  visible: boolean;
  onCancel: () => void;
  onSelect: (music: any) => void;
  selectedMusic?: any;
}

const TABS = ['For you', 'Trending', 'Saved', 'Popular'];

export const MusicLibraryModal: React.FC<MusicLibraryModalProps> = ({
  visible,
  onCancel,
  onSelect,
  selectedMusic,
}) => {
  const [activeTab, setActiveTab] = useState('For you');
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Smart Audio Fetcher with Category Fallback
  const fetchTracks = useCallback(async () => {
    if (!visible) return;
    setLoading(true);

    try {
      let response: any = null;

      if (searchQuery.trim().length > 0) {
        response = await listAudio('trending', 1, 50, searchQuery.trim());
      } else {
        // Map UI Tab to backend query
        let categoryQuery = activeTab.toLowerCase().replace(' ', '_');
        const sort: AudioSortOption = categoryQuery === 'popular' || categoryQuery === 'newest' ? categoryQuery : 'trending';
        response = await listAudio(sort, 1, 50);
      }

      let fetchedTracks: any[] = [];

      // Extract tracks from various possible backend API response structures
      if (response?.success || response?.code === 1) {
        const resData = response.data;
        if (Array.isArray(resData)) {
          fetchedTracks = resData;
        } else if (Array.isArray(resData?.tracks)) {
          fetchedTracks = resData.tracks;
        } else if (Array.isArray(resData?.audios)) {
          fetchedTracks = resData.audios;
        } else if (Array.isArray(resData?.data)) {
          fetchedTracks = resData.data;
        }
      }

      // 🛠️ FALLBACK: If selected tab returns 0 items, fetch ALL tracks so uploaded music is never hidden!
      if (fetchedTracks.length === 0 && !searchQuery) {
        const fallbackRes = await listAudio(undefined, 1, 50);
        if (fallbackRes?.success || fallbackRes?.code === 1) {
          const fbData = fallbackRes.data;
          if (Array.isArray(fbData)) fetchedTracks = fbData;
          else if (Array.isArray(fbData?.tracks)) fetchedTracks = fbData.tracks;
        }
      }

      setTracks(fetchedTracks);
    } catch (error) {
      console.warn('Failed to fetch audio tracks from Gully Fame API:', error);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, [visible, activeTab, searchQuery]);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  const renderTrackItem = ({ item }: { item: any }) => {
    const isSelected = selectedMusic?.id === item._id || selectedMusic?.id === item.id;
    const title = item.title || item.name || item.originalName || 'Audio Track';
    const artist = item.artist || item.singer || 'Gully Fame Audio';
    const duration = item.duration ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}` : '0:30';

    return (
      <TouchableOpacity
        style={[styles.trackCard, isSelected && styles.trackCardSelected]}
        onPress={() => onSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.trackImageBase}>
          <Ionicons name="musical-note" size={24} color="#EC9A15" />
        </View>

        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {artist} • {duration}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.selectBtn}
          onPress={() => onSelect(item)}
        >
          <Text style={styles.selectBtnText}>Use</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search audio tracks..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#888" />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Tabs */}
          <View style={styles.tabBar}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
                onPress={() => {
                  setActiveTab(tab);
                  setSearchQuery('');
                }}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Track List or Loading */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#EC9A15" />
            </View>
          ) : tracks.length > 0 ? (
            <FlatList
              data={tracks}
              keyExtractor={(item, index) => item._id || item.id || `track-${index}`}
              renderItem={renderTrackItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.centerContainer}>
              <Ionicons name="musical-notes-outline" size={48} color="#444" style={{ marginBottom: 12 }} />
              <Text style={styles.noTracksTitle}>No tracks found</Text>
              <Text style={styles.noTracksSub}>Try searching or select another tab</Text>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#181818',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#444',
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#262626',
  },
  tabPillActive: {
    backgroundColor: '#EC9A15',
  },
  tabText: {
    color: '#AAA',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noTracksTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  noTracksSub: {
    color: '#888',
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 20,
    gap: 12,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  trackCardSelected: {
    borderColor: '#EC9A15',
    backgroundColor: 'rgba(236, 154, 21, 0.1)',
  },
  trackImageBase: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackArtist: {
    color: '#AAA',
    fontSize: 12,
  },
  selectBtn: {
    backgroundColor: '#EC9A15',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 12,
  },
});

export default MusicLibraryModal;
