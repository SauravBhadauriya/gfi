/**
 * Notification Integration Service
 * KIRO: Complete notification system
 * Handles: Push notifications, In-app notifications, Notification preferences
 */

import apiClient from "../axios";
import { ApiResponse } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

let Device: any = null;
try {
  Device = require("expo-device");
} catch (e) {
  console.warn("[notificationIntegrationService] expo-device not available:", (e as any)?.message);
}

// Emulator detection helper
const isEmulator = (): boolean => {
  try {
    if (!Device) return false;
    // Android emulator detection
    if (Device.osName === "Android" && (Device.modelName?.includes("Emulator") || Device.modelName?.includes("Android SDK"))) {
      return true;
    }
    // iOS simulator detection
    if (Device.osName === "iOS" && !Device.isDevice) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};

// API timeout wrapper
const API_TIMEOUT_MS = 5000;
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = API_TIMEOUT_MS): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Notification API call timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
};

export interface Notification {
  id: string;
  type: "follow" | "like" | "comment" | "tip" | "competition" | "system";
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  followNotifications: boolean;
  likeNotifications: boolean;
  commentNotifications: boolean;
  tipNotifications: boolean;
  competitionNotifications: boolean;
  systemNotifications: boolean;
}

/**
 * Register device for push notifications
 * KIRO: Register device token with backend
 */
export async function registerDeviceForNotifications(): Promise<
  ApiResponse<{ deviceToken: string }>
