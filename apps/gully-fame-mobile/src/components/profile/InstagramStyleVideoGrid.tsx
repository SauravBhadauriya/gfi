import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Text,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";

const { width } = Dimensions.get("window");
const GRID_COLUMNS = 3;
const ITEM_SIZE = width / GRID_COLUMNS;

interface Reel {
  _id?: string;
  id?: string;
  uri?: string;
  thumbnail?: string;
  duration?: number;
  title?: string;
}

interface InstagramStyleVideoGridProps {
  reels: Reel[];
  loading?: boolean;
  userId?: string;
  onRefresh?: () => void;
}

const PlayIcon = ({ size = 30, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M8 5v14l11-7z" />
  </Svg>
);

const InstagramStyleVideoGrid: React.FC<InstagramStyleVideoGridProps> = ({
  reels = [],
  loading = false,
  userId,
  onRefresh,
}) => {
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);

  if (loading && reels.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EC9A15" />
        <Text style={styles.loadingText}>Loading videos...</Text>
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"
            stroke="#666"
            strokeWidth="1"
          />
        </Svg>
        <Text style={styles.emptyText}>No videos yet</Text>
        <Text style={styles.emptySubText}>Start recording to see your videos here</Text>
      </View>
    );
  }

  const gridItems = reels.map((reel, index) => ({
    ...reel,
    key: reel._id || reel.id || `reel-${index}`,
  }));

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh
          ? {
              refreshing: loading,
              onRefresh,
            }
          : undefined
      }
    >
      <View style={styles.grid}>
        {gridItems.map((reel) => (
          <TouchableOpacity
            key={reel.key}
            style={styles.gridItem}
            onPress={() => setSelectedReel(reel)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#1a1a1a", "#2a2a2a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gridItemInner}
            >
              {reel.thumbnail || reel.uri ? (
                <>
                  <Image
                    source={{ uri: reel.thumbnail || reel.uri }}
                    style={styles.gridItemImage}
                    resizeMode="cover"
                  />
                  <View style={styles.playIconContainer}>
                    <PlayIcon size={24} />
                  </View>
                  {reel.duration && (
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>
                        {Math.floor(reel.duration)}s
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.placeholderIcon}>
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="#666">
                    <Path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54h-2.96l4.3-5.71 1.87 2.36 2.75-3.54h2.96l-4.3 5.71-1.87-2.36z" />
                  </Svg>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  gridItem: {
    width: "33.333%",
    aspectRatio: 1,
    padding: 2,
  },
  gridItemInner: {
    flex: 1,
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  gridItemImage: {
    ...StyleSheet.absoluteFillObject,
  },
  playIconContainer: {
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.9,
  },
  durationBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  durationText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  placeholderIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
    backgroundColor: "#000",
  },
  loadingText: {
    color: "#999",
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400,
    backgroundColor: "#000",
  },
  emptyText: {
    color: "#999",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubText: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

export default InstagramStyleVideoGrid;
