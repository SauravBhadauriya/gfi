import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import PreviewScreen from '@modules/video-editor/camera-module/screens/PreviewScreen';
import TimelineEditor from '@modules/video-editor/camera-module/components/timeline/TimelineEditor';
import type { CameraClipArray } from '@modules/video-editor/camera-module/types/camera.types';

/**
 * Editor Screen — orchestrates the preview and timeline editing flow
 * 
 * Receives recorded clips from upload flow. First shows a full-screen video preview (PreviewScreen).
 * When Edit is pressed, transitions to TimelineEditor for editing (text, filters, audio, stickers, etc).
 * Then navigates to post screen with the final edited video.
 */
export default function EditorScreen() {
  const params = useLocalSearchParams();
  const [clips, setClips] = useState<CameraClipArray>([]);
  const [isParsing, setIsReadyParsing] = useState(true);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  // Parse incoming clips safely
  useEffect(() => {
    if (params.clips) {
      try {
        const parsedClips = typeof params.clips === 'string' 
          ? JSON.parse(params.clips) 
          : params.clips;

        if (__DEV__) console.log(`[FLOW] EditorScreen: Parsed ${parsedClips?.length ?? 0} clips from router params`);
        if (Array.isArray(parsedClips)) {
          // Validate all clips have uris
          const hasValidUris = parsedClips.every(c => c?.uri && typeof c.uri === 'string');
          if (!hasValidUris) {
            if (__DEV__) console.error('[FLOW] EditorScreen: Some clips missing valid uris');
            setParseError('One or more clips are missing video files. Please re-record.');
            setIsReadyParsing(false);
            return;
          }
          setClips(parsedClips);
          setParseError(null);
          if (__DEV__) console.log(`[FLOW] EditorScreen: State updated with ${parsedClips.length} clips`);
        } else {
          if (__DEV__) console.error('[FLOW] EditorScreen: Parsed clips is not an array');
          setParseError('Invalid clip data received. Please re-record.');
        }
      } catch (e) {
        if (__DEV__) console.error('[FLOW] EditorScreen: Failed to parse clips:', e);
        setParseError('Failed to parse video data. Please re-record and try again.');
        const clipStrings = String(params.clips).split(",");
        setClips(
          clipStrings.map((uri, index) => ({ 
            id: `clip-${Date.now()}-${index}`, 
            uri: uri.trim(),
            duration: 0,
            type: 'video' as const,
            source: 'camera' as const
          }))
        );
      } finally {
        setIsReadyParsing(false);
      }
    } else {
      if (__DEV__) console.log('[FLOW] EditorScreen: No clips in params');
      setParseError('No video clips received. Please re-record.');
      setIsReadyParsing(false);
    }
  }, [params.clips]);

  const handleEditorBack = useCallback(() => {
    console.log('[EditorScreen] User cancelled editing, going back');
    router.back();
  }, []);

  const handleEditPress = useCallback((mergedUri: string, updatedClips: CameraClipArray) => {
    if (__DEV__) console.log(`[FLOW] EditorScreen.handleEditPress called with mergedUri`);
    // Update clips to use the merged video URI
    const clipsWithMergedUri = updatedClips.map((clip, idx) =>
      idx === 0 ? { ...clip, uri: mergedUri } : clip
    );
    setClips(clipsWithMergedUri);
    setShowTimeline(true);
  }, []);

  const handleEditorComplete = useCallback(() => {
    if (__DEV__) console.log(`[FLOW] EditorScreen.onExportComplete called: navigating to post with ${clips.length} clips`);
    
    // Parse route params (competition info, etc)
    const competitionId = params.competitionId ? String(params.competitionId) : null;
    const competitionName = params.competitionName ? String(params.competitionName) : null;
    const entryFee = params.entryFee ? String(params.entryFee) : null;

    // Navigate to post/share screen with complete edited clips payload
    if (__DEV__) console.log('[FLOW] Navigating to /(main)/upload/post');
    router.push({
      pathname: '/(main)/upload/post',
      params: {
        clips: JSON.stringify(clips),
        ...(competitionId && { competitionId }),
        ...(competitionName && { competitionName }),
        ...(entryFee && { entryFee }),
      },
    });
  }, [clips, params]);

  const handleClipUpdate = useCallback((updatedClips: CameraClipArray) => {
    console.log('[EditorScreen] Clips updated during editing:', updatedClips?.length ?? 0, 'clips');
    setClips(updatedClips);
  }, []);

  if (isParsing || !clips || clips.length === 0) {
    if (parseError) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={{ color: '#fff', fontSize: 16, marginHorizontal: 20, textAlign: 'center' }}>
            {parseError}
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#EC9A15', borderRadius: 8 }}>
            <Text style={{ color: '#000', fontWeight: 'bold' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EC9A15" />
      </View>
    );
  }

  return (
    showTimeline ? (
      <TimelineEditor
        clips={clips}
        onClipsUpdate={handleClipUpdate}
        onBack={handleEditorBack}
        onNext={handleEditorComplete}
      />
    ) : (
      <PreviewScreen
        clips={clips}
        onBack={handleEditorBack}
        onClipUpdate={handleClipUpdate}
        onExportComplete={handleEditorComplete}
        onEditPress={handleEditPress}
      />
    )
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});