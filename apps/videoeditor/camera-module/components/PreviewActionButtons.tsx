import React from "react";
import { StyleSheet, View } from "react-native";
import ToolTabBar from "./ToolTabBar";

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
 * Uses ToolTabBar for organized, tabbed toolbar layout
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
  return (
    <View style={styles.container}>
      <ToolTabBar
        displayUri={displayUri}
        onFilter={onFilter}
        onOverlay={onOverlay}
        onText={onText}
        onSticker={onSticker}
        onMusic={onMusic}
        onTransition={onTransition}
        onVoiceAdd={onVoiceAdd}
        onSoundFXAdd={onSoundFXAdd}
        onCaptionAdd={onCaptionAdd}
        onAdjustChange={onAdjustChange}
        onCutoutAdd={onCutoutAdd}
        onLinkAdd={onLinkAdd}
        onOverlayEffectAdd={onOverlayEffectAdd}
        onPaste={onPaste}
        onTTSGenerate={onTTSGenerate}
        onUpdateAudioTracks={onUpdateAudioTracks}
        onUpdateAudioMix={onUpdateAudioMix}
        audioTracks={audioTracks}
        masterVolume={masterVolume}
        startTime={startTime}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000000",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    height: '100%',
    width: '100%',
  },
});

export default PreviewActionButtons;