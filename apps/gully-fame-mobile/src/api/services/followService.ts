// Follow Service
// Handles follow/unfollow, followers, and following list functionality

import apiClient from "../axios";
import { ApiResponse } from "../types";
import API_ENDPOINTS, { replaceParams } from "../endpoints";

export interface User {
  _id: string;
  id?: string;
  name: string;
  username?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  isFollowing?: boolean;
  followerCount?: number;
  followingCount?: number;
  createdAt?: string;
}

export interface FollowResponse {
  success: boolean;
  isFollowing: boolean;
  followerCount: number;
}

export interface FollowersResponse {
  items: User[];
  total: number;
  page?: number;
  limit?: number;
}

//  Follow a user
export async function followUser(userId: string): Promise<ApiResponse<FollowResponse>> {
  try {
    console.log("[followService] Following user:", userId);

    const endpoint = replaceParams(API_ENDPOINTS.FOLLOW.FOLLOW_USER, { userId });
    const response = await apiClient.post<any>(endpoint, {});
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const followData: FollowResponse = {
        success: true,
        isFollowing: true,
        followerCount: responseData.data.followerCount || 0,
      };

      console.log("[followService] User followed successfully");

      return {
        success: true,
        data: followData,
        message: responseData.message || "User followed successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to follow user",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[followService] Follow user error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Network error occurred",
      error: error.message,
      data: undefined,
    };
  }
}

// Unfollow a user
export async function unfollowUser(userId: string): Promise<ApiResponse<FollowResponse>> {
  try {
    console.log("[followService] Unfollowing user:", userId);

    const endpoint = replaceParams(API_ENDPOINTS.FOLLOW.UNFOLLOW_USER, { userId });
    const response = await apiClient.post<any>(endpoint, {});
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const followData: FollowResponse = {
        success: true,
        isFollowing: false,
        followerCount: responseData.data.followerCount || 0,
      };

      console.log("[followService] User unfollowed successfully");

      return {
        success: true,
        data: followData,
        message: responseData.message || "User unfollowed successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to unfollow user",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[followService] Unfollow user error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Network error occurred",
      error: error.message,
      data: undefined,
    };
  }
}

//  Get followers list
export async function getFollowers(
  userId?: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<FollowersResponse>> {
  try {
    console.log("[followService] Getting followers:", { userId, params });

    // Try the dedicated followers endpoint first
    try {
      const response = await apiClient.get<any>(`user/followers`, { params });
      const responseData = response.data as any;

      if (responseData.code === 1 && responseData.data) {
        let followers: User[] = [];

        if (Array.isArray(responseData.data)) {
          followers = responseData.data;
        } else if (Array.isArray(responseData.data.items)) {
          followers = responseData.data.items;
        } else if (Array.isArray(responseData.data.followers)) {
          followers = responseData.data.followers;
        }

        const followersData: FollowersResponse = {
          items: followers,
          total: responseData.data.total || followers.length,
          page: params?.page || 1,
          limit: params?.limit || 10,
        };

        console.log("[followService] Followers retrieved:", followersData.total);

        return {
          success: true,
          data: followersData,
          message: responseData.message || "Followers retrieved successfully",
        };
      }
    } catch (endpointError) {
      console.log("[followService] Followers endpoint not available, returning empty list");
    }

    // If endpoint doesn't exist, return empty list (graceful fallback)
    return {
      success: true,
      data: { items: [], total: 0 },
      message: "Followers endpoint not available",
    };
  } catch (error: any) {
    console.error("[followService] Get followers error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Network error occurred",
      error: error.message,
      data: { items: [], total: 0 },
    };
  }
}

// ✅ CREATED BY KIRO - Get following list
export async function getFollowing(
  userId?: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<FollowersResponse>> {
  try {
    console.log("[followService] Getting following:", { userId, params });

    // Try the dedicated following endpoint first
    try {
      const response = await apiClient.get<any>(`user/following`, { params });
      const responseData = response.data as any;

      if (responseData.code === 1 && responseData.data) {
        let following: User[] = [];

        if (Array.isArray(responseData.data)) {
          following = responseData.data;
        } else if (Array.isArray(responseData.data.items)) {
          following = responseData.data.items;
        } else if (Array.isArray(responseData.data.following)) {
          following = responseData.data.following;
        }

        const followingData: FollowersResponse = {
          items: following,
          total: responseData.data.total || following.length,
          page: params?.page || 1,
          limit: params?.limit || 10,
        };

        console.log("[followService] Following retrieved:", followingData.total);

        return {
          success: true,
          data: followingData,
          message: responseData.message || "Following retrieved successfully",
        };
      }
    } catch (endpointError) {
      console.log("[followService] Following endpoint not available, returning empty list");
    }

    // If endpoint doesn't exist, return empty list (graceful fallback)
    return {
      success: true,
      data: { items: [], total: 0 },
      message: "Following endpoint not available",
    };
  } catch (error: any) {
    console.error("[followService] Get following error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Network error occurred",
      error: error.message,
      data: { items: [], total: 0 },
    };
  }
}

// ✅ CREATED BY KIRO - Check if following a user
export async function isFollowing(userId: string): Promise<ApiResponse<boolean>> {
  try {
    console.log("[followService] Checking if following user:", userId);

    const response = await apiClient.get<any>(`user/${userId}/is-following`);
    const responseData = response.data as any;

    if (responseData.code === 1) {
      const isFollowingUser = responseData.data?.isFollowing || false;

      console.log("[followService] Is following:", isFollowingUser);

      return {
        success: true,
        data: isFollowingUser,
        message: "Follow status retrieved successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to check follow status",
      error: "API returned unsuccessful response",
      data: false,
    };
  } catch (error: any) {
    console.error("[followService] Check following error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Network error occurred",
      error: error.message,
      data: false,
    };
  }
}

// ✅ CREATED BY KIRO - Get follow statistics
export async function getFollowStats(userId: string): Promise<ApiResponse<any>> {
  try {
    console.log("[followService] Getting follow stats:", userId);

    const response = await apiClient.get<any>(`user/${userId}/follow-stats`);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const stats = {
        followerCount: responseData.data.followerCount || 0,
        followingCount: responseData.data.followingCount || 0,
        isFollowing: responseData.data.isFollowing || false,
      };

      console.log("[followService] Follow stats retrieved:", stats);

      return {
        success: true,
        data: stats,
        message: responseData.message || "Follow stats retrieved successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to get follow stats",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[followService] Get follow stats error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Network error occurred",
      error: error.message,
      data: undefined,
    };
  }
}

export const followService = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  isFollowing,
  getFollowStats,
};
