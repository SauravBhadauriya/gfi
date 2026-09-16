// PATH: apps/gully-fame-mobile/src/modules/video-editor/camera-module/components/VoiceoverStudioModal.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Animated,
  SafeAreaView,
  Alert,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

// expo-av requires native modules not available in Expo Go
// Import with graceful fallback
let Audio: any = null;
try {
  // Audio module removed - expo-av native module error
const audioModule = { Sound: { create: async () => ({ sound: null }) } };
  Audio = audioModule.Audio;
} catch (error) {
  console.warn('[VoiceoverStudioModal] expo-av not available - using mock mode');
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface VoiceoverStudioModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveVoiceover: (audioUri: string, duration: number) => void;
  totalDuration: number;
  currentTime: number;
}

const VoiceoverStudioModal: React.FC<VoiceoverStudioModalProps> = ({
  visible,
  onClose,
  onSaveVoiceover,
  totalDuration,
  currentTime,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  
  // Animation state for the pulse effect on Mic hold
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingRef = useRef<any>(null);

  useEffect(() => {
    if (isRecording) {
      // Continuous scaling pulsing effect when holding mic
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start recording duration timer
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      pulseAnim.setValue(1);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, pulseAnim]);

  const handlePressIn = async () => {
    if (!Audio) {
      Alert.alert(
        'Feature Unavailable',
        'Voiceover recording requires native modules. Please use EAS build or Expo dev client.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Request audio permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setRecordingError('Audio permission denied');
        Alert.alert('Permission Denied', 'Microphone permission is required to record voiceover');
        return;
      }

      // Prepare audio for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpiece: false,
      });

      // Create recording instance
      const recording = new Audio.Recording();
      recordingRef.current = recording;

      // Prepare and start recording
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await recording.startAsync();

      setIsRecording(true);
      setRecordingSeconds(0);
      setRecordingError(null);
      console.log("🎙️ Voiceover recording started...");
    } catch (error: any) {
      console.error('[VoiceoverStudioModal] Recording start error:', error);
      setRecordingError(error.message);
      Alert.alert('Recording Error', error.message);
      setIsRecording(false);
    }
  };

  const handlePressOut = async () => {
    if (!isRecording || !recordingRef.current) {
      return;
    }

    try {
      setIsRecording(false);
      
      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      
      // Get recording URI
      const uri = recordingRef.current.getURI();
      
      if (!uri) {
        throw new Error('Failed to get recording URI');
      }

      console.log(`🎙️ Voiceover stopped. Recorded duration: ${recordedSeconds}s, URI: ${uri}`);
      
      // Save voiceover (will be uploaded with video)
      onSaveVoiceover(uri, recordedSeconds);
      
      // Reset
      recordingRef.current = null;
    } catch (error: any) {
      console.error('[VoiceoverStudioModal] Recording stop error:', error);
      setRecordingError(error.message);
      Alert.alert('Recording Error', `Failed to save recording: ${error.message}`);
      recordingRef.current = null;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleDone = () => {
    if (recordedSeconds > 0) {
      onClose();
    } else {
      Alert.alert('No Recording', 'Please record some audio before proceeding');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          
          {/* Header Row */}
          <SafeAreaView style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Voiceover</Text>
            <TouchableOpacity onPress={handleDone} style={styles.headerBtn}>
              <Text style={[styles.headerBtnText, { color: recordedSeconds > 0 ? '#ec9a15' : '#666' }]}>Done</Text>
            </TouchableOpacity>
          </SafeAreaView>

          {/* Minimal tracking visual cue zone */}
          <View style={styles.infoZone}>
            <Text style={styles.timeText}>
              {isRecording ? formatTime(recordedSeconds) : formatTime(currentTime)} / {formatTime(totalDuration)}
            </Text>
            <Text style={styles.subHint}>
              {recordingError 
                ? recordingError 
                : (isRecording ? "Recording audio live..." : "Move playhead to where you want to start dubbing")}
            </Text>
            {recordedSeconds > 0 && !isRecording && (
              <Text style={styles.recordedLabel}>✓ {formatTime(recordedSeconds)} recorded</Text>
            )}
          </View>

          {/* Dynamic Floating Mic Interface Area */}
          <View style={styles.micInteractionArea}>
            <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }, isRecording && styles.pulseCircleActive]}>
              <TouchableOpacity
                style={[styles.mainMicButton, isRecording && styles.mainMicButtonActive]}
                activeOpacity={1}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              >
                <Svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"
                    fill={isRecording ? "#FFF" : "#ff4d4d"}
                  />
                  <Path
                    d="M19 10v1a7 7 0 01-14 0v-1M12 19v4M8 23h8"
                    stroke={isRecording ? "#FFF" : "#ff4d4d"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.holdLabel}>{isRecording ? "Release to stop" : "Tap & Hold to record voiceover"}</Text>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetContainer: {
    height: SCREEN_HEIGHT * 0.45,
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerBtn: {
    paddingVertical: 4,
  },
  headerBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoZone: {
    alignItems: 'center',
    marginTop: 20,
  },
  timeText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  subHint: {
    color: '#888',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  recordedLabel: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  micInteractionArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  pulseCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircleActive: {
    backgroundColor: 'rgba(255, 77, 77, 0.4)',
  },
  mainMicButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mainMicButtonActive: {
    backgroundColor: '#ff4d4d',
  },
  holdLabel: {
    color: '#AAA',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
  },
});

export default VoiceoverStudioModal;