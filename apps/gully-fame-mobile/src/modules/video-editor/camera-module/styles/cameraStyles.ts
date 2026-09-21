import { StyleSheet } from 'react-native';

/**
 * Shared styles for all camera module screens & components.
 */
export const cameraStyles = StyleSheet.create({
  // Home screen
  homeContainer: {
    flex: 1,
    backgroundColor: '#050509',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  homeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  homeSubtitle: {
    fontSize: 14,
    color: '#b0b0b5',
    textAlign: 'center',
    marginBottom: 32,
  },
  uploadButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#3b82f6',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Camera screen
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraPreview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeToggleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  flashToggleContainer: {
    alignItems: 'flex-end',
  },
  bottomBar: {
    paddingBottom: 32,
    paddingTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050509',
  },

  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  backButtonText: {
    color: '#e5e7eb',
    fontSize: 14,
  },

  // Capture button
  captureButtonOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 86,
    height: 86,
    borderRadius: 86 / 2,
    borderWidth: 3,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  captureButtonInnerRecording: {
    borderColor: '#ffffff',
    borderWidth: 3,
  },
  captureButtonInnerCircle: {
    width: 68,
    height: 68,
    borderRadius: 68 / 2,
    backgroundColor: '#ec9a15',
  },
  captureButtonInnerCircleRecording: {
    backgroundColor: '#ef4444',
    // Red inner circle when recording
  },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    padding: 4,
  },
  modeToggleOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  modeToggleOptionActive: {
    backgroundColor: '#f9fafb',
  },
  modeToggleText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  modeToggleTextActive: {
    color: '#111827',
  },

  // Flash toggle
  flashToggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  flashToggleText: {
    color: '#f9fafb',
    fontSize: 13,
  },
  // All icons aligned vertically on the left side
  // Vertical icon overlays with equal spacing (50px between each)
  flashOverlay: {
    position: 'absolute',
    left: 16,
    top: '50%',
    marginTop: -100, // Flash at top (1st icon)
    zIndex: 90,
  },
  
  // Timer selector (below flash toggle)
  timerSelectorOverlay: {
    position: 'absolute',
    left: 16,
    top: '50%',
    marginTop: -50, // Timer second (50px below flash)
    zIndex: 90,
  },
  
  // Speed selector (below timer selector)
  speedSelectorOverlay: {
    position: 'absolute',
    left: 16,
    top: '50%',
    marginTop: 0, // Speed third (50px below timer)
    zIndex: 90,
  },
  hdSelectorOverlay: {
    position: 'absolute',
    left: 16,
    top: '50%',
    marginTop: 50, // HD fourth (50px below speed)
    zIndex: 90,
  },
  disabledIconButton: {
    opacity: 0.4,
  },
  disabledIconText: {
    opacity: 0.4,
  },
  gridToggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  timerSelectorButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  
  speedSelectorButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  speedSelectorText: {
    color: '#ec9a15',
    fontSize: 14,
    fontWeight: '700',
  },
  
  // Timer modal (compact popup to the right)
  timerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  timerModalContent: {
    position: 'absolute',
    backgroundColor: 'rgba(31, 41, 55, 0.95)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 2,
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  timerModalArrow: {
    position: 'absolute',
    left: -7,
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderTopColor: 'transparent',
    borderBottomWidth: 7,
    borderBottomColor: 'transparent',
    borderRightWidth: 7,
    borderRightColor: 'rgba(31, 41, 55, 0.95)',
  },
  timerModalOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 2,
    marginHorizontal: 2,
  },
  timerModalOptionActive: {
    backgroundColor: '#ec9a15',
  },
  timerModalOptionText: {
    color: '#e5e7eb',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  timerModalOptionTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  
  // Speed modal (compact popup to the right)
  speedModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  speedModalContent: {
    position: 'absolute',
    backgroundColor: 'rgba(31, 41, 55, 0.95)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 2,
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  speedModalArrow: {
    position: 'absolute',
    left: -7,
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderTopColor: 'transparent',
    borderBottomWidth: 7,
    borderBottomColor: 'transparent',
    borderRightWidth: 7,
    borderRightColor: 'rgba(31, 41, 55, 0.95)',
  },
  speedModalOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 2,
    marginHorizontal: 2,
  },
  speedModalOptionActive: {
    backgroundColor: '#ec9a15',
  },
  speedModalOptionText: {
    color: '#e5e7eb',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  speedModalOptionTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // Recording timer
  recordingTimerContainer: {
    position: 'absolute',
    top: 56, // below the top bar so it stays visible
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 99,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  recordingTimerText: {
    color: '#fef2f2',
    fontSize: 13,
    fontWeight: '600',
  },

  // Clip list
  clipListContainer: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#111827',
    backgroundColor: '#050509',
  },
  clipListEmptySpace: {
    height: 0,
  },
  clipItemContainer: {
    marginRight: 8,
    alignItems: 'center',
  },
  clipThumbnailWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#111827',
    backgroundColor: '#020617',
  },
  clipThumbnail: {
    width: 72,
    height: 72,
  },
  clipTypeBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  },
  clipTypeBadgeText: {
    color: '#e5e7eb',
    fontSize: 10,
    fontWeight: '600',
  },
  clipMetaText: {
    marginTop: 4,
    fontSize: 11,
    color: '#9ca3af',
  },
  clipDeleteButton: {
    marginTop: 2,
  },
  clipDeleteText: {
    fontSize: 14,
    color: '#ef4444',
  },

  // Bottom controls row (capture + next)
  bottomControlsRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  nextButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ec9a15',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },

  // Permissions UI
  permissionContainer: {
    flex: 1,
    backgroundColor: '#050509',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  permissionText: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#e5e7eb',
    fontSize: 14,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#3b82f6',
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },

  // Preview screen
  previewContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
  },
  previewMedia: {
    width: '100%',
    height: '75%',
    backgroundColor: '#000000',
  },
  previewButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 24,
  },
  previewButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#1f2937',
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#f9fafb',
    fontSize: 15,
    fontWeight: '500',
  },
  emptyPreviewText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  // Gallery button next to capture button
  galleryButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  // Camera switch button
  cameraSwitchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },

  // HD Selector
  hdSelectorButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  hdSelectorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  // HD Modal (popup with sections)
  hdModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  hdModalContent: {
    position: 'absolute',
    backgroundColor: 'rgba(31, 41, 55, 0.95)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  hdModalArrow: {
    position: 'absolute',
    left: -7,
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderTopColor: 'transparent',
    borderBottomWidth: 7,
    borderBottomColor: 'transparent',
    borderRightWidth: 7,
    borderRightColor: 'rgba(31, 41, 55, 0.95)',
  },
  hdModalSection: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  hdModalSectionTitle: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  hdModalOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    gap: 4,
  },
  hdModalOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  hdModalOptionActive: {
    backgroundColor: '#ec9a15',
  },
  hdModalOptionDisabled: {
    backgroundColor: 'rgba(100, 100, 100, 0.2)',
    opacity: 0.5,
  },
  hdModalOptionText: {
    color: '#e5e7eb',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  hdModalOptionTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  hdModalOptionTextDisabled: {
    color: '#6b7280',
    opacity: 0.6,
  },
});


