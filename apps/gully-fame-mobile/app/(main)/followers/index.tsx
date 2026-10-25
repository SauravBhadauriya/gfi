import React, { useCallback, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { TALENT_CATEGORIES } from "@/constants/talentCategories";
import { getFollowedCategories } from "@/utils/followedCategories";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabKey = "followers" | "following";
const TABS: TabKey[] = ["followers", "following"];

/**
 * Followers / following screen. The backend only supports toggling a follow
 * (POST /user/:userId/follow) and has no endpoint that lists followers or
 * following or returns their counts, so each tab explains that instead of
 * showing made-up users. Search, sort, rows and actions are hidden until the
 * backend provides them (see BACKEND GAPS).
 */
const FollowersScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const initialIndex = params.tab === "following" ? 1 : 0;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const pagerRef = useRef<ScrollView>(null);
  const [followedKeys, setFollowedKeys] = useState<string[]>([]);
  useFocusEffect(
    useCallback(() => {
      getFollowedCategories().then(setFollowedKeys);
    }, [])
  );
  const followedCategories = TALENT_CATEGORIES.filter((c) => followedKeys.includes(c.key));

  const goToTab = (index: number) => {
    setActiveIndex(index);
    pagerRef.current?.scrollTo({ x: index * width, animated: true });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab, index) => {
          const active = activeIndex === index;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.tab}
              onPress={() => goToTab(index)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab === "followers" ? "Followers" : "Following"}
              </Text>
              <View style={[styles.tabIndicator, active && styles.tabIndicatorActive]} />
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: initialIndex * width, y: 0 }}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
        }}
      >
        {TABS.map((tab) => (
          <View key={tab} style={[styles.page, { width }]}>
            {tab === "following" && followedCategories.length > 0 ? (
              <ScrollView contentContainerStyle={styles.catList}>
                <Text style={styles.catHeading}>Categories</Text>
                {followedCategories.map((c) => (
                  <TouchableOpacity
                    key={c.key}
                    style={styles.catRow}
                    onPress={() => router.push(`/(main)/category/${c.key}` as any)}
                  >
                    <View style={styles.catIcon}>
                      <MaterialCommunityIcons name={c.icon} size={24} color="#EC9A15" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.catName}>{c.name}</Text>
                      <Text style={styles.catTagline}>{c.tagline}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#C9B9A6" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={56} color="#EC9A15" />
              <Text style={styles.emptyTitle}>
                {tab === "followers" ? "Followers list" : "Following list"} isn&apos;t available yet
              </Text>
              <Text style={styles.emptySubtitle}>You can still follow people from their profile or reels.</Text>
            </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3C2610",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(236,154,21,0.2)",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingTop: 12,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#C9B9A6",
    paddingBottom: 12,
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  tabIndicator: {
    height: 3,
    width: "100%",
    backgroundColor: "transparent",
  },
  tabIndicatorActive: {
    backgroundColor: "#EC9A15",
  },
  catList: { padding: 16, gap: 10 },
  catHeading: { color: "#C9B9A6", fontSize: 13, marginBottom: 4 },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#55402D",
    alignItems: "center",
    justifyContent: "center",
  },
  catName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  catTagline: { color: "#C9B9A6", fontSize: 12, marginTop: 2 },
  page: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#C9B9A6",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default FollowersScreen;
