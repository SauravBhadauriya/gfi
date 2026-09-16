/**
 * Video Upload Service
 * KIRO: Complete video upload pipeline integration
 * Handles: Camera → Compression → Upload → Reel Creation
 * PRODUCTION READY: Error handling, retry logic, state management
 */

import apiClient from "../axios";
import { ApiResponse } from "../types";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

export interface VideoUploadRequest {
  title: string;
  description?: string;
  thumbnail?: string;
  duration: number;
  resolution: "hd" | "2k" | "4k" | "720p" | "1080p";
  fps: number;
  tags?: string[];
  competitionId?: string;
  categoryId?: string;
  hashtags?: string[];
  music?: {
    trackId: string;
    title: string;
    artist: string;
    startOffset?: number;
    duration?: number;
  };
}

export interface VideoUploadResponse {
  reelId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  status: "processing" | "completed" | "failed";
  message: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  stage?: "uploading" | "processing" | "creating" | "saving";
}

/**
 * Get presigned upload URL from backend
 * KIRO: Gets temporary URL to upload directly to storage service
 */
async function getUploadUrl(videoUri: string): Promise<{ uploadUrl: string; uploadId: string }> {
  // Extract filename from URI
  const fileName = videoUri.split('/').pop() || `video_${Date.now()}.mp4`;
  
  console.log('[videoUploadService] 📹 Getting upload URL - fileName:', fileName);
  
  const response = await apiClient.post<any>("reels/upload-url", {
    fileName,
    fileType: "video/mp4",
  });
  const responseData = response.data as any;
  
  // Log full response for debugging
  console.log('[videoUploadService] 📹 Full response from POST /reels/upload-url:', JSON.stringify(responseData, null, 2));
  
  if (responseData.code === 1 && responseData.data) {
    console.log('[videoUploadService] 📹 Response.data keys:', Object.keys(responseData.data));
    console.log('[videoUploadService] 📹 Response.data:', JSON.stringify(responseData.data, null, 2));
    
    // Try multiple possible field names
    const uploadId = responseData.data.uploadId || responseData.data.id || responseData.data.fileId || responseData.data.assetId || responseData.data.key;
    const uploadUrl = responseData.data.uploadUrl || responseData.data.url || responseData.data.presignedUrl || responseData.data.uploadUri;
    
    if (!uploadId) {
      console.error('[videoUploadService] ❌ Could not find uploadId in response. Available fields:', Object.keys(responseData.data));
      throw new Error("Upload URL response missing identifier field (uploadId/id/fileId)");
    }
    
    if (!uploadUrl) {
      console.error('[videoUploadService] ❌ Could not find uploadUrl in response. Available fields:', Object.keys(responseData.data));
      throw new Error("Upload URL response missing URL field (uploadUrl/url/presignedUrl)");
    }
    
    console.log('[videoUploadService] ✅ Found uploadId:', uploadId);
    console.log('[videoUploadService] ✅ Found uploadUrl:', uploadUrl?.substring(0, 60) + '...');
    
    return {
      uploadUrl,
      uploadId,
    };
  }
  
  throw new Error(responseData.message || "Failed to get upload URL");
}

/**
 * Upload video file directly to presigned URL
 * KIRO: Uploads file to S3/storage using presigned URL from backend via streaming
 * Uses FileSystem.uploadAsync to avoid loading entire file into memory
 */
