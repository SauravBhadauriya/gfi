import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-audio";
import apiClient from "@/api/axios";

interface AudioTrack {
  _id: string;
  title: string;
  artist: string;
  url: string;
  coverImage: string;
  duration: number;
  usageCount: number;
  savedBy: string[];
}

interface AudioToolPanelProps {
  onClose: () => void;
  onAddAudio: (audioTrack: AudioTrack) => void;
}

export default function AudioToolPanel({
  onClose,
  onAddAudio,
}: AudioToolPanelProps) {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"trending" | "saved">("trending");
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Fetch audio tracks from backend
  useEffect(() => {
    fetchAudioTracks();
    return () => {
      // Clean up audio on unmount
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const fetchAudioTracks = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/public/audio", {
        params: {
          page: 1,
          limit: 50,
        },
      });

      if (response.data.code === 1 && response.data.data.audios) {
        setTracks(response.data.data.audios);
      }
    } catch (error) {
      console.error("[AudioToolPanel] Failed to fetch audio tracks:", error);
      Alert.alert("Error", "Failed to load audio library");
    } finally {
      setLoading(false);
    }
  };

  // Filter tracks based on search and tab
  const filteredTracks = tracks.filter((track) => {
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      selectedTab === "trending" ? true : track.savedBy.length > 0;

    return matchesSearch && matchesTab;
  });

  // Preview audio track
  const handlePreview = async (track: AudioTrack) => {
    try {
      // Stop current preview if playing
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      if (previewingTrackId === track._id) {
        // Stop preview
        setPreviewingTrackId(null);
      } else {
        // Start new preview
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: track.url },
          { shouldPlay: true, isLooping: true, volume: 0.5 }
        );
        setSound(newSound);
        setPreviewingTrackId(track._id);
      }
    } catch (error) {
      console.error("[AudioToolPanel] Preview error:", error);
      Alert.alert("Error", "Failed to preview audio");
    }
  };

  // Add audio to timeline
  const handleAddAudio = async (track: AudioTrack) => {
    // Stop preview
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setPreviewingTrackId(null);
    }

    onAddAudio(track);
    onClose();
  };

  // Format duration (seconds to mm:ss)
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>AUDIO</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search music"
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === "trending" && styles.tabActive,
          ]}
          onPress={() => setSelectedTab("trending")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "trending" && styles.tabTextActive,
            ]}
          >
            Trending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "saved" && styles.tabActive]}
          onPress={() => setSelectedTab("saved")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "saved" && styles.tabTextActive,
            ]}
          >
            Saved
          </Text>
        </TouchableOpacity>
      </View>

      {/* Track List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EC9A15" />
        </View>
      ) : (
        <ScrollView style={styles.trackList} showsVerticalScrollIndicator={false}>
          {filteredTracks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes" size={48} color="#666" />
              <Text style={styles.emptyText}>No tracks found</Text>
            </View>
          ) : (
            filteredTracks.map((track) => (
              <View key={track._id} style={styles.trackItem}>
                {/* Cover Image */}
                <View style={styles.trackCover}>
                  {track.coverImage ? (
                    <Image
                      source={{ uri: track.coverImage }}
                      style={styles.trackCoverImage}
                    />
                  ) : (
                    <View style={styles.trackCoverPlaceholder}>
                      <Ionicons name="musical-note" size={24} color="#666" />
                    </View>
                  )}
                </View>

                {/* Track Info */}
                <View style={styles.trackInfo}>
                  <Text style={styles.trackTitle} numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>
                    {track.artist}
                  </Text>
                  <Text style={styles.trackDuration}>
                    {formatDuration(track.duration)}
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.trackActions}>
                  <TouchableOpacity
                    style={styles.previewButton}
                    onPress={() => handlePreview(track)}
                  >
                    <Ionicons
                      name={
                        previewingTrackId === track._id
                          ? "pause-circle"
                          : "play-circle"
                      }
                      size={32}
                      color="#EC9A15"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddAudio(track)}
                  >
                    <Ionicons name="add-circle" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  tabActive: {
    backgroundColor: "#EC9A15",
  },
  tabText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  trackList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    marginTop: 12,
  },
  trackItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  trackCover: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 12,
  },
  trackCoverImage: {
    width: "100%",
    height: "100%",
  },
  trackCoverPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  trackInfo: {
    flex: 1,
    marginRight: 12,
  },
  trackTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  trackArtist: {
    color: "#888",
    fontSize: 13,
    marginBottom: 4,
  },
  trackDuration: {
    color: "#666",
    fontSize: 12,
  },
  trackActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewButton: {
    padding: 4,
  },
  addButton: {
    padding: 4,
  },
});
