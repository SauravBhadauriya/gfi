// Profile data the backend does not provide yet. Each function returns a safe empty
// value so the profile screen can hide the section or show "–" instead of a fake number.
// Replace each body with a real API call once the endpoint exists.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiDelete, toResult } from "../client";

export interface FollowCounts {
  followers: number;
  following: number;
}

export interface ProfileInsights {
  viewsLast30Days: number;
}

export interface HighlightItem {
  id: string;
  /** "video" plays to the end; anything else is shown as a photo. */
  mediaType: "video" | "photo";
  url: string;
  thumbnail?: string | null;
}

export interface ProfileHighlight {
  id: string;
  title: string;
  coverUrl: string | null;
  items: HighlightItem[];
}

export interface HighlightDraft {
  title: string;
  coverUrl: string | null;
  /** Existing post ids picked from the user's own posts. */
  postIds: string[];
  /** Local gallery files picked by the user (uploaded before saving). */
  localFiles: { uri: string; mediaType: "video" | "photo" }[];
}

type Result<T = undefined> = { success: boolean; message: string; data?: T };

const NOT_AVAILABLE = "Highlights can't be saved yet. This needs a server update.";

/**
 * Follower/following totals for a user. `null` means "unknown", which the UI shows as "–".
 */
export async function getFollowCounts(_userId: string): Promise<FollowCounts | null> {
  // BACKEND_PENDING: GET user/:id/follow-stats -> { followers: number, following: number }
  // (user/followers, user/following and user/:id/follow-stats all return 404 today)
  return null;
}

/**
 * Profile view analytics for the signed-in user. `null` hides the insights card.
 */
export async function getProfileInsights(): Promise<ProfileInsights | null> {
  // BACKEND_PENDING: GET user/insights?days=30 -> { viewsLast30Days: number }
  return null;
}

/**
 * Saved highlights for a user, newest first.
 */
export async function getHighlights(_userId: string): Promise<ProfileHighlight[]> {
  // BACKEND_PENDING: GET user/:id/highlights -> [{ _id, title, coverUrl, items: [{ _id, mediaType, url, thumbnail }] }]
  return [];
}

export async function createHighlight(_draft: HighlightDraft): Promise<Result<ProfileHighlight>> {
  // BACKEND_PENDING: POST user/highlights { title, coverUrl, postIds[], mediaUrls[] } -> highlight
  // (gallery files would first go through POST reels/upload-url with assetType "highlights")
  return { success: false, message: NOT_AVAILABLE };
}

export async function updateHighlight(_id: string, _draft: HighlightDraft): Promise<Result<ProfileHighlight>> {
  // BACKEND_PENDING: PATCH user/highlights/:id { title, coverUrl, postIds[], mediaUrls[] } -> highlight
  return { success: false, message: NOT_AVAILABLE };
}

export async function deleteHighlight(_id: string): Promise<Result> {
  // BACKEND_PENDING: DELETE user/highlights/:id -> { deleted: true }
  return { success: false, message: "Highlights can't be deleted yet. This needs a server update." };
}

/** Whether the Delete quick action is offered on own posts. */
export const CAN_DELETE_POSTS = true;

const LOCAL_REELS_KEY = "@gullyfame_local_published_reels";

/** Drops a deleted post from the copies cached on this device so it does not reappear. */
async function removeFromLocalCaches(postId: string) {
  try {
    const stored = await AsyncStorage.getItem(LOCAL_REELS_KEY);
    if (stored) {
      const list: any[] = JSON.parse(stored);
      await AsyncStorage.setItem(
        LOCAL_REELS_KEY,
        JSON.stringify(list.filter((r) => (r.id || r._id) !== postId))
      );
    }
    const userId = await AsyncStorage.getItem("userId");
    const key = userId ? `@gullyfame_profile_reels_${userId}` : null;
    const cached = key ? await AsyncStorage.getItem(key) : null;
    if (key && cached) {
      const list: any[] = JSON.parse(cached);
      await AsyncStorage.setItem(key, JSON.stringify(list.filter((r) => (r.id || r._id) !== postId)));
    }
  } catch {
    // Cache cleanup is best effort; the refreshed list comes from the server.
  }
}

/**
 * Delete one of the signed-in user's posts.
 * DELETE reels/:id (owner only). BACKEND_PENDING: this route is not on the server yet,
 * so until it ships the call fails and the post is kept.
 */
export async function deletePost(postId: string): Promise<Result> {
  const result = await toResult(() => apiDelete(`reels/${postId}`), "Post deleted");
  if (!result.success) return { success: false, message: result.message };
  await removeFromLocalCaches(postId);
  return { success: true, message: result.message };
}

/**
 * Link used by "Share profile". The app deep link always works for people who have the app;
 * the website does not serve profile pages yet, so its home page is added for everyone else.
 */
export function getProfileShareMessage(userId: string, displayName: string): string {
  // BACKEND_PENDING: a public web profile page (https://gullyfame.com/profile/:id returns 404 today)
  // or GET user/:id/share-link -> { url } so the shared link opens for people without the app.
  const name = displayName || "this creator";
  return `Check out ${name} on Gully Fame: gullyfamemobile://profile/${userId}\n\nGet the app: https://gullyfame.com`;
}
