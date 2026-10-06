import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  SafeAreaView as RNSafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as MediaLibrary from 'expo-media-library';
import { exportAndCombineClips } from '../utils/videoExporter';
import type { CameraClip, CameraClipArray } from '../types/camera.types';

interface PreviewScreenProps {
  clips: CameraClipArray;
  onBack?: () => void;
  onClipUpdate?: (clips: CameraClipArray) => void;
  onAddClip?: (source: 'camera' | 'gallery') => void;
  onExportComplete?: () => void;
  onEditPress?: (mergedUri: string, clips: CameraClipArray) => void;
}

const PreviewScreen: React.FC<PreviewScreenProps> = ({
  clips,
  onBack,
  onClipUpdate,
  onAddClip,
  onExportComplete,
  onEditPress,
}) => {
  const insets = useSafeAreaInsets();
  const [mergedUri, setMergedUri] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [mergeProgress, setMergeProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const playerRef = useRef<any>(null);
  const player = useVideoPlayer(mergedUri ?? '', (player) => {
    if (mergedUri) {
      player.loop = true;
      player.muted = isMuted;
      player.play();
      playerRef.current = player;
    }
  });

  // Sync muted state with player
  useEffect(() => {
    if (playerRef.current && mergedUri) {
      playerRef.current.muted = isMuted;
    }
  }, [isMuted, mergedUri]);

  // Merge clips on mount
  useEffect(() => {
    if (clips.length === 0) {
      return;
    }

    if (clips.length === 1) {
      // Single clip: use directly without merge
      setMergedUri(clips[0].uri);
      setIsMerging(false);
      return;
    }

    // Multiple clips: merge them
    const mergeClips = async () => {
      setIsMerging(true);
      setMergeError(null);
      setMergeProgress(0);

      try {
        const uri = await exportAndCombineClips(
          clips,
          (progress, status) => {
            setMergeProgress(progress);
            if (__DEV__) console.log(`[PreviewScreen] Merge progress: ${Math.round(progress * 100)}% - ${status}`);
          }
        );
        setMergedUri(uri);
        if (__DEV__) console.log(`[PreviewScreen] Merge complete: ${uri}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[PreviewScreen] Merge error:', errorMsg);
        setMergeError(errorMsg || 'Failed to merge videos');
      } finally {
        setIsMerging(false);
      }
    };

    mergeClips();
  }, [clips]);

  const handleBack = useCallback(() => {
    Alert.alert('Discard recording?', 'Going back will discard your recording.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: onBack,
      },
    ]);
  }, [onBack]);

  const handleRetake = useCallback(() => {
    Alert.alert('Re-record?', 'This will discard your current recording and take you back to the camera.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Re-record',
        style: 'destructive',
        onPress: () => {
          onClipUpdate?.([]);
          onBack?.();
        },
      },
    ]);
  }, [onBack, onClipUpdate]);

  const handleSaveToGallery = useCallback(async () => {
    if (!mergedUri) return;

    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to your gallery to save this video.');
        return;
      }

      await MediaLibrary.saveToLibraryAsync(mergedUri);
      Alert.alert('Success', 'Video saved to gallery');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[PreviewScreen] Save to gallery error:', errorMsg);
      Alert.alert('Error', 'Failed to save video to gallery');
    }
  }, [mergedUri]);

  const handleEdit = useCallback(() => {
    if (mergedUri) {
      onEditPress?.(mergedUri, clips);
    }
  }, [mergedUri, clips, onEditPress]);

  const handleNext = useCallback(() => {
    onExportComplete?.();
  }, [onExportComplete]);

  const handleRetryMerge = useCallback(() => {
    setMergeError(null);
    setMergeProgress(0);
    setMergedUri(null);
    // Trigger re-merge by retrieving first clip
    if (clips.length === 1) {
      setMergedUri(clips[0].uri);
    }
  }, [clips]);

  // Empty state
  if (!clips || clips.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No media found</Text>
      </View>
    );
  }

  // Merging state
  if (isMerging) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#EC9A15" style={styles.spinner} />
        <Text style={styles.mergeProgressText}>Merging videos…</Text>
        <Text style={styles.mergeProgressPercent}>{Math.round(mergeProgress * 100)}%</Text>
      </View>
    );
  }

  // Error state
  if (mergeError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{mergeError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetryMerge}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onBack}>
          <Text style={styles.cancelButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Video preview state
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {mergedUri && (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      )}

      {/* Top overlay */}
      <RNSafeAreaView style={[styles.topOverlay, { paddingTop: insets.top }]} pointerEvents="box-none">
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.muteButton} onPress={() => setIsMuted(!isMuted)}>
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={24} color="#fff" />
        </TouchableOpacity>
      </RNSafeAreaView>

      {/* Bottom overlay */}
      <View style={[styles.bottomOverlay, { paddingBottom: insets.bottom + 16 }]} pointerEvents="box-none">
        <View style={styles.bottomButtonGroup}>
          <TouchableOpacity style={styles.controlButton} onPress={handleRetake}>
            <Ionicons name="refresh-outline" size={24} color="#fff" />
            <Text style={styles.controlButtonText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={handleSaveToGallery}>
            <Ionicons name="download-outline" size={24} color="#fff" />
            <Text style={styles.controlButtonText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={24} color="#fff" />
            <Text style={styles.controlButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.controlButton, styles.nextButton]} onPress={handleNext}>
            <Ionicons name="checkmark" size={24} color="#000" />
            <Text style={[styles.controlButtonText, styles.nextButtonText]}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 20,
  },
  mergeProgressText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  mergeProgressPercent: {
    color: '#EC9A15',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#EC9A15',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 100,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  bottomButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  controlButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#EC9A15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  nextButtonText: {
    color: '#000',
    marginTop: 4,
  },
});

export default PreviewScreen;
