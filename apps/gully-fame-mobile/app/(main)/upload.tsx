import React, { useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

let VideoEditorModule: any = null;

const CameraUploadScreen = () => {
  const params = useLocalSearchParams();
  const competitionId = params.competitionId ? String(params.competitionId) : null;
  const competitionName = params.competitionName ? String(params.competitionName) : null;
  const entryFee = params.entryFee ? String(params.entryFee) : null;
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [roleVerified, setRoleVerified] = useState(false);
  const [isVideoEditorLoaded, setIsVideoEditorLoaded] = useState(false);

  useEffect(() => {
    if (showVideoEditor && !isVideoEditorLoaded) {
      (async () => {
        try {
          console.log('[CameraUploadScreen] Loading VideoEditorModule...');
          const module = await import('@modules/video-editor');
          VideoEditorModule = module.default;
          console.log('[CameraUploadScreen] VideoEditorModule loaded successfully');
          setIsVideoEditorLoaded(true);
        } catch (error: any) {
          console.error('[CameraUploadScreen] Failed to load VideoEditorModule:', error);
          console.error('[CameraUploadScreen] Error details:', {
            message: error.message,
            stack: error.stack,
          });
          Alert.alert('Error', `Failed to load video editor: ${error.message}`);
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

  const handleVideoEditorExport = (clips: any[]) => {
    setShowVideoEditor(false);
    
    router.push({
      pathname: '/(main)/camera/upload',
      params: {
        clips: JSON.stringify(clips),
        ...(competitionId && { competitionId }),
        ...(competitionName && { competitionName: encodeURIComponent(competitionName) }),
        ...(entryFee && { entryFee: encodeURIComponent(entryFee) }),
      },
    });
  };

  const handleVideoEditorCancel = () => {
    setShowVideoEditor(false);
    router.back();
  };

  if (!roleVerified) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  if (showVideoEditor) {
    if (!isVideoEditorLoaded) {
      return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }} />;
    }
    return (
      <VideoEditorModule
        onExport={handleVideoEditorExport}
        onCancel={handleVideoEditorCancel}
        initialMode="camera"
        competitionId={competitionId}
        competitionName={competitionName}
        entryFee={entryFee}
      />
    );
  }

  return <View style={{ flex: 1, backgroundColor: '#000' }} />;
};

export default CameraUploadScreen;
