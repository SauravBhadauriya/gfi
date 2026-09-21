import React, { useState } from "react";
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
import MusicLibraryModal from "../../../../components/MusicLibraryModal";

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
import type { Music } from "../types/music.types";

interface PreviewActionButtonsProps {
  displayUri?: string;
  onFilter?: (filter: FilterConfig) => void;
  onOverlay?: () => void;
  onText?: () => void;
  onSticker?: (sticker?: string | number) => void;
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
  const [showMusicLibrary, setShowMusicLibrary] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<Music | undefined>();

  // 🛠️ BUG FIX #2: Music Library Handler - Opens in-app Music Library modal
  const handleMusicPress = () => {
    setShowMusicLibrary(true);
  };

  // Handle music selection from library
  const handleMusicSelect = (music: Music) => {
    setSelectedMusic(music);
    console.log('🎵 Music selected from library:', {
      title: music.title,
      artist: music.artist,
      duration: music.duration,
      audioUrl: music.audioUrl,
    });
    Alert.alert('✅ Music Added', `${music.title} by ${music.artist}`);
    setShowMusicLibrary(false);
    if (onMusic) onMusic();
  };

  // Handle music library modal close
  const handleMusicLibraryClose = () => {
    setShowMusicLibrary(false);
  };

  return (
    <>
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
        <StickerButton onPress={onSticker} onStickerSelect={onSticker} />
        <PasteButton onPress={onPaste} onPaste={onPaste} />
        <TransitionButton onPress={onTransition} />
      </ScrollView>

      {/* 🛠️ BUG FIX #2: Music Library Modal */}
      <MusicLibraryModal
        visible={showMusicLibrary}
        onSelect={handleMusicSelect}
        onCancel={handleMusicLibraryClose}
        selectedMusic={selectedMusic}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000000",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
  },
});

export default PreviewActionButtons;