import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { TextOverlay } from '../types/textOverlay.types';

interface AdvancedTextEditorModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (overlay: TextOverlay) => void;
  initialOverlay?: TextOverlay;
}

const TEXT_COLORS = [
  '#ffffff', '#000000', '#ff0000', '#00ff00',
  '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
  '#ff6b6b', '#51cf66', '#4dabf7', '#ffd43b',
  '#ff922b', '#da77f2', '#748ffc', '#ff8787',
];

const FONT_SIZES = [12, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72];

const FONT_WEIGHTS = ['Regular', 'Bold'] as const;

const ALIGNMENTS = ['Left', 'Center', 'Right'] as const;

const BG_COLORS = [
  { name: 'None', value: 'transparent' },
  '#ffffff',
  '#000000',
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00',
  '#ff00ff',
];

const AdvancedTextEditorModal: React.FC<AdvancedTextEditorModalProps> = ({
  visible,
  onClose,
  onSave,
  initialOverlay,
}) => {
  const [text, setText] = useState(initialOverlay?.text || '');
  const [fontSize, setFontSize] = useState(initialOverlay?.fontSize || 24);
  const [fontWeight, setFontWeight] = useState(initialOverlay?.fontWeight || 'Regular');
  const [color, setColor] = useState(initialOverlay?.color || '#ffffff');
  const [backgroundColor, setBackgroundColor] = useState(initialOverlay?.backgroundColor || 'transparent');
  const [textAlign, setTextAlign] = useState(initialOverlay?.textAlign || 'Center');
  const [opacity, setOpacity] = useState(initialOverlay?.opacity || 1);
  const [rotation, setRotation] = useState(initialOverlay?.rotation || 0);
  const [strokeColor, setStrokeColor] = useState(initialOverlay?.strokeColor || 'transparent');
  const [strokeWidth, setStrokeWidth] = useState(initialOverlay?.strokeWidth || 0);

  const handleSave = () => {
    const overlay: TextOverlay = {
      id: initialOverlay?.id || `text-${Date.now()}`,
      text,
      x: initialOverlay?.x || 0.5,
      y: initialOverlay?.y || 0.5,
      fontSize,
      fontWeight: fontWeight === 'Bold' ? 'bold' : 'normal',
      color,
      backgroundColor,
      textAlign: textAlign.toLowerCase() as 'left' | 'center' | 'right',
      opacity,
      rotation,
      strokeColor,
      strokeWidth,
      startTime: initialOverlay?.startTime || 0,
      endTime: initialOverlay?.endTime || Infinity,
    };

    onSave(overlay);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Text Editor</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[styles.cancelButton, { color: '#3b82f6' }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Text Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Text</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter text..."
              placeholderTextColor="#9ca3af"
              value={text}
              onChangeText={setText}
              maxLength={100}
              multiline
              numberOfLines={3}
            />
            <Text style={styles.charCounter}>{text.length} / 100</Text>
          </View>

          {/* Font Size */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Font Size</Text>
              <Text style={styles.sectionValue}>{fontSize}px</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.optionsScroll}
            >
              {FONT_SIZES.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeOption,
                    fontSize === size && styles.sizeOptionSelected,
                  ]}
                  onPress={() => setFontSize(size)}
                >
                  <Text
                    style={[
                      styles.sizeOptionText,
                      fontSize === size && styles.sizeOptionTextSelected,
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Font Weight */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Font Weight</Text>
            <View style={styles.optionsRow}>
              {FONT_WEIGHTS.map((weight) => (
                <TouchableOpacity
                  key={weight}
                  style={[
                    styles.option,
                    fontWeight === weight && styles.optionSelected,
                  ]}
                  onPress={() => setFontWeight(weight)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      fontWeight === weight && styles.optionTextSelected,
                      { fontWeight: weight === 'Bold' ? '700' : '400' },
                    ]}
                  >
                    {weight}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Text Alignment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alignment</Text>
            <View style={styles.optionsRow}>
              {ALIGNMENTS.map((align) => (
                <TouchableOpacity
                  key={align}
                  style={[
                    styles.option,
                    textAlign === align && styles.optionSelected,
                  ]}
                  onPress={() => setTextAlign(align)}
                >
                  <Text style={styles.alignmentIcon}>
                    {align === 'Left' ? '⬅️' : align === 'Right' ? '➡️' : '⬍'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Text Color */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Text Color</Text>
            <View style={styles.colorGrid}>
              {TEXT_COLORS.map((col) => (
                <TouchableOpacity
                  key={col}
                  style={[
                    styles.colorOption,
                    { backgroundColor: col },
                    color === col && styles.colorOptionSelected,
                  ]}
                  onPress={() => setColor(col)}
                >
                  {color === col && (
                    <View style={styles.colorCheckmark}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Background Color */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Background</Text>
            <View style={styles.colorGrid}>
              {BG_COLORS.map((bg, index) => {
                const bgValue = typeof bg === 'string' ? bg : bg.value;
                const isSelected = backgroundColor === bgValue;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.bgColorOption,
                      {
                        backgroundColor: bgValue === 'transparent' ? '#1f2937' : bgValue,
                        borderWidth: bgValue === 'transparent' ? 1 : 0,
                        borderColor: '#374151',
                      },
                      isSelected && styles.bgColorOptionSelected,
                    ]}
                    onPress={() => setBackgroundColor(bgValue)}
                  >
                    {bgValue === 'transparent' && (
                      <Text style={styles.bgLabel}>None</Text>
                    )}
                    {isSelected && (
                      <View style={styles.bgCheckmark}>
                        <Text style={styles.checkmark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Opacity */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Opacity</Text>
              <Text style={styles.sectionValue}>{Math.round(opacity * 100)}%</Text>
            </View>
            <View style={styles.slider}>
              <TouchableOpacity
                onPress={() => setOpacity(Math.max(0, opacity - 0.1))}
              >
                <Text style={styles.sliderButton}>−</Text>
              </TouchableOpacity>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${opacity * 100}%` }]} />
              </View>
              <TouchableOpacity
                onPress={() => setOpacity(Math.min(1, opacity + 0.1))}
              >
                <Text style={styles.sliderButton}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Rotation */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Rotation</Text>
              <Text style={styles.sectionValue}>{Math.round(rotation)}°</Text>
            </View>
            <View style={styles.slider}>
              <TouchableOpacity
                onPress={() => setRotation(Math.max(-360, rotation - 15))}
              >
                <Text style={styles.sliderButton}>−</Text>
              </TouchableOpacity>
              <View style={styles.sliderTrack}>
                <View
                  style={[styles.sliderFill, { width: `${((rotation + 360) % 360) / 3.6}%` }]}
                />
              </View>
              <TouchableOpacity
                onPress={() => setRotation(Math.min(360, rotation + 15))}
              >
                <Text style={styles.sliderButton}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stroke */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Outline</Text>
              <Text style={styles.sectionValue}>{strokeWidth}px</Text>
            </View>
            <View style={styles.slider}>
              <TouchableOpacity
                onPress={() => setStrokeWidth(Math.max(0, strokeWidth - 1))}
              >
                <Text style={styles.sliderButton}>−</Text>
              </TouchableOpacity>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${strokeWidth * 10}%` }]} />
              </View>
              <TouchableOpacity
                onPress={() => setStrokeWidth(Math.min(10, strokeWidth + 1))}
              >
                <Text style={styles.sliderButton}>+</Text>
              </TouchableOpacity>
            </View>
            {strokeWidth > 0 && (
              <View style={styles.colorGrid}>
                {TEXT_COLORS.map((col) => (
                  <TouchableOpacity
                    key={`stroke-${col}`}
                    style={[
                      styles.colorOption,
                      { backgroundColor: col },
                      strokeColor === col && styles.colorOptionSelected,
                    ]}
                    onPress={() => setStrokeColor(col)}
                  >
                    {strokeColor === col && (
                      <View style={styles.colorCheckmark}>
                        <Text style={styles.checkmark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Preview */}
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View
              style={[
                styles.preview,
                {
                  backgroundColor: backgroundColor === 'transparent' ? '#1f2937' : backgroundColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.previewText,
                  {
                    fontSize,
                    fontWeight: fontWeight === 'Bold' ? 'bold' : 'normal',
                    color,
                    opacity,
                    textAlign: textAlign.toLowerCase() as any,
                    transform: [{ rotate: `${rotation}deg` }],
                  },
                ]}
              >
                {text || 'Preview text'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  cancelButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f3f4f6',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d1d5db',
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  textInput: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 12,
    color: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#374151',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 6,
    textAlign: 'right',
  },
  optionsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  sizeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#111827',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sizeOptionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  sizeOptionText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  sizeOptionTextSelected: {
    color: '#fff',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#111827',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  optionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  optionText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#fff',
  },
  alignmentIcon: {
    fontSize: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderColor: '#fff',
    borderWidth: 3,
  },
  colorCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  bgColorOption: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgColorOptionSelected: {
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  bgLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '600',
  },
  bgCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151',
    color: '#f3f4f6',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 36,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  previewSection: {
    marginBottom: 32,
  },
  preview: {
    height: 120,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
    overflow: 'hidden',
  },
  previewText: {
    color: '#f3f4f6',
  },
});

export default AdvancedTextEditorModal;
