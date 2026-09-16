import React, { useCallback, useState, useEffect } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import type { Music, MusicPickerModalProps } from "../modules/video-editor/camera-module/types/music.types";
import { musicLibraryService, type MusicTrack } from "../api/services/musicLibraryService";
import { toggleSaveAudio } from "../api/services/musicLibraryService";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const CATEGORIES = ["For you", "Trending", "Saved", "Popular"];

interface TrackWithStats extends MusicTrack {
  stats?: string;
  color?: string;
}

const MusicLibraryModal: React.FC<MusicPickerModalProps> = ({
  visible,
  onSelect,
  onCancel,
  selectedMusic,
}) => {
  const [activeCategory, setActiveCategory] = useState("For you");
  const [searchQuery, setSearchQuery] = useState("");
  const [tracks, setTracks] = useState<TrackWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedTracks, setSavedTracks] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (visible) {
      fetchTracks();
    }
  }, [visible, activeCategory]);

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    try {
      let sortOption: "trending" | "popular" | "newest" = "trending";

      if (activeCategory === "Trending") {
        sortOption = "trending";
      } else if (activeCategory === "Popular") {
        sortOption = "popular";
      } else if (activeCategory === "For you") {
        sortOption = "newest";
      }

      const result = await musicLibraryService.listAudio(sortOption, 1, 50, searchQuery);

      if (result.success && result.data) {
        const formattedTracks = result.data.tracks.map((t, idx) => {
          const minutes = Math.floor(t.duration / 60);
          const seconds = String(t.duration % 60).padStart(2, "0");
          const durationStr = `${minutes}:${seconds}`;

          const useCount = t.usageCount || 0; // Use actual usage count, don't fake it
          const usageStr = useCount >= 1000
            ? `${(useCount / 1000).toFixed(1)}K uses`
            : useCount > 0 
            ? `${useCount} uses`
            : "No usage data"; // Show when data is unavailable instead of faking

          return {
            ...t,
            stats: `${usageStr} • ${durationStr}`,
            color: ["#B8860B", "#8B0000", "#5F9EA0", "#000000", "#D2B48C", "#2F4F4F", "#191970", "#FF8C00"][idx % 8],
          };
        });

        setTracks(formattedTracks);

        if (activeCategory === "Saved") {
          const savedIds = new Set(formattedTracks.map(t => t._id));
          setSavedTracks(savedIds);
        }
      }
    } catch (error) {
      console.error("[MusicLibraryModal] Error fetching tracks:", error);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery]);

  const handleSelectMusic = useCallback((music: TrackWithStats) => {
    const musicObj: Music = {
      id: music._id,
      title: music.title,
      artist: music.artist || "Unknown Artist",
      duration: music.duration,
      audioUrl: music.audioUrl,
      genre: "Pop",
      mood: "Happy",
      isLicensed: true,
      category: activeCategory,
    };
    onSelect(musicObj);
  }, [onSelect, activeCategory]);

  const handleToggleSave = useCallback(async (trackId: string, e: any) => {
    e.stopPropagation();
    try {
      const result = await toggleSaveAudio(trackId);
      if (result.success && result.data) {
        if (result.data.isSaved) {
          setSavedTracks(prev => new Set([...prev, trackId]));
        } else {
          setSavedTracks(prev => {
            const newSet = new Set(prev);
            newSet.delete(trackId);
            return newSet;
          });
        }
      }
    } catch (error) {
      console.error("[MusicLibraryModal] Error toggling save:", error);
    }
  }, []);
  const renderTrack = ({ item }: { item: TrackWithStats }) => (
    <TouchableOpacity
      style={styles.trackItem}
      activeOpacity={0.7}
      onPress={() => handleSelectMusic(item)}
    >
      <View style={[styles.albumCover, { backgroundColor: item.color }]}>
        <Text style={styles.albumIcon}>🎵</Text>
      </View>

      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {item.artist ? `by ${item.artist}` : "Unknown Artist"}
        </Text>
        <Text style={styles.trackStats}>
          {item.stats}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.saveButton,
          savedTracks.has(item._id) && styles.saveButtonActive
        ]}
        onPress={(e) => handleToggleSave(item._id, e)}
      >
        <Svg width="24" height="24" viewBox="0 0 24 24" fill={savedTracks.has(item._id) ? "#ec9a15" : "none"}>
          <Path
            d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z"
            stroke={savedTracks.has(item._id) ? "#ec9a15" : "#999"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          <TouchableOpacity style={styles.dragHandleContainer} onPress={onCancel} activeOpacity={1}>
            <View style={styles.dragHandle} />
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
              <Path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M21 21L16.65 16.65" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setPage(1);
              }}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  activeCategory === category && styles.activeTab,
                ]}
                onPress={() => {
                  setActiveCategory(category);
                  setPage(1);
                }}
              >
                <Text style={[styles.categoryText, activeCategory === category && styles.activeTabText]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {!loading && tracks.length > 0 && (
            <View style={styles.trackCountHeader}>
              <Text style={styles.trackCountText}>
                {tracks.length} track{tracks.length !== 1 ? 's' : ''} in {activeCategory}
              </Text>
            </View>
          )}

          {loading && tracks.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ec9a15" />
              <Text style={styles.loadingText}>Loading tracks...</Text>
            </View>
          ) : (
            <FlatList
              data={tracks}
              renderItem={renderTrack}
              keyExtractor={(item) => item._id}
              scrollEnabled={true}
              onEndReachedThreshold={0.3}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>🎵 No tracks found</Text>
                  <Text style={styles.emptySubText}>Try a different search or category</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 20,
  },
  dragHandleContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
    maxHeight: 50,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeTab: {
    backgroundColor: '#ec9a15',
    borderColor: '#ec9a15',
  },
  categoryText: {
    color: '#999',
    fontSize: 13,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000000',
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  albumCover: {
    width: 48,
    height: 48,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  albumIcon: {
    fontSize: 24,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  trackArtist: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  trackStats: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonActive: {
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    marginTop: 12,
    fontSize: 14,
  },
  trackCountHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(236, 154, 21, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(236, 154, 21, 0.2)',
  },
  trackCountText: {
    color: '#ec9a15',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 24,
    marginBottom: 8,
  },
  emptySubText: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
  },
});

export default MusicLibraryModal;
