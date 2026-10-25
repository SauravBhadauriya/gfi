import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type PostingStage = "preparing" | "converting" | "processing" | "uploading" | "publishing" | "done";

export const POSTING_STAGES: { id: PostingStage; label: string }[] = [
  { id: "preparing", label: "Preparing" },
  { id: "converting", label: "Converting photo" },
  { id: "processing", label: "Processing video" },
  { id: "uploading", label: "Uploading" },
  { id: "publishing", label: "Publishing" },
  { id: "done", label: "Done" },
];

export interface ToastState {
  id: number;
  message: string;
  kind: "info" | "error";
}

interface PostingState {
  /** idle: nothing posting. running: in progress. failed: waiting for Retry or Cancel. done: just posted. */
  phase: "idle" | "running" | "failed" | "done";
  stage: PostingStage;
  /** 0..100 across all stages. */
  progress: number;
  mediaType: "video" | "photo";
  /** "draft" posts are saved, not published. */
  mode: "publish" | "draft";
  /** Stages this post goes through (a photo is converted first). */
  stages: PostingStage[];
  error: string | null;
  /** Short messages for problems outside a post (export failed, etc.); shown by the same banner. */
  toast: ToastState | null;
}

const initialState: PostingState = {
  phase: "idle",
  stage: "preparing",
  progress: 0,
  mediaType: "video",
  mode: "publish",
  stages: ["preparing", "uploading", "publishing", "done"],
  error: null,
  toast: null,
};

const postingSlice = createSlice({
  name: "posting",
  initialState,
  reducers: {
    postingStarted: (
      state,
      action: PayloadAction<{ mediaType: "video" | "photo"; mode?: "publish" | "draft"; stages: PostingStage[] }>
    ) => ({
      ...state,
      phase: "running",
      stage: action.payload.stages[0],
      stages: action.payload.stages,
      mediaType: action.payload.mediaType,
      mode: action.payload.mode ?? "publish",
      progress: 0,
      error: null,
    }),
    postingProgress: (state, action: PayloadAction<{ stage: PostingStage; progress: number }>) => {
      state.phase = "running";
      state.stage = action.payload.stage;
      state.progress = Math.max(state.progress, Math.min(100, Math.round(action.payload.progress)));
      state.error = null;
    },
    postingFailed: (state, action: PayloadAction<string>) => {
      state.phase = "failed";
      state.error = action.payload;
    },
    postingDone: (state) => {
      state.phase = "done";
      state.stage = "done";
      state.progress = 100;
      state.error = null;
    },
    postingCleared: (state) => {
      state.phase = "idle";
      state.progress = 0;
      state.error = null;
    },
    showToast: (state, action: PayloadAction<{ message: string; kind?: "info" | "error" }>) => {
      state.toast = { id: Date.now(), message: action.payload.message, kind: action.payload.kind ?? "info" };
    },
    clearToast: (state) => {
      state.toast = null;
    },
  },
});

export const { postingStarted, postingProgress, postingFailed, postingDone, postingCleared, showToast, clearToast } =
  postingSlice.actions;
export default postingSlice.reducer;
