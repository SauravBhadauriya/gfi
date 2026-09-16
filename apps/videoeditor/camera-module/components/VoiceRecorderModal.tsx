import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Animated,
} from "react-native";
// Audio imports removed - expo-av native module error
const Audio = { Sound: { create: async () => ({ sound: null }) } };
import Svg, { Path, Circle } from "react-native-svg";
import type { VoiceOverlay } from "../types/voiceOverlay.types";

interface VoiceRecorderModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (voiceOverlay: VoiceOverlay) => void;
  startTime?: number;
}

const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  visible,
  onClose,
  onSave,
  startTime = 0,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isRecording, pulseAnim]);

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission Required", "Microphone permission is required to record voice");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      Alert.alert("Error", "Failed to start recording");
      console.error(error);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      setIsRecording(false);
      setRecordingUri(uri || null);
      recordingRef.current = null;
    } catch (error) {
      Alert.alert("Error", "Failed to stop recording");
      console.error(error);
    }
  };

  const handleSave = () => {
    if (!recordingUri) {
      Alert.alert("Error", "No recording available");
      return;
    }

    const voiceOverlay: VoiceOverlay = {
      id: `voice-${Date.now()}`,
      uri: recordingUri,
      duration: recordingTime,
      startTime,
      volume: 1,
      isMuted: false,
    };

    onSave(voiceOverlay);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setRecordingTime(0);
    setRecordingUri(null);
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M18 6L6 18M6 6l12 12"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Voice Recording</Text>
          <View style={styles.closeButton} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Recording Indicator */}
          <View style={styles.recordingContainer}>
            <Animated.View
              style={[
                styles.recordingPulse,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <View style={styles.recordingDot} />
            </Animated.View>
            <Text style={styles.recordingStatus}>
              {isRecording ? "Recording..." : recordingUri ? "Recorded" : "Ready"}
            </Text>
          </View>

          {/* Timer */}
          <Text style={styles.timer}>{formatTime(recordingTime)}</Text>

          {/* Waveform Placeholder */}
          <View style={styles.waveformContainer}>
            {Array.from({ length: 20 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.waveformBar,
                  {
                    height: isRecording
                      ? Math.random() * 60 + 20
                      : recordingUri
                        ? Math.random() * 40 + 10
                        : 10,
                  },
                ]}
              />
            ))}
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {!isRecording && !recordingUri && (
              <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
                <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="10" fill="#ec9a15" />
                  <Circle cx="12" cy="12" r="6" fill="#ffffff" />
                </Svg>
                <Text style={styles.recordButtonText}>Start Recording</Text>
              </TouchableOpacity>
            )}

            {isRecording && (
              <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                  <Path d="M6 4h12v16H6z" fill="#ff4444" />
                </Svg>
                <Text style={styles.stopButtonText}>Stop Recording</Text>
              </TouchableOpacity>
            )}

            {recordingUri && !isRecording && (
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                  <Text style={styles.resetButtonText}>Re-record</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Tip: Record your voice and it will be added to the timeline at the current
              position.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  recordingContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  recordingPulse: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(236, 154, 21, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  recordingDot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ec9a15",
  },
  recordingStatus: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  timer: {
    color: "#ec9a15",
    fontSize: 48,
    fontWeight: "700",
    fontFamily: "monospace",
    marginBottom: 32,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 100,
    marginBottom: 32,
  },
  waveformBar: {
    width: 3,
    backgroundColor: "#ec9a15",
    borderRadius: 2,
  },
  controls: {
    width: "100%",
    marginBottom: 32,
  },
  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: "#ec9a15",
    borderRadius: 24,
  },
  recordButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: "#ff4444",
    borderRadius: 24,
  },
  stopButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
  },
  resetButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#ec9a15",
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "700",
  },
  infoBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(236, 154, 21, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.3)",
  },
  infoText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    lineHeight: 18,
  },
});

export default VoiceRecorderModal;
