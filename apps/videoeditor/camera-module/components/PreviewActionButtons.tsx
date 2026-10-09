import React from "react";
import { StyleSheet, View, ScrollView, Alert } from "react-native";
import FilterButton from "./preview-actions/FilterButton";
import MusicButton from "./preview-actions/MusicButton";
import OverlayButton from "./preview-actions/OverlayButton";
import StickerButton from "./preview-actions/StickerButton";
import TextButton from "./preview-actions/TextButton";
import TransitionButton from "./preview-actions/TransitionButton";
import VoiceButton from "./preview-actions/VoiceButton";
import SoundFXButton from "./preview-actions/SoundFXButton";
import CaptionsButton from "./preview-actions/CaptionsButton";
import AdjustButton from "./preview-actions/AdjustButton";
import CutoutButton from "./preview-actions/CutoutButton";
import LinksButton from "./preview-actions/LinksButton";
import PasteButton from "./preview-actions/PasteButton";
import TextToSpeechButton from "./preview-actions/TextToSpeechButton";
import AudioEditorButton from "./preview-actions/AudioEditorButton";

import type { FilterConfig } from "../types/filters";
import type {
  VoiceOverlay,
  SoundEffect,
  Caption,
  AdjustSettings,
  Cutout,
  Link,
  OverlayEffect,
} from "../types/voiceOverlay.types";
import type { TextToSpeechConfig, AudioTrackWithEffects, AudioMixSettings } from "../types/audioEffects.types";

interface PreviewActionButtonsProps {
  displayUri?: string;
  onFilter?: (filter: FilterConfig) => void;
  onOverlay?: () => void;
  onText?: () => void;
  onSticker?: (type: 'image' | 'emoji', content: string | number) => void;
  onMusic?: () => void;
  onTransition?: () => void;
  onVoiceAdd?: (voice: VoiceOverlay) => void;
  onSoundFXAdd?: (sound: SoundEffect) => void;
  onCaptionAdd?: (caption: Caption) => void;
  onAdjustChange?: (settings: AdjustSettings) => void;
  onCutoutAdd?: (cutout: Cutout) => void;
  onLinkAdd?: (link: Link) => void;
  onOverlayEffectAdd?: (effect: OverlayEffect) => void;
  onPaste?: (content: string) => void;
  onTTSGenerate?: (config: TextToSpeechConfig) => void;
  onUpdateAudioTracks?: (tracks: AudioTrackWithEffects[]) => void;
  onUpdateAudioMix?: (settings: AudioMixSettings) => void;
  audioTracks?: AudioTrackWithEffects[];
  masterVolume?: number;
  startTime?: number;
}

/**
 * Bottom action buttons bar for preview editor
 * Contains all editing tools: filters, text, voice, captions, effects, etc.
 */
const PreviewActionButtons: React.FC<PreviewActionButtonsProps> = ({
  displayUri,
  onFilter,
  onOverlay,
  onText,
  onSticker,
  onMusic,
  onTransition,
  onVoiceAdd,
  onSoundFXAdd,
  onCaptionAdd,
  onAdjustChange,
  onCutoutAdd,
  onLinkAdd,
  onOverlayEffectAdd,
  onPaste,
  onTTSGenerate,
  onUpdateAudioTracks,
  onUpdateAudioMix,
  audioTracks = [],
  masterVolume = 1,
  startTime = 0,
}) => {
  
  // 🛠️ Music Library Handler - Opens device file picker for AUDIO ONLY
  const handleMusicPress = async () => {
    try {
      // Use ImageLibraryOptions with explicit Audio type for iOS/Android compatibility
      const imagePicker = require('expo-image-picker');
      
      // Request permissions first (required on newer Android)
      const { status } = await imagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('⚠️ Permission Denied', 'We need access to your media library to select music');
        return;
      }

      const result = await imagePicker.launchImageLibraryAsync({
        mediaTypes: imagePicker.MediaTypeOptions.Audio, // AUDIO ONLY
        allowsMultipleSelection: false,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const musicFile = result.assets[0];
        const fileName = musicFile.uri?.split('/').pop() || 'Music';
        
        // Log for debugging
        console.log('🎵 Music selected:', {
          uri: musicFile.uri?.substring(0, 80),
          fileName,
          duration: musicFile.duration,
        });
        
        Alert.alert('✅ Music Added', `File: ${fileName}`);
        if (onMusic) onMusic();
      }
    } catch (error) {
      console.error('🎵 Music error:', error);
      Alert.alert('⚠️ Error', 'Could not open music library. Make sure you have permissions enabled.');
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* 🛠️ FIX: Forced handler pass kiya taaki component hide na ho */}
      <MusicButton onPress={handleMusicPress} />
      
      <TextButton onPress={onText} />
      <TextToSpeechButton onPress={() => {}} onTTSGenerate={onTTSGenerate} startTime={startTime} />
      <VoiceButton onPress={onVoiceAdd} onVoiceAdd={onVoiceAdd} startTime={startTime} />
      <LinksButton onPress={onLinkAdd} onLinkAdd={onLinkAdd} />
      <CaptionsButton onPress={onCaptionAdd} onCaptionAdd={onCaptionAdd} />
      <AdjustButton onPress={onAdjustChange} onAdjustChange={onAdjustChange} />
      <FilterButton mediaUri={displayUri || ""} onFilterApply={onFilter || (() => {})} />
      <OverlayButton onPress={onOverlay} onApplyOverlay={onOverlayEffectAdd} />
      <SoundFXButton onPress={onSoundFXAdd} onSoundSelect={onSoundFXAdd} />
      <AudioEditorButton 
        onPress={() => {}} 
        onUpdateTracks={onUpdateAudioTracks}
        onUpdateMixSettings={onUpdateAudioMix}
        tracks={audioTracks}
        masterVolume={masterVolume}
      />
      <CutoutButton onPress={onCutoutAdd} onCutoutAdd={onCutoutAdd} />
      <StickerButton onPress={() => {}} onStickerSelect={onSticker} />
      <PasteButton onPress={onPaste} onPaste={onPaste} />
      <TransitionButton onPress={onTransition} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000000",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    height: '100%',
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});

export default PreviewActionButtons;