import React, { useCallback, useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import ExportScreen from '../components/ExportScreen';
import TimelineEditor from '../components/timeline/TimelineEditor';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { cameraStyles } from '../styles/cameraStyles';
import { calculateTimelinePositions } from '../utils/timelineHelpers';
import type { CameraClip, CameraClipArray } from '../types/camera.types';

interface ActiveOverlay {
  id: string;
  type: 'image' | 'emoji';
  content: string | number;
}

interface PreviewScreenProps {
  clips: CameraClipArray;
  onBack?: () => void;
  onClipUpdate?: (clips: CameraClipArray) => void;
  onAddClip?: (source: 'camera' | 'gallery') => void;
  onExportComplete?: () => void;
}

const PreviewScreen: React.FC<PreviewScreenProps> = ({ 
  clips, 
  onBack, 
  onClipUpdate, 
  onAddClip,
  onExportComplete
}) => {
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [updatedClips, setUpdatedClips] = useState<CameraClipArray>(clips);
  const [showExport, setShowExport] = useState(false);
  
  const [overlays, setOverlays] = useState<ActiveOverlay[]>([]);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const overlayCounterRef = useRef(0);

  const undoRedo = useUndoRedo(clips);

  useEffect(() => {
    if (clips && clips.length > 0) {
      setUpdatedClips(clips);
      undoRedo.reset(clips);
    }
  }, [clips]); 

  const handleSelectOverlay = useCallback((type: 'image' | 'emoji', content: string | number) => {
    overlayCounterRef.current += 1;
    const newOverlay: ActiveOverlay = {
      id: `overlay-${Date.now()}-${overlayCounterRef.current}`,
      type,
      content,
    };
    setOverlays(prev => [...prev, newOverlay]);
    setActiveOverlayId(newOverlay.id);
  }, []);

  const handleDeleteOverlay = useCallback((id: string) => {
    setOverlays(prev => prev.filter(item => item.id !== id));
    setActiveOverlayId(null);
  }, []);

  const handleAddClip = useCallback((source: 'camera' | 'gallery') => {
    onAddClip?.(source);
  }, [onAddClip]);

  const handleAddClipFromGallery = useCallback((newClip: CameraClip) => {
    undoRedo.addToHistory({ clips: updatedClips });
    
    const newClips = [...updatedClips, newClip];
    const positionedClips = calculateTimelinePositions(newClips);
    
    setUpdatedClips(positionedClips);
    setCurrentClipIndex(positionedClips.length - 1);
    onClipUpdate?.(positionedClips);
  }, [updatedClips, onClipUpdate, undoRedo]);

  const handleUndo = useCallback(() => {
    const previousState = undoRedo.undo();
    if (previousState) {
      const positionedClips = calculateTimelinePositions(previousState.clips);
      setUpdatedClips(positionedClips);
      onClipUpdate?.(positionedClips);
      
      if (currentClipIndex >= positionedClips.length) {
        setCurrentClipIndex(Math.max(0, positionedClips.length - 1));
      }
    }
  }, [undoRedo, onClipUpdate, currentClipIndex]);

  const handleRedo = useCallback(() => {
    const nextState = undoRedo.redo();
    if (nextState) {
      const positionedClips = calculateTimelinePositions(nextState.clips);
      setUpdatedClips(positionedClips);
      onClipUpdate?.(positionedClips);
      
      if (currentClipIndex >= positionedClips.length) {
        setCurrentClipIndex(Math.max(0, positionedClips.length - 1));
      }
    }
  }, [undoRedo, onClipUpdate, currentClipIndex]);

  const handleNext = useCallback(() => {
    setShowExport(true);
  }, []);

  // 🛠️ FIX: Receives exported video URI and updates parent before navigating to post screen
  const handleExportComplete = useCallback((exportedVideoUri?: string) => {
    if (__DEV__) console.log(`[FLOW] PreviewScreen.handleExportComplete called: exportedUri=${exportedVideoUri?.substring(0, 50)}..., clips=${updatedClips.length}`);
    setShowExport(false);

    if (exportedVideoUri && updatedClips.length > 0) {
      // Validate exported file exists before proceeding
      if (__DEV__) console.log(`[FLOW] Validating export file exists: ${exportedVideoUri.substring(0, 50)}...`);
      FileSystem.getInfoAsync(exportedVideoUri)
        .then((fileInfo) => {
          if (!fileInfo.exists) {
            if (__DEV__) console.error(`[FLOW] Export file does not exist: ${exportedVideoUri}`);
            Alert.alert(
              "Export Failed",
              "The exported video file was not found. Please try exporting again.",
              [{ text: "OK", onPress: () => setShowExport(true) }]
            );
            return;
          }
          
          if (__DEV__) console.log(`[FLOW] Export file validated: size=${fileInfo.size} bytes`);
          const exportReadyClips = updatedClips.map((clip, idx) =>
            idx === 0 ? { ...clip, uri: exportedVideoUri } : clip
          );
          if (__DEV__) console.log(`[FLOW] Updated first clip with export uri`);
          onClipUpdate?.(exportReadyClips);

          if (__DEV__) console.log('[FLOW] PreviewScreen: Calling onExportComplete (will navigate to post)');
          onExportComplete?.();
        })
        .catch((error) => {
          if (__DEV__) console.error('[FLOW] File validation error:', error);
          Alert.alert(
            "Export Validation Error",
            "Could not verify the exported video file. Please try again.",
            [{ text: "OK", onPress: () => setShowExport(true) }]
          );
        });
    } else {
      if (__DEV__) console.warn('[FLOW] Export complete but no uri or no clips');
      if (!exportedVideoUri) {
        Alert.alert(
          "Export Failed",
          "The video export did not produce an output file. Please try again.",
          [{ text: "OK", onPress: () => setShowExport(true) }]
        );
      } else {
        if (__DEV__) console.log('[FLOW] PreviewScreen: Calling onExportComplete (will navigate to post)');
        onExportComplete?.();
      }
    }
  }, [updatedClips, onClipUpdate, onExportComplete]);

  if (!clips?.length || !updatedClips[currentClipIndex]) {
    return (
      <SafeAreaView style={[cameraStyles.previewContainer, styles.emptyContainer]}>
        <Text style={styles.emptyText}>No media found</Text>
      </SafeAreaView>
    );
  }

  if (showExport) {
    return (
      <ExportScreen
        clips={updatedClips}
        overlays={overlays}
        onBack={() => setShowExport(false)}
        onComplete={handleExportComplete}
      />
    );
  }

  return (
    <View style={styles.container}>
      <TimelineEditor
        clips={updatedClips}
        onClipsUpdate={(newClips) => {
          undoRedo.addToHistory({ clips: updatedClips });
          setUpdatedClips(newClips);
          onClipUpdate?.(newClips);
        }}
        onBack={onBack}
        onNext={handleNext}
        onAddClip={handleAddClip}
        onAddClipFromGallery={handleAddClipFromGallery}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoRedo.canUndo}
        canRedo={undoRedo.canRedo}
        
        overlays={overlays}
        activeOverlayId={activeOverlayId}
        onSelectOverlay={handleSelectOverlay}
        onDeleteOverlay={handleDeleteOverlay}
        setActiveOverlayId={setActiveOverlayId}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default PreviewScreen;