import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { 
  Camera, 
  useVideoOutput,
  type CameraRef,
} from 'react-native-vision-camera';
import { useCameraDevices } from 'react-native-vision-camera/lib/hooks/useCameraDevices';
import type { CameraDevice } from 'react-native-vision-camera/lib/specs/inputs/CameraDevice.nitro';
import { useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera/lib/hooks/usePermission';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('screen');

const BUILD_MARKER = 'VC5-device-selector-v1';
const BUILD_MARKER_TIMESTAMP_TEST = new Date().toISOString();

export default function VisionCameraTestScreen() {
  const [selectedDevice, setSelectedDevice] = useState<CameraDevice | null>(null);
  const [implementationMode, setImplementationMode] = useState<'compatible' | 'performance'>('compatible');
  const [messages, setMessages] = useState<string[]>(['Initializing...']);
  const [isActive, setIsActive] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const cameraPermission = useCameraPermission();
  const micPermission = useMicrophonePermission();
  const allDevices = useCameraDevices();
  const videoOutput = useVideoOutput({ enableAudio: true });
  const cameraRef = useRef<CameraRef>(null);

  useEffect(() => {
    (async () => {
      if (!cameraPermission.hasPermission) {
        const granted = await cameraPermission.requestPermission();
        addMessage(granted ? '✅ Camera permission granted' : '❌ Camera permission denied');
      }
      if (!micPermission.hasPermission) {
        const granted = await micPermission.requestPermission();
        addMessage(granted ? '✅ Mic permission granted' : '❌ Mic permission denied');
      }
    })();
  }, []);

  useEffect(() => {
    if (allDevices.length > 0) {
      addMessage(`Found ${allDevices.length} camera devices`);
      // Auto-select first back camera if none selected
      if (!selectedDevice) {
        const firstBack = allDevices.find(d => d.position === 'back');
        if (firstBack) {
          setSelectedDevice(firstBack);
          addMessage(`Auto-selected: ${firstBack.id}`);
        }
      }
    }
  }, [allDevices]);

  const addMessage = (msg: string) => {
    setMessages((prev) => [msg, ...prev.slice(0, 14)]);
  };

  const handleCameraError = (error: Error) => {
    addMessage(`❌ Error: ${error.message || error}`);
    console.error('[VisionCamera Test] Error:', error);
  };

  const handleStarted = () => {
    setInitialized(true);
    addMessage('✅ onStarted fired');
  };

  const handlePreviewStarted = () => {
    addMessage('✅ onPreviewStarted fired');
  };

  const selectDevice = (device: CameraDevice) => {
    setSelectedDevice(device);
    setInitialized(false);
    addMessage(`Selected: ${device.id} (${device.position})`);
  };

  if (!cameraPermission.hasPermission || !micPermission.hasPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.buildMarkerBanner}>
          <Text style={styles.buildMarkerText}>
            BUILD-MARK-1 | camera-vision-test.tsx | {BUILD_MARKER_TIMESTAMP_TEST}
          </Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.errorText}>Waiting for permissions...</Text>
          <Text style={[styles.errorText, { fontSize: 12, marginTop: 8 }]}>
            Camera: {cameraPermission.status} | Mic: {micPermission.status}
          </Text>
        </View>
      </View>
    );
  }

  if (allDevices.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.buildMarkerBanner}>
          <Text style={styles.buildMarkerText}>
            BUILD-MARK-1 | camera-vision-test.tsx | {BUILD_MARKER_TIMESTAMP_TEST}
          </Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.errorText}>Loading camera devices...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Build Marker */}
      <View style={styles.buildMarkerBanner}>
        <Text style={styles.buildMarkerText}>
          BUILD-MARK-1 | camera-vision-test.tsx {BUILD_MARKER} | {BUILD_MARKER_TIMESTAMP_TEST}
        </Text>
      </View>

      {/* Camera Preview - only if device selected */}
      {selectedDevice && (
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <Camera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={selectedDevice}
              isActive={isActive}
              outputs={[videoOutput]}
              implementationMode={implementationMode}
              onStarted={handleStarted}
              onPreviewStarted={handlePreviewStarted}
              onError={handleCameraError}
            />
          </View>
        </View>
      )}

      {/* Device List Sidebar */}
      <View style={styles.deviceListSidebar}>
        <Text style={styles.sidebarTitle}>Camera Devices ({allDevices.length})</Text>
        <ScrollView style={styles.deviceScroll}>
          {allDevices.map((device, idx) => {
            const isSelected = selectedDevice?.id === device.id;
            const physicalDeviceNames = device.physicalDevices.map(pd => pd.type).join(', ');
            
            return (
              <TouchableOpacity
                key={device.id}
                style={[styles.deviceButton, isSelected && styles.deviceButtonSelected]}
                onPress={() => selectDevice(device)}
              >
                <Text style={styles.deviceButtonText}>
                  {idx + 1}. {device.position.toUpperCase()}
                </Text>
                <Text style={styles.deviceButtonSubtext}>
                  ID: {device.id.substring(0, 12)}...
                </Text>
                <Text style={styles.deviceButtonSubtext}>
                  Type: {device.type}
                </Text>
                {device.isVirtualDevice && (
                  <Text style={styles.deviceButtonSubtext}>
                    Virtual: {physicalDeviceNames || 'multiple'}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Status & Controls Overlay */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Status Box */}
        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Selected Device:</Text>
          {selectedDevice && (
            <>
              <Text style={styles.statusText}>ID: {selectedDevice.id.substring(0, 20)}...</Text>
              <Text style={styles.statusText}>Pos: {selectedDevice.position}</Text>
              <Text style={styles.statusText}>Type: {selectedDevice.type}</Text>
              <Text style={styles.statusText}>Virtual: {selectedDevice.isVirtualDevice ? 'YES' : 'NO'}</Text>
            </>
          )}
          <Text style={styles.statusText}>Mode: {implementationMode}</Text>
          <Text style={styles.statusText}>Active: {isActive ? '✓' : '✗'}</Text>
          <Text style={styles.statusText}>Initialized: {initialized ? '✓' : '✗'}</Text>
        </View>

        {/* Messages Box */}
        <View style={styles.messagesBox}>
          <Text style={styles.messagesTitle}>Events:</Text>
          <ScrollView style={{ maxHeight: 120 }}>
            {messages.map((msg, idx) => (
              <Text key={idx} style={styles.messageText}>
                {msg}
              </Text>
            ))}
          </ScrollView>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSmall]}
            onPress={() => {
              const newMode = implementationMode === 'compatible' ? 'performance' : 'compatible';
              setImplementationMode(newMode);
              setInitialized(false);
              addMessage(`Mode: ${implementationMode} → ${newMode}`);
            }}
          >
            <Text style={styles.buttonText}>
              Mode: {implementationMode === 'compatible' ? 'TextureView' : 'SurfaceView'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSmall]}
            onPress={() => {
              setIsActive(!isActive);
              addMessage(`Camera: ${isActive ? 'Deactivated' : 'Activated'}`);
            }}
          >
            <Text style={styles.buttonText}>Active: {isActive ? 'On' : 'Off'}</Text>
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
  buildMarkerBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF0000',
    paddingVertical: 8,
    paddingHorizontal: 10,
    zIndex: 99999,
    elevation: 99999,
  },
  buildMarkerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceListSidebar: {
    position: 'absolute',
    left: 0,
    top: 50,
    bottom: 0,
    width: 180,
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingTop: 10,
    paddingHorizontal: 8,
    zIndex: 2000,
  },
  sidebarTitle: {
    color: '#EC9A15',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  deviceScroll: {
    flex: 1,
  },
  deviceButton: {
    backgroundColor: 'rgba(60,60,60,0.8)',
    padding: 8,
    marginBottom: 6,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  deviceButtonSelected: {
    backgroundColor: 'rgba(236, 154, 21, 0.3)',
    borderColor: '#EC9A15',
  },
  deviceButtonText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  deviceButtonSubtext: {
    color: '#CCC',
    fontSize: 9,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1500,
    justifyContent: 'space-between',
    padding: 16,
    paddingLeft: 200,
  },
  statusBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
    marginTop: Platform.OS === 'ios' ? 50 : 20,
    borderLeftWidth: 3,
    borderLeftColor: '#EC9A15',
  },
  statusLabel: {
    color: '#EC9A15',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    marginVertical: 1,
    fontFamily: 'monospace',
  },
  messagesBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
    maxHeight: 150,
  },
  messagesTitle: {
    color: '#EC9A15',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    color: '#fff',
    fontSize: 10,
    marginVertical: 1,
    fontFamily: 'monospace',
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
  buttonSmall: {
    paddingVertical: 10,
  },
  closeButton: {
    backgroundColor: 'rgba(200, 0, 0, 0.8)',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
  },
});
