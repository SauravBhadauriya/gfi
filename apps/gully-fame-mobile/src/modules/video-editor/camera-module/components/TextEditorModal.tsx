import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { TextOverlay, TextAlign, FontWeight } from '../types/textOverlay.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TextEditorModalProps {
  visible: boolean;
  overlay: TextOverlay | null;
  onSave: (overlay: TextOverlay) => void;
  onDelete?: (overlayId: string) => void;
  onClose: () => void;
  containerWidth: number;
  containerHeight: number;
}

const COLORS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#FFD700', '#808080', '#FF1493', '#00CED1'
];

const FONT_SIZES = [12, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72];

/**
 * Beautiful text editor modal for creating/editing text overlays
 */
const TextEditorModal: React.FC<TextEditorModalProps> = ({
  visible,
  overlay,
  onSave,
  onDelete,
  onClose,
  containerWidth,
  containerHeight,
}) => {
  const [text, setText] = useState(overlay?.text || '');
  const [fontSize, setFontSize] = useState(overlay?.fontSize || 24);
  const [fontWeight, setFontWeight] = useState<FontWeight>(overlay?.fontWeight || 'normal');
  const [color, setColor] = useState(overlay?.color || '#FFFFFF');
  const [backgroundColor, setBackgroundColor] = useState(overlay?.backgroundColor || '');
  const [textAlign, setTextAlign] = useState<TextAlign>(overlay?.textAlign || 'center');
  const [rotation, setRotation] = useState(overlay?.rotation || 0);
  const [opacity, setOpacity] = useState(overlay?.opacity ?? 1);
  const [strokeColor, setStrokeColor] = useState(overlay?.strokeColor || '');
  const [strokeWidth, setStrokeWidth] = useState(overlay?.strokeWidth || 0);
  const [x, setX] = useState(overlay?.x ?? 0.5);
  const [y, setY] = useState(overlay?.y ?? 0.5);
  const [startTime, setStartTime] = useState(overlay?.startTime ?? 0);
  const [endTime, setEndTime] = useState(overlay?.endTime ?? 5);

  // Reset state when overlay changes
  React.useEffect(() => {
    if (overlay) {
      setText(overlay.text || '');
      setFontSize(overlay.fontSize || 24);
      setFontWeight(overlay.fontWeight || 'normal');
      setColor(overlay.color || '#FFFFFF');
      setBackgroundColor(overlay.backgroundColor || '');
      setTextAlign(overlay.textAlign || 'center');
      setRotation(overlay.rotation || 0);
      setOpacity(overlay.opacity ?? 1);
      setStrokeColor(overlay.strokeColor || '');
      setStrokeWidth(overlay.strokeWidth || 0);
      setX(overlay.x ?? 0.5);
      setY(overlay.y ?? 0.5);
      setStartTime(overlay.startTime ?? 0);
      setEndTime(overlay.endTime ?? 5);
    } else {
      // Reset to defaults for new overlay
      setText('');
      setFontSize(24);
      setFontWeight('normal');
      setColor('#FFFFFF');
      setBackgroundColor('');
      setTextAlign('center');
      setRotation(0);
      setOpacity(1);
      setStrokeColor('');
      setStrokeWidth(0);
      setX(0.5);
      setY(0.5);
      setStartTime(0);
      setEndTime(5);
    }
  }, [overlay]);

  const handleSave = useCallback(() => {
    if (!text.trim()) {
      onClose();
      return;
    }

    const updatedOverlay: TextOverlay = {
      id: overlay?.id || `text-${Date.now()}`,
      text: text.trim(),
      x,
      y,
      fontSize,
      fontWeight,
      color,
      textAlign,
      rotation,
      opacity,
      startTime,
      endTime,
      ...(backgroundColor ? { backgroundColor } : {}),
      ...(strokeColor && strokeWidth > 0 ? { strokeColor, strokeWidth } : {}),
    };

    console.log(`📝 Text saved: "${text.trim()}" from ${startTime.toFixed(2)}s to ${endTime.toFixed(2)}s`);
    onSave(updatedOverlay);
    onClose();
  }, [
    text,
    x,
    y,
    fontSize,
    fontWeight,
    color,
    backgroundColor,
    textAlign,
    rotation,
    opacity,
    strokeColor,
    strokeWidth,
    startTime,
    endTime,
    overlay,
    onSave,
    onClose,
  ]);

  const handleDelete = useCallback(() => {
    if (overlay?.id && onDelete) {
      onDelete(overlay.id);
    }
    onClose();
  }, [overlay, onDelete, onClose]);

  const previewOverlay: TextOverlay = {
    id: 'preview',
    text: text || 'Enter text',
    x,
    y,
    fontSize,
    fontWeight,
    color,
    backgroundColor,
    textAlign,
    rotation,
    opacity,
    strokeColor,
    strokeWidth,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Text</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, styles.headerButtonTextPrimary]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preview Area */}
        <View style={styles.previewContainer}>
          <View style={[styles.previewFrame, { width: containerWidth, height: containerHeight }]}>
            <View style={styles.previewBackground}>
              <Text style={styles.previewLabel}>Preview</Text>
            </View>
            {text && (
              <View
                style={{
                  position: 'absolute',
                  left: x * containerWidth,
                  top: y * containerHeight,
                  opacity,
                  transform: [{ rotate: `${rotation}deg` }],
                }}
              >
                {backgroundColor && (
                  <View
                    style={[
                      styles.previewBackgroundBox,
                      { backgroundColor },
                    ]}
                  />
                )}
                <Text
                  style={{
                    fontSize,
                    fontWeight,
                    color,
                    textAlign,
                    ...(strokeColor && strokeWidth > 0
                      ? {
                          textShadowColor: strokeColor,
                          textShadowOffset: { width: 0, height: 0 },
                          textShadowRadius: strokeWidth,
                        }
                      : {}),
                  }}
                >
                  {text}
                </Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView style={styles.editor} showsVerticalScrollIndicator={false}>
          {/* Text Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Text</Text>
            <TextInput
              style={styles.textInput}
              value={text}
              onChangeText={setText}
              placeholder="Enter your text"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              multiline
              autoFocus
            />
          </View>

          {/* Font Size */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Size</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsRow}>
              {FONT_SIZES.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.optionButton,
                    fontSize === size && styles.optionButtonActive,
                  ]}
                  onPress={() => setFontSize(size)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      fontSize === size && styles.optionButtonTextActive,
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
            <Text style={styles.sectionTitle}>Style</Text>
            <View style={styles.optionsRow}>
              {(['normal', 'bold'] as FontWeight[]).map((weight) => (
                <TouchableOpacity
                  key={weight}
                  style={[
                    styles.styleButton,
                    fontWeight === weight && styles.styleButtonActive,
                  ]}
                  onPress={() => setFontWeight(weight)}
                >
                  <Text
                    style={[
                      styles.styleButtonText,
                      fontWeight === weight && styles.styleButtonTextActive,
                      weight === 'bold' && { fontWeight: 'bold' },
                    ]}
                  >
                    {weight === 'normal' ? 'Regular' : 'Bold'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Text Color */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
              {COLORS.map((col) => (
                <TouchableOpacity
                  key={col}
                  style={[
                    styles.colorButton,
                    color === col && styles.colorButtonActive,
                    { backgroundColor: col },
                  ]}
                  onPress={() => setColor(col)}
                >
                  {color === col && (
                    <View style={styles.colorCheck}>
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M20 6L9 17l-5-5"
                          stroke={col === '#FFFFFF' || col === '#FFFF00' || col === '#FFC0CB' || col === '#FFD700' ? '#000000' : '#FFFFFF'}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Background Color */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Background</Text>
              <TouchableOpacity
                onPress={() => setBackgroundColor('')}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
              <TouchableOpacity
                style={[
                  styles.colorButton,
                  !backgroundColor && styles.colorButtonActive,
                  styles.transparentButton,
                ]}
                onPress={() => setBackgroundColor('')}
              >
                {!backgroundColor && (
                  <View style={styles.colorCheck}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M20 6L9 17l-5-5"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                )}
                <Text style={styles.transparentLabel}>None</Text>
              </TouchableOpacity>
              {COLORS.map((col) => (
                <TouchableOpacity
                  key={col}
                  style={[
                    styles.colorButton,
                    backgroundColor === col && styles.colorButtonActive,
                    { backgroundColor: col },
                  ]}
                  onPress={() => setBackgroundColor(col)}
                >
                  {backgroundColor === col && (
                    <View style={styles.colorCheck}>
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M20 6L9 17l-5-5"
                          stroke={col === '#FFFFFF' || col === '#FFFF00' || col === '#FFC0CB' || col === '#FFD700' ? '#000000' : '#FFFFFF'}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Alignment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alignment</Text>
            <View style={styles.optionsRow}>
              {(['left', 'center', 'right'] as TextAlign[]).map((align) => (
                <TouchableOpacity
                  key={align}
                  style={[
                    styles.alignButton,
                    textAlign === align && styles.alignButtonActive,
                  ]}
                  onPress={() => setTextAlign(align)}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    {align === 'left' && (
                      <Path
                        d="M3 6h18M3 12h12M3 18h18"
                        stroke={textAlign === align ? '#ec9a15' : '#888888'}
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    )}
                    {align === 'center' && (
                      <Path
                        d="M3 6h18M7 12h10M3 18h18"
                        stroke={textAlign === align ? '#ec9a15' : '#888888'}
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    )}
                    {align === 'right' && (
                      <Path
                        d="M3 6h18M9 12h12M3 18h18"
                        stroke={textAlign === align ? '#ec9a15' : '#888888'}
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    )}
                  </Svg>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Opacity */}
          <View style={styles.section}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sectionTitle}>Opacity</Text>
              <Text style={styles.sliderValue}>{Math.round(opacity * 100)}%</Text>
            </View>
            <View style={styles.sliderContainer}>
              {[0, 0.25, 0.5, 0.75, 1].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.sliderDot,
                    opacity >= value && styles.sliderDotActive,
                  ]}
                  onPress={() => setOpacity(value)}
                />
              ))}
            </View>
          </View>

          {/* Duration (Start/End Time) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duration</Text>
            <View style={styles.durationRow}>
              <View style={styles.durationInputContainer}>
                <Text style={styles.durationLabel}>Start (s)</Text>
                <TextInput
                  style={styles.durationInput}
                  value={startTime.toFixed(2)}
                  onChangeText={(text) => {
                    const val = Math.max(0, parseFloat(text) || 0);
                    setStartTime(val);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                />
              </View>

              <View style={styles.durationInputContainer}>
                <Text style={styles.durationLabel}>End (s)</Text>
                <TextInput
                  style={styles.durationInput}
                  value={endTime.toFixed(2)}
                  onChangeText={(text) => {
                    const val = Math.max(startTime, parseFloat(text) || startTime);
                    setEndTime(val);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="5.00"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                />
              </View>
            </View>
            <Text style={styles.durationDisplay}>
              Duration: {(endTime - startTime).toFixed(2)}s
            </Text>
          </View>

          {/* Delete Button */}
          {overlay && onDelete && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>Delete Text</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButtonTextPrimary: {
    color: '#ec9a15',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  previewContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewFrame: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewLabel: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 14,
  },
  previewBackgroundBox: {
    position: 'absolute',
    top: -4,
    left: -8,
    right: -8,
    bottom: -4,
    borderRadius: 4,
  },
  editor: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 60,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#ec9a15',
    borderColor: '#ec9a15',
  },
  optionButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  optionButtonTextActive: {
    color: '#ffffff',
  },
  styleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  styleButtonActive: {
    backgroundColor: '#ec9a15',
    borderColor: '#ec9a15',
  },
  styleButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  styleButtonTextActive: {
    color: '#ffffff',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  colorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorButtonActive: {
    borderColor: '#ec9a15',
    transform: [{ scale: 1.1 }],
  },
  transparentButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  transparentLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
  },
  colorCheck: {
    position: 'absolute',
  },
  clearButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearButtonText: {
    color: '#ec9a15',
    fontSize: 12,
    fontWeight: '600',
  },
  alignButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alignButtonActive: {
    backgroundColor: '#ec9a15',
    borderColor: '#ec9a15',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderValue: {
    color: '#ec9a15',
    fontSize: 14,
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sliderDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  sliderDotActive: {
    backgroundColor: '#ec9a15',
    borderColor: '#ec9a15',
    transform: [{ scale: 1.2 }],
  },
  durationRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  durationInputContainer: {
    flex: 1,
  },
  durationLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  durationInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(236, 154, 21, 0.3)',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  durationDisplay: {
    color: '#ec9a15',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  deleteButton: {
    marginTop: 32,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderWidth: 1.5,
    borderColor: '#ff4444',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '700',
  },
});

export { TextEditorModal };
export default TextEditorModal;

