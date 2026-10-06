import apiClient from "../axios";
import { ApiResponse } from "../types";
import API_ENDPOINTS, { replaceParams } from "../endpoints";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Reel {
  id: string;
  title: string;
  description?: string;
  creator: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    isVerified?: boolean;
    followers?: number;
  };
  thumbnail?: string;
  videoUrl?: string;
  duration: number;
  category: string;
  tags?: string[];
  likes: number;
  comments: number;
  shares: number;
  views: number;
  createdAt: string;
  musicTrack?: {
    id: string;
    title: string;
    artist: string;
  };
  competition?: {
    id: string;
    title: string;
    prizePool?: number;
  };
  isTrending?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
}

export interface FeedResponse {
  page: number;
  limit: number;
  total: number;
  reels: Reel[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  emoji?: string;
  color?: string;
  reelCount?: number;
  isTrending?: boolean;
}

export interface Collection {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  itemCount: number;
  featured: boolean;
}

const LOCAL_REELS_KEY = "@gullyfame_local_published_reels";

function normalizeReel(raw: any): Reel {
  return {
    id: raw._id ?? raw.id ?? "",
    title: raw.title ?? "Untitled",
    description: raw.description,
    creator: {
      id: raw.creator?.id ?? raw.creator?._id ?? "",
      name: raw.creator?.name ?? "Unknown",
      username: raw.creator?.username ?? "unknown",
      avatar: raw.creator?.avatar,
      isVerified: raw.creator?.isVerified,
      followers: raw.creator?.followers,
    },
    thumbnail: raw.thumbnail,
    videoUrl: raw.videoUrl ?? raw.video_url,
    duration: raw.duration ?? 0,
    category: raw.category ?? "general",
    tags: raw.tags ?? [],
    likes: raw.likes ?? 0,
    comments: raw.comments ?? 0,
    shares: raw.shares ?? 0,
    views: raw.views ?? 0,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    musicTrack: raw.musicTrack,
    competition: raw.competition,
    isTrending: raw.isTrending,
    isPopular: raw.isPopular,
    isNew: raw.isNew,
  };
}

// 🛠️ Helper to inject locally uploaded reels into the feed
async function injectLocalReels(apiReels: Reel[]): Promise<Reel[]> {
  try {
    const cachedData = await AsyncStorage.getItem(LOCAL_REELS_KEY);
    if (cachedData) {
      const localReels = JSON.parse(cachedData);
      if (localReels && localReels.length > 0) {
        // Map local reels to match the Feed Reel interface
        const formattedLocalReels: Reel[] = localReels.map((r: any) => ({
          id: r.id || r._id || `local-${Date.now()}`,
          title: r.title || "Untitled Reel",
          description: r.description || "",
          creator: {
            id: "me",
            name: "You",
            username: "you",
            isVerified: true,
          },
          thumbnail: r.thumbnail || r.thumbnail_url,
          videoUrl: r.videoUrl || r.video_url || r.uri,
          duration: r.duration || 0,
          category: "general",
          tags: r.tags || [],
          likes: 0,
          comments: 0,
          shares: 0,
          views: 1,
          createdAt: r.createdAt || new Date().toISOString(),
        }));

        // Prevent duplicates if API eventually returns the same video
        const apiIds = new Set(apiReels.map((r) => r.id));
        const uniqueLocal = formattedLocalReels.filter((r) => !apiIds.has(r.id));

        return [...uniqueLocal, ...apiReels];
      }
    }
  } catch (error) {
    console.warn("[feedService] Error injecting local reels:", error);
  }
  return apiReels;
}

// ─────────────────────────────────────────────
// API Calls
// ─────────────────────────────────────────────

export async function getTrendingReels(
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<FeedResponse>> {
  try {
    const response = await apiClient.get<any>(API_ENDPOINTS.FEED.GET_TRENDING, {
      params: { page, limit },
    });
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const raw = responseData.data;
      const reels = Array.isArray(raw) ? raw : raw.reels || raw.data || [];
      let normalizedReels = reels.map(normalizeReel);

      // 🛠️ Inject local reels on the first page
      if (page === 1) {
        normalizedReels = await injectLocalReels(normalizedReels);
      }

      return {
        success: true,
        data: {
          page: raw.page ?? page,
          limit: raw.limit ?? limit,
          total: raw.total ?? normalizedReels.length,
          reels: normalizedReels,
        },
        message: responseData.message || "Trending reels loaded successfully",
      };
    }

    // Fallback to local reels if API fails but page is 1
    if (page === 1) {
      const localReels = await injectLocalReels([]);
      if (localReels.length > 0) {
        return {
          success: true,
          data: { page, limit, total: localReels.length, reels: localReels },
          message: "Loaded local reels",
        };
      }
    }

    return {
      success: false,
      message: responseData.message || "Failed to load",
      data: { page, limit, total: 0, reels: [] },
    };
  } catch (error: any) {
    if (page === 1) {
      const localReels = await injectLocalReels([]);
      if (localReels.length > 0) {
        return {
          success: true,
          data: { page, limit, total: localReels.length, reels: localReels },
          message: "Loaded local reels (Offline mode)",
        };
      }
    }
    return {
      success: false,
      message: error.message || "Network error",
      data: { page, limit, total: 0, reels: [] },
    };
  }
}

export async function getForYouReels(
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<FeedResponse>> {
  try {
    const response = await apiClient.get<any>(API_ENDPOINTS.FEED.GET_FOLLOWING_FEED, {
      params: { page, limit },
    });
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const raw = responseData.data;
      const reels = Array.isArray(raw) ? raw : raw.reels || raw.data || [];
      let normalizedReels = reels.map(normalizeReel);

      if (page === 1) {
        normalizedReels = await injectLocalReels(normalizedReels);
      }

      return {
        success: true,
        data: {
          page: raw.page ?? page,
          limit: raw.limit ?? limit,
          total: raw.total ?? normalizedReels.length,
          reels: normalizedReels,
        },
        message: responseData.message || "For You feed loaded successfully",
      };
    }
    return {
      success: false,
      message: responseData.message || "Failed to load",
      data: { page, limit, total: 0, reels: [] },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Network error",
      data: { page, limit, total: 0, reels: [] },
    };
  }
}

export async function getPopularReels(
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<FeedResponse>> {
  try {
    const response = await apiClient.get<any>("public/feed/popular", { params: { page, limit } });
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const raw = responseData.data;
      const reels = Array.isArray(raw) ? raw : raw.reels || raw.data || [];
      return {
        success: true,
        data: {
          page: raw.page ?? page,
          limit: raw.limit ?? limit,
          total: raw.total ?? reels.length,
          reels: reels.map(normalizeReel),
        },
        message: responseData.message || "Popular reels loaded successfully",
      };
    }
    return {
      success: false,
      message: responseData.message || "Failed to load",
      data: { page, limit, total: 0, reels: [] },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Network error",
      data: { page, limit, total: 0, reels: [] },
    };
  }
}

export async function getSavedReels(
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<FeedResponse>> {
  try {
    const response = await apiClient.get<any>("reels", { params: { page, limit, saved: true } });
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const raw = responseData.data;
      const reels = Array.isArray(raw) ? raw : raw.reels || raw.data || [];
      return {
        success: true,
        data: {
          page: raw.page ?? page,
          limit: raw.limit ?? limit,
          total: raw.total ?? reels.length,
          reels: reels.map(normalizeReel),
        },
        message: responseData.message || "Saved reels loaded successfully",
      };
    }
    return {
      success: false,
      message: responseData.message || "Failed to load",
      data: { page, limit, total: 0, reels: [] },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Network error",
      data: { page, limit, total: 0, reels: [] },
    };
  }
}

export async function getCategories(): Promise<ApiResponse<Category[]>> {
  try {
    const response = await apiClient.get<any>("public/categories");
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const categories = Array.isArray(responseData.data)
        ? responseData.data
        : responseData.data.categories || [];
      return { success: true, data: categories, message: "Categories loaded successfully" };
    }
    return { success: false, message: responseData.message || "Failed to load", data: [] };
  } catch (error: any) {
    return { success: false, message: error.message || "Network error", data: [] };
  }
}

