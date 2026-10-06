# PHASE 1 Implementation Plan: Recording to Preview Flow

## Overview
This plan details the implementation of four deliverables for the camera recording → preview flow:
1. CameraScreen duration and timer enhancements
2. New dedicated PreviewScreen (full-screen video preview before timeline editor)
3. Zustand reel upload store for state persistence
4. File/path handling verification

---

## Design Decisions

### Decision 1: PreviewScreen Architecture → Sub-view in EditorScreen
**Chosen:** Add a state-based sub-view in EditorScreen to conditionally render either PreviewScreen (new video preview) or TimelineEditor (editing). This avoids creating a new route and keeps the editor.tsx a single logical endpoint.

**Rationale:** 
- The existing PreviewScreen is the first step after recording; renaming it to "TimelineEditor wrapper" and adding a preview step above it is cleaner than a new route.
- EditorScreen already handles clip state and navigation — adding a `showTimeline` boolean let's it orchestrate both screens in one place.
- Simpler backstack: Camera → EditorScreen (with Preview OR Timeline) → Post, vs. Camera → EditorScreen → PreviewStep → EditorStep → Post.

### Decision 2: Merge Videos Before Preview, Not After
**Chosen:** `exportAndCombineClips` runs in PreviewScreen's `useEffect` on mount (only if clips.length > 1). Single clips skip merge and play directly.

**Rationale:**
- Users see the final video they're about to edit, not a list of unmerged clips.
- Merge happens once, before editing, so timeline editor sees a single URI per single-file import (simplifies editing state).
- Progress spinner + "Merging videos…" gives visual feedback for the wait.

### Decision 3: Zustand Store with AsyncStorage Persistence
**Chosen:** Use Zustand v5 with `persist` middleware backed by `@react-native-async-storage/async-storage`.

**Rationale:**
- Zustand v5 is already in package.json (^5.0.8). `persist` middleware is the idiomatic way to add storage.
- AsyncStorage is already a dependency; no new packages needed.
- State survives app kills during upload flows (browser-like recovery).

---

## Implementation Plan

### 1. CameraScreen.tsx — Duration and Timer Enhancements
**What:** Patch CameraScreen to enforce totalDuration >= 1s for Next button, show clip timeline breakdown, auto-hide capture when timer is reached, and change Retake (undo) to clear ALL clips.

**Files:**
- `src/modules/video-editor/camera-module/screens/CameraScreen.tsx`

**Changes:**

a) **Calculate totalDuration**
   - Add helper: `const totalDuration = clips.reduce((sum, c) => sum + (c.duration || 0), 0);`
   - Compute this after the clip list is rendered.

b) **Next button enabled condition** 
   - Current: `clips.length > 0 && !isRecording`
   - Change to: `clips.length > 0 && !isRecording && totalDuration >= 1`
   - Disable the button with `opacity: 0.5` if totalDuration < 1s.

c) **Show clip timeline/duration breakdown below ClipList**
   - After the `<ClipList>` component, add a new `<View>` with clip duration display:
     ```
     [clip1: 5.2s] [clip2: 4.8s] … [Total: 9.0s / 15s max]
     ```
   - Format: for each clip, show `[clipId or index: duration]`, then total and timer max.
   - Render only if `clips.length > 0`.

d) **Auto-hide capture button when timer is reached**
   - Check after each clip is added: `if (timerDuration > 0 && totalDuration >= timerDuration) { hide capture button }`
   - Hide by wrapping the capture button section in a conditional that returns early if timer reached.
   - Show only Retake and Next buttons when timer is reached (user must proceed or retake).

e) **Retake behavior: clear ALL clips with Alert**
   - Current `handleUndo`: asks "Discard last clip?" and removes only the last clip.
   - Change to: ask "Clear all clips?" and clear the entire `clips` array: `setClips([])`.
   - Rationale: "Retake" = restart recording, not undo one clip. Undo the entire session.

**Verify:**
- Run the app manually: record clips, watch total duration update, see timeline breakdown.
- Verify Next button is disabled if totalDuration < 1s.
- Set a 15s timer, record past 15s, watch capture button hide (only Retake/Next visible).
- Press Retake, confirm Alert pops, press OK, confirm all clips are cleared and UI resets.
- Unit tests (if test suite exists): check totalDuration calculation and button enable/disable logic.

---

### 2. New PreviewScreen — Full-Screen Video Preview with Controls
**What:** Replace existing PreviewScreen to show merged/single clip as full-screen video with overlay controls (Back, Retake, Edit, Next, Mute, Save to Gallery) before the timeline editor.

**Files:**
- `src/modules/video-editor/camera-module/screens/PreviewScreen.tsx` (full replacement)

**Structure & Implementation:**

