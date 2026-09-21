/**
 * Socket.IO Chat Service
 * Real-time message delivery via websocket
 * Replaces HTTP polling with instant message events
 */

import { io, Socket } from "socket.io-client";
import { BASE_URL } from "../axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_STORAGE_KEY = "authToken";

// Infer websocket URL from REST API base URL
// If API is https://gullyfame.com/v1/api/, websocket should be https://gullyfame.com
const getSocketUrl = (): string => {
  if (!BASE_URL) return "https://gullyfame.com";
  
  // Extract protocol + domain from API URL
  // e.g., "https://gullyfame.com/v1/api/" → "https://gullyfame.com"
  try {
    const url = new URL(BASE_URL);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "https://gullyfame.com";
  }
};

const SOCKET_URL = getSocketUrl();

interface ChatSocketMessage {
  _id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  createdAt: string;
}

export interface SocketChatCallbacks {
  onMessageReceived?: (message: ChatSocketMessage) => void;
  onMessageDelivered?: (messageId: string) => void;
  onMessageDeleted?: (messageId: string) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: string) => void;
}

class SocketChatService {
  private socket: Socket | null = null;
  private callbacks: SocketChatCallbacks = {};
  private currentConversationId: string | null = null;

  /**
   * Initialize socket connection
   * Connects to /chat namespace on first call
   */
  async connect(conversationId: string, callbacks?: SocketChatCallbacks): Promise<void> {
    if (this.socket?.connected && this.currentConversationId === conversationId) {
      console.log("[socketChatService] Already connected to conversation:", conversationId);
      return;
    }

    try {
      console.log("[socketChatService] Connecting to websocket:", SOCKET_URL);

      // Get auth token
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

      // Create socket connection with auth token
      // Note: namespace is passed as part of the URL (/chat)
      const socketUrl = `${SOCKET_URL}/chat`;
      this.socket = io(socketUrl, {
        path: "/socket.io/", // Standard Socket.IO path
        auth: {
          token: token || "",
          conversationId: conversationId,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000, // Extended timeout for production
        reconnectionAttempts: 10,
        transports: ["websocket", "polling"], // Try websocket first, fallback to polling
      });

      this.currentConversationId = conversationId;
      if (callbacks) {
        this.callbacks = callbacks;
      }

      // Setup event listeners
      this.setupListeners();

      console.log("[socketChatService] Socket connection initiated");
    } catch (error: any) {
      console.error("[socketChatService] Connection error:", error.message);
      this.callbacks.onError?.(error.message);
      throw error;
    }
  }

  /**
   * Setup socket event listeners
   */
  private setupListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      console.log("[socketChatService] Socket connected, ID:", this.socket?.id);
      this.callbacks.onConnected?.();
    });

    this.socket.on("disconnect", (reason: string) => {
      console.log("[socketChatService] Socket disconnected, reason:", reason);
      this.callbacks.onDisconnected?.();
    });

    this.socket.on("connect_error", (error: any) => {
      console.error("[socketChatService] Connection error:", error.message);
      this.callbacks.onError?.(error.message);
    });

    // Chat events
    this.socket.on("message", (message: ChatSocketMessage) => {
      console.log("[socketChatService] Message received:", message._id, message.message);
      this.callbacks.onMessageReceived?.(message);
    });

    this.socket.on("message_delivered", (messageId: string) => {
      console.log("[socketChatService] Message delivered:", messageId);
      this.callbacks.onMessageDelivered?.(messageId);
    });

    this.socket.on("message_deleted", (messageId: string) => {
      console.log("[socketChatService] Message deleted:", messageId);
      this.callbacks.onMessageDeleted?.(messageId);
    });

    this.socket.on("error", (error: any) => {
      console.error("[socketChatService] Socket error:", error);
      this.callbacks.onError?.(error?.message || "Socket error occurred");
    });
  }

  /**
   * Send message via socket
   * Falls back to REST if socket not connected
   */
  async sendMessage(
    conversationId: string,
    receiverId: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (this.socket?.connected) {
        console.log("[socketChatService] Sending message via socket");
        return new Promise((resolve) => {
          this.socket?.emit(
            "send_message",
            { conversationId, receiverId, message },
            (response: any) => {
              if (response?.success) {
                console.log("[socketChatService] Message sent successfully:", response.messageId);
                resolve({ success: true, messageId: response.messageId });
              } else {
                console.error("[socketChatService] Send failed:", response?.error);
                resolve({ success: false, error: response?.error || "Send failed" });
              }
            }
          );
        });
      } else {
        console.warn("[socketChatService] Socket not connected, falling back to REST");
        // Will be handled by caller using REST API
        return { success: false, error: "Socket not connected" };
      }
    } catch (error: any) {
      console.error("[socketChatService] Send error:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.socket?.connected) {
        console.log("[socketChatService] Deleting message via socket:", messageId);
        return new Promise((resolve) => {
          this.socket?.emit("delete_message", { messageId }, (response: any) => {
            if (response?.success) {
              console.log("[socketChatService] Message deleted");
              resolve({ success: true });
            } else {
              resolve({ success: false, error: response?.error || "Delete failed" });
            }
          });
        });
      } else {
        // Will be handled by caller using REST API
        return { success: false, error: "Socket not connected" };
      }
    } catch (error: any) {
      console.error("[socketChatService] Delete error:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark conversation as read
   */
  async markConversationRead(conversationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.socket?.connected) {
        console.log("[socketChatService] Marking conversation read via socket:", conversationId);
        return new Promise((resolve) => {
          this.socket?.emit("mark_read", { conversationId }, (response: any) => {
            if (response?.success) {
              console.log("[socketChatService] Conversation marked as read");
              resolve({ success: true });
            } else {
              resolve({ success: false, error: response?.error || "Mark read failed" });
            }
          });
        });
      } else {
        // Will be handled by caller using REST API
        return { success: false, error: "Socket not connected" };
      }
    } catch (error: any) {
      console.error("[socketChatService] Mark read error:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Disconnect socket
   * Call this when closing chat screen
   */
  disconnect(): void {
    if (this.socket?.connected) {
      console.log("[socketChatService] Disconnecting socket");
      this.socket.disconnect();
      this.socket = null;
      this.currentConversationId = null;
    }
  }

  /**
   * Reconnect to a different conversation
   */
  async switchConversation(
    conversationId: string,
    callbacks?: SocketChatCallbacks
  ): Promise<void> {
    if (this.currentConversationId === conversationId && this.socket?.connected) {
      console.log("[socketChatService] Already connected to this conversation");
      return;
    }

    this.disconnect();
    await this.connect(conversationId, callbacks);
  }
}

// Export singleton instance
export const socketChatService = new SocketChatService();
