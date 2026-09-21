import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { setAuthToken, removeAuthToken } from "../api/axios";

type AuthContextType = {
  token: string | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // App launch: read token from SecureStore
    const initializeAuth = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("authToken");
        setToken(storedToken || null);
      } catch (error) {
        console.error("[AuthContext] Failed to read token from SecureStore:", error);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  const login = async (newToken: string) => {
    // Store token in SecureStore
    try {
      await setAuthToken(newToken);
      setToken(newToken);
    } catch (error) {
      console.error("[AuthContext] Failed to store token:", error);
      throw error;
    }
  };

  const logout = async () => {
    // Clear all auth data from SecureStore
    try {
      await removeAuthToken();
      await SecureStore.deleteItemAsync("refreshToken");
      await setAuthToken(""); // Also clear axios header
      setToken(null); // AuthGate trigger → /auth/signin redirect
    } catch (error) {
      console.error("[AuthContext] Failed to clear auth data:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