async function uploadToPresignedUrl(
  videoUri: string,
  uploadUrl: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<void> {
  // Validate file exists
  let fileSize = 0;
  try {
    const fileInfo = await FileSystem.getInfoAsync(videoUri);
    if (!fileInfo.exists) {
      throw new Error("Video file not found");
    }
    fileSize = fileInfo.size || 0;
  } catch (error) {
    console.error(`[videoUploadService] File validation failed:`, error);
    throw new Error("Video file not found");
  }

  const fileSizeInMB = fileSize / (1024 * 1024);
  console.log(`[videoUploadService] 📹 Uploading to presigned URL - size: ${fileSizeInMB.toFixed(2)}MB`);
  console.log(`[videoUploadService] 📹 Using streaming upload (uploadAsync) to avoid memory issues`);

  // Use FileSystem.uploadAsync for streaming upload to presigned URL
  // This streams the file from disk without loading entire content into memory
  const result = await FileSystem.uploadAsync(uploadUrl, videoUri, {
    httpMethod: "PUT",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      "Content-Type": "video/mp4",
    },
  });

  console.log(`[videoUploadService] 📹 Upload response status:`, result.status);
  console.log(`[videoUploadService] 📹 Upload body:`, result.body);

  // Check for upload success (S3 presigned URLs typically return 200)
  if (result.status !== 200) {
    throw new Error(`Upload to storage failed: HTTP ${result.status} - ${result.body}`);
  }

  console.log(`[videoUploadService] ✅ Upload to presigned URL successful`);
}

/**
 * Upload video file to server with retry logic
 * KIRO: Handles presigned URL flow: get URL → upload to storage → return uploadId
 */
export async function uploadVideoFile(
  videoUri: string,
  onProgress?: (progress: UploadProgress) => void,
  retries = 3
): Promise<ApiResponse<{ uploadId: string; videoUrl: string }>> {
  let lastError: any = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[videoUploadService] Upload attempt ${attempt}/${retries}:`, videoUri);

      // Validate file exists
      let fileSize = 0;
      try {
        const fileInfo = await FileSystem.getInfoAsync(videoUri);
        if (!fileInfo.exists) {
          throw new Error("Video file not found");
        }
        fileSize = fileInfo.size || 0;
      } catch (error) {
        console.error(`[videoUploadService] File validation failed:`, error);
        throw new Error("Video file not found");
      }

      // Check file size (limit to 500MB)
      const fileSizeInMB = fileSize / (1024 * 1024);
      console.log(`[videoUploadService] 📹 [VERIFICATION] File validation - exists: true, size: ${fileSizeInMB.toFixed(2)}MB`);
      
      if (fileSizeInMB > 500) {
        throw new Error(`Video file too large: ${fileSizeInMB.toFixed(2)}MB (max 500MB)`);
      }

      // Stage 1: Get presigned upload URL
      console.log('[videoUploadService] 📹 [VERIFICATION] Stage 1: Getting presigned upload URL');
      onProgress?.({
        loaded: 0,
        total: 100,
        percentage: 10,
        stage: "uploading",
      });

      const { uploadUrl, uploadId } = await getUploadUrl(videoUri);
      console.log('[videoUploadService] ✅ Got presigned URL, uploadId:', uploadId);

      // Stage 2: Upload to presigned URL
      console.log('[videoUploadService] 📹 [VERIFICATION] Stage 2: Uploading to presigned URL');
      onProgress?.({
        loaded: 0,
        total: 100,
        percentage: 20,
        stage: "uploading",
      });

      await uploadToPresignedUrl(videoUri, uploadUrl, (progress) => {
        // Scale progress from 20% to 90%
        const scaledProgress = 20 + (progress.percentage * 0.7);
        onProgress?.({
          ...progress,
          percentage: Math.round(scaledProgress),
          stage: "uploading",
        });
      });

      console.log("[videoUploadService] ✅ [VERIFICATION] Upload successful");
      console.log('  uploadId:', uploadId);

      return {
        success: true,
        data: {
          uploadId,
          videoUrl: uploadUrl,
        },
        message: "Video uploaded successfully",
      };
    } catch (error: any) {
      lastError = error;
      
      // Log detailed error info for debugging
      const status = error.response?.status;
      const statusText = error.response?.statusText;
      console.error(`[videoUploadService] Attempt ${attempt} failed:`, error.message);
      if (status) {
        console.error(`  HTTP Status: ${status} ${statusText}`);
      }

      // Don't retry on certain errors
      if (
        error.message?.includes("not found") ||
        error.message?.includes("too large") ||
        error.response?.status === 400 ||
        error.response?.status === 401 ||
        error.response?.status === 413 // Payload Too Large - don't retry
      ) {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`[videoUploadService] Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  console.error("[videoUploadService] All upload attempts failed");
  
  // Provide better error message based on error type
  let errorMessage = lastError?.message || "Failed to upload video after multiple attempts";
  
  if (lastError?.response?.status === 413) {
    errorMessage = "Video file is too large for the server. Please try a smaller video or contact support.";
  } else if (lastError?.response?.status === 408 || lastError?.code === "ECONNABORTED") {
    errorMessage = "Upload timed out. Please check your internet connection and try again.";
  } else if (lastError?.response?.status >= 500) {
    errorMessage = "Server error. Please try again later.";
  }
  
  return {
    success: false,
    message: errorMessage,
    error: lastError?.message,
    data: { uploadId: "", videoUrl: "" },
  };
}

