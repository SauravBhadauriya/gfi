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

  // Fetch reels feed (uses getReels with cursor-based pagination)
  const fetchReelsFeed = useCallback(async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Get cursor for pagination if not first page
      let cursor: string | undefined;
      if (pageNum > 1 && reels.length > 0) {
        // Use the last reel's backend ID as cursor
        const lastReel = reels[reels.length - 1];
        cursor = (lastReel as any)._backendId;
      }

      const result = await reelsService.getReels(10, cursor);

      if (result.success && result.data?.reels) {
        if (pageNum === 1) {
          setReels(result.data.reels);
        } else {
          setReels((prev) => [...prev, ...result.data.reels]);
        }
        setHasMore(result.data.hasMore || false);
        setPage(pageNum);
      } else {
        setError(result.message || 'Failed to fetch reels');
      }
    } catch (err: any) {
      console.error('Error fetching reels feed:', err);
      setError(err.message || 'Failed to fetch reels');
    } finally {
      setLoading(false);
    }
  }, [reels]);

  // Fetch single reel by ID - note: getReelById not implemented in service
  // This implementation searches in existing reels or returns null
  const fetchReelById = useCallback(
    async (id: string): Promise<Reel | null> => {
      try {
        setError(null);

        // Find in existing reels first
        const existing = reels.find((r) => r.id === id);
        if (existing) {
          setSelectedReel(existing);
          return existing;
        }

        // Service doesn't have getReelById yet, return not found
        setError('Reel detail endpoint not yet implemented');
        return null;
      } catch (err: any) {
        console.error('Error fetching reel:', err);
        setError(err.message || 'Failed to fetch reel');
        return null;
      }
    },
    [reels]
  );

  // Fetch reel comments - note: getReelComments not implemented in reelsService
  // Comments are fetched from commentService in main screen
  const fetchReelComments = useCallback(async (reelId: string) => {
    try {
      setError(null);
      // Note: Comments are fetched directly from commentService in the main reel screen
      // This method is here for context completeness but not actively used
      setReelComments([]);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      setError(err.message || 'Failed to fetch comments');
    }
  }, []);

  // Like reel - uses toggleLikeReel which handles both like and unlike
  const likeReel = useCallback(async (reelId: string): Promise<boolean> => {
    try {
      setError(null);

      // toggleLikeReel handles the like action (backend toggles state)
      const result = await reelsService.toggleLikeReel(reelId);

      if (result.success) {
        // Update reel in list - toggle like state based on current state
        setReels((prev) =>
          prev.map((reel) => {
            if ((reel as any)._backendId === reelId || reel.id === reelId) {
              const isCurrentlyLiked = (reel as any).isLiked;
              return { 
                ...reel, 
                isLiked: !isCurrentlyLiked, 
                likes: isCurrentlyLiked ? Math.max(0, reel.likes - 1) : reel.likes + 1 
              };
            }
            return reel;
          })
        );

        // Update selected reel
        if (selectedReel && ((selectedReel as any)._backendId === reelId || selectedReel.id === reelId)) {
          const isCurrentlyLiked = (selectedReel as any).isLiked;
          setSelectedReel((prev) =>
            prev
              ? { 
                  ...prev, 
                  isLiked: !isCurrentlyLiked, 
                  likes: isCurrentlyLiked ? Math.max(0, prev.likes - 1) : prev.likes + 1 
                }
              : null
          );
        }

        return true;
      } else {
        setError(result.message || 'Failed to like reel');
        return false;
      }
    } catch (err: any) {
      console.error('Error liking reel:', err);
      setError(err.message || 'Failed to like reel');
      return false;
    }
  }, [selectedReel]);

  // Unlike reel - toggleLikeReel handles both like and unlike
  // Kept for API compatibility but calls toggleLikeReel
  const unlikeReel = useCallback(async (reelId: string): Promise<boolean> => {
    try {
      setError(null);

      // Use toggleLikeReel which handles the unlike action
      const result = await reelsService.toggleLikeReel(reelId);

      if (result.success) {
        // Update reel in list - toggle like state
        setReels((prev) =>
          prev.map((reel) => {
            if ((reel as any)._backendId === reelId || reel.id === reelId) {
              const isCurrentlyLiked = (reel as any).isLiked;
              return { 
                ...reel, 
                isLiked: !isCurrentlyLiked, 
                likes: isCurrentlyLiked ? Math.max(0, reel.likes - 1) : reel.likes + 1 
              };
            }
            return reel;
          })
        );

        // Update selected reel
        if (selectedReel && ((selectedReel as any)._backendId === reelId || selectedReel.id === reelId)) {
          const isCurrentlyLiked = (selectedReel as any).isLiked;
          setSelectedReel((prev) =>
            prev
              ? { 
                  ...prev, 
                  isLiked: !isCurrentlyLiked, 
                  likes: isCurrentlyLiked ? Math.max(0, prev.likes - 1) : prev.likes + 1 
                }
              : null
          );
        }

        return true;
      } else {
        setError(result.message || 'Failed to unlike reel');
        return false;
      }
    } catch (err: any) {
      console.error('Error unliking reel:', err);
      setError(err.message || 'Failed to unlike reel');
      return false;
    }
  }, [selectedReel]);

  // Comment on reel - note: commentReel not implemented in reelsService
  // Comments are posted via commentService directly in main screen
  const commentReel = useCallback(
    async (reelId: string, text: string): Promise<boolean> => {
      try {
        setError(null);
        // Comments are handled by commentService in the main screen
        // This method is here for context API compatibility
        console.warn('[ReelsContext] commentReel: Use commentService.addComment directly');
        return false;
      } catch (err: any) {
        console.error('Error commenting on reel:', err);
        setError(err.message || 'Failed to comment on reel');
        return false;
      }
    },
    []
  );

  // Upload reel - note: uploadReel not implemented in reelsService
  // Upload functionality would be added when reel upload feature is implemented
  const uploadReel = useCallback(async (data: any): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Upload endpoint not yet implemented in reelsService
      console.warn('[ReelsContext] uploadReel: Not yet implemented in service');
      setError('Reel upload endpoint not yet implemented');
      return false;
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
