import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { VideoView, useVideoPlayer, type VideoSource } from 'expo-video';

export interface LegacyVideoHandle {
  play: () => void;
  pause: () => void;
  currentTime: number;
  playAsync: () => Promise<void>;
  pauseAsync: () => Promise<void>;
  setRateAsync: (rate: number, shouldCorrectPitch?: boolean) => Promise<void>;
  setPositionAsync: (positionMillis: number) => Promise<void>;
  getStatusAsync: () => Promise<{ isLoaded: boolean; isPlaying: boolean; positionMillis: number; durationMillis: number }>;
}

interface LegacyVideoProps {
  source: VideoSource;
  style?: StyleProp<ViewStyle>;
  resizeMode?: 'contain' | 'cover' | 'stretch';
  shouldPlay?: boolean;
  isLooping?: boolean;
  isMuted?: boolean;
  useNativeControls?: boolean;
  rate?: number;
  shouldCorrectPitch?: boolean;
  progressUpdateIntervalMillis?: number;
  onLoad?: (status: { isLoaded: boolean; duration: number }) => void;
  onError?: (error: unknown) => void;
  onPlaybackStatusUpdate?: (status: { isLoaded: boolean; isPlaying: boolean; positionMillis: number; durationMillis: number }) => void;
}

const LegacyVideo = forwardRef<LegacyVideoHandle, LegacyVideoProps>(function LegacyVideo(
  { source, style, resizeMode = 'cover', shouldPlay = false, isLooping = false, isMuted = false, useNativeControls = false, rate = 1, progressUpdateIntervalMillis = 250, onLoad, onError, onPlaybackStatusUpdate },
  ref,
) {
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = isLooping;
    instance.muted = isMuted;
    instance.playbackRate = rate;
    instance.timeUpdateEventInterval = Math.max(0.05, progressUpdateIntervalMillis / 1000);
  });

  useEffect(() => {
    player.loop = isLooping;
    player.muted = isMuted;
    player.playbackRate = rate;
    if (shouldPlay) player.play();
    else player.pause();
  }, [isLooping, isMuted, player, rate, shouldPlay]);

  useEffect(() => {
    const statusSubscription = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'readyToPlay') onLoad?.({ isLoaded: true, duration: player.duration });
      if (error) onError?.(error);
    });
    const timeSubscription = player.addListener('timeUpdate', ({ currentTime }) => {
      onPlaybackStatusUpdate?.({ isLoaded: player.status === 'readyToPlay', isPlaying: player.playing, positionMillis: currentTime * 1000, durationMillis: player.duration * 1000 });
    });
    return () => {
      statusSubscription.remove();
      timeSubscription.remove();
    };
  }, [onError, onLoad, onPlaybackStatusUpdate, player]);

  useImperativeHandle(ref, () => ({
    play: () => player.play(),
    pause: () => player.pause(),
    get currentTime() { return player.currentTime; },
    set currentTime(seconds: number) { player.currentTime = seconds; },
    playAsync: async () => player.play(),
    pauseAsync: async () => player.pause(),
    setRateAsync: async (nextRate) => { player.playbackRate = nextRate; },
    setPositionAsync: async (positionMillis) => { player.currentTime = positionMillis / 1000; },
    getStatusAsync: async () => ({ isLoaded: player.status === 'readyToPlay', isPlaying: player.playing, positionMillis: player.currentTime * 1000, durationMillis: player.duration * 1000 }),
  }), [player]);

  return <VideoView player={player} style={style} contentFit={resizeMode === 'stretch' ? 'fill' : resizeMode} nativeControls={useNativeControls} />;
});

export default LegacyVideo;
