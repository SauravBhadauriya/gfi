/**
 * camera-vision-test.tsx - vision-camera v5 recording test (STUB - NOT ENABLED YET)
 * 
 * Placeholder for react-native-vision-camera v5.2.3 fallback recording backend.
 * This screen is accessible for testing but not integrated into the main flow yet.
 * 
 * PROTECTED: This is a fallback test screen only; does not replace the active CameraScreen.
 * Integration into the main recording flow is gated behind RECORDING_BACKEND constant (not set yet).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TestResult {
  status: 'stub' | 'pending' | 'resolved' | 'rejected';
  error?: string;
  note?: string;
}

export default function CameraVisionTest() {
  const insets = useSafeAreaInsets();
  const [result, setResult] = useState<TestResult | null>(null);

  const handleTest = () => {
    Alert.alert(
      'Vision-Camera Fallback (Stub)',
      'react-native-vision-camera v5.2.3 integration is prepared but not enabled.\n\n' +
      'This screen serves as a placeholder for testing vision-camera as a fallback recording backend when expo-camera recordAsync fails.\n\n' +
      'To enable: Set RECORDING_BACKEND = "vision" in useCamera.ts (currently "expo" only).\n\n' +
      'Current status: expo-camera is still the primary backend.'
    );

    setResult({
      status: 'stub',
      note: 'Vision-camera fallback prepared but not yet integrated',
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={styles.title}>vision-camera v5 Fallback Test</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Status: STUB (Not Enabled)</Text>
          <Text style={styles.infoText}>
            This screen is prepared for testing react-native-vision-camera v5.2.3 as a fallback recording backend.
          </Text>
          <Text style={[styles.infoText, { marginTop: 10 }]}>
            <Text style={{ fontWeight: 'bold' }}>Location:</Text> {'\n'}
            app/(main)/camera-vision-test.tsx
          </Text>
          <Text style={[styles.infoText, { marginTop: 10 }]}>
            <Text style={{ fontWeight: 'bold' }}>Service:</Text> {'\n'}
            src/modules/video-editor/camera-module/services/systemCameraFallback.ts
          </Text>
          <Text style={[styles.infoText, { marginTop: 10 }]}>
            <Text style={{ fontWeight: 'bold' }}>Gating:</Text> {'\n'}
            Controlled by RECORDING_BACKEND constant in useCamera.ts
          </Text>
          <Text style={[styles.infoText, { marginTop: 10 }]}>
            <Text style={{ fontWeight: 'bold' }}>Integration Plan:</Text> {'\n'}
            Only activate if expo-camera recordAsync fails on this device after all options are tested.
          </Text>
        </View>

        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Test Result:</Text>
            <Text style={[styles.resultStatus, { color: '#EC9A15' }]}>
              Status: {result.status.toUpperCase()}
            </Text>
            {result.note && <Text style={styles.resultNote}>{result.note}</Text>}
          </View>
        )}
      </ScrollView>

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.button} onPress={handleTest}>
          <Text style={styles.buttonText}>Show Info</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: '#1a1a1a',
    borderLeftWidth: 4,
    borderLeftColor: '#EC9A15',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    color: '#EC9A15',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    color: '#aaa',
    fontSize: 12,
    lineHeight: 18,
  },
  resultBox: {
    backgroundColor: '#1a1a1a',
    borderLeftWidth: 4,
    borderLeftColor: '#0f0',
    padding: 16,
    borderRadius: 8,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultNote: {
    color: '#aaa',
    fontSize: 12,
    lineHeight: 18,
  },
  controlsContainer: {
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  button: {
    backgroundColor: '#EC9A15',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
