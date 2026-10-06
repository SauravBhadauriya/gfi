import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';

const BUILD_TIMESTAMP = new Date().toISOString();

export default function CamExpoMinScreen() {
  const cameraRef = useRef<any>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  
  const [cameraReady, setCameraReady] = useState(false);
  const [mountError, setMountError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoSize, setPhotoSize] = useState<{ width: number; height: number } | null>(null);
  
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoFileSize, setVideoFileSize] = useState<number | null>(null);

  const handleCameraReady = () => {
    console.log('[CamExpoMin] onCameraReady fired');
    setCameraReady(true);
  };

  const handleMountError = (error: any) => {
    console.error('[CamExpoMin] onMountError:', error);
    setMountError(error?.message || String(error));
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current || !cameraReady) {
      console.log('[CamExpoMin] Camera not ready');
      return;
    }

    try {
      console.log('[CamExpoMin] Taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
        skipProcessing: false,
      });
      
      console.log('[CamExpoMin] Photo taken:', photo);
      setPhotoUri(photo.uri);
      setPhotoSize({ width: photo.width, height: photo.height });
    } catch (error: any) {
      console.error('[CamExpoMin] takePictureAsync error:', error);
      setMountError('Photo error: ' + error.message);
    }
  };

  const handleRecord3s = async () => {
    if (!cameraRef.current || !cameraReady) {
      console.log('[CamExpoMin] Camera not ready');
      return;
    }

    if (!micPermission?.granted) {
      const granted = await requestMicPermission();
      if (!granted) {
        setMountError('Mic permission denied');
        return;
      }
    }

    try {
      console.log('[CamExpoMin] Starting 3s recording...');
      setIsRecording(true);
      setVideoUri(null);
      setVideoFileSize(null);

      const video = await cameraRef.current.recordAsync({
        maxDuration: 3,
        mute: false,
      });
      
      setIsRecording(false);
      console.log('[CamExpoMin] Video recorded:', video);
      setVideoUri(video.uri);

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(video.uri);
      if (fileInfo.exists && 'size' in fileInfo) {
        setVideoFileSize(fileInfo.size);
      }
    } catch (error: any) {
      setIsRecording(false);
      console.error('[CamExpoMin] recordAsync error:', error);
      setMountError('Video error: ' + error.message);
    }
  };

  const handleStopRecording = () => {
    if (cameraRef.current && isRecording) {
      console.log('[CamExpoMin] Stopping recording early');
      cameraRef.current.stopRecording();
    }
  };

  // Request permissions on mount
  React.useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }
      if (!micPermission?.granted) {
        await requestMicPermission();
      }
    })();
  }, []);

  if (!cameraPermission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>Camera permission required</Text>
        <TouchableOpacity onPress={requestCameraPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Red Banner */}
      <View style={styles.buildMarkerBanner}>
        <Text style={styles.buildMarkerText}>
          BUILD-MARK-1 | app/(main)/cam-expo-min.tsx MINIMAL | {BUILD_TIMESTAMP}
        </Text>
      </View>

      {/* Opaque Black Container */}
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* CameraView - absoluteFill, no children, minimal props */}
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          mode="picture"
          onCameraReady={handleCameraReady}
          onMountError={handleMountError}
        />
      </View>

      {/* Status Overlay */}
      <View style={styles.statusOverlay}>
        <ScrollView style={styles.statusScroll}>
          <Text style={styles.statusText}>Camera Ready: {cameraReady ? '✓' : '✗'}</Text>
          <Text style={styles.statusText}>Recording: {isRecording ? '✓' : '✗'}</Text>
          {mountError && (
            <Text style={[styles.statusText, { color: '#FF6B6B' }]}>Error: {mountError}</Text>
          )}
          
          {photoUri && photoSize && (
            <>
              <Text style={styles.statusText}>
                Photo: {photoSize.width}x{photoSize.height}
              </Text>
              <Image source={{ uri: photoUri }} style={styles.thumbnail} />
            </>
          )}

          {videoUri && (
            <>
              <Text style={styles.statusText}>
                Video: {videoUri.substring(videoUri.lastIndexOf('/') + 1)}
              </Text>
              <Text style={styles.statusText}>
                Size: {videoFileSize ? `${(videoFileSize / 1024).toFixed(1)} KB` : 'unknown'}
              </Text>
              <Text style={[styles.statusText, { color: '#00FF00' }]}>
                ✓ Video file created successfully
              </Text>
            </>
          )}
        </ScrollView>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          onPress={handleTakePicture}
          disabled={!cameraReady}
          style={[styles.button, !cameraReady && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>Take Picture</Text>
        </TouchableOpacity>

        {!isRecording ? (
          <TouchableOpacity
            onPress={handleRecord3s}
            disabled={!cameraReady}
            style={[styles.button, !cameraReady && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>Record 3s</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleStopRecording} style={[styles.button, styles.stopButton]}>
            <Text style={styles.buttonText}>Stop Recording</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => router.back()} style={[styles.button, styles.closeButton]}>
          <Text style={styles.buttonText}>Close</Text>
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
  statusOverlay: {
    position: 'absolute',
    top: 60,
    right: 10,
    width: 200,
    maxHeight: 300,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    padding: 8,
    zIndex: 1000,
  },
  statusScroll: {
    maxHeight: 280,
  },
  statusText: {
    color: '#FFF',
    fontSize: 11,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  thumbnail: {
    width: 180,
    height: 120,
    marginVertical: 8,
    borderRadius: 4,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    gap: 10,
    zIndex: 1000,
  },
  button: {
    backgroundColor: '#EC9A15',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  stopButton: {
    backgroundColor: '#FF4444',
  },
  closeButton: {
    backgroundColor: '#333',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
