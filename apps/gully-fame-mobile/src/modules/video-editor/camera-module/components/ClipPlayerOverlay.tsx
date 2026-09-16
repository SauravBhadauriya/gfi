import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { Video } from 'expo-video';
import type { CameraClip } from '../types/camera.types';

interface ClipPlayerOverlayProps {
  clip: CameraClip;
  onClose: () => void;
}

/**
 * Full-screen player for a single clip (photo or video).
 *
 * - Opens on top of the camera screen
 * - Back button returns to the camera so the user can continue capturing
 */
const ClipPlayerOverlay: React.FC<ClipPlayerOverlayProps> = ({ clip, onClose }) => {
  const isVideo = clip.type === 'video';

  return (
    <SafeAreaView style={styles.overlayContainer}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Preview</Text>
      </View>

      <View style={styles.content}>
        {isVideo ? (
          <Video
            style={styles.media}
            source={{ uri: clip.uri }}
            useNativeControls
            resizeMode="contain"
            shouldPlay
            isLooping={false}
            rate={clip.speed ?? 1.0}
          />
        ) : (
          <Image
            source={{ uri: clip.uri }}
            style={styles.media}
            resizeMode="contain"
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'flex-start',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  backButtonText: {
    color: '#e5e7eb',
    fontSize: 14,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    marginRight: 48, // space so title remains centered relative to back button
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  media: {
    width: '100%',
    height: '80%',
  },
});

export default ClipPlayerOverlay;


