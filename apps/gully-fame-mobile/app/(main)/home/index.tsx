import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Dimensions,
  ImageBackground,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Animated,
  ActivityIndicator,
  Alert,
} from "react-native";
import { homeScreenStyles as styles } from "@/styles/homeScreenStyles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomNav from "@components/layout/BottomNav";
import DrawerMenu from "@components/layout/DrawerMenu";
import { ReelViewer } from "@components/reel/ReelViewer";
import { hp } from "@utils/responsive";
import RoleBasedBanner from "@/components/home/RoleBasedBanner/RoleBasedBanner";
import Svg, { Rect, Defs, RadialGradient, Stop } from "react-native-svg";
import { getUnreadNotificationCount } from "@/api/services/notificationIntegrationService";
import {
  NotificationIcon,
  ChatIcon,
  HomeIconSVG,
  ReelIconSVG,
  PeopleIcon,
  SearchIconSVG,
  TrophyIcon,
  UserIconSVG,
  ViewsEyeIcon,
  CaretRightIcon,
  LimitedTimeEventClockIcon,
  ThumbsUpIcon,
  EyeIcon,
} from "@/icons";
import { homePageHeroSlidesAPIData } from "@/types/homePageHeroSlides";
import SafeImage from "@/components/SafeImage";
import HeroBannerCarousel from "@/components/home/HeroBannerCarousel/HeroBannerCarousel";
import CategoriesCarousel from "@/components/home/CategoriesCarousel/CategoriesCarousel";
import { apiClient } from "@/api";
import { feedService } from "@/api/services/feedService";
import { BASE_URL } from "@/api/axios";
import { convertToFormattedString } from "@/utils/convertToFormattedString";
import { convertToFormattedPrize } from "@/utils/convertToFormattedPrize";
import { convertDateToDaysLeft } from "@/utils/convertDateToDaysLeft";

const getDimensions = () => Dimensions.get("window");

