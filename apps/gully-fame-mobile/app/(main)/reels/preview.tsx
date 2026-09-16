/**
 * Reel Preview Screen
 * - Preview recorded segments
 * - Add caption and tags
 * - Upload to backend
 * - Show upload progress
 * - Merges multiple clips using FFmpeg
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadVideoComplete, VideoUploadRequest } from '@api/services/videoUploadService';
import { useVideoPlayer, VideoView } from 'expo-video';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';

interface RecordingSegment {
  uri: string;
  duration: number;
  timestamp: number;
}

interface PreviewParams {
  segments?: string;
  videoUri?: string;
  duration?: string;
  audioId?: string;
  audioName?: string;
  mode?: string;
}

export default function ReelPreviewScreen() {
  const params = useLocalSearchParams<PreviewParams>();

  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mergedVideoUri, setMergedVideoUri] = useState('');
  const [totalDuration, setTotalDuration] = useState(0);
  const [isMerging, setIsMerging] = useState(false); // 👈 New state for FFmpeg merging

  const segments: RecordingSegment[] = React.useMemo(() => {
    if (!params?.segments) return [];
    try {
      return JSON.parse(params.segments);
    } catch {
      console.error('[ReelPreview] Failed to parse segments');
      return [];
    }
  }, [params?.segments]);

  const videoUri = React.useMemo(() => {
    if (params?.videoUri) {
      return params.videoUri;
    }
    return mergedVideoUri;
  }, [params?.videoUri, mergedVideoUri]);

  // Player initialization
  const player = useVideoPlayer(videoUri, (playerInstance) => {
    playerInstance.loop = true;
    playerInstance.play();
  });

  // Calculate total duration
  useEffect(() => {
    if (params?.duration) {
      setTotalDuration(parseInt(params.duration));
    } else if (segments.length > 0) {
      const total = segments.reduce((sum, seg) => sum + seg.duration, 0);
      setTotalDuration(total);
    }
  }, [params?.duration, segments]);

  // =========================================================================
  // FFmpeg VIDEO MERGING
  // =========================================================================
  useEffect(() => {
    const processVideos = async () => {
      if (params?.videoUri) {
        console.log('[ReelPreview] Using gallery video:', params.videoUri);
        return;
      }

      if (segments.length === 0) return;

      if (segments.length === 1) {
        setMergedVideoUri(segments[0].uri);
        console.log('[ReelPreview] Using single segment:', segments[0].uri);
        return;
      }

      // Multiple segments detected - Merge them with FFmpeg!
      try {
        setIsMerging(true);
        
        // 1. Create a text file listing all segments for FFmpeg
        const listPath = FileSystem.cacheDirectory + 'segments.txt';
        const outputPath = FileSystem.cacheDirectory + `merged_${Date.now()}.mp4`;

        // Format required by FFmpeg concat demuxer: file '/path/to/file.mp4'
        const fileContent = segments.map(seg => `file '${seg.uri}'`).join('\n');
        await FileSystem.writeAsStringAsync(listPath, fileContent);

        console.log('[ReelPreview] Starting FFmpeg merge...');
        
        // 2. Run FFmpeg command (-c copy stitches them instantly without re-rendering)
        const command = `-f concat -safe 0 -i ${listPath} -c copy ${outputPath}`;
        const session = await FFmpegKit.execute(command);
        const returnCode = await session.getReturnCode();

        if (ReturnCode.isSuccess(returnCode)) {
          console.log('[ReelPreview] Merge successful! Output:', outputPath);
          setMergedVideoUri(outputPath);
        } else {
          console.error('[ReelPreview] FFmpeg merge failed. Fallback to first clip.');
          setMergedVideoUri(segments[0].uri);
        }
      } catch (error) {
        console.error('[ReelPreview] Merge error:', error);
        setMergedVideoUri(segments[0].uri); // Fallback on error
      } finally {
        setIsMerging(false);
      }
    };

    processVideos();
  }, [segments, params?.videoUri]);

  // =========================================================================
  // UPLOAD LOGIC
  // =========================================================================
  const uploadReel = async () => {
    if (!caption.trim()) {
      Alert.alert('Validation', 'Please add a caption');
      return;
    }

    if (!videoUri) {
      Alert.alert('Error', 'Video not found');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      if (!fileInfo.exists) {
        throw new Error('Video file not found');
      }

      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        Alert.alert('Error', 'Not authenticated. Please login again.');
        router.replace('/(auth)/login');
        return;
      }

      const uploadRequest: VideoUploadRequest = {
        title: caption.substring(0, 100),
        description: caption,
        duration: totalDuration,
        resolution: '1080p',
        fps: 30,
        tags: tags.split('#').filter(t => t.trim()),
      };

      if (params?.audioId) {
        (uploadRequest as any).music = {
          trackId: params.audioId,
          title: params.audioName || 'Unknown',
        };
      }

      console.log('[ReelPreview] Starting upload with:', {
        title: uploadRequest.title,
        duration: uploadRequest.duration,
        audioId: params?.audioId,
      });

      const result = await uploadVideoComplete(
        videoUri,
        uploadRequest,
        (stage, progress) => {
          console.log(`[ReelPreview] Upload progress: ${stage} - ${progress}%`);
          setUploadProgress(progress);
        }
      );

      if (!result.success) {
        throw new Error(result.message || 'Upload failed');
      }

      console.log('[ReelPreview] Upload successful:', result.data?.reelId);

      setIsUploading(false);
      Alert.alert('Success', 'Reel uploaded successfully!', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/(main)/reels');
          },
        },
      ]);
    } catch (error) {
      console.error('[ReelPreview] Upload error:', error);
      setIsUploading(false);
      Alert.alert(
        'Upload Error',
        error instanceof Error ? error.message : 'Failed to upload reel'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Preview Reel</Text>
            <View style={{ width: 50 }} />
          </View>

          {/* Conditional rendering: Show Loader while merging, else show VideoView */}
          {isMerging ? (
            <View style={[styles.videoContainer, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color="#EC9A15" />
              <Text style={{ color: '#fff', marginTop: 12, fontWeight: '600' }}>Stitching clips together...</Text>
            </View>
          ) : videoUri ? (
            <View style={styles.videoContainer}>
              <VideoView
                style={styles.video}
                player={player}
                allowsFullscreen={false}
                nativeControls={true}
              />
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>
                  {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}
                </Text>
              </View>
            </View>
          ) : null}

          {params?.audioName && (
            <View style={styles.audioInfo}>
              <Text style={styles.audioInfoText}>
                🎵 {params.audioName}
              </Text>
            </View>
          )}

          {segments.length > 1 && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                📹 {segments.length} segments merged ({totalDuration}s total)
              </Text>
            </View>
          )}

          <View style={styles.form}>
            <View>
              <Text style={styles.label}>Caption *</Text>
              <TextInput
                style={styles.captionInput}
                placeholder="What's in this reel?"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={500}
                editable={!isUploading}
              />
              <Text style={styles.charCount}>{caption.length}/500</Text>
            </View>

            <View style={{ marginTop: 20 }}>
              <Text style={styles.label}>Tags (optional)</Text>
              <TextInput
                style={styles.tagsInput}
                placeholder="#tag1 #tag2 #tag3"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={tags}
                onChangeText={setTags}
                editable={!isUploading}
              />
            </View>

            {isUploading && (
              <View style={styles.uploadProgress}>
                <ActivityIndicator size="small" color="#EC9A15" />
                <Text style={styles.uploadText}>
                  {uploadProgress}%
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={{
                      height: '100%',
                      backgroundColor: '#EC9A15',
                      width: `${uploadProgress}%`,
                      borderRadius: 2,
                    }}
                  />
                </View>
              </View>
            )}

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.discardButton]}
                onPress={() => router.back()}
                disabled={isUploading}
              >
                <Text style={styles.discardButtonText}>Discard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
                onPress={uploadReel}
                disabled={isUploading || !caption.trim() || isMerging}
              >
                <Text style={styles.uploadButtonText}>
                  {isUploading ? `Uploading ${uploadProgress}%` : 'Upload Reel'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    color: '#EC9A15',
    fontSize: 14,
    fontWeight: '600',
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    backgroundColor: '#000',
    marginTop: 12,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  audioInfo: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(236, 154, 21, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#EC9A15',
  },
  audioInfoText: {
    color: '#EC9A15',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  infoText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  form: {
    padding: 16,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  captionInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  tagsInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  charCount: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  uploadProgress: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(236, 154, 21, 0.1)',
    borderRadius: 8,
  },
  uploadText: {
    color: '#EC9A15',
    fontSize: 12,
    fontWeight: '600',
    marginVertical: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(236, 154, 21, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discardButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  discardButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#EC9A15',
  },
  uploadButtonDisabled: {
    backgroundColor: 'rgba(236, 154, 21, 0.5)',
  },
  uploadButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
});