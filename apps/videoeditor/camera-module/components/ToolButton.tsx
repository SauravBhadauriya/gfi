import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import editorTheme from '../constants/editorTheme';

interface ToolButtonProps {
  /** Icon as a React node (typically an SVG) */
  icon: React.ReactNode;
  /** Label text displayed below the icon */
  label: string;
  /** Whether the button is in active state */
  isActive?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Callback when pressed */
  onPress?: () => void;
  /** Icon size in pixels (default: 24) */
  iconSize?: number;
  /** Touch target size in pixels (minimum: 44) */
  size?: number;
}

/**
 * Generic reusable button component for editor toolbar
 * Supports active state, disabled state, and theme integration
 * Minimum 44x44px touch target for accessibility
 */
const ToolButton: React.FC<ToolButtonProps> = ({
  icon,
  label,
  isActive = false,
  disabled = false,
  onPress,
  iconSize = 24,
  size = 44,
}) => {
  const containerStyle = useMemo<ViewStyle>(() => {
    return {
      minWidth: size,
      minHeight: size,
      justifyContent: 'center',
      alignItems: 'center',
    };
  }, [size]);

  const iconContainerStyle = useMemo<ViewStyle>(() => {
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isActive
        ? editorTheme.colors.primaryLight
        : 'transparent',
    };
  }, [size, isActive]);

  const labelStyle = useMemo<TextStyle>(() => {
    return {
      color: isActive
        ? editorTheme.colors.primary
        : editorTheme.colors.textPrimary,
      fontSize: editorTheme.typography.micro,
      fontWeight: editorTheme.typography.fontWeights.medium as any,
    };
  }, [isActive]);

  const buttonOpacity = disabled ? 0.4 : 1;

  return (
    <TouchableOpacity
      style={[styles.button, { opacity: buttonOpacity }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={containerStyle}>
        <View style={iconContainerStyle}>{icon}</View>
      </View>
      <Text style={[styles.label, labelStyle]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    gap: editorTheme.spacing.sm,
  },
  label: {
    fontWeight: editorTheme.typography.fontWeights.medium as any,
    textAlign: 'center',
  },
});

export default ToolButton;
