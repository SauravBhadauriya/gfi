import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Dimensions,
  Animated,
  Modal,
  ScrollView,
  Alert,
  Linking,
  Image,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path, Circle, Rect, G } from "react-native-svg";

let VideoEditorModule: any = null;
import MusicLibraryModal from "@/components/MusicLibraryModal";
import { listAudio } from "@api/services/musicLibraryService";
import { listFilters, FilterPreset } from "@api/services/filterLibraryService";
import {
  FlashIcon,
  TimerIcon,
  SpeedIcon,
  MusicIcon,
  FilterIcon,
  CloseIcon,
  GalleryIcon,
  CameraFlipIcon,
} from "@/icons";

const { width } = Dimensions.get("window");

type RecordingMode = "video" | "photo";
type CameraFacing = "front" | "back";
type FlashMode = "off" | "on" | "auto";
type SpeedOption = 0.5 | 1 | 1.5 | 2;
type TimerOption = 15 | 30 | 60 | 0;

interface VideoClip {
  id: string;
  uri: string;
  duration: number;
  thumbnail?: string;
  speed?: SpeedOption;
  musicTrack?: any;
  filter?: any;
  resolution?: string;
  frameRate?: number;
}

interface CameraFormat {
  resolution: string;
  frameRate: number;
  color: "SDR" | "HDR";
}


function _mapResolutionToQuality(resolution: string): string {
  switch (resolution?.toLowerCase()) {
    case "4k":
    case "4k_3840x2160":
      return "2160p";  
    case "2k":
    case "2k_2560x1440":
      return "1440p";  
    case "fhd":
    case "1080p":
      return "1080p";  
    case "hd":
    case "720p":
    default:
      return "480p";   
  }
}

function _getVideoQualityBitrate(resolution: string): number {
  // Bitrate in bits per second for different resolutions
  switch (resolution?.toLowerCase()) {
    case "4k":
    case "4k_3840x2160":
      return 15000000; // 15 Mbps for 4K
    case "2k":
    case "2k_2560x1440":
      return 8000000;  // 8 Mbps for 2K
    case "fhd":
    case "1080p":
      return 5000000;  // 5 Mbps for FHD
    case "hd":
    case "720p":
    default:
      return 2500000;  // 2.5 Mbps for HD
  }
}


