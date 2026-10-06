// Created by Kiro - Hook for fetching user reels with Local Storage Caching
// Fetches user's reels/posts dynamically from API + falls back to local cache

import { useState, useEffect, useCallback } from "react";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../api/axios";

export interface Reel {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  videoUrl?: string;
  video_url?: string;
  thumbnail?: string;
  thumbnail_url?: string;
  duration?: number;
  uri?: string;
  [key: string]: any;
}

const LOCAL_REELS_KEY = "@gullyfame_local_published_reels";

/**
 * Helper function to save newly published reels into local storage cache
 */
export const saveReelToLocalCache = async (newReel: Reel) => {
  try {
    const existingData = await AsyncStorage.getItem(LOCAL_REELS_KEY);
    let reelsList: Reel[] = existingData ? JSON.parse(existingData) : [];

    // Add new reel to top of list and avoid duplicate IDs
    const newId = newReel.id || newReel._id || `local-${Date.now()}`;
    const cleanedReel = { ...newReel, id: newId, _id: newId };

    reelsList = [cleanedReel, ...reelsList.filter((r) => (r.id || r._id) !== newId)];

    await AsyncStorage.setItem(LOCAL_REELS_KEY, JSON.stringify(reelsList));
    console.log("✅ [useUserReels] Successfully saved new reel to local cache!");
  } catch (error) {
    console.error("❌ [useUserReels] Error saving reel to local cache:", error);
  }
};

export const useUserReels = (userId: string) => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useLocalSearchParams();

  // Fetch user reels
  const fetchUserReels = useCallback(async () => {
    setLoading(true);
    setError(null);

    // 1. Fetch Local Cached Reels first
    let cachedReels: Reel[] = [];
    try {
      const stored = await AsyncStorage.getItem(LOCAL_REELS_KEY);
      if (stored) {
        cachedReels = JSON.parse(stored);
        console.log(`[useUserReels] Loaded ${cachedReels.length} cached reels from storage`);
      }
    } catch (e) {
      console.warn("[useUserReels] Failed to load local reels cache:", e);
    }

    // 2. Fetch from Backend Endpoints
    let apiReels: Reel[] = [];
    if (userId) {
      try {
        const currentUserId = userId === "me"
          ? await AsyncStorage.getItem("userId")
          : userId;
        const response = await apiClient.get<any>("reels", {
          params: { limit: 50 },
        });
        const responseData = response.data as any;
        const responseReels = Array.isArray(responseData.data?.reels)
          ? responseData.data.reels
          : Array.isArray(responseData.data)
            ? responseData.data
            : [];
        apiReels = responseReels.filter((reel: any) => {
          const authorId = reel.author?._id || reel.author?.id || reel.userId || reel.user?._id;
          return currentUserId && authorId === currentUserId;
        });
      } catch {
        apiReels = [];
      }
    }

    // 3. Check route params for newly posted reel
    if (params?.newReel) {
      try {
        const newlyPostedReel = JSON.parse(params.newReel as string);
        if (newlyPostedReel) {
          await saveReelToLocalCache(newlyPostedReel);
          cachedReels = [
            newlyPostedReel,
            ...cachedReels.filter(
              (r) => (r.id || r._id) !== (newlyPostedReel.id || newlyPostedReel._id)
            ),
          ];
        }
      } catch (e) {}
    }

    // 4. Merge API + Local Cached Reels (Deduplicated)
    const reelMap = new Map<string, Reel>();

    // Put cached local reels
    cachedReels.forEach((item) => {
      const key = item.id || item._id || item.videoUrl || item.video_url;
      if (key) reelMap.set(key, item);
    });

    // Put API reels
    apiReels.forEach((item) => {
      const key = item.id || item._id || item.videoUrl || item.video_url;
      if (key) reelMap.set(key, item);
    });

    const finalReels = Array.from(reelMap.values());
    console.log(`[useUserReels] Final display reels count: ${finalReels.length}`);

    setReels(finalReels);
    setLoading(false);
  }, [userId, params?.newReel]);

  // Normalize reels for grid display
  const normalizedReels = reels.map((reel) => ({
    ...reel,
    uri: reel.uri || reel.videoUrl || reel.video_url,
    thumbnail: reel.thumbnail || reel.thumbnail_url,
    id: reel.id || reel._id,
  }));

  useEffect(() => {
    fetchUserReels();
  }, [fetchUserReels]);

  return {
    reels: normalizedReels,
    loading,
    error,
    refetch: fetchUserReels,
  };
};
