/**
 * Main App Layout
 * Wraps all authenticated screens
 * Initializes notifications ONLY after user is authenticated and token is available
 */

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
        // CRITICAL: Verify user has token before setting up notifications
        const token = await AsyncStorage.getItem('authToken');
        
        if (!token) {
          console.warn('[MainLayout] No auth token found - skipping notification setup');
          setIsReady(true);
          return;
        }

        console.log('[MainLayout] Auth token found, initializing notifications...');

        try {
          // Register device for push notifications
          await registerDeviceForNotifications();

          // Setup notification listeners
          unsubscribe = setupNotificationListeners(
            (notification: any) => {
              console.log('[MainLayout] Notification received:', notification);
            },
            (notification: any) => {
              console.log('[MainLayout] Notification tapped:', notification);
            }
          );

          console.log('[MainLayout] Notifications initialized successfully');
        } catch (notifError) {
          console.warn('[MainLayout] Notification setup failed (non-fatal):', notifError);
        }
      } catch (error) {
        console.error('[MainLayout] Fatal error checking auth:', error);
      } finally {
        setIsReady(true);
      }
    };

    setupNotifications();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Don't render main layout until we've checked auth
  if (!isReady) {
    return null;
  }

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
      <Stack.Screen name="camera" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ headerShown: false }} />
      <Stack.Screen name="inbox" options={{ headerShown: false }} />
      <Stack.Screen name="upload" options={{ headerShown: false }} />
    </Stack>
  );
}
