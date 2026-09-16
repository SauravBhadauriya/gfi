import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  Text,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import BottomNav from "@components/layout/BottomNav";
import DrawerMenu from "@components/layout/DrawerMenu";
import { HomeIconSVG, ReelIconSVG, SearchIconSVG, UserIconSVG } from "@/icons";
import {
  scale,
  getFontSize,
  spacing,
  getResponsiveDimensions,
} from "@utils/responsive";

import { useRouter } from "expo-router";


const getScreenDimensions = () => {
  const dims = Dimensions.get("window");
  return {
    width: dims.width,
    height: dims.height,
  };
};


const initialDims = getScreenDimensions();
const SCREEN_WIDTH = initialDims.width;
const SCREEN_HEIGHT = initialDims.height;


const COLORS = {
  background: "#1E1005", 
  surface: "#361D0A", 
  border: "#4A2A0D", 
  text: "#FFFFFF",
  textMuted: "#A38F7E", 
  accent: "#EC9A15", 
};
const THEME_COLOR = COLORS.accent;



const MOCK_SEARCH_DATA = {
  users: [
    {
      _id: "u1",
      username: "@BeatBoxKing",
      first_name: "Raj",
      last_name: "Kumar",
      profile_picture_url: "https://i.pravatar.cc/150?u=890",
      followers_count: 1420,
      is_followed_by_me: false,
    },
    {
      _id: "u2",
      username: "@RapperOne",
      first_name: "Amit",
      last_name: "Singh",
      profile_picture_url: "https://i.pravatar.cc/150?u=111",
      followers_count: 5300,
      is_followed_by_me: true,
    },
    {
      _id: "u3",
      username: "@GullyDancer",
      first_name: "Priya",
      last_name: "Sharma",
      profile_picture_url: "https://i.pravatar.cc/150?u=222",
      followers_count: 890,
      is_followed_by_me: false,
    },
    {
      _id: "u4",
      username: "@ChefMaster",
      first_name: "Rohan",
      last_name: "Mehra",
      profile_picture_url: "https://i.pravatar.cc/150?u=444",
      followers_count: 1200,
      is_followed_by_me: false,
    },
    {
      _id: "u5",
      username: "@TravelVlogger",
      first_name: "Diya",
      last_name: "Kapoor",
      profile_picture_url: "https://i.pravatar.cc/150?u=555",
      followers_count: 3100,
      is_followed_by_me: true,
    },
    {
      _id: "u6",
      username: "@FunnyGuy",
      first_name: "Sumit",
      last_name: "Pawar",
      profile_picture_url: "https://i.pravatar.cc/150?u=666",
      followers_count: 980,
      is_followed_by_me: false,
    },
    {
      _id: "u7",
      username: "@ArtisticVibes",
      first_name: "Neha",
      last_name: "Joshi",
      profile_picture_url: "https://i.pravatar.cc/150?u=777",
      followers_count: 750,
      is_followed_by_me: false,
    },
    {
      _id: "u8",
      username: "@MusicProducer",
      first_name: "Arun",
      last_name: "Shetty",
      profile_picture_url: "https://i.pravatar.cc/150?u=888",
      followers_count: 2300,
      is_followed_by_me: true,
    },
  ],
  competitions: [
    {
      _id: "comp1",
      title: "Mumbai Rap Cypher",
      status: "LIVE",
      prize: 25000,
      participants: 342,
      image: "https://picsum.photos/seed/comp1/500/300",
    },
    {
      _id: "comp2",
      title: "Dance-Off Delhi",
      status: "UPCOMING",
      prize: 50000,
      participants: 120,
      image: "https://picsum.photos/seed/comp2/500/300",
    },
    {
      _id: "comp3",
      title: "Gully Chef Wars",
      status: "ENDED",
      prize: 15000,
      participants: 85,
      image: "https://picsum.photos/seed/comp3/500/300",
    },
    {
      _id: "comp4",
      title: "Street Art Showdown",
      status: "LIVE",
      prize: 30000,
      participants: 210,
      image: "https://picsum.photos/seed/comp4/500/300",
    },
    {
      _id: "comp5",
      title: "Beatbox Battle Royale",
      status: "UPCOMING",
      prize: 20000,
      participants: 95,
      image: "https://picsum.photos/seed/comp5/500/300",
    },
  ],
  reels: [
    {
      _id: "r1",
      video_url: "...",
      thumbnail_url: "https://picsum.photos/seed/gully1/400/600",
      caption: "Check out this flow #rap",
      author: {
        username: "@RapperOne",
        profile_picture_url: "...",
        is_followed_by_me: true,
      },
      music: { name: "Original Sound - RapperOne" },
      stats: { votes: 5000 },
      user_interactions: { has_voted: true },
    },
    {
      _id: "r2",
      video_url: "...",
      thumbnail_url: "https://picsum.photos/seed/gully2/400/600",
      caption: "New routine dropping! 💃",
      author: {
        username: "@GullyDancer",
        profile_picture_url: "...",
        is_followed_by_me: false,
      },
      music: { name: "Trending Beat 1" },
      stats: { votes: 2100 },
      user_interactions: { is_saved: true },
    },
    {
      _id: "r3",
      video_url: "...",
      thumbnail_url: "https://picsum.photos/seed/gully3/400/600",
      caption: "Beatbox session🚇",
      author: {
        username: "@BeatBoxKing",
        profile_picture_url: "...",
        is_followed_by_me: false,
      },
      music: { name: "Original Sound - BeatBoxKing" },
      stats: { votes: 8900 },
      user_interactions: { has_tipped: true },
    },
    {
      _id: "r4",
      video_url: "...",
      thumbnail_url: "https://picsum.photos/seed/gully4/400/600",
      caption: "Flow Check🎤",
      author: { username: "@RapperOne", is_followed_by_me: true },
      music: { name: "Flow #2" },
      stats: { votes: 4500 },
    },
    {
      _id: "r5",
      video_url: "...",
      thumbnail_url: "https://picsum.photos/seed/gully5/400/600",
      caption: "Gully Grooves💃",
      author: { username: "@GullyDancer", is_followed_by_me: false },
      music: { name: "Groove it" },
      stats: { votes: 1900 },
    },
    {
      _id: "r6",
      video_url: "...",
      thumbnail_url: "https://picsum.photos/seed/gully6/400/600",
      caption: "Vocal Beats🚇",
      author: { username: "@BeatBoxKing", is_followed_by_me: false },
      music: { name: "Vocal Vibes" },
      stats: { votes: 7200 },
    },
    {
      _id: "r7",
      video_url: "...",
      thumbnail_url: "https://picsum.photos/seed/gully7/400/600",
      caption: "Bars #gullyrap",
      author: { username: "@RapperOne", is_followed_by_me: true },
      music: { name: "My Bars" },
      stats: { votes: 3100 },
    },
    {
      _id: "r8",
      video_url: "...",
      thumbnail_url: "https://picsum.photos/seed/gully8/400/600",
      caption: "Dance Vibe🔥",
      author: { username: "@GullyDancer", is_followed_by_me: false },
      music: { name: "High Vibe" },
      stats: { votes: 1500 },
    },
    {
      _id: "r9",
      video_url: "...",
      thumbnail_url: "https://picsum.photos/seed/gully9/400/600",
      caption: "Beat session!🚇",
      author: { username: "@BeatBoxKing", is_followed_by_me: false },
      music: { name: "Deep Bass" },
      stats: { votes: 5900 },
    },
  ],
};

