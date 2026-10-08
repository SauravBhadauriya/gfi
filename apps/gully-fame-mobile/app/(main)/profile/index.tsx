import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Dimensions,
  StatusBar,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

const { width } = Dimensions.get("window");
const GRID_COLUMNS = 3;
const ITEM_SIZE = width / GRID_COLUMNS;

interface UserPost {
  id: string;
  type: "video" | "photo";
  uri: string;
  thumbnail?: string;
  caption?: string;
  likes: number;
  comments: number;
  createdAt: string;
}

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  followers: number;
  following: number;
  posts: number;
  verified: boolean;
}

export default function ProfileScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    loadUserProfile();
    loadUserPosts();
  }, []);

  const loadUserProfile = async () => {
    try {
      // Mock user profile - replace with API call
      const mockProfile: UserProfile = {
        id: "user-123",
        username: "johndoe",
        displayName: "John Doe",
        bio: "Content Creator 🎬 | Digital Marketing Enthusiast 📱",
        avatar: "https://via.placeholder.com/150",
        followers: 1250,
        following: 345,
        posts: 28,
        verified: true,
      };
      setUserProfile(mockProfile);
    } catch (error) {
      console.error("[Profile] Failed to load profile:", error);
    }
  };

  const loadUserPosts = async () => {
    try {
      setLoading(true);
      // Mock posts - replace with API call
      const mockPosts: UserPost[] = [
        {
          id: "post-1",
          type: "video",
          uri: "https://via.placeholder.com/300x400",
          thumbnail: "https://via.placeholder.com/300x400",
          caption: "Amazing digital marketing tips!",
          likes: 245,
          comments: 32,
          createdAt: "2 days ago",
        },
        {
          id: "post-2",
          type: "photo",
          uri: "https://via.placeholder.com/300x300",
          caption: "Coffee and code",
          likes: 156,
          comments: 18,
          createdAt: "3 days ago",
        },
        {
          id: "post-3",
          type: "video",
          uri: "https://via.placeholder.com/300x400",
          thumbnail: "https://via.placeholder.com/300x400",
          caption: "New reel is live!",
          likes: 432,
          comments: 89,
          createdAt: "5 days ago",
        },
        {
          id: "post-4",
          type: "photo",
          uri: "https://via.placeholder.com/300x300",
          caption: "Beautiful sunset",
          likes: 523,
          comments: 67,
          createdAt: "1 week ago",
        },
      ];
      setUserPosts(mockPosts);
    } catch (error) {
      console.error("[Profile] Failed to load posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserProfile();
    loadUserPosts();
    setRefreshing(false);
  }, []);

  const handleUploadPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const newPost: UserPost = {
          id: `post-${Date.now()}`,
          type: "photo",
          uri: result.assets[0].uri,
          caption: "",
          likes: 0,
          comments: 0,
          createdAt: "now",
        };
        setUserPosts([newPost, ...userPosts]);
        Alert.alert("Success", "Photo uploaded successfully!");
      }
    } catch (error) {
      console.error("[Profile] Upload photo error:", error);
      Alert.alert("Error", "Failed to upload photo");
    }
  };

  const handleUploadVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const newPost: UserPost = {
          id: `post-${Date.now()}`,
          type: "video",
          uri: result.assets[0].uri,
          thumbnail: result.assets[0].uri,
          caption: "",
          likes: 0,
          comments: 0,
          createdAt: "now",
        };
        setUserPosts([newPost, ...userPosts]);
        Alert.alert("Success", "Video uploaded successfully!");
      }
    } catch (error) {
      console.error("[Profile] Upload video error:", error);
      Alert.alert("Error", "Failed to upload video");
    }
  };

  const renderGridItem = ({ item }: { item: UserPost }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() =>
        router.push({
          pathname: "/(main)/profile/post-detail",
          params: { postId: item.id },
        })
      }
    >
      <Image
        source={{ uri: item.thumbnail || item.uri }}
        style={styles.gridImage}
      />
      {item.type === "video" && (
        <View style={styles.videoOverlay}>
          <Ionicons name="play-circle" size={40} color="#fff" />
        </View>
      )}
      <View style={styles.gridStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={14} color="#fff" />
          <Text style={styles.statText}>{item.likes}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble" size={14} color="#fff" />
          <Text style={styles.statText}>{item.comments}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderListItem = ({ item }: { item: UserPost }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() =>
        router.push({
          pathname: "/(main)/profile/post-detail",
          params: { postId: item.id },
        })
      }
    >
      <Image
        source={{ uri: item.thumbnail || item.uri }}
        style={styles.listImage}
      />
      <View style={styles.listContent}>
        <View style={styles.listHeader}>
          {item.type === "video" && (
            <MaterialCommunityIcons
              name="video"
              size={16}
              color="#EC9A15"
              style={styles.typeIcon}
            />
          )}
          <Text style={styles.caption} numberOfLines={2}>
            {item.caption || `${item.type === "video" ? "Video" : "Photo"}`}
          </Text>
        </View>
        <Text style={styles.date}>{item.createdAt}</Text>
        <View style={styles.listStats}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={14} color="#EC9A15" />
            <Text style={styles.statCount}>{item.likes}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble" size={14} color="#EC9A15" />
            <Text style={styles.statCount}>{item.comments}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <FlatList
        data={userPosts}
        renderItem={viewMode === "grid" ? renderGridItem : renderListItem}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === "grid" ? GRID_COLUMNS : 1}
        key={viewMode}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#EC9A15"
          />
        }
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Profile</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="settings-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() =>
                    router.push("/(main)/profile/edit")
                  }
                >
                  <Ionicons name="pencil" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Profile Info */}
            {userProfile && (
              <View style={styles.profileInfo}>
                <Image
                  source={{ uri: userProfile.avatar }}
                  style={styles.avatar}
                />
                <View style={styles.profileDetails}>
                  <View style={styles.nameRow}>
                    <Text style={styles.displayName}>
                      {userProfile.displayName}
                    </Text>
                    {userProfile.verified && (
                      <MaterialCommunityIcons
                        name="check-decagram"
                        size={18}
                        color="#EC9A15"
                      />
                    )}
                  </View>
                  <Text style={styles.username}>
                    @{userProfile.username}
                  </Text>
                  <Text style={styles.bio}>{userProfile.bio}</Text>
                </View>
              </View>
            )}

            {/* Stats */}
            <View style={styles.stats}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {userProfile?.posts || 0}
                </Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {userProfile?.followers || 0}
                </Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {userProfile?.following || 0}
                </Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUploadPhoto}
              >
                <Ionicons name="image" size={20} color="#000" />
                <Text style={styles.uploadButtonText}>Upload Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.uploadButtonSecondary}
                onPress={handleUploadVideo}
              >
                <Ionicons name="videocam" size={20} color="#fff" />
                <Text style={styles.uploadButtonSecondaryText}>
                  Upload Video
                </Text>
              </TouchableOpacity>
            </View>

            {/* View Mode Toggle */}
            <View style={styles.viewModeToggle}>
              <TouchableOpacity
                style={[
                  styles.viewModeButton,
                  viewMode === "grid" && styles.viewModeButtonActive,
                ]}
                onPress={() => setViewMode("grid")}
              >
                <Ionicons
                  name="grid"
                  size={20}
                  color={viewMode === "grid" ? "#EC9A15" : "#888"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewModeButton,
                  viewMode === "list" && styles.viewModeButtonActive,
                ]}
                onPress={() => setViewMode("list")}
              >
                <Ionicons
                  name="list"
                  size={20}
                  color={viewMode === "list" ? "#EC9A15" : "#888"}
                />
              </TouchableOpacity>
            </View>

            {/* Posts Header */}
            <View style={styles.postsHeader}>
              <Text style={styles.postsTitle}>
                {viewMode === "grid" ? "Posts" : "Timeline"}
              </Text>
            </View>
          </View>
        }
        scrollEnabled={true}
        contentContainerStyle={
          viewMode === "grid" ? styles.gridContent : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  profileInfo: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1a1a1a",
  },
  profileDetails: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  displayName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  username: {
    color: "#888",
    fontSize: 14,
    marginBottom: 8,
  },
  bio: {
    color: "#aaa",
    fontSize: 13,
    lineHeight: 18,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#1a1a1a",
  },
  statBox: {
    alignItems: "center",
  },
  statNumber: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  uploadButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EC9A15",
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  uploadButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },
  uploadButtonSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  uploadButtonSecondaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  viewModeToggle: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  viewModeButton: {
    padding: 8,
  },
  viewModeButtonActive: {
    backgroundColor: "transparent",
  },
  postsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  postsTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  gridContent: {
    paddingHorizontal: 2,
  },
  gridItem: {
    width: ITEM_SIZE - 2,
    height: ITEM_SIZE - 2,
    margin: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  gridStats: {
    position: "absolute",
    bottom: 6,
    right: 6,
    flexDirection: "row",
    gap: 4,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  statCount: {
    color: "#EC9A15",
    fontSize: 12,
    fontWeight: "600",
  },
  listItem: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    gap: 12,
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#1a1a1a",
  },
  listContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  typeIcon: {
    marginTop: 2,
  },
  caption: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  date: {
    color: "#666",
    fontSize: 12,
  },
  listStats: {
    flexDirection: "row",
    gap: 12,
  },
});
