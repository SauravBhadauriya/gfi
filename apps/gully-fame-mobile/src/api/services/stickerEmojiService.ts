
import apiClient from "../axios";
import { ApiResponse } from "../types";

export type StickerType = 
  | "emoji" 
  | "sticker" 
  | "text" 
  | "shape" 
  | "animation"
  | "widget";

export interface Sticker {
  id: string;
  name: string;
  type: StickerType;
  url: string;
  thumbnail?: string;
  category?: string;
  tags?: string[];
  animated?: boolean;
  width?: number;
  height?: number;
  usageCount?: number;
  isPopular?: boolean;
  isNew?: boolean;
  createdAt?: string;
}

export interface StickerCategory {
  id: string;
  name: string;
  icon?: string;
  thumbnail?: string;
  stickers: Sticker[];
  count?: number;
}

export interface StickerListResponse {
  page: number;
  limit: number;
  total: number;
  categories?: StickerCategory[];
  stickers: Sticker[];
}

export interface EmojiGroup {
  name: string;
  emojis: string[];
}

/**
 * Fetch all available stickers
 */
export async function listStickers(
  category?: string,
  page = 1,
  limit = 30
): Promise<ApiResponse<StickerListResponse>> {
  try {
    console.log("[stickerEmojiService] Fetching stickers:", { category, page, limit });

    const params: Record<string, any> = { page, limit };
    if (category) params.category = category;

    const response = await apiClient.get<any>("public/stickers", { params });
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const raw = responseData.data;

      const rawStickers: any[] = Array.isArray(raw)
        ? raw
        : raw?.stickers ?? raw?.data ?? [];

      const stickers: Sticker[] = rawStickers.map((s: any) => ({
        id: s._id ?? s.id ?? "",
        name: s.name ?? s.title ?? "Sticker",
        type: s.type ?? "sticker",
        url: s.url ?? s.imageUrl ?? s.stickerUrl ?? "",
        thumbnail: s.thumbnail ?? s.thumbnailUrl,
        category: s.category,
        tags: s.tags ?? [],
        animated: s.animated ?? false,
        width: s.width,
        height: s.height,
        usageCount: s.usageCount ?? 0,
        isPopular: s.isPopular ?? false,
        isNew: s.isNew ?? false,
        createdAt: s.createdAt,
      }));

      return {
        success: true,
        data: {
          page: raw?.page ?? page,
          limit: raw?.limit ?? limit,
          total: raw?.total ?? stickers.length,
          stickers,
          categories: raw?.categories,
        },
        message: responseData.message ?? "Stickers fetched successfully",
      };
    }

    return {
      success: false,
      message: responseData.message ?? "Failed to fetch stickers",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[stickerEmojiService] listStickers error:", error.message);
    
    // Fallback stickers for offline/Android support
    const fallbackStickers: Sticker[] = [
      { id: "heart-1", name: "Red Heart", type: "emoji", url: "❤️", category: "love" },
      { id: "heart-2", name: "Fire", type: "emoji", url: "🔥", category: "love" },
      { id: "star-1", name: "Star", type: "emoji", url: "⭐", category: "popular" },
      { id: "party-1", name: "Party", type: "emoji", url: "🎉", category: "party" },
      { id: "party-2", name: "Confetti", type: "emoji", url: "🎊", category: "party" },
      { id: "music-1", name: "Music", type: "emoji", url: "🎵", category: "music" },
      { id: "music-2", name: "Musical Note", type: "emoji", url: "🎶", category: "music" },
      { id: "cool-1", name: "Cool Face", type: "emoji", url: "😎", category: "faces" },
      { id: "laugh-1", name: "Laugh", type: "emoji", url: "😂", category: "faces" },
      { id: "love-1", name: "Love Eyes", type: "emoji", url: "😍", category: "faces" },
    ];

    return {
      success: true,
      data: {
        page: 1,
        limit,
        total: fallbackStickers.length,
        stickers: fallbackStickers,
      },
      message: "Using fallback stickers (offline mode)",
    };
  }
}

/**
 * Get sticker by ID
 */
export async function getStickerById(stickerId: string): Promise<ApiResponse<Sticker>> {
  try {
    console.log("[stickerEmojiService] Getting sticker:", stickerId);

    const response = await apiClient.get<any>(`public/stickers/${stickerId}`);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const s = responseData.data;
      const sticker: Sticker = {
        id: s._id ?? s.id ?? "",
        name: s.name ?? s.title ?? "Sticker",
        type: s.type ?? "sticker",
        url: s.url ?? s.imageUrl ?? "",
        thumbnail: s.thumbnail,
        category: s.category,
        tags: s.tags ?? [],
        animated: s.animated ?? false,
        width: s.width,
        height: s.height,
        usageCount: s.usageCount,
        isPopular: s.isPopular,
        isNew: s.isNew,
        createdAt: s.createdAt,
      };

      return {
        success: true,
        data: sticker,
        message: "Sticker retrieved successfully",
      };
    }

    return {
      success: false,
      message: responseData.message ?? "Failed to get sticker",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[stickerEmojiService] getStickerById error:", error.message);
    return {
      success: false,
      message: error.message ?? "Network error",
      error: error.message,
      data: undefined,
    };
  }
}

