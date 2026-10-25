import { apiClient, ApiEnvelope, toResult, ApiResult } from "../client";
import { fileNameFromUri, guessMimeType } from "./uploadService";

/**
 * POST /reels/auto-caption transcribes speech into a caption.
 * Send either a local file as multipart field `media`, or a public `videoUrl`.
 * Returns { caption }.
 */

export interface AutoCaptionResponse {
  caption: string;
}

export async function generateCaption(videoUri: string): Promise<AutoCaptionResponse> {
  const isRemote = /^https?:/i.test(videoUri);
  if (isRemote) {
    const res = await apiClient.post<ApiEnvelope<AutoCaptionResponse>>("reels/auto-caption", { videoUrl: videoUri }, { timeout: 120000 });
    return res.data.data;
  }
  const form = new FormData();
  form.append("media", {
    uri: videoUri,
    name: fileNameFromUri(videoUri, "mp4"),
    type: guessMimeType(videoUri, "video/mp4"),
  } as any);
  const res = await apiClient.post<ApiEnvelope<AutoCaptionResponse>>("reels/auto-caption", form, {
    headers: { "Content-Type": "multipart/form-data" },
    // Transcription of a full clip can take a while.
    timeout: 120000,
  });
  return res.data.data;
}

/** `_reelId` is kept for existing callers; the endpoint doesn't need it. */
export const autoCaption = (_reelId: string, videoUri: string): Promise<ApiResult<AutoCaptionResponse>> =>
  toResult(() => generateCaption(videoUri), "Captions generated");

export const captionsService = { generateCaption, autoCaption };

export default captionsService;