// API timeout wrapper - outside component to avoid JSX generic syntax issues
const withTimeout = <T extends any>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`API call timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
};

export default function GullyFameHome() {
  const [activeTab, setActiveTab] = useState("Home");
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [dimensions, setDimensions] = useState(getDimensions());
  const insets = useSafeAreaInsets();

  const [feedTab, setFeedTab] = useState<"trending" | "for-you" | "popular" | "saved">("trending");
  const [feedLoading, setFeedLoading] = useState(false);

  const [banners, setBanners] = useState<homePageHeroSlidesAPIData[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [trendingData, setTrendingData] = useState<any[]>([]);
  const [forYouData, setForYouData] = useState<any[]>([]);
  const [popularData, setPopularData] = useState<any[]>([]);
  const [savedData, setSavedData] = useState<any[]>([]);
  const [liveCompetitions, setLiveCompetitions] = useState<any[]>([]);
  const [pastCompetitions, setPastCompetitions] = useState<any[]>([]);
  const [upcomingCompetitions, setUpcomingCompeitions] = useState<any[]>([]);
  const [topCompetitors, setTopCompetitors] = useState<any[]>([]);

  const [showReelViewer, setShowReelViewer] = useState(false);
  const [selectedReelIndex, setSelectedReelIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const liveDotBlink = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [scrollY, setScrollY] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;

      async function fetchHomePage() {
        try {
          const resp = await withTimeout(apiClient.get(`/user/homeScreen`));
          if (!isMounted) return;
          
          if (resp.status !== 200) throw new Error("Error trying to receive home screen api");

          const data = resp.data.data;
          if (data.banners) setBanners(data.banners);
          if (data.trending) setTrendingData(data.trending);
          if (data.liveCompetitions) setLiveCompetitions(data.liveCompetitions);
          if (data.pastCompetitions) setPastCompetitions(data.pastCompetitions);
          if (data.upcomingCompetitions) setUpcomingCompeitions(data.upcomingCompetitions);
          if (data.topCompetitors) setTopCompetitors(data.topCompetitors);
        } catch (err) {
          if (!isMounted) return;
          console.error("[HomeScreen] Error fetching home page data:", err);
        }
      }

      async function loadFeedData() {
        setFeedLoading(true);
        try {
          const categoriesResult = await withTimeout(feedService.getCategories());
          if (!isMounted) return;
          
          if (categoriesResult.success && categoriesResult.data) {
            setCategories(categoriesResult.data as any[]);
          }

          const trendingResult = await withTimeout(feedService.getTrendingReels(1, 10));
          if (!isMounted) return;
          
          if (trendingResult.success && trendingResult.data) {
            setTrendingData(trendingResult.data.reels as any[]);
          }

          const forYouResult = await withTimeout(feedService.getForYouReels(1, 10));
          if (!isMounted) return;
          
          if (forYouResult.success && forYouResult.data) {
            setForYouData(forYouResult.data.reels as any[]);
          }

          const popularResult = await withTimeout(feedService.getPopularReels(1, 10));
          if (!isMounted) return;
          
          if (popularResult.success && popularResult.data) {
            setPopularData(popularResult.data.reels as any[]);
          }

          const savedResult = await withTimeout(feedService.getSavedReels(1, 10));
          if (!isMounted) return;
          
          if (savedResult.success && savedResult.data) {
            setSavedData(savedResult.data.reels as any[]);
          }
        } catch (err) {
          if (!isMounted) return;
          console.error("Error loading feed data:", err);
        } finally {
          if (isMounted) {
            setFeedLoading(false);
          }
        }
      }

      fetchHomePage();
      loadFeedData();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const result = await withTimeout(getUnreadNotificationCount());
        setUnreadCount(result.success && result.data ? result.data.count || 0 : 0);
      } catch (err) {
        console.error("[HomeScreen] Error fetching unread count:", err);
        setUnreadCount(0); // Fallback to 0 on error
      }
    };

    fetchUnreadCount();
    const pollInterval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(pollInterval);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const refreshUnreadCount = async () => {
        try {
          const result = await getUnreadNotificationCount();
          if (result.success && result.data) {
            setUnreadCount(result.data.count || 0);
          }
        } catch (err) {
          console.error("[HomeScreen] Error refreshing unread count:", err);
        }
      };

      refreshUnreadCount();
    }, [])
  );

  const liveCompetitionsFull = useMemo(
    () =>
      liveCompetitions.map((comp) => ({
        defaultThumbnailImage: require("@assets/images/trending_reel2.png"),
        people: convertToFormattedString(Number(comp.participants ?? 0)),
        endDate: comp.endDate ? String(comp.endDate) : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        prize: convertToFormattedPrize(comp.prize),
        ...comp,
      })),
    [liveCompetitions]
  );
  
  const pastCompetitionsFull = useMemo(
    () =>
      pastCompetitions.map((comp) => ({
        defaultThumbnailImage: require("@assets/images/trending_reel2.png"),
        ...comp,
      })),
    [pastCompetitions]
  );
  
  const upcomingCompetitionsFull = useMemo(
    () =>
      upcomingCompetitions.map((comp) => ({
        defaultThumbnailImage: require("@assets/images/trending_reel2.png"),
        ...comp,
      })),
    [upcomingCompetitions]
  );

  const convertTrendingReelsToReels = useMemo(() => {
    return trendingData.map((reel) => ({
      id: reel.id,
      username: reel.title || "GullyFame Creator",
      caption: reel.category || "",
      musicName: "Original Sound",
      video: null,
      likes: Number(reel.likes ?? 0),
      comments: 0,
      shares: 0,
      saves: 0,
      tips: 0,
      isLiked: false,
      isSaved: false,
      type: "video" as const,
    }));
  }, [trendingData]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) =>
      setDimensions(window)
    );
    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  useEffect(() => {
    fadeAnim.setValue(1);
    const blinkAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(liveDotBlink, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(liveDotBlink, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    const heartbeatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
         }),
      ])
    );

    blinkAnimation.start();
    heartbeatAnimation.start();
    return () => {
      blinkAnimation.stop();
      heartbeatAnimation.stop();
    };
  }, []);

  const tabs = [
    { name: "Home", icon: HomeIconSVG, label: "" },
    { name: "Reel", icon: ReelIconSVG, label: "GullyReel" },
    { name: "Upload", icon: null, label: "UPLOAD" },
    { name: "Search", icon: SearchIconSVG, label: "" },
    { name: "MyFame", icon: UserIconSVG, label: "" },
  ];

  const checkAuthAndNavigate = async (route: string, requiresParticipant: boolean = false) => {
    try {
      const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
      if (isLoggedIn !== "true") {
        setDrawerVisible(true);
        return;
      }
      if (requiresParticipant) {
        const role = await AsyncStorage.getItem("userRole");
        if (role !== "participant" && role !== "participants") {
          Alert.alert(
            "Participants only",
            "Switch your account role to participant to submit entries. Fans can still follow and vote!"
          );
          return;
        }
      }
      router.push(route as any);
    } catch (e) {
      setDrawerVisible(true);
    }
  };

  // Removed 'user_progress' section since it contained hardcoded gamification dummy data
  const homeSections = [
    { id: "hero" },
    { id: "categories" },
    { id: "trending" },
    { id: "live" },
    { id: "upcoming" },
    { id: "past" },
    { id: "top_competitors" },
    { id: "role_banner" },
  ];

  const renderSection = ({ item }: { item: { id: string } }) => {
    switch (item.id) {
      case "hero":
        return (
          <View style={[styles.heroSection, { height: hp(40) }]}>
            <View style={styles.radialGradientContainer}>
              <Svg width={dimensions.width} height={hp(40)} style={styles.radialGradientSvg}>
                <Defs>
                  <RadialGradient id="radialGradient" cx="50%" cy="0%" r="200%">
                    <Stop offset="0%" stopColor="#EC9A15" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#1E1111" stopOpacity="1" />
                  </RadialGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#radialGradient)" />
              </Svg>
            </View>
            <View
              style={[
                styles.heroHeaderIcons,
                {
                  paddingTop: Platform.OS === "ios" ? insets.top + 40 : insets.top + 40,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.heroIconButton}
                onPress={() => checkAuthAndNavigate("/(main)/settings/notifications")}
              >
                <NotificationIcon />
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heroIconButton}
                onPress={() => checkAuthAndNavigate("/(main)/inbox")}
              >
                <ChatIcon />
              </TouchableOpacity>
            </View>
            <HeroBannerCarousel slides={banners}></HeroBannerCarousel>
          </View>
        );

      case "categories":
        return <CategoriesCarousel categories={categories}></CategoriesCarousel>;

      case "trending":
        const currentFeedData = 
          feedTab === "trending" ? trendingData :
          feedTab === "for-you" ? forYouData :
          feedTab === "popular" ? popularData :
          savedData;

        return (
          <View style={styles.section}>
            <View style={styles.sectionHeaderWithIcon}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Feed 🎬</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 12 }}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            >
              {[
                { id: "trending", label: "Trending 🔥" },
                { id: "for-you", label: "For You 👤" },
                { id: "popular", label: "Popular ⭐" },
                { id: "saved", label: "Saved 💾" },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setFeedTab(tab.id as any)}
                  style={[
                    {
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: feedTab === tab.id ? "#EC9A15" : "rgba(255,255,255,0.1)",
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: feedTab === tab.id ? "#000" : "#999",
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {feedLoading ? (
              <View style={{ paddingVertical: 40, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#EC9A15" />
                <Text style={{ color: "#999", marginTop: 12 }}>Loading feed...</Text>
              </View>
            ) : currentFeedData && currentFeedData.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.trendingScroll}
                nestedScrollEnabled={true}
              >
                {currentFeedData.map((reel, index) => (
                  <View key={reel.id || index} style={styles.trendingReelCardWrapper}>
                    <TouchableOpacity
                      style={styles.trendingReelCard}
                      onPress={() => {
                        setSelectedReelIndex(index);
                        requestAnimationFrame(() => setShowReelViewer(true));
                      }}
                      activeOpacity={0.9}
                    >
                      <ImageBackground
                        source={require("@assets/images/badge.png")}
                        style={styles.topBadge}
                        resizeMode="contain"
                      >
                        <View style={styles.topBadgeContent}>
                          <Text style={styles.topBadgeText}>TOP</Text>
                          <Text style={styles.topBadgeNumber}>{index + 1}</Text>
                        </View>
                      </ImageBackground>

                      <SafeImage
                        style={styles.trendingReelImage}
                        imageUrl={reel.thumbnail || `${BASE_URL}${reel.image}`}
                        defaultImage={require("@assets/images/trending_reel2.png")}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                    <Text style={styles.trendingReelTitleBelow} numberOfLines={1}>
                      {reel.title}
                    </Text>
                    <View style={styles.trendingReelStatsBelow}>
                      <View style={styles.statItem}>
                        <ThumbsUpIcon />
                        <Text style={styles.statText}>
                          {convertToFormattedString(Number(reel.likes ?? 0))}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <EyeIcon color="#EAB04B" />
                        <Text style={styles.statText}>
                          {convertToFormattedString(Number(reel.views ?? 0))} views
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={{ paddingVertical: 40, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: "#999", fontSize: 14 }}>No reels available</Text>
              </View>
            )}
          </View>
        );

      case "live":
        if (!liveCompetitionsFull.length) return null;
        return (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionTitleRow, { alignItems: "center" }]}>
                <Animated.View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#FF3B30",
                    marginRight: 8,
                    opacity: liveDotBlink,
                  }}
                />
                <Text style={styles.sectionTitle}>Live Competitions</Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllContainer}
                onPress={() => checkAuthAndNavigate("/(main)/competitions/live")}
              >
                <Text style={styles.viewAllButton}>View All</Text>
                <CaretRightIcon></CaretRightIcon>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.competitionsScroll}
              nestedScrollEnabled={true}
            >
              {liveCompetitionsFull.map((comp) => (
                <View key={`live-${comp.id}`} style={styles.upcomingCompCardWrapper}>
                  <TouchableOpacity
                    style={[styles.upcomingCompCard, styles.glowingCard]}
                    activeOpacity={0.9}
                    onPress={() => router.push(`/(main)/competition/live/${comp.id}` as any)}
                  >
                    <View style={styles.upcomingCompImageWrapper}>
                      <SafeImage
                        defaultImage={comp.defaultThumbnailImage}
                        imageUrl={`${BASE_URL}${comp.image}`}
                        style={styles.upcomingCompImage}
                        resizeMode="contain"
                      />
                      <View
                        style={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          backgroundColor: "#FF3B30",
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                          borderRadius: 20,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "#FFF",
                          }}
                        />
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: "700",
                            letterSpacing: 0.5,
                          }}
                        >
                          LIVE
                        </Text>
                      </View>

                      <Animated.View
                        style={[
                          styles.joinButtonOverlay,
                          {
                            transform: [
                              {
                                scale: pulseAnim,
                              },
                            ],
                          },
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.joinButtonOnImage}
                          onPress={(e) => {
                            e.stopPropagation();
                            router.push(`/(main)/competition/live/${comp.id}` as any);
                          }}
                        >
                          <LinearGradient
                            colors={["#FF3B30", "#D32F2F"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.joinButtonGradientOnImage}
                          >
                            <Text style={styles.joinButtonTextOnImage}>Vote Now</Text>
                            <Text style={styles.joinButtonPrizeText}>
                              {convertToFormattedPrize(comp.prize)}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </Animated.View>
                    </View>
                    <View style={styles.upcomingCompContent}>
                      <Text style={styles.upcomingCompTitle} numberOfLines={2}>
                        {comp.title}
                      </Text>
                      <View style={styles.compInfoRow}>
                        <View style={styles.compInfoItem}>
                          <LimitedTimeEventClockIcon />
                          <Text style={styles.upcomingCompDeadline}>
                            {convertDateToDaysLeft(comp.endDate ? String(comp.endDate) : "")} Days Left
                          </Text>
                        </View>
                        <View style={styles.compInfoItem}>
                          <PeopleIcon color="#EC9A15" size={14} />
                          <Text style={styles.upcomingCompParticipants}>
                            {comp.people}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        );

      case "upcoming":
        if (!upcomingCompetitionsFull.length) return null;
        return (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <TrophyIcon size={24} />
                <Text style={styles.sectionTitle}>Upcoming Competitions</Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllContainer}
                onPress={() => checkAuthAndNavigate("/(main)/competitions/upcoming")}
              >
                <Text style={styles.viewAllButton}>View All</Text>
                <CaretRightIcon></CaretRightIcon>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.competitionsScroll}
              nestedScrollEnabled={true}
            >
              {upcomingCompetitionsFull.map((comp) => (
                <View key={`upcoming-${comp.id}`} style={styles.upcomingCompCardWrapper}>
                  <TouchableOpacity
                    style={styles.upcomingCompCard}
                    activeOpacity={0.9}
                    onPress={() => router.push(`/(main)/competition/upcoming/${comp.id}` as any)}
                  >
                    <View style={styles.upcomingCompImageWrapper}>
                      <SafeImage
                        defaultImage={comp.defaultThumbnailImage}
                        imageUrl={`${BASE_URL}${comp.image}`}
                        style={styles.upcomingCompImage}
                        resizeMode="contain"
                      ></SafeImage>
                      <View style={styles.joinButtonOverlay}>
                        <TouchableOpacity
                          style={styles.joinButtonOnImage}
                          onPress={(e) => {
                            e.stopPropagation();
                            router.push(`/(main)/competition/upcoming/${comp.id}` as any);
                          }}
                        >
                          <LinearGradient
                            colors={["#1E88E5", "#1565C0"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.joinButtonGradientOnImage}
                          >
                            <Text style={styles.joinButtonTextOnImage}>View Details</Text>
                            <Text style={styles.joinButtonPrizeText}>
                              {convertToFormattedPrize(comp.prize)}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.upcomingCompContent}>
                      <Text style={styles.upcomingCompTitle} numberOfLines={2}>
                        {comp.title}
                      </Text>
                      <View style={styles.compInfoRow}>
                        <View style={styles.compInfoItem}>
                          <LimitedTimeEventClockIcon></LimitedTimeEventClockIcon>
                          <Text style={styles.upcomingCompDeadline}>
                            {convertDateToDaysLeft(comp.endDate ? String(comp.endDate) : "")} Days Left
                          </Text>
                        </View>
                        <View style={styles.compInfoItem}>
                          <PeopleIcon color="#EC9A15" size={14} />
                          <Text style={styles.upcomingCompParticipants}>
                            {convertToFormattedString(Number(comp.participants ?? 0))}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        );

      case "past":
        if (!pastCompetitionsFull.length) return null;
        return (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <TrophyIcon size={24} />
                <Text style={styles.sectionTitle}>Past Competitions</Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllContainer}
                onPress={() => checkAuthAndNavigate("/(main)/competitions/past")}
              >
                <Text style={styles.viewAllButton}>View All</Text>
                <CaretRightIcon></CaretRightIcon>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pastCompScroll}
              nestedScrollEnabled={true}
            >
              {pastCompetitionsFull.map((comp) => (
                <TouchableOpacity
                  key={comp.id}
                  style={styles.pastCompCard}
                  onPress={() => router.push(`/(main)/competition/past/${comp.id}` as any)}
                  activeOpacity={0.9}
                >
                  <View style={styles.pastCompImageWrapper}>
                    <SafeImage
                      style={styles.pastCompImage}
                      resizeMode="contain"
                      imageUrl={`${BASE_URL}${comp.image}`}
                      defaultImage={comp.defaultThumbnailImage}
                    ></SafeImage>
                    <View style={styles.pastCompBadge}>
                      <Text style={styles.pastCompBadgeText}>Ended</Text>
                    </View>
                    <View style={styles.viewResultsButtonOverlay}>
                      <TouchableOpacity
                        style={styles.viewResultsButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push(`/(main)/competition/past/${comp.id}` as any);
                        }}
                      >
                        <LinearGradient
                          colors={["#EBA229", "#EBA229"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.viewResultsButtonGradient}
                        >
                          <Text style={styles.viewResultsButtonText}>View Results</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.pastCompContent}>
                    <Text style={styles.pastCompTitle} numberOfLines={1}>
                      {comp.title}
                    </Text>
                    <View style={styles.winnerViewsRow}>
                      <View style={styles.winnerRow}>
                        <TrophyIcon size={10} />
                        <Text style={styles.pastCompWinnerLabel}>Winner: </Text>
                        <Text style={styles.pastCompWinner}>{comp.winner}</Text>
                      </View>
                      <View style={styles.viewsRow}>
                        <ViewsEyeIcon size={15}></ViewsEyeIcon>
                        <Text style={styles.pastCompViews}>
                          {convertToFormattedString(Number(comp.views ?? 0))} Views
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case "top_competitors":
        if (!topCompetitors.length) return null;
        return (
          <View style={[styles.section, styles.hallOfFameSection]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <TrophyIcon size={24} color="#EAB04B" />
                <Text style={styles.sectionTitle}>Hall of Fame</Text>
              </View>
            </View>
            <Text style={styles.hallOfFameSubtitle}>
              Overall point leaders across all GullyFame events.
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.competitionsScroll}
              nestedScrollEnabled={true}
            >
              {topCompetitors.map((competitor) => (
                <View
                  key={`top-${competitor.rank}`}
                  style={[
                    styles.hallOfFameCard,
                    {
                      borderColor: competitor.rank === 1 ? "#EAB04B" : "#333",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.hallOfFameRank,
                      {
                        color: competitor.rank === 1 ? "#EAB04B" : "#aaa",
                      },
                    ]}
                  >
                    #{competitor.rank}
                  </Text>
                  <SafeImage
                    style={styles.hallOfFameImage}
                    imageUrl={`${BASE_URL}${competitor.image}`}
                    defaultImage={require("@assets/images/trending_reel2.png")}
                  />
                  <Text style={styles.hallOfFameName} numberOfLines={1}>
                    {competitor.name}
                  </Text>
                  <Text style={styles.hallOfFamePoints}>
                    {convertToFormattedString(Number(competitor.points ?? 0))} pts
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        );

      case "role_banner":
        return (
          <View style={{ marginBottom: 40 }}>
            <RoleBasedBanner />
          </View>
        );

      default:
        return null;
    }
  };

  //if (typeof BottomNav !== "function" || typeof DrawerMenu !== "function") return null;
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {scrollY > 50 && (
        <Animated.View
          style={[
            styles.stickyHeader,
            {
              opacity: scrollY > 50 ? 1 : 0,
              paddingTop: Platform.OS === "ios" ? insets.top + 10 : insets.top + 10,
            },
          ]}
        >
          <View style={styles.stickyHeaderContent}>
            <TouchableOpacity
              style={styles.stickyHeaderIconButton}
              onPress={() => checkAuthAndNavigate("/(main)/settings/notifications")}
            >
              <NotificationIcon />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.stickyHeaderIconButton}
              onPress={() => checkAuthAndNavigate("/(main)/inbox")}
            >
              <ChatIcon />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <Animated.FlatList
        data={homeSections}
        keyExtractor={(item) => item.id}
        renderItem={renderSection}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { opacity: fadeAnim }]}
        scrollEventThrottle={16}
        onScroll={(event) => setScrollY(event.nativeEvent.contentOffset.y)}
      />

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        onOpenDrawer={() => setDrawerVisible(true)}
      />
      <DrawerMenu visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
      <ReelViewer
        visible={showReelViewer}
        reels={convertTrendingReelsToReels}
        initialIndex={selectedReelIndex}
        onClose={() => setShowReelViewer(false)}
        hasBottomNav={false}
        insets={insets}
      />
    </View>
  );
}