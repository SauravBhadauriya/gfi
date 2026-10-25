import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { registerDeviceToken } from "@api/services/userService";

/**
 * The backend sends pushes through Firebase Admin, which needs the native
 * device token (FCM on Android, APNs on iOS), not an Expo push token.
 * Returns "" when permission is denied or the native config is missing.
 */
export async function getNativePushToken(): Promise<string> {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return "";
  try {
    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.granted;
    if (!granted && existing.canAskAgain) {
      granted = (await Notifications.requestPermissionsAsync()).granted;
    }
    if (!granted) return "";
    const token = await Notifications.getDevicePushTokenAsync();
    return typeof token.data === "string" ? token.data : "";
  } catch {
    return "";
  }
}

export const getDeviceType = (): "android" | "ios" | "" =>
  Platform.OS === "android" ? "android" : Platform.OS === "ios" ? "ios" : "";

/**
 * Saves the device token on the user profile (PUT /user/profile is the only
 * place the backend accepts it). Best-effort: never blocks the UI.
 */
export async function registerPushTokenWithBackend(): Promise<void> {
  const token = await getNativePushToken();
  const platform = getDeviceType();
  if (!token || !platform) return;
  try {
    await registerDeviceToken(token, platform);
  } catch {
    // Push is optional; the in-app notification list still works.
  }
}
