import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiGet, apiPost, toResult, ApiResult } from "../client";

/**
 * Music library.
 * GET  /public/audio?search&sort&page&limit   sort=trending orders by usage, otherwise newest first
 * POST /user/audio/:audioId/save              toggles -> { saved }
 * GET  /user/audio/saved                      every saved track (no pagination)
 */

export type AudioSortOption = "trending" | "newest" | "popular";

export interface MusicTrack {
  _id: string;
  title: string;
  artist?: string;
  /** Seconds. */
  duration: number;
  audioUrl: string;
  coverImage?: string;
  usageCount?: number;
  isSaved?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface AudioListData {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  tracks: MusicTrack[];
}

/** The `music` object POST /reels/publish expects. */
export interface ReelMusicPayload {
  id: string;
  name: string;
}

interface BackendAudio {
  _id: string;
  title: string;
  artist: string;
  url: string;
  coverImage: string;
  duration: number;
  usageCount: number;
  savedBy?: string[];
  isActive: boolean;
  createdAt: string;
}

const toTrack = (raw: BackendAudio, myUserId: string | null): MusicTrack => ({
  _id: raw._id,
  title: raw.title,
  artist: raw.artist || undefined,
  duration: raw.duration || 0,
  audioUrl: raw.url,
  coverImage: raw.coverImage || undefined,
  usageCount: raw.usageCount,
  isSaved: !!myUserId && (raw.savedBy || []).map(String).includes(myUserId),
  isActive: raw.isActive,
  createdAt: raw.createdAt,
});

export async function fetchAudio(
  sort: AudioSortOption = "trending",
  page = 1,
  limit = 20,
  search?: string
): Promise<AudioListData> {
  const [data, myUserId] = await Promise.all([
    apiGet<{ page: number; limit: number; total: number; hasMore: boolean; audios: BackendAudio[] }>("public/audio", {
      params: {
        page,
        limit,
        ...(sort === "trending" || sort === "popular" ? { sort: "trending" } : {}),
        ...(search?.trim() ? { search: search.trim() } : {}),
      },
      skipAuth: true,
    }),
    AsyncStorage.getItem("userId"),
  ]);
  return {
    page: data.page,
    limit: data.limit,
    total: data.total,
    hasMore: data.hasMore,
    tracks: data.audios.map((a) => toTrack(a, myUserId)),
  };
}

export const listAudio = (
  sort: AudioSortOption = "trending",
  page = 1,
  limit = 20,
  search?: string
): Promise<ApiResult<AudioListData>> => toResult(() => fetchAudio(sort, page, limit, search));

export const toggleSaveAudio = (audioId: string): Promise<ApiResult<{ isSaved: boolean }>> =>
  toResult(async () => {
    const result = await apiPost<{ saved: boolean }>(`user/audio/${audioId}/save`, {});
    return { isSaved: result.saved };
  });

export const getSavedAudio = (): Promise<ApiResult<AudioListData>> =>
  toResult(async () => {
    const list = await apiGet<BackendAudio[]>("user/audio/saved");
    const tracks = list.map((a) => ({ ...toTrack(a, null), isSaved: true }));
    return { page: 1, limit: tracks.length, total: tracks.length, hasMore: false, tracks };
  });

export function buildReelMusicPayload(track: MusicTrack | null | undefined): ReelMusicPayload | undefined {
  if (!track?._id) return undefined;
  return { id: track._id, name: track.artist ? `${track.title} – ${track.artist}` : track.title };
}

export function filterTracksBySearch(tracks: MusicTrack[], query: string): MusicTrack[] {
  const q = query.trim().toLowerCase();
  if (!q) return tracks;
  return tracks.filter((t) => t.title.toLowerCase().includes(q) || (t.artist || "").toLowerCase().includes(q));
}

export const musicLibraryService = {
  listAudio,
  toggleSaveAudio,
  getSavedAudio,
  buildReelMusicPayload,
  filterTracksBySearch,
};

export default musicLibraryService;
