import React, { useState } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import Svg, { Path } from "react-native-svg";

interface PasteButtonProps {
  onPress?: () => void;
  onPaste?: (content: string) => void;
}

const PasteButton: React.FC<PasteButtonProps> = ({ onPress, onPaste }) => {
  const [showModal, setShowModal] = useState(false);
  const [clipboardContent, setClipboardContent] = useState("");

  const handleCheckClipboard = async () => {
    try {
      const content = await Clipboard.getStringAsync();
      setClipboardContent(content);
    } catch (error) {
      Alert.alert("Error", "Unable to access clipboard");
    }
  };

  const handlePaste = () => {
    if (!clipboardContent.trim()) {
      Alert.alert("Error", "Clipboard is empty");
      return;
    }

    onPaste?.(clipboardContent);
    setShowModal(false);
    setClipboardContent("");
    onPress?.();
    Alert.alert("Success", "Content pasted");
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          handleCheckClipboard();
          setShowModal(true);
        }}
        activeOpacity={0.7}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"
            fill="#ffffff"
          />
        </Svg>
        <Text style={styles.buttonText}>Paste</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeButton}>
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
            <Text style={styles.modalTitle}>Paste Content</Text>
            <View style={styles.closeButton} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Clipboard Content</Text>
              <Text style={styles.infoText}>
                Paste text, URLs, or other content from your clipboard into your video.
              </Text>
            </View>

            {/* Clipboard Content Display */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Content Preview</Text>
              <View style={styles.contentBox}>
                {clipboardContent ? (
                  <Text style={styles.contentText}>{clipboardContent}</Text>
                ) : (
                  <Text style={styles.emptyText}>Clipboard is empty</Text>
                )}
              </View>
              <Text style={styles.charCount}>{clipboardContent.length} characters</Text>
            </View>

            {/* Options */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Paste As</Text>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => {
                    if (!clipboardContent.trim()) {
                      Alert.alert("Error", "Clipboard is empty");
                      return;
                    }
                    onPaste?.(clipboardContent);
                    setShowModal(false);
                    Alert.alert("Success", "Pasted as text");
                  }}
                >
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M3 13h2v8H3zm4-8h2v16H7zm4-2h2v18h-2zm4 4h2v14h-2zm4-4h2v18h-2z"
                      fill="#ec9a15"
                    />
                  </Svg>
                  <Text style={styles.optionLabel}>As Text</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => {
                    if (!clipboardContent.trim()) {
                      Alert.alert("Error", "Clipboard is empty");
                      return;
                    }
                    onPaste?.(clipboardContent);
                    setShowModal(false);
                    Alert.alert("Success", "Pasted as caption");
                  }}
                >
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"
                      fill="#ec9a15"
                    />
                  </Svg>
                  <Text style={styles.optionLabel}>As Caption</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Paste Button */}
            <TouchableOpacity
              style={[styles.pasteButton, !clipboardContent.trim() && styles.pasteButtonDisabled]}
              onPress={handlePaste}
              disabled={!clipboardContent.trim()}
            >
              <Text style={styles.pasteButtonText}>Paste</Text>
            </TouchableOpacity>

            {/* Tips */}
            <View style={styles.tipsBox}>
              <Text style={styles.tipsTitle}>💡 Tips:</Text>
              <Text style={styles.tipsText}>
                • Copy text from any app and paste it here{"\n"}• Paste URLs to add clickable links
                {"\n"}• Paste captions for quick text overlays
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    gap: 4,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoBox: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(236, 154, 21, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.3)",
    marginBottom: 24,
  },
  infoTitle: {
    color: "#ec9a15",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  infoText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    lineHeight: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  contentBox: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 80,
    maxHeight: 150,
  },
  contentText: {
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 18,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 13,
    fontStyle: "italic",
  },
  charCount: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
    marginTop: 4,
    textAlign: "right",
  },
  optionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    gap: 8,
  },
  optionLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  pasteButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: "#ec9a15",
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  pasteButtonDisabled: {
    opacity: 0.5,
  },
  pasteButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "700",
  },
  tipsBox: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  tipsTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  tipsText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    lineHeight: 16,
  },
});

export default PasteButton;
