import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CameraClipArray } from '@modules/video-editor/camera-module/types/camera.types';

export interface ReelUploadState {
  // Clips and video URIs
  clips: CameraClipArray;
  mergedVideoUri: string | null;
  editedVideoUri: string | null;
  thumbnailUri: string | null;

  // Metadata
  caption: string;
  hashtags: string[];
  music: any | null;
  visibility: 'public' | 'private' | 'followers';

  // Upload progress
  uploadProgress: number; // 0–1
  uploadState: 'idle' | 'uploading' | 'success' | 'error';
  uploadError: string | null;

  // Actions
  setClips: (clips: CameraClipArray) => void;
  setMergedUri: (uri: string | null) => void;
  setEditedUri: (uri: string | null) => void;
  setThumbnailUri: (uri: string | null) => void;
  setCaption: (caption: string) => void;
  setHashtags: (hashtags: string[]) => void;
  setMusic: (music: any | null) => void;
  setVisibility: (visibility: 'public' | 'private' | 'followers') => void;
  setUploadProgress: (progress: number) => void;
  setUploadState: (state: 'idle' | 'uploading' | 'success' | 'error') => void;
  setUploadError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  clips: [],
  mergedVideoUri: null,
  editedVideoUri: null,
  thumbnailUri: null,
  caption: '',
  hashtags: [],
  music: null,
  visibility: 'public' as const,
  uploadProgress: 0,
  uploadState: 'idle' as const,
  uploadError: null,
};

export const useReelUploadStore = create<ReelUploadState>()(
  persist(
    (set) => ({
      ...initialState,
      setClips: (clips) => set({ clips }),
      setMergedUri: (uri) => set({ mergedVideoUri: uri }),
      setEditedUri: (uri) => set({ editedVideoUri: uri }),
      setThumbnailUri: (uri) => set({ thumbnailUri: uri }),
      setCaption: (caption) => set({ caption }),
      setHashtags: (hashtags) => set({ hashtags }),
      setMusic: (music) => set({ music }),
      setVisibility: (visibility) => set({ visibility }),
      setUploadProgress: (progress) => set({ uploadProgress: progress }),
      setUploadState: (state) => set({ uploadState: state }),
      setUploadError: (error) => set({ uploadError: error }),
      reset: () => set(initialState),
    }),
    {
      name: 'reel-upload-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
