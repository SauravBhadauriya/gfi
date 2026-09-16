
import apiClient from "../axios";
import { ApiResponse } from "../types";
import * as mockVideoFilters from "../../mockData/videoFilters";

export interface VideoClip {
  id: string;
  uri: string;
  duration: number;
  startTime?: number;
  endTime?: number;
  thumbnail?: string;
}

export interface VideoFilter {
  id: string;
  name: string;
  type: "brightness" | "contrast" | "saturation" | "hue" | "blur" | "sepia" | "grayscale";
  value: number;
  min?: number;
  max?: number;
}

export interface VideoEffect {
  id: string;
  name: string;
  type: "transition" | "text" | "sticker" | "music" | "voiceover";
  duration?: number;
  startTime?: number;
  endTime?: number;
  data?: any;
}

export interface VideoText {
  id: string;
  text: string;
  fontSize: number;
  color: string;
  fontFamily?: string;
  position: "top" | "center" | "bottom";
  startTime: number;
  endTime: number;
  opacity?: number;
}

export interface VideoMusic {
  id: string;
  title: string;
  artist?: string;
  duration: number;
  audioUrl: string;
  startTime?: number;
  volume?: number;
}

export interface VideoExportOptions {
  quality: "low" | "medium" | "high" | "ultra";
  resolution: "360p" | "480p" | "720p" | "1080p";
  format: "mp4" | "mov" | "webm";
  bitrate?: number;
  fps?: number;
}

export interface EditingSession {
  id: string;
  videoUri: string;
  clips?: VideoClip[];
  filters?: VideoFilter[];
  effects?: VideoEffect[];
  texts?: VideoText[];
  music?: VideoMusic[];
  duration: number;
  createdAt: string;
  updatedAt: string;
}

// ✅ CREATED BY KIRO - Create new editing session
export async function createEditingSession(videoUri: string): Promise<ApiResponse<EditingSession>> {
  try {
    console.log("[videoEditorService] Creating editing session:", videoUri);

    const response = await apiClient.post<any>("video-editor/session", {
      videoUri,
    });
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const session: EditingSession = {
        id: responseData.data.id,
        videoUri: responseData.data.videoUri,
        clips: responseData.data.clips || [],
        filters: responseData.data.filters || [],
        effects: responseData.data.effects || [],
        texts: responseData.data.texts || [],
        music: responseData.data.music,
        duration: responseData.data.duration || 0,
        createdAt: responseData.data.createdAt,
        updatedAt: responseData.data.updatedAt,
      };

      console.log("[videoEditorService] Editing session created:", session.id);

      return {
        success: true,
        data: session,
        message: responseData.message || "Editing session created successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to create editing session",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[videoEditorService] Create session error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Network error occurred",
      error: error.message,
      data: undefined,
    };
  }
}

// ✅ CREATED BY KIRO - Trim video
export async function trimVideo(
  sessionId: string,
  startTime: number,
  endTime: number
): Promise<ApiResponse<VideoClip>> {
  try {
    console.log("[videoEditorService] Trimming video:", {
      sessionId,
      startTime,
      endTime,
    });

    const response = await apiClient.post<any>(`video-editor/${sessionId}/trim`, {
      startTime,
      endTime,
    });
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const clip: VideoClip = {
        id: responseData.data.id,
        uri: responseData.data.uri,
        duration: responseData.data.duration,
        startTime: responseData.data.startTime,
        endTime: responseData.data.endTime,
        thumbnail: responseData.data.thumbnail,
      };

      console.log("[videoEditorService] Video trimmed successfully");

      return {
        success: true,
        data: clip,
        message: responseData.message || "Video trimmed successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to trim video",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[videoEditorService] Trim video error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Trim failed",
      error: error.message,
      data: undefined,
    };
  }
}

// ✅ CREATED BY KIRO - Apply filter to video
export async function applyFilter(
  sessionId: string,
  filter: VideoFilter
): Promise<ApiResponse<VideoFilter>> {
  try {
    console.log("[videoEditorService] Applying filter:", { sessionId, filter });

    const response = await apiClient.post<any>(`video-editor/${sessionId}/filter`, filter);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const appliedFilter: VideoFilter = {
        id: responseData.data.id,
        name: responseData.data.name,
        type: responseData.data.type,
        value: responseData.data.value,
        min: responseData.data.min,
        max: responseData.data.max,
      };

      console.log("[videoEditorService] Filter applied successfully");

      return {
        success: true,
        data: appliedFilter,
        message: responseData.message || "Filter applied successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to apply filter",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[videoEditorService] Apply filter error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Filter application failed",
      error: error.message,
      data: undefined,
    };
  }
}