> {
  try {
    console.log("[notificationIntegrationService] Registering device for notifications");

    // Skip on emulator - notifications not supported
    if (isEmulator()) {
      console.warn("[notificationIntegrationService] Running on emulator, skipping notification registration");
      return {
        success: false,
        message: "Notifications not available on emulator",
        error: "Emulator detected",
        data: { deviceToken: "" },
      };
    }

    // Get device token
    if (!Device || !Device.isDevice) {
      console.warn("[notificationIntegrationService] Not a physical device or Device module not available, skipping registration");
      return {
        success: false,
        message: "Not a physical device",
        error: "Device token not available",
        data: { deviceToken: "" },
      };
    }

    const token = (await withTimeout(Notifications.getExpoPushTokenAsync())).data;
    console.log("[notificationIntegrationService] Device token obtained");

    // Register with backend
    const response = await withTimeout(
      apiClient.post<any>("notifications/register-device", {
        deviceToken: token,
        deviceType: Device?.osName || "unknown",
        deviceModel: Device?.modelName || "unknown",
      })
    );

    const responseData = response.data as any;

    if (responseData.code === 1) {
      return {
        success: true,
        data: { deviceToken: token },
        message: "Device registered successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Registration failed",
      error: "API returned unsuccessful response",
      data: { deviceToken: token },
    };
  } catch (error: any) {
    console.error("[notificationIntegrationService] Register error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to register device",
      error: error.message,
      data: { deviceToken: "" },
    };
  }
}

/**
 * Get notifications
 * KIRO: Fetch user's notifications
 */
export async function getNotifications(
  limit: number = 20,
  offset: number = 0,
  unreadOnly: boolean = false
): Promise<ApiResponse<Notification[]>> {
  try {
    // Check if user is authenticated before making API call
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      console.warn("[notificationIntegrationService] No auth token - returning empty notifications");
      return {
        success: true,
        data: [],
        message: "User not authenticated yet",
      };
    }

    console.log("[notificationIntegrationService] Fetching notifications with auth token");

    const response = await withTimeout(
      apiClient.get<any>("notifications", {
        params: { limit, offset, unreadOnly },
      })
    );
    const responseData = response.data as any;

    if (responseData.code === 1 && Array.isArray(responseData.data)) {
      return {
        success: true,
        data: responseData.data,
        message: "Notifications fetched successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to fetch notifications",
      error: "API returned unsuccessful response",
      data: [],
    };
  } catch (error: any) {
    console.error("[notificationIntegrationService] Get notifications error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to fetch notifications",
      error: error.message,
      data: [],
    };
  }
}

/**
 * Mark notification as read
 * KIRO: Mark single notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<ApiResponse<{ status: string }>> {
  try {
    console.log("[notificationIntegrationService] Marking notification as read:", notificationId);

    const response = await apiClient.post<any>(`notifications/${notificationId}/read`);
    const responseData = response.data as any;

    if (responseData.code === 1) {
      return {
        success: true,
        data: { status: "read" },
        message: "Notification marked as read",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to mark as read",
      error: "API returned unsuccessful response",
      data: { status: "failed" },
    };
  } catch (error: any) {
    console.error("[notificationIntegrationService] Mark read error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to mark notification as read",
      error: error.message,
      data: { status: "error" },
    };
  }
}

/**
 * Mark all notifications as read
 * KIRO: Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<ApiResponse<{ count: number }>> {
  try {
    console.log("[notificationIntegrationService] Marking all notifications as read");

    const response = await apiClient.post<any>("notifications/read-all");
    const responseData = response.data as any;

    if (responseData.code === 1) {
      return {
        success: true,
        data: { count: responseData.data?.count || 0 },
        message: "All notifications marked as read",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to mark all as read",
      error: "API returned unsuccessful response",
      data: { count: 0 },
    };
  } catch (error: any) {
    console.error("[notificationIntegrationService] Mark all read error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to mark all notifications as read",
      error: error.message,
      data: { count: 0 },
    };
  }
}

/**
 * Delete notification
 * KIRO: Delete single notification
 */
export async function deleteNotification(
  notificationId: string
): Promise<ApiResponse<{ status: string }>> {
  try {
    console.log("[notificationIntegrationService] Deleting notification:", notificationId);

    const response = await apiClient.delete<any>(`notifications/${notificationId}`);
    const responseData = response.data as any;

    if (responseData.code === 1) {
      return {
        success: true,
        data: { status: "deleted" },
        message: "Notification deleted successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to delete notification",
      error: "API returned unsuccessful response",
      data: { status: "failed" },
    };
  } catch (error: any) {
    console.error("[notificationIntegrationService] Delete error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to delete notification",
      error: error.message,
      data: { status: "error" },
    };
  }
}

/**
 * Get notification preferences
 * KIRO: Fetch user's notification preferences
 */
export async function getNotificationPreferences(): Promise<ApiResponse<NotificationPreferences>> {
  try {
    console.log("[notificationIntegrationService] Fetching notification preferences");

    const response = await apiClient.get<any>("notifications/preferences");
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      return {
        success: true,
        data: responseData.data,
        message: "Preferences fetched successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to fetch preferences",
      error: "API returned unsuccessful response",
      data: {
        pushEnabled: true,
        emailEnabled: true,
        followNotifications: true,
        likeNotifications: true,
        commentNotifications: true,
        tipNotifications: true,
        competitionNotifications: true,
        systemNotifications: true,
      },
    };
  } catch (error: any) {
    console.error("[notificationIntegrationService] Get preferences error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to fetch preferences",
      error: error.message,
      data: {
        pushEnabled: true,
        emailEnabled: true,
        followNotifications: true,
        likeNotifications: true,
        commentNotifications: true,
        tipNotifications: true,
        competitionNotifications: true,
        systemNotifications: true,
      },
    };
  }
}

/**
 * Update notification preferences
 * KIRO: Update user's notification preferences
 */
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<ApiResponse<NotificationPreferences>> {
  try {
    console.log("[notificationIntegrationService] Updating notification preferences");

    const response = await apiClient.post<any>("notifications/preferences", preferences);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      return {
        success: true,
        data: responseData.data,
        message: "Preferences updated successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to update preferences",
      error: "API returned unsuccessful response",
      data: {} as NotificationPreferences,
    };
  } catch (error: any) {
    console.error("[notificationIntegrationService] Update preferences error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to update preferences",
      error: error.message,
      data: {} as NotificationPreferences,
    };
  }
}

/**
 * Get unread notification count
 * KIRO: Get count of unread notifications
 */
export async function getUnreadNotificationCount(): Promise<ApiResponse<{ count: number }>> {
  try {
    console.log("[notificationIntegrationService] Fetching unread count");

    // Try the direct endpoint first (if backend implements it)
    try {
      const response = await withTimeout(apiClient.get<any>("notifications/unread-count"));
      const responseData = response.data as any;

      if (responseData.code === 1) {
        return {
          success: true,
          data: { count: responseData.data?.count || 0 },
          message: "Unread count fetched successfully",
        };
      }
    } catch (error: any) {
      // Endpoint doesn't exist, fall back to fetching unread notifications
      console.warn("[notificationIntegrationService] Unread count endpoint not available, falling back");
    }

    // Fallback: Fetch unread notifications and count them
    const notificationsResponse = await getNotifications(100, 0, true);
    
    if (notificationsResponse.success) {
      const count = (notificationsResponse.data || []).length;
      return {
        success: true,
        data: { count },
        message: "Unread count fetched successfully",
      };
    }

    return {
      success: false,
      message: "Failed to fetch unread count",
      error: "Could not fetch notifications",
      data: { count: 0 },
    };
  } catch (error: any) {
    console.error("[notificationIntegrationService] Get unread count error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to fetch unread count",
      error: error.message,
      data: { count: 0 },
    };
  }
}

/**
 * Setup notification listeners
 * KIRO: Setup local notification handlers
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notification) => void,
  onNotificationTapped?: (notification: Notification) => void
): () => void {
  // Handle notification when app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log("[notificationIntegrationService] Notification received:", notification);
    onNotificationReceived?.(notification.request.content as any);
  });

  // Handle notification tap
  const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log("[notificationIntegrationService] Notification tapped:", response);
      onNotificationTapped?.(response.notification.request.content as any);
    }
  );

  // Return cleanup function
  return () => {
    foregroundSubscription.remove();
    backgroundSubscription.remove();
  };
}
