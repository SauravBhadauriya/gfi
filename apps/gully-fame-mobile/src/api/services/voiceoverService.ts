/**
 * Voiceover Service
 * Handles voiceover recording, upload, and integration with video editor
 */

import apiClient from "../axios";
import { ApiResponse } from "../types";
import * as FileSystem from "expo-file-system";
import { File } from "expo-file-system";

export interface Voiceover {
  id?: string;
  audioUri: string;
  duration: number;
  startTime?: number;
  volume?: number;
  createdAt?: string;
}

/**
 * Upload voiceover audio file to backend and create voiceover entry in editing session
 */
export async function uploadVoiceover(
  sessionId: string,
  audioUri: string,
  duration: number,
  startTime: number = 0,
  volume: number = 1,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<Voiceover>> {
  try {
    console.log("[voiceoverService] Uploading voiceover:", {
      sessionId,
      audioUri,
      duration,
      startTime,
      volume,
    });

    // Get file info using new API
    const audioFile = new File(audioUri);
    let fileExists = true;
    try {
      await audioFile.getInfo();
    } catch (error) {
      console.warn("[voiceoverService] File info failed, trying legacy:", error);
      try {
        const fileInfo = await FileSystem.getInfoAsync(audioUri);
        if (!fileInfo.exists) {
          throw new Error("Audio file does not exist");
        }
      } catch (legacyError) {
        throw new Error("Audio file does not exist");
      }
    }

    // Create form data for upload
    const formData = new FormData();
    const fileName = `voiceover_${Date.now()}.m4a`;
    const mimeType = "audio/mp4";

    // Add file
    (formData as any).append("file", {
      uri: audioUri,
      type: mimeType,
      name: fileName,
    } as any);

    // Add metadata
    formData.append("duration", String(duration));
    formData.append("startTime", String(startTime));
    formData.append("volume", String(volume));

    // Upload with progress tracking
    const response = await apiClient.post<any>(
      `video-editor/${sessionId}/voiceover/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent: any) => {
          const progress =
            progressEvent.total > 0 ? progressEvent.loaded / progressEvent.total : 0;
          onProgress?.(progress);
          console.log(
            `[voiceoverService] Upload progress: ${Math.round(progress * 100)}%`
          );
        },
      } as any
    );

    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const voiceover: Voiceover = {
        id: responseData.data.id,
        audioUri: responseData.data.audioUri || audioUri,
        duration: responseData.data.duration || duration,
        startTime: responseData.data.startTime || startTime,
        volume: responseData.data.volume || volume,
        createdAt: responseData.data.createdAt,
      };

      console.log("[voiceoverService] Voiceover uploaded successfully");

      return {
        success: true,
        data: voiceover,
        message: responseData.message || "Voiceover uploaded successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to upload voiceover",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[voiceoverService] Upload error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Upload failed",
      error: error.message,
      data: undefined,
    };
  }
}

/**
 * Delete voiceover from editing session
 */
export async function deleteVoiceover(
  sessionId: string,
  voiceoverId: string
): Promise<ApiResponse<void>> {
  try {
    console.log("[voiceoverService] Deleting voiceover:", {
      sessionId,
      voiceoverId,
    });

    const response = await apiClient.delete<any>(
      `video-editor/${sessionId}/voiceover/${voiceoverId}`
    );
    const responseData = response.data as any;

    if (responseData.code === 1) {
      console.log("[voiceoverService] Voiceover deleted successfully");

      return {
        success: true,
        message: responseData.message || "Voiceover deleted successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to delete voiceover",
      error: "API returned unsuccessful response",
    };
  } catch (error: any) {
    console.error("[voiceoverService] Delete error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Delete failed",
      error: error.message,
    };
  }
}

/**
 * Update voiceover properties (volume, startTime, etc.)
 */
export async function updateVoiceover(
  sessionId: string,
  voiceoverId: string,
  updates: Partial<Voiceover>
): Promise<ApiResponse<Voiceover>> {
  try {
    console.log("[voiceoverService] Updating voiceover:", {
      sessionId,
      voiceoverId,
      updates,
    });

    const response = await apiClient.put<any>(
      `video-editor/${sessionId}/voiceover/${voiceoverId}`,
      updates
    );
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const voiceover: Voiceover = {
        id: responseData.data.id,
        audioUri: responseData.data.audioUri,
        duration: responseData.data.duration,
        startTime: responseData.data.startTime,
        volume: responseData.data.volume,
        createdAt: responseData.data.createdAt,
      };

      console.log("[voiceoverService] Voiceover updated successfully");

      return {
        success: true,
        data: voiceover,
        message: responseData.message || "Voiceover updated successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to update voiceover",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[voiceoverService] Update error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Update failed",
      error: error.message,
      data: undefined,
    };
  }
}

export const voiceoverService = {
  uploadVoiceover,
  deleteVoiceover,
  updateVoiceover,
};

export default voiceoverService;
