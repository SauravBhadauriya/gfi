import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  Clip,
  Overlay,
  AudioTrack,
  TextItem,
  StickerItem,
  DoodleItem,
  CaptionItem,
  LinkItem,
  EditorAdjust,
  EditorFilter,
  EditorState,
} from "@/types/editor.types";
import { NO_ADJUST } from "@/types/editor.types";

/** Music added from the editor's Audio tool or the caption screen (voiceover and sound FX use other id prefixes). */
export const isMusicTrack = (track: AudioTrack) => track.id.startsWith("audio-");

const initialState: EditorState = {
  sessionKey: null,
  mediaType: "video",
  clips: [],
  overlays: [],
  audioTracks: [],
  texts: [],
  stickers: [],
  doodles: [],
  captions: [],
  links: [],
  adjust: NO_ADJUST,
  frameAspect: null,
  filter: null,
  currentTime: 0,
  isPlaying: false,
  selectedItemId: null,
  undoStack: [],
  redoStack: [],
};

/** Undo entry: the state without its own history, so snapshots don't nest and grow exponentially. */
const snapshot = (state: EditorState): EditorState =>
  JSON.parse(JSON.stringify({ ...state, undoStack: [], redoStack: [] }));

const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    /** Starts a fresh edit session for a new capture (preview screen entry point). */
    startSession: (
      state,
      action: PayloadAction<{ key: string; mediaType: "video" | "photo"; clips: Clip[] }>
    ) => ({
      ...initialState,
      // The preview frame doesn't change between captures, so keep its shape.
      frameAspect: state.frameAspect,
      sessionKey: action.payload.key,
      mediaType: action.payload.mediaType,
      clips: action.payload.clips,
    }),

    // Clip actions
    addClip: (state, action: PayloadAction<Clip>) => {
      state.undoStack.push(snapshot(state));
      state.redoStack = [];
      state.clips.push(action.payload);
    },
    removeClip: (state, action: PayloadAction<string>) => {
      state.undoStack.push(snapshot(state));
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
      state.undoStack.push(snapshot(state));
      state.redoStack = [];
      state.clips = [];
      state.selectedItemId = null;
    },

    // Overlay actions
    addOverlay: (state, action: PayloadAction<Overlay>) => {
      state.undoStack.push(snapshot(state));
      state.redoStack = [];
      state.overlays.push(action.payload);
    },
    removeOverlay: (state, action: PayloadAction<string>) => {
      state.undoStack.push(snapshot(state));
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
      state.undoStack.push(snapshot(state));
      state.redoStack = [];
      state.overlays = [];
    },

    // Audio track actions
    addAudioTrack: (state, action: PayloadAction<AudioTrack>) => {
      state.undoStack.push(snapshot(state));
      state.redoStack = [];
      state.audioTracks.push(action.payload);
    },
    removeAudioTrack: (state, action: PayloadAction<string>) => {
      state.undoStack.push(snapshot(state));
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
    /** The one background-music track (ids starting "audio-"); replaces any earlier one, null removes it. */
    setMusic: (state, action: PayloadAction<AudioTrack | null>) => {
      state.undoStack.push(snapshot(state));
      state.redoStack = [];
      state.audioTracks = state.audioTracks.filter((t) => !isMusicTrack(t));
      if (action.payload) state.audioTracks.push(action.payload);
    },
    removeAllAudioTracks: (state) => {
      state.undoStack.push(snapshot(state));
      state.redoStack = [];
      state.audioTracks = [];
    },

    // Text item actions
    addText: (state, action: PayloadAction<TextItem>) => {
      state.undoStack.push(snapshot(state));
      state.redoStack = [];
      state.texts.push(action.payload);
    },
    removeText: (state, action: PayloadAction<string>) => {
      state.undoStack.push(snapshot(state));
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
      state.undoStack.push(snapshot(state));
      state.redoStack = [];
      state.texts = [];
    },

    // Stickers
    addSticker: (state, action: PayloadAction<StickerItem>) => {
      state.undoStack.push(snapshot(state));
      state.redoStack = [];
      state.stickers.push(action.payload);
    },
    removeSticker: (state, action: PayloadAction<string>) => {
      state.undoStack.push(snapshot(state));
      state.redoStack = [];
      state.stickers = state.stickers.filter((x) => x.id !== action.payload);
    },
    updateSticker: (state, action: PayloadAction<{ id: string; updates: Partial<StickerItem> }>) => {
      const item = state.stickers.find((x) => x.id === action.payload.id);
      if (item) Object.assign(item, action.payload.updates);
    },

    // Doodles
    addDoodle: (state, action: PayloadAction<DoodleItem>) => {
      state.undoStack.push(snapshot(state));
      state.redoStack = [];
      state.doodles.push(action.payload);
    },
    removeDoodle: (state, action: PayloadAction<string>) => {
      state.undoStack.push(snapshot(state));
      state.redoStack = [];
      state.doodles = state.doodles.filter((x) => x.id !== action.payload);
    },
    updateDoodle: (state, action: PayloadAction<{ id: string; updates: Partial<DoodleItem> }>) => {
      const item = state.doodles.find((x) => x.id === action.payload.id);
      if (item) Object.assign(item, action.payload.updates);
    },
    setDoodles: (state, action: PayloadAction<DoodleItem[]>) => {
      state.undoStack.push(snapshot(state));
      state.redoStack = [];
      state.doodles = action.payload;
    },

    // Captions
    setCaptions: (state, action: PayloadAction<CaptionItem[]>) => {
      state.undoStack.push(snapshot(state));
      state.redoStack = [];
      state.captions = action.payload;
    },

    // Links (metadata only)
    addLink: (state, action: PayloadAction<LinkItem>) => {
      state.undoStack.push(snapshot(state));
      state.redoStack = [];
      state.links.push(action.payload);
    },
    removeLink: (state, action: PayloadAction<string>) => {
      state.undoStack.push(snapshot(state));
      state.redoStack = [];
      state.links = state.links.filter((x) => x.id !== action.payload);
    },
    updateLink: (state, action: PayloadAction<{ id: string; updates: Partial<LinkItem> }>) => {
      const item = state.links.find((x) => x.id === action.payload.id);
      if (item) Object.assign(item, action.payload.updates);
    },

    // Adjust (no undo entry: sliders dispatch on every move)
    setAdjust: (state, action: PayloadAction<EditorAdjust>) => {
      state.adjust = action.payload;
    },

    setFrameAspect: (state, action: PayloadAction<number>) => {
      state.frameAspect = action.payload;
    },

    // Filter (no undo entry: the intensity slider dispatches on every move)
    setFilter: (state, action: PayloadAction<EditorFilter | null>) => {
      state.filter = action.payload;
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
        state.redoStack.push(snapshot(state));
        const { undoStack, redoStack } = state;
        Object.assign(state, previousState, { undoStack, redoStack });
      }
    },
    redo: (state) => {
      if (state.redoStack.length > 0) {
        const nextState = state.redoStack.pop()!;
        state.undoStack.push(snapshot(state));
        const { undoStack, redoStack } = state;
        Object.assign(state, nextState, { undoStack, redoStack });
      }
    },

    // Reset all
    resetEditor: () => initialState,
  },
});

export const {
  startSession,
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
  setMusic,
  addText,
  removeText,
  updateText,
  removeAllTexts,
  addSticker,
  removeSticker,
  updateSticker,
  addDoodle,
  removeDoodle,
  updateDoodle,
  setDoodles,
  setCaptions,
  addLink,
  removeLink,
  updateLink,
  setAdjust,
  setFrameAspect,
  setFilter,
  setCurrentTime,
  setIsPlaying,
  setSelectedItemId,
  undo,
  redo,
  resetEditor,
} = editorSlice.actions;

export default editorSlice.reducer;
