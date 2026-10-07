/**
 * cam-expo-min.tsx - Minimal expo-camera v57 recording test matrix
 * Tests 8 variants of CameraView props and recordAsync options
 * Each variant records 3 seconds and logs: name, resolved/rejected, error code, uri, file size, elapsed ms
 * 
 * PROTECTED: Do not modify CameraView, props, or mount logic in the active CameraScreen.tsx
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { CameraView, type CameraViewProps } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as Clipboard from 'expo-clipboard';

interface TestVariant {
  name: string;
  props: Partial<CameraViewProps>;
  recordOptions: Record<string, any>;
}

interface TestResult {
  variant: string;
  status: 'pending' | 'recording' | 'resolved' | 'rejected';
  error?: { code: string; message: string };
  uri?: string;
  fileSizeKB?: number;
  elapsedMs?: number;
}

export default function CamExpoMin() {
  const insets = useSafeAreaInsets();
  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const cameraRef = useRef<any>(null);
  const [currentVariant, setCurrentVariant] = useState<number | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const cameraReadyRef = useRef(false);

  const variants: TestVariant[] = [
    {
      name: 'V1: mode="video", mute=true',
      props: { mode: 'video', mute: true, facing: 'back' },
      recordOptions: {},
    },
    {
      name: 'V2: mode="video", mute=false (mic granted)',
      props: { mode: 'video', mute: false, facing: 'back' },
      recordOptions: {},
    },
    {
      name: 'V3: mode="video", mute=true, videoQuality="720p"',
      props: { mode: 'video', mute: true, videoQuality: '720p', facing: 'back' },
      recordOptions: {},
    },
    {
      name: 'V4: mode="video", mute=true, videoQuality="480p"',
      props: { mode: 'video', mute: true, videoQuality: '480p', facing: 'back' },
      recordOptions: {},
    },
    {
      name: 'V5: mode="video", mute=true, videoQuality="1080p"',
      props: { mode: 'video', mute: true, videoQuality: '1080p', facing: 'back' },
      recordOptions: {},
    },
    {
      name: 'V6: V3 but facing="front"',
      props: { mode: 'video', mute: true, videoQuality: '720p', facing: 'front' },
      recordOptions: {},
    },
    {
      name: 'V7: Active screen props (picture mode, no quality)',
      props: { mode: 'picture', facing: 'back' },
      recordOptions: {},
    },
    {
      name: 'V8: V3 + recordAsync { maxDuration: 3 }',
      props: { mode: 'video', mute: true, videoQuality: '720p', facing: 'back' },
      recordOptions: { maxDuration: 3 },
    },
  ];

  useEffect(() => {
    const requestPerms = async () => {
      const cam = await requestCamPermission();
      const mic = await requestMicPermission();
      if (!cam.granted || !mic.granted) {
        Alert.alert('Permissions Required', 'Camera and microphone permissions are needed');
      }
    };
    requestPerms();
  }, []);

  const handleCameraReady = () => {
    cameraReadyRef.current = true;
  };

  const testVariant = async (index: number) => {
    const variant = variants[index];
    setCurrentVariant(index);
    setResults((prev) => [
      ...prev,
      { variant: variant.name, status: 'pending' },
    ]);

    if (!cameraRef.current) {
      setResults((prev) =>
        prev.map((r, i) =>
          i === prev.length - 1
            ? { ...r, status: 'rejected', error: { code: 'NO_CAMERA', message: 'Camera ref not ready' } }
            : r
        )
      );
      return;
    }

    // Wait for camera to be ready
    cameraReadyRef.current = false;
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!cameraReadyRef.current) {
      setResults((prev) =>
        prev.map((r, i) =>
          i === prev.length - 1
            ? { ...r, status: 'rejected', error: { code: 'CAMERA_NOT_READY', message: 'onCameraReady not called' } }
            : r
        )
      );
      setCurrentVariant(null);
      return;
    }

    setResults((prev) =>
      prev.map((r, i) => (i === prev.length - 1 ? { ...r, status: 'recording' } : r))
    );

    const startMs = performance.now();
    const recordAsyncStartMs = performance.now();

    try {
      const recordingPromise = cameraRef.current.recordAsync(variant.recordOptions);

      // Stop after 3 seconds
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await cameraRef.current.stopRecording();

      const video = await recordingPromise;
      const elapsedMs = Math.round(performance.now() - recordAsyncStartMs);

      const uri = video?.uri || '';
      let fileSizeKB = 0;

      if (uri) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (fileInfo.exists && fileInfo.isDirectory === false) {
            fileSizeKB = fileInfo.size ? Math.round(fileInfo.size / 1024) : 0;
          }
        } catch (err) {
          console.warn('[cam-expo-min] Failed to get file size:', err);
        }
      }

      setResults((prev) =>
        prev.map((r, i) =>
          i === prev.length - 1
            ? {
                ...r,
                status: 'resolved',
                uri: uri ? uri.substring(Math.max(0, uri.length - 40)) : undefined,
                fileSizeKB,
                elapsedMs,
              }
            : r
        )
      );
    } catch (error: any) {
      const elapsedMs = Math.round(performance.now() - recordAsyncStartMs);
      setResults((prev) =>
        prev.map((r, i) =>
          i === prev.length - 1
            ? {
                ...r,
                status: 'rejected',
                error: {
                  code: error?.code || 'UNKNOWN',
                  message: error?.message || String(error),
                },
                elapsedMs,
              }
            : r
        )
      );
    }

    setCurrentVariant(null);
  };

  const runAllTests = async () => {
    setRunning(true);
    setResults([]);

    for (let i = 0; i < variants.length; i++) {
      await testVariant(i);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setRunning(false);
  };

  const copyReport = async () => {
    const report = results
      .map(
        (r) =>
          `${r.variant}: ${r.status} | ${r.error ? `${r.error.code}: ${r.error.message}` : 'OK'} | ${r.uri ? `uri=${r.uri}` : ''} | ${r.fileSizeKB}KB | ${r.elapsedMs}ms`
      )
      .join('\n');

    await Clipboard.setStringAsync(report);
    Alert.alert('Report copied to clipboard', report);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Camera preview (always mounts V3 props for consistency) */}
      {currentVariant !== null && (
        <View style={styles.cameraPreview}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            onCameraReady={handleCameraReady}
            {...variants[currentVariant].props}
          />
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraOverlayText}>{variants[currentVariant]?.name}</Text>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        </View>
      )}

      {/* Results */}
      <ScrollView style={styles.resultsContainer} contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={styles.title}>expo-camera v57 Record Matrix</Text>

        {results.length === 0 ? (
          <Text style={styles.placeholder}>No tests run yet. Tap "Run All" to start.</Text>
        ) : (
          results.map((result, idx) => (
            <View key={idx} style={styles.resultItem}>
              <Text style={styles.resultVariant}>{result.variant}</Text>
              <Text style={[styles.resultStatus, { color: result.status === 'resolved' ? '#0f0' : '#f00' }]}>
                {result.status.toUpperCase()}
              </Text>
              {result.error && (
                <Text style={styles.resultError}>
                  {result.error.code}: {result.error.message}
                </Text>
              )}
              {result.uri && <Text style={styles.resultUri}>uri={result.uri}</Text>}
              {result.fileSizeKB !== undefined && (
                <Text style={styles.resultSize}>{result.fileSizeKB}KB</Text>
              )}
              {result.elapsedMs !== undefined && (
                <Text style={styles.resultElapsed}>{result.elapsedMs}ms</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.button, running && styles.buttonDisabled]}
          onPress={runAllTests}
          disabled={running || currentVariant !== null}
        >
          <Text style={styles.buttonText}>{running ? 'Running...' : 'Run All'}</Text>
        </TouchableOpacity>

        {results.length > 0 && (
          <TouchableOpacity style={styles.button} onPress={copyReport}>
            <Text style={styles.buttonText}>Copy Report</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraPreview: {
    height: 200,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cameraOverlayText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  placeholder: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  resultItem: {
    backgroundColor: '#1a1a1a',
    borderLeftWidth: 4,
    borderLeftColor: '#EC9A15',
    padding: 12,
    marginBottom: 12,
    borderRadius: 4,
  },
  resultVariant: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultError: {
    color: '#ff6b6b',
    fontSize: 11,
    marginBottom: 4,
  },
  resultUri: {
    color: '#aaa',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  resultSize: {
    color: '#0f0',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  resultElapsed: {
    color: '#888',
    fontSize: 10,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  button: {
    backgroundColor: '#EC9A15',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
