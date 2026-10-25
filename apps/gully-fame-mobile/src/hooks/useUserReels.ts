// Created by Kiro - Hook for fetching user reels with Local Storage Caching
// Fetches user's reels/posts dynamically from API + falls back to local cache

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../api/client";

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
  } catch (error) { /* intentionally ignored */
  }
};

const PAGE_SIZE = 30;
const apiCacheKey = (userId: string) => `@gullyfame_profile_reels_${userId}`;

const reelKey = (item: Reel) => item.id || item._id || item.videoUrl || item.video_url || "";

const dedupe = (items: Reel[]) => {
  const map = new Map<string, Reel>();
  items.forEach((item) => {
    const key = reelKey(item);
    if (key) map.set(key, item);
  });
  return Array.from(map.values());
};

export const useUserReels = (userId: string) => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  const resolvedUserIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);

  const params = useLocalSearchParams();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  // One page of the global reels list, filtered to this author on the device.
  // BACKEND_PENDING: GET users/:id/posts?cursor=&limit= so the server filters by author.
  const fetchPage = useCallback(async (cursor: string | null) => {
    const ownerId = resolvedUserIdRef.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const response = await apiClient.get<any>("reels", {
      params: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
      signal: controller.signal,
    });
    const data = (response.data as any)?.data;
    const list: any[] = Array.isArray(data?.reels) ? data.reels : Array.isArray(data) ? data : [];
    const mine = list.filter((reel: any) => {
      const authorId = reel.author?._id || reel.author?.id || reel.userId || reel.user?._id;
      return !!ownerId && authorId === ownerId;
    });
    const nextCursor: string | null = data?.nextCursor || null;
    const more = Boolean(data?.hasMore) && !!nextCursor && nextCursor !== cursor;
    return { mine, nextCursor, more };
  }, []);

  const fetchUserReels = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);
    setError(null);

    const myUserId = await AsyncStorage.getItem("userId");
    resolvedUserIdRef.current = userId === "me" ? myUserId : userId || null;
    // Reels cached on this device belong to the signed-in user only.
    const isOwnProfile = !!resolvedUserIdRef.current && resolvedUserIdRef.current === myUserId;
    const cacheKey = resolvedUserIdRef.current ? apiCacheKey(resolvedUserIdRef.current) : null;

    // 1. Reels this device published (shown even before the server lists them)
    let cachedReels: Reel[] = [];
    try {
      const stored = await AsyncStorage.getItem(LOCAL_REELS_KEY);
      if (stored && isOwnProfile) cachedReels = JSON.parse(stored);
    } catch (e) { /* intentionally ignored */
    }

    // 2. Newly posted reel passed through route params
    if (params?.newReel && isOwnProfile) {
      try {
        const newlyPostedReel = JSON.parse(params.newReel as string);
        if (newlyPostedReel) {
          await saveReelToLocalCache(newlyPostedReel);
          cachedReels = [newlyPostedReel, ...cachedReels];
        }
      } catch {
        // A malformed newlyPostedReel param is ignored; the API list is still shown.
      }
    }

    // 3. First page from the API, falling back to the last successful result when offline
    let apiReels: Reel[] = [];
    if (resolvedUserIdRef.current) {
      try {
        const page = await fetchPage(null);
        apiReels = page.mine;
        cursorRef.current = page.nextCursor;
        if (mountedRef.current) {
          setHasMore(page.more);
          setIsOffline(false);
        }
        if (cacheKey) AsyncStorage.setItem(cacheKey, JSON.stringify(apiReels)).catch(() => {});
      } catch (e: any) {
        if (e?.isCancelled) return;
        if (mountedRef.current) {
          setIsOffline(!!e?.isNetworkError);
          setHasMore(false);
          setError(e?.message || "Could not load posts");
        }
        if (cacheKey) {
          try {
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) apiReels = JSON.parse(cached);
          } catch {
            // No cached copy; the screen shows its error state.
          }
        }
      }
    }

    if (!mountedRef.current) return;
    setReels(dedupe([...cachedReels, ...apiReels]));
    setLoading(false);
    setRefreshing(false);
  }, [userId, params?.newReel, fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursorRef.current) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage(cursorRef.current);
      cursorRef.current = page.nextCursor;
      if (!mountedRef.current) return;
      setReels((prev) => {
        const merged = dedupe([...prev, ...page.mine]);
        // Stop paging if the server ignored the cursor and returned the same items.
        setHasMore(page.more && merged.length > prev.length);
        return merged;
      });
    } catch {
      if (mountedRef.current) setHasMore(false);
    } finally {
      if (mountedRef.current) setLoadingMore(false);
    }
  }, [loadingMore, hasMore, fetchPage]);

  // Normalize reels for grid display
  const normalizedReels = useMemo(
    () =>
      reels.map((reel) => ({
        ...reel,
        uri: reel.uri || reel.videoUrl || reel.video_url,
        thumbnail: reel.thumbnail || reel.thumbnail_url,
        id: reel.id || reel._id,
      })),
    [reels]
  );

  useEffect(() => {
    fetchUserReels("initial");
  }, [fetchUserReels]);

  const refetch = useCallback(() => fetchUserReels("initial"), [fetchUserReels]);
  const refresh = useCallback(() => fetchUserReels("refresh"), [fetchUserReels]);

  return {
    reels: normalizedReels,
    loading,
    error,
    refetch,
    refresh,
    refreshing,
    loadMore,
    loadingMore,
    hasMore,
    isOffline,
  };
};
