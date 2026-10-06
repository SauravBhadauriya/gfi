# Implementation Plan: Fix Post-Recording Workflow (Record → Preview → Editor → Caption → Post)

## Root Cause Analysis

**THE PROBLEM:** After recording stops, the Next/checkmark button appears briefly (clips ARE being added to state), but the workflow chain breaks silently between **CameraScreen** and the final post. The pipeline is incomplete at multiple handoff points.

### Key Findings from Code Inspection

1. **CameraScreen → Next Button → onNext() call: ✅ WORKING**
   - Line ~716: `clips.length > 0 && !isRecording` condition correctly shows checkmark button
   - Line ~773-776: `handleNextPress()` fires, calls `onNext(clipsWithMetadata)`
   - Clips ARE being added by `handleAddClip()` callback from useCamera hook
   - **Status:** This part works. Logging confirms clips are in state.

2. **useCamera hook → recordAsync callback: ✅ WORKING**
   - Lines 82-120 in useCamera.ts: recordAsync promise chains correctly
   - Line 89-95: onFinished callback IS called with valid clip object
   - **Status:** Clips successfully created and passed to handleAddClip.

3. **upload.tsx → handleVideoEditorExport → router.push: ⚠️ POTENTIAL RACE**
   - Line 24: `setShowVideoEditor(false)` runs BEFORE navigation
   - Line 25-33: `router.push()` occurs after state change
   - **RISK:** setState is async; camera unmounts before editor is ready. But RouterState should buffer.
   - **Status:** Probably OK but needs logging verification.

4. **editor.tsx → ClipParsing: ⚠️ PARSING NEVER COMPLETES**
   - Line 20-46: Clips are parsed from JSON string in params
   - **CRITICAL ISSUE:** Line 44 has logic error: `setIsReadyParsing(false)` is called inside BOTH try AND catch blocks in finally, which means isParsing becomes false even on error
   - **BUT** Line 50-52 shows: if isParsing=true OR clips.length === 0, show ActivityIndicator forever
   - **ACTUAL ROOT CAUSE:** If clips JSON parsing fails silently, isParsing stays false BUT clips.length === 0, so activity spinner loops forever and PreviewScreen never mounts
   - **Status:** **BROKEN** — clips parsing can fail if JSON string is malformed or clips array empty

5. **CameraScreen handleNextPress → clips metadata: ⚠️ DATA LOSS POSSIBLE**
   - Line 773-776: Creates `clipsWithMetadata` by adding musicTrack, filter, resolution, frameRate
   - These are attached to EACH clip in the array
   - **Risk:** If clips state is empty or undefined here, onNext gets empty array
   - **Status:** Check if clips.length guard is working

6. **PreviewScreen → ExportScreen → handleExportComplete: ⚠️ WRONG FLOW**
   - Line 57-69 in PreviewScreen.tsx: handleExportComplete callback
   - Line 62-66: Updates FIRST clip's uri with exportedVideoUri (if export succeeded)
   - **PROBLEM:** ExportScreen is supposed to export video, but exportAndCombineClips function may not exist or may fail silently
   - **Status:** Export function chain unclear; may not produce valid file

7. **editor.tsx handleEditorComplete → onExportComplete → router.push to post: ⚠️ NO VALIDATION**
   - Line 33 in editor.tsx: Calls `onExportComplete?.()` without checking if clips have valid uris
   - **Missing:** No check if exported video actually exists at the uri path
   - **Status:** Posts screen receives clips with unverified uris

8. **post.tsx handlePost → uploadVideoComplete: ✅ EXISTS**
   - Line 125-180: handlePost function exists and calls uploadVideoComplete
   - Line 170-173: Checks clipsFromParams.length and clipsFromParams[0]?.uri before uploading
   - **Status:** API call exists but only fires if video uri is present

9. **videoUploadService.uploadVideoComplete: ✅ EXISTS**
   - Full upload pipeline implemented with retry logic, presigned URLs, etc.
   - **Status:** Upload service is complete