// ✅ CREATED BY KIRO - Add text overlay to video
export async function addTextOverlay(
  sessionId: string,
  text: VideoText
): Promise<ApiResponse<VideoText>> {
  try {
    console.log("[videoEditorService] Adding text overlay:", { sessionId, text });

    const response = await apiClient.post<any>(`video-editor/${sessionId}/text`, text);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const addedText: VideoText = {
        id: responseData.data.id,
        text: responseData.data.text,
        fontSize: responseData.data.fontSize,
        color: responseData.data.color,
        fontFamily: responseData.data.fontFamily,
        position: responseData.data.position,
        startTime: responseData.data.startTime,
        endTime: responseData.data.endTime,
        opacity: responseData.data.opacity,
      };

      console.log("[videoEditorService] Text overlay added successfully");

      return {
        success: true,
        data: addedText,
        message: responseData.message || "Text overlay added successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to add text overlay",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[videoEditorService] Add text error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Text addition failed",
      error: error.message,
      data: undefined,
    };
  }
}

// ✅ CREATED BY KIRO - Add music to video
export async function addMusic(
  sessionId: string,
  music: VideoMusic
): Promise<ApiResponse<VideoMusic>> {
  try {
    console.log("[videoEditorService] Adding music:", { sessionId, music });

    const response = await apiClient.post<any>(`video-editor/${sessionId}/music`, music);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const addedMusic: VideoMusic = {
        id: responseData.data.id,
        title: responseData.data.title,
        artist: responseData.data.artist,
        duration: responseData.data.duration,
        audioUrl: responseData.data.audioUrl,
        startTime: responseData.data.startTime,
        volume: responseData.data.volume,
      };

      console.log("[videoEditorService] Music added successfully");

      return {
        success: true,
        data: addedMusic,
        message: responseData.message || "Music added successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to add music",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[videoEditorService] Add music error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Music addition failed",
      error: error.message,
      data: undefined,
    };
  }
}

// ✅ CREATED BY KIRO - Add voiceover to video
export async function addVoiceover(
  sessionId: string,
  voiceover: VideoEffect
): Promise<ApiResponse<VideoEffect>> {
  try {
    console.log("[videoEditorService] Adding voiceover:", { sessionId, voiceover });

    const response = await apiClient.post<any>(`video-editor/${sessionId}/voiceover`, voiceover);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const addedVoiceover: VideoEffect = {
        id: responseData.data.id,
        name: responseData.data.name || "Voiceover",
        type: "voiceover",
        duration: responseData.data.duration,
        startTime: responseData.data.startTime,
        endTime: responseData.data.endTime,
        data: responseData.data.data,
      };

      console.log("[videoEditorService] Voiceover added successfully");

      return {
        success: true,
        data: addedVoiceover,
        message: responseData.message || "Voiceover added successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to add voiceover",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[videoEditorService] Add voiceover error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Voiceover addition failed",
      error: error.message,
      data: undefined,
    };
  }
}

// ✅ CREATED BY KIRO - Add sound effect to video
export async function addSoundEffect(
  sessionId: string,
  soundEffect: VideoEffect
): Promise<ApiResponse<VideoEffect>> {
  try {
    console.log("[videoEditorService] Adding sound effect:", { sessionId, soundEffect });

    const response = await apiClient.post<any>(`video-editor/${sessionId}/soundfx`, soundEffect);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const addedEffect: VideoEffect = {
        id: responseData.data.id,
        name: responseData.data.name,
        type: "music",
        duration: responseData.data.duration,
        startTime: responseData.data.startTime,
        endTime: responseData.data.endTime,
        data: responseData.data.data,
      };

      console.log("[videoEditorService] Sound effect added successfully");

      return {
        success: true,
        data: addedEffect,
        message: responseData.message || "Sound effect added successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to add sound effect",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[videoEditorService] Add sound effect error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Sound effect addition failed",
      error: error.message,
      data: undefined,
    };
  }
}

