import { apiGet, toResult, ApiResult } from "../client";

/**
 * GET /public/soundfx -> every active sound effect { _id, name, url, category, duration }.
 * Category and search filtering happen on the device.
 */

export interface SoundEffect {
  _id: string;
  name: string;
  audioUrl: string;
  category: string;
  /** Seconds. */
  duration: number;
  isActive: boolean;
}

interface BackendSoundFx {
  _id: string;
  name: string;
  url: string;
  category: string;
  duration: number;
  isActive: boolean;
}

export async function fetchSoundFX(): Promise<SoundEffect[]> {
  const list = await apiGet<BackendSoundFx[]>("public/soundfx", { skipAuth: true });
  return list.map((fx) => ({
    _id: fx._id,
    name: fx.name,
    audioUrl: fx.url,
    category: fx.category || "general",
    duration: fx.duration || 1,
    isActive: fx.isActive !== false,
  }));
}

export const listSoundFX = (category?: string): Promise<ApiResult<SoundEffect[]>> =>
  toResult(async () => {
    const all = await fetchSoundFX();
    return category ? all.filter((fx) => fx.category.toLowerCase() === category.toLowerCase()) : all;
  });

export const searchSoundFX = (query: string): Promise<ApiResult<SoundEffect[]>> =>
  toResult(async () => {
    const q = query.trim().toLowerCase();
    const all = await fetchSoundFX();
    return q ? all.filter((fx) => fx.name.toLowerCase().includes(q) || fx.category.toLowerCase().includes(q)) : all;
  });

export const soundFXService = { fetchSoundFX, listSoundFX, searchSoundFX };

export default soundFXService;