### MISSING LOGGING [FLOW] TAGS

All these places NEED DEV-only logging to trace the flow:
- CameraScreen.handleNextPress (before calling onNext)
- CameraScreen.handleAddClip (when clip is added to state)
- upload.tsx.handleVideoEditorExport (before and after setShowVideoEditor/router.push)
- editor.tsx useEffect parsing clips (log parsed count, log if empty)
- editor.tsx.handleEditorComplete (before onExportComplete)
- PreviewScreen.handleExportComplete (log exported uri, log clips update)
- post.tsx.handlePost (log video uri received, log upload start)

### CHAINS THAT CAN SILENTLY BREAK

1. **Missing export file validation:** No FileSystem.getInfoAsync() check before passing uri to post screen
2. **JSON parse fails silently:** clips JSON string malformed → parsing fails → clips [] → spinner forever
3. **No file:// uri format validation:** Cache files might have wrong format
4. **Missing null/undefined checks:** onNext not called if clips state unintentionally cleared
5. **Missing await in async chains:** recordAsync might not resolve before stopRecording called again
6. **Race condition on router.push:** setShowVideoEditor(false) before navigation completes could unmount camera before editor screen mounts

---

## Implementation Plan

### Phase 1: Add [FLOW] Logging at All Handoffs

**Rationale:** Without visibility into the execution path, we cannot identify where the chain breaks. Add dev-only logging with [FLOW] prefix at every state transition and navigation event.

- [ ] 1. Add [FLOW] logging in CameraScreen.handleNextPress, CameraScreen.handleAddClip, and around the button visibility check.
      Files: src/modules/video-editor/camera-module/screens/CameraScreen.tsx
      Verify: `npx tsc --noEmit` passes with no errors in CameraScreen.

- [ ] 2. Add [FLOW] logging in upload.tsx handleVideoEditorExport, around setShowVideoEditor and router.push.
      Files: app/(main)/upload.tsx
      Verify: `npx tsc --noEmit` passes with no errors in upload.tsx.

- [ ] 3. Add [FLOW] logging in editor.tsx clip parsing useEffect (log parsed count, log if array is empty), and in handleEditorComplete before onExportComplete.
      Files: app/(main)/upload/editor.tsx
      Verify: `npx tsc --noEmit` passes with no errors in editor.tsx.

- [ ] 4. Add [FLOW] logging in PreviewScreen.handleExportComplete (log exported uri, log whether uri exists, log clips count).
      Files: src/modules/video-editor/camera-module/screens/PreviewScreen.tsx
      Verify: `npx tsc --noEmit` passes with no errors in PreviewScreen.

- [ ] 5. Add [FLOW] logging in post.tsx handlePost (log clips received, log video uri, log upload call start).
      Files: app/(main)/upload/post.tsx
      Verify: `npx tsc --noEmit` passes with no errors in post.tsx.

### Phase 2: Add File Validation and Uri Checks

**Rationale:** Clips can get lost if uris are invalid, files don't exist, or format is wrong. Validate before navigation.

- [ ] 6. In PreviewScreen.handleExportComplete, use FileSystem.getInfoAsync() to check if exportedVideoUri file exists before updating clips and calling onExportComplete. If not found, show an error alert with retry option.
      Files: src/modules/video-editor/camera-module/screens/PreviewScreen.tsx
      Verify: Manual test: record video → export → inspect logs for file existence check.

- [ ] 7. In editor.tsx useEffect (clip parsing), add a check after parsing: if clips array is empty OR any clip has no valid uri, log error and set a flag to show error message instead of spinner. Allow retry by going back and re-recording.
      Files: app/(main)/upload/editor.tsx
      Verify: `npx tsc --noEmit` passes; manual test: check error handling when clips are missing.

### Phase 3: Fix Race Condition and State Management

**Rationale:** CameraScreen state (clips, isRecording) may not update synchronously; router.push may fire before state settles.

