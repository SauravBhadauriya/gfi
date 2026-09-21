//

// kiro code

import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useDispatch } from "react-redux";
import { setUser } from "../store/slices/userSlice";
// CHANGE THIS:
// import * as userApi from '../api/services/userService';

// TO THIS:
import { authService } from "../api/services/authService";

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const dispatch = useDispatch();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ userId?: string; password?: string }>({});

  // Form validation
  const validateForm = () => {
    const newErrors: { userId?: string; password?: string } = {};

    if (!userId.trim()) {
      newErrors.userId = "Email or mobile is required";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login
  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      console.log("[LoginScreen] Attempting login with:", { userId });

      // CHANGE THIS:
      // const response = await userApi.loginUser({...});

      // TO THIS:
      const response = await authService.login({
        userId: userId.trim(),
        viaPassword: true,
        password,
      });

      if (response.success && response.data?.token) {
        console.log("[LoginScreen] Login successful");

        // Save token and user data
        await login(response.data.token);
        
        // Store user data in Redux
        if (response.data?.user) {
          dispatch(setUser(response.data.user));
        }

        Alert.alert("Success", "Login successful!");
      } else {
        console.error("[LoginScreen] Login failed:", response.message);
        Alert.alert("Login Failed", response.message || "Invalid credentials");
      }
    } catch (error: any) {
      console.error("[LoginScreen] Login error:", error);

      const errorMessage = error.message || "Login failed. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!userId.trim()) {
      Alert.alert("Error", "Please enter your email or mobile number");
      return;
    }

    setIsLoading(true);
    try {
      // FROM:
      // const response = await userApi.forgotPassword(userId.trim());

      // TO:
      const response = await authService.forgotPassword(userId.trim());

      if (response.success) {
        Alert.alert("Success", "Password reset link sent to your email/SMS");
      } else {
        Alert.alert("Error", response.message || "Failed to send reset link");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Gully Fame</Text>
          <Text style={styles.subtitle}>Welcome Back!</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email/Mobile Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email or Mobile</Text>
            <TextInput
              style={[styles.input, errors.userId && styles.inputError]}
              placeholder="Enter email or mobile number"
              value={userId}
              onChangeText={(text) => {
                setUserId(text);
                if (errors.userId) {
                  setErrors({ ...errors, userId: undefined });
                }
              }}
              editable={!isLoading}
              placeholderTextColor="#999"
            />
            {errors.userId && <Text style={styles.errorText}>{errors.userId}</Text>}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Enter password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) {
                  setErrors({ ...errors, password: undefined });
                }
              }}
              secureTextEntry
              editable={!isLoading}
              placeholderTextColor="#999"
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            disabled={isLoading}
            style={styles.forgotPasswordLink}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* ✅ UPDATED BY KIRO - Fixed unescaped apostrophe */}
          {/* OLD CODE: Don't have (unescaped apostrophe) */}
          {/* NEW CODE: Don&rsquo;t have (properly escaped) */}
          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don&rsquo;t have an account? </Text>
            <TouchableOpacity onPress={() => navigation?.navigate("Register")} disabled={isLoading}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
  },
  inputError: {
    borderColor: "#ff4444",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    marginTop: 4,
  },
  forgotPasswordLink: {
    alignSelf: "flex-end",
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    color: "#666",
    fontSize: 14,
  },
  registerLink: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
