/**
 * Captions Service
 * Manages auto-caption generation for video reels
 * Real-time backend integration for production
 */

import apiClient from "../axios";
import { ApiResponse } from "../types";

export interface AutoCaptionRequest {
  reelId: string;
  videoUri: string;
  thumbnailUrl?: string;
}

export interface AutoCaptionResponse {
  reelId: string;
  caption: string;
  confidence?: number;
  language?: string;
  generatedAt?: string;
}

/**
 * Generate auto captions for a video reel using AI/speech recognition
 * Calls POST /reels/auto-caption with video URL
 */
export async function autoCaption(
  reelId: string,
  videoUri: string,
  thumbnailUrl?: string
): Promise<ApiResponse<AutoCaptionResponse>> {
  try {
    console.log("[captionsService] Generating captions:", { reelId, videoUri });

    const payload = {
      video_url: videoUri,
      thumbnail_url: thumbnailUrl,
    };

    const response = await apiClient.post<any>(
      "reels/auto-caption",
      payload,
      { skipAuth: true }
    );
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const data = responseData.data;
      const caption: AutoCaptionResponse = {
        reelId: reelId,
        caption: data.caption ?? data.text ?? "",
        confidence: data.confidence ?? data.score,
        language: data.language ?? data.lang ?? "en",
        generatedAt: data.generatedAt ?? data.created_at ?? new Date().toISOString(),
      };

      console.log("[captionsService] Captions generated successfully:", caption.caption);

      return {
        success: true,
        data: caption,
        message: responseData.message ?? "Captions generated successfully",
      };
    }

    return {
      success: false,
      message: responseData.message ?? "Failed to generate captions",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[captionsService] autoCaption error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message ?? error.message ?? "Network error",
      error: error.message,
      data: undefined,
    };
  }
}

/**
 * Batch generate captions for multiple reels
 */
export async function batchAutoCaption(
  reels: Array<{ reelId: string; videoUri: string }>
): Promise<ApiResponse<AutoCaptionResponse[]>> {
  try {
    console.log("[captionsService] Batch generating captions for", reels.length, "reels");

    const captions: AutoCaptionResponse[] = [];

    for (const reel of reels) {
      const result = await autoCaption(reel.reelId, reel.videoUri);
      if (result.success && result.data) {
        captions.push(result.data);
      } else {
        console.warn(
          `[captionsService] Failed to caption reel ${reel.reelId}:`,
          result.message
        );
      }
    }

    return {
      success: captions.length === reels.length,
      data: captions,
      message:
        captions.length === reels.length
          ? "All captions generated successfully"
          : `Generated ${captions.length}/${reels.length} captions`,
    };
  } catch (error: any) {
    console.error("[captionsService] batchAutoCaption error:", error.message);
    return {
      success: false,
      message: error.message ?? "Batch caption generation failed",
      error: error.message,
      data: undefined,
    };
  }
}

export const captionsService = {
  autoCaption,
  batchAutoCaption,
};

export default captionsService;
