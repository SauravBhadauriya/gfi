/**
 * Cache Service with TTL and Invalidation
 * Provides AsyncStorage-based caching with automatic expiration and refresh strategies
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheConfig {
  ttlMs: number; // Time to live in milliseconds
  key: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

export class CacheService {
  private static readonly PREFIX = 'gf_cache_';

  /**
   * Generate full cache key with prefix
   */
  private static getFullKey(key: string): string {
    return `${this.PREFIX}${key}`;
  }

  /**
   * Set cache with TTL
   */
  static async set<T>(
    key: string,
    data: T,
    ttlMs: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<void> {
    try {
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttlMs,
      };

      await AsyncStorage.setItem(this.getFullKey(key), JSON.stringify(cacheEntry));
      console.log(`[CacheService] Cached: ${key} (TTL: ${ttlMs}ms)`);
    } catch (error) {
      console.error(`[CacheService] Failed to set cache for ${key}:`, error);
    }
  }

  /**
   * Get cache if not expired
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(this.getFullKey(key));
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();
      const age = now - entry.timestamp;

      // Check if cache is expired
      if (age > entry.ttlMs) {
        console.log(`[CacheService] Cache expired for ${key} (age: ${age}ms, TTL: ${entry.ttlMs}ms)`);
        await this.remove(key);
        return null;
      }

      console.log(`[CacheService] Cache hit: ${key} (age: ${age}ms)`);
      return entry.data;
    } catch (error) {
      console.error(`[CacheService] Failed to get cache for ${key}:`, error);
      return null;
    }
  }

  /**
   * Get cache data if exists (regardless of expiration)
   * Used for stale-while-revalidate pattern
   */
  static async getStale<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(this.getFullKey(key));
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      return entry.data;
    } catch (error) {
      console.error(`[CacheService] Failed to get stale cache for ${key}:`, error);
      return null;
    }
  }

  /**
   * Check if cache exists and is fresh
   */
  static async isFresh(key: string): Promise<boolean> {
    try {
      const cached = await AsyncStorage.getItem(this.getFullKey(key));
      if (!cached) return false;

      const entry: CacheEntry<unknown> = JSON.parse(cached);
      const now = Date.now();
      const age = now - entry.timestamp;

      return age <= entry.ttlMs;
    } catch (error) {
      return false;
    }
  }

  /**
   * Remove cache entry
   */
  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getFullKey(key));
      console.log(`[CacheService] Removed cache: ${key}`);
    } catch (error) {
      console.error(`[CacheService] Failed to remove cache for ${key}:`, error);
    }
  }

  /**
   * Clear all caches
   */
  static async clearAll(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((key) => key.startsWith(this.PREFIX));

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        console.log(`[CacheService] Cleared ${cacheKeys.length} cache entries`);
      }
    } catch (error) {
      console.error('[CacheService] Failed to clear all caches:', error);
    }
  }

  /**
   * Clear cache by pattern (e.g., 'feed_*' clears all feed caches)
   */
  static async clearByPattern(pattern: string): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const regex = new RegExp(`^${this.PREFIX}${pattern}`);
      const matchingKeys = allKeys.filter((key) => regex.test(key));

      if (matchingKeys.length > 0) {
        await AsyncStorage.multiRemove(matchingKeys);
        console.log(`[CacheService] Cleared ${matchingKeys.length} cache entries matching: ${pattern}`);
      }
    } catch (error) {
      console.error('[CacheService] Failed to clear cache by pattern:', error);
    }
  }

  /**
   * Invalidate cache and fetch fresh data
   */
  static async invalidateAndRefresh<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number = 5 * 60 * 1000
  ): Promise<T> {
    try {
      // Remove stale cache
      await this.remove(key);

      // Fetch fresh data
      const freshData = await fetchFn();

      // Cache the fresh data
      await this.set(key, freshData, ttlMs);

      return freshData;
    } catch (error) {
      console.error(`[CacheService] Failed to invalidate and refresh ${key}:`, error);
      throw error;
    }
  }

  /**
   * Stale-while-revalidate pattern
   * Returns cached data immediately and updates in background
   */
  static async getWithRevalidate<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number = 5 * 60 * 1000,
    onUpdate?: (data: T) => void
  ): Promise<{ data: T | null; isFresh: boolean }> {
    try {
      // Check if fresh cache exists
      const cached = await this.get(key);
      if (cached) {
        return { data: cached, isFresh: true };
      }

      // Check if stale cache exists
      const stale = await this.getStale(key);

      // Fetch fresh data in background
      fetchFn()
        .then((freshData) => {
          this.set(key, freshData, ttlMs);
          onUpdate?.(freshData);
        })
        .catch((error) => {
          console.error(`[CacheService] Background refresh failed for ${key}:`, error);
        });

      return { data: stale, isFresh: false };
    } catch (error) {
      console.error(`[CacheService] getWithRevalidate failed for ${key}:`, error);
      return { data: null, isFresh: false };
    }
  }
}

/**
 * Cache keys for different data types
 */
export const CACHE_KEYS = {
  // User data
  USER_PROFILE: 'user_profile',
  USER_STATS: 'user_stats',
  USER_FOLLOWERS: 'user_followers',
  USER_FOLLOWING: 'user_following',

  // Feed data
  FEED_HOME: 'feed_home',
  FEED_TRENDING: 'feed_trending',
  FEED_CATEGORY: (category: string) => `feed_category_${category}`,
  REEL: (id: string) => `reel_${id}`,

  // Competitions
  COMPETITIONS_LIST: 'competitions_list',
  COMPETITION_DETAIL: (id: string) => `competition_${id}`,
  COMPETITION_LEADERBOARD: (id: string) => `competition_leaderboard_${id}`,

  // Search
  SEARCH_RESULTS: (query: string) => `search_${query}`,
  SEARCH_TRENDING: 'search_trending',

  // Explore
  EXPLORE_HOME: 'explore_home',
  EXPLORE_CATEGORIES: 'explore_categories',

  // Notifications
  NOTIFICATIONS: 'notifications',

  // Comments
  REEL_COMMENTS: (reelId: string) => `reel_comments_${reelId}`,

  // Payments
  PAYMENT_METHODS: 'payment_methods',
  WALLET_BALANCE: 'wallet_balance',
  TRANSACTION_HISTORY: 'transaction_history',
};

/**
 * Cache TTL presets
 */
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000, // 2 minutes
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 15 * 60 * 1000, // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
};
