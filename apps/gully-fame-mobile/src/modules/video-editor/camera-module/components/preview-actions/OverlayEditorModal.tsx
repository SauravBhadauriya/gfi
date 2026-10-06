import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { OverlayEffect } from '../../types/voiceOverlay.types';

interface OverlayEditorModalProps {
  visible: boolean;
  onClose: () => void;
  onApply?: (overlay: OverlayEffect) => void;
}

const OVERLAY_TYPES = [
  { id: 'blur', label: 'Blur', icon: '🔆' },
  { id: 'vignette', label: 'Vignette', icon: '◯' },
  { id: 'watermark', label: 'Watermark', icon: '✓' },
  { id: 'gradient', label: 'Gradient', icon: '▬' },
];

const OverlayEditorModal: React.FC<OverlayEditorModalProps> = ({
  visible,
  onClose,
  onApply,
}) => {
  const [selectedType, setSelectedType] = useState<'blur' | 'vignette' | 'watermark' | 'gradient'>('blur');
  const [opacity, setOpacity] = useState(0.5);
  const [intensity, setIntensity] = useState(0.5);

  const handleApply = () => {
    onApply?.({
      id: `overlay-${Date.now()}`,
      type: selectedType,
      opacity,
      intensity,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M18 6L6 18M6 6l12 12"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.title}>Overlay Effects</Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Overlay Type Selection */}
          <Text style={styles.label}>Select Overlay Type</Text>
          <View style={styles.typeGrid}>
            {OVERLAY_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeButton,
                  selectedType === type.id && styles.typeButtonActive,
                ]}
                onPress={() => setSelectedType(type.id as any)}
              >
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <Text
                  style={[
                    styles.typeLabel,
                    selectedType === type.id && styles.typeLabelActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Preview */}
          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>Preview</Text>
            <View
              style={[
                styles.preview,
                {
                  opacity,
                  backgroundColor:
                    selectedType === 'blur'
                      ? 'rgba(100, 100, 100, 0.5)'
                      : selectedType === 'vignette'
                      ? 'rgba(0, 0, 0, 0.3)'
                      : selectedType === 'watermark'
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(236, 154, 21, 0.3)',
                },
              ]}
            />
          </View>

          {/* Opacity Control */}
          <View style={styles.controlSection}>
            <View style={styles.controlHeader}>
              <Text style={styles.controlLabel}>Opacity</Text>
              <Text style={styles.controlValue}>{(opacity * 100).toFixed(0)}%</Text>
            </View>
            <View style={styles.sliderTrack}>
              <View
                style={[styles.sliderFill, { width: `${opacity * 100}%` }]}
              />
              <View style={[styles.sliderThumb, { left: `${opacity * 100}%` }]} />
            </View>
          </View>

          {/* Intensity Control */}
          <View style={styles.controlSection}>
            <View style={styles.controlHeader}>
              <Text style={styles.controlLabel}>Intensity</Text>
              <Text style={styles.controlValue}>{(intensity * 100).toFixed(0)}%</Text>
            </View>
            <View style={styles.sliderTrack}>
              <View
                style={[styles.sliderFill, { width: `${intensity * 100}%` }]}
              />
              <View style={[styles.sliderThumb, { left: `${intensity * 100}%` }]} />
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Overlays add creative effects to your video. Adjust opacity and intensity
              for the perfect look.
            </Text>
          </View>
        </ScrollView>

        {/* Apply Button */}
        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyButtonText}>Apply Overlay</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  label: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#ec9a15',
    borderColor: '#ec9a15',
  },
  typeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  typeLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  typeLabelActive: {
    color: '#000000',
  },
  previewBox: {
    marginBottom: 24,
  },
  previewLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  preview: {
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  controlSection: {
    marginBottom: 20,
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  controlValue: {
    color: '#ec9a15',
    fontSize: 13,
    fontWeight: '700',
  },
  sliderTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#ec9a15',
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sliderThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ec9a15',
    top: -4,
    marginLeft: -7,
  },
  infoBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(236, 154, 21, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(236, 154, 21, 0.3)',
    marginBottom: 20,
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    lineHeight: 16,
  },
  applyButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#ec9a15',
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  applyButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default OverlayEditorModal;
