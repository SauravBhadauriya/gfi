import React, { useEffect, useState, Suspense, lazy } from 'react';
import { View, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  const handleVideoEditorExport = (clips: CameraClipArray) => {
    console.log('[CameraUploadScreen] Camera screen exported clips:', clips.length);
    setShowVideoEditor(false);
    
    // Navigate to video editor with recorded clips
    // The real editor (PreviewScreen from videoeditor module) will handle editing + export
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
    return <View style={{ flex: 1, backgroundColor: '#3C2610' }} />;
  }

  if (showVideoEditor) {
    return (
      <CameraScreen
        onBack={handleVideoEditorCancel}
        onNext={handleVideoEditorExport}
      />
    );
  }

  return <View style={{ flex: 1, backgroundColor: '#3C2610' }} />;
};

export default CameraUploadScreen;
