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

export interface TextItem {
  id: string;
  text: string;
  startTime: number;
  duration: number;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  fontFamily?: string;
  alignment?: "left" | "center" | "right";
  rotation: number;
  opacity: number;
}

export interface EditorState {
  clips: Clip[];
  overlays: Overlay[];
  audioTracks: AudioTrack[];
  texts: TextItem[];
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
