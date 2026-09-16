/**
 * Reel Preview Screen
 * - Preview recorded/selected video
 * - Add caption and tags
 * - Upload to backend
 * - Show upload progress
 */

import React, { useEffect, useRef, useState } from 'react';
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
import { VideoView, useVideoPlayer } from 'expo-video';
import { router, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';

interface ReelPreviewScreenParams {
  videoUri: string;
  duration: number;
  audioId?: string;
  audioName?: string;
  mode: string;
}

export default function ReelPreviewScreen() {
  const params = useLocalSearchParams<ReelPreviewScreenParams>();
  const videoRef = useRef<any>(null);

  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // =========================================================================
  // UPLOAD LOGIC
  // =========================================================================

  const uploadReel = async () => {
    if (!params?.videoUri) {
      Alert.alert('Error', 'Video not found');
      return;
    }

    if (!caption.trim()) {
      Alert.alert('Validation', 'Please add a caption');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(params.videoUri);
      if (!fileInfo.exists) {
        throw new Error('Video file not found');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('video', {
        uri: params.videoUri,
        type: 'video/mp4',
        name: `reel_${Date.now()}.mp4`,
      } as any);

      formData.append('caption', caption);
      formData.append('tags', tags);
      formData.append('duration', params.duration?.toString() || '0');
      formData.append('mode', params.mode || 'REEL');

      if (params.audioId) {
        formData.append('audioId', params.audioId);
      }

      // Upload to backend
      const xhr = new XMLHttpRequest();

      // Progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(Math.round(progress));
          console.log(`[ReelPreview] Upload progress: ${progress}%`);
        }
      });

      // Completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 201) {
          console.log('[ReelPreview] Upload successful');
          setIsUploading(false);
          Alert.alert('Success', 'Reel uploaded successfully!', [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/(main)/home');
              },
            },
          ]);
        } else {
          throw new Error(`Upload failed with status ${xhr.status}`);
        }
      });

      // Error
      xhr.addEventListener('error', () => {
        throw new Error('Upload failed');
      });

      // Make request
      xhr.open('POST', 'https://gullyfame.com/v1/api/reels/upload');
      
      // Add auth token
      const authToken = await getAuthToken();
      if (authToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
      }

      xhr.send(formData);
    } catch (error) {
      console.error('[ReelPreview] Upload error:', error);
      setIsUploading(false);
      Alert.alert('Error', error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const getAuthToken = async () => {
    // This would come from your auth context/storage
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem('authToken');
    } catch {
      return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Preview Reel</Text>
            <View style={{ width: 50 }} />
          </View>

          {/* Video Preview */}
          {params?.videoUri && (
            <View style={styles.videoContainer}>
              <Video
                ref={videoRef}
                source={{ uri: params.videoUri }}
                style={styles.video}
                useNativeControls
                resizeMode="contain"
                isLooping
              />
              <Text style={styles.durationText}>
                Duration: {params.duration}s
              </Text>
            </View>
          )}

          {/* Audio Info */}
          {params?.audioName && (
            <View style={styles.audioInfo}>
              <Text style={styles.audioInfoText}>
                🎵 Audio: {params.audioName}
              </Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Caption (required)</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="What's the story behind this reel?"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
              editable={!isUploading}
            />
            <Text style={styles.charCount}>{caption.length}/500</Text>

            <Text style={styles.label}>Tags (optional)</Text>
            <TextInput
              style={styles.tagsInput}
              placeholder="#tag1 #tag2 #tag3"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={tags}
              onChangeText={setTags}
              editable={!isUploading}
            />

            {/* Upload Progress */}
            {isUploading && (
              <View style={styles.uploadProgress}>
                <ActivityIndicator size="small" color="#EC9A15" />
                <Text style={styles.uploadText}>Uploading... {uploadProgress}%</Text>
                <View style={styles.progressBar}>
                  <View
                    style={{
                      height: '100%',
                      backgroundColor: '#EC9A15',
                      width: `${uploadProgress}%`,
                    }}
                  />
                </View>
              </View>
            )}

            {/* Action Buttons */}
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
                disabled={isUploading}
              >
                <Text style={styles.uploadButtonText}>
                  {isUploading ? 'Uploading...' : 'Upload Reel'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

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
  },
  video: {
    width: '100%',
    height: '100%',
  },
  durationText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
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
  form: {
    padding: 16,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
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
    marginBottom: 40,
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
