import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { wp, hp } from "@/utils/responsive";

// Points directly to apps/gully-fame-mobile/assets/images/logo.png
const DEFAULT_LOGO = require("../../assets/images/logo.png");
const DEFAULT_BACKGROUND = "#3C2610";

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [hasStartedAnimation, setHasStartedAnimation] = useState(false);

  useEffect(() => {
    if (!hasStartedAnimation) {
      setHasStartedAnimation(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hasStartedAnimation, fadeAnim, scaleAnim]);

  useEffect(() => {
    let isMounted = true;

    const navigationTimer = setTimeout(async () => {
      try {
        if (!isMounted) return;

        const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
        const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");

        if (!isMounted) return;

        console.log("[SplashScreen] Navigation check - isLoggedIn:", isLoggedIn, "hasSeenOnboarding:", hasSeenOnboarding);

        if (isLoggedIn === "true") {
          console.log("[SplashScreen] Navigating to home");
          router.replace("/(main)/home");
        } else if (hasSeenOnboarding === "true") {
          console.log("[SplashScreen] Navigating to signin");
          router.replace("/auth/signin");
        } else {
          console.log("[SplashScreen] Navigating to onboarding1");
          router.replace("/auth/onboarding1");
        }
      } catch (error) {
        console.error("[SplashScreen] Navigation error:", error);
        if (isMounted) {
          console.log("[SplashScreen] Error - defaulting to onboarding1");
          router.replace("/auth/onboarding1");
        }
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearTimeout(navigationTimer);
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: DEFAULT_BACKGROUND }]}>
      <Animated.Image
        source={DEFAULT_LOGO}
        style={[
          styles.logo,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#3C2610",
  },
  logo: {
    width: wp(70),
    height: hp(40),
    maxWidth: 300,
    maxHeight: 300,
  },
});