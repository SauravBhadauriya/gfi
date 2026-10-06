import type { LegacyVideoHandle } from '../../../../../components/LegacyVideo';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { CameraClip } from '../../types/camera.types';
import { getClipAtTimelineTime } from '../../utils/timelineHelpers';
import FilteredImage from '../FilteredImage';
import FilteredVideo from '../FilteredVideo';

interface MultiClipPlayerProps {
  clips: CameraClip[];
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate?: (time: number) => void;
  onLoad?: () => void;
  onEnd?: () => void;
  filter?: import('../../types/filters').FilterConfig;
  isDraggingTimeline?: boolean;
}

/**
 * Multi-clip video player engine cleanly integrated with Expo Video
 */
const MultiClipPlayer: React.FC<MultiClipPlayerProps> = ({
  clips,
  currentTime,
  isPlaying,
  onTimeUpdate,
  onLoad,
  onEnd,
  filter,
  isDraggingTimeline = false,
}) => {
  const videoRefs = useRef<Map<string, React.RefObject<LegacyVideoHandle>>>(new Map());
  const [currentClipId, setCurrentClipId] = useState<string | null>(null);
  const [currentClipLocalTime, setCurrentClipLocalTime] = useState(0);
  const isSeekingRef = useRef(false);
  const playbackStatusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastUpdateTimeRef = useRef(0);
  const isDraggingTimelineRef = useRef(false);

  useEffect(() => {
    isDraggingTimelineRef.current = isDraggingTimeline;
  }, [isDraggingTimeline]);

  const currentClipData = useMemo(() => {
    const data = getClipAtTimelineTime(clips, currentTime);
    if (!data) return null;

    const { clip, localTime } = data;
    // @ts-ignore
    const speedConfig = clip.speedConfig || { type: 'constant', value: 1 };
    const speedValue = speedConfig.type === 'constant' ? (speedConfig.value ?? 1) : 1;

    const trimStart = clip.trimStart ?? 0;
    const timelineDelta = localTime - trimStart;
    const adjustedLocalTime = trimStart + (timelineDelta * speedValue);

    return {
      clip,
      localTime: adjustedLocalTime,
      speedValue,
    };
  }, [clips, currentTime]);

  const currentSpeed = currentClipData?.speedValue ?? 1;

  useEffect(() => {
    if (currentClipData) {
      const { clip, localTime } = currentClipData;
      
      if (currentClipId !== clip.id) {
        setCurrentClipId(clip.id);
        setCurrentClipLocalTime(localTime);
        
        videoRefs.current.forEach((ref, id) => {
          if (id !== clip.id && ref?.current) {
            ref.current.pause?.();
          }
        });
      } else {
        setCurrentClipLocalTime(localTime);
      }
    } else {
      setCurrentClipId(null);
    }
  }, [currentClipData, currentClipId]);

  useEffect(() => {
    if (isSeekingRef.current || !currentClipData) return;
    
    const { clip, localTime } = currentClipData;
    const videoRef = videoRefs.current.get(clip.id);
    
    if (videoRef?.current && clip.type === 'video') {
      if (isDraggingTimeline) {
        return;
      }
      
      isSeekingRef.current = true;
      try {
        videoRef.current.currentTime = localTime;
        isSeekingRef.current = false;
      } catch (err) {
        console.warn('Seek error:', err);
        isSeekingRef.current = false;
      }
    }
  }, [currentTime, currentClipData, isDraggingTimeline]);

  useEffect(() => {
    if (!currentClipData) return;
    
    const { clip } = currentClipData;
    
    if (clip.type === 'photo' && isPlaying) {
      const imageDisplayTime = 3000;
      const timeout = setTimeout(() => {
        const currentIndex = clips.findIndex((c) => c.id === clip.id);
        if (currentIndex < clips.length - 1) {
          const nextClip = clips[currentIndex + 1];
          const nextClipStart = nextClip.timelineStart ?? 0;
          onTimeUpdate?.(nextClipStart);
        } else {
          onEnd?.();
        }
      }, imageDisplayTime);
      return () => clearTimeout(timeout);
    }
    
    const videoRef = videoRefs.current.get(clip.id);
    
    if (videoRef?.current && clip.type === 'video') {
      if (isPlaying) {
        videoRef.current.play?.();
      } else {
        videoRef.current.pause?.();
      }
    }
  }, [isPlaying, currentClipData, clips, onTimeUpdate, onEnd, currentSpeed]);

  useEffect(() => {
    if (!isPlaying || !currentClipData) {
      if (playbackStatusIntervalRef.current) {
        clearInterval(playbackStatusIntervalRef.current);
        playbackStatusIntervalRef.current = null;
      }
      return;
    }

    playbackStatusIntervalRef.current = setInterval(() => {
      if (!currentClipData || isDraggingTimelineRef.current) return;
      
      const { clip } = currentClipData;
      const videoRef = videoRefs.current.get(clip.id);
      
      if (videoRef?.current) {
        try {
          const localTime = videoRef.current.currentTime ?? 0;
          setCurrentClipLocalTime(localTime);
          
          const now = Date.now();
          if (now - lastUpdateTimeRef.current < 100) return;
          lastUpdateTimeRef.current = now;
          
          const timelineStart = clip.timelineStart ?? 0;
          const trimStart = clip.trimStart ?? 0;
          const timelineTime = timelineStart + (localTime - trimStart) / currentSpeed;
          
          onTimeUpdate?.(Math.max(0, timelineTime));
          
          const duration = clip.trimEnd ?? clip.duration;
          if (localTime >= duration) {
            const currentIndex = clips.findIndex((c) => c.id === clip.id);
            if (currentIndex < clips.length - 1) {
              const nextClip = clips[currentIndex + 1];
              const nextClipStart = nextClip.timelineStart ?? 0;
              onTimeUpdate?.(nextClipStart);
            } else {
              onEnd?.();
            }
          }
        } catch (err) {
          console.warn('Status check error:', err);
        }
      }
    }, 100);

    return () => {
      if (playbackStatusIntervalRef.current) {
        clearInterval(playbackStatusIntervalRef.current);
        playbackStatusIntervalRef.current = null;
      }
    };
  }, [isPlaying, currentClipData, clips, onTimeUpdate, onEnd, currentSpeed]);

  const handleVideoLoad = useCallback((clipId: string, status: any) => {
    if (status.isLoaded && clipId === currentClipId) {
      const localTime = currentClipLocalTime;
      const videoRef = videoRefs.current.get(clipId);
      if (videoRef?.current) {
        videoRef.current.currentTime = localTime;
        if (isPlaying) {
          videoRef.current.play?.();
        }
      }
      onLoad?.();
    }
  }, [currentClipId, currentClipLocalTime, isPlaying, onLoad]);

  if (!currentClipData) {
    return <View style={[styles.container, { width: '100%' }]} />;
  }

  const { clip } = currentClipData;

  const videoRef = useMemo(() => {
    if (clip.type === 'video') {
      let ref = videoRefs.current.get(clip.id);
      if (!ref) {
        ref = React.createRef<LegacyVideoHandle>() as React.RefObject<LegacyVideoHandle>;
        videoRefs.current.set(clip.id, ref);
      }
      return ref as React.RefObject<LegacyVideoHandle>;
    }
    return null;
  }, [clip.id, clip.type]);

  if (clip.type === 'video') {
    return (
      <View style={[styles.container, { width: '100%' }]}>
        <FilteredVideo
          videoRef={videoRef as React.RefObject<LegacyVideoHandle | null>}
          source={{ uri: clip.uri }}
          style={[styles.media, { width: '100%', height: '100%' }]}
          contentFit="contain"
          shouldPlay={false}
          isLooping={false}
          rate={currentSpeed}
          onLoad={(status) => handleVideoLoad(clip.id, status)}
          filter={filter}
        />
      </View>
    );
  } else {
    return (
      <View style={[styles.container, { width: '100%' }]}>
        <FilteredImage
          source={{ uri: clip.uri }}
          style={styles.media}
          resizeMode="contain"
          filter={filter}
        />
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  media: {
    width: '100%',
    height: '100%',
  },
});

export default memo(MultiClipPlayer);