/**
 * Create reel from uploaded video
 * KIRO: Creates reel metadata after successful upload
 */
export async function createReelFromUpload(
  videoUrl: string,
  request: VideoUploadRequest
): Promise<ApiResponse<VideoUploadResponse>> {
  try {
    console.log('[videoUploadService] 🎬 [VERIFICATION] createReelFromUpload called');
    console.log('  videoUrl:', videoUrl?.substring(0, 80));
    console.log('  request:', JSON.stringify({
      title: request.title,
      description: request.description,
      duration: request.duration,
      music: (request as any).music
    }));

    const payload = {
      video_url: videoUrl,
      caption: request.description || request.title || "",
      title: request.title,
      duration: request.duration,
      resolution: request.resolution,
      fps: request.fps,
      tags: request.tags || [],
    };

    // Add competition if present
    if (request.competitionId) {
      (payload as any).competitionId = request.competitionId;
    }

    // Add music if present
    if ((request as any).music) {
      console.log('[videoUploadService] 🎵 [VERIFICATION] Adding music to reel payload');
      (payload as any).music = (request as any).music;
      console.log('  music:', JSON.stringify((payload as any).music));
    }

    // Spec: POST reels/publish
    console.log('[videoUploadService] 📊 [VERIFICATION] Posting to /reels/publish with payload:', JSON.stringify(payload));
    const response = await apiClient.post<any>("reels/publish", payload);
    const responseData = response.data as any;

    console.log('[videoUploadService] 🎬 [VERIFICATION] API response - code:', responseData.code);
    console.log('[videoUploadService] 🎬 [VERIFICATION] API response - full:', JSON.stringify(responseData));

    if (responseData.code === 1 && responseData.data) {
      console.log('[videoUploadService] ✅ [VERIFICATION] Reel created successfully');
      console.log('  reelId:', responseData.data.reelId || responseData.data.id);
      console.log('  videoUrl:', responseData.data.videoUrl || responseData.data.video_url);
      console.log('  status:', responseData.data.status || 'completed');
      
      return {
        success: true,
        data: {
          reelId: responseData.data.reelId || responseData.data.id,
          videoUrl: responseData.data.videoUrl || responseData.data.video_url,
          thumbnailUrl: responseData.data.thumbnailUrl,
          status: responseData.data.status || "completed",
          message: responseData.message || "Reel created successfully",
        },
        message: responseData.message || "Reel created successfully",
      };
    }

    console.error('[videoUploadService] ❌ [VERIFICATION FAILED] API returned error code:', responseData.code);
    return {
      success: false,
      message: responseData.message || "Failed to create reel",
      error: "API returned unsuccessful response",
      data: {
        reelId: "",
        videoUrl: "",
        status: "failed",
        message: "Failed to create reel",
      },
    };
  } catch (error: any) {
    console.error("[videoUploadService] ❌ [VERIFICATION FAILED] Create reel error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to create reel",
      error: error.message,
      data: {
        reelId: "",
        videoUrl: "",
        status: "failed",
        message: error.message,
      },
    };
  }
}

