import React from 'react';
import { ActivityIndicator, Button, Dimensions, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function CameraTestScreen() {
  const { width, height } = Dimensions.get('screen');
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return (
      <View style={styles.permissionScreen}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Button title="Allow camera" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container} collapsable={false}>
      <CameraView
        style={{ position: 'absolute', top: 0, left: 0, width, height }}
        facing="back"
        onCameraReady={() => console.log('[CameraTest] onCameraReady')}
        onMountError={event => console.error('[CameraTest] onMountError:', event.message)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
