export type CameraModuleScreenName = "Home" | "Camera" | "Preview";

// High-level camera configuration types
export type CameraMode = "photo" | "video";
export type FlashMode = "on" | "off";
export type Resolution = "HD" | "4K";
export type FrameRate = 24 | 30 | 60;
export type ColorMode = "SDR" | "HDR";

// Permission status values returned by expo-camera
export type PermissionStatus = "undetermined" | "denied" | "granted";

// Clip-level models used by the camera module
export type ClipType = "photo" | "video";
export type ClipSource = "camera" | "gallery";

/**
 * Represents a speed segment within a video recording.
 * - startTime: Start time in real video seconds (0-based)
 * - endTime: End time in real video seconds
 * - speed: Playback speed multiplier (0.3, 0.5, 1, 2, 3)
 */
export interface SpeedSegment {
  startTime: number;
  endTime: number;
  speed: number;
}

/**
 * Represents a single captured item in the clip list.
 * - id: stable identifier for React list keys and deletion.
 * - type: photo or video.
 * - uri: local file path/URI that can be displayed by RN components.
 * - duration: defined only for video clips (in seconds, when available).
 * - speed: (legacy) single speed multiplier for backward compatibility
 * - speedSegments: array of speed segments for speed-aware playback
 *   If speedSegments is provided, it takes precedence over speed.
 *   If neither is provided, defaults to 1x speed for the entire video.
 * - filterPreset: selected filter preset for export (stored as metadata)
 * - trimStart: start time within the original clip (for trimming, in seconds, default: 0)
 * - trimEnd: end time within the original clip (for trimming, in seconds, default: duration)
 * - timelineStart: start time in the composed timeline (calculated, in seconds)
 * - timelineEnd: end time in the composed timeline (calculated, in seconds)
 * - thumbnailUri: optional cached thumbnail URI for timeline preview
 * - textOverlays: text overlays added to the clip
 * - audioTracks: audio tracks (music, voiceover, sound effects) added to the clip
 * - transitions: transitions applied to this clip
 */
export interface CameraClip {
  id: string;
  uri: string;
  duration: number;
  type: ClipType;
  source: ClipSource;
  speed?: number; // Legacy: single speed multiplier (0.3, 0.5, 1, 2, 3, 5)
  speedConfig?: { type: 'constant'; value: number };
  musicOffset?: number;
  speedSegments?: SpeedSegment[]; // Speed segments for variable-speed playback
  filterPreset?: import("./filters").FilterPreset; // Selected filter preset for export
  trimStart?: number; // Start trim point in original clip (seconds, default: 0)
  trimEnd?: number; // End trim point in original clip (seconds, default: duration)
  timelineStart?: number; // Start time in composed timeline (calculated)
  timelineEnd?: number; // End time in composed timeline (calculated)
  thumbnailUri?: string; // Cached thumbnail for timeline display
  textOverlays?: import("./textOverlay.types").TextOverlay[]; // Text overlays added to the clip
  audioTracks?: import("./music.types").AudioTrack[]; // Audio tracks (music, voiceover, sound effects)
  audioTracksEnhanced?: import("./audioEffects.types").AudioTrackWithEffects[]; // Enhanced audio tracks with effects
  transitions?: import("./transitions.types").ClipTransition[]; // Transitions applied to this clip
  // New properties for video settings
  resolution?: import("./camera.types").Resolution; // Video resolution (HD, 4K)
  frameRate?: import("./camera.types").FrameRate; // Frame rate (24, 30, 60 fps)
  colorMode?: import("./camera.types").ColorMode; // Color mode (SDR, HDR)
  // New properties for advanced features
  voiceOverlays?: import("./voiceOverlay.types").VoiceOverlay[]; // Voice recordings
  voiceOverlaysEnhanced?: import("./audioEffects.types").VoiceOverlayWithEffects[]; // Enhanced voice overlays with effects
  soundEffects?: import("./voiceOverlay.types").SoundEffect[]; // Sound effects
  textToSpeech?: import("./audioEffects.types").TextToSpeechConfig[]; // Text-to-speech audio
  captions?: import("./voiceOverlay.types").Caption[]; // Captions/subtitles
  links?: import("./voiceOverlay.types").Link[]; // Interactive links
  cutouts?: import("./voiceOverlay.types").Cutout[]; // Cutout effects
  adjustSettings?: import("./voiceOverlay.types").AdjustSettings; // Brightness, contrast, etc.
  overlayEffects?: import("./voiceOverlay.types").OverlayEffect[]; // Blur, vignette, watermark, gradient
  audioMixSettings?: import("./audioEffects.types").AudioMixSettings; // Master audio mix settings
}

export type CameraClipArray = CameraClip[];
