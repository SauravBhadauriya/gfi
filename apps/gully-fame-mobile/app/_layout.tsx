import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BrandingProvider } from "@contexts/BrandingContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
    useFonts,
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_700Bold,
} from "@expo-google-fonts/rubik";
import {
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_800ExtraBold,
    PlayfairDisplay_900Black,
} from "@expo-google-fonts/playfair-display";
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
} from "@expo-google-fonts/inter";
import { UserRoleProvider } from "@/contexts/UserRoleContext";

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        Rubik_400Regular,
        Rubik_500Medium,
        Rubik_700Bold,
        PlayfairDisplay_400Regular,
        PlayfairDisplay_500Medium,
        PlayfairDisplay_600SemiBold,
        PlayfairDisplay_700Bold,
        PlayfairDisplay_800ExtraBold,
        PlayfairDisplay_900Black,
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
    });

    useEffect(() => {
        const prepareApp = async () => {
            if (fontsLoaded || fontError) {
                console.log("✅ Fonts ready, hiding splash screen...");
                
                // Hide Splash Screen immediately so UI is not blocked
                await SplashScreen.hideAsync().catch(() => {});

                // NOTE: Notification setup moved to (main)/_layout.tsx
                // This prevents calling notifications before user is authenticated
            }
        };

        prepareApp();
    }, [fontsLoaded, fontError]);

    // if (!fontsLoaded && !fontError) {
    //     console.log("⏳ Waiting for fonts...");
    //     return null;
    // }

    return (
        <ErrorBoundary
            onError={(error, errorInfo) => {
                console.error('[RootLayout] Uncaught error:', error);
                console.error('[RootLayout] Error info:', errorInfo);
            }}
        >
            <BrandingProvider>
                <UserRoleProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                        <Stack
                            screenOptions={{
                                headerShown: false,
                                contentStyle: { backgroundColor: "#3C2610" },
                                animation: "fade",
                            }}
                        >
                            <Stack.Screen name="index" options={{ headerShown: false }} />
                            <Stack.Screen name="auth" options={{ headerShown: false }} />
                            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                            <Stack.Screen name="(main)" options={{ headerShown: false }} />
                        </Stack>
                        <StatusBar style="light" backgroundColor="#3C2610" translucent={false} />
                    </GestureHandlerRootView>
                </UserRoleProvider>
            </BrandingProvider>
        </ErrorBoundary>
    );
}