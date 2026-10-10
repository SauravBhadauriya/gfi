import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  Clip,
  Overlay,
  AudioTrack,
  TextItem,
  EditorState,
} from "@/types/editor.types";

const initialState: EditorState = {
  clips: [],
  overlays: [],
  audioTracks: [],
  texts: [],
  currentTime: 0,
  isPlaying: false,
  selectedItemId: null,
  undoStack: [],
  redoStack: [],
};

const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    // Clip actions
    addClip: (state, action: PayloadAction<Clip>) => {
      state.undoStack.push(JSON.parse(JSON.stringify(state)));
      state.redoStack = [];
      state.clips.push(action.payload);
    },
    removeClip: (state, action: PayloadAction<string>) => {
      state.undoStack.push(JSON.parse(JSON.stringify(state)));
      state.redoStack = [];
      state.clips = state.clips.filter((clip) => clip.id !== action.payload);
    },
    updateClip: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Clip> }>
    ) => {
      const clip = state.clips.find((c) => c.id === action.payload.id);
      if (clip) {
        Object.assign(clip, action.payload.updates);
      }
    },
    removeAllClips: (state) => {
      state.undoStack.push(JSON.parse(JSON.stringify(state)));
      state.redoStack = [];
      state.clips = [];
      state.selectedItemId = null;
    },

    // Overlay actions
    addOverlay: (state, action: PayloadAction<Overlay>) => {
      state.undoStack.push(JSON.parse(JSON.stringify(state)));
      state.redoStack = [];
      state.overlays.push(action.payload);
    },
    removeOverlay: (state, action: PayloadAction<string>) => {
      state.undoStack.push(JSON.parse(JSON.stringify(state)));
      state.redoStack = [];
      state.overlays = state.overlays.filter((o) => o.id !== action.payload);
    },
    updateOverlay: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Overlay> }>
    ) => {
      const overlay = state.overlays.find((o) => o.id === action.payload.id);
      if (overlay) {
        Object.assign(overlay, action.payload.updates);
      }
    },
    removeAllOverlays: (state) => {
      state.undoStack.push(JSON.parse(JSON.stringify(state)));
      state.redoStack = [];
      state.overlays = [];
    },

    // Audio track actions
    addAudioTrack: (state, action: PayloadAction<AudioTrack>) => {
      state.undoStack.push(JSON.parse(JSON.stringify(state)));
      state.redoStack = [];
      state.audioTracks.push(action.payload);
    },
    removeAudioTrack: (state, action: PayloadAction<string>) => {
      state.undoStack.push(JSON.parse(JSON.stringify(state)));
      state.redoStack = [];
      state.audioTracks = state.audioTracks.filter((t) => t.id !== action.payload);
    },
    updateAudioTrack: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<AudioTrack> }>
    ) => {
      const track = state.audioTracks.find((t) => t.id === action.payload.id);
      if (track) {
        Object.assign(track, action.payload.updates);
      }
    },
    removeAllAudioTracks: (state) => {
      state.undoStack.push(JSON.parse(JSON.stringify(state)));
      state.redoStack = [];
      state.audioTracks = [];
    },

    // Text item actions
    addText: (state, action: PayloadAction<TextItem>) => {
      state.undoStack.push(JSON.parse(JSON.stringify(state)));
      state.redoStack = [];
      state.texts.push(action.payload);
    },
    removeText: (state, action: PayloadAction<string>) => {
      state.undoStack.push(JSON.parse(JSON.stringify(state)));
      state.redoStack = [];
      state.texts = state.texts.filter((t) => t.id !== action.payload);
    },
    updateText: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<TextItem> }>
    ) => {
      const text = state.texts.find((t) => t.id === action.payload.id);
      if (text) {
        Object.assign(text, action.payload.updates);
      }
    },
    removeAllTexts: (state) => {
      state.undoStack.push(JSON.parse(JSON.stringify(state)));
      state.redoStack = [];
      state.texts = [];
    },

    // Playback actions
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    setSelectedItemId: (state, action: PayloadAction<string | null>) => {
      state.selectedItemId = action.payload;
    },

    // Undo/Redo actions
    undo: (state) => {
      if (state.undoStack.length > 0) {
        const previousState = state.undoStack.pop()!;
        state.redoStack.push(JSON.parse(JSON.stringify(state)));
        Object.assign(state, previousState);
      }
    },
    redo: (state) => {
      if (state.redoStack.length > 0) {
        const nextState = state.redoStack.pop()!;
        state.undoStack.push(JSON.parse(JSON.stringify(state)));
        Object.assign(state, nextState);
      }
    },

    // Reset all
    resetEditor: () => initialState,
  },
});

export const {
  addClip,
  removeClip,
  updateClip,
  removeAllClips,
  addOverlay,
  removeOverlay,
  updateOverlay,
  removeAllOverlays,
  addAudioTrack,
  removeAudioTrack,
  updateAudioTrack,
  removeAllAudioTracks,
  addText,
  removeText,
  updateText,
  removeAllTexts,
  setCurrentTime,
  setIsPlaying,
  setSelectedItemId,
  undo,
  redo,
  resetEditor,
} = editorSlice.actions;

export default editorSlice.reducer;
