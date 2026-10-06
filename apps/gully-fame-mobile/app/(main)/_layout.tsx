import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerDeviceForNotifications, setupNotificationListeners } from '@/api/services/notificationIntegrationService';

export default function MainLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupNotifications = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');

        if (!token) {
          setIsReady(true);
          return;
        }

        try {
          await registerDeviceForNotifications();
          unsubscribe = setupNotificationListeners(
            (notification: any) => { console.log('Notification received:', notification); },
            (notification: any) => { console.log('Notification tapped:', notification); }
          );
        } catch (notifError) {
          console.warn('Notification setup failed:', notifError);
        }
      } catch (error) {
        console.error('Fatal error checking auth:', error);
      } finally {
        setIsReady(true);
      }
    };

    setupNotifications();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (!isReady) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#3C2610' },
      }}
    >
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="reels" options={{ headerShown: false }} />
      <Stack.Screen name="competitions" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ headerShown: false }} />
      <Stack.Screen name="inbox" options={{ headerShown: false }} />

      {/* Upload screen: transparent background with disabled animation */}
      <Stack.Screen
        name="upload"
        options={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'none',
        }}
      />

      {/* Camera screen: transparent background with disabled animation */}
      <Stack.Screen
        name="camera"
        options={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'none',
        }}
      />
    </Stack>
  );
}
