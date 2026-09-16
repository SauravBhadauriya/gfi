import { useCallback, useState } from "react";
import { useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import type { PermissionStatus } from "../types/camera.types";

export interface UsePermissionsResult {
  hasPermission: boolean | null;
  cameraPermission: PermissionStatus | null;
  microphonePermission: PermissionStatus | null;
  isRequesting: boolean;
  requestPermissions: () => Promise<boolean>;
}

/**
 * Hook that manages camera & microphone permissions using official expo-camera React Hooks.
 */
export const usePermissions = (): UsePermissionsResult => {
  const [isRequesting, setIsRequesting] = useState(false);

  // Expo Camera ke standard hooks (Ekdum sahi names ke sath)
  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  // Statuses ko aapke local PermissionStatus type mein map karenge
  const cameraPermission = camPermission ? (camPermission.status as PermissionStatus) : null;
  const microphonePermission = micPermission ? (micPermission.status as PermissionStatus) : null;

  const hasPermission = cameraPermission === "granted" && microphonePermission === "granted";

  // Request trigger karne wala main function
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setIsRequesting(true);
      console.log('[usePermissions] Requesting camera and microphone permissions...');
      
      const camResult = await requestCamPermission();
      const micResult = await requestMicPermission();
      
      const granted = camResult.granted && micResult.granted;
      console.log('[usePermissions] Permission request result:', { 
        cameraGranted: camResult.granted, 
        micGranted: micResult.granted,
        totalGranted: granted 
      });
      
      setIsRequesting(false);
      return granted;
    } catch (error) {
      console.warn("[usePermissions] Failed to request camera/microphone permissions", error);
      setIsRequesting(false);
      return false;
    }
  }, [requestCamPermission, requestMicPermission]);

  return {
    // Jab tak permissions OS se load ho rahi hain, tab tak null return hoga
    hasPermission: camPermission && micPermission ? hasPermission : null,
    cameraPermission,
    microphonePermission,
    isRequesting,
    requestPermissions,
  };
};