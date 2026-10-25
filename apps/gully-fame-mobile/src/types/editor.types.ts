/**
 * Editor State Types
 * Single source of truth for video editor state management
 */

export interface Clip {
  id: string;
  uri: string;
  duration: number;
  trimStart?: number;
  trimEnd?: number;
  type: "video" | "photo";
  source: "camera" | "gallery";
  thumbnails?: {
    timeSeconds: number[];
    uris: string[];
  };
}

export interface Overlay {
  id: string;
  type: "sticker" | "image" | "shape";
  uri?: string;
  startTime: number;
  duration: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  scaleX: number;
  scaleY: number;
  thumbnails?: {
    timeSeconds: number[];
    uris: string[];
  };
}

export interface AudioTrack {
  id: string;
  trackId?: string;
  title: string;
  artist: string;
  url: string;
  startTime: number;
  duration: number;
  volume: number;
  trimStart?: number;
  trimEnd?: number;
  originalDuration: number;
}

/**
 * Shared shape of everything the user places over the media. Positions are the
 * normalized centre in the media frame, sizes are fractions of the frame width, and
 * times are seconds on the whole-project timeline (endTime null = until the end).
 */
export interface LayerBase {
  id: string;
  type: "text" | "sticker" | "doodle" | "caption" | "link";
  startTime: number;
  endTime: number | null;
}

export interface LayerTransform {
  /** Normalized centre, 0..1 of the frame. */
  x: number;
  y: number;
  scale: number;
  /** Degrees, clockwise. */
  rotation: number;
}

export interface StickerItem extends LayerBase, LayerTransform {
  type: "sticker";
  name: string;
  imageUrl: string;
  category: string;
  /** Unscaled box side as a fraction of the frame width. */
  size: number;
}

export interface DoodleItem extends LayerBase {
  type: "doodle";
  /** Stroke points, normalized to the frame (0..1). */
  points: { x: number; y: number }[];
  color: string;
  /** Stroke width as a fraction of the frame width. */
  width: number;
}

export interface CaptionItem extends LayerBase {
  type: "caption";
  text: string;
  endTime: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  position: "top" | "center" | "bottom";
  animation: "none" | "fade" | "slide" | "typewriter";
}

/** A tappable link shown by the player; stored as post metadata, never burned into the video. */
export interface LinkItem extends LayerBase, LayerTransform {
  type: "link";
  url: string;
  label: string;
}

/** Per-clip colour sliders (-100..100, vignette and sharpen 0..100). */
export interface EditorAdjust {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  temperature: number;
  vignette: number;
  sharpen: number;
}

export const NO_ADJUST: EditorAdjust = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  temperature: 0,
  vignette: 0,
  sharpen: 0,
};

export interface TextItem {
  id: string;
  type?: "text";
  text: string;
  startTime: number;
  /** null = until the end of the project. */
  endTime: number | null;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  fontFamily?: string;
  alignment?: "left" | "center" | "right";
  rotation: number;
  opacity: number;
  /** Preview text: x/y are the normalized centre in the media frame, fontSize a fraction of frame width. */
  scale?: number;
  background?: "none" | "solid" | "translucent";
  /** Unscaled box size as a fraction of the frame width/height (for export alignment). */
  boxWidth?: number;
  boxHeight?: number;
  /** Lines exactly as React Native wrapped them, so the export breaks lines identically. */
  lines?: string[];
}

/** Colour filter applied to the whole media (preview screen Filters). */
export interface EditorFilter {
  /** FilterId from components/preview/filterPresets. */
  id: string;
  /** 0..1, how strongly the preset is applied. */
  intensity: number;
}

export interface EditorState {
  /** Identifies the capture this edit session belongs to (the camera's clips param). */
  sessionKey: string | null;
  mediaType: "video" | "photo";
  clips: Clip[];
  overlays: Overlay[];
  audioTracks: AudioTrack[];
  texts: TextItem[];
  stickers: StickerItem[];
  doodles: DoodleItem[];
  captions: CaptionItem[];
  links: LinkItem[];
  adjust: EditorAdjust;
  /** Width / height of the preview frame, so every screen lays items out in the same shape. */
  frameAspect: number | null;
  filter: EditorFilter | null;
  currentTime: number;
  isPlaying: boolean;
  selectedItemId: string | null;
  undoStack: EditorState[];
  redoStack: EditorState[];
}

export interface EditorActions {
  addClip: (clip: Clip) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  
  addOverlay: (overlay: Overlay) => void;
  removeOverlay: (overlayId: string) => void;
  updateOverlay: (overlayId: string, updates: Partial<Overlay>) => void;
  
  addAudioTrack: (track: AudioTrack) => void;
  removeAudioTrack: (trackId: string) => void;
  updateAudioTrack: (trackId: string, updates: Partial<AudioTrack>) => void;
  
  addText: (text: TextItem) => void;
  removeText: (textId: string) => void;
  updateText: (textId: string, updates: Partial<TextItem>) => void;
  
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setSelectedItemId: (id: string | null) => void;
  
  undo: () => void;
  redo: () => void;
  reset: () => void;
}
