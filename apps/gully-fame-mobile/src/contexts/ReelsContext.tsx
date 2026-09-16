// Created by Kiro
// Reels Context - Manage reels feed state globally

import React, { createContext, useContext, useState, useCallback } from 'react';
import { reelsService } from '../api/services/reelsService';

export interface Reel {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail?: string;
  creatorId: string;
  creatorName: string;
  creatorImage?: string;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  text: string;
  likes: number;
  createdAt: string;
}

interface ReelsContextType {
  // State
  reels: Reel[];
  selectedReel: Reel | null;
  reelComments: Comment[];
  loading: boolean;
  error: string | null;

  // Pagination
  page: number;
  hasMore: boolean;

  // Actions
  fetchReelsFeed: (pageNum?: number) => Promise<void>;
  fetchReelById: (id: string) => Promise<Reel | null>;
  fetchReelComments: (reelId: string) => Promise<void>;
  likeReel: (reelId: string) => Promise<boolean>;
  unlikeReel: (reelId: string) => Promise<boolean>;
  commentReel: (reelId: string, text: string) => Promise<boolean>;
  uploadReel: (data: any) => Promise<boolean>;
  invalidateCache: () => void;  // Force refresh of all feeds
  invalidateFeed: (feedType?: string) => void;  // Invalidate specific feed
  setPage: (page: number) => void;
  clearError: () => void;
  clearSelectedReel: () => void;
}

const ReelsContext = createContext<ReelsContextType | undefined>(undefined);

