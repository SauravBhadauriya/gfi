import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animationEnabled: true }}>
      {/* Splash Screen - Entry point for auth flow */}
      <Stack.Screen 
        name="splashscreen" 
        options={{ 
          animationEnabled: false,
          gestureEnabled: false 
        }} 
      />
      
      {/* Onboarding Screens */}
      <Stack.Screen name="onboarding1" options={{ animationEnabled: true }} />
      <Stack.Screen name="onboarding2" options={{ animationEnabled: true }} />
      <Stack.Screen name="onboarding3" options={{ animationEnabled: true }} />
      <Stack.Screen name="onboarding4" options={{ animationEnabled: true }} />
      
      {/* Authentication Screens */}
      <Stack.Screen name="signin" options={{ animationEnabled: true }} />
      <Stack.Screen name="createaccount" options={{ animationEnabled: true }} />
      <Stack.Screen name="login-via-otp" options={{ animationEnabled: true }} />
      <Stack.Screen name="login-via-email" options={{ animationEnabled: true }} />
      <Stack.Screen name="verify-otp" options={{ animationEnabled: true }} />
      <Stack.Screen name="resetpassword" options={{ animationEnabled: true }} />
      <Stack.Screen name="forgotpassword" options={{ animationEnabled: true }} />
      
      {/* Location Selection */}
      <Stack.Screen name="location/index" options={{ animationEnabled: true }} />
      
      {/* Legal */}
      <Stack.Screen name="termsandconditions" options={{ animationEnabled: true }} />
    </Stack>
  );
}