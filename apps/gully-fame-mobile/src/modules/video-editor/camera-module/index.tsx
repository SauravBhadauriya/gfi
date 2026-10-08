import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import CameraScreen from './screens/CameraScreen';
import EditorScreen from './screens/EditorScreen';
import type { CameraClipArray, CameraModuleScreenName } from './types/camera.types';

/**
 * Root entry point for the self-contained camera module.
 *
 * This component owns ONLY navigation and data passed to Editor:
 * - Home → Camera → Editor (new Instagram Edits-style editor)
 *
 * Camera-specific UI state (mode, flash, clips) lives inside `CameraScreen`.
 * EditorScreen receives a snapshot of clips when the user presses Next.
 */
const CameraModule: React.FC = () => {
  const [screen, setScreen] = useState<CameraModuleScreenName>('Home');
  const [editorClips, setEditorClips] = useState<CameraClipArray>([]);
  const [cameraClips, setCameraClips] = useState<CameraClipArray>([]);

  const handleOpenCamera = useCallback(() => {
    setCameraClips([]);
    setScreen('Camera');
  }, []);

  const handleBackToHome = useCallback(() => {
    setScreen('Home');
    setCameraClips([]);
    setPreviewClips([]);
  }, []);

  const handleNextFromCamera = useCallback((clips: CameraClipArray) => {
    console.log('🎥 CameraModule: handleNextFromCamera called with', clips?.length ?? 0, 'clips');
    console.log('🎥 CameraModule: Raw clips array:', JSON.stringify(clips, null, 2));
    if (clips && clips.length > 0) {
      console.log('📹 CameraModule: First clip:', JSON.stringify(clips[0], null, 2));
    }
    setCameraClips(clips);
    setEditorClips(clips);
    setScreen('Preview');
  }, []);

  const handleAddClipFromEditor = useCallback((source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      // Navigate back to camera screen to record new clip
      // Pass existing clips so they're preserved
      setScreen('Camera');
    }
    // Gallery is handled in EditorScreen via onAddClipFromGallery
  }, []);

  const handleBackFromEditor = useCallback(() => {
    // Go back to camera screen (not home) so user can continue adding clips
    // Pass existing clips so they're preserved (use cameraClips which should be synced)
    setScreen('Camera');
  }, []);

  const handleClipUpdateFromEditor = useCallback((clips: CameraClipArray) => {
    setEditorClips(clips);
    setCameraClips(clips);
  }, []);
  
  const handleNextFromEditor = useCallback((editedClips: CameraClipArray) => {
    console.log('✅ EditorScreen: Export completed with', editedClips?.length ?? 0, 'clips');
    // TODO: Navigate to upload screen or handle export
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {screen === 'Home' && <HomeScreen onOpenCamera={handleOpenCamera} />}
      {screen === 'Camera' && (
        <CameraScreen
          onBack={handleBackToHome}
          onNext={handleNextFromCamera}
          initialClips={cameraClips}
        />
      )}
      {screen === 'Preview' && (
        <EditorScreen
          clips={editorClips}
          onBack={handleBackFromEditor}
          onNext={handleNextFromEditor}
        />
      )}
    </View>
  );
};

export default CameraModule;


