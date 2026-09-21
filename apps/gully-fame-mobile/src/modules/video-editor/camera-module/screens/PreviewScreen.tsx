import React, { useCallback, useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import ExportScreen from '../components/ExportScreen';
import TimelineEditor from '../components/timeline/TimelineEditor';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { cameraStyles } from '../styles/cameraStyles';
import { calculateTimelinePositions } from '../utils/timelineHelpers';
import type { CameraClip, CameraClipArray } from '../types/camera.types';

// Dynamic transformable overlays ka contract type structure
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
  
  // 🔥 GESTURE ENGINE STATES: Multiple stickers ko handle aur active overlay track karne ke liye
  const [overlays, setOverlays] = useState<ActiveOverlay[]>([]);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const overlayCounterRef = useRef(0); // Counter to ensure unique IDs

  const undoRedo = useUndoRedo(clips);

  useEffect(() => {
    console.log('🎬 PreviewScreen: clips received from parent:', clips?.length ?? 0, 'clips');
    if (clips && clips.length > 0) {
      console.log('📹 PreviewScreen: First clip details:', JSON.stringify(clips[0], null, 2));
      console.log('📹 PreviewScreen: All clips:', JSON.stringify(clips, null, 2));
      setUpdatedClips(clips);
      undoRedo.reset(clips);
    } else {
      console.warn('⚠️ PreviewScreen: Empty clips array!');
      console.warn('⚠️ clips prop value:', clips);
    }
  }, [clips]); 

  // 🔥 STICKER/EMOJI ADDING HANDLER: `StickerButton` se data lekar direct canvas me feed karega
  const handleSelectOverlay = useCallback((type: 'image' | 'emoji', content: string | number) => {
    overlayCounterRef.current += 1;
    const newOverlay: ActiveOverlay = {
      id: `overlay-${Date.now()}-${overlayCounterRef.current}`, // UNIQUE ID with counter to avoid duplicates
      type,
      content,
    };
    console.log(`🎨 New overlay added: ${newOverlay.id}`);
    setOverlays(prev => [...prev, newOverlay]);
    setActiveOverlayId(newOverlay.id); // Add karte hi active pointer focus karega
  }, []);

  // 🔥 STICKER REMOVE HANDLER: Active cross button par click hote hi delete karega
  const handleDeleteOverlay = useCallback((id: string) => {
    setOverlays(prev => prev.filter(item => item.id !== id));
    setActiveOverlayId(null);
  }, []);

  const handleDelete = useCallback(() => {
    if (updatedClips.length === 0) return;
    
    undoRedo.addToHistory({ clips: updatedClips });
    const newClips = updatedClips.filter((_, index) => index !== currentClipIndex);
    const positionedClips = calculateTimelinePositions(newClips);
    
    setUpdatedClips(positionedClips);
    onClipUpdate?.(positionedClips);
    
    if (positionedClips.length === 0) {
      onBack?.();
      return;
    }

    setCurrentClipIndex(prev => (prev > 0 ? prev - 1 : 0));
  }, [currentClipIndex, updatedClips, onBack, onClipUpdate, undoRedo]);

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

  const handleExportComplete = useCallback(() => {
    setShowExport(false);
    onExportComplete?.();
    onBack?.();
  }, [onBack, onExportComplete]);

  if (!clips?.length || !updatedClips[currentClipIndex]) {
    console.warn('⚠️ PreviewScreen: Cannot render - clips:', clips?.length ?? 0, 'updatedClips:', updatedClips?.length ?? 0, 'currentClipIndex:', currentClipIndex);
    if (updatedClips.length > 0) {
      console.log('📹 PreviewScreen: Available clips in updatedClips:', updatedClips.map(c => ({id: c.id, uri: c.uri?.substring(0, 50)})));
    }
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
        
        // 🔥 INJECTING STATE LAYERS: Ye data niche TimelineEditor ke canvas layer me pass hoga
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