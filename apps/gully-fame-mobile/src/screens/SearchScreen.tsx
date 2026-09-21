// Created by Kiro - Search Screen
// Handles global search for users, reels, competitions, and hashtags

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
} from "react-native";
import {
  searchService,
  SearchUser,
  SearchReel,
  SearchCompetition,
  SearchHashtag,
} from "../api/services/searchService";

interface SearchScreenProps {
  navigation?: any;
}

// ✅ CREATED BY KIRO - Search Screen Component
const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "users" | "reels" | "competitions">("all");
  const [trendingHashtags, setTrendingHashtags] = useState<SearchHashtag[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ CREATED BY KIRO - Load trending hashtags and search history on mount
  useEffect(() => {
    loadTrendingHashtags();
    loadSearchHistory();
  }, []);

  // ✅ CREATED BY KIRO - Load trending hashtags
  const loadTrendingHashtags = async () => {
    try {
      const response = await searchService.getTrendingHashtags({ limit: 10 });
      if (response.success && response.data) {
        setTrendingHashtags(response.data);
      }
    } catch (error) {
      console.error("[SearchScreen] Error loading trending hashtags:", error);
    }
  };

  // ✅ CREATED BY KIRO - Load search history
  const loadSearchHistory = async () => {
    try {
      const response = await searchService.getSearchHistory();
      if (response.success && response.data) {
        setSearchHistory(response.data);
      }
    } catch (error) {
      console.error("[SearchScreen] Error loading search history:", error);
    }
  };

  // ✅ CREATED BY KIRO - Handle search with debouncing
  const handleSearchWithDebounce = (text: string) => {
    setSearchQuery(text);

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If text is empty, clear results immediately
    if (!text.trim()) {
      setSearchResults(null);
      return;
    }

    // Debounce the API call by 300ms
    debounceTimerRef.current = setTimeout(() => {
      handleSearch(text);
    }, 300);
  };

  // ✅ CREATED BY KIRO - Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // ✅ CREATED BY KIRO - Handle search
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setLoading(true);
      const response = await searchService.globalSearch(query);

      if (response.success && response.data) {
        setSearchResults(response.data);
        // Reload search history
        await loadSearchHistory();
      }
    } catch (error) {
      console.error("[SearchScreen] Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CREATED BY KIRO - Handle search by hashtag
  const handleHashtagSearch = (hashtag: string) => {
    setSearchQuery(hashtag);
    handleSearch(hashtag);
  };

  // ✅ CREATED BY KIRO - Handle search history item click
  const handleHistoryItemClick = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  // ✅ CREATED BY KIRO - Clear search history
  const handleClearHistory = async () => {
    try {
      const response = await searchService.clearSearchHistory();
      if (response.success) {
        setSearchHistory([]);
      }
    } catch (error) {
      console.error("[SearchScreen] Error clearing history:", error);
    }
  };

  // ✅ CREATED BY KIRO - Render user item
  const renderUserItem = (user: SearchUser) => {
    // Safety check for user and _id
    if (!user || !user._id) {
      return null;
    }

    return (
      <TouchableOpacity
        key={user._id}
        style={styles.resultItem}
        onPress={() => navigation?.navigate("ProfileScreen", { userId: user._id })}
      >
        {user.avatar && <Image source={{ uri: user.avatar }} style={styles.userAvatar} />}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          {user.username && <Text style={styles.userUsername}>@{user.username}</Text>}
          {user.followerCount !== undefined && (
            <Text style={styles.userStats}>{user.followerCount} followers</Text>
          )}
        </View>
        {user.isFollowing ? (
          <View style={styles.followingBadge}>
            <Text style={styles.followingText}>Following</Text>
          </View>
        ) : (
          <View style={styles.followButton}>
            <Text style={styles.followButtonText}>Follow</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ✅ CREATED BY KIRO - Render reel item
  const renderReelItem = (reel: SearchReel) => {
    // Safety check for reel and _id
    if (!reel || !reel._id) {
      return null;
    }

    return (
      <TouchableOpacity
        key={reel._id}
        style={styles.reelItem}
        onPress={() => navigation?.navigate("ReelDetailScreen", { reelId: reel._id })}
      >
        {reel.thumbnail && <Image source={{ uri: reel.thumbnail }} style={styles.reelThumbnail} />}
        <View style={styles.reelOverlay}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
        <View style={styles.reelInfo}>
          <Text style={styles.reelTitle} numberOfLines={1}>
            {reel.title}
          </Text>
          {reel.views !== undefined && <Text style={styles.reelStats}>{reel.views} views</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  // ✅ CREATED BY KIRO - Render competition item
  const renderCompetitionItem = (competition: SearchCompetition) => {
    // Safety check for competition and _id
    if (!competition || !competition._id) {
      return null;
    }

    return (
      <TouchableOpacity
        key={competition._id}
        style={styles.resultItem}
        onPress={() =>
          navigation?.navigate("CompetitionDetailScreen", {
            competitionId: competition._id,
          })
        }
      >
        {competition.image && (
          <Image source={{ uri: competition.image }} style={styles.competitionImage} />
        )}
        <View style={styles.competitionInfo}>
          <Text style={styles.competitionTitle}>{competition.title}</Text>
          <View style={styles.competitionMeta}>
            <Text style={styles.competitionStatus}>{competition.status}</Text>
            {competition.participantCount !== undefined && (
              <Text style={styles.competitionStats}>
                {competition.participantCount} participants
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ✅ CREATED BY KIRO - Render hashtag item
  const renderHashtagItem = (hashtag: SearchHashtag) => (
    <TouchableOpacity
      key={hashtag.tag}
      style={styles.hashtagItem}
      onPress={() => handleHashtagSearch(hashtag.tag)}
    >
      <Text style={styles.hashtagName}>#{hashtag.tag}</Text>
      <Text style={styles.hashtagCount}>{hashtag.count} posts</Text>
    </TouchableOpacity>
  );

  // ✅ CREATED BY KIRO - Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyTitle}>No results found</Text>
      <Text style={styles.emptyText}>Try searching for users, reels, or competitions</Text>
    </View>
  );

  // ✅ CREATED BY KIRO - Render search results
  const renderSearchResults = () => {
    if (!searchResults) return null;

    const hasResults =
      (searchResults.users && searchResults.users.length > 0) ||
      (searchResults.reels && searchResults.reels.length > 0) ||
      (searchResults.competitions && searchResults.competitions.length > 0);

    if (!hasResults) return renderEmptyState();

    return (
      <View>
        {/* Users Section */}
        {(activeTab === "all" || activeTab === "users") &&
          searchResults.users &&
          searchResults.users.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Users</Text>
              {searchResults.users.map((user: SearchUser) => renderUserItem(user))}
            </View>
          )}

        {/* Reels Section */}
        {(activeTab === "all" || activeTab === "reels") &&
          searchResults.reels &&
          searchResults.reels.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reels</Text>
              <View style={styles.reelGrid}>
                {searchResults.reels.map((reel: SearchReel) => renderReelItem(reel))}
              </View>
            </View>
          )}

        {/* Competitions Section */}
        {(activeTab === "all" || activeTab === "competitions") &&
          searchResults.competitions &&
          searchResults.competitions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Competitions</Text>
              {searchResults.competitions.map((competition: SearchCompetition) =>
                renderCompetitionItem(competition)
              )}
            </View>
          )}
      </View>
    );
  };

  // ✅ CREATED BY KIRO - Render initial state with trending and history
  const renderInitialState = () => (
    <ScrollView style={styles.container}>
      {/* Trending Hashtags */}
      {trendingHashtags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending</Text>
          {trendingHashtags.map((hashtag) => renderHashtagItem(hashtag))}
        </View>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && (
        <View style={styles.section}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={handleClearHistory}>
              <Text style={styles.clearButton}>Clear</Text>
            </TouchableOpacity>
          </View>
          {searchHistory.map((query) => (
            <TouchableOpacity
              key={query}
              style={styles.historyItem}
              onPress={() => handleHistoryItemClick(query)}
            >
              <Text style={styles.historyIcon}>🕐</Text>
              <Text style={styles.historyText}>{query}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users, reels, competitions..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearchWithDebounce}
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Navigation */}
      {searchQuery && (
        <View style={styles.tabNavigation}>
          {["all", "users", "reels", "competitions"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : searchQuery ? (
        <ScrollView style={styles.resultsContainer}>{renderSearchResults()}</ScrollView>
      ) : (
        renderInitialState()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  searchHeader: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#000",
  },
  clearIcon: {
    fontSize: 16,
    color: "#999",
    marginLeft: 8,
  },
  tabNavigation: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#007AFF",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  tabTextActive: {
    color: "#007AFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  userUsername: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  userStats: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007AFF",
  },
  followingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#E3F2FD",
  },
  followingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007AFF",
  },
  reelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  reelItem: {
    width: "48%",
    marginBottom: 12,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  reelThumbnail: {
    width: "100%",
    height: 150,
    backgroundColor: "#E0E0E0",
  },
  reelOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  playIcon: {
    fontSize: 32,
    color: "#FFFFFF",
  },
  reelInfo: {
    padding: 8,
  },
  reelTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },
  reelStats: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
  },
  competitionImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  competitionInfo: {
    flex: 1,
  },
  competitionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  competitionMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  competitionStatus: {
    fontSize: 11,
    color: "#007AFF",
    fontWeight: "600",
    marginRight: 8,
  },
  competitionStats: {
    fontSize: 11,
    color: "#666",
  },
  hashtagItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  hashtagName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  hashtagCount: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  clearButton: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  historyText: {
    fontSize: 14,
    color: "#000",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});

export default SearchScreen;
