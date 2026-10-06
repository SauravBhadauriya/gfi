export interface VoiceOverlay {
  id: string;
  name?: string;
  uri: string;
  duration: number;
  startTime: number;
  volume: number;
  isMuted: boolean;
}

export interface SoundEffect {
  id: string;
  name: string;
  uri: string;
  duration: number;
  category: "transition" | "impact" | "ambient" | "music";
}

export interface Caption {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  style: "default" | "bold" | "italic" | "outline";
  position: "top" | "center" | "bottom";
}

export interface Link {
  id: string;
  url: string;
  text: string;
  startTime: number;
  endTime: number;
  position: { x: number; y: number };
}

export interface Cutout {
  id: string;
  type: "circle" | "rectangle" | "custom";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
}

export interface AdjustSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  temperature: number;
  tint: number;
  sharpness: number;
  blur: number;
}

export interface OverlayEffect {
  id: string;
  type: 'blur' | 'vignette' | 'watermark' | 'gradient';
  opacity: number;       // 0 to 1
  intensity: number;     // 0 to 1
}
