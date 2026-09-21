import { StyleSheet, ViewStyle } from 'react-native';
import type { FilterConfig } from '../types/filters';

/**
 * Generate filter overlay style based on filter properties
 * This creates visual preview effects using colored overlays
 * Shared utility for FilteredImage, FilteredVideo, and FilterThumbnail
 */
export const getFilterOverlayFromProperties = (filter: FilterConfig): ViewStyle | null => {
  const overlayStyle: ViewStyle = {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'none',
  };

  let hasOverlay = false;
  const { saturation, temperature, contrast, name } = filter;

  // Handle grayscale (saturation 0)
  if (saturation === 0) {
    // Base grayscale overlay
    overlayStyle.backgroundColor = 'rgba(128, 128, 128, 0.6)';
    overlayStyle.opacity = 0.8;
    hasOverlay = true;

    // Adjust based on temperature for cool/warm grayscale
    if (temperature !== undefined && temperature !== 0) {
      if (temperature > 0) {
        // Warm grayscale (sepia-like)
        overlayStyle.backgroundColor = 'rgba(220, 200, 150, 0.6)';
      } else {
        // Cool grayscale (blue-tinted)
        overlayStyle.backgroundColor = 'rgba(150, 180, 200, 0.6)';
      }
    }

    // Adjust opacity based on contrast
    if (contrast !== undefined) {
      if (contrast > 1.0) {
        overlayStyle.opacity = 0.9; // Higher contrast = more visible
      } else if (contrast < 1.0) {
        overlayStyle.opacity = 0.6; // Lower contrast = softer
      }
    }

    return overlayStyle;
  }

  // Handle color filters based on temperature and name
  if (temperature !== undefined && temperature !== 0 && !hasOverlay) {
    if (temperature > 0) {
      // Warm tones
      overlayStyle.backgroundColor = 'rgba(255, 200, 100, 0.25)';
      overlayStyle.opacity = Math.min(0.5, Math.abs(temperature) * 0.4 + 0.25);
    } else {
      // Cool tones
      overlayStyle.backgroundColor = 'rgba(150, 200, 255, 0.25)';
      overlayStyle.opacity = Math.min(0.5, Math.abs(temperature) * 0.4 + 0.25);
    }
    hasOverlay = true;
  }

  // Special named filters with specific overlays
  switch (name) {
    case 'Boost':
      overlayStyle.backgroundColor = 'rgba(255, 150, 100, 0.2)';
      overlayStyle.opacity = 0.3;
      hasOverlay = true;
      break;
    
    case 'Toasty':
      overlayStyle.backgroundColor = 'rgba(255, 180, 120, 0.3)';
      overlayStyle.opacity = 0.4;
      hasOverlay = true;
      break;
    
    case 'Subtle':
      overlayStyle.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      overlayStyle.opacity = 0.2;
      hasOverlay = true;
      break;
    
    case 'Light':
      overlayStyle.backgroundColor = 'rgba(255, 255, 255, 0.25)';
      overlayStyle.opacity = 0.3;
      hasOverlay = true;
      break;
    
    case 'Fresh':
      overlayStyle.backgroundColor = 'rgba(150, 220, 200, 0.2)';
      overlayStyle.opacity = 0.3;
      hasOverlay = true;
      break;
    
    case 'Lively':
      overlayStyle.backgroundColor = 'rgba(255, 120, 120, 0.2)';
      overlayStyle.opacity = 0.3;
      hasOverlay = true;
      break;
    
    case 'Crisp':
      overlayStyle.backgroundColor = 'rgba(200, 200, 255, 0.15)';
      overlayStyle.opacity = 0.25;
      hasOverlay = true;
      break;
    
    case 'Fade':
      overlayStyle.backgroundColor = 'rgba(255, 255, 255, 0.15)';
      overlayStyle.opacity = 0.25;
      hasOverlay = true;
      break;
    
    case 'Shade':
      overlayStyle.backgroundColor = 'rgba(0, 0, 0, 0.25)';
      overlayStyle.opacity = 0.35;
      hasOverlay = true;
      break;
    
    case 'Summer':
      overlayStyle.backgroundColor = 'rgba(255, 200, 100, 0.3)';
      overlayStyle.opacity = 0.4;
      hasOverlay = true;
      break;
    
    case 'Spring':
      overlayStyle.backgroundColor = 'rgba(255, 220, 180, 0.25)';
      overlayStyle.opacity = 0.35;
      hasOverlay = true;
      break;
    
    case 'Autumn':
      overlayStyle.backgroundColor = 'rgba(220, 150, 100, 0.3)';
      overlayStyle.opacity = 0.4;
      hasOverlay = true;
      break;
    
    case 'Antique':
      overlayStyle.backgroundColor = 'rgba(220, 180, 140, 0.35)';
      overlayStyle.opacity = 0.45;
      hasOverlay = true;
      break;
    
    case 'Wash':
      overlayStyle.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      overlayStyle.opacity = 0.3;
      hasOverlay = true;
      break;
    
    case 'Disposable':
      overlayStyle.backgroundColor = 'rgba(200, 200, 180, 0.2)';
      overlayStyle.opacity = 0.3;
      hasOverlay = true;
      break;
    
    case 'Lounge':
      overlayStyle.backgroundColor = 'rgba(50, 50, 100, 0.3)';
      overlayStyle.opacity = 0.4;
      hasOverlay = true;
      break;
    
    // Cool variants
    case 'Simple Cool':
    case 'Fade Cool':
      overlayStyle.backgroundColor = 'rgba(150, 200, 255, 0.25)';
      overlayStyle.opacity = 0.35;
      hasOverlay = true;
      break;
    
    case 'Boost Cool':
      overlayStyle.backgroundColor = 'rgba(120, 180, 255, 0.3)';
      overlayStyle.opacity = 0.4;
      hasOverlay = true;
      break;
    
    case 'Frosty':
      overlayStyle.backgroundColor = 'rgba(180, 220, 255, 0.3)';
      overlayStyle.opacity = 0.4;
      hasOverlay = true;
      break;
    
    case 'Indigo':
      overlayStyle.backgroundColor = 'rgba(100, 120, 200, 0.35)';
      overlayStyle.opacity = 0.45;
      hasOverlay = true;
      break;
    
    case 'Denim':
      overlayStyle.backgroundColor = 'rgba(80, 120, 180, 0.3)';
      overlayStyle.opacity = 0.4;
      hasOverlay = true;
      break;
    
    // Warm variants
    case 'Simple Warm':
    case 'Fade Warm':
      overlayStyle.backgroundColor = 'rgba(255, 200, 100, 0.25)';
      overlayStyle.opacity = 0.35;
      hasOverlay = true;
      break;
    
    case 'Boost Warm':
      overlayStyle.backgroundColor = 'rgba(255, 180, 80, 0.3)';
      overlayStyle.opacity = 0.4;
      hasOverlay = true;
      break;
    
    case 'Vintage Warm':
      overlayStyle.backgroundColor = 'rgba(220, 180, 140, 0.4)';
      overlayStyle.opacity = 0.5;
      hasOverlay = true;
      break;
    
    case 'Latte':
      overlayStyle.backgroundColor = 'rgba(220, 200, 160, 0.3)';
      overlayStyle.opacity = 0.4;
      hasOverlay = true;
      break;
    
    // Location-based
    case 'Oslo':
      overlayStyle.backgroundColor = 'rgba(150, 180, 220, 0.3)';
      overlayStyle.opacity = 0.4;
      hasOverlay = true;
      break;
    
    case 'Paris':
      overlayStyle.backgroundColor = 'rgba(255, 220, 200, 0.25)';
      overlayStyle.opacity = 0.35;
      hasOverlay = true;
      break;
    
    case 'Jakarta':
      overlayStyle.backgroundColor = 'rgba(255, 200, 120, 0.3)';
      overlayStyle.opacity = 0.4;
      hasOverlay = true;
      break;
    
    case 'New York':
      overlayStyle.backgroundColor = 'rgba(180, 180, 200, 0.25)';
      overlayStyle.opacity = 0.35;
      hasOverlay = true;
      break;
    
    case 'Los Angeles':
      overlayStyle.backgroundColor = 'rgba(255, 220, 150, 0.35)';
      overlayStyle.opacity = 0.45;
      hasOverlay = true;
      break;
    
    case 'Abu Dhabi':
      overlayStyle.backgroundColor = 'rgba(255, 200, 140, 0.35)';
      overlayStyle.opacity = 0.45;
      hasOverlay = true;
      break;
    
    case 'Rio de Janeiro':
      overlayStyle.backgroundColor = 'rgba(255, 180, 100, 0.35)';
      overlayStyle.opacity = 0.45;
      hasOverlay = true;
      break;
    
    // Special effects
    case 'Negative':
      overlayStyle.backgroundColor = 'rgba(255, 255, 255, 0.8)';
      overlayStyle.opacity = 0.95;
      hasOverlay = true;
      break;
    
    case 'Jade Vibrant':
      overlayStyle.backgroundColor = 'rgba(100, 220, 180, 0.3)';
      overlayStyle.opacity = 0.4;
      hasOverlay = true;
      break;
    
    case 'Bubblegum':
      overlayStyle.backgroundColor = 'rgba(255, 150, 200, 0.3)';
      overlayStyle.opacity = 0.4;
      hasOverlay = true;
      break;
    
    case 'Rosy':
      overlayStyle.backgroundColor = 'rgba(255, 180, 180, 0.25)';
      overlayStyle.opacity = 0.35;
      hasOverlay = true;
      break;
    
    case 'Halo':
      overlayStyle.backgroundColor = 'rgba(255, 255, 220, 0.25)';
      overlayStyle.opacity = 0.35;
      hasOverlay = true;
      break;
    
    // Legacy filters
    case 'Grayscale':
      overlayStyle.backgroundColor = 'rgba(128, 128, 128, 0.6)';
      overlayStyle.opacity = 0.8;
      hasOverlay = true;
      break;
    
    case 'Warm':
      overlayStyle.backgroundColor = 'rgba(255, 200, 100, 0.25)';
      overlayStyle.opacity = 0.35;
      hasOverlay = true;
      break;
    
    case 'Cool':
      overlayStyle.backgroundColor = 'rgba(150, 200, 255, 0.25)';
      overlayStyle.opacity = 0.35;
      hasOverlay = true;
      break;
    
    case 'Vintage':
      overlayStyle.backgroundColor = 'rgba(220, 180, 140, 0.35)';
      overlayStyle.opacity = 0.5;
      hasOverlay = true;
      break;
    
    case 'Dramatic':
      overlayStyle.backgroundColor = 'rgba(0, 0, 0, 0.2)';
      overlayStyle.opacity = 0.4;
      hasOverlay = true;
      break;
    
    case 'Soft':
      overlayStyle.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      overlayStyle.opacity = 0.3;
      hasOverlay = true;
      break;
    
    case 'Cinematic':
      overlayStyle.backgroundColor = 'rgba(200, 150, 100, 0.3)';
      overlayStyle.opacity = 0.4;
      hasOverlay = true;
      break;
    
    case 'Vibrant':
      overlayStyle.backgroundColor = 'rgba(255, 100, 100, 0.15)';
      overlayStyle.opacity = 0.25;
      hasOverlay = true;
      break;
    
    case 'Moody':
      overlayStyle.backgroundColor = 'rgba(50, 50, 100, 0.35)';
      overlayStyle.opacity = 0.5;
      hasOverlay = true;
      break;
  }

  return hasOverlay ? overlayStyle : null;
};

