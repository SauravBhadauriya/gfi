import { useCallback } from "react";
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
      const camResult = await requestCamPermission();
      const micResult = await requestMicPermission();
      return camResult.granted && micResult.granted;
    } catch (error) {
      console.warn("Failed to request camera/microphone permissions", error);
      return false;
    }
  }, [requestCamPermission, requestMicPermission]); // Dependencies ekdum cross-checked hain

  return {
    // Jab tak permissions OS se load ho rahi hain, tab tak null return hoga
    hasPermission: camPermission && micPermission ? hasPermission : null,
    cameraPermission,
    microphonePermission,
    isRequesting: false,
    requestPermissions,
  };
};
