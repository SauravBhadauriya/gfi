// PATH: apps/videoeditor/video-ediot/camera/CameraScreen.tsx

import React, { useState, useCallback } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera'; 
import { useIsFocused } from '@react-navigation/native'; // 🚀 1. NEW IMPORT
import HDSelector from '@/camera-module/components/HDSelector';

/**
 * CameraScreen (Standalone Video Editor Module)
 *
 * - Handles camera + microphone permissions safely using Expo native hooks
 * - Renders a stable CameraView component from expo-camera
 */
const CameraScreen: React.FC = () => {
  // 🚀 2. ADDED FOCUS HOOK
  const isFocused = useIsFocused();

  // Use Expo's native hooks to prevent Android deadlocks
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [config, setConfig] = useState({
    resolution: '1080p', 
    fps: 30,
    hdr: false
  });

  const handleRequest = useCallback(async () => {
    await requestCameraPermission();
    await requestMicPermission();
  }, [requestCameraPermission, requestMicPermission]);

  // If permissions state is still loading
  if (!cameraPermission || !micPermission) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color="#ffffff" size="large" />
        <Text style={styles.message}>Checking camera permissions…</Text>
      </SafeAreaView>
    );
  }

  // If permissions are not granted
  if (!cameraPermission.granted || !micPermission.granted) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.message}>
          This feature needs access to your camera and microphone to record video.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleRequest}
        >
          <Text style={styles.primaryButtonText}>
            Grant permission
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Permissions granted: render the camera preview securely
  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Preview Area */}
      <View style={styles.previewArea}>
        {/* 🚀 3. ADDED CONDITION AND mode="video" */}
        {isFocused && (
          <CameraView
            style={styles.camera}
            facing="back"
            flash="off"
            mode="video" // <--- YEH BAHUT ZAROORI THA!
            // We map resolution string properly for Expo Camera
            videoQuality={config.resolution === '4k' ? '2160p' : '1080p'} 
          />
        )}
      </View>

      {/* 2. Controls Area */}
      <View style={styles.controlsArea}>
        <HDSelector
          resolution={config.resolution as any}
          frameRate={config.fps as any}
          colorMode={config.hdr ? 'hdr' : 'sdr'}
          onResolutionChange={(res) => setConfig(prev => ({ ...prev, resolution: res }))}
          onFrameRateChange={(fps) => setConfig(prev => ({ ...prev, fps }))}
          onColorModeChange={(mode) => setConfig(prev => ({ ...prev, hdr: mode === 'hdr' }))}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column', 
    backgroundColor: '#000',
  },
  previewArea: {
    flex: 1, 
    width: '100%',
    backgroundColor: '#000',
  },
  controlsArea: {
    height: '30%', 
    width: '100%',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  centered: {
    flex: 1,
    backgroundColor: '#050509',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  message: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#e5e7eb',
    fontSize: 14,
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#3b82f6',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default CameraScreen;