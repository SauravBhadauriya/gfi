import apiClient from "../axios";
import { ApiResponse } from "../types";

// ─────────────────────────────────────────────
// Backend Response Types
// ─────────────────────────────────────────────

/**
 * Author/Creator information from backend
 */
export interface ReelAuthor {
  _id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  profileImage?: string;
  is_followed_by_me: boolean;
}

/**
 * Reel statistics from backend
 */
export interface ReelStats {
  votes?: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  tips?: number;
}

/**
 * User's interaction state with the reel
 */
export interface UserInteractions {
  voted?: boolean;
  liked: boolean;
  saved: boolean;
}

/**
 * Raw backend reel response
 */
export interface BackendReel {
  _id: string;
  video_url: string;
  thumbnail_url?: string;
  caption: string;
  author: ReelAuthor;
  stats: ReelStats;
  user_interactions: UserInteractions;
  createdAt?: string;
  duration?: number;
  musicTrack?: {
    id?: string;
    title?: string;
    artist?: string;
    name?: string;
  };
}

/**
 * Normalized reel for UI consumption
 * Maps backend fields to UI model
 */
export interface Reel {
  id: number;
  userId: string;
  username: string;
  caption: string;
  musicName: string;
  video: { uri: string };
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  tips: number;
  isLiked: boolean;
  isSaved: boolean;
  isFollowed: boolean;
  _backendId?: string;
  thumbnail?: string;
  duration?: number;
  createdAt?: string;
}

/**
 * API response wrapper for reels list
 */
export interface ReelsResponse {
  reels: BackendReel[];
  nextCursor?: string;
  hasMore: boolean;
  page?: number;
  limit?: number;
  total?: number;
}

// ─────────────────────────────────────────────
// Mapping Functions
// ─────────────────────────────────────────────

/**
 * Normalize backend reel response to UI model
 * Converts backend field names and types to UI expectations
 */
function normalizeReel(backendReel: BackendReel, index: number): Reel {
  const creatorName = backendReel.author?.firstName
    ? `${backendReel.author.firstName}${backendReel.author.lastName ? ` ${backendReel.author.lastName}` : ""}`
    : backendReel.author?.username || "Unknown User";

  const musicName =
    backendReel.musicTrack?.title ||
    backendReel.musicTrack?.name ||
    "Original Sound";

  // Generate stable numeric ID from backend ID for UI state management
  // This ensures consistent IDs across renders
  const numericId =
    parseInt(backendReel._id.slice(-8), 16) % 1000000 || index + 1;

  return {
    id: numericId,
    _backendId: backendReel._id,
    userId: backendReel.author._id,
    username: creatorName,
    caption: backendReel.caption,
    musicName,
    video: { uri: backendReel.video_url },
    likes: backendReel.stats.likes || 0,
    comments: backendReel.stats.comments || 0,
    shares: backendReel.stats.shares || 0,
    saves: backendReel.stats.saves || 0,
    tips: backendReel.stats.tips || 0,
    isLiked: backendReel.user_interactions.liked || false,
    isSaved: backendReel.user_interactions.saved || false,
    isFollowed: backendReel.author.is_followed_by_me || false,
    thumbnail: backendReel.thumbnail_url,
    duration: backendReel.duration,
    createdAt: backendReel.createdAt,
  };
}

// ─────────────────────────────────────────────
// API Endpoints
// ─────────────────────────────────────────────

const REELS_ENDPOINT = "reels";

/**
 * Fetch reels with cursor-based pagination
 * 
 * @param limit - Number of reels per page (default: 10)
 * @param cursor - Last reel ID from previous page (for next page)
 * @returns API response with normalized reels and next cursor
 */
export async function getReels(
  limit: number = 10,
  cursor?: string
): Promise<ApiResponse<ReelsResponse>> {
  try {
    if (__DEV__) {
      console.log("[reelsService] Fetching reels:", { limit, cursor });
    }

    const params: any = { limit };
    if (cursor) {
      params.cursor = cursor;
    }

    const response = await apiClient.get<any>(REELS_ENDPOINT, { params });
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const raw = responseData.data;
      const reels = Array.isArray(raw.reels) ? raw.reels : [];

      // Determine if there are more pages
      const hasMore = reels.length >= limit;
      const nextCursor = hasMore && reels.length > 0 ? reels[reels.length - 1]._id : undefined;

      const normalizedReels = reels.map((r: BackendReel, idx: number) =>
        normalizeReel(r, idx)
      );

      if (__DEV__) {
        console.log(`[reelsService] Loaded ${normalizedReels.length} reels`, {
          hasMore,
          nextCursor: nextCursor ? `${nextCursor.slice(0, 8)}...` : undefined,
        });
      }

      return {
        success: true,
        data: {
          reels: normalizedReels,
          nextCursor,
          hasMore,
          page: 1,
          limit,
          total: raw.total,
        },
        message: "Reels loaded successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to load reels",
      data: {
        reels: [],
        hasMore: false,
      },
    };
  } catch (error: any) {
    console.error("[reelsService] Error fetching reels:", error.message || error);

    return {
      success: false,
      message: error.message || "Failed to fetch reels",
      data: {
        reels: [],
        hasMore: false,
      },
    };
  }
}

/**
 * Like or unlike a reel
 * Uses the unified action endpoint
 * 
 * @param reelId - Backend reel ID
 * @returns Updated stats from backend
 */
export async function toggleLikeReel(reelId: string): Promise<ApiResponse<any>> {
  try {
    if (__DEV__) {
      console.log("[reelsService] Toggling like for reel:", reelId);
    }

    const response = await apiClient.post<any>(
      `reels/${reelId}/action`,
      { action_type: "like" }
    );

    const responseData = response.data as any;

    if (responseData.code === 1) {
      if (__DEV__) {
        console.log("[reelsService] Like action successful:", responseData.data);
      }
      return {
        success: true,
        data: responseData.data,
        message: "Like action completed",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to like reel",
    };
  } catch (error: any) {
    console.error("[reelsService] Error toggling like:", error.message || error);
    return {
      success: false,
      message: error.message || "Failed to like reel",
    };
  }
}

/**
 * Save or unsave a reel
 * Uses the unified action endpoint
 * 
 * @param reelId - Backend reel ID
 * @returns Updated stats from backend
 */
export async function toggleSaveReel(reelId: string): Promise<ApiResponse<any>> {
  try {
    if (__DEV__) {
      console.log("[reelsService] Toggling save for reel:", reelId);
    }

    const response = await apiClient.post<any>(
      `reels/${reelId}/action`,
      { action_type: "save" }
    );

    const responseData = response.data as any;

    if (responseData.code === 1) {
      if (__DEV__) {
        console.log("[reelsService] Save action successful:", responseData.data);
      }
      return {
        success: true,
        data: responseData.data,
        message: "Save action completed",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to save reel",
    };
  } catch (error: any) {
    console.error("[reelsService] Error toggling save:", error.message || error);
    return {
      success: false,
      message: error.message || "Failed to save reel",
    };
  }
}

export const reelsService = {
  getReels,
  toggleLikeReel,
  toggleSaveReel,
};

export default reelsService;
