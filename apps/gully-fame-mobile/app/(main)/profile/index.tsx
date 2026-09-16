import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState, useEffect } from "react";
import { LeaderboardStyles as styles } from "@/components/TopTenLeaderboard/styles";
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from "react-native";
import BottomNav from "@components/layout/BottomNav";
import {
  BackIcon,
  CommunityIcon,
  HomeIcon,
  ReelIcon,
  UserIconSVG,
} from "@/icons";
import Svg, { Path, Rect, G } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from "@/api";
import { BASE_URL } from "@/api/axios";

const { width, height } = Dimensions.get("window");

const tabs = [
  { name: "Home", icon: HomeIcon, label: "" },
  { name: "Reel", icon: ReelIcon, label: "GullyReel" },
  { name: "Upload", icon: null, label: "UPLOAD" },
  { name: "Community", icon: CommunityIcon, label: "" },
  { name: "MyFame", icon: UserIconSVG, label: "" },
];

export default function MyFameScreen() {
  const [activeTab, setActiveTab] = useState("MyFame");
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      try {
        const [isLoggedIn, token, storedUser] = await Promise.all([
          AsyncStorage.getItem("isLoggedIn"),
          AsyncStorage.getItem("authToken"),
          AsyncStorage.getItem("user")
        ]);

        if (isMounted) {
          if (isLoggedIn !== "true" && !token) {
            router.replace("/auth/signin" as any);
            return;
          }

          let myId = null;
          if (storedUser) {
            const user = JSON.parse(storedUser);
            myId = user._id || user.id;
            setCurrentUserId(myId);
          }

          // Fetch Global Leaderboard Data
          try {
            const resp = await apiClient.get('/user/leaderboard', { params: { limit: 50 } });
            
            if (resp.data && resp.data.code === 1 && resp.data.data) {
              const formattedData = resp.data.data.map((entry: any, index: number) => {
                const rank = entry.rank || index + 1;
                return {
                  rank,
                  isTop: rank <= 3,
                  name: `${entry.firstName || ''} ${entry.lastName || ''}`.trim() || entry.username || 'Unknown',
                  firstName: entry.firstName || '',
                  lastName: entry.lastName || '',
                  role: entry.role || 'participants',
                  userId: entry._id || entry.userId,
                  isYou: (entry._id || entry.userId) === myId,
                  points: entry.points || entry.fameCoins || entry.votes || 0,
                  profileImage: entry.profileImage ? { uri: `${BASE_URL}${entry.profileImage}` } : require("@assets/images/user1.png"),
                };
              });

              // Ensure data is sorted by rank
              formattedData.sort((a: any, b: any) => a.rank - b.rank);
              setLeaderboardData(formattedData);
            }
          } catch (apiError) {
            console.error("Failed to fetch global leaderboard:", apiError);
          }

          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, []);

  const topThree = leaderboardData.filter((item) => item.isTop);
  const restOfList = leaderboardData.filter((item) => !item.isTop);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#EC9A15" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <BackIcon color="white" size={24} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Leaderboard</Text>
        
        <TouchableOpacity
          onPress={() => router.push("/(main)/invite-friend" as any)}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="gift-outline" size={26} color="#EC9A15" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        🔥 Who's ruling the gullies right now?
      </Text>

      {leaderboardData.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#999', fontSize: 16 }}>No rankings available yet.</Text>
        </View>
      ) : (
        <>
          <View style={styles.podiumContainer}>
            <View style={styles.topThreeContainer}>
              {topThree[1] && (
                <TouchableOpacity
                  style={styles.podiumItem}
                  onPress={() =>
                    router.push({
                      pathname: "/(main)/profile/[id]",
                      params: {
                        id: topThree[1].userId,
                        userId: topThree[1].userId,
                        firstName: topThree[1].firstName,
                        lastName: topThree[1].lastName,
                        role: topThree[1].role,
                        bio: topThree[1].bio,
                      },
                    } as any)
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.avatarContainer}>
                    <Image source={topThree[1].profileImage} style={styles.avatar} />
                    <LinearGradient colors={["#C0C0C0", "#A8A8A8"]} style={[styles.rankBadgeCircle, styles.rankBadge2]}>
                      <Text style={styles.rankBadgeText}>2</Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {topThree[1].name}
                  </Text>
                  <View style={styles.pointsRow}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#C0C0C0" />
                    </Svg>
                    <Text style={styles.podiumPoints}>{topThree[1].points}</Text>
                  </View>
                </TouchableOpacity>
              )}

              {topThree[0] && (
                <TouchableOpacity
                  style={[styles.podiumItem, styles.podiumFirst]}
                  onPress={() =>
                    router.push({
                      pathname: "/(main)/profile/[id]",
                      params: {
                        id: topThree[0].userId,
                        userId: topThree[0].userId,
                        firstName: topThree[0].firstName,
                        lastName: topThree[0].lastName,
                        role: topThree[0].role,
                        bio: topThree[0].bio,
                      },
                    } as any)
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.avatarContainer}>
                    <Svg width={35} height={35} viewBox="0 0 24 24" fill="none" style={styles.crownIcon}>
                      <Path d="M12 2l3 6 6-2-3 10H6L3 6l6 2 3-6z" fill="#FFD700" stroke="#FFA500" strokeWidth={1.5} />
                    </Svg>
                    <Image source={topThree[0].profileImage} style={styles.avatarLarge} />
                    <LinearGradient colors={["#FFD700", "#FFA500"]} style={[styles.rankBadgeCircle, styles.rankBadge1]}>
                      <Text style={[styles.rankBadgeText, styles.rankBadgeText1]}>1</Text>
                    </LinearGradient>
                  </View>
                  <Text style={[styles.podiumName, styles.podiumName1]} numberOfLines={1}>
                    {topThree[0].name}
                  </Text>
                  <View style={styles.pointsRow}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FFD700" />
                    </Svg>
                    <Text style={[styles.podiumPoints, styles.podiumPoints1]}>{topThree[0].points}</Text>
                  </View>
                </TouchableOpacity>
              )}

              {topThree[2] && (
                <TouchableOpacity
                  style={styles.podiumItem}
                  onPress={() =>
                    router.push({
                      pathname: "/(main)/profile/[id]",
                      params: {
                        id: topThree[2].userId,
                        userId: topThree[2].userId,
                        firstName: topThree[2].firstName,
                        lastName: topThree[2].lastName,
                        role: topThree[2].role,
                        bio: topThree[2].bio,
                      },
                    } as any)
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.avatarContainer}>
                    <Image source={topThree[2].profileImage} style={styles.avatar} />
                    <LinearGradient colors={["#CD7F32", "#8B4513"]} style={[styles.rankBadgeCircle, styles.rankBadge3]}>
                      <Text style={styles.rankBadgeText}>3</Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {topThree[2].name}
                  </Text>
                  <View style={styles.pointsRow}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#CD7F32" />
                    </Svg>
                    <Text style={styles.podiumPoints}>{topThree[2].points}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.leaderboardSection}>
            <View style={styles.leaderboardListContainer}>
              <ScrollView contentContainerStyle={styles.leaderboardContent} showsVerticalScrollIndicator={false}>
                {restOfList.map((item, index) => (
                  <TouchableOpacity
                    key={item.rank}
                    style={[
                      styles.leaderboardItem,
                      item.isYou && styles.leaderboardItemYou,
                      index !== restOfList.length - 1 && styles.leaderboardItemBorder,
                    ]}
                    onPress={async () => {
                      if (item.isYou) {
                        router.push({
                          pathname: "/(main)/profile/own/fan",
                        } as any);
                      } else if (item.userId) {
                        router.push({
                          pathname: "/(main)/profile/[id]",
                          params: {
                            id: item.userId,
                            userId: item.userId,
                            firstName: item.firstName,
                            lastName: item.lastName,
                            role: item.role,
                            bio: item.bio,
                          },
                        } as any);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.rankBadgeContainer, item.isYou && styles.rankBadgeYou]}>
                      <Text style={[styles.rankNumber, item.isYou && styles.rankNumberYou]}>
                        {item.rank}
                      </Text>
                    </View>

                    <View style={styles.leaderboardAvatarWrapper}>
                      <Image source={item.profileImage} style={styles.leaderboardAvatarImage} />
                      {item.isYou && (
                        <View style={styles.yourBadge}>
                          <Text style={styles.yourBadgeText}>YOU</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.leaderboardInfo}>
                      <Text style={[styles.leaderboardName, item.isYou && styles.leaderboardNameYou]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View style={styles.pointsRowList}>
                        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                          <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={item.isYou ? "#000" : "#EC9A15"} />
                        </Svg>
                        <Text style={[styles.leaderboardPoints, item.isYou && styles.leaderboardPointsYou]}>
                          {item.points} pts
                        </Text>
                      </View>
                    </View>

                    {item.isYou && (
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path d="M9 18l6-6-6-6" stroke="#000" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </>
      )}

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        onOpenDrawer={() => {}}
      />
    </View>
  );
}