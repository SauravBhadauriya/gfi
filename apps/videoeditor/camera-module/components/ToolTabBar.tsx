import React, { useMemo, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  ViewStyle,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import editorTheme from '../constants/editorTheme';
import FilterButton from './preview-actions/FilterButton';
import MusicButton from './preview-actions/MusicButton';
import OverlayButton from './preview-actions/OverlayButton';
import StickerButton from './preview-actions/StickerButton';
import TextButton from './preview-actions/TextButton';
import TransitionButton from './preview-actions/TransitionButton';
import VoiceButton from './preview-actions/VoiceButton';
import SoundFXButton from './preview-actions/SoundFXButton';
import CaptionsButton from './preview-actions/CaptionsButton';
import AdjustButton from './preview-actions/AdjustButton';
import CutoutButton from './preview-actions/CutoutButton';
import LinksButton from './preview-actions/LinksButton';
import PasteButton from './preview-actions/PasteButton';
import TextToSpeechButton from './preview-actions/TextToSpeechButton';
import AudioEditorButton from './preview-actions/AudioEditorButton';

import type { FilterConfig } from '../types/filters';
import type {
  VoiceOverlay,
  SoundEffect,
  Caption,
  AdjustSettings,
  Cutout,
  Link,
  OverlayEffect,
} from '../types/voiceOverlay.types';
import type { TextToSpeechConfig, AudioTrackWithEffects, AudioMixSettings } from '../types/audioEffects.types';

interface ToolTabBarProps {
  displayUri?: string;
  onFilter?: (filter: FilterConfig) => void;
  onOverlay?: () => void;
  onText?: () => void;
  onSticker?: (type: 'image' | 'emoji', content: string | number) => void;
  onMusic?: (audioData: { uri: string; name: string; duration?: number }) => void;
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

type TabKey = 'visual' | 'audio' | 'text' | 'effects' | 'more';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: (isActive: boolean) => React.ReactNode;
}

/**
 * Tab bar with 5 tool categories
 * Each tab displays categorized action buttons in a horizontal scrollable layout
 * Minimum 44x44px touch targets on all buttons
 */
const ToolTabBar: React.FC<ToolTabBarProps> = ({
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
  const [activeTab, setActiveTab] = useState<TabKey>('visual');

  // Music handler (moved from PreviewActionButtons)
  const handleMusicPress = useCallback(async () => {
    try {
      const imagePicker = require('expo-image-picker');

      const { status } = await imagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const result = await imagePicker.launchImageLibraryAsync({
        mediaTypes: imagePicker.MediaTypeOptions.Audio,
        allowsMultipleSelection: false,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        onMusic?.({
          uri: asset.uri,
          name: asset.filename || 'audio',
          duration: asset.duration,
        });
      }
    } catch (error) {
      console.error('Music error:', error);
    }
  }, [onMusic]);

  const tabs: TabConfig[] = [
    {
      key: 'visual',
      label: 'Visual',
      icon: (isActive: boolean) => (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path
            d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"
            stroke={isActive ? editorTheme.colors.primary : editorTheme.colors.textSecondary}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle
            cx="11"
            cy="13"
            r="3"
            stroke={isActive ? editorTheme.colors.primary : editorTheme.colors.textSecondary}
            strokeWidth="2"
          />
        </Svg>
      ),
    },
    {
      key: 'audio',
      label: 'Audio',
      icon: (isActive: boolean) => (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 1a11 11 0 0 1 11 11 11 11 0 0 1-11 11A11 11 0 0 1 1 12 11 11 0 0 1 12 1z"
            stroke={isActive ? editorTheme.colors.primary : editorTheme.colors.textSecondary}
            strokeWidth="2"
          />
          <Path
            d="M8 12l4 3v-6l-4 3z"
            fill={isActive ? editorTheme.colors.primary : editorTheme.colors.textSecondary}
          />
        </Svg>
      ),
    },
    {
      key: 'text',
      label: 'Text',
      icon: (isActive: boolean) => (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 7h16M4 12h16M4 17h12"
            stroke={isActive ? editorTheme.colors.primary : editorTheme.colors.textSecondary}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
    },
    {
      key: 'effects',
      label: 'Effects',
      icon: (isActive: boolean) => (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            fill={isActive ? editorTheme.colors.primary : editorTheme.colors.textSecondary}
          />
        </Svg>
      ),
    },
    {
      key: 'more',
      label: 'More',
      icon: (isActive: boolean) => (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
            fill={isActive ? editorTheme.colors.primary : editorTheme.colors.textSecondary}
          />
        </Svg>
      ),
    },
  ];

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'visual':
        return (
          <>
            <FilterButton mediaUri={displayUri || ''} onFilterApply={onFilter || (() => {})} />
            <OverlayButton onPress={onOverlay} onApplyOverlay={onOverlayEffectAdd} />
            <StickerButton onPress={() => {}} onStickerSelect={onSticker} />
          </>
        );
      case 'audio':
        return (
          <>
            <VoiceButton onPress={() => {}} onVoiceAdd={onVoiceAdd} startTime={startTime} />
            <MusicButton onPress={handleMusicPress} />
            <SoundFXButton onPress={() => {}} onSoundSelect={onSoundFXAdd} />
            <CaptionsButton onPress={() => {}} onCaptionAdd={onCaptionAdd} />
            <AudioEditorButton
              onPress={() => {}}
              onUpdateTracks={onUpdateAudioTracks}
              onUpdateMixSettings={onUpdateAudioMix}
              tracks={audioTracks}
              masterVolume={masterVolume}
            />
          </>
        );
      case 'text':
        return (
          <>
            <TextButton onPress={onText} />
            <TextToSpeechButton onPress={() => {}} onTTSGenerate={onTTSGenerate} startTime={startTime} />
            <PasteButton onPress={() => {}} onPaste={onPaste} />
          </>
        );
      case 'effects':
        return (
          <>
            <TransitionButton onPress={onTransition} />
            <AdjustButton onPress={() => {}} onAdjustChange={onAdjustChange} />
            <CutoutButton onPress={() => {}} onCutoutAdd={onCutoutAdd} />
          </>
        );
      case 'more':
        return (
          <>
            <LinksButton onPress={() => {}} onLinkAdd={onLinkAdd} />
          </>
        );
      default:
        return null;
    }
  }, [
    activeTab,
    displayUri,
    onFilter,
    onOverlay,
    onOverlayEffectAdd,
    onSticker,
    onVoiceAdd,
    handleMusicPress,
    onSoundFXAdd,
    onCaptionAdd,
    onUpdateAudioTracks,
    onUpdateAudioMix,
    audioTracks,
    masterVolume,
    startTime,
    onText,
    onTTSGenerate,
    onPaste,
    onTransition,
    onAdjustChange,
    onCutoutAdd,
    onLinkAdd,
  ]);

  return (
    <View style={styles.container}>
      {/* Tab Pills */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabPill,
                activeTab === tab.key && styles.tabPillActive,
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <View style={styles.tabIcon}>{tab.icon(activeTab === tab.key)}</View>
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.key && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Buttons for Active Tab */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.buttonsContainer}
        contentContainerStyle={styles.buttonsContent}
      >
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: editorTheme.colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: editorTheme.colors.separator,
  },
  
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: editorTheme.colors.separator,
    paddingVertical: editorTheme.spacing.sm,
  },
  
  tabsScroll: {
    maxHeight: 48,
  },
  
  tabsContent: {
    paddingHorizontal: editorTheme.spacing.sm,
    gap: editorTheme.spacing.sm,
    alignItems: 'center',
  },
  
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: editorTheme.spacing.xs,
    paddingHorizontal: editorTheme.spacing.md,
    paddingVertical: editorTheme.spacing.xs,
    borderRadius: editorTheme.borderRadius.full,
    backgroundColor: editorTheme.colors.surfaceHover,
  },
  
  tabPillActive: {
    backgroundColor: editorTheme.colors.surfaceActive,
  },
  
  tabIcon: {
    width: 16,
    height: 16,
  },
  
  tabLabel: {
    fontSize: editorTheme.typography.label,
    fontWeight: editorTheme.typography.fontWeights.medium as any,
    color: editorTheme.colors.textSecondary,
  },
  
  tabLabelActive: {
    color: editorTheme.colors.primary,
  },
  
  buttonsContainer: {
    backgroundColor: editorTheme.colors.surface,
    height: '100%',
  },
  
  buttonsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: editorTheme.spacing.md,
    paddingHorizontal: editorTheme.spacing.md,
    paddingVertical: editorTheme.spacing.sm,
  },
});

export default ToolTabBar;
