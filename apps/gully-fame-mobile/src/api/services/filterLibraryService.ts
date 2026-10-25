import { apiGet, toResult, ApiResult } from "../client";

/**
 * GET /public/filters -> every active filter (no pagination or categories).
 * A backend filter is a name plus an asset (and optional thumbnail); the
 * editor renders filters on-device, matched by name to its built-in presets.
 */

export interface FilterPreset {
  id: string;
  name: string;
  thumbnail?: string;
  assetUrl: string;
  createdAt?: string;
}

export interface FilterListResponse {
  total: number;
  filters: FilterPreset[];
}

interface BackendFilter {
  _id: string;
  name: string;
  thumbnail: string;
  assetUrl: string;
  createdAt: string;
}

export async function fetchFilters(): Promise<FilterPreset[]> {
  const list = await apiGet<BackendFilter[]>("public/filters", { skipAuth: true });
  return list.map((f) => ({
    id: f._id,
    name: f.name,
    thumbnail: f.thumbnail || undefined,
    assetUrl: f.assetUrl,
    createdAt: f.createdAt,
  }));
}

/** Arguments are kept for existing callers; the backend returns the full list. */
export const listFilters = (
  _category?: string,
  _page = 1,
  _limit = 50
): Promise<ApiResult<FilterListResponse>> =>
  toResult(async () => {
    const filters = await fetchFilters();
    return { total: filters.length, filters };
  });

export const filterLibraryService = { fetchFilters, listFilters };

export default filterLibraryService;
