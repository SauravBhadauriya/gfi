import { useState, useEffect } from "react";
import {
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  Dimensions,
  Platform,
  TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ThemedView } from "@components/themed-view";
import { ThemedText } from "@components/themed-text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GoogleIcon,
  InstagramIcon,
  AppleIcon,
  EyeIcon,
  EyeOffIcon,
} from "@/icons";
import { authService } from "@api/services/authService";
import { ActivityIndicator } from "react-native";
import { saveUserSession } from "@utils/userSession";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useUserRole } from "@/contexts/UserRoleContext";

const { width, height } = Dimensions.get("window");

export default function SignIn() {
  const params = useLocalSearchParams();
  const [emailOrMobile, setEmailOrMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { setRole } = useUserRole();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isInstagramLoading, setIsInstagramLoading] = useState(false);

  
  
  

  
  
  
  

  
  
  
  
  

  useEffect(() => {
    if (params.email) {
      setEmailOrMobile(params.email as string);
    }
    if (params.passwordUpdated === "true") {
      setSuccessMessage("Password updated successfully!");
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    }
  }, [params.email, params.passwordUpdated]);

  const handleSignIn = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    if (!emailOrMobile || !password) {
      setErrorMessage("Please fill all fields");
      return;
    }
    try {
      const accountCreatedVia = await AsyncStorage.getItem("accountCreatedVia");
      const storedEmail = await AsyncStorage.getItem("userEmail");
      if (
        accountCreatedVia === "google" &&
        storedEmail &&
        storedEmail.toLowerCase() === emailOrMobile.trim().toLowerCase()
      ) {
        setErrorMessage(
          "This account was created using Google. Please use Google Sign-In to log in.",
        );
        return;
      }
    } catch (error) {
      if (__DEV__) {
        console.log("Error checking account creation method:", error);
      }
    }
    setIsLoading(true);
    try {
      const isEmail = emailOrMobile.includes("@");
      const identifier = emailOrMobile.trim().toLowerCase();
      if (__DEV__) {
        console.log("\n🚀 ========== STARTING LOGIN ==========");
        console.log("Login Method: Email/Mobile + Password");
        console.log("Identifier:", identifier);
        console.log("Is Email:", isEmail);
        console.log("Is Mobile:", !isEmail);
        console.log("Note: All login methods map to the same user account");
        console.log("========================================\n");
      }
      const result = await authService.login({
        userId: identifier,
        viaPassword: true,
        password: password,
      });
      if (result.success) {
        if (__DEV__) {
          console.log("\n✅ ========== LOGIN SUCCESS ==========");
          console.log("Full Result:", JSON.stringify(result, null, 2));
          console.log("Result Data:", JSON.stringify(result.data, null, 2));
          console.log("Result Data Type:", typeof result.data);
          console.log("Has User:", !!result.data?.user);
          console.log(
            "User Object:",
            JSON.stringify(result.data?.user, null, 2),
          );
          console.log(
            "Token:",
            result.data?.token ? "Received" : "Not received",
          );
          console.log("=====================================\n");
        }
        setSuccessMessage("Login successful!");
        if (!result.data?.token) {
          setErrorMessage("Login failed: No token received from server.");
          return;
        }
        let userData = result.data?.user;
        if (!userData && result.data && typeof result.data === "object") {
          if (__DEV__) {
            console.log(
              "⚠️ User data not in result.data.user, checking alternative locations...",
            );
          }
          if ((result.data as any).email || (result.data as any).firstName) {
            userData = result.data as any;
            if (__DEV__) {
              console.log("✅ Found user data directly in result.data");
            }
          }
        }
        await saveUserSession(
          result.data.token,
          userData || undefined,
          isEmail ? identifier : undefined,
          !isEmail ? identifier : undefined,
        );
        await AsyncStorage.setItem("accountCreatedVia", "normal");
        if (result.data.role === "participants" || result.data.role === "fan") {
          setRole(result.data.role);
        }
        router.replace("location");
      } else {
        
        const isNetworkError = (result as any).isNetworkError;
        let errorMsg =
          result.data?.message ||
          result.error ||
          "Login failed. Please try again.";
        if (isNetworkError) {
          errorMsg =
            result.error ||
            "Network error: Unable to connect to server. Please check your internet connection and try again.";
        }
        setErrorMessage(errorMsg);
        if (__DEV__) {
          console.error("\n❌ ========== LOGIN FAILED ==========");
          console.error("Error:", errorMsg);
          console.error("Status:", result.status);
          console.error("Is Network Error:", isNetworkError);
          console.error("====================================\n");
        }
      }
    } catch (error: any) {
      let errorMsg = "Something went wrong. Please try again.";
      
      if (error.message && error.message.toLowerCase().includes("network")) {
        errorMsg =
          "Network error: Please check your internet connection and try again.";
      } else if (
        error.message &&
        (error.message.toLowerCase().includes("timeout") ||
          error.message.toLowerCase().includes("econnrefused"))
      ) {
        errorMsg =
          "Cannot connect to server. Please check your internet connection or try again later.";
      } else if (
        error.message &&
        error.message.toLowerCase().includes("failed to fetch")
      ) {
        errorMsg =
          "Failed to connect to server. Please check your internet connection.";
      } else if (error.originalError && error.originalError.message) {
        errorMsg = error.originalError.message;
      } else if (error.message) {
        errorMsg = error.message;
      } else if (error.error) {
        errorMsg = error.error;
      }
      setErrorMessage(errorMsg);
      if (__DEV__) {
        console.error("\n❌ ========== LOGIN EXCEPTION ==========");
        console.error("Exception:", error);
        console.error("Error Message:", error.message);
        console.error("Error Status:", error.status);
        console.error("Error Data:", error.data);
        console.error("Original Error:", error.originalError);
        console.error("========================================\n");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceToken = async (): Promise<string> => {
    try {
      if (Platform.OS === "web") {
        return "web-device-token";
      }

      const token = await AsyncStorage.getItem("deviceToken");
      if (token) {
        return token;
      }

      const generatedToken = `device-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem("deviceToken", generatedToken);
      return generatedToken;
    } catch (error) {
      console.error("Error getting device token:", error);
      return `fallback-token-${Date.now()}`;
    }
  };

  const getDeviceType = (): "android" | "ios" | "web" | "" => {
    if (Platform.OS === "android") return "android";
    if (Platform.OS === "ios") return "ios";
    if (Platform.OS === "web") return "web";
    return "";
  };

  





  
  
  
  
  
  

  
  
  
  
  
  

  
  
  
  
  
  
  

  
  
  
  
  
  
  

  
  
  
  
  
  
  
  
  

  
  
  
  
  
  
  
  
  
  

  const handleAppleLogin = async () => {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {}
        <View style={styles.logoContainer}>
          <Image
            source={require("@assets/images/gfi.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {}
        <View style={styles.formContainer}>
          <Text
            style={[
              styles.title,
              { fontFamily: "PlayfairDisplay_800ExtraBold" },
            ]}
          >
            Welcome back!{"\n"}Sign in to continue
          </Text>

          {}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Email/Mobile <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email or mobile number"
              placeholderTextColor="#B0B0B0"
              value={emailOrMobile}
              onChangeText={setEmailOrMobile}
              autoCapitalize="none"
            />
          </View>

          {}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Password <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#B0B0B0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              {password.length > 0 && (
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOffIcon size={20} color="#9CA3AF" />
                  ) : (
                    <EyeIcon size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.forgotContainer}>
            <TouchableOpacity
              onPress={() => router.push("/auth/forgotpassword")}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {}
          <View style={styles.orContainer}>
            <Text style={styles.orText}>Or</Text>
          </View>

          {}
          <TouchableOpacity
            style={styles.otpLoginButton}
            onPress={() => router.push("/auth/login-via-otp")}
            activeOpacity={0.7}
          >
            <Text style={styles.otpLoginText}>
              Login via <Text style={styles.otpUnderlinedText}>OTP</Text>
            </Text>
          </TouchableOpacity>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          {}
          <TouchableOpacity
            style={[
              styles.signInButton,
              isLoading && styles.signInButtonDisabled,
            ]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signInText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {}
          <View style={styles.continueWithContainer}>
            <View style={styles.separatorLine} />
            <Text style={styles.continueWithText}>OR Continue With</Text>
            <View style={styles.separatorLine} />
          </View>

          {}
          <View style={styles.socialIconsContainer}>
            {




























}
            {Platform.OS === "ios" && (
              <TouchableOpacity
                style={[
                  styles.socialIconButton,
                  isSocialLoading && styles.socialIconButtonDisabled,
                ]}
                activeOpacity={0.7}
                onPress={handleAppleLogin}
                disabled={isSocialLoading}
              >
                {isSocialLoading ? (
                  <ActivityIndicator color="#666" size="small" />
                ) : (
                  <AppleIcon size={40} />
                )}
              </TouchableOpacity>
            )}
          </View>

          {}
          <View style={styles.createAccountContainer}>
            <Text style={styles.createAccountText}>
              Don&apos;t have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/auth/createaccount")}
              activeOpacity={0.7}
            >
              <Text style={styles.createAccountLink}>Create One</Text>
            </TouchableOpacity>
          </View>
        </View>

        {}
        <View style={styles.skipContainer}>
          <TouchableOpacity
            onPress={() => router.replace("location?skip=true")}
          >
            <Text style={styles.skipText}>
              Let me have a look!{" "}
              <Text style={styles.skipLink}>SKIP{">>"}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3C2610",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 30,
    backgroundColor: "#3C2610",
    top: 40,
  },
  logo: {
    width: width * 0.3,
    height: height * 0.075,
  },
  formContainer: {
    backgroundColor: "#F6F9FD",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: height * 0.12,
    top: height * 0.05,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
  },
  title: {
    fontSize: 25,
    color: "#1F2937",
    marginBottom: 25,
    fontFamily: "PlayfairDisplay_800ExtraBold",
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: "#111827",
    marginBottom: 6,
    fontFamily: "Inter_600SemiBold",
  },
  required: {
    color: "#DC2626",
  },
  passwordContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#D4DAE9",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 8,
    paddingRight: 45,
    fontSize: 14,
    color: "#111827",
    fontFamily: "Inter_400Regular",
    height: 50,
    flex: 1,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    padding: 4,
  },
  forgotContainer: {
    alignItems: "flex-end",
    marginBottom: 4,
  },
  forgotText: {
    fontSize: 13,
    color: "#EC9A15",
    fontFamily: "Inter_600SemiBold",
    textDecorationLine: "underline",
  },
  signInButton: {
    backgroundColor: "#3C2610",
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 4,
  },
  signInText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  createAccountContainer: {
    alignItems: "center",
    marginBottom: -14,
    flexDirection: "row",
    justifyContent: "center",
  },
  createAccountText: {
    fontSize: 14,
    color: "#000",
    fontFamily: "Inter_400Regular",
  },
  createAccountLink: {
    color: "#EC9A15",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    textDecorationLine: "underline",
  },
  skipContainer: {
    backgroundColor: "#FFFFFF", 
    alignItems: "center",
    paddingVertical: 15,
  },
  skipText: {
    fontSize: width * 0.038,
    color: "#666",
    fontFamily: "Inter_400Regular",
  },
  skipLink: {
    color: "#EC9A15",
    fontFamily: "Inter_600SemiBold",
  },
  orContainer: {
    alignItems: "center",
    marginBottom: 0,
  },
  orText: {
    fontSize: 14,
    color: "#000",
    fontFamily: "Inter_400Regular",
  },
  otpLoginButton: {
    borderWidth: 0,
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 6,
    backgroundColor: "transparent",
  },
  otpLoginText: {
    color: "#000",
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  otpUnderlinedText: {
    color: "#EC9A15",
    textDecorationLine: "underline",
    fontFamily: "Inter_400Regular",
  },
  continueWithContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#D1D5DB",
  },
  continueWithText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: "#000",
    fontFamily: "Inter_400Regular",
  },
  socialIconsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    marginBottom: 20,
  },
  socialIconButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  socialIconButtonDisabled: {
    opacity: 0.6,
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    borderColor: "#DC2626",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  successContainer: {
    backgroundColor: "#D1FAE5",
    borderColor: "#10B981",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  successText: {
    color: "#10B981",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
});
