/**
 * Centralized Theme Constants for Video Editor
 * Contains colors, typography, spacing, and design system tokens
 */

export const editorTheme = {
  /**
   * Color Palette
   */
  colors: {
    // Primary accent color
    primary: '#FF6B35',
    primaryLight: 'rgba(255, 107, 53, 0.2)',
    primaryOpacity: 'rgba(255, 107, 53, 0.6)',
    
    // Surface colors for dark theme
    surface: '#0A0A0A',
    surfaceRaised: '#1A1A1A',
    surfaceHover: '#2A2A2A',
    surfaceActive: '#333333',
    
    // Text colors
    textPrimary: '#FFFFFF',
    textSecondary: '#AAAAAA',
    textTertiary: '#555555',
    
    // Borders and dividers
    border: 'rgba(255, 255, 255, 0.1)',
    separator: 'rgba(255, 255, 255, 0.08)',
    
    // Disabled state
    disabled: 'rgba(255, 255, 255, 0.4)',
  },

  /**
   * Typography
   */
  typography: {
    // Font sizes
    heading: 18,
    body: 14,
    label: 12,
    micro: 10,
    
    // Font weights
    fontWeights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },

  /**
   * Spacing Scale
   */
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },

  /**
   * Border Radius
   */
  borderRadius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 999,
  },

  /**
   * Shadow Utilities for iOS and Android
   */
  shadows: {
    subtle: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    glow: {
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 4,
      elevation: 4,
    },
  },
};

export default editorTheme;
