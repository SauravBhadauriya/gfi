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
  onMusic?: (music?: any) => void; // 🛠️ FIX: Passes music object back to parent
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

  const handleMusicPress = () => {
    setShowMusicLibrary(true);
  };

  // 🛠️ FIX: Passes music object up to TimelineEditor so state updates
  const handleMusicSelect = (music: Music) => {
    setSelectedMusic(music);
    setShowMusicLibrary(false);
    if (onMusic) {
      onMusic(music);
    }
  };

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
        <MusicButton onPress={handleMusicPress} />
        <TextButton onPress={onText} />
        <TextToSpeechButton onPress={() => {}} onTTSGenerate={onTTSGenerate} startTime={startTime} />
        <VoiceButton onVoiceAdd={onVoiceAdd} startTime={startTime} />
        <LinksButton onLinkAdd={onLinkAdd} />
        <CaptionsButton onCaptionAdd={onCaptionAdd} />
        <AdjustButton onAdjustChange={onAdjustChange} />
        <FilterButton mediaUri={displayUri || ""} onFilterApply={onFilter || (() => {})} />
        <OverlayButton onPress={onOverlay} onApplyOverlay={onOverlayEffectAdd} />
        <SoundFXButton onSoundSelect={onSoundFXAdd} />
        <AudioEditorButton 
          onPress={() => {}} 
          onUpdateTracks={onUpdateAudioTracks}
          onUpdateMixSettings={onUpdateAudioMix}
          tracks={audioTracks}
          masterVolume={masterVolume}
        />
        <CutoutButton onCutoutAdd={onCutoutAdd} />
        <StickerButton onPress={onSticker} onStickerSelect={onSticker} />
        <PasteButton onPaste={onPaste} />
        <TransitionButton onPress={onTransition} />
      </ScrollView>

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
    paddingHorizontal: 4,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 12,
  },
});

export default PreviewActionButtons;
