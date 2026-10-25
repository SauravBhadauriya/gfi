import { apiGet, toResult, ApiResult } from "../client";

/**
 * GET /public/stickers -> every active sticker { _id, name, imageUrl, category }.
 * The backend has no category or search parameters, so both filter on the device.
 */

export interface Sticker {
  id: string;
  name: string;
  url: string;
  category: string;
  isActive: boolean;
}

interface BackendSticker {
  _id: string;
  name: string;
  imageUrl: string;
  category: string;
  isActive: boolean;
}

export async function fetchStickers(): Promise<Sticker[]> {
  const list = await apiGet<BackendSticker[]>("public/stickers", { skipAuth: true });
  return list.map((s) => ({
    id: s._id,
    name: s.name || "Sticker",
    url: s.imageUrl,
    category: s.category || "general",
    isActive: s.isActive !== false,
  }));
}

export const listStickers = (category?: string): Promise<ApiResult<Sticker[]>> =>
  toResult(async () => {
    const all = await fetchStickers();
    return category ? all.filter((s) => s.category.toLowerCase() === category.toLowerCase()) : all;
  });

export const searchStickers = (query: string): Promise<ApiResult<Sticker[]>> =>
  toResult(async () => {
    const q = query.trim().toLowerCase();
    const all = await fetchStickers();
    return q ? all.filter((s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)) : all;
  });

export const stickerEmojiService = { fetchStickers, listStickers, searchStickers };

export default stickerEmojiService;