const safeImageSource = (uri: any) => {
  if (!uri || uri.endsWith(".mp4")) {
    return {
      uri: "https://picsum.photos/seed/fallback/400/600",
    };
  }
  return { uri };
};



export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Search");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeSearchType, setActiveSearchType] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [searchResults, setSearchResults] = useState<any>({
    top_users: [],
    top_competitions: [],
    top_reels: [],
    results: [],
    hasMore: false,
  });

  const searchTabs = [
    { id: "all", label: "All" },
    { id: "users", label: "Stars" },
    { id: "competitions", label: "Competitions" },
    { id: "reels", label: "Reels" },
  ];

  const [screenDimensions, setScreenDimensions] = useState(
    getScreenDimensions(),
  );
  const responsiveDims = getResponsiveDimensions();

  const bottomNavBaseHeight = 80;
  const bottomNavPadding =
    Platform.OS === "ios"
      ? Math.max(insets.bottom, SCREEN_HEIGHT * 0.025)
      : SCREEN_HEIGHT * 0.025;
  const bottomNavVerticalPadding = SCREEN_HEIGHT * 0.006 * 2;
  const bottomNavHeight =
    bottomNavBaseHeight + bottomNavPadding + bottomNavVerticalPadding;

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      const newDims = { width: window.width, height: window.height };
      setScreenDimensions(newDims);
    });
    return () => subscription?.remove();
  }, []);

  
  useEffect(() => {
    const performSearch = async () => {
      // If search query is empty, show empty state
      if (!searchQuery.trim()) {
        setSearchResults({
          top_users: [],
          top_competitions: [],
          top_reels: [],
          results: [],
          hasMore: false,
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        if (activeSearchType === "all") {
          // Perform global search
          const { searchService } = await import("@/api/services/searchService");
          const result = await searchService.globalSearch(searchQuery.trim());
          
          if (result.success && result.data) {
            setSearchResults({
              top_users: result.data.users?.slice(0, 3) || [],
              top_competitions: result.data.competitions?.slice(0, 3) || [],
              top_reels: result.data.reels || [],
              results: [],
              hasMore: false,
            });
          } else {
            setSearchResults({
              top_users: [],
              top_competitions: [],
              top_reels: [],
              results: [],
              hasMore: false,
            });
          }
        } else if (activeSearchType === "users") {
          // Search users
          const { searchService } = await import("@/api/services/searchService");
          const result = await searchService.searchUsers(searchQuery.trim());
          
          if (result.success && result.data?.users) {
            setSearchResults({
              top_users: [],
              top_competitions: [],
              top_reels: [],
              results: result.data.users,
              hasMore: false,
            });
          } else {
            setSearchResults({
              top_users: [],
              top_competitions: [],
              top_reels: [],
              results: [],
              hasMore: false,
            });
          }
        } else if (activeSearchType === "competitions") {
          // Search competitions
          const { searchService } = await import("@/api/services/searchService");
          const result = await searchService.searchCompetitions(searchQuery.trim());
          
          if (result.success && result.data?.competitions) {
            setSearchResults({
              top_users: [],
              top_competitions: [],
              top_reels: [],
              results: result.data.competitions,
              hasMore: false,
            });
          } else {
            setSearchResults({
              top_users: [],
              top_competitions: [],
              top_reels: [],
              results: [],
              hasMore: false,
            });
          }
        } else if (activeSearchType === "reels") {
          // Search reels
          const { searchService } = await import("@/api/services/searchService");
          const result = await searchService.searchReels(searchQuery.trim());
          
          if (result.success && result.data?.reels) {
            setSearchResults({
              top_users: [],
              top_competitions: [],
              top_reels: [],
              results: result.data.reels,
              hasMore: false,
            });
          } else {
            setSearchResults({
              top_users: [],
              top_competitions: [],
              top_reels: [],
              results: [],
              hasMore: false,
            });
          }
        }
      } catch (error) {
        console.error("[search] Error performing search:", error);
        setSearchResults({
          top_users: [],
          top_competitions: [],
          top_reels: [],
          results: [],
          hasMore: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [searchQuery, activeSearchType]);

  const tabs = [
    { name: "Home", icon: HomeIconSVG, label: "" },
    { name: "Reel", icon: ReelIconSVG, label: "GullyReel" },
    { name: "Upload", icon: null, label: "UPLOAD" },
    { name: "Search", icon: SearchIconSVG, label: "" },
    { name: "MyFame", icon: UserIconSVG, label: "" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {}
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop:
              Platform.OS === "ios" ? insets.top + 10 : insets.top + 10,
          },
        ]}
      >
        {}
        <View style={styles.searchBar}>
          <View style={styles.searchIconContainer}>
            <SearchIconSVG color="#999" />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search GullyFame..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={() => {
              console.log(
                "Searching for:",
                searchQuery,
                "Type:",
                activeSearchType,
              );
            }}
          />
        </View>

        {}
        <View style={styles.pillsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsContainer}
          >
            {searchTabs.map((tab) => {
              const isActive = activeSearchType === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.pillButton,
                    isActive && styles.pillButtonActive,
                  ]}
                  onPress={() => setActiveSearchType(tab.id)}
                >
                  <Text
                    style={[styles.pillText, isActive && styles.pillTextActive]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {}
      {isLoading ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: COLORS.background,
          }}
        >
          <ActivityIndicator size="large" color={THEME_COLOR} />
        </View>
      ) : (
        <View style={styles.mainContent}>
          {}
          {activeSearchType === "all" && (
            <View style={{ flex: 1 }}>
              {}
              <View style={styles.stickyStarsContainer}>
                <Text style={styles.sectionTitle}>Meet your Stars</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScrollContainer}
                >
                  {searchResults.top_users.map((user: any) => (
                    <TouchableOpacity
                      key={user._id}
                      style={styles.topUserCard}
                      onPress={() => {
                        router.push("/(main)/profile/[id]");
                      }}
                    >
                      <Image
                        source={safeImageSource(user.profile_picture_url)}
                        style={styles.topUserAvatar}
                      />
                      <Text style={styles.topUserName} numberOfLines={1}>
                        {user.username}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {}
              <FlatList
                data={searchResults.top_reels}
                numColumns={1}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingBottom: bottomNavHeight }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                  <View style={styles.competitionsHeaderBox}>
                    <Text style={styles.sectionTitle}>
                      Participate in the Gullies
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalScrollContainer}
                    >
                      {searchResults.top_competitions.map((comp: any) => (
                        <TouchableOpacity
                          key={comp._id}
                          onPress={() => {
                            router.push("/(main)/competition/live/[id]");
                          }}
                          style={styles.topCompCard}
                        >
                          <Image
                            source={safeImageSource(comp.image)}
                            style={styles.topCompImage}
                          />
                          <View style={styles.topCompOverlay}>
                            <Text style={styles.topCompTitle} numberOfLines={1}>
                              {comp.title}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <Text
                      style={[styles.sectionTitle, { marginTop: scale(24) }]}
                    >
                      Entries
                    </Text>
                  </View>
                )}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.fullReelCard}
                    onPress={() => {
                      router.push("/(main)/reel");
                    }}
                  >
                    <Image
                      source={safeImageSource(item.thumbnail_url)}
                      style={styles.fullReelMedia}
                    />
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {}
          {activeSearchType === "users" && (
            <FlatList
              data={searchResults.results}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingBottom: bottomNavHeight }}
              renderItem={({ item }) => (
                <View style={styles.userListItem}>
                  <Image
                    source={safeImageSource(item.profile_picture_url)}
                    style={styles.userListAvatar}
                  />
                  <View style={styles.userListInfo}>
                    <Text style={styles.userListName}>{item.username}</Text>
                    <Text style={styles.userListSub}>
                      {item.first_name} {item.last_name} •{" "}
                      {item.followers_count} followers
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.followButtonBox}>
                    <Text style={styles.followButtonBoxText}>
                      {item.is_followed_by_me ? "Following" : "Follow"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}

          {}
          {activeSearchType === "competitions" && (
            <FlatList
              data={searchResults.results}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{
                paddingBottom: bottomNavHeight,
                paddingHorizontal: spacing.sm,
                paddingTop: spacing.sm,
              }}
              renderItem={({ item }) => (
                <View style={styles.compCard}>
                  <Image
                    source={safeImageSource(item.image)}
                    style={styles.compImage}
                  />
                  <View style={styles.compOverlay}>
                    <View style={styles.compBadge}>
                      <Text style={styles.compBadgeText}>{item.status}</Text>
                    </View>
                    <Text style={styles.compTitle}>{item.title}</Text>
                    <Text style={styles.compSub}>
                      Prize: ₹{item.prize} | {item.participants} Joined
                    </Text>
                  </View>
                </View>
              )}
            />
          )}

          {}
          {activeSearchType === "reels" && (
            <FlatList
              data={searchResults.results}
              numColumns={3}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingBottom: bottomNavHeight }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.topReelCard}>
                  <Image
                    source={safeImageSource(item.thumbnail_url)}
                    style={styles.gridMedia}
                  />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        onOpenDrawer={() => setDrawerVisible(true)}
      />

      {}
      <DrawerMenu
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    backgroundColor: COLORS.background,
    paddingHorizontal: scale(12),
    borderBottomWidth: scale(0.5),
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: scale(10),
    height: scale(40),
    paddingHorizontal: scale(12),
    marginBottom: scale(8),
  },
  searchIconContainer: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: getFontSize(14),
    color: COLORS.text,
    padding: 0,
  },
  pillsWrapper: {
    marginTop: scale(4),
    marginBottom: scale(12),
  },
  pillsContainer: {
    paddingRight: scale(12),
    gap: scale(10),
  },
  pillButton: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  pillText: {
    color: COLORS.textMuted,
    fontSize: getFontSize(13),
    fontWeight: "600",
  },
  pillTextActive: {
    color: "#000",
    fontWeight: "700",
  },
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: getFontSize(16),
    fontWeight: "bold",
    marginHorizontal: scale(12),
    marginBottom: scale(12),
  },
  horizontalScrollContainer: {
    paddingHorizontal: scale(12),
    gap: scale(16),
  },

  
  stickyStarsContainer: {
    backgroundColor: COLORS.background,
    paddingTop: scale(16),
    paddingBottom: scale(12),
    borderBottomWidth: scale(0.5),
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  competitionsHeaderBox: {
    paddingTop: scale(16),
  },

  
  topUserCard: {
    alignItems: "center",
    width: scale(75),
  },
  topUserAvatar: {
    width: scale(65),
    height: scale(65),
    borderRadius: scale(32.5),
    marginBottom: scale(8),
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  topUserName: {
    color: COLORS.text,
    fontSize: getFontSize(12),
    textAlign: "center",
    fontWeight: "500",
  },
  topCompCard: {
    width: scale(220),
    height: scale(130),
    borderRadius: scale(12),
    overflow: "hidden",
    backgroundColor: COLORS.surface,
  },
  topCompImage: {
    width: "100%",
    height: "100%",
    opacity: 0.8,
    resizeMode: "cover",
    backgroundColor: COLORS.surface,
  },
  topCompOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: scale(12),
    backgroundColor: "rgba(30, 16, 5, 0.7)",
  },
  topCompTitle: {
    color: COLORS.text,
    fontSize: getFontSize(14),
    fontWeight: "bold",
  },

  
  topReelCard: {
    width: SCREEN_WIDTH / 3,
    height: (SCREEN_WIDTH / 3) * 1.5,
    borderWidth: 0.5,
    borderColor: COLORS.background,
    backgroundColor: COLORS.surface,
  },
  gridMedia: {
    width: "100%",
    height: "100%",
    resizeMode: "cover", 
  },

  
  fullReelCard: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    marginBottom: scale(24),
  },
  fullReelMedia: {
    width: "80%",
    aspectRatio: 4 / 5,
    resizeMode: "cover",
    borderRadius: scale(12),
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  
  userListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  userListAvatar: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  userListInfo: {
    flex: 1,
    marginLeft: scale(14),
  },
  userListName: {
    color: COLORS.text,
    fontSize: getFontSize(15),
    fontWeight: "700",
  },
  userListSub: {
    color: COLORS.textMuted,
    fontSize: getFontSize(13),
    marginTop: scale(2),
  },
  followButtonBox: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(8),
  },
  followButtonBoxText: {
    color: "#000",
    fontSize: getFontSize(13),
    fontWeight: "bold",
  },

  
  compCard: {
    height: scale(180),
    borderRadius: scale(16),
    overflow: "hidden",
    marginBottom: scale(16),
    backgroundColor: COLORS.surface,
  },
  compImage: {
    width: "100%",
    height: "100%",
    opacity: 0.7,
    resizeMode: "cover",
    backgroundColor: COLORS.surface,
  },
  compOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: scale(16),
    backgroundColor: "rgba(30, 16, 5, 0.7)",
  },
  compBadge: {
    backgroundColor: COLORS.accent,
    alignSelf: "flex-start",
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(6),
    marginBottom: scale(8),
  },
  compBadgeText: {
    color: "#000",
    fontSize: getFontSize(10),
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  compTitle: {
    color: COLORS.text,
    fontSize: getFontSize(20),
    fontWeight: "bold",
  },
  compSub: {
    color: COLORS.textMuted,
    fontSize: getFontSize(13),
    marginTop: scale(4),
    fontWeight: "500",
  },
});
