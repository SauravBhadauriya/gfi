/**
 * Offline Support Service
 * Handles network detection, sync queue, and offline data persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface QueuedRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

export interface SyncQueueOptions {
  maxRetries?: number;
  autoSync?: boolean;
}

const QUEUE_STORAGE_KEY = 'gf_sync_queue';
const MAX_RETRIES = 3;

export class OfflineService {
  private static listeners: Array<(isOnline: boolean) => void> = [];
  private static syncInProgress = false;

  /**
   * Check if device is online
   */
  static async isOnline(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected ?? false;
    } catch (error) {
      console.error('[OfflineService] Failed to check network status:', error);
      return false;
    }
  }

  /**
   * Get detailed network info
   */
  static async getNetworkInfo() {
    try {
      const state = await NetInfo.fetch();
      return {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
        isExpensive: state.isExpensive,
      };
    } catch (error) {
      console.error('[OfflineService] Failed to get network info:', error);
      return null;
    }
  }

  /**
   * Monitor network connectivity
   */
  static onNetworkStatusChange(callback: (isOnline: boolean) => void) {
    this.listeners.push(callback);

    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const isOnline = state.isConnected ?? false;
      console.log(`[OfflineService] Network status changed: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

      callback(isOnline);

      // Auto-sync when coming back online
      if (isOnline) {
        console.log('[OfflineService] Device is online, attempting to sync queue...');
        await this.syncQueue();
      }
    });

    return unsubscribe;
  }

  /**
   * Add request to sync queue
   */
  static async queueRequest(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    data?: any
  ): Promise<string> {
    try {
      const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const queue = await this.getQueue();

      const request: QueuedRequest = {
        id,
        method,
        url,
        data,
        timestamp: Date.now(),
        retries: 0,
        maxRetries: MAX_RETRIES,
      };

      queue.push(request);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));

      console.log(`[OfflineService] Request queued: ${method} ${url} (ID: ${id})`);
      return id;
    } catch (error) {
      console.error('[OfflineService] Failed to queue request:', error);
      throw error;
    }
  }

  /**
   * Get sync queue
   */
  static async getQueue(): Promise<QueuedRequest[]> {
    try {
      const queued = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      return queued ? JSON.parse(queued) : [];
    } catch (error) {
      console.error('[OfflineService] Failed to get queue:', error);
      return [];
    }
  }

  /**
   * Sync all queued requests
   */
  static async syncQueue(
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ synced: number; failed: number }> {
    if (this.syncInProgress) {
      console.log('[OfflineService] Sync already in progress');
      return { synced: 0, failed: 0 };
    }

    this.syncInProgress = true;

    try {
      const isOnline = await this.isOnline();
      if (!isOnline) {
        console.warn('[OfflineService] Cannot sync - device is offline');
        this.syncInProgress = false;
        return { synced: 0, failed: 0 };
      }

      const queue = await this.getQueue();
      if (queue.length === 0) {
        console.log('[OfflineService] Sync queue is empty');
        this.syncInProgress = false;
        return { synced: 0, failed: 0 };
      }

      console.log(`[OfflineService] Starting sync of ${queue.length} requests`);

      let synced = 0;
      let failed = 0;

      for (let i = 0; i < queue.length; i++) {
        const request = queue[i];

        try {
          // Import apiClient dynamically to avoid circular dependency
          const { default: apiClient } = await import('@/api/axios');

          const response = await apiClient({
            method: request.method,
            url: request.url,
            data: request.data,
          });

          console.log(`[OfflineService] Synced: ${request.method} ${request.url}`);
          synced++;

          // Remove from queue
          queue.splice(i, 1);
          i--;
        } catch (error) {
          console.error(`[OfflineService] Failed to sync: ${request.method} ${request.url}`, error);

          request.retries++;

          if (request.retries >= request.maxRetries) {
            console.warn(`[OfflineService] Max retries exceeded for ${request.id}`);
            queue.splice(i, 1);
            i--;
            failed++;
          }
        }

        onProgress?.(synced + failed, queue.length);
      }

      // Save updated queue
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));

      console.log(
        `[OfflineService] Sync complete: ${synced} synced, ${failed} failed, ${queue.length} remaining`
      );

      this.syncInProgress = false;
      return { synced, failed };
    } catch (error) {
      console.error('[OfflineService] Sync failed:', error);
      this.syncInProgress = false;
      return { synced: 0, failed: 0 };
    }
  }

  /**
   * Clear sync queue
   */
  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
      console.log('[OfflineService] Sync queue cleared');
    } catch (error) {
      console.error('[OfflineService] Failed to clear queue:', error);
    }
  }

  /**
   * Remove request from queue
   */
  static async removeFromQueue(requestId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filtered = queue.filter((r) => r.id !== requestId);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(filtered));
      console.log(`[OfflineService] Removed request from queue: ${requestId}`);
    } catch (error) {
      console.error('[OfflineService] Failed to remove from queue:', error);
    }
  }

  /**
   * Get queue stats
   */
  static async getQueueStats() {
    try {
      const queue = await this.getQueue();
      const isOnline = await this.isOnline();

      return {
        totalQueued: queue.length,
        isOnline,
        oldestRequest: queue.length > 0 ? queue[0].timestamp : null,
        newestRequest: queue.length > 0 ? queue[queue.length - 1].timestamp : null,
      };
    } catch (error) {
      console.error('[OfflineService] Failed to get queue stats:', error);
      return null;
    }
  }
}

/**
 * Offline-aware API call wrapper
 */
export async function apiCallWithOfflineSupport<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: any,
  options?: { useQueue?: boolean }
): Promise<T> {
  const isOnline = await OfflineService.isOnline();

  if (!isOnline && (method !== 'GET' || options?.useQueue)) {
    // Queue non-GET requests or if explicitly requested
    if (method !== 'GET') {
      const requestId = await OfflineService.queueRequest(method, url, data);
      console.log(`[OfflineService] Request queued (will sync when online): ${requestId}`);

      // Return pending response
      return {
        success: false,
        queued: true,
        requestId,
        message: 'Request queued. Will sync when online.',
      } as any;
    }

    // For GET requests offline, try to use cached data
    console.warn('[OfflineService] GET request while offline - attempting to use cache');
    throw new Error('No cached data available offline');
  }

  // Device is online, make normal API call
  const { default: apiClient } = await import('@/api/axios');
  return apiClient({
    method,
    url,
    data,
  });
}
