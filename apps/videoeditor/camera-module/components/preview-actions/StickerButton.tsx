import React, { useState, useEffect, useMemo } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  FlatList,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { STICKERS } from '../../utils/stickerLoader';

interface StickerButtonProps {
  onPress?: () => void;
  onStickerSelect?: (type: 'image' | 'emoji', content: string | number) => void;
}

const generateEmojiRange = (from: number, to: number) => {
  const emojis: string[] = [];
  for (let i = from; i <= to; i++) {
    emojis.push(String.fromCodePoint(i));
  }
  return emojis;
};

const ALL_SYSTEM_EMOJIS = [
  ...generateEmojiRange(0x1f600, 0x1f64f), 
  ...generateEmojiRange(0x1f440, 0x1f49f),
  ...generateEmojiRange(0x1f300, 0x1f3af), 
  ...generateEmojiRange(0x1f900, 0x1f9ff), 
];

const StickerButton: React.FC<StickerButtonProps> = ({ onPress, onStickerSelect }) => {
  const [visible, setVisible] = useState(false);
  const [stickers, setStickers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'stickers' | 'emojis'>('stickers');

  useEffect(() => {
    setStickers(STICKERS);
  }, []);

  const handleStickerPress = (sticker: string | number | undefined) => {
    // Validate that sticker is non-null before passing to callback
    if (sticker === undefined || sticker === null) {
      console.warn('StickerButton: Sticker content is null or undefined, skipping callback');
      return;
    }
    onStickerSelect?.('image', sticker);
    setVisible(false);
    onPress?.();
  };

  const handleEmojiPress = (emojiChar: string | undefined) => {
    // Validate that emoji is non-null before passing to callback
    if (emojiChar === undefined || emojiChar === null || emojiChar === '') {
      console.warn('StickerButton: Emoji content is empty or undefined, skipping callback');
      return;
    }
    onStickerSelect?.('emoji', emojiChar);
    setVisible(false);
    onPress?.();
  };

  const screenWidth = Dimensions.get('window').width;
  const panelPadding = 40;
  const itemSpacing = 12;
  const columnsPerView = 4.5;
  const rows = 3;
  
  const availableWidth = screenWidth - panelPadding;
  const itemWidth = (availableWidth - (columnsPerView * itemSpacing)) / columnsPerView;

  // 1. Stickers Chunking (Horizontal 3-Rows)
  const stickerColumns = useMemo(() => {
    const cols: (string | number)[][] = [];
    const totalCols = Math.ceil(stickers.length / rows);
    for (let col = 0; col < totalCols; col++) {
      const colItems = [];
      for (let r = 0; r < rows; r++) {
        const index = col * rows + r;
        if (index < stickers.length) colItems.push(stickers[index]);
      }
      cols.push(colItems);
    }
    return cols;
  }, [stickers]);

  // 2. Emojis Chunking (Horizontal 3-Rows)
  const emojiColumns = useMemo(() => {
    const cols: string[][] = [];
    const totalCols = Math.ceil(ALL_SYSTEM_EMOJIS.length / rows);
    for (let col = 0; col < totalCols; col++) {
      const colItems = [];
      for (let r = 0; r < rows; r++) {
        const index = col * rows + r;
        if (index < ALL_SYSTEM_EMOJIS.length) colItems.push(ALL_SYSTEM_EMOJIS[index]);
      }
      cols.push(colItems);
    }
    return cols;
  }, []);

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={() => setVisible(true)} activeOpacity={0.7}>
        <View style={styles.iconContainer}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
        <Text style={styles.label}>Sticker</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.panel}>
            
            <View style={styles.tabHeaderContainer}>
              <TouchableOpacity style={[styles.tabButton, activeTab === 'stickers' && styles.activeTabBorder]} onPress={() => setActiveTab('stickers')}>
                <Text style={[styles.tabText, activeTab === 'stickers' && styles.activeTabText]}>🖼️ Custom Stickers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabButton, activeTab === 'emojis' && styles.activeTabBorder]} onPress={() => setActiveTab('emojis')}>
                <Text style={[styles.tabText, activeTab === 'emojis' && styles.activeTabText]}>😀 All Emojis</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.scrollContainer}>
              {activeTab === 'stickers' ? (
                stickers.length > 0 ? (
                  <FlatList
                    horizontal
                    data={stickerColumns}
                    keyExtractor={(_, index) => `sticker-col-${index}`}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item: columnStickers, index: colIndex }) => (
                      <View style={[styles.column, { width: itemWidth, marginRight: itemSpacing }]}>
                        {columnStickers.map((sticker, rowIndex) => (
                          <TouchableOpacity
                            key={`stk-${colIndex}-${rowIndex}`}
                            onPress={() => handleStickerPress(sticker)}
                            style={[styles.item, { marginBottom: rowIndex < rows - 1 ? 12 : 0 }]}
                          >
                            <Image
                              source={typeof sticker === 'string' ? { uri: sticker } : sticker}
                              style={[styles.sticker, { width: itemWidth - 8, height: itemWidth - 8 }]}
                              resizeMode="contain"
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  />
                ) : (
                  <View style={styles.emptyContainer}><Text style={styles.emptyText}>No stickers found.</Text></View>
                )
              ) : (
                <FlatList
                  horizontal
                  data={emojiColumns}
                  keyExtractor={(_, index) => `emoji-col-${index}`}
                  showsHorizontalScrollIndicator={false}
                  initialNumToRender={10}
                  renderItem={({ item: columnEmojis, index: colIndex }) => (
                    <View style={[styles.column, { width: itemWidth, marginRight: itemSpacing }]}>
                      {columnEmojis.map((emoji, rowIndex) => (
                        <TouchableOpacity
                          key={`emo-${colIndex}-${rowIndex}`}
                          onPress={() => handleEmojiPress(emoji)}
                          style={[styles.item, { marginBottom: rowIndex < rows - 1 ? 12 : 0, height: itemWidth - 8, justifyContent: 'center' }]}
                        >
                          <Text style={{ fontSize: 32 }}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                />
              )}
            </View>

            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={styles.close}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: { alignItems: 'center', gap: 6 },
  iconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  label: { color: '#ffffff', fontSize: 10, fontWeight: '500' },
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  panel: { backgroundColor: '#1a1a1a', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: 400 },
  tabHeaderContainer: { flexDirection: 'row', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  activeTabBorder: { borderBottomWidth: 2, borderBottomColor: '#FF9F1C' },
  tabText: { color: '#888888', fontSize: 14, fontWeight: '600' },
  activeTabText: { color: '#FF9F1C' },
  scrollContainer: { height: 260 },
  column: { flexDirection: 'column', alignItems: 'center' },
  item: { alignItems: 'center', justifyContent: 'center' },
  sticker: { borderRadius: 12, backgroundColor: 'transparent' },
  emptyContainer: { height: 200, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#ffffff', fontSize: 14, textAlign: 'center', opacity: 0.6 },
  close: { color: '#ffffff', fontSize: 15, fontWeight: '600', marginTop: 10, textAlign: 'center', paddingVertical: 10, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 8 },
});

export default StickerButton;