- [ ] 8. In upload.tsx handleVideoEditorExport, log the clips count before routing. Ensure clips are not being cleared elsewhere. If needed, add a small delay (100ms) before router.push to let state updates settle, and log the final clips array before navigation.
      Files: app/(main)/upload.tsx
      Verify: Manual test: record, tap Next, check console logs show clips passed correctly.

- [ ] 9. In CameraScreen.handleNextPress, add a guard: if clips.length === 0, return without calling onNext (should already have guard, but verify logic). Log the condition before and after guard.
      Files: src/modules/video-editor/camera-module/screens/CameraScreen.tsx
      Verify: Manual test: tap Next with no clips, confirm no navigation occurs.

### Phase 4: Ensure Export and Downstream Flow Works

**Rationale:** ExportScreen may not produce a valid output uri, or the uri may not be passed correctly to post screen.

- [ ] 10. In editor.tsx handleEditorComplete, before calling onExportComplete, log the clips array (show first clip uri). Verify clips have valid uris. If any clip has no uri, log error and show alert before navigation.
       Files: app/(main)/upload/editor.tsx
       Verify: Manual test: editor export → caption screen, inspect logs for clip uris.

- [ ] 11. Verify ExportScreen and exportAndCombineClips function exist and produce valid file:// uris. Check if the function exists at the path referenced in ExportScreen imports. If it does not exist or fails silently, document the issue.
       Files: src/modules/video-editor/camera-module/components/ExportScreen.tsx (read) + find exportAndCombineClips source
       Verify: `grep -r "exportAndCombineClips" --include="*.ts" --include="*.tsx"` returns the function definition.

- [ ] 12. In post.tsx handlePost, before calling uploadVideoComplete, verify clipsFromParams[0]?.uri exists and is a valid file:// uri. Use FileSystem.getInfoAsync() to check. If invalid, show error alert instead of uploading.
       Files: app/(main)/upload/post.tsx
       Verify: Manual test: caption screen → Post button, check logs confirm video uri is valid.

### Phase 5: TypeScript Compilation and Manual Testing

**Rationale:** Ensure all changes compile and the workflow works end-to-end on device.

- [ ] 13. Run `npx tsc --noEmit` on all modified files to ensure no type errors.
       Files: All files modified in phases 1-4
       Verify: Command returns exit code 0 with no errors.

- [ ] 14. Run `npx expo lint` if available to check for style/lint issues.
       Files: All modified files
       Verify: No critical lint errors.

- [ ] 15. On physical Android device (Unisoc ums9621, Android 15), perform end-to-end manual test:
       - Open upload screen
       - Record 5-second video (tap shutter)
       - After recording stops, verify checkmark button is VISIBLE
       - Tap checkmark (Next)
       - Verify PreviewScreen/editor screen opens (not stuck on spinner)
       - Tap Next/Export in editor
       - Verify ExportScreen shows progress and completes
       - Verify caption/post screen appears with video preview
       - Fill caption
       - Tap Post
       - Verify upload begins and completes (or shows error)
       - Verify final success alert and navigation to feed
       - Check console logs for all [FLOW] tags and file validation checks
       Verify: Workflow completes without crashes or stuck spinners.

---

## Success Criteria

1. ✅ All [FLOW] logging tags are present in console during full workflow
2. ✅ File validation checks (FileSystem.getInfoAsync) pass before navigation
3. ✅ No race conditions: state updates complete before router.push
4. ✅ Editor screen does not show spinner indefinitely
5. ✅ Post screen receives video uri and uploads successfully
6. ✅ No TypeScript errors
7. ✅ End-to-end manual test on physical device passes without crashes

---

## Notes on Existing Code Preserved

- **System camera fallback** (`USE_SYSTEM_CAMERA_FALLBACK`) left as-is
- **Force picture mode** (`FORCE_PICTURE_MODE_FOR_VIDEO`) left as-is
- **All existing UI components** (buttons, modals, styling) unchanged
- **Upload service and API client** unchanged
- **Music/filter selection** and metadata attachment unchanged
- **Undo/redo, overlays, text editor** all left intact