export async function getFeaturedCollections(): Promise<ApiResponse<Collection[]>> {
  try {
    const response = await apiClient.get<any>("public/collections/featured");
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const collections = Array.isArray(responseData.data)
        ? responseData.data
        : responseData.data.collections || [];
      return { success: true, data: collections, message: "Collections loaded successfully" };
    }
    return { success: false, message: responseData.message || "Failed to load", data: [] };
  } catch (error: any) {
    return { success: false, message: error.message || "Network error", data: [] };
  }
}

export async function toggleLikeReel(
  reelId: string
): Promise<ApiResponse<{ isLiked: boolean; likeCount: number }>> {
  try {
    const endpoint = replaceParams(API_ENDPOINTS.REELS.LIKE, { id: reelId });
    const response = await apiClient.post<any>(endpoint);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      return {
        success: true,
        data: {
          isLiked: responseData.data.isLiked ?? true,
          likeCount: responseData.data.likeCount ?? 0,
        },
        message: "Like toggled successfully",
      };
    }
    return { success: false, message: responseData.message || "Failed to toggle like" };
  } catch (error: any) {
    return { success: false, message: error.message || "Network error" };
  }
}

export async function toggleSaveReel(reelId: string): Promise<ApiResponse<{ isSaved: boolean }>> {
  try {
    const endpoint = replaceParams(API_ENDPOINTS.REELS.GET_BY_ID, { id: `${reelId}/save` });
    const response = await apiClient.post<any>(endpoint);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      return {
        success: true,
        data: { isSaved: responseData.data.isSaved ?? true },
        message: "Save toggled successfully",
      };
    }
    return { success: false, message: responseData.message || "Failed to toggle save" };
  } catch (error: any) {
    return { success: false, message: error.message || "Network error" };
  }
}

export const feedService = {
  getTrendingReels,
  getForYouReels,
  getPopularReels,
  getSavedReels,
  getCategories,
  getFeaturedCollections,
  toggleLikeReel,
  toggleSaveReel,
};

export default feedService;
