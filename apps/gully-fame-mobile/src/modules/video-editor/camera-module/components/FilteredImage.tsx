import React from 'react';
import { Image, ImageProps, StyleSheet, View, ViewStyle } from 'react-native';
import type { FilterConfig } from '../types/filters';
import { getFilterOverlayFromProperties } from '../utils/filterOverlays';

interface FilteredImageProps extends ImageProps {
  filter?: FilterConfig;
  source: { uri: string };
}

/**
 * Image component with filter support using overlay effects
 * Uses View overlays with colored backgrounds and opacity to simulate filter effects
 * This approach works without requiring native modules
 */
const FilteredImage: React.FC<FilteredImageProps> = ({ filter, style, ...props }) => {
  // If no filter or Original filter, render normal image
  if (!filter || filter.name === 'Original') {
    return <Image {...props} style={style} />;
  }

  console.log('FilteredImage applying filter:', filter.name, filter);

  const filterOverlayStyle = getFilterOverlayFromProperties(filter);

  // Get brightness overlay
  const getBrightnessOverlay = (): ViewStyle | null => {
    if (!filter) return null;

    const brightness = filter.brightness || 0;

    if (brightness !== 0) {
      const brightnessOverlay: ViewStyle = {
        ...StyleSheet.absoluteFill,
        pointerEvents: 'none',
      };

      if (brightness > 0) {
        brightnessOverlay.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        brightnessOverlay.opacity = Math.abs(brightness) * 0.5;
      } else {
        brightnessOverlay.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        brightnessOverlay.opacity = Math.abs(brightness) * 0.5;
      }

      return brightnessOverlay;
    }

    return null;
  };

  // Get contrast overlay
  const getContrastOverlay = (): ViewStyle | null => {
    if (!filter) return null;

    const contrast = filter.contrast || 1.0;

    if (contrast > 1.0 && filter.name !== 'Grayscale') {
      // High contrast - dark overlay
      const contrastOverlay: ViewStyle = {
        ...StyleSheet.absoluteFill,
        pointerEvents: 'none',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        opacity: (contrast - 1.0) * 0.2,
      };
      return contrastOverlay;
    } else if (contrast < 1.0 && filter.name !== 'Grayscale') {
      // Low contrast - light overlay
      const contrastOverlay: ViewStyle = {
        ...StyleSheet.absoluteFill,
        pointerEvents: 'none',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        opacity: (1.0 - contrast) * 0.15,
      };
      return contrastOverlay;
    }

    return null;
  };

  const brightnessOverlayStyle = getBrightnessOverlay();
  const contrastOverlayStyle = getContrastOverlay();

  return (
    <View style={style}>
      <Image {...props} style={StyleSheet.absoluteFill} />
      
      {/* Filter color overlay */}
      {filterOverlayStyle && (
        <View style={filterOverlayStyle} />
      )}
      
      {/* Contrast overlay */}
      {contrastOverlayStyle && (
        <View style={contrastOverlayStyle} />
      )}
      
      {/* Brightness overlay */}
      {brightnessOverlayStyle && (
        <View style={brightnessOverlayStyle} />
      )}
    </View>
  );
};

export default FilteredImage;
