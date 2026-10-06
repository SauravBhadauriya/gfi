import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BrandingProvider } from "@contexts/BrandingContext";
import ErrorBoundary from "@/components/ErrorBoundary";
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
        SplashScreen.preventAutoHideAsync().catch(() => {});
    }, []);

    useEffect(() => {
        const prepareApp = async () => {
            if (fontsLoaded || fontError) {
                console.log("✅ Fonts ready, hiding splash screen...");
                await SplashScreen.hideAsync().catch(() => {});
            }
        };

        prepareApp();
    }, [fontsLoaded, fontError]);

    return (
        <ErrorBoundary
            onError={(error, errorInfo) => {
                console.error('[RootLayout] Uncaught error:', error);
                console.error('[RootLayout] Error info:', errorInfo);
            }}
        >
            <SafeAreaProvider style={{ flex: 1, backgroundColor: 'transparent' }}>
                <BrandingProvider>
                    <UserRoleProvider>
                        <GestureHandlerRootView style={{ flex: 1, backgroundColor: 'transparent' }}>
                            <Stack
                                screenOptions={{
                                    headerShown: false,
                                    /* 🚀 CRITICAL FIX: Changed from "#3C2610" to "transparent".
                                       Global solid background on Root Stack was forcing Android's
                                       SurfaceFlinger compositor to hide the underlying camera SurfaceView. */
                                    contentStyle: { backgroundColor: "transparent" },
                                    animation: "fade",
                                }}
                            >
                                <Stack.Screen name="index" options={{ headerShown: false }} />
                                <Stack.Screen
                                    name="camera-test"
                                    options={{
                                        headerShown: false,
                                        contentStyle: { backgroundColor: 'transparent' },
                                        animation: 'none',
                                    }}
                                />
                                <Stack.Screen name="auth" options={{ headerShown: false }} />
                                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                                <Stack.Screen 
                                    name="(main)" 
                                    options={{ 
                                        headerShown: false,
                                        contentStyle: { backgroundColor: 'transparent' },
                                        animation: 'none',
                                    }} 
                                />
                            </Stack>
                            <StatusBar style="light" />
                        </GestureHandlerRootView>
                    </UserRoleProvider>
                </BrandingProvider>
            </SafeAreaProvider>
        </ErrorBoundary>
    );
}