a) **Props (extend PreviewScreenProps)**
   ```typescript
   export interface PreviewScreenProps {
     clips: CameraClipArray;
     onBack?: () => void;
     onClipUpdate?: (clips: CameraClipArray) => void;
     onExportComplete?: () => void;
     onEditPress?: (mergedUri: string, clips: CameraClipArray) => void; // NEW
   }
   ```

b) **Component Logic**
   - **State:**
     - `mergedUri: string | null` — result of merge or single clip URI.
     - `isMerging: boolean` — true while merge in progress.
     - `mergeProgress: number` — 0–1 for spinner.
     - `isMuted: boolean` — mute toggle state.
     - `mergeError: string | null` — error message if merge fails.
   
   - **useEffect on mount:**
     - If `clips.length > 1`: call `exportAndCombineClips(clips, onProgress)` with progress callback.
       - Update `mergeProgress` from callback.
       - On success: set `mergedUri`.
       - On error: set `mergeError`, show error UI with retry button.
     - If `clips.length === 1`: set `mergedUri = clips[0].uri` immediately (skip merge).
   
   - **Render:**
     - While `isMerging`: show full-screen spinner with "Merging videos…" text + progress percentage.
     - If `mergeError`: show error message + "Retry" button (re-run merge).
     - Else (after merge): show `<VideoView>` (from expo-video) full-screen.
   
   - **VideoView Setup:**
     - Use `useVideoPlayer` hook (expo-video v57+).
     - Set `source={{ uri: mergedUri }}`.
     - Set `loop={true}`, `playWhenInactive={false}`, `autoPlay={true}`.
     - Initialize player state: `isPlaying=true` on component mount.
   
   - **Overlay Controls (absolute positioned):**
     - **Top-left: Back button** → Alert("Recording will be lost") → `onBack()`.
     - **Top-right: Mute button** → Toggle `isMuted`, call `player.mute(isMuted)`.
     - **Bottom-left: Retake button** → Alert("Re-record?") → `setClips([])` → `onBack()`.
     - **Bottom-center-left: Edit button** → `onEditPress(mergedUri, clips)` (NEW callback).
     - **Bottom-center-right: Next button** → `onExportComplete()` (existing flow to post).
     - **Bottom-right: Save to Gallery button** → Permission request + `saveToLibraryAsync(mergedUri)` + Alert success/error.
   
   - **Error Handling:**
     - If playback fails (VideoView error callback): show "Playback failed. Retry or go back."
     - If merge fails: show "Merge failed. Retry?" with retry button.
     - All errors are non-blocking; user can go back or retry.

**Verify:**
- Record 1 clip: PreviewScreen shows it full-screen immediately (no merge).
- Record 2+ clips: PreviewScreen shows "Merging videos…" → merged video appears.
- Press Back: Alert "Recording will be lost" → Back takes you to CameraScreen.
- Press Retake: Alert "Re-record?" → clears all clips → back to CameraScreen.
- Press Edit: calls `onEditPress(mergedUri, clips)` → next step (EditorScreen) handles it.
- Press Next: calls `onExportComplete()` → navigates to post.
- Press Mute: video sound mutes/unmutes (visually on UI).
- Press Save to Gallery: permission request → saves video → Alert success/error.
- Simulate merge error: wrap exportAndCombineClips in try/catch, trigger error, confirm UI shows error + retry.

---

### 3. Update EditorScreen to Support Edit Flow from PreviewScreen
**What:** EditorScreen now orchestrates two sub-views: PreviewScreen (new) and TimelineEditor (existing). When Edit is pressed in PreviewScreen, it shows TimelineEditor. The new `onEditPress` callback transitions from preview to editing.

**Files:**
- `app/(main)/upload/editor.tsx`

**Changes:**

a) **Add state:**
   ```typescript
   const [showTimeline, setShowTimeline] = useState(false); // false = preview, true = editing
   ```

b) **New callback: handleEditPress**
   ```typescript
   const handleEditPress = useCallback((mergedUri: string, clips: CameraClipArray) => {
     // At this point, mergedUri is the full video to edit
     // Update clips[0].uri to mergedUri so timeline editor uses the merged video
     const updatedClips = clips.map((clip, idx) => 
       idx === 0 ? { ...clip, uri: mergedUri } : clip
     );
     setClips(updatedClips);
     setShowTimeline(true);
   }, []);
   ```

c) **Conditional render:**
   ```typescript
   if (showTimeline) {
     return <TimelineEditor clips={clips} onClipsUpdate={handleClipUpdate} ... />;
   } else {
     return <PreviewScreen clips={clips} onEditPress={handleEditPress} ... />;
   }
   ```

d) **Pass callbacks to PreviewScreen:**
   ```typescript
   <PreviewScreen
     clips={clips}
     onBack={handleEditorBack}
     onClipUpdate={handleClipUpdate}
     onEditPress={handleEditPress}  // NEW
     onExportComplete={handleEditorComplete}
   />
   ```

