import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import Svg, { Path } from 'react-native-svg';
import type { CameraClip, CameraClipArray } from '../types/camera.types';
import { exportAndCombineClips } from '../utils/videoExporter';

interface ExportScreenProps {
  clips: CameraClipArray;
  onBack: () => void;
  onComplete?: () => void;
}

/**
 * Export screen with progress indicator and save to gallery
 */
const ExportScreen: React.FC<ExportScreenProps> = ({ clips, onBack, onComplete }) => {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Preparing export...');
  const [exportedUri, setExportedUri] = useState<string | null>(null);
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  // Request media library permission
  useEffect(() => {
    const requestPermission = async () => {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'We need permission to save videos to your gallery.',
            [{ text: 'OK', onPress: onBack }]
          );
        }
      } catch (error) {
        console.warn('Permission error:', error);
      }
    };
    requestPermission();
  }, [onBack]);

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const handleExport = useCallback(async () => {
    if (exporting || clips.length === 0) return;

    setExporting(true);
    setProgress(0);
    setStatus('Initializing export...');
    setExportedUri(null);

    try {
      // Update progress
      setProgress(0.1);
      setStatus('Processing clips...');

      // Export and combine clips
      const outputUri = await exportAndCombineClips(
        clips,
        (currentProgress: number, currentStatus: string) => {
          setProgress(currentProgress);
          setStatus(currentStatus);
        }
      );

      setProgress(0.9);
      setStatus('Saving to gallery...');

      // Save to gallery
      if (outputUri) {
        const asset = await MediaLibrary.createAssetAsync(outputUri);
        await MediaLibrary.createAlbumAsync('Video Editor', asset, false);

        setProgress(1);
        setStatus('Export complete!');
        setExportedUri(outputUri);

        Alert.alert(
          'Success!',
          'Video saved to gallery successfully!',
          [
            {
              text: 'Done',
              onPress: () => {
                onComplete?.();
                onBack();
              },
            },
          ]
        );
      } else {
        throw new Error('Export failed: No output file');
      }
    } catch (error: any) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Failed',
        error?.message || 'An error occurred while exporting. Please try again.',
        [
          { text: 'Cancel', style: 'cancel', onPress: onBack },
          { text: 'Retry', onPress: handleExport },
        ]
      );
      setStatus('Export failed');
    } finally {
      setExporting(false);
    }
  }, [clips, exporting, onBack, onComplete]);

  // Auto-start export when screen loads
  useEffect(() => {
    if (clips.length > 0 && !exporting && !exportedUri) {
      handleExport();
    }
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} disabled={exporting}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exporting</Text>
        <View style={styles.backButton} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {exporting ? (
          <>
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressWidth,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
            </View>

            {/* Status Text */}
            <Text style={styles.statusText}>{status}</Text>

            {/* Spinner */}
            <ActivityIndicator size="large" color="#ec9a15" style={styles.spinner} />
          </>
        ) : exportedUri ? (
          <>
            <View style={styles.successContainer}>
              <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                  stroke="#4CAF50"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M22 4L12 14.01l-3-3"
                  stroke="#4CAF50"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.successTitle}>Video Saved!</Text>
              <Text style={styles.successSubtitle}>Your video has been saved to gallery</Text>
            </View>
          </>
        ) : (
          <View style={styles.readyContainer}>
            <Text style={styles.readyText}>Ready to export</Text>
            <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
              <Text style={styles.exportButtonText}>Start Export</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ec9a15',
    borderRadius: 4,
  },
  progressText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  spinner: {
    marginTop: 24,
  },
  successContainer: {
    alignItems: 'center',
  },
  successTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
  },
  successSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
  },
  readyContainer: {
    alignItems: 'center',
  },
  readyText: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 24,
  },
  exportButton: {
    backgroundColor: '#ec9a15',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: '#ec9a15',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  exportButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ExportScreen;

