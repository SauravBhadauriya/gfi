// Created by Kiro - Hook for fetching user reels
// Fetches user's reels/posts dynamically from API

import { useState, useEffect, useCallback } from "react";
import apiClient from "../api/axios";

export interface Reel {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  videoUrl?: string;
  thumbnail?: string;
  [key: string]: any;
}

export const useUserReels = (userId: string) => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user reels
  const fetchUserReels = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to call the user reels endpoint
      try {
        const response = await apiClient.get<any>(`user/reels`, {
          params: {
            page: 1,
            limit: 50,
          },
        });

        const responseData = response.data as any;

        console.log("[useUserReels] Response from API:", {
          status: response.status,
          hasData: !!responseData.data,
          dataType: typeof responseData.data,
        });

        if (responseData.code === 1 && responseData.data) {
          let reelsArray: Reel[] = [];

          // Handle different response formats
          if (Array.isArray(responseData.data)) {
            reelsArray = responseData.data;
          } else if (Array.isArray(responseData.data.items)) {
            reelsArray = responseData.data.items;
          } else if (Array.isArray(responseData.data.reels)) {
            reelsArray = responseData.data.reels;
          }

          console.log("[useUserReels] Reels fetched:", reelsArray.length);
          setReels(reelsArray);
        } else {
          console.log("[useUserReels] No reels data in response, using empty list");
          setReels([]);
        }
      } catch (apiError: any) {
        // If endpoint doesn't exist (404), gracefully return empty list
        if (apiError.response?.status === 404) {
          console.log("[useUserReels] User reels endpoint not available, returning empty list");
          setReels([]);
        } else {
          throw apiError;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch reels";
      console.log("[useUserReels] Fetch error (gracefully handled):", errorMessage);
      // Don't set error - just show empty reels list
      setReels([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load reels on mount
  useEffect(() => {
    fetchUserReels();
  }, [userId, fetchUserReels]);

  return {
    reels,
    loading,
    error,
    refetch: fetchUserReels,
  };
};