**Verify:**
- Record → EditorScreen → PreviewScreen shows preview.
- Press Edit → shows TimelineEditor.
- Retake from preview → back to CameraScreen.
- Retake from timeline → back to CameraScreen (existing behavior, no change).
- Next from timeline → post screen (existing behavior).

---

### 4. Create Zustand Reel Upload Store
**What:** Create a new Zustand store with Persist middleware for reel upload state (clips, edited video URI, metadata, upload progress).

**Files:**
- `src/stores/reelUploadStore.ts` (create new)

**Implementation:**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CameraClipArray } from '@/modules/video-editor/camera-module/types/camera.types';

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
      storage: AsyncStorage,
    }
  )
);
```

**Verify:**
- Import the store in a test component.
- Call `setClips()`, `setCaption()`, etc. and confirm state updates.
- Close app and reopen; confirm state persists (AsyncStorage check).
- Call `reset()` and confirm state returns to initial values.
- No tests required for this deliverable (store is utility); verification is manual usage.

---

### 5. Verify File/Path Handling (No Code Changes)
**What:** Confirm that expo-camera URIs (`file://` paths) work natively with ffmpeg-kit and expo-video without copying/converting.

**Findings:**
- **expo-camera** returns URIs like `file:///data/user/0/com.gullyfame.mobile/cache/...mp4`.
- **ffmpeg-kit-react-native** (v6.0.2 in package.json) handles `file://` URIs natively on Android and iOS.
- **expo-video** (v57+ in package.json) also handles `file://` URIs natively via `VideoView`.
- **videoExporter.ts** already uses clip URIs directly in FFmpeg commands without copying. Example:
  ```typescript
  const trimCommand = `-ss ${trimStart} -i "${clip.uri}" -t ${trimDuration} ...`;
  ```
- **Conclusion:** No changes needed. URIs are used directly throughout the pipeline.

**Verify:**
- Record a video → observe cache URI in console logs.
- Pass URI to `exportAndCombineClips` → confirm ffmpeg processes it without error.
- Play merged URI in `<VideoView>` → confirm playback works.
- No file copying overhead or redundant steps in the flow.

---

## TypeScript Checklist

### Imports to Validate
- [ ] `expo-video`: `VideoView`, `useVideoPlayer` (already in package.json, v57.0.4)
- [ ] `expo-media-library`: `saveToLibraryAsync`, `requestPermissionsAsync` (already in package.json, v57.0.5)
- [ ] `zustand`: `create` function (already in package.json, v5.0.8)
- [ ] `zustand/middleware`: `persist` (standard export from zustand)
- [ ] `@react-native-async-storage/async-storage`: `default` (already in package.json, v2.2.0)
- [ ] Existing imports in CameraScreen, PreviewScreen, EditorScreen (no new ones needed beyond above)

### Types to Confirm Exist
- [ ] `CameraClipArray`, `CameraClip` — defined in `camera.types.ts` ✓
- [ ] `PreviewScreenProps` — will be extended with `onEditPress` ✓
- [ ] `ReelUploadState` — new, defined in reelUploadStore.ts ✓
- [ ] `VideoPlayer` from expo-video (typings included in package) ✓

### Export Verification
- [ ] `useReelUploadStore` exported from `reelUploadStore.ts` for use in other screens
- [ ] `PreviewScreen` exported as default from `PreviewScreen.tsx`
- [ ] `CameraScreen` already exported, no changes needed

---

## Summary of Altered Files

| File | Change | Reason |
|------|--------|--------|
| `CameraScreen.tsx` | Add totalDuration calc, duration display, timer check, Retake behavior | Enforce 1s min, show progress, auto-hide capture, full retake |
| `PreviewScreen.tsx` | Full replacement: video preview + controls + merge logic | New preview-before-edit step |
| `EditorScreen.tsx` | Add showTimeline state, handleEditPress, conditional render | Route Edit button to timeline view |
| `reelUploadStore.ts` | Create new file | Persist reel state across app sessions |

---

## Build & Test Commands

Assuming standard React Native / Expo project:
- **Build:** `npm run start` or `eas build` (no build config changes needed)
- **Test (manual):** Record clips → observe preview → edit → export (existing test flow)
- **Lint:** `npm run lint` (if available; run after edits to catch TS errors)

---

## Notes

- **No new dependencies:** All required packages already exist in package.json.
- **No route changes:** EditorScreen remains at `/(main)/upload/editor`; PreviewScreen is now a sub-view inside EditorScreen.
- **Backward compatible:** Existing post-screen flow unchanged; only the preview step is new.
- **Error recovery:** All error states have user-facing UI (Alert or inline error) and recovery options (Retry, Back, etc.).