/**
 * Complete video upload pipeline
 * KIRO: Handles entire flow: Upload → Create Reel → Save to Gallery
 * PRODUCTION READY: Comprehensive error handling and progress tracking
 */
export async function uploadVideoComplete(
  videoUri: string,
  request: VideoUploadRequest,
  onProgress?: (stage: string, progress: number) => void
): Promise<ApiResponse<VideoUploadResponse>> {
  try {
    console.log("[videoUploadService] 🚀 [VERIFICATION] Starting complete upload pipeline");
    console.log('  videoUri:', videoUri?.substring(0, 60));
    console.log('  request:', JSON.stringify({
      title: request.title,
      duration: request.duration,
      resolution: request.resolution,
      music: (request as any).music
    }));

    // Validate input
    if (!videoUri || !request.title) {
      console.error('[videoUploadService] ❌ [VERIFICATION FAILED] Missing required fields');
      return {
        success: false,
        message: "Video URI and title are required",
        error: "Validation error",
        data: {
          reelId: "",
          videoUrl: "",
          status: "failed",
          message: "Missing required fields",
        },
      };
    }

    // Stage 1: Upload video file with retry logic
    console.log('[videoUploadService] 📊 [VERIFICATION] Stage 1: File upload starting');
    onProgress?.("uploading", 0);
    const uploadResult = await uploadVideoFile(videoUri, (prog) => {
      onProgress?.("uploading", prog.percentage);
    });

    if (!uploadResult.success || !uploadResult.data?.uploadId) {
      console.error('[videoUploadService] ❌ [VERIFICATION FAILED] File upload failed');
      return {
        success: false,
        message: uploadResult.message || "Video upload failed",
        error: uploadResult.error,
        data: {
          reelId: "",
          videoUrl: "",
          status: "failed",
          message: uploadResult.message || "File upload failed",
        },
      };
    }

    console.log('[videoUploadService] ✅ [VERIFICATION] Stage 1 complete - uploadId:', uploadResult.data?.uploadId);
    console.log('[videoUploadService] ✅ [VERIFICATION] Stage 1 complete - videoUrl:', uploadResult.data?.videoUrl?.substring(0, 60));

    // Stage 2: Create reel metadata
    console.log('[videoUploadService] 📊 [VERIFICATION] Stage 2: Creating reel metadata');
    console.log('  videoUrl:', uploadResult.data?.videoUrl);
    console.log('  title:', request.title);
    console.log('  description:', request.description);
    console.log('  music:', (request as any).music);
    
    onProgress?.("creating_reel", 60);
    // Pass videoUrl directly to create reel (backend expects video_url in publish payload)
    const reelResult = await createReelFromUpload(uploadResult.data?.videoUrl || "", request);

    if (!reelResult.success) {
      console.error('[videoUploadService] ❌ [VERIFICATION FAILED] Reel creation failed');
      return {
        success: false,
        message: reelResult.message || "Failed to create reel",
        error: reelResult.error,
        data: {
          reelId: "",
          videoUrl: "",
          status: "failed",
          message: reelResult.message || "Failed to create reel metadata",
        },
      };
    }

    console.log('[videoUploadService] ✅ [VERIFICATION] Stage 2 complete - reelId:', reelResult.data?.reelId);
    console.log('  videoUrl:', reelResult.data?.videoUrl?.substring(0, 60));
    console.log('  status:', reelResult.data?.status);

    // Stage 3: Save to gallery (optional, don't fail if it fails)
    console.log('[videoUploadService] 📊 [VERIFICATION] Stage 3: Saving to gallery (optional)');
    onProgress?.("saving_gallery", 85);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === "granted") {
        await MediaLibrary.saveToLibraryAsync(videoUri);
        console.log("[videoUploadService] ✅ [VERIFICATION] Video saved to gallery");
      } else {
        console.warn("[videoUploadService] ⚠️ Gallery permission not granted");
      }
    } catch (galleryError) {
      console.warn("[videoUploadService] ⚠️ Failed to save to gallery:", galleryError);
    }

    onProgress?.("completed", 100);

    console.log('[videoUploadService] ✅ [VERIFICATION] Complete upload pipeline succeeded');
    return {
      success: true,
      data: {
        reelId: reelResult.data?.reelId || "",
        videoUrl: reelResult.data?.videoUrl || "",
        status: reelResult.data?.status || "completed",
        message: reelResult.data?.message || "Video uploaded successfully",
      },
      message: "Video uploaded and reel created successfully",
    };
  } catch (error: any) {
    console.error("[videoUploadService] ❌ [VERIFICATION FAILED] Complete upload pipeline error:", error.message);
    return {
      success: false,
      message: error.message || "Upload pipeline failed",
      error: error.message,
      data: {
        reelId: "",
        videoUrl: "",
        status: "failed",
        message: error.message,
      },
    };
  }
}

