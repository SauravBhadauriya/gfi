// Camera Service
// Handles video recording, compression, and upload functionality

import * as FileSystem from "expo-file-system";
import { File } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { ApiResponse } from "../types";
import apiClient from "../axios";

export interface VideoFile {
  uri: string;
  name: string;
  size: number;
  duration?: number;
  thumbnail?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ReelUploadData {
  title: string;
  description: string;
  categoryId?: string;
  competitionId?: string;
  tags?: string[];
}

// Save video to media library
export async function saveVideoToLibrary(videoUri: string): Promise<ApiResponse<string>> {
  try {
    console.log("[cameraService] Saving video to library:", videoUri);

    // Request media library permissions
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) {
      return {
        success: false,
        message: "Media library permission denied",
        error: "Permission required",
        data: undefined,
      };
    }

    // Save video to media library
    const asset = await MediaLibrary.createAssetAsync(videoUri);
    const album = await MediaLibrary.getAlbumAsync("Gully Fame");

    if (album) {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album);
    } else {
      await MediaLibrary.createAlbumAsync("Gully Fame", asset);
    }

    console.log("[cameraService] Video saved to library:", asset.id);

    return {
      success: true,
      data: asset.id,
      message: "Video saved to library successfully",
    };
  } catch (error: any) {
    console.error("[cameraService] Save video error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to save video",
      error: error.message,
      data: undefined,
    };
  }
}

//  Get video file info
export async function getVideoFileInfo(videoUri: string): Promise<ApiResponse<VideoFile>> {
  try {
    console.log("[cameraService] Getting video file info:", videoUri);

    // Use new File API to get file info
    const videoFile = new File(videoUri);
    let fileSize = 0;
    try {
      // Try new API first
      const fileInfo = await videoFile.getInfo();
      fileSize = fileInfo.size || 0;
    } catch (error) {
      console.warn("[cameraService] New File API failed, trying legacy:", error);
      // Fallback to legacy API
      try {
        const fileInfo = await FileSystem.getInfoAsync(videoUri);
        if (!fileInfo.exists) {
          return {
            success: false,
            message: "Video file not found",
            error: "File does not exist",
            data: undefined,
          };
        }
        fileSize = fileInfo.size || 0;
      } catch (legacyError) {
        throw legacyError;
      }
    }

    const fileName = videoUri.split("/").pop() || "video.mp4";
    const videoFileData: VideoFile = {
      uri: videoUri,
      name: fileName,
      size: fileSize,
    };

    console.log("[cameraService] Video file info:", videoFileData);

    return {
      success: true,
      data: videoFileData,
      message: "Video file info retrieved successfully",
    };
  } catch (error: any) {
    console.error("[cameraService] Get video info error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to get video info",
      error: error.message,
      data: undefined,
    };
  }
}

//  Upload video to backend
export async function uploadVideo(
  videoUri: string,
  reelData: ReelUploadData,
  onProgress?: (progress: UploadProgress) => void
): Promise<ApiResponse<any>> {
  try {
    console.log("[cameraService] Uploading video:", { videoUri, reelData });

    // Get video file info
    const fileInfoResponse = await getVideoFileInfo(videoUri);
    if (!fileInfoResponse.success || !fileInfoResponse.data) {
      return {
        success: false,
        message: "Failed to get video file info",
        error: "File info error",
        data: undefined,
      };
    }

    const videoFile = fileInfoResponse.data;

    // Create FormData
    const formData = new FormData();
    formData.append("video", {
      uri: videoFile.uri,
      name: videoFile.name,
      type: "video/mp4",
    } as any);
    formData.append("title", reelData.title);
    formData.append("description", reelData.description);

    if (reelData.categoryId) {
      formData.append("categoryId", reelData.categoryId);
    }
    if (reelData.competitionId) {
      formData.append("competitionId", reelData.competitionId);
    }
    if (reelData.tags && reelData.tags.length > 0) {
      formData.append("tags", JSON.stringify(reelData.tags));
    }

    // Upload video
    const response = await apiClient.post<any>("reels/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress) {
          const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage,
          });
        }
      },
    });

    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      console.log("[cameraService] Video uploaded successfully");

      return {
        success: true,
        data: responseData.data,
        message: responseData.message || "Video uploaded successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to upload video",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[cameraService] Upload video error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Upload failed",
      error: error.message,
      data: undefined,
    };
  }
}

//  Delete video file
export async function deleteVideoFile(videoUri: string): Promise<ApiResponse<boolean>> {
  try {
    console.log("[cameraService] Deleting video file:", videoUri);

    const videoFile = new File(videoUri);
    try {
      await videoFile.delete();
    } catch (error) {
      console.warn("[cameraService] New API delete failed, trying legacy:", error);
      // Fallback to legacy method
      try {
        await FileSystem.deleteAsync(videoUri);
      } catch (legacyError) {
        throw legacyError;
      }
    }

    console.log("[cameraService] Video file deleted");

    return {
      success: true,
      data: true,
      message: "Video file deleted successfully",
    };
  } catch (error: any) {
    console.error("[cameraService] Delete video error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to delete video",
      error: error.message,
      data: false,
    };
  }
}

//   Get video duration (requires FFmpeg)
export async function getVideoDuration(videoUri: string): Promise<ApiResponse<number>> {
  try {
    console.log("[cameraService] Getting video duration:", videoUri);

    // Note: This requires FFmpeg integration
    // For now, return placeholder
    // TODO: Implement with FFmpeg when available

    return {
      success: true,
      data: 0,
      message: "Video duration retrieved (FFmpeg integration pending)",
    };
  } catch (error: any) {
    console.error("[cameraService] Get duration error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to get video duration",
      error: error.message,
      data: 0,
    };
  }
}

//  Compress video (requires FFmpeg)
export async function compressVideo(
  videoUri: string,
  quality: "low" | "medium" | "high" = "medium"
): Promise<ApiResponse<string>> {
  try {
    console.log("[cameraService] Compressing video:", { videoUri, quality });

    // Note: This requires FFmpeg integration
    // For now, return original URI
    // TODO: Implement with FFmpeg when available

    return {
      success: true,
      data: videoUri,
      message: "Video compression pending (FFmpeg integration needed)",
    };
  } catch (error: any) {
    console.error("[cameraService] Compress video error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to compress video",
      error: error.message,
      data: undefined,
    };
  }
}

export const cameraService = {
  saveVideoToLibrary,
  getVideoFileInfo,
  uploadVideo,
  deleteVideoFile,
  getVideoDuration,
  compressVideo,
};
