import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Text,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { router } from "expo-router";
import { VideoView, useVideoPlayer } from 'expo-video';

const { width } = Dimensions.get("window");
const GRID_COLUMNS = 3;
const ITEM_SIZE = width / GRID_COLUMNS;

// 🛠️ Helper function to fix incomplete Backend URLs
const getFullUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("file://") || url.startsWith("content://") || url.startsWith("data:")) {
    return url;
  }
  if (url.startsWith("/")) {
    return `https://gullyfame.com${url}`;
  }
  return url;
};

interface Reel {
  _id?: string;
  id?: string;
  uri?: string;
  videoUrl?: string;
  video_url?: string; 
  video?: string;    
  thumbnail?: string;
  thumbnail_url?: string;
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

// 🛠️ Smart Hack: Uses paused expo-video player to render the first frame instead of crashing the app
const AutoThumbnail = ({ videoUrl, style }: { videoUrl: string; style: any }) => {
  const player = useVideoPlayer(videoUrl, (p) => {
    p.muted = true;
    p.loop = false;
    p.pause(); // Pauses on the first frame to act like an image
  });

  return (
    <View style={[style, { overflow: 'hidden', backgroundColor: '#1a1a1a' }]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
    </View>
  );
};

const InstagramStyleVideoGrid: React.FC<InstagramStyleVideoGridProps> = ({
  reels = [],
  loading = false,
  userId,
  onRefresh,
}) => {
  
  const handleReelPress = (reel: Reel, index: number) => {
    router.push({
      pathname: "/(main)/reel", 
      params: { 
        userId: userId || "me", 
        reelId: (index + 1).toString() 
      }
    });
  };

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
    index,
  }));

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={loading || false}
            onRefresh={onRefresh}
            tintColor="#EC9A15"
          />
        ) : undefined
      }
    >
      <View style={styles.grid}>
        {gridItems.map((reel) => {
          const rawThumb = reel.thumbnail || reel.thumbnail_url || "";
          const rawVideo = reel.videoUrl || reel.video_url || reel.video || reel.uri || "";
          
          const finalThumb = getFullUrl(rawThumb);
          const videoSource = getFullUrl(rawVideo);
          
          return (
            <TouchableOpacity
              key={reel.key}
              style={styles.gridItem}
              onPress={() => handleReelPress(reel, reel.index)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#1a1a1a", "#2a2a2a"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gridItemInner}
              >
                {finalThumb.length > 5 ? (
                  <Image
                    source={{ uri: finalThumb }}
                    style={styles.gridItemImage}
                    resizeMode="cover"
                  />
                ) : videoSource.length > 5 ? (
                  <AutoThumbnail videoUrl={videoSource} style={styles.gridItemImage} />
                ) : (
                  <View style={[styles.gridItemImage, { backgroundColor: '#222' }]} />
                )}
                
                <View style={styles.playIconContainer}>
                  <PlayIcon size={24} />
                </View>
                
                {reel.duration ? (
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{Math.floor(reel.duration)}s</Text>
                  </View>
                ) : null}
              </LinearGradient>
            </TouchableOpacity>
          )
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 2, paddingVertical: 2 },
  gridItem: { width: "33.333%", aspectRatio: 1, padding: 2 },
  gridItemInner: { flex: 1, borderRadius: 4, overflow: "hidden", justifyContent: "center", alignItems: "center" },
  gridItemImage: { ...StyleSheet.absoluteFill },
  playIconContainer: { ...StyleSheet.absoluteFill, justifyContent: "center", alignItems: "center", zIndex: 10 },
  durationBadge: { position: "absolute", bottom: 4, right: 4, backgroundColor: "rgba(0, 0, 0, 0.7)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, zIndex: 10 },
  durationText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  placeholderIcon: { justifyContent: "center", alignItems: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 300, backgroundColor: "#000" },
  loadingText: { color: "#999", marginTop: 12, fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 400, backgroundColor: "#000" },
  emptyText: { color: "#999", fontSize: 16, fontWeight: "600", marginTop: 12 },
  emptySubText: { color: "#666", fontSize: 12, marginTop: 4, textAlign: "center", paddingHorizontal: 20 },
});

export default InstagramStyleVideoGrid;