/**
 * Get upload status
 * KIRO: Check status of ongoing upload
 */
export async function getUploadStatus(
  uploadId: string
): Promise<ApiResponse<{ status: string; progress: number }>> {
  try {
    console.log("[videoUploadService] Getting upload status:", uploadId);

    const response = await apiClient.get<any>(`reels/upload/${uploadId}/status`);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      return {
        success: true,
        data: {
          status: responseData.data.status,
          progress: responseData.data.progress || 0,
        },
        message: "Status retrieved successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to get status",
      error: "API returned unsuccessful response",
      data: { status: "unknown", progress: 0 },
    };
  } catch (error: any) {
    console.error("[videoUploadService] Get status error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to get upload status",
      error: error.message,
      data: { status: "error", progress: 0 },
    };
  }
}

/**
 * Cancel upload
 * KIRO: Cancel ongoing upload
 */
export async function cancelUpload(uploadId: string): Promise<ApiResponse<void>> {
  try {
    console.log("[videoUploadService] Cancelling upload:", uploadId);

    const response = await apiClient.post<any>(`reels/upload/${uploadId}/cancel`);
    const responseData = response.data as any;

    if (responseData.code === 1) {
      return {
        success: true,
        message: "Upload cancelled successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to cancel upload",
      error: "API returned unsuccessful response",
    };
  } catch (error: any) {
    console.error("[videoUploadService] Cancel error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to cancel upload",
      error: error.message,
    };
  }
}


/**
 * Save reel as draft
 * Spec: POST reels/draft
 */
export async function saveDraft(data: {
  video_url: string;
  caption?: string;
  music?: { id: string; name: string };
  tags?: string[];
  thumbnail_url?: string;
}): Promise<ApiResponse<{ draftId: string; savedAt: string }>> {
  try {
    console.log("[videoUploadService] Saving reel draft");
    const response = await apiClient.post<any>("reels/draft", data);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      return {
        success: true,
        data: {
          draftId: responseData.data.draftId || responseData.data.id,
          savedAt: responseData.data.savedAt || new Date().toISOString(),
        },
        message: responseData.message || "Draft saved successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to save draft",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[videoUploadService] Save draft error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to save draft",
      error: error.message,
      data: undefined,
    };
  }
}

/**
 * Get saved drafts
 * Spec: GET reels/draft
 */
export async function getDrafts(): Promise<ApiResponse<any[]>> {
  try {
    console.log("[videoUploadService] Fetching saved drafts");
    const response = await apiClient.get<any>("reels/draft");
    const responseData = response.data as any;

    if (responseData.code === 1) {
      let drafts = Array.isArray(responseData.data) ? responseData.data : responseData.data?.drafts || [];
      return {
        success: true,
        data: drafts,
        message: responseData.message || "Drafts fetched successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to fetch drafts",
      error: "API returned unsuccessful response",
      data: [],
    };
  } catch (error: any) {
    console.error("[videoUploadService] Get drafts error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to fetch drafts",
      error: error.message,
      data: [],
    };
  }
}
