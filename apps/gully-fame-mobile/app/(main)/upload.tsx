import React, { useEffect, useState } from 'react';
import { View, Alert, Text } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Dynamically import to catch errors
let TikTokCameraScreen: any = null;

const CameraUploadScreen = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [roleVerified, setRoleVerified] = useState(false);
  const [cameraLoaded, setCameraLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const verifyRole = async () => {
      try {
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
          // Load camera component
          loadCamera();
        }
      } catch (error) {
        console.error("[Upload] Role verification error:", error);
        setLoadError("Failed to verify role");
      }
    };
    verifyRole();
  }, []);

  const loadCamera = async () => {
    try {
      // Dynamically import the camera to catch any import errors
      const cameraModule = await import('./camera/index');
      TikTokCameraScreen = cameraModule.default;
      setCameraLoaded(true);
      setShowCamera(true);
    } catch (error: any) {
      console.error("[Upload] Failed to load camera:", error);
      setLoadError(error?.message || "Failed to load camera");
      Alert.alert(
        "Camera Error",
        "Failed to load camera. Please restart the app.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    }
  };

  if (loadError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 16 }}>Error: {loadError}</Text>
      </View>
    );
  }

  if (!roleVerified || !cameraLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  if (showCamera && TikTokCameraScreen) {
    return (
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <TikTokCameraScreen />
      </View>
    );
  }

  return <View style={{ flex: 1, backgroundColor: '#000' }} />;
};

export default CameraUploadScreen;
