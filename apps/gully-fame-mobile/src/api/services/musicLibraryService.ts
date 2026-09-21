/**
 * Music Library Service
 * Connects the Video Editor's music picker to the Gully Fame backend.
 *
 * Postman collection endpoints implemented:
 *  - Public  : GET  /public/audio?sort=trending|newest|popular  → listAudio()
 *  - User    : POST /user/audio/:id/save                        → toggleSaveAudio()
 *  - User    : GET  /user/audio/saved                           → getSavedAudio()
 *  - Helper  : buildReelMusicPayload()  ← converts MusicTrack → reel publish shape
 */

import apiClient from "../axios";
import { ApiResponse } from "../types";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type AudioSortOption = "trending" | "newest" | "popular";

/** A single audio/music track as returned by the backend */
export interface MusicTrack {
  _id: string;
  /** Track title shown in the music library picker */
  title: string;
  /** Artist / creator name */
  artist?: string;
  /** Duration in seconds */
  duration: number;
  /** Streamable / playable URL */
  audioUrl: string;
  /** Optional waveform / cover art */
  coverImage?: string;
  /** How many reels use this track */
  usageCount?: number;
  /** Whether the current logged-in user has saved this track */
  isSaved?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

/** Paginated list response for audio tracks */
export interface AudioListData {
  page: number;
  limit: number;
  total: number;
  tracks: MusicTrack[];
}

/** Minimal music object embedded inside a reel publish payload */
export interface ReelMusicPayload {
  id: string;
  name: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Normalise a raw API audio object → MusicTrack */
function normaliseTrack(raw: any): MusicTrack {
  return {
    _id: raw._id ?? raw.id ?? "",
    title: raw.title ?? raw.name ?? "Unknown Track",
    artist: raw.artist ?? raw.artistName ?? undefined,
    duration: raw.duration ?? 0,
    audioUrl: raw.audioUrl ?? raw.audio_url ?? raw.url ?? "",
    coverImage: raw.coverImage ?? raw.cover_image ?? raw.thumbnail ?? undefined,
    usageCount: raw.usageCount ?? raw.usage_count ?? undefined,
    isSaved: raw.isSaved ?? raw.is_saved ?? false,
    isActive: raw.isActive ?? true,
    createdAt: raw.createdAt ?? undefined,
  };
}

// ─────────────────────────────────────────────
// Public API – GET /public/audio
// ─────────────────────────────────────────────

/**
 * Fetch the public audio / music library.
 * Used by the Music Picker inside the Video Editor.
 * 
 * Hybrid Approach:
 * - Try to fetch from real API first
 * - If API fails, automatically fall back to mock data
 *
 * @param sort    Sort order  – "trending" | "newest" | "popular"  (default: "trending")
 * @param page    Page number (default: 1)
 * @param limit   Items per page (default: 20)
 * @param search  Optional search keyword to filter tracks by title / artist
 */
export async function listAudio(
  sort: AudioSortOption = "trending",
  page = 1,
  limit = 20,
  search?: string
): Promise<ApiResponse<AudioListData>> {
  try {
    console.log('[musicLibraryService] 🎵 [VERIFICATION] listAudio called - sort:', sort, 'page:', page, 'limit:', limit, 'search:', search);

    const params: Record<string, any> = { sort, page, limit };
    if (search && search.trim()) params.search = search.trim();

    console.log('[musicLibraryService] 🎵 [VERIFICATION] Calling GET /public/audio with params:', JSON.stringify(params));
    const response = await apiClient.get<any>("public/audio", { params });
    const responseData = response.data as any;

    console.log('[musicLibraryService] 🎵 [VERIFICATION] API response code:', responseData.code, 'message:', responseData.message);

    if (responseData.code === 1) {
      const raw = responseData.data;

      // Backend returns response with 'audios' key, check all possible keys
      const rawTracks: any[] = Array.isArray(raw)
        ? raw
        : raw?.audios ?? raw?.tracks ?? raw?.audio ?? raw?.data ?? [];

      console.log('[musicLibraryService] 🎵 Raw data structure keys:', Object.keys(raw || {}));
      console.log('[musicLibraryService] 🎵 Extracted tracks:', rawTracks.length);

      const tracks: MusicTrack[] = rawTracks.map(normaliseTrack);

      const listData: AudioListData = {
        page: raw?.page ?? page,
        limit: raw?.limit ?? limit,
        total: raw?.total ?? tracks.length,
        tracks,
      };

      console.log(`[musicLibraryService] ✅ [VERIFICATION] Successfully loaded ${tracks.length} tracks from API`);
      console.log('[musicLibraryService] 🎵 [VERIFICATION] Sample tracks:');
      tracks.slice(0, 3).forEach((t, i) => {
        console.log(`  [${i}] title: ${t.title}, artist: ${t.artist}, audioUrl: ${t.audioUrl?.substring(0, 50)}...`);
      });

      return {
        success: true,
        data: listData,
        message: responseData.message ?? "Audio list fetched successfully",
      };
    }

    // API returned error response - fall back to mock
    console.warn('[musicLibraryService] ⚠️ [VERIFICATION] API returned error code:', responseData.code, '- falling back to mock data');
    return _getMockAudioList(sort, page, limit, search);
  } catch (error: any) {
    console.warn('[musicLibraryService] ⚠️ [VERIFICATION] API call failed:', error.message, '- falling back to mock data');
    
    // Fall back to mock data on any error
    return _getMockAudioList(sort, page, limit, search);
  }
}

/**
 * Internal helper - Get audio list when API is unavailable
 * Returns empty list instead of mock data
 */
function _getMockAudioList(
  sort: AudioSortOption = "trending",
  page = 1,
  limit = 20,
  search?: string
): ApiResponse<AudioListData> {
  console.log(`[musicLibraryService] ❌ API unavailable - returning empty audio list`);

  const listData: AudioListData = {
    page,
    limit,
    total: 0,
    tracks: [],
  };

  return {
    success: false,
    data: listData,
    message: "Unable to load audio library (API unavailable)",
  };
}

// ─────────────────────────────────────────────
// User API – POST /user/audio/:id/save (toggle)
// ─────────────────────────────────────────────

/**
 * Toggle save / unsave an audio track for the current user.
 * The backend handles the toggle logic; returns the new saved state.
 * 
 * Falls back to mock behavior if API is unavailable.
 *
 * @param audioId  The `_id` of the MusicTrack to save / unsave
 */
export async function toggleSaveAudio(
  audioId: string
): Promise<ApiResponse<{ isSaved: boolean }>> {
  try {
    console.log("[musicLibraryService] POST user/audio/:id/save", { audioId });

    // Spec: POST user/audio/:id/save (with Bearer token)
    const response = await apiClient.post<any>(`user/audio/${audioId}/save`, {}, {
      skipAuth: false,  // Explicitly require auth
    });
    const responseData = response.data as any;

    if (responseData.code === 1) {
      // Backend may return { isSaved: boolean } or just a success message
      const isSaved: boolean =
        responseData.data?.isSaved ??
        responseData.data?.is_saved ??
        responseData.data?.saved ??
        (!responseData.data?.removed ? true : false);

      console.log(`[musicLibraryService] Audio ${audioId} saved: ${isSaved}`);

      return {
        success: true,
        data: { isSaved },
        message: responseData.message ?? (isSaved ? "Audio saved" : "Audio unsaved"),
      };
    }

    // API error - fall back to mock behavior (just toggle locally)
    console.warn("[musicLibraryService] API returned error for save, using mock behavior");
    return _getMockToggleSaveAudio(audioId);
  } catch (error: any) {
    console.warn("[musicLibraryService] toggleSaveAudio failed, using mock behavior:", error.message);
    return _getMockToggleSaveAudio(audioId);
  }
}

/**
 * Internal helper - Mock behavior for toggle save
 * Simply returns true (saved) for mock data
 */
function _getMockToggleSaveAudio(audioId: string): ApiResponse<{ isSaved: boolean }> {
  console.log(`[musicLibraryService] Mock toggle: Audio ${audioId} saved (mock behavior)`);
  return {
    success: true,
    data: { isSaved: true },
    message: "Audio saved (using mock behavior)",
  };
}

// ─────────────────────────────────────────────
// User API – GET /user/audio/saved
// ─────────────────────────────────────────────

/**
 * Fetch all audio tracks saved by the current user.
 * Shown in the "Saved" / "My Music" tab inside the music picker.
 * 
 * Falls back to mock data if API is unavailable.
 *
 * @param page   Page number  (default: 1)
 * @param limit  Items per page (default: 20)
 */
export async function getSavedAudio(
  page = 1,
  limit = 20
): Promise<ApiResponse<AudioListData>> {
  try {
    console.log("[musicLibraryService] Fetching saved audio:", { page, limit });

    const response = await apiClient.get<any>("user/audio/saved", {
      params: { page, limit },
    });
    const responseData = response.data as any;

    if (responseData.code === 1) {
      const raw = responseData.data;

      const rawTracks: any[] = Array.isArray(raw)
        ? raw
        : raw?.tracks ?? raw?.audio ?? raw?.data ?? [];

      const tracks: MusicTrack[] = rawTracks.map((t) => ({
        ...normaliseTrack(t),
        isSaved: true, // All tracks from /saved are by definition saved
      }));

      const listData: AudioListData = {
        page: raw?.page ?? page,
        limit: raw?.limit ?? limit,
        total: raw?.total ?? tracks.length,
        tracks,
      };

      console.log(`[musicLibraryService] Loaded ${tracks.length} saved tracks from API`);

      return {
        success: true,
        data: listData,
        message: responseData.message ?? "Saved audio fetched successfully",
      };
    }

    // API returned error response - fall back to mock
    console.warn("[musicLibraryService] API returned error for saved audio, using mock data");
    return _getMockSavedAudioList(page, limit);
  } catch (error: any) {
    console.warn("[musicLibraryService] Failed to fetch saved audio, falling back to mock data:", error.message);
    return _getMockSavedAudioList(page, limit);
  }
}

/**
 * Internal helper - Get saved audio list when API is unavailable
 * Returns empty list instead of mock data
 */
function _getMockSavedAudioList(page = 1, limit = 20): ApiResponse<AudioListData> {
  console.log(`[musicLibraryService] ❌ API unavailable - returning empty saved audio list`);

  const listData: AudioListData = {
    page,
    limit,
    total: 0,
    tracks: [],
  };

  return {
    success: false,
    data: listData,
    message: "Unable to load saved audio (API unavailable)",
  };
}

// ─────────────────────────────────────────────
// Helper – Build music payload for reel publish
// ─────────────────────────────────────────────

/**
 * Converts a selected MusicTrack into the compact shape expected
 * by the `POST /reels/publish` endpoint:
 *
 * ```json
 * {
 *   "music": { "id": "<audioId>", "name": "<title>" }
 * }
 * ```
 *
 * Returns `null` when no track is selected (music is optional on reels).
 */
export function buildReelMusicPayload(
  track: MusicTrack | null | undefined
): ReelMusicPayload | null {
  if (!track || !track._id) return null;

  return {
    id: track._id,
    name: track.title,
  };
}

// ─────────────────────────────────────────────
// Search helper (client-side fallback)
// ─────────────────────────────────────────────

/**
 * Filter a local list of MusicTrack objects by a search term.
 * Useful for instant search before the backend query resolves.
 */
export function filterTracksBySearch(
  tracks: MusicTrack[],
  query: string
): MusicTrack[] {
  if (!query.trim()) return tracks;
  const q = query.toLowerCase();
  return tracks.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      (t.artist ?? "").toLowerCase().includes(q)
  );
}

// ─────────────────────────────────────────────
// Default export – namespaced service object
// ─────────────────────────────────────────────

export const musicLibraryService = {
  /** Fetch public audio library (trending / newest / popular) */
  listAudio,
  /** Toggle save / unsave an audio track for the logged-in user */
  toggleSaveAudio,
  /** Get all audio tracks saved by the logged-in user */
  getSavedAudio,
  /** Build the `{ id, name }` payload for reel publish */
  buildReelMusicPayload,
  /** Client-side search filter helper */
  filterTracksBySearch,
};

export default musicLibraryService;
