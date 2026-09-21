// Created by Kiro - Comment Service
// Handles comment operations: add, delete, get, like comments on reels

import apiClient from "../axios";
import { ApiResponse } from "../types";
import API_ENDPOINTS, { replaceParams } from "../endpoints";

export interface Comment {
  _id: string;
  id?: string;
  reelId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  likeCount?: number;
  isLiked?: boolean;
  replies?: Comment[];
  createdAt: string;
  updatedAt?: string;
}

export interface CommentsResponse {
  items: Comment[];
  total: number;
  page?: number;
  limit?: number;
}

export interface AddCommentRequest {
  text: string;
  parentCommentId?: string; // For nested replies
}

export interface AddCommentResponse {
  _id: string;
  reelId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  likeCount: number;
  createdAt: string;
  level?: number;
}

//   Add comment to reel
export async function addComment(
  reelId: string,
  commentData: AddCommentRequest
): Promise<ApiResponse<AddCommentResponse>> {
  try {
    console.log("[commentService] Adding comment to reel:", { reelId, commentData });

    const endpoint = replaceParams(API_ENDPOINTS.REELS.ADD_COMMENT, { id: reelId });
    const response = await apiClient.post<any>(endpoint, commentData);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const comment: AddCommentResponse = {
        _id: responseData.data._id || responseData.data.id,
        reelId: responseData.data.reelId || reelId,
        userId: responseData.data.userId,
        userName: responseData.data.userName,
        userAvatar: responseData.data.userAvatar,
        text: responseData.data.text,
        likeCount: responseData.data.likeCount || 0,
        createdAt: responseData.data.createdAt,
      };

      console.log("[commentService] Comment added successfully");

      return {
        success: true,
        data: comment,
        message: responseData.message || "Comment added successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to add comment",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[commentService] Add comment error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Network error occurred",
      error: error.message,
      data: undefined,
    };
  }
}

//   Get comments for a reel
export async function getComments(
  reelId: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<CommentsResponse>> {
  try {
    console.log("[commentService] Getting comments for reel:", { reelId, params });

    const endpoint = replaceParams(API_ENDPOINTS.REELS.GET_COMMENTS, { id: reelId });
    const response = await apiClient.get<any>(endpoint, { params });
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      let comments: Comment[] = [];

      if (Array.isArray(responseData.data)) {
        comments = responseData.data;
      } else if (Array.isArray(responseData.data.items)) {
        comments = responseData.data.items;
      } else if (Array.isArray(responseData.data.comments)) {
        comments = responseData.data.comments;
      }

      const commentsData: CommentsResponse = {
        items: comments,
        total: responseData.data.total || comments.length,
        page: params?.page || 1,
        limit: params?.limit || 10,
      };

      console.log("[commentService] Comments retrieved:", commentsData.total);

      return {
        success: true,
        data: commentsData,
        message: responseData.message || "Comments retrieved successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to get comments",
      error: "API returned unsuccessful response",
      data: { items: [], total: 0 },
    };
  } catch (error: any) {
    console.error("[commentService] Get comments error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Network error occurred",
      error: error.message,
      data: { items: [], total: 0 },
    };
  }
}

//   Delete comment
export async function deleteComment(commentId: string): Promise<ApiResponse<boolean>> {
  try {
    console.log("[commentService] Deleting comment:", commentId);

    const endpoint = replaceParams(API_ENDPOINTS.COMMENT.DELETE, { id: commentId });
    const response = await apiClient.delete<any>(endpoint);
    const responseData = response.data as any;

    if (responseData.code === 1) {
      console.log("[commentService] Comment deleted successfully");

      return {
        success: true,
        data: true,
        message: responseData.message || "Comment deleted successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to delete comment",
      error: "API returned unsuccessful response",
      data: false,
    };
  } catch (error: any) {
    console.error("[commentService] Delete comment error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Network error occurred",
      error: error.message,
      data: false,
    };
  }
}

//  Like comment
export async function likeComment(commentId: string): Promise<ApiResponse<number>> {
  try {
    console.log("[commentService] Liking comment:", commentId);

    const endpoint = replaceParams(API_ENDPOINTS.COMMENT.CREATE, { id: commentId });
    const response = await apiClient.post<any>(`${endpoint}/like`, {});
    const responseData = response.data as any;

    if (responseData.code === 1) {
      const likeCount = responseData.data?.likeCount || 0;

      console.log("[commentService] Comment liked successfully");

      return {
        success: true,
        data: likeCount,
        message: responseData.message || "Comment liked successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to like comment",
      error: "API returned unsuccessful response",
      data: 0,
    };
  } catch (error: any) {
    console.error("[commentService] Like comment error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Network error occurred",
      error: error.message,
      data: 0,
    };
  }
}

//   Unlike comment
export async function unlikeComment(commentId: string): Promise<ApiResponse<number>> {
  try {
    console.log("[commentService] Unliking comment:", commentId);

    const endpoint = replaceParams(API_ENDPOINTS.COMMENT.CREATE, { id: commentId });
    const response = await apiClient.post<any>(`${endpoint}/unlike`, {});
    const responseData = response.data as any;

    if (responseData.code === 1) {
      const likeCount = responseData.data?.likeCount || 0;

      console.log("[commentService] Comment unliked successfully");

      return {
        success: true,
        data: likeCount,
        message: responseData.message || "Comment unliked successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to unlike comment",
      error: "API returned unsuccessful response",
      data: 0,
    };
  } catch (error: any) {
    console.error("[commentService] Unlike comment error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Network error occurred",
      error: error.message,
      data: 0,
    };
  }
}

// Reply to comment
export async function replyToComment(
  commentId: string,
  replyText: string
): Promise<ApiResponse<Comment>> {
  try {
    console.log("[commentService] Replying to comment:", { commentId, replyText });

    const endpoint = replaceParams(API_ENDPOINTS.COMMENT.CREATE, { id: commentId });
    const response = await apiClient.post<any>(`${endpoint}/reply`, {
      text: replyText,
    });
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const reply: Comment = {
        _id: responseData.data._id || responseData.data.id,
        reelId: responseData.data.reelId,
        userId: responseData.data.userId,
        userName: responseData.data.userName,
        userAvatar: responseData.data.userAvatar,
        text: responseData.data.text,
        likeCount: responseData.data.likeCount || 0,
        createdAt: responseData.data.createdAt,
      };

      console.log("[commentService] Reply added successfully");

      return {
        success: true,
        data: reply,
        message: responseData.message || "Reply added successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to add reply",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[commentService] Reply to comment error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Network error occurred",
      error: error.message,
      data: undefined,
    };
  }
}

//  Get comment count for reel
export async function getCommentCount(reelId: string): Promise<ApiResponse<number>> {
  try {
    console.log("[commentService] Getting comment count for reel:", reelId);

    const endpoint = replaceParams(API_ENDPOINTS.REELS.GET_COMMENTS, { id: reelId });
    const response = await apiClient.get<any>(`${endpoint}-count`);
    const responseData = response.data as any;

    if (responseData.code === 1) {
      const count = responseData.data?.count || 0;

      console.log("[commentService] Comment count retrieved:", count);

      return {
        success: true,
        data: count,
        message: "Comment count retrieved successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to get comment count",
      error: "API returned unsuccessful response",
      data: 0,
    };
  } catch (error: any) {
    console.error("[commentService] Get comment count error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Network error occurred",
      error: error.message,
      data: 0,
    };
  }
}

export const commentService = {
  addComment,
  getComments,
  deleteComment,
  likeComment,
  unlikeComment,
  replyToComment,
  getCommentCount,
};