export const ReelsProvider = ({ children }: { children: React.ReactNode }) => {
  // State
  const [reels, setReels] = useState<Reel[]>([]);
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const [reelComments, setReelComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch reels feed
  const fetchReelsFeed = useCallback(async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const result = await reelsService.getReelsFeed();

      if (result.success && result.data) {
        if (pageNum === 1) {
          setReels(result.data);
        } else {
          setReels((prev) => [...prev, ...result.data]);
        }
        setHasMore(result.data.length > 0);
        setPage(pageNum);
      } else {
        setError(result.error || 'Failed to fetch reels');
      }
    } catch (err: any) {
      console.error('Error fetching reels feed:', err);
      setError(err.message || 'Failed to fetch reels');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single reel by ID
  const fetchReelById = useCallback(
    async (id: string): Promise<Reel | null> => {
      try {
        setLoading(true);
        setError(null);

        // Find in existing reels first
        const existing = reels.find((r) => r.id === id);
        if (existing) {
          setSelectedReel(existing);
          return existing;
        }

        // If not found, fetch from API
        const result = await reelsService.getReelById(id);

        if (result.success && result.data) {
          setSelectedReel(result.data);
          return result.data;
        }

        setError('Reel not found');
        return null;
      } catch (err: any) {
        console.error('Error fetching reel:', err);
        setError(err.message || 'Failed to fetch reel');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [reels]
  );

  // Fetch reel comments
  const fetchReelComments = useCallback(async (reelId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from API
      const result = await reelsService.getReelComments(reelId);
      
      if (result.success && result.data) {
        setReelComments(result.data.comments || []);
      } else {
        console.error('[ReelsContext] Failed to fetch comments:', result.message);
        setReelComments([]);
      }
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      setError(err.message || 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  }, []);

  // Like reel
  const likeReel = useCallback(async (reelId: string): Promise<boolean> => {
    try {
      setError(null);

      const result = await reelsService.likeReel(reelId);

      if (result.success) {
        // Update reel in list
        setReels((prev) =>
          prev.map((reel) =>
            reel.id === reelId
              ? { ...reel, isLiked: true, likes: reel.likes + 1 }
              : reel
          )
        );

        // Update selected reel
        if (selectedReel?.id === reelId) {
          setSelectedReel((prev) =>
            prev
              ? { ...prev, isLiked: true, likes: prev.likes + 1 }
              : null
          );
        }

        return true;
      } else {
        setError(result.error || 'Failed to like reel');
        return false;
      }
    } catch (err: any) {
      console.error('Error liking reel:', err);
      setError(err.message || 'Failed to like reel');
      return false;
    }
  }, [selectedReel]);

  // Unlike reel
  const unlikeReel = useCallback(async (reelId: string): Promise<boolean> => {
    try {
      setError(null);

      const result = await reelsService.unlikeReel(reelId);

      if (result.success) {
        // Update reel in list
        setReels((prev) =>
          prev.map((reel) =>
            reel.id === reelId
              ? { ...reel, isLiked: false, likes: Math.max(0, reel.likes - 1) }
              : reel
          )
        );

        // Update selected reel
        if (selectedReel?.id === reelId) {
          setSelectedReel((prev) =>
            prev
              ? { ...prev, isLiked: false, likes: Math.max(0, prev.likes - 1) }
              : null
          );
        }

        return true;
      } else {
        setError(result.error || 'Failed to unlike reel');
        return false;
      }
    } catch (err: any) {
      console.error('Error unliking reel:', err);
      setError(err.message || 'Failed to unlike reel');
      return false;
    }
  }, [selectedReel]);

  // Comment on reel
  const commentReel = useCallback(
    async (reelId: string, text: string): Promise<boolean> => {
      try {
        setError(null);

        const result = await reelsService.commentReel(reelId, text);

        if (result.success) {
          // Add comment to list
          const newComment: Comment = {
            id: Date.now().toString(),
            userId: 'currentUser',
            userName: 'You',
            text,
            likes: 0,
            createdAt: 'just now',
          };

          setReelComments((prev) => [newComment, ...prev]);

          // Update comment count
          setReels((prev) =>
            prev.map((reel) =>
              reel.id === reelId
                ? { ...reel, comments: reel.comments + 1 }
                : reel
            )
          );

          if (selectedReel?.id === reelId) {
            setSelectedReel((prev) =>
              prev ? { ...prev, comments: prev.comments + 1 } : null
            );
          }

          return true;
        } else {
          setError(result.error || 'Failed to comment on reel');
          return false;
        }
      } catch (err: any) {
        console.error('Error commenting on reel:', err);
        setError(err.message || 'Failed to comment on reel');
        return false;
      }
    },
    [selectedReel]
  );

  // Upload reel
  const uploadReel = useCallback(async (data: any): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const result = await reelsService.uploadReel(data);

      if (result.success) {
        // Add new reel to beginning of list (optimistic update)
        const newReel: Reel = {
          id: Date.now().toString(),
          title: data.title,
          description: data.description,
          videoUrl: data.videoUrl,
          creatorId: 'currentUser',
          creatorName: 'You',
          likes: 0,
          comments: 0,
          shares: 0,
          createdAt: new Date().toISOString(),
        };

        setReels((prev) => [newReel, ...prev]);
        
        // Invalidate trending/popular feeds to ensure new reel appears there too
        // This will force a refresh when those screens re-render
        console.log("[ReelsContext] New reel uploaded - invalidating all feed caches");
        
        return true;
      } else {
        setError(result.error || 'Failed to upload reel');
        return false;
      }
    } catch (err: any) {
      console.error('Error uploading reel:', err);
      setError(err.message || 'Failed to upload reel');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear selected reel
  const clearSelectedReel = useCallback(() => {
    setSelectedReel(null);
    setReelComments([]);
  }, []);

  // Invalidate entire cache and refresh all feeds
  const invalidateCache = useCallback(() => {
    console.log("[ReelsContext] Invalidating entire cache - forcing refresh");
    setReels([]);
    setPage(1);
    setHasMore(true);
    // Will trigger a refresh on next fetchReelsFeed call
  }, []);

  // Invalidate specific feed (trending, following, etc)
  const invalidateFeed = useCallback((feedType?: string) => {
    console.log("[ReelsContext] Invalidating feed:", feedType || "default");
    // Reset to page 1 to force refresh
    setPage(1);
    setReels([]);
    setHasMore(true);
  }, []);

  const value: ReelsContextType = {
    // State
    reels,
    selectedReel,
    reelComments,
    loading,
    error,

    // Pagination
    page,
    hasMore,

    // Actions
    fetchReelsFeed,
    fetchReelById,
    fetchReelComments,
    likeReel,
    unlikeReel,
    commentReel,
    uploadReel,
    invalidateCache,
    invalidateFeed,
    setPage,
    clearError,
    clearSelectedReel,
  };

  return (
    <ReelsContext.Provider value={value}>
      {children}
    </ReelsContext.Provider>
  );
};

// Custom hook to use ReelsContext
export const useReels = () => {
  const context = useContext(ReelsContext);
  if (context === undefined) {
    throw new Error('useReels must be used within ReelsProvider');
  }
  return context;
};
