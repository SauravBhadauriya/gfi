// Created by Kiro
// useFetch Hook - Wrapper around useAsync with retry logic and caching

import { useState, useCallback, useRef } from 'react';
import { useAsync, AsyncState } from './useAsync';

interface UseFetchOptions {
  immediate?: boolean;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTime?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Global cache for fetch results
const fetchCache = new Map<string, CacheEntry<any>>();

/**
 * Hook for fetching data with retry logic and caching
 * @param url - URL or cache key to fetch
 * @param fetchFunction - Function that performs the fetch
 * @param options - Configuration options
 * @returns Object with data, loading, error, and refetch function
 */
export const useFetch = <T,>(
  url: string,
  fetchFunction: () => Promise<T>,
  options: UseFetchOptions = {}
) => {
  const {
    immediate = true,
    retries = 3,
    retryDelay = 1000,
    cache = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes default
    onSuccess,
    onError,
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check cache
  const getCachedData = useCallback((): T | null => {
    if (!cache) return null;

    const cached = fetchCache.get(url);
    if (cached) {
      const isExpired = Date.now() - cached.timestamp > cacheTime;
      if (!isExpired) {
        return cached.data;
      } else {
        fetchCache.delete(url);
      }
    }
    return null;
  }, [url, cache, cacheTime]);

  // Set cache
  const setCachedData = useCallback(
    (data: T) => {
      if (cache) {
        fetchCache.set(url, {
          data,
          timestamp: Date.now(),
        });
      }
    },
    [url, cache]
  );

  // Fetch with retry logic
  const fetchWithRetry = useCallback(async (): Promise<T> => {
    try {
      // Check cache first
      const cachedData = getCachedData();
      if (cachedData) {
        return cachedData;
      }

      // Perform fetch
      const data = await fetchFunction();

      // Cache the result
      setCachedData(data);

      // Reset retry count on success
      setRetryCount(0);

      return data;
    } catch (error: any) {
      // Retry logic
      if (retryCount < retries) {
        return new Promise((resolve, reject) => {
          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            fetchWithRetry().then(resolve).catch(reject);
          }, retryDelay * (retryCount + 1)); // Exponential backoff
        });
      }

      throw error;
    }
  }, [fetchFunction, retryCount, retries, retryDelay, getCachedData, setCachedData]);

  // Use async hook
  const asyncState = useAsync<T>(fetchWithRetry, {
    immediate,
    onSuccess,
    onError,
  });

  // Cleanup retry timeout on unmount
  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    fetchCache.delete(url);
  }, [url]);

  // Refetch with cache clear
  const refetch = useCallback(async () => {
    clearCache();
    setRetryCount(0);
    return asyncState.execute();
  }, [asyncState, clearCache]);

  return {
    ...asyncState,
    refetch,
    clearCache,
    retryCount,
    cleanup,
  };
};

export default useFetch;
