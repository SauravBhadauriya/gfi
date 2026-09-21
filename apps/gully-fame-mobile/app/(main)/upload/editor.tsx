import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import PreviewScreen from '@modules/video-editor/camera-module/screens/PreviewScreen';
import type { CameraClipArray } from '@modules/video-editor/camera-module/types/camera.types';

/**
 * Editor Screen — wraps the real video editor (PreviewScreen)
 * 
 * Receives recorded clips from upload flow, allows editing (text, filters, audio, stickers, etc),
 * then navigates to post screen with the final edited video.
 */
export default function EditorScreen() {
  const params = useLocalSearchParams();
  const [clips, setClips] = useState<CameraClipArray>([]);

  useEffect(() => {
    if (params.clips) {
      try {
        const parsedClips = JSON.parse(params.clips as string);
        console.log('[EditorScreen] Parsed clips from params:', parsedClips?.length ?? 0, 'clips');
        setClips(parsedClips);
      } catch (e) {
        console.error('[EditorScreen] Failed to parse clips:', e);
        const clipStrings = String(params.clips).split(",");
        setClips(clipStrings.map((uri, index) => ({ 
          id: String(index), 
          uri,
          duration: 0,
          type: 'video' as const,
          source: 'camera' as const
        })));
      }
    }
  }, [params.clips]);

  const handleEditorBack = () => {
    console.log('[EditorScreen] User cancelled editing, going back');
    router.back();
  };

  const handleEditorComplete = () => {
    console.log('[EditorScreen] User exported edited video, navigating to post screen');
    
    // Parse route params (competition info, etc)
    const competitionId = params.competitionId ? String(params.competitionId) : null;
    const competitionName = params.competitionName ? String(params.competitionName) : null;
    const entryFee = params.entryFee ? String(params.entryFee) : null;

    // Navigate to post/share screen with edited clips
    router.push({
      pathname: '/(main)/upload/post',
      params: {
        clips: JSON.stringify(clips),
        ...(competitionId && { competitionId }),
        ...(competitionName && { competitionName }),
        ...(entryFee && { entryFee }),
      },
    });
  };

  const handleClipUpdate = (updatedClips: CameraClipArray) => {
    console.log('[EditorScreen] Clips updated during editing:', updatedClips?.length ?? 0, 'clips');
    setClips(updatedClips);
  };

  if (!clips || clips.length === 0) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  return (
    <PreviewScreen
      clips={clips}
      onBack={handleEditorBack}
      onClipUpdate={handleClipUpdate}
      onExportComplete={handleEditorComplete}
    />
  );
}
