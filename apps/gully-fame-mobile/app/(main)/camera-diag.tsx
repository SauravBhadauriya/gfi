import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('screen');

export default function CameraDiagnosticScreen() {
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [mode, setMode] = useState<'picture' | 'video'>('picture');
  const [videoQuality, setVideoQuality] = useState<'480p' | '720p'>('720p');
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);

  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted) await requestCameraPermission();
      if (!microphonePermission?.granted) await requestMicrophonePermission();
    })();
  }, []);

  // Simulate frame counter to test if preview is rendering
  useEffect(() => {
    const interval = setInterval(() => {
      if (cameraReady) {
        setFrameCount(prev => prev + 1);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [cameraReady]);

  const hasPermissions = cameraPermission?.granted && microphonePermission?.granted;

  if (!hasPermissions) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Permissions required</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full-screen camera view - MINIMAL */}
      <View style={styles.cameraWrapper} collapsable={false} pointerEvents="none">
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          mode={mode}
          videoQuality={videoQuality as any}
          onCameraReady={() => {
            console.log('[DIAG] Camera ready');
            setCameraReady(true);
            setError(null);
          }}
          onMountError={(error: any) => {
            console.log('[DIAG] Mount error:', error);
            setError(`Mount error: ${error.message || error}`);
            setCameraReady(false);
          }}
        />
      </View>

      {/* Overlay UI */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Status */}
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>
            Ready: {cameraReady ? '✓' : '✗'}
          </Text>
          <Text style={styles.statusText}>
            Frames: {frameCount}
          </Text>
          <Text style={styles.statusText}>
            Facing: {facing}
          </Text>
          <Text style={styles.statusText}>
            Mode: {mode}
          </Text>
          <Text style={styles.statusText}>
            Quality: {videoQuality}
          </Text>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
          >
            <Text style={styles.buttonText}>
              Flip ({facing})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => setMode(mode === 'picture' ? 'video' : 'picture')}
          >
            <Text style={styles.buttonText}>
              Mode ({mode})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => setVideoQuality(videoQuality === '720p' ? '480p' : '720p')}
          >
            <Text style={styles.buttonText}>
              Quality ({videoQuality})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.closeButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraWrapper: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    justifyContent: 'space-between',
    padding: 20,
  },
  statusBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
    marginTop: Platform.OS === 'ios' ? 50 : 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    marginVertical: 2,
    fontFamily: 'monospace',
  },
  errorBox: {
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 12,
  },
  controls: {
    gap: 8,
  },
  button: {
    backgroundColor: 'rgba(236, 154, 21, 0.8)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: 'rgba(200, 0, 0, 0.8)',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