export default function TikTokCameraScreen() {
  console.log("🔥🔥🔥 GULLYFAME CAMERA SCREEN RUNTIME VERSION 999 - ACTUAL ROUTE 🔥🔥🔥");
  const [isFocused, setIsFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );
  const params = useLocalSearchParams();
  const competitionId = params.competitionId ? String(params.competitionId) : null;
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [isVideoEditorLoaded, setIsVideoEditorLoaded] = useState(false);
  const competitionName = params.competitionName ? String(params.competitionName) : null;
  const entryFee = params.entryFee ? String(params.entryFee) : null;
  
  
  const supportedResolutions = ["HD", "FHD", "2K", "4K"];
  const supportedFrameRates = [24, 30, 60];
  const supportedColors: ("SDR" | "HDR")[] = ["SDR", "HDR"];
  const supportedZoomLevels = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];  
  
  const SLIDER_WIDTH = 200;
  const STEP_WIDTH = SLIDER_WIDTH / (supportedZoomLevels.length - 1);  
  const zoomThumbTranslateX = useRef(new Animated.Value(0)).current;
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  
  const [recordingMode, setRecordingMode] = useState<RecordingMode>("video");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState("00:00");
  const [cameraReady, setCameraReady] = useState(false);
  const [recordedClips, setRecordedClips] = useState<VideoClip[]>([]);
  const [selectedClipIndex, setSelectedClipIndex] = useState<number | null>(null);
  const [musicTracks, setMusicTracks] = useState<any[]>([]);
  const [selectedMusicTrack, setSelectedMusicTrack] = useState<any | null>(null);
  const [loadingMusic, setLoadingMusic] = useState(false);
  const [filterList, setFilterList] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<any | null>(null);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);

  
  const [facing, setFacing] = useState<CameraFacing>("back");
  const [flashEnabled, setFlashEnabled] = useState<FlashMode>("off");
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [showHDPopup, setShowHDPopup] = useState(false);
  const [hdPopupPos, setHDPopupPos] = useState({ x: 0, y: 0 });
  const [selectedCameraFormat, setSelectedCameraFormat] = useState<CameraFormat>({
    resolution: "HD",
    frameRate: 30,
    color: "SDR",
  });

  const [selectedSpeed, setSelectedSpeed] = useState<SpeedOption>(1);
  const [maxRecordingDuration, setMaxRecordingDuration] = useState<TimerOption>(30);
  const [showSpeedPopup, setShowSpeedPopup] = useState(false);
  const [showTimerPopup, setShowTimerPopup] = useState(false);
  const [showMusicPopup, setShowMusicPopup] = useState(false);
  const [showMusicPickerModal, setShowMusicPickerModal] = useState(false);
  const [speedPopupPos, setSpeedPopupPos] = useState({ x: 0, y: 0 });
  const [timerPopupPos, setTimerPopupPos] = useState({ x: 0, y: 0 });
  const [musicPopupPos, setMusicPopupPos] = useState({ x: 0, y: 0 });
  const [filterPopupPos, setFilterPopupPos] = useState({ x: 0, y: 0 });
  const [showFilterLabel, setShowFilterLabel] = useState(false);
  const [filterLabelOpacity] = useState(new Animated.Value(0));
  const [showFilterGrid, setShowFilterGrid] = useState(false);

  const cameraRef = useRef<any>(null);
  const recordingRef = useRef<any>(null);
  const isStopping = useRef(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const toolbarOpacity = useRef(new Animated.Value(1)).current;
  const clipBarTranslateY = useRef(new Animated.Value(0)).current;
  const zoomMenuScale = useRef(new Animated.Value(0)).current;
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTime = useRef<number>(0);
  const speedButtonRef = useRef<View>(null);
  const timerButtonRef = useRef<View>(null);
  const hdButtonRef = useRef<View>(null);
  const musicButtonRef = useRef<View>(null);
  const filterButtonRef = useRef<View>(null);
  const cameraViewRef = useRef<View>(null);
  const filterLabelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  
  const handleCameraReady = () => {
    console.log("[CAMERA] ========== onCameraReady FIRED ==========");
    console.log("[CAMERA] Platform:", Platform.OS);
    console.log("[CAMERA] Camera is now ready for recording/photos");
    if (Platform.OS === 'android') {
      console.log("[CAMERA-ANDROID] Preview should now be initialized");
      console.log("[CAMERA-ANDROID] Ratio: 16:9");
    }
    setCameraReady(true);
  };

  const startRecording = async () => {
    console.log("[RECORDING] START REQUESTED");
    
    if (isRecording) {
      console.log("[RECORDING] Already recording, ignoring");
      return;
    }

    if (!microphonePermission?.granted) {
      try {
        const micPermission = await requestMicrophonePermission();
        if (!micPermission.granted) {
          Alert.alert(
            "Microphone Permission Required",
            "We need access to your microphone to record videos with audio.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          return;
        }
      } catch (error) {
        console.error("[PERMISSION] error:", error);
        return;
      }
    }

    if (!cameraRef.current) {
      console.log("[CAMERA] ref NOT ready");
      Alert.alert("Error", "Camera not ready. Please wait a moment and try again.");
      return;
    }
    
    console.log("[CAMERA] ref ready");
    
    if (!cameraReady) {
      console.log("[CAMERA] Camera not ready yet (onCameraReady not fired)");
      Alert.alert("Error", "Camera is warming up. Please try again.");
      return;
    }
    
    console.log("[CAMERA] Camera ready to record");

    setIsRecording(true);
    recordingStartTime.current = Date.now();

    Animated.timing(toolbarOpacity, {
      toValue: 0.3,
      duration: 200,
      useNativeDriver: true,
    }).start();

    Animated.spring(clipBarTranslateY, {
      toValue: -80,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    Animated.spring(zoomMenuScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    const maxDuration = maxRecordingDuration > 0 ? maxRecordingDuration : 60;
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: maxDuration * 1000,
      useNativeDriver: false,
    }).start();

    try {
      console.log("[RECORDING] INVOKING recordAsync");
      
      const recordingOptions: any = {
        mute: false, 
        maxDuration: (maxRecordingDuration || 60) * 1000,
        quality: _mapResolutionToQuality(selectedCameraFormat.resolution),
      };
      
      console.log("[RECORDING OPTIONS]", recordingOptions);
      
      const videoData = await cameraRef.current.recordAsync(recordingOptions);
      
      console.log("[RECORDING] RESOLVED with data:", videoData);

      if (!videoData?.uri) {
        console.log("[FILE] NO URI - recording produced no data");
        setIsRecording(false);
        recordingRef.current = null;
        Alert.alert("Error", "No video recorded");
        
        Animated.timing(toolbarOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
        Animated.spring(clipBarTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();
        Animated.spring(zoomMenuScale, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();
        progressAnim.setValue(0);
        return;
      }

      console.log("[FILE] URI:", videoData.uri);
      const newClip: VideoClip = {
        id: Date.now().toString(),
        uri: videoData.uri,
        duration: Math.floor((Date.now() - recordingStartTime.current) / 1000),
      };
      
      console.log("[CLIP] CREATED:", newClip);
      setRecordedClips((prev) => [...prev, newClip]);

      setIsRecording(false);
      recordingRef.current = null;

      Animated.timing(toolbarOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      Animated.spring(clipBarTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      Animated.spring(zoomMenuScale, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      progressAnim.setValue(0);

    } catch (error: any) {
      console.error("[RECORDING] START ERROR:", error?.message);
      setIsRecording(false);
      recordingRef.current = null;
      
      Animated.timing(toolbarOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      Animated.spring(clipBarTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
      Animated.spring(zoomMenuScale, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
      progressAnim.setValue(0);

      Alert.alert(
        "Recording Error",
        error?.message || "Failed to start recording."
      );
    }
  };
  const stopRecording = async () => {
    console.log("[STOP] REQUESTED");
    
    if (!isRecording) {
      console.log("[STOP] Not recording, ignoring");
      return;
    }

    try {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      if (cameraRef.current?.isRecording) {
        cameraRef.current.stopRecording();
      }
    } catch (error) {
      console.error("[STOP] ERROR:", error);
    }
  };
  const handleRecordPress = () => {
    console.log("🔥🔥🔥 ACTUAL VISIBLE CAMERA BUTTON PRESSED 🔥🔥🔥");
    if (isRecording) {
      stopRecording();
    } else {
      
      startRecording();
    }
  };

  
  const deleteClip = (clipId: string) => {
    Alert.alert("Discard this clip?", "Are you sure you want to delete this clip?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          setRecordedClips((prev) => prev.filter((clip) => clip.id !== clipId));
          if (selectedClipIndex !== null) {
            setSelectedClipIndex(null);
          }
        },
      },
    ]);
  };

  
  const toggleCamera = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  
  const toggleFlash = () => {
    setFlashEnabled((prev) => {
      if (prev === "off") return "on";
      if (prev === "on") return "auto";
      return "off";
    });
  };

  
  const handleZoomChange = (zoom: number) => {
    if (supportedZoomLevels.includes(zoom)) {
      setCurrentZoom(zoom);
      const index = supportedZoomLevels.indexOf(zoom);
      const newZoomRatio = (zoom - 0.5) / 3.5;
      console.log(`[ZOOM] Changed to ${zoom}x (index: ${index}, zoomRatio: ${newZoomRatio.toFixed(2)})`);

      Animated.spring(zoomThumbTranslateX, {
        toValue: index * STEP_WIDTH,
        tension: 150,
        friction: 12,
        useNativeDriver: true,
      }).start();
    }
  };

  
  const handleSpeedPress = () => {
    if (speedButtonRef.current) {
      speedButtonRef.current.measureInWindow((x, y, w, h) => {
        setSpeedPopupPos({
          x: x - 8, 
          y: y + h + 4, 
        });
        setShowSpeedPopup(true);
      });
    }
  };

  
  const handleTimerPress = () => {
    if (timerButtonRef.current) {
      timerButtonRef.current.measureInWindow((x, y, w, h) => {
        setTimerPopupPos({
          x: x - 8, 
          y: y + h + 4, 
        });
        setShowTimerPopup(true);
      });
    }
  };

  
  const pickFromGallery = async () => {
    try {
      console.warn("[GALLERY] Button pressed - attempting to open picker");
      
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
      });
      
      console.warn("[GALLERY] Picker result:", result);
      
      if (result.canceled) {
        console.warn("[GALLERY] User canceled");
        return;
      }
      
      const asset = result.assets?.[0];
      console.warn("[GALLERY] Selected asset:", asset);
      
      if (!asset) {
        console.error("[GALLERY] No asset");
        return;
      }
      
      const clip: VideoClip = {
        id: `gallery-${Date.now()}`,
        uri: asset.uri,
        duration: asset.duration || 3,
        thumbnail: asset.type === "video" ? asset.uri : undefined,
        speed: selectedSpeed,
        musicTrack: selectedMusicTrack,
        filter: selectedFilter,
        resolution: selectedCameraFormat.resolution,
        frameRate: selectedCameraFormat.frameRate,
      };
      
      setRecordedClips((prev) => [...prev, clip]);
      console.warn("[GALLERY] SUCCESS - clip added");
    } catch (err) {
      console.error("[GALLERY] CAUGHT ERROR:", err);
    }
  };

  
  const handleVideoEditorExport = (clips: any[]) => {
    setShowVideoEditor(false);
    
    const convertedClips: VideoClip[] = clips.map((clip, index) => ({
      id: clip.id || `video-editor-${Date.now()}-${index}`,
      uri: clip.uri || clip.path || "",
      duration: clip.duration || 0,
      thumbnail: clip.thumbnailUri || clip.thumbnail,
    }));
    
    setRecordedClips(convertedClips);
  };

  
  const handleVideoEditorCancel = () => {
    console.log("[Camera] VideoEditor cancel called, hiding VideoEditor");
    setShowVideoEditor(false);
  };

  
  const handleNext = () => {
    if (recordedClips.length === 0) {
      Alert.alert("No Clips", "Please record at least one clip before proceeding.");
      return;
    }
    
    
    const clipsWithMetadata = recordedClips.map(clip => ({
      ...clip,
      speed: selectedSpeed,
      musicTrack: selectedMusicTrack,
      filter: selectedFilter,
      resolution: selectedCameraFormat.resolution,
      frameRate: selectedCameraFormat.frameRate,
    }));
    
    console.log("[CAMERA] Passing clips with metadata:", {
      count: clipsWithMetadata.length,
      speed: selectedSpeed,
      music: selectedMusicTrack?.title || "None",
      filter: selectedFilter?.name || "None",
      resolution: selectedCameraFormat.resolution,
      frameRate: selectedCameraFormat.frameRate,
    });
    
    
    router.push({
      pathname: "/(main)/upload/edit",
      params: {
        clips: JSON.stringify(clipsWithMetadata),
        ...(competitionId && { competitionId }),
        ...(competitionName && { competitionName }),
        ...(entryFee && { entryFee }),
      },
    });
  };

  
  const showFilterLabelBriefly = () => {
    
    if (filterLabelTimeoutRef.current) {
      clearTimeout(filterLabelTimeoutRef.current);
    }
    
    setShowFilterLabel(true);
    Animated.sequence([
      Animated.timing(filterLabelOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(800),
      Animated.timing(filterLabelOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    filterLabelTimeoutRef.current = setTimeout(() => {
      setShowFilterLabel(false);
    }, 1300);
  };

  const handleFilterSwipe = (direction: "left" | "right") => {
    if (filterList.length === 0) return;

    const currentIndex = filterList.findIndex(f => f.id === selectedFilter?.id);
    let nextIndex;

    if (direction === "left") {
      
      nextIndex = (currentIndex + 1) % filterList.length;
    } else {
      
      nextIndex = (currentIndex - 1 + filterList.length) % filterList.length;
    }

    const nextFilter = filterList[nextIndex];
    setSelectedFilter(nextFilter);
    console.log(`[FILTER] Swiped ${direction}: selected ${nextFilter.name}`);
    showFilterLabelBriefly();
  };

  
  const cameraSwipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isRecording,
      onMoveShouldSetPanResponder: (evt, gestureState) => !isRecording && Math.abs(gestureState.dx) > 10,
      onPanResponderRelease: (evt, gestureState) => {
        if (isRecording || filterList.length === 0) return;

        const SWIPE_THRESHOLD = 50;
        if (gestureState.dx > SWIPE_THRESHOLD) {
          
          handleFilterSwipe("right");
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          
          handleFilterSwipe("left");
        }
      },
    })
  ).current;
  const zoomPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isRecording,  
      onMoveShouldSetPanResponder: () => !isRecording,   
      onPanResponderMove: (evt, gestureState) => {
        if (!isRecording) {  
          const sliderWidth = 200;
          const startX = width / 2 - sliderWidth / 2;
          const relativeX = Math.max(0, Math.min(sliderWidth, gestureState.moveX - startX));
          const zoomIndex = Math.round((relativeX / sliderWidth) * (supportedZoomLevels.length - 1));
          const zoom = supportedZoomLevels[zoomIndex] || 1;
          handleZoomChange(zoom);
          console.log(`[ZOOM] Slider: index ${zoomIndex} → ${zoom}x`);
        }
      },
    })
  ).current;

  
  
  
  const zoomRatio = Math.max(0, Math.min(1, (currentZoom - 0.5) / 3.5));
  
  
  if (Platform.OS === "android" || Platform.OS === "ios") {
    
  }

  
  useEffect(() => {
    if (showVideoEditor && !isVideoEditorLoaded) {
      (async () => {
        try {
          const module = await import('@modules/video-editor');
          VideoEditorModule = module.default;
          setIsVideoEditorLoaded(true);
        } catch (error) {
          console.error('[CameraScreen] Failed to load VideoEditorModule:', error);
          Alert.alert('Error', 'Failed to load video editor');
          setShowVideoEditor(false);
        }
      })();
    }
  }, [showVideoEditor, isVideoEditorLoaded]);

  
  useEffect(() => {
    const verifyRole = async () => {
      const role = await AsyncStorage.getItem("userRole");
      const isParticipant = role === "participant" || role === "participants";

      if (!isParticipant) {
        Alert.alert(
          "Participants only",
          "Switch your account role to participant to submit entries.",
          [{ text: "OK", onPress: () => router.replace("/(main)") }]
        );
      }
    };
    verifyRole();
  }, []);

  
  useEffect(() => {
    console.log("[COMPONENT] CameraScreen mounted");
    console.log("[COMPONENT] Platform:", Platform.OS);
    if (Platform.OS === 'android') {
      console.log("[CAMERA-ANDROID] Initializing Android camera preview with ratio prop");
    }
    
    return () => {
      console.log("[COMPONENT] CameraScreen unmounted");
      if (isRecording) {
        console.error("[COMPONENT] ⚠️ WARNING: CameraScreen unmounted while isRecording=true - this will cancel recording!");
      }
    };
  }, []);
  
  useEffect(() => {
    const loadMusicLibrary = async () => {
      console.log("[MUSIC] Loading music library...");
      setLoadingMusic(true);
      const response = await listAudio("trending", 1, 50);
      if (response.success && response.data?.tracks) {
        console.log(`[MUSIC] Loaded ${response.data.tracks.length} tracks`);
        setMusicTracks(response.data.tracks);
      } else {
        console.warn("[MUSIC] Failed to load music library");
        setMusicTracks([]);
      }
      setLoadingMusic(false);
    };
    loadMusicLibrary();
  }, []);
  
  useEffect(() => {
    const loadFilterLibrary = async () => {
      console.log("[FILTER] Loading filter library...");
      setLoadingFilters(true);
      const response = await listFilters(undefined, 1, 50);
      if (response.success && response.data?.filters) {
        console.log(`[FILTER] Loaded ${response.data.filters.length} filters`);
        setFilterList(response.data.filters);
      } else {
        console.warn("[FILTER] Failed to load filter library");
        setFilterList([]);
      }
      setLoadingFilters(false);
    };
    loadFilterLibrary();
  }, []);



  
  useEffect(() => {
    if (!cameraPermission?.granted) {
      console.log("[PERMISSIONS] Requesting camera permission");
      requestCameraPermission();
    }
  }, []);

  if (!cameraPermission) {
    console.log("[PERMISSIONS] Loading permissions...");
    return (
      <View style={styles.container}>
        <Text style={{ color: "#fff", alignSelf: "center", marginTop: 50 }}>Loading...</Text>
      </View>
    );
  }

  if (!cameraPermission.granted) {
    console.log("[PERMISSIONS] Camera permission not granted");
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>We need access to your camera to record videos.</Text>
          <TouchableOpacity onPress={requestCameraPermission} style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const bottomOffset = recordedClips.length > 0 ? 80 : 0;

  console.log("[CAMERA] Render - isFocused:", isFocused, "cameraReady:", cameraReady, "hasPermission:", cameraPermission?.granted);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <CameraView
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flashEnabled}
        ref={cameraRef}
        onCameraReady={handleCameraReady}
        mode="video"
        mute={false}
      />

      {}
      {isRecording && (
        <View style={styles.recordingIndicatorsContainer}>
          <View style={styles.recordingTimerContainer}>
            <View style={styles.recordingIndicatorDot} />
            <Text style={styles.recordingTimerText}>{recordingTime}</Text>
          </View>
        </View>
      )}

      {}
      <View style={styles.modeSelector}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modeScrollContent}
        >
          <TouchableOpacity
            style={[styles.modeButton, recordingMode === "video" && styles.modeButtonActive]}
            onPress={() => setRecordingMode("video")}
          >
            <Text style={[styles.modeText, recordingMode === "video" && styles.modeTextActive]}>
              Video
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, recordingMode === "photo" && styles.modeButtonActive]}
            onPress={() => setRecordingMode("photo")}
          >
            <Text style={[styles.modeText, recordingMode === "photo" && styles.modeTextActive]}>
              Photo
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {}
      <Animated.View style={[styles.leftToolbar, { opacity: toolbarOpacity }]}>
        <TouchableOpacity style={styles.toolbarButton} onPress={toggleFlash}>
          <FlashIcon filled={flashEnabled !== "off"} size={22} />
        </TouchableOpacity>

        <View ref={timerButtonRef}>
          <TouchableOpacity style={styles.toolbarButton} onPress={handleTimerPress}>
            <TimerIcon size={22} />
            <Text style={styles.toolbarLabel}>{maxRecordingDuration}s</Text>
          </TouchableOpacity>
        </View>

        <View ref={speedButtonRef}>
          <TouchableOpacity style={styles.toolbarButton} onPress={handleSpeedPress}>
            <SpeedIcon size={22} />
            <Text style={styles.toolbarLabel}>{selectedSpeed}x</Text>
          </TouchableOpacity>
        </View>

        <View ref={musicButtonRef}>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => {
              console.log("[CAMERA] Music button pressed - opening full screen picker");
              setShowMusicPickerModal(true);
            }}
          >
            <MusicIcon size={22} />
            {selectedMusicTrack && (
              <Text style={styles.toolbarLabel} numberOfLines={1}>
                ♪
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View ref={hdButtonRef}>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => {
              if (hdButtonRef.current) {
                hdButtonRef.current.measureInWindow((x, y, w, h) => {
                  setHDPopupPos({
                    x: x + w + 8,
                    y: y,
                  });
                  setShowHDPopup(true);
                });
              }
            }}
          >
            <Text style={styles.hdText}>
              {selectedCameraFormat.resolution} {selectedCameraFormat.frameRate}
            </Text>
          </TouchableOpacity>
        </View>

        <View ref={filterButtonRef}>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => {
              setShowFilterGrid(true);
            }}
          >
            <FilterIcon size={22} />
            {selectedFilter && (
              <Text style={styles.toolbarLabel} numberOfLines={1}>
                {selectedFilter.name.substring(0, 6)}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => {
          if (recordedClips.length > 0) {
            Alert.alert(
              "Discard Recording?",
              "You have recorded clips. Are you sure you want to go back?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Discard",
                  style: "destructive",
                  onPress: () => {
                    setRecordedClips([]);
                    router.back();
                  },
                },
              ]
            );
          } else {
            router.replace("/(main)");
          }
        }}
      >
        <CloseIcon size={22} />
      </TouchableOpacity>

      {}
      <TouchableOpacity
        style={[styles.galleryButton, { bottom: 100 + bottomOffset }]}
        onPress={() => {
          console.warn("[GALLERY] BUTTON PRESSED!!!");
          pickFromGallery();
        }}
        activeOpacity={0.7}
        disabled={false}
      >
        <View style={styles.galleryThumbnail}>
          <GalleryIcon size={18} />
        </View>
      </TouchableOpacity>

      {}
      <View style={[styles.recordButtonArea, { bottom: 100 + bottomOffset }]}>
        {}
        {!isRecording && (
          <View style={styles.zoomSelectorContainer} {...zoomPanResponder.panHandlers}>
            {}
            <View
              style={{
                flexDirection: "row",
                width: SLIDER_WIDTH,
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              {supportedZoomLevels.map((zoom) => (
                <Text
                  key={zoom}
                  style={[
                    {
                      color: "rgba(255,255,255,0.6)",
                      fontSize: 12,
                      fontWeight: "600",
                      width: 20,
                      textAlign: "center",
                    },
                    currentZoom === zoom && {
                      color: "#fff",
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {zoom}x
                </Text>
              ))}
            </View>

            {}
            <View
              style={{
                width: SLIDER_WIDTH,
                height: 2,
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                position: "relative",
                justifyContent: "center",
              }}
            >
              {supportedZoomLevels.map((_, index) => (
                <View
                  key={index}
                  style={{
                    position: "absolute",
                    left: index * STEP_WIDTH - 2,
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: "rgba(255,255,255,0.5)",
                  }}
                />
              ))}

              {}
              <Animated.View
                style={{
                  position: "absolute",
                  left: -10,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: "#EC9A15",
                  transform: [{ translateX: zoomThumbTranslateX }],
                }}
              />
            </View>
          </View>
        )}

        {}
        <TouchableOpacity
          style={styles.recordButtonContainer}
          onPress={handleRecordPress}
          activeOpacity={0.8}
        >
          {}
          {isRecording && (
            <View style={styles.progressRing}>
              <Svg width={100} height={100} style={styles.progressSvg}>
                <Circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth="4"
                  fill="none"
                />
              </Svg>
              <Animated.View
                style={[
                  styles.progressRingIndicator,
                  {
                    transform: [
                      {
                        rotate: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "360deg"],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.progressRingDot} />
              </Animated.View>
            </View>
          )}

          <View style={[styles.recordButton, isRecording && styles.recordButtonRecording]}>
            {isRecording ? (
              <View style={styles.recordButtonSquare} />
            ) : (
              <View style={styles.recordButtonCircle} />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {}
      <TouchableOpacity
        style={[styles.flipButton, { bottom: 100 + bottomOffset }]}
        onPress={toggleCamera}
      >
        <CameraFlipIcon size={22} />
      </TouchableOpacity>

      {}
      {recordedClips.length > 0 && (
        <Animated.View
          style={[
            styles.clipTimeline,
            {
              transform: [{ translateY: clipBarTranslateY }],
              bottom: 20 + bottomOffset,
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.clipTimelineContent}
          >
            {recordedClips.map((clip, index) => (
              <TouchableOpacity
                key={clip.id}
                style={[
                  styles.clipSegment,
                  selectedClipIndex === index && styles.clipSegmentSelected,
                ]}
                onPress={() => setSelectedClipIndex(index)}
              >
                {clip.uri ? (
                  <Image
                    source={{ uri: clip.uri }}
                    style={styles.clipSegmentImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.clipSegmentInner} />
                )}
                <TouchableOpacity
                  style={styles.deleteClipButton}
                  onPress={() => deleteClip(clip.id)}
                >
                  <CloseIcon size={10} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next {">"}</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      )}

      <View style={styles.overlay} pointerEvents="box-none">

      {}
      <Modal
        visible={showHDPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHDPopup(false)}
      >
        <TouchableOpacity
          style={styles.popupOverlay}
          activeOpacity={1}
          onPress={() => setShowHDPopup(false)}
        >
          <View
            style={[
              styles.hdPopup,
              {
                left: hdPopupPos.x,
                top: hdPopupPos.y,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.hdPopupArrow} />
            <View style={styles.hdPopupSection}>
              <Text style={styles.hdPopupLabel}>Resolution</Text>
              <View style={styles.hdPopupOptionsRow}>
                {supportedResolutions.map((res) => {
                  
                  return (
                    <TouchableOpacity
                      key={res}
                      style={[
                        styles.hdPopupOption,
                        selectedCameraFormat.resolution === res && styles.hdPopupOptionActive,
                      ]}
                      onPress={() => {
                        setSelectedCameraFormat((prev) => ({
                          ...prev,
                          resolution: res,
                        }));
                        setShowHDPopup(false);
                        console.log(`[RESOLUTION] Selected: ${res}`);
                      }}
                    >
                      <Text
                        style={[
                          styles.hdPopupOptionText,
                          selectedCameraFormat.resolution === res && styles.hdPopupOptionTextActive,
                        ]}
                      >
                        {res}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={styles.hdPopupSection}>
              <Text style={styles.hdPopupLabel}>Frame Rate</Text>
              <View style={styles.hdPopupOptionsRow}>
                {supportedFrameRates.map((fps) => {
                  
                  return (
                    <TouchableOpacity
                      key={fps}
                      style={[
                        styles.hdPopupOption,
                        selectedCameraFormat.frameRate === fps && styles.hdPopupOptionActive,
                      ]}
                      onPress={() => {
                        setSelectedCameraFormat((prev) => ({
                          ...prev,
                          frameRate: fps,
                        }));
                        setShowHDPopup(false);
                        console.log(`[FRAME_RATE] Selected: ${fps}fps`);
                      }}
                    >
                      <Text
                        style={[
                          styles.hdPopupOptionText,
                          selectedCameraFormat.frameRate === fps && styles.hdPopupOptionTextActive,
                        ]}
                      >
                        {fps}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {}
      {showSpeedPopup && (
        <Modal
          visible={showSpeedPopup}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSpeedPopup(false)}
        >
          <TouchableOpacity
            style={styles.popupOverlay}
            activeOpacity={1}
            onPress={() => setShowSpeedPopup(false)}
          >
            <View
              style={[
                styles.smallPopup,
                {
                  left: speedPopupPos.x,
                  top: speedPopupPos.y,
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.popupArrow} />
              <View style={styles.smallPopupContent}>
                {([0.3, 0.5, 1, 1.5, 2, 3] as any[]).map((speed, index, array) => {
                  const isSupported = [0.5, 1, 1.5, 2].includes(speed);
                  const isLast = index === array.length - 1;
                  return (
                    <TouchableOpacity
                      key={speed}
                      style={[
                        styles.smallPopupOption,
                        selectedSpeed === speed && styles.smallPopupOptionActive,
                        !isSupported && {
                          opacity: 0.5,
                        },
                        isLast && {
                          borderBottomWidth: 0,
                        },
                      ]}
                      onPress={() => {
                        if (isSupported) {
                          setSelectedSpeed(speed as SpeedOption);
                          setShowSpeedPopup(false);
                        }
                      }}
                      disabled={!isSupported}
                    >
                      <Text
                        style={[
                          styles.smallPopupOptionText,
                          selectedSpeed === speed && styles.smallPopupOptionTextActive,
                        ]}
                      >
                        {speed}x
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {}
      {showTimerPopup && (
        <Modal
          visible={showTimerPopup}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTimerPopup(false)}
        >
          <TouchableOpacity
            style={styles.popupOverlay}
            activeOpacity={1}
            onPress={() => setShowTimerPopup(false)}
          >
            <View
              style={[
                styles.smallPopup,
                {
                  left: timerPopupPos.x,
                  top: timerPopupPos.y,
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.popupArrow} />
              <View style={styles.smallPopupContent}>
                {([15, 30, 60] as TimerOption[]).map((duration, index) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.smallPopupOption,
                      maxRecordingDuration === duration && styles.smallPopupOptionActive,
                      index === 2 && {
                        borderBottomWidth: 0,
                      }, 
                    ]}
                    onPress={() => {
                      setMaxRecordingDuration(duration);
                      setShowTimerPopup(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.smallPopupOptionText,
                        maxRecordingDuration === duration && styles.smallPopupOptionTextActive,
                      ]}
                    >
                      {duration}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {}
      <MusicLibraryModal
        visible={showMusicPickerModal}
        onCancel={() => setShowMusicPickerModal(false)}
        onSelect={(music: any) => {
          setSelectedMusicTrack(music);
          console.log("[MUSIC] Selected from picker:", music.title);
        }}
        selectedMusic={selectedMusicTrack}
      />

      {}
      {showFilterGrid && (
        <Modal
          visible={showFilterGrid}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFilterGrid(false)}
        >
          <TouchableOpacity
            style={styles.fullOverlay}
            activeOpacity={1}
            onPress={() => setShowFilterGrid(false)}
          >
            <View
              style={styles.filterGridContainer}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.filterGridHeader}>
                <Text style={styles.filterGridTitle}>Filters</Text>
                <TouchableOpacity onPress={() => setShowFilterGrid(false)}>
                  <CloseIcon size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {loadingFilters ? (
                <View style={styles.filterGridLoading}>
                  <Text style={styles.filterGridLoadingText}>Loading filters...</Text>
                </View>
              ) : (
                <ScrollView
                  scrollEnabled
                  showsVerticalScrollIndicator={false}
                  style={styles.filterGridScroll}
                >
                  <View style={styles.filterGrid}>
                    {}
                    <TouchableOpacity
                      style={[
                        styles.filterGridTile,
                        !selectedFilter && styles.filterGridTileSelected,
                      ]}
                      onPress={() => {
                        setSelectedFilter(null);
                        console.log("[FILTER] Grid: None selected");
                        setShowFilterGrid(false);
                        showFilterLabelBriefly();
                      }}
                    >
                      <View
                        style={[
                          styles.filterGridThumbnail,
                          !selectedFilter && styles.filterGridThumbnailSelected,
                        ]}
                      >
                        <Text style={styles.filterGridThumbnailText}>◯</Text>
                      </View>
                      <Text style={styles.filterGridTileName} numberOfLines={2}>
                        None
                      </Text>
                    </TouchableOpacity>

                    {}
                    {filterList.map((filter) => (
                      <TouchableOpacity
                        key={filter.id}
                        style={[
                          styles.filterGridTile,
                          selectedFilter?.id === filter.id && styles.filterGridTileSelected,
                        ]}
                        onPress={() => {
                          setSelectedFilter(filter);
                          console.log("[FILTER] Grid: selected", filter.name);
                          setShowFilterGrid(false);
                          showFilterLabelBriefly();
                        }}
                      >
                        <View
                          style={[
                            styles.filterGridThumbnail,
                            selectedFilter?.id === filter.id && styles.filterGridThumbnailSelected,
                          ]}
                        >
                          <Text style={styles.filterGridThumbnailText}>
                            {filter.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.filterGridTileName} numberOfLines={2}>
                          {filter.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {}
      {showFilterPopup && (
        <Modal
          visible={showFilterPopup}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFilterPopup(false)}
        >
          <TouchableOpacity
            style={styles.popupOverlay}
            activeOpacity={1}
            onPress={() => setShowFilterPopup(false)}
          >
            <View
              style={[
                styles.smallPopup,
                {
                  left: filterPopupPos.x,
                  top: filterPopupPos.y,
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.popupArrow} />
              <View style={styles.smallPopupContent}>
                {loadingFilters ? (
                  <Text style={styles.smallPopupOptionText}>Loading filters...</Text>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.smallPopupOption,
                        !selectedFilter && {
                          backgroundColor: "#FF006E",
                        },
                      ]}
                      onPress={() => {
                        setSelectedFilter(null);
                        console.log("[FILTER] None selected");
                        setShowFilterPopup(false);
                      }}
                    >
                      <Text style={styles.smallPopupOptionText}>None</Text>
                    </TouchableOpacity>
                    {filterList.map((filter, index) => (
                      <TouchableOpacity
                        key={filter.id}
                        style={[
                          styles.smallPopupOption,
                          selectedFilter?.id === filter.id && {
                            backgroundColor: "#FF006E",
                          },
                          index === filterList.length - 1 && {
                            borderBottomWidth: 0,
                          },
                        ]}
                        onPress={() => {
                          setSelectedFilter(filter);
                          console.log("[FILTER] Selected:", filter.name);
                          setShowFilterPopup(false);
                        }}
                      >
                        <Text style={styles.smallPopupOptionText} numberOfLines={1}>
                          {filter.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
      </View>

      {}
      {showVideoEditor && isVideoEditorLoaded && VideoEditorModule && (
        <View style={StyleSheet.absoluteFill} pointerEvents="auto">
          <VideoEditorModule
            onExport={handleVideoEditorExport}
            onCancel={handleVideoEditorCancel}
            initialMode="gallery"
            competitionId={competitionId}
            competitionName={competitionName}
            entryFee={entryFee}
          />
        </View>
      )}

      {}
      {showFilterLabel && selectedFilter && (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: "50%",
              left: "50%",
              marginLeft: -60,
              marginTop: -20,
              opacity: filterLabelOpacity,
              zIndex: 100,
            },
          ]}
        >
          <View
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              borderRadius: 20,
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.3)",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
              {selectedFilter.name}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    pointerEvents: 'box-none',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    backgroundColor: "#000",
  },
  permissionTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  permissionText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: "#FF0080",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  recordingTimerContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 40,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 15,
    flexDirection: "row",
    gap: 12,
  },
  recordingIndicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF0000",
    opacity: 1,
    shadowColor: "#FF0000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  recordingTimerText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "monospace",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  recordingIndicatorsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    pointerEvents: "none",
    zIndex: 20,
  },
  modeSelector: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 40,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  modeScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  modeButton: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modeButtonActive: {
    backgroundColor: "rgba(255, 0, 128, 0.3)",
    borderColor: "#FF0080",
  },
  modeText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 15,
    fontWeight: "600",
  },
  modeTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  leftToolbar: {
    position: "absolute",
    left: 20,
    top: Platform.OS === "ios" ? 120 : 100,
    alignItems: "center",
    gap: 20,
    zIndex: 10,
  },
  toolbarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  toolbarLabel: {
    color: "#fff",
    fontSize: 9,
    marginTop: 2,
    fontWeight: "600",
  },
  hdText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  closeButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 40,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  galleryButton: {
    position: "absolute",
    left: 20,
    zIndex: 10,
  },
  galleryThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  recordButtonArea: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  zoomSelectorContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  zoomSelectorTrack: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 25,
    padding: 4,
    gap: 4,
    minWidth: 200,
  },
  zoomOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 45,
  },
  zoomOptionActive: {
    backgroundColor: "#fff",
  },
  zoomOptionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  zoomOptionTextActive: {
    color: "#000",
    fontWeight: "700",
  },
  recordButtonContainer: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  progressRing: {
    position: "absolute",
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  progressSvg: {
    position: "absolute",
  },
  progressRingIndicator: {
    position: "absolute",
    width: 100,
    height: 100,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  progressRingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginTop: 2,
  },
  recordButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonRecording: {
    borderColor: "#EC9A15",
    shadowColor: "#EC9A15",
  },
  recordButtonCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EC9A15",
  },
  recordButtonSquare: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#EC9A15",
  },
  flipButton: {
    position: "absolute",
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  clipTimeline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 60,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 8,
  },
  clipTimelineContent: {
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
  },
  clipSegment: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
    overflow: "hidden",
  },
  clipSegmentSelected: {
    borderColor: "#EC9A15",
  },
  clipSegmentInner: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  clipSegmentImage: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  deleteClipButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EC9A15",
    justifyContent: "center",
    alignItems: "center",
  },
  nextButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#EC9A15",
    marginLeft: 12,
    zIndex: 100,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  popupOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
  },
  hdPopup: {
    position: "absolute",
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    width: 180,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1001,
  },
  hdPopupArrow: {
    position: "absolute",
    left: -6,
    top: 20,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: "#2a2a2a",
  },
  hdPopupSection: {
    marginBottom: 12,
  },
  hdPopupLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  hdPopupOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  hdPopupOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  hdPopupOptionActive: {
    backgroundColor: "#EC9A15",
  },
  hdPopupOptionDisabled: {
    opacity: 0.3,
  },
  hdPopupOptionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  hdPopupOptionTextActive: {
    fontWeight: "700",
  },
  hdPopupOptionTextDisabled: {
    opacity: 0.5,
  },
  smallPopup: {
    position: "absolute",
    zIndex: 1001,
  },
  popupArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#2a2a2a",
    alignSelf: "flex-start",
    marginLeft: 20,
    marginTop: -1,
  },
  smallPopupContent: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 4,
    flexDirection: "column",
    minWidth: 80,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 8,
  },
  smallPopupOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    backgroundColor: "transparent",
    alignItems: "center",
    minWidth: 72,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  smallPopupOptionActive: {
    backgroundColor: "rgba(236, 154, 21, 0.2)",
  },
  smallPopupOptionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  smallPopupOptionTextActive: {
    fontWeight: "600",
    color: "#EC9A15",
  },
  fullOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "flex-end",
    zIndex: 1001,
  },
  filterGridContainer: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "85%",
    paddingTop: 16,
  },
  filterGridHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  filterGridTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  filterGridScroll: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  filterGridTile: {
    width: "23%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 2,
    borderColor: "transparent",
  },
  filterGridTileSelected: {
    borderColor: "#FF0080",
    backgroundColor: "rgba(255, 0, 128, 0.15)",
  },
  filterGridThumbnail: {
    width: "100%",
    height: "70%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 4,
  },
  filterGridThumbnailSelected: {
    backgroundColor: "rgba(255, 0, 128, 0.3)",
  },
  filterGridThumbnailText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  filterGridTileName: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    width: "100%",
  },
  filterGridLoading: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  filterGridLoadingText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});