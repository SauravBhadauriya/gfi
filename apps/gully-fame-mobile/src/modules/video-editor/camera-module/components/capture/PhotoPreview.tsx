import React, { useState } from "react";
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";

import { CAPTURE_ORANGE } from "./theme";

interface PhotoPreviewProps {
  uri: string;
  topInset: number;
  bottomInset: number;
  onRetake: () => void;
  onNext: () => void;
}

const PhotoPreview: React.FC<PhotoPreviewProps> = ({ uri, topInset, bottomInset, onRetake, onNext }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (saving || saved) return;
    setSaving(true);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync(true);
      if (!permission.granted) {
        Alert.alert("Permission needed", "Allow photo access to save to your device.", [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      setSaved(true);
    } catch (error: any) {
      Alert.alert("Couldn't save photo", error?.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />

      <View style={[styles.top, { paddingTop: topInset + 12 }]}>
        <TouchableOpacity style={styles.roundBtn} onPress={onRetake} accessibilityLabel="Retake">
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.bottom, { paddingBottom: bottomInset + 16 }]}>
        <TouchableOpacity style={styles.secondary} onPress={onRetake}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.secondaryText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondary} onPress={save} disabled={saving || saved}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name={saved ? "checkmark" : "download-outline"} size={18} color="#fff" />
          )}
          <Text style={styles.secondaryText}>{saved ? "Saved" : "Save"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primary} onPress={onNext}>
          <Text style={styles.primaryText}>Next</Text>
          <Ionicons name="chevron-forward" size={18} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFill, backgroundColor: "#000", zIndex: 500 },
  top: { position: "absolute", top: 0, left: 16 },
  roundBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, gap: 10 },
  secondary: { flexDirection: "row", alignItems: "center", gap: 6, height: 46, paddingHorizontal: 18, borderRadius: 23, backgroundColor: "rgba(0,0,0,0.55)" },
  secondaryText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  primary: { flexDirection: "row", alignItems: "center", gap: 4, height: 46, paddingHorizontal: 24, borderRadius: 23, backgroundColor: CAPTURE_ORANGE },
  primaryText: { color: "#000", fontSize: 15, fontWeight: "700" },
});

export default PhotoPreview;