/**
 * Search stickers
 */
export async function searchStickers(query: string, limit = 30): Promise<ApiResponse<Sticker[]>> {
  try {
    console.log("[stickerEmojiService] Searching stickers:", query);

    const response = await apiClient.get<any>("public/stickers", {
      params: { search: query, limit },
    });
    const responseData = response.data as any;

    if (responseData.code === 1) {
      const raw = responseData.data;
      const rawStickers: any[] = Array.isArray(raw)
        ? raw
        : raw?.stickers ?? raw?.data ?? [];

      const stickers = rawStickers.map((s: any) => ({
        id: s._id ?? s.id ?? "",
        name: s.name ?? "Sticker",
        type: s.type ?? "sticker",
        url: s.url ?? s.imageUrl ?? "",
        thumbnail: s.thumbnail,
        category: s.category,
        tags: s.tags ?? [],
        animated: s.animated ?? false,
        width: s.width,
        height: s.height,
      }));

      return {
        success: true,
        data: stickers,
        message: "Search completed",
      };
    }

    return {
      success: false,
      message: "Search failed",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[stickerEmojiService] searchStickers error:", error.message);
    return {
      success: false,
      message: error.message ?? "Network error",
      data: undefined,
    };
  }
}

/**
 * Get trending/popular stickers
 */
export async function getTrendingStickers(limit = 20): Promise<ApiResponse<Sticker[]>> {
  try {
    console.log("[stickerEmojiService] Getting trending stickers");

    const response = await apiClient.get<any>("public/stickers", {
      params: { sort: "trending", limit },
    });
    const responseData = response.data as any;

    if (responseData.code === 1) {
      const raw = responseData.data;
      const rawStickers: any[] = Array.isArray(raw)
        ? raw
        : raw?.stickers ?? raw?.data ?? [];

      const stickers = rawStickers.map((s: any) => ({
        id: s._id ?? s.id ?? "",
        name: s.name ?? "Sticker",
        type: s.type ?? "sticker",
        url: s.url ?? s.imageUrl ?? "",
        thumbnail: s.thumbnail,
        category: s.category,
        tags: s.tags ?? [],
        animated: s.animated ?? false,
      }));

      return {
        success: true,
        data: stickers,
        message: "Trending stickers fetched",
      };
    }

    return {
      success: false,
      message: "Failed to fetch trending stickers",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[stickerEmojiService] getTrendingStickers error:", error.message);
    return {
      success: false,
      message: error.message ?? "Network error",
      data: undefined,
    };
  }
}

/**
 * Get emoji library with groups
 */
export async function getEmojis(): Promise<ApiResponse<EmojiGroup[]>> {
  try {
    console.log("[stickerEmojiService] Fetching emojis");

    // For emojis, we can use a standard emoji library or backend
    const response = await apiClient.get<any>("public/emojis");
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const emojiGroups: EmojiGroup[] = responseData.data.groups ?? [
        {
          name: "Smileys",
          emojis: ["😀", "😂", "😍", "🥰", "😘", "😎", "🤩", "😜"],
        },
        {
          name: "Gestures",
          emojis: ["👍", "👌", "🤔", "🙏", "💪", "👏", "✌️", "🤝"],
        },
        {
          name: "Symbols",
          emojis: ["❤️", "💔", "💯", "🔥", "✨", "⭐", "💫", "🎉"],
        },
        {
          name: "Objects",
          emojis: ["🎤", "🎸", "🎹", "🎬", "📱", "💻", "🎮", "📷"],
        },
      ];

      return {
        success: true,
        data: emojiGroups,
        message: "Emojis fetched successfully",
      };
    }

    return {
      success: false,
      message: responseData.message ?? "Failed to fetch emojis",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[stickerEmojiService] getEmojis error:", error.message);

    // Return fallback emoji groups if API fails
    const fallbackEmojis: EmojiGroup[] = [
      {
        name: "Smileys",
        emojis: ["😀", "😂", "😍", "🥰", "😘", "😎", "🤩", "😜"],
      },
      {
        name: "Gestures",
        emojis: ["👍", "👌", "🤔", "🙏", "💪", "👏", "✌️", "🤝"],
      },
      {
        name: "Symbols",
        emojis: ["❤️", "💔", "💯", "🔥", "✨", "⭐", "💫", "🎉"],
      },
      {
        name: "Objects",
        emojis: ["🎤", "🎸", "🎹", "🎬", "📱", "💻", "🎮", "📷"],
      },
    ];

    return {
      success: true,
      data: fallbackEmojis,
      message: "Using fallback emoji library",
    };
  }
}

export const stickerEmojiService = {
  listStickers,
  getStickerById,
  searchStickers,
  getTrendingStickers,
  getEmojis,
};

export default stickerEmojiService;
