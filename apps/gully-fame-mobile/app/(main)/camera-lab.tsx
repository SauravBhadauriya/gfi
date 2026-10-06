import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import { 
  Camera, 
  useVideoOutput,
  type CameraRef,
} from 'react-native-vision-camera';
import { useCameraDevices } from 'react-native-vision-camera/lib/hooks/useCameraDevices';
import type { CameraDevice } from 'react-native-vision-camera/lib/specs/inputs/CameraDevice.nitro';
import { useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera/lib/hooks/usePermission';
import { router } from 'expo-router';
import Constants from 'expo-constants';

const BUILD_TS = new Date().toISOString();

type TestResult = 'none' | 'ok' | 'black';

interface TestState {
  result: TestResult;
  logs: string[];
  photoUri?: string;
  photoSize?: { width: number; height: number };
  videoUri?: string;
  videoSize?: number;
  error?: string;
}

export default function CameraLabScreen() {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  
  // Test results
  const [t1, setT1] = useState<TestState>({ result: 'none', logs: [] });
  const [t2, setT2] = useState<TestState>({ result: 'none', logs: [] });
  const [t3, setT3] = useState<TestState>({ result: 'none', logs: [] });
  const [t4, setT4] = useState<TestState>({ result: 'none', logs: [] });
  const [t5, setT5] = useState<TestState>({ result: 'none', logs: [] });
  
  // Vision camera state
  const [selectedVCDevice, setSelectedVCDevice] = useState<CameraDevice | null>(null);
  const [vcImplMode, setVcImplMode] = useState<'compatible' | 'performance'>('compatible');
  
  // Permissions
  const [expoCameraPermission, requestExpoCameraPermission] = useCameraPermissions();
  const [expoMicPermission, requestExpoMicPermission] = useMicrophonePermissions();
  const visionCameraPermission = useCameraPermission();
  const visionMicPermission = useMicrophonePermission();
  const allVCDevices = useCameraDevices();
  const vcVideoOutput = useVideoOutput({ enableAudio: true });
  
  // Refs
  const expoCameraRef = useRef<any>(null);
  const visionCameraRef = useRef<CameraRef>(null);

  // Request all permissions on mount
  React.useEffect(() => {
    (async () => {
      if (!expoCameraPermission?.granted) await requestExpoCameraPermission();
      if (!expoMicPermission?.granted) await requestExpoMicPermission();
      if (!visionCameraPermission.hasPermission) await visionCameraPermission.requestPermission();
      if (!visionMicPermission.hasPermission) await visionMicPermission.requestPermission();
    })();
  }, []);

  const addLog = (testSetter: React.Dispatch<React.SetStateAction<TestState>>, msg: string) => {
    testSetter(prev => ({ ...prev, logs: [...prev.logs, msg] }));
  };

  const runT1 = () => {
    setActiveTest('t1');
    setT1({ result: 'none', logs: ['Starting T1: expo-camera back picture...'] });
  };

  const runT2 = () => {
    setActiveTest('t2');
    setT2({ result: 'none', logs: ['Starting T2: expo-camera front picture...'] });
  };

  const runT3 = () => {
    setActiveTest('t3');
    setT3({ result: 'none', logs: ['Starting T3: expo-camera back video...'] });
  };

  const runT4 = (device: CameraDevice) => {
    setActiveTest('t4');
    setSelectedVCDevice(device);
    setT4({ result: 'none', logs: [`Starting T4: vision-camera ${device.position} ${device.id.substring(0, 12)}...`] });
  };

  const runT5 = async () => {
    setActiveTest('t5');
    setT5({ result: 'none', logs: ['Starting T5: system camera picker...'] });
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        videoMaxDuration: 5,
        quality: 1,
      });
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;
        
        setT5(prev => ({
          ...prev,
          logs: [...prev.logs, `✅ Video captured`, `URI: ${asset.uri}`, `Duration: ${asset.duration}ms`, `Size: ${(size / 1024).toFixed(1)} KB`],
          videoUri: asset.uri,
          videoSize: size,
        }));
      } else {
        setT5(prev => ({ ...prev, logs: [...prev.logs, '❌ Cancelled'] }));
      }
    } catch (error: any) {
      setT5(prev => ({ ...prev, logs: [...prev.logs, `❌ Error: ${error.message}`], error: error.message }));
    }
  };

  const takePictureT1 = async () => {
    if (!expoCameraRef.current) return;
    try {
      const photo = await expoCameraRef.current.takePictureAsync({ quality: 1 });
      const fileInfo = await FileSystem.getInfoAsync(photo.uri);
      const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;
      
      setT1(prev => ({
        ...prev,
        logs: [...prev.logs, `✅ Photo: ${photo.width}x${photo.height}`, `Size: ${(size / 1024).toFixed(1)} KB`],
        photoUri: photo.uri,
        photoSize: { width: photo.width, height: photo.height },
      }));
    } catch (error: any) {
      addLog(setT1, `❌ Photo error: ${error.message}`);
    }
  };

  const takePictureT2 = async () => {
    if (!expoCameraRef.current) return;
    try {
      const photo = await expoCameraRef.current.takePictureAsync({ quality: 1 });
      const fileInfo = await FileSystem.getInfoAsync(photo.uri);
      const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;
      
      setT2(prev => ({
        ...prev,
        logs: [...prev.logs, `✅ Photo: ${photo.width}x${photo.height}`, `Size: ${(size / 1024).toFixed(1)} KB`],
        photoUri: photo.uri,
        photoSize: { width: photo.width, height: photo.height },
      }));
    } catch (error: any) {
      addLog(setT2, `❌ Photo error: ${error.message}`);
    }
  };

  const record3sT3 = async () => {
    if (!expoCameraRef.current) return;
    try {
      addLog(setT3, 'Recording 3s...');
      const video = await expoCameraRef.current.recordAsync({ maxDuration: 3, mute: false });
      const fileInfo = await FileSystem.getInfoAsync(video.uri);
      const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;
      
      setT3(prev => ({
        ...prev,
        logs: [...prev.logs, `✅ Video recorded`, `URI: ${video.uri.substring(video.uri.lastIndexOf('/') + 1)}`, `Size: ${(size / 1024).toFixed(1)} KB`],
        videoUri: video.uri,
        videoSize: size,
      }));
    } catch (error: any) {
      addLog(setT3, `❌ Video error: ${error.message}`);
    }
  };

  const copyReport = async () => {
    const report = `
CAMERA LAB REPORT
Generated: ${new Date().toISOString()}
Build: ${BUILD_TS}

DEVICE INFO
Model: ${Constants.deviceName || 'unknown'}
Android: ${Platform.Version}
Package: ${Constants.expoConfig?.android?.package || 'unknown'}

LIBRARY VERSIONS
expo-camera: ${Constants.expoConfig?.sdkVersion || 'unknown'}
react-native-vision-camera: 5.2.3
expo: ${Constants.expoConfig?.sdkVersion || 'unknown'}
react-native: 0.86.3

VISION CAMERA DEVICES (${allVCDevices.length})
${allVCDevices.map((d: CameraDevice, i: number) => `${i + 1}. ${d.position.toUpperCase()} | ID: ${d.id} | Type: ${d.type} | Virtual: ${d.isVirtualDevice}`).join('\n')}

TEST RESULTS

T1 (expo-camera back picture): ${t1.result.toUpperCase()}
${t1.logs.join('\n')}
${t1.photoSize ? `Photo: ${t1.photoSize.width}x${t1.photoSize.height}` : ''}
${t1.error ? `Error: ${t1.error}` : ''}

T2 (expo-camera front picture): ${t2.result.toUpperCase()}
${t2.logs.join('\n')}
${t2.photoSize ? `Photo: ${t2.photoSize.width}x${t2.photoSize.height}` : ''}
${t2.error ? `Error: ${t2.error}` : ''}

T3 (expo-camera back video): ${t3.result.toUpperCase()}
${t3.logs.join('\n')}
${t3.videoSize ? `Video size: ${(t3.videoSize / 1024).toFixed(1)} KB` : ''}
${t3.error ? `Error: ${t3.error}` : ''}

T4 (vision-camera devices): ${t4.result.toUpperCase()}
${t4.logs.join('\n')}
${t4.error ? `Error: ${t4.error}` : ''}

T5 (system camera picker): ${t5.result.toUpperCase()}
${t5.logs.join('\n')}
${t5.videoSize ? `Video size: ${(t5.videoSize / 1024).toFixed(1)} KB` : ''}
${t5.error ? `Error: ${t5.error}` : ''}
`;

    try {
      await Clipboard.setStringAsync(report);
      Alert.alert('Copied', 'Report copied to clipboard');
    } catch (error: any) {
      Alert.alert('Error', `Failed to copy: ${error.message}`);
    }
  };

  const renderTestCard = (
    title: string,
    testState: TestState,
    testSetter: React.Dispatch<React.SetStateAction<TestState>>,
    runButton: React.ReactNode,
    actionButtons?: React.ReactNode
  ) => (
    <View style={styles.testCard}>
      <Text style={styles.testTitle}>{title}</Text>
      <View style={styles.testActions}>
        {runButton}
        <View style={styles.resultButtons}>
          <TouchableOpacity
            style={[styles.resultBtn, styles.resultOk, testState.result === 'ok' && styles.resultActive]}
            onPress={() => testSetter(prev => ({ ...prev, result: 'ok' }))}
          >
            <Text style={styles.resultBtnText}>Preview OK</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resultBtn, styles.resultBlack, testState.result === 'black' && styles.resultActive]}
            onPress={() => testSetter(prev => ({ ...prev, result: 'black' }))}
          >
            <Text style={styles.resultBtnText}>Preview BLACK</Text>
          </TouchableOpacity>
        </View>
      </View>
      {actionButtons}
      <ScrollView style={styles.logBox}>
        {testState.logs.map((log, i) => (
          <Text key={i} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>
      {testState.photoUri && (
        <Image source={{ uri: testState.photoUri }} style={styles.previewImage} />
      )}
    </View>
  );

  const hasPermissions = expoCameraPermission?.granted && expoMicPermission?.granted && 
                        visionCameraPermission.hasPermission && visionMicPermission.hasPermission;

  if (!hasPermissions) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Requesting permissions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Camera Lab</Text>
        <TouchableOpacity onPress={copyReport} style={styles.copyBtn}>
          <Text style={styles.copyText}>Copy Report</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* T1 */}
        {renderTestCard(
          'T1: expo-camera BACK picture',
          t1,
          setT1,
          <TouchableOpacity style={styles.runBtn} onPress={runT1}>
            <Text style={styles.runBtnText}>Run T1</Text>
          </TouchableOpacity>,
          activeTest === 't1' && (
            <TouchableOpacity style={styles.actionBtn} onPress={takePictureT1}>
              <Text style={styles.actionBtnText}>Take Picture</Text>
            </TouchableOpacity>
          )
        )}

        {/* T2 */}
        {renderTestCard(
          'T2: expo-camera FRONT picture',
          t2,
          setT2,
          <TouchableOpacity style={styles.runBtn} onPress={runT2}>
            <Text style={styles.runBtnText}>Run T2</Text>
          </TouchableOpacity>,
          activeTest === 't2' && (
            <TouchableOpacity style={styles.actionBtn} onPress={takePictureT2}>
              <Text style={styles.actionBtnText}>Take Picture</Text>
            </TouchableOpacity>
          )
        )}

        {/* T3 */}
        {renderTestCard(
          'T3: expo-camera BACK video',
          t3,
          setT3,
          <TouchableOpacity style={styles.runBtn} onPress={runT3}>
            <Text style={styles.runBtnText}>Run T3</Text>
          </TouchableOpacity>,
          activeTest === 't3' && (
            <TouchableOpacity style={styles.actionBtn} onPress={record3sT3}>
              <Text style={styles.actionBtnText}>Record 3s</Text>
            </TouchableOpacity>
          )
        )}

        {/* T4 */}
        <View style={styles.testCard}>
          <Text style={styles.testTitle}>T4: vision-camera devices</Text>
          <Text style={styles.subtitle}>Select device ({allVCDevices.length} found):</Text>
          <ScrollView horizontal style={styles.deviceList}>
            {allVCDevices.map((device: CameraDevice, i: number) => (
              <TouchableOpacity
                key={device.id}
                style={[styles.deviceBtn, selectedVCDevice?.id === device.id && styles.deviceBtnActive]}
                onPress={() => runT4(device)}
              >
                <Text style={styles.deviceBtnText}>{i + 1}. {device.position}</Text>
                <Text style={styles.deviceBtnSub}>{device.type}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {activeTest === 't4' && (
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => {
                const newMode = vcImplMode === 'compatible' ? 'performance' : 'compatible';
                setVcImplMode(newMode);
                addLog(setT4, `Mode: ${vcImplMode} → ${newMode}`);
              }}
            >
              <Text style={styles.toggleBtnText}>Mode: {vcImplMode}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.resultButtons}>
            <TouchableOpacity
              style={[styles.resultBtn, styles.resultOk, t4.result === 'ok' && styles.resultActive]}
              onPress={() => setT4(prev => ({ ...prev, result: 'ok' }))}
            >
              <Text style={styles.resultBtnText}>Preview OK</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resultBtn, styles.resultBlack, t4.result === 'black' && styles.resultActive]}
              onPress={() => setT4(prev => ({ ...prev, result: 'black' }))}
            >
              <Text style={styles.resultBtnText}>Preview BLACK</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.logBox}>
            {t4.logs.map((log, i) => (
              <Text key={i} style={styles.logText}>{log}</Text>
            ))}
          </ScrollView>
        </View>

        {/* T5 */}
        {renderTestCard(
          'T5: System camera picker',
          t5,
          setT5,
          <TouchableOpacity style={styles.runBtn} onPress={runT5}>
            <Text style={styles.runBtnText}>Run T5 (Open System Camera)</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Active Camera Preview */}
      {activeTest === 't1' && (
        <View style={styles.previewContainer}>
          <CameraView
            ref={expoCameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            mode="picture"
            onCameraReady={() => addLog(setT1, '✅ onCameraReady')}
            onMountError={(error: any) => {
              addLog(setT1, `❌ onMountError: ${error.message}`);
              setT1(prev => ({ ...prev, error: error.message }));
            }}
          />
        </View>
      )}

      {activeTest === 't2' && (
        <View style={styles.previewContainer}>
          <CameraView
            ref={expoCameraRef}
            style={StyleSheet.absoluteFill}
            facing="front"
            mode="picture"
            onCameraReady={() => addLog(setT2, '✅ onCameraReady')}
            onMountError={(error: any) => {
              addLog(setT2, `❌ onMountError: ${error.message}`);
              setT2(prev => ({ ...prev, error: error.message }));
            }}
          />
        </View>
      )}

      {activeTest === 't3' && (
        <View style={styles.previewContainer}>
          <CameraView
            ref={expoCameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            mode="video"
            onCameraReady={() => addLog(setT3, '✅ onCameraReady')}
            onMountError={(error: any) => {
              addLog(setT3, `❌ onMountError: ${error.message}`);
              setT3(prev => ({ ...prev, error: error.message }));
            }}
          />
        </View>
      )}

      {activeTest === 't4' && selectedVCDevice && (
        <View style={styles.previewContainer}>
          <Camera
            ref={visionCameraRef}
            style={StyleSheet.absoluteFill}
            device={selectedVCDevice}
            isActive={true}
            outputs={[vcVideoOutput]}
            implementationMode={vcImplMode}
            onStarted={() => addLog(setT4, '✅ onStarted')}
            onPreviewStarted={() => addLog(setT4, '✅ onPreviewStarted')}
            onError={(error: Error) => {
              addLog(setT4, `❌ onError: ${error.message}`);
              setT4(prev => ({ ...prev, error: error.message }));
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: '#1a1a1a',
  },
  backBtn: { padding: 8 },
  backText: { color: '#EC9A15', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  copyBtn: { padding: 8 },
  copyText: { color: '#00CC00', fontSize: 14, fontWeight: '600' },
  scrollView: { flex: 1 },
  testCard: {
    backgroundColor: '#1a1a1a',
    margin: 10,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#EC9A15',
  },
  testTitle: { color: '#EC9A15', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#ccc', fontSize: 12, marginBottom: 6 },
  testActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  runBtn: { backgroundColor: '#EC9A15', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  runBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  resultButtons: { flexDirection: 'row', gap: 6 },
  resultBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, borderWidth: 2 },
  resultOk: { backgroundColor: '#004400', borderColor: '#00AA00' },
  resultBlack: { backgroundColor: '#440000', borderColor: '#AA0000' },
  resultActive: { borderWidth: 3 },
  resultBtnText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  actionBtn: { backgroundColor: '#0066CC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginTop: 8 },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  logBox: { maxHeight: 100, marginTop: 8, backgroundColor: '#000', padding: 8, borderRadius: 4 },
  logText: { color: '#0f0', fontSize: 9, fontFamily: 'monospace', marginVertical: 1 },
  previewImage: { width: '100%', height: 150, marginTop: 8, borderRadius: 4 },
  deviceList: { maxHeight: 80, marginBottom: 8 },
  deviceBtn: {
    backgroundColor: '#333',
    padding: 8,
    marginRight: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#555',
    minWidth: 80,
  },
  deviceBtnActive: { borderColor: '#EC9A15', backgroundColor: '#442200' },
  deviceBtnText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  deviceBtnSub: { color: '#aaa', fontSize: 8, marginTop: 2 },
  toggleBtn: { backgroundColor: '#555', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, marginTop: 8, alignSelf: 'flex-start' },
  toggleBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  previewContainer: {
    position: 'absolute',
    top: 80,
    right: 10,
    width: 120,
    height: 160,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#EC9A15',
  },
  errorText: { color: '#fff', fontSize: 14, textAlign: 'center' },
});
