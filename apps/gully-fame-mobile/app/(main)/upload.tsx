import React, { useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import CameraScreen from '@modules/video-editor/camera-module/screens/CameraScreen';
import type { CameraClipArray } from '@modules/video-editor/camera-module/types/camera.types';

const CameraUploadScreen = () => {
  const params = useLocalSearchParams();
  const competitionId = params.competitionId ? String(params.competitionId) : null;
  const competitionName = params.competitionName ? String(params.competitionName) : null;
  const entryFee = params.entryFee ? String(params.entryFee) : null;
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [roleVerified, setRoleVerified] = useState(false);

  useEffect(() => {
    const verifyRole = async () => {
      const role = await AsyncStorage.getItem("userRole");
      const isParticipant = role === "participant" || role === "participants";

      if (!isParticipant) {
        Alert.alert(
          "Participants only",
          "Switch your account role to participant to submit entries. Fans can still follow and vote!",
          [{ text: "OK", onPress: () => router.replace("/(main)") }]
        );
      } else {
        setRoleVerified(true);
        setShowVideoEditor(true);
      }
    };
    verifyRole();
  }, []);

  const handleVideoEditorExport = async (clips: CameraClipArray) => {
    if (__DEV__) console.log(`[FLOW] CameraScreen.onNext called: ${clips.length} clips with metadata`);
    
    if (!clips.length || !clips[0]?.uri) {
      if (__DEV__) console.error('[FLOW] upload.tsx: No clips or uri, aborting navigation');
      Alert.alert('Error', 'No recording found. Please try again.');
      setShowVideoEditor(true);
      return;
    }

    // Validate first clip file exists
    if (__DEV__) console.log(`[FLOW] Validating clip uri: ${clips[0].uri.substring(0, 50)}...`);
    try {
      const fileInfo = await FileSystem.getInfoAsync(clips[0].uri);
      if (!fileInfo.exists) {
        if (__DEV__) console.error('[FLOW] upload.tsx: Clip file does not exist at uri');
        Alert.alert('Error', 'Recording file not found. Please try again.');
        setShowVideoEditor(true);
        return;
      }
      if (__DEV__) console.log(`[FLOW] Clip file validated: exists=true, size=${fileInfo.size} bytes`);
    } catch (err) {
      if (__DEV__) console.error('[FLOW] upload.tsx: File validation error:', err);
      Alert.alert('Error', 'Could not access recording. Please try again.');
      setShowVideoEditor(true);
      return;
    }

    setShowVideoEditor(false);

    if (__DEV__) console.log(`[FLOW] Navigating to /(main)/upload/editor with ${clips.length} clips stringified`);
    router.push({
      pathname: '/(main)/upload/editor',
      params: {
        clips: JSON.stringify(clips),
        ...(competitionId && { competitionId }),
        ...(competitionName && { competitionName: encodeURIComponent(competitionName) }),
        ...(entryFee && { entryFee: encodeURIComponent(entryFee) }),
      },
    });
  };

  const handleVideoEditorCancel = () => {
    console.log('[CameraUploadScreen] User cancelled video editor');
    setShowVideoEditor(false);
    router.back();
  };

  if (!roleVerified) {
    return <View style={{ flex: 1, backgroundColor: 'transparent' }} />;
  }

  if (showVideoEditor) {
    return (
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <CameraScreen onBack={handleVideoEditorCancel} onNext={handleVideoEditorExport} />
      </View>
    );
  }

  return <View style={{ flex: 1, backgroundColor: 'transparent' }} />;
};

export default CameraUploadScreen;
