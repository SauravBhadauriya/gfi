import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  TEXT_COLORS,
  TEXT_FONTS,
  TEXT_PAD_X,
  TEXT_PAD_Y,
  fontById,
  resolveTextColors,
  type TextBackground,
} from "./textStyles";

export interface TextDraft {
  text: string;
  fontId: string;
  color: string;
  background: TextBackground;
  alignment: "left" | "center" | "right";
}

interface TextEditorOverlayProps {
  initial: TextDraft;
  topInset: number;
  onDone: (draft: TextDraft) => void;
  onCancel: () => void;
}

const ALIGN_ICON = { left: "format-align-left", center: "format-align-center", right: "format-align-right" } as const;
const NEXT_ALIGN = { left: "center", center: "right", right: "left" } as const;
const NEXT_BG: Record<TextBackground, TextBackground> = { none: "solid", solid: "translucent", translucent: "none" };
const PREVIEW_SIZE = 30;

/** Full-screen text entry used to add or edit a text item. */
const TextEditorOverlay: React.FC<TextEditorOverlayProps> = ({ initial, topInset, onDone, onCancel }) => {
  const [draft, setDraft] = useState<TextDraft>(initial);
  const font = fontById(draft.fontId);
  const colors = resolveTextColors(draft.color, draft.background);
  const update = (patch: Partial<TextDraft>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={[styles.topRow, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity onPress={onCancel} hitSlop={10}>
          <Text style={styles.topText}>Cancel</Text>
        </TouchableOpacity>
        <View style={styles.tools}>
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() => update({ alignment: NEXT_ALIGN[draft.alignment] })}
            accessibilityLabel={`Align ${draft.alignment}`}
          >
            <MaterialCommunityIcons name={ALIGN_ICON[draft.alignment]} size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toolBtn, draft.background !== "none" && styles.toolBtnActive]}
            onPress={() => update({ background: NEXT_BG[draft.background] })}
            accessibilityLabel={`Background ${draft.background}`}
          >
            <MaterialCommunityIcons name="format-color-highlight" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => (draft.text.trim() ? onDone(draft) : onCancel())} hitSlop={10}>
          <Text style={[styles.topText, styles.done]}>Done</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputArea}>
        <View
          style={[
            styles.inputBox,
            colors.box && {
              backgroundColor: colors.box,
              paddingHorizontal: PREVIEW_SIZE * TEXT_PAD_X,
              paddingVertical: PREVIEW_SIZE * TEXT_PAD_Y,
            },
          ]}
        >
          <TextInput
            value={draft.text}
            onChangeText={(text) => update({ text })}
            autoFocus
            multiline
            allowFontScaling={false}
            placeholder="Type something"
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={[
              styles.input,
              { fontFamily: font.rnFamily, color: colors.text, textAlign: draft.alignment, fontSize: PREVIEW_SIZE },
            ]}
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip} contentContainerStyle={styles.fontRow} keyboardShouldPersistTaps="always">
        {TEXT_FONTS.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.fontPill, f.id === draft.fontId && styles.fontPillActive]}
            onPress={() => update({ fontId: f.id })}
          >
            <Text style={[styles.fontPillText, { fontFamily: f.rnFamily }, f.id === draft.fontId && styles.fontPillTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip} contentContainerStyle={styles.colorRow} keyboardShouldPersistTaps="always">
        {TEXT_COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => update({ color: c })}
            style={[styles.swatch, { backgroundColor: c }, c === draft.color && styles.swatchActive]}
            accessibilityLabel={`Colour ${c}`}
          />
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 100, elevation: 100 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  topText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  done: { color: "#FFD000", fontWeight: "800" },
  tools: { flexDirection: "row", gap: 12 },
  toolBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.12)" },
  toolBtnActive: { backgroundColor: "rgba(255,208,0,0.35)" },
  inputArea: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  inputBox: { alignSelf: "center", borderRadius: 8, maxWidth: "100%" },
  input: { minWidth: 40, padding: 0 },
  strip: { flexGrow: 0 },
  fontRow: { paddingHorizontal: 16, gap: 10, paddingBottom: 12 },
  fontPill: { alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  fontPillActive: { backgroundColor: "#fff", borderColor: "#fff" },
  fontPillText: { color: "#fff", fontSize: 14 },
  fontPillTextActive: { color: "#000" },
  colorRow: { paddingHorizontal: 16, gap: 12, paddingBottom: 16 },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: "rgba(255,255,255,0.6)" },
  swatchActive: { borderColor: "#FFD000", borderWidth: 3, transform: [{ scale: 1.15 }] },
});

export default TextEditorOverlay;