// ✅ CREATED BY KIRO - Add transition effect
export async function addTransition(
  sessionId: string,
  effect: VideoEffect
): Promise<ApiResponse<VideoEffect>> {
  try {
    console.log("[videoEditorService] Adding transition:", { sessionId, effect });

    const response = await apiClient.post<any>(`video-editor/${sessionId}/transition`, effect);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const addedEffect: VideoEffect = {
        id: responseData.data.id,
        name: responseData.data.name,
        type: responseData.data.type,
        duration: responseData.data.duration,
        startTime: responseData.data.startTime,
        endTime: responseData.data.endTime,
        data: responseData.data.data,
      };

      console.log("[videoEditorService] Transition added successfully");

      return {
        success: true,
        data: addedEffect,
        message: responseData.message || "Transition added successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to add transition",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[videoEditorService] Add transition error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Transition addition failed",
      error: error.message,
      data: undefined,
    };
  }
}

// ✅ CREATED BY KIRO - Export edited video
export async function exportVideo(
  sessionId: string,
  options: VideoExportOptions
): Promise<ApiResponse<{ videoUri: string; duration: number }>> {
  try {
    console.log("[videoEditorService] Exporting video:", { sessionId, options });

    const response = await apiClient.post<any>(`video-editor/${sessionId}/export`, options);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const exportedVideo = {
        videoUri: responseData.data.videoUri,
        duration: responseData.data.duration,
      };

      console.log("[videoEditorService] Video exported successfully");

      return {
        success: true,
        data: exportedVideo,
        message: responseData.message || "Video exported successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to export video",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[videoEditorService] Export video error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Export failed",
      error: error.message,
      data: undefined,
    };
  }
}

// ✅ CREATED BY KIRO - Get editing session
export async function getEditingSession(sessionId: string): Promise<ApiResponse<EditingSession>> {
  try {
    console.log("[videoEditorService] Getting editing session:", sessionId);

    const response = await apiClient.get<any>(`video-editor/${sessionId}`);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const session: EditingSession = {
        id: responseData.data.id,
        videoUri: responseData.data.videoUri,
        clips: responseData.data.clips || [],
        filters: responseData.data.filters || [],
        effects: responseData.data.effects || [],
        texts: responseData.data.texts || [],
        music: responseData.data.music,
        duration: responseData.data.duration || 0,
        createdAt: responseData.data.createdAt,
        updatedAt: responseData.data.updatedAt,
      };

      console.log("[videoEditorService] Editing session retrieved");

      return {
        success: true,
        data: session,
        message: responseData.message || "Editing session retrieved successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to get editing session",
      error: "API returned unsuccessful response",
      data: undefined,
    };
  } catch (error: any) {
    console.error("[videoEditorService] Get session error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Network error occurred",
      error: error.message,
      data: undefined,
    };
  }
}

// ✅ CREATED BY KIRO - Delete editing session
export async function deleteEditingSession(sessionId: string): Promise<ApiResponse<boolean>> {
  try {
    console.log("[videoEditorService] Deleting editing session:", sessionId);

    const response = await apiClient.delete<any>(`video-editor/${sessionId}`);
    const responseData = response.data as any;

    if (responseData.code === 1) {
      console.log("[videoEditorService] Editing session deleted");

      return {
        success: true,
        data: true,
        message: responseData.message || "Editing session deleted successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to delete editing session",
      error: "API returned unsuccessful response",
      data: false,
    };
  } catch (error: any) {
    console.error("[videoEditorService] Delete session error:", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Network error occurred",
      error: error.message,
      data: false,
    };
  }
}

// ✅ CREATED BY KIRO - Get all available video filters with mock fallback
export async function getVideoFilters(): Promise<ApiResponse<mockVideoFilters.VideoFilter[]>> {
  try {
    console.log("[videoEditorService] Fetching video filters");

    const response = await apiClient.get<any>("video-editor/filters");
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const filters = Array.isArray(responseData.data)
        ? responseData.data
        : responseData.data.filters || [];

      console.log(`[videoEditorService] Loaded ${filters.length} filters from API`);

      return {
        success: true,
        data: filters,
        message: responseData.message || "Filters loaded successfully",
      };
    }

    // Fall back to mock data
    console.warn("[videoEditorService] API returned error for filters, using mock data");
    return _getMockFilters();
  } catch (error: any) {
    console.warn("[videoEditorService] Failed to fetch filters, falling back to mock data:", error.message);
    return _getMockFilters();
  }
}

