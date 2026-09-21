import apiClient from "../axios";
import { ApiResponse } from "../types";

export interface TopPerformer {
  id?: string;
  _id?: string;
  userId?: string;
  name: string;
  rank: number;
  points: number;
  profileImage?: string;
  profilePictureUrl?: string;
  badge?: string;
  followers?: number;
  isVerified?: boolean;
}

export interface LeaderboardTopResponse {
  items?: TopPerformer[];
  data?: TopPerformer[];
  topPerformers?: TopPerformer[];
  leaderboard?: TopPerformer[];
  users?: TopPerformer[];
  results?: TopPerformer[];
  [key: string]: any;
}

export const leaderboardService = {
  /**
   * Get top performers/leaderboard
   * @param params - Optional parameters (limit, page, etc.)
   * @returns Top performers list
   */
  getTopPerformers: async (params?: {
    limit?: number;
    page?: number;
    type?: string;
  }) => {
    try {
      console.log("[leaderboardService] GET /leaderboard/top", { params });

      const response = await apiClient.get<ApiResponse<LeaderboardTopResponse>>(
        "/leaderboard/top",
        { 
          params: {
            limit: params?.limit || 10,
            page: params?.page || 1,
            ...(params?.type && { type: params.type }),
          },
          skipAuth: false,
        }
      );

      const responseAny = response.data as any;
      const responseData = responseAny.data || responseAny;

      // Extract performers from various response formats
      let performers: TopPerformer[] = [];

      if (Array.isArray(responseData)) {
        performers = responseData;
      } else if (responseData?.items && Array.isArray(responseData.items)) {
        performers = responseData.items;
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        performers = responseData.data;
      } else if (responseData?.topPerformers && Array.isArray(responseData.topPerformers)) {
        performers = responseData.topPerformers;
      } else if (responseData?.leaderboard && Array.isArray(responseData.leaderboard)) {
        performers = responseData.leaderboard;
      } else if (responseData?.users && Array.isArray(responseData.users)) {
        performers = responseData.users;
      } else if (responseData?.results && Array.isArray(responseData.results)) {
        performers = responseData.results;
      }

      // Normalize performer data
      const normalizedPerformers = performers.map((p, index) => ({
        id: p._id || p.id || `perf-${index}`,
        userId: p.userId,
        name: p.name || "",
        rank: p.rank || (index + 1),
        points: p.points || 0,
        profileImage: p.profileImage || p.profilePictureUrl,
        badge: p.badge || getBadgeForRank(p.rank || (index + 1)),
        followers: p.followers,
        isVerified: p.isVerified,
      }));

      return {
        success: true,
        data: normalizedPerformers,
        message: response.data.message || "Top performers fetched successfully",
      };
    } catch (error: any) {
      console.error("[leaderboardService] getTopPerformers error:", error.message);
      return {
        success: false,
        error: error.message || "Failed to fetch top performers",
        status: error.status,
        data: [],
      };
    }
  },

  /**
   * Get full leaderboard with pagination
   */
  getLeaderboard: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    try {
      console.log("[leaderboardService] GET /leaderboard", { params });

      const response = await apiClient.get<ApiResponse<LeaderboardTopResponse>>(
        "/leaderboard",
        {
          params: {
            page: params?.page || 1,
            limit: params?.limit || 20,
            ...(params?.search && { search: params.search }),
          },
          skipAuth: false,
        }
      );

      const responseAny = response.data as any;
      const responseData = responseAny.data || responseAny;

      let performers: TopPerformer[] = [];
      if (Array.isArray(responseData)) {
        performers = responseData;
      } else if (responseData?.items && Array.isArray(responseData.items)) {
        performers = responseData.items;
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        performers = responseData.data;
      }

      return {
        success: true,
        data: performers,
        total: responseData?.total || performers.length,
        message: response.data.message || "Leaderboard fetched successfully",
      };
    } catch (error: any) {
      console.error("[leaderboardService] getLeaderboard error:", error.message);
      return {
        success: false,
        error: error.message || "Failed to fetch leaderboard",
        status: error.status,
        data: [],
      };
    }
  },

  /**
   * Get user's rank in leaderboard
   */
  getUserRank: async (userId: string) => {
    try {
      console.log("[leaderboardService] GET /leaderboard/user/:id", { userId });

      const response = await apiClient.get<ApiResponse<TopPerformer>>(
        `/leaderboard/user/${userId}`,
        { skipAuth: false }
      );

      const responseAny = response.data as any;
      const userData = responseAny.data || responseAny;

      return {
        success: true,
        data: userData,
        message: response.data.message || "User rank fetched successfully",
      };
    } catch (error: any) {
      console.error("[leaderboardService] getUserRank error:", error.message);
      return {
        success: false,
        error: error.message || "Failed to fetch user rank",
        status: error.status,
        data: null,
      };
    }
  },
};

/**
 * Helper: Get badge emoji for rank
 */
function getBadgeForRank(rank: number): string {
  switch (rank) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return "⭐";
  }
}
