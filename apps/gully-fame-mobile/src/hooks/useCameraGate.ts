import { useCallback, useState } from "react";
import { InteractionManager } from "react-native";
import { useFocusEffect } from "expo-router";

/**
 * Screen focus + navigation transition khatam hone ke baad hi camera mount hone deta hai.
 * Isse Android Camera HAL transition ke beech deadlock / 0-size surface me nahi phasta.
 */
export function useCameraGate(delayMs = 200) {
  const [mountCamera, setMountCamera] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let timer: ReturnType<typeof setTimeout> | undefined;

      const task = InteractionManager.runAfterInteractions(() => {
        timer = setTimeout(() => setMountCamera(true), delayMs);
      });

      return () => {
        task.cancel();
        if (timer) clearTimeout(timer);
        setMountCamera(false);
      };
    }, [delayMs])
  );

  return { mountCamera };
}