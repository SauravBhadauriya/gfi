import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text } from 'react-native';

export default function Index() {
  useEffect(() => {
    console.log("[Index] App starting - navigating to splash screen");
    
    const timer = setTimeout(() => {
      // Navigate to splash screen which handles auth state checking
      router.replace('/auth/splashscreen'); 
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#3C2610' }}>
      <Text style={{ color: '#fff', fontSize: 16 }}>Loading...</Text>
    </View>
  );
}