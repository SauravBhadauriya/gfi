import { Alert, Linking } from "react-native";

// Shown when a permission was denied with "Don't ask again" (canAskAgain === false).
// The system dialog will not appear again, so the only way forward is the Settings app.
export function showPermissionSettingsAlert(feature: string) {
  Alert.alert(
    "Permission needed",
    `${feature} is turned off for Gully Fame. You can turn it on in Settings.`,
    [
      { text: "Not now", style: "cancel" },
      {
        text: "Open Settings",
        onPress: () => {
          Linking.openSettings().catch(() => {});
        },
      },
    ]
  );
}
