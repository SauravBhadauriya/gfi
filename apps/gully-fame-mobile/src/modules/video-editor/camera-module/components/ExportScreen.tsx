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
} from 'react-native';
import * as MediaLibrary from 'expo-media-library/legacy';
import Svg, { Path } from 'react-native-svg';
import type { CameraClipArray } from '../types/camera.types';
import { exportAndCombineClips } from '../utils/videoExporter';

interface ExportScreenProps {
  clips: CameraClipArray;
  onBack: () => void;
  onComplete?: (exportedUri: string) => void;
  overlays?: any[];
}

/**
 * Export screen with progress indicator & direct handoff to Share Reel screen
 */
const ExportScreen: React.FC<ExportScreenProps> = ({ clips, onBack, onComplete, overlays = [] }) => {
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
          console.warn('Media Library permission not granted');
        }
      } catch (error) {
        console.warn('Permission error:', error);
      }
    };
    requestPermission();
  }, []);

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

    if (__DEV__) console.log(`[FLOW] ExportScreen: Starting export of ${clips.length} clips`);

    try {
      setProgress(0.1);
      setStatus('Processing clips...');

      // Export and combine clips + stickers
      const outputUri = await exportAndCombineClips(
        clips,
        (currentProgress: number, currentStatus: string) => {
          setProgress(currentProgress);
          setStatus(currentStatus);
        },
        overlays
      );

      setProgress(0.95);
      setStatus('Finalizing video...');

      if (outputUri) {
        if (__DEV__) console.log(`[FLOW] Export complete: output=${outputUri.substring(0, 50)}...`);
        
        // Save to gallery silently in background
        try {
          const asset = await MediaLibrary.createAssetAsync(outputUri);
          await MediaLibrary.createAlbumAsync('Gully Fame', asset, false);
        } catch (e) {
          console.warn('Background gallery save skipped:', e);
        }

        setProgress(1);
        setStatus('Export complete!');
        setExportedUri(outputUri);

        // 🛠️ DIRECT HANDOFF: Bypass gallery alert & navigate to post screen
        if (onComplete) {
          if (__DEV__) console.log('[FLOW] ExportScreen: Calling onComplete with exported uri');
          onComplete(outputUri);
        }
      } else {
        if (__DEV__) console.error('[FLOW] Export failed: No output file');
        throw new Error('Export failed: No output file');
      }
    } catch (error: any) {
      if (__DEV__) console.error('[FLOW] Export error:', error.message || error);
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
  }, [clips, exporting, onBack, onComplete, overlays]);

  // Auto-start export when screen loads
  useEffect(() => {
    if (clips.length > 0 && !exporting && !exportedUri) {
      handleExport();
    }
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
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
        <Text style={styles.headerTitle}>Exporting Video</Text>
        <View style={styles.backButton} />
      </View>

      {/* Content */}
      <View style={styles.content}>
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

        <Text style={styles.statusText}>{status}</Text>
        <ActivityIndicator size="large" color="#EC9A15" style={styles.spinner} />
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
    paddingTop: 16,
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
    backgroundColor: '#EC9A15',
    borderRadius: 4,
  },
  progressText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  spinner: {
    marginTop: 12,
  },
});

export default ExportScreen;