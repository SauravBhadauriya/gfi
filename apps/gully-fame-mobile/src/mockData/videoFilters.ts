/**
 * Mock Video Filters & Effects Data
 * Used for video editor features
 */

export interface VideoFilter {
  id: string;
  name: string;
  category: 'filter' | 'effect' | 'transition' | 'sticker';
  thumbnail?: string;
  intensity?: number; // 0-100
  parameters?: Record<string, number | string>; // Allow both number and string values
  isPopular?: boolean;
  isPremium?: boolean;
}

// Photo Filters
export const mockVideoFilters: VideoFilter[] = [
  // Classic Filters
  {
    id: 'filter-paris',
    name: 'Paris',
    category: 'filter',
    intensity: 100,
    parameters: {
      brightness: 10,
      contrast: 5,
      saturation: 8,
      warmth: 15,
    },
    isPopular: true,
  },
  {
    id: 'filter-vintage',
    name: 'Vintage',
    category: 'filter',
    intensity: 100,
    parameters: {
      brightness: -5,
      contrast: 10,
      saturation: -20,
      warmth: 30,
    },
    isPopular: true,
  },
  {
    id: 'filter-cinematic',
    name: 'Cinematic',
    category: 'filter',
    intensity: 100,
    parameters: {
      brightness: 0,
      contrast: 15,
      saturation: 5,
      vignette: 20,
    },
    isPopular: true,
  },
  {
    id: 'filter-bw',
    name: 'B&W',
    category: 'filter',
    intensity: 100,
    parameters: {
      brightness: 0,
      contrast: 10,
      saturation: -100,
    },
    isPopular: true,
  },
  {
    id: 'filter-cool',
    name: 'Cool',
    category: 'filter',
    intensity: 100,
    parameters: {
      brightness: 5,
      contrast: 5,
      saturation: 10,
      coolness: 40,
    },
    isPopular: true,
  },

  // Modern Filters
  {
    id: 'filter-neon',
    name: 'Neon',
    category: 'filter',
    intensity: 100,
    parameters: {
      brightness: 10,
      contrast: 25,
      saturation: 50,
      vibrance: 60,
    },
  },
  {
    id: 'filter-sunset',
    name: 'Sunset',
    category: 'filter',
    intensity: 100,
    parameters: {
      brightness: 5,
      contrast: 8,
      saturation: 20,
      warmth: 50,
    },
  },
  {
    id: 'filter-dreamy',
    name: 'Dreamy',
    category: 'filter',
    intensity: 100,
    parameters: {
      brightness: 15,
      contrast: -5,
      saturation: 15,
      blur: 5,
    },
  },
  {
    id: 'filter-retro',
    name: 'Retro',
    category: 'filter',
    intensity: 100,
    parameters: {
      brightness: -10,
      contrast: 8,
      saturation: -30,
      grain: 20,
    },
  },
  {
    id: 'filter-vivid',
    name: 'Vivid',
    category: 'filter',
    intensity: 100,
    parameters: {
      brightness: 5,
      contrast: 20,
      saturation: 40,
      vibrance: 30,
    },
  },

  // Effects
  {
    id: 'effect-blur',
    name: 'Blur',
    category: 'effect',
    intensity: 50,
    parameters: { blurAmount: 10 },
  },
  {
    id: 'effect-zoom',
    name: 'Zoom',
    category: 'effect',
    intensity: 50,
    parameters: { zoomSpeed: 1.5 },
  },
  {
    id: 'effect-shake',
    name: 'Shake',
    category: 'effect',
    intensity: 30,
    parameters: { shakeIntensity: 5 },
  },
  {
    id: 'effect-glitch',
    name: 'Glitch',
    category: 'effect',
    intensity: 40,
    parameters: { glitchAmount: 8 },
  },
  {
    id: 'effect-slow-mo',
    name: 'Slow Mo',
    category: 'effect',
    intensity: 100,
    parameters: { slowMotionSpeed: 0.5 },
  },

  // Transitions
  {
    id: 'transition-fade',
    name: 'Fade',
    category: 'transition',
    intensity: 100,
    parameters: { duration: 300 },
  },
  {
    id: 'transition-slide',
    name: 'Slide',
    category: 'transition',
    intensity: 100,
    parameters: { duration: 400, direction: 'left' },
  },
  {
    id: 'transition-zoom',
    name: 'Zoom',
    category: 'transition',
    intensity: 100,
    parameters: { duration: 350, scale: 1.2 },
  },
  {
    id: 'transition-spin',
    name: 'Spin',
    category: 'transition',
    intensity: 100,
    parameters: { duration: 400, rotation: 360 },
  },

  // Stickers & Overlays
  {
    id: 'sticker-hearts',
    name: 'Hearts',
    category: 'sticker',
    intensity: 100,
  },
  {
    id: 'sticker-stars',
    name: 'Stars',
    category: 'sticker',
    intensity: 100,
  },
  {
    id: 'sticker-emoji-happy',
    name: 'Happy',
    category: 'sticker',
    intensity: 100,
  },
  {
    id: 'sticker-emoji-fire',
    name: 'Fire',
    category: 'sticker',
    intensity: 100,
  },
];

export const getFiltersByCategory = (
  category: 'filter' | 'effect' | 'transition' | 'sticker'
): VideoFilter[] => {
  return mockVideoFilters.filter((item) => item.category === category);
};

export const getPopularFilters = (): VideoFilter[] => {
  return mockVideoFilters
    .filter((f) => f.isPopular && f.category === 'filter')
    .slice(0, 5);
};

export const getAllFilters = (): VideoFilter[] => {
  return mockVideoFilters.filter((f) => f.category === 'filter');
};

export const getAllEffects = (): VideoFilter[] => {
  return mockVideoFilters.filter((f) => f.category === 'effect');
};

export const getAllTransitions = (): VideoFilter[] => {
  return mockVideoFilters.filter((f) => f.category === 'transition');
};

export const getAllStickers = (): VideoFilter[] => {
  return mockVideoFilters.filter((f) => f.category === 'sticker');
};
