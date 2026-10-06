// Created by Kiro - Video Editor Screen (Integrated with ModernPreviewEditor)
// Handles video editing with trimming, filters, text, music, and export pipeline

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  videoEditorService,
  EditingSession,
  VideoFilter,
  VideoText,
  VideoExportOptions,
} from "../api/services/videoEditorService";

// 🎬 Importing the premium editor component and types
import ModernPreviewEditor from "../modules/video-editor/camera-module/components/ModernPreviewEditor";
import type { CameraClip } from "../modules/video-editor/camera-module/types/camera.types";

// ⚡ Naya Import SpeedSelector ke liye
import SpeedSelector from "../components/ui/SpeedSelector"; 

interface VideoEditorScreenProps {
  route?: any;
  navigation?: any;
}

const { width } = Dimensions.get("window");

const VideoEditorScreen: React.FC<VideoEditorScreenProps> = ({ route, navigation }) => {
  const videoUri = route?.params?.videoUri || "";

  // Core Session & Loading States
  const [session, setSession] = useState<EditingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  // 🔄 Unified state to catch all interactive edits from ModernPreviewEditor
  const [clip, setClip] = useState<CameraClip>({
    id: `clip_${Date.now()}`,
    uri: videoUri,
    duration: 0,
    type: "video",
    source: "camera",
    trimStart: 0,
    trimEnd: 0,
    textOverlays: [],
    musicOffset: 0,
    speed: 1,
  });

  // ✅ Initialize editing session on mount
  useEffect(() => {
    initializeSession();
  }, []);

  // ✅ Create backend editing session
  // ✅ Create backend editing session (With Duration Debugger)
  const initializeSession = async () => {
    try {
      setLoading(true);
      const response = await videoEditorService.createEditingSession(videoUri);

      if (response.success && response.data) {
        setSession(response.data);
        
        // 🔥 DEBUG: Agar backend se duration 0 ya missing ho, toh fallback 15s lagayein
        let videoDuration = response.data.duration || 15;
        
        // Agar duration milliseconds mein hai (e.g. 5000), toh use seconds mein convert karein
        if (videoDuration > 1000) {
          videoDuration = videoDuration / 1000;
        }

        setClip((prev) => ({
          ...prev,
          trimEnd: videoDuration,
        }));
        
        console.log("🍏 [VideoEditorScreen] Session Active! Corrected Duration:", videoDuration);
      } else {
        Alert.alert("Error", response.message || "Failed to create editing session");
      }
    } catch (error) {
      console.error("[VideoEditorScreen] Session initialization error:", error);
      Alert.alert("Error", "Failed to initialize video editor");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Capture live changes from the timeline component (With Logger)
  const handleClipUpdate = (updatedClip: CameraClip) => {
    // 🔥 DEBUG LOG: Dekhte hain click karne par values badal rahi hain ya nahi
    console.log("🔄 UI Clicked - New Trim Data:", {
      trimStart: updatedClip.trimStart,
      trimEnd: updatedClip.trimEnd,
    });
    setClip(updatedClip);
  };

  // ⚡ New Handler for Speed Change
  const handleSpeedChange = (newSpeed: number) => {
    setClip(prev => ({
      ...prev,
      speedConfig: { type: 'constant', value: newSpeed }
    }));
  };

  // 🚀 Sequential Processing Pipeline when user hits "Next"
  const handleNextPipeline = async () => {
    if (!session) return;

    try {
      setProcessing(true);

      // 1️⃣ Step: Apply Trim if timeline handles were dragged
      if ((clip.trimStart ?? 0) > 0 || (clip.trimEnd ?? session.duration ?? 0) < (session.duration || 0)) {
        setProcessingMessage("Trimming your video clip...");
        await videoEditorService.trimVideo(session.id, clip.trimStart ?? 0, clip.trimEnd ?? session.duration);
      }

      // ⚡ Step 1.5: Apply Speed adjustment before filters
      const currentSpeed = clip.speedConfig?.value || 1.0;
      if (currentSpeed !== 1.0) {
        setProcessingMessage(`Adjusting speed to ${currentSpeed}x...`);
        // Note: Make sure `changeVideoSpeed` exists in your videoEditorService backend
        if ((videoEditorService as any).changeVideoSpeed) {
           await (videoEditorService as any).changeVideoSpeed(session.id, currentSpeed);
        } else {
           console.warn("changeVideoSpeed method not found in videoEditorService");
        }
      }

      // 2️⃣ Step: Apply Look/Filter
      if (clip.filterPreset && clip.filterPreset.name !== "Original") {
        setProcessingMessage(`Applying ${clip.filterPreset.name} filter...`);
        const filter: VideoFilter = {
          id: clip.filterPreset.name.toLowerCase(),
          name: clip.filterPreset.name,
          type: clip.filterPreset.name.toLowerCase() as any,
          value: 100,
        };
        await videoEditorService.applyFilter(session.id, filter);
      }

      // 3️⃣ Step: Add Text Track layers
      if (clip.textOverlays && clip.textOverlays.length > 0) {
        setProcessingMessage("Baking text overlays...");
        for (const overlay of clip.textOverlays) {
          const text: VideoText = {
            id: overlay.id,
            text: overlay.text,
            fontSize: overlay.fontSize || 24,
            color: overlay.color || "#FFFFFF",
            position: "center",
            startTime: 0,
            endTime: session.duration,
          };
          await videoEditorService.addTextOverlay(session.id, text);
        }
      }

      // 4️⃣ Step: Render & Export final file
      setProcessingMessage("Compiling final render...");
      const options: VideoExportOptions = {
        quality: "medium", // Matches your original default
        resolution: "720p", // Matches your original default
        format: "mp4",
      };

      const response = await videoEditorService.exportVideo(session.id, options);

      if (response.success && response.data) {
        Alert.alert("Success", "Video processed successfully!", [
          {
            text: "Perfect",
            onPress: () => {
              navigation?.navigate("ReelsScreen", {
                exportedVideoUri: response.data?.videoUri,
                musicOffset: clip.musicOffset, // Forwarding dynamic sync data
              });
            },
          },
        ]);
      } else {
        Alert.alert("Export Error", response.message || "Failed to compile modifications.");
      }
    } catch (error) {
      console.error("[VideoEditorScreen] Processing pipeline failed:", error);
      Alert.alert("Pipeline Error", "An error occurred during final render.");
    } finally {
      setProcessing(false);
      setProcessingMessage("");
    }
  };

  // Loading State Spinner
  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing Studio Session...</Text>
      </View>
    );
  }

  // Processing Pipeline Overlay
  if (processing) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.processingText}>{processingMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🎬 Feeding state and control loops directly into your layout component */}
      <ModernPreviewEditor
        clip={clip}
        onClipUpdate={handleClipUpdate}
        onBack={() => navigation?.goBack()}
        onNext={handleNextPipeline}
        canUndo={false}
        canRedo={false}
      />

      {/* ⚡ Injecting the Speed Selector overlapping the bottom */}
      <View style={styles.speedSelectorWrapper}>
        <SpeedSelector 
          speed={clip.speedConfig?.value || 1.0} 
          onSpeedChange={handleSpeedChange} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  processingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
  },
  // ⚡ Positioning for the speed selector
  speedSelectorWrapper: {
    position: 'absolute',
    bottom: 120, // Aapke UI ke hisab se isko adjust kar lena agar buttons ke upar/neeche karna ho
    left: 0,
    right: 0,
    zIndex: 100,
  }
});

export default VideoEditorScreen;