// ✅ CREATED BY KIRO - Get all available video effects with mock fallback
export async function getVideoEffects(): Promise<ApiResponse<mockVideoFilters.VideoFilter[]>> {
  try {
    console.log("[videoEditorService] Fetching video effects");

    const response = await apiClient.get<any>("video-editor/effects");
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const effects = Array.isArray(responseData.data)
        ? responseData.data
        : responseData.data.effects || [];

      console.log(`[videoEditorService] Loaded ${effects.length} effects from API`);

      return {
        success: true,
        data: effects,
        message: responseData.message || "Effects loaded successfully",
      };
    }

    // Fall back to mock data
    console.warn("[videoEditorService] API returned error for effects, using mock data");
    return _getMockEffects();
  } catch (error: any) {
    console.warn("[videoEditorService] Failed to fetch effects, falling back to mock data:", error.message);
    return _getMockEffects();
  }
}

// ✅ CREATED BY KIRO - Get all available transitions with mock fallback
export async function getVideoTransitions(): Promise<ApiResponse<mockVideoFilters.VideoFilter[]>> {
  try {
    console.log("[videoEditorService] Fetching video transitions");

    const response = await apiClient.get<any>("video-editor/transitions");
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const transitions = Array.isArray(responseData.data)
        ? responseData.data
        : responseData.data.transitions || [];

      console.log(`[videoEditorService] Loaded ${transitions.length} transitions from API`);

      return {
        success: true,
        data: transitions,
        message: responseData.message || "Transitions loaded successfully",
      };
    }

    // Fall back to mock data
    console.warn("[videoEditorService] API returned error for transitions, using mock data");
    return _getMockTransitions();
  } catch (error: any) {
    console.warn("[videoEditorService] Failed to fetch transitions, falling back to mock data:", error.message);
    return _getMockTransitions();
  }
}

// ✅ CREATED BY KIRO - Get all available stickers with mock fallback
export async function getVideoStickers(): Promise<ApiResponse<mockVideoFilters.VideoFilter[]>> {
  try {
    console.log("[videoEditorService] Fetching video stickers");

    const response = await apiClient.get<any>("video-editor/stickers");
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const stickers = Array.isArray(responseData.data)
        ? responseData.data
        : responseData.data.stickers || [];

      console.log(`[videoEditorService] Loaded ${stickers.length} stickers from API`);

      return {
        success: true,
        data: stickers,
        message: responseData.message || "Stickers loaded successfully",
      };
    }

    // Fall back to mock data
    console.warn("[videoEditorService] API returned error for stickers, using mock data");
    return _getMockStickers();
  } catch (error: any) {
    console.warn("[videoEditorService] Failed to fetch stickers, falling back to mock data:", error.message);
    return _getMockStickers();
  }
}

// ✅ Internal helpers for mock data fallback

function _getMockFilters(): ApiResponse<mockVideoFilters.VideoFilter[]> {
  const filters = mockVideoFilters.getAllFilters();
  console.log(`[videoEditorService] Using mock filters - Loaded ${filters.length} filters`);
  return {
    success: true,
    data: filters,
    message: "Using mock filters (API unavailable)",
  };
}

function _getMockEffects(): ApiResponse<mockVideoFilters.VideoFilter[]> {
  const effects = mockVideoFilters.getAllEffects();
  console.log(`[videoEditorService] Using mock effects - Loaded ${effects.length} effects`);
  return {
    success: true,
    data: effects,
    message: "Using mock effects (API unavailable)",
  };
}

function _getMockTransitions(): ApiResponse<mockVideoFilters.VideoFilter[]> {
  const transitions = mockVideoFilters.getAllTransitions();
  console.log(`[videoEditorService] Using mock transitions - Loaded ${transitions.length} transitions`);
  return {
    success: true,
    data: transitions,
    message: "Using mock transitions (API unavailable)",
  };
}

function _getMockStickers(): ApiResponse<mockVideoFilters.VideoFilter[]> {
  const stickers = mockVideoFilters.getAllStickers();
  console.log(`[videoEditorService] Using mock stickers - Loaded ${stickers.length} stickers`);
  return {
    success: true,
    data: stickers,
    message: "Using mock stickers (API unavailable)",
  };
}

export const videoEditorService = {
  createEditingSession,
  trimVideo,
  applyFilter,
  addTextOverlay,
  addMusic,
  addVoiceover,
  addSoundEffect,
  addTransition,
  exportVideo,
  getEditingSession,
  deleteEditingSession,
  getVideoFilters,
  getVideoEffects,
  getVideoTransitions,
  getVideoStickers,
};
