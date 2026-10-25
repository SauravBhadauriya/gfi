import React, { useRef, useState } from "react";
import { ActivityIndicator, Image, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { CameraCapturedPicture } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

/**
 * Front-camera selfie capture for KYC. Shows a permission prompt, a live
 * front-camera preview, and a preview of the captured photo with retake / use.
 * The photo is returned to the caller; uploading it is up to the caller.
 */
export function SelfieCaptureModal({
  visible,
  onClose,
  onCaptured,
}: {
  visible: boolean;
  onClose: () => void;
  onCaptured: (photo: CameraCapturedPicture) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [captured, setCaptured] = useState<CameraCapturedPicture | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    setCaptured(null);
    setError("");
    onClose();
  };

  const takePhoto = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    setError("");
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, skipProcessing: false });
      if (!photo?.uri) throw new Error("No photo was returned");
      setCaptured(photo);
    } catch {
      setError("Could not take the photo. Please try again.");
    } finally {
      setCapturing(false);
    }
  };

  const renderBody = () => {
    if (!permission) {
      return <ActivityIndicator color="#EC9A15" />;
    }
    if (!permission.granted) {
      return (
        <View style={styles.center}>
          <Text style={styles.text}>
            Camera access is needed to take a selfie for verification.
          </Text>
          <TouchableOpacity
            style={styles.primary}
            onPress={async () => {
              const result = await requestPermission();
              if (!result.granted && !result.canAskAgain) setError("Camera permission is blocked. Open Settings to allow it.");
            }}
          >
            <Text style={styles.primaryText}>Allow camera</Text>
          </TouchableOpacity>
          {error ? (
            <TouchableOpacity onPress={() => Linking.openSettings()}>
              <Text style={styles.link}>Open Settings</Text>
            </TouchableOpacity>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      );
    }
    if (captured) {
      return (
        <View style={styles.fill}>
          <Image source={{ uri: captured.uri }} style={styles.fill} resizeMode="cover" />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondary} onPress={() => setCaptured(null)}>
              <Text style={styles.secondaryText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primary}
              onPress={() => {
                onCaptured(captured);
                close();
              }}
            >
              <Text style={styles.primaryText}>Use photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.fill}>
        <CameraView ref={cameraRef} style={styles.fill} facing="front" />
        <View style={styles.guide} pointerEvents="none" />
        <View style={styles.actions}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.shutter, capturing && styles.disabled]}
            onPress={takePhoto}
            disabled={capturing}
            accessibilityLabel="Take selfie"
          >
            {capturing ? <ActivityIndicator color="#000" /> : <View style={styles.shutterInner} />}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={close} style={styles.close} accessibilityLabel="Close">
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Selfie verification</Text>
          <View style={styles.close} />
        </View>
        {renderBody()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: "#3C2610",
  },
  close: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  fill: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  text: { color: "#E5DCD0", fontSize: 15, textAlign: "center", lineHeight: 22 },
  guide: {
    position: "absolute",
    alignSelf: "center",
    top: "18%",
    width: "70%",
    aspectRatio: 0.8,
    borderRadius: 200,
    borderWidth: 2,
    borderColor: "rgba(236,154,21,0.8)",
  },
  actions: {
    position: "absolute",
    bottom: 36,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 12,
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EC9A15",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#fff" },
  disabled: { opacity: 0.6 },
  primary: {
    minWidth: 160,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#EC9A15",
    alignItems: "center",
  },
  primaryText: { color: "#000", fontSize: 16, fontWeight: "700" },
  secondary: {
    minWidth: 160,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EC9A15",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  secondaryText: { color: "#EC9A15", fontSize: 16, fontWeight: "700" },
  link: { color: "#EC9A15", fontSize: 15, textDecorationLine: "underline" },
  error: { color: "#FF6B6B", fontSize: 14, textAlign: "center" },
});

export default SelfieCaptureModal;
