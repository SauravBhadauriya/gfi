import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { getTokenMetadata } from "./tokenUtils";

// Retrieve base URL from environment or default to production
let rawBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "https://gullyfame.com/v1/api";

// Ensure BASE_URL does not end with a trailing slash to prevent double-slash issues (e.g. api//endpoint)
export let BASE_URL = rawBaseUrl.replace(/\/+$/, "");

if (__DEV__) {
  console.log(
    "[axios] API Base URL configured:",
    process.env.EXPO_PUBLIC_API_BASE_URL ? BASE_URL : `${BASE_URL} (default)`
  );
  if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
    console.warn(
      "[axios] ⚠️  Using production deployment as base URL. To change, set EXPO_PUBLIC_API_BASE_URL in .env"
    );
  }
}

const TOKEN_STORAGE_KEY = "authToken";

const isUsableToken = (token: string | null | undefined): token is string => {
  const normalized = token?.trim();
  return !!normalized && !["none", "null", "undefined"].includes(normalized.toLowerCase());
};

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "GullyFame-Mobile/1.0",
    "X-Requested-With": "XMLHttpRequest",
  },
});

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Ensure url starts with a single leading slash if provided
      if (config.url && !config.url.startsWith("http") && !config.url.startsWith("/")) {
        config.url = `/${config.url}`;
      }

      if (!config.skipAuth) {
        const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
        const tokenMeta = getTokenMetadata(token);
        
        if (__DEV__) {
          console.log("[axios] 🔐 TOKEN STATE BEFORE REQUEST:", {
            isUsable: isUsableToken(token),
            isExpired: tokenMeta.isExpired,
            expiresIn: tokenMeta.expiresIn ? `${Math.round(tokenMeta.expiresIn / 1000)}s` : "unknown",
            tokenPreview: tokenMeta.tokenPreview,
          });
        }

        if (isUsableToken(token)) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token.trim()}`;
        } else {
          if (config.headers) {
            delete config.headers.Authorization;
          }
          if (token) {
            await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
          }
          if (__DEV__) {
            console.warn("[axios] ⚠️ No usable token found in SecureStore; request will be sent without auth");
          }
        }
      }

      if (__DEV__) {
        console.log("[axios] 📤 REQUEST:", {
          method: config.method?.toUpperCase(),
          url: config.url,
          skipAuth: config.skipAuth || false,
          hasAuth: !!config.headers?.Authorization,
        });
      }
      
      return config;
    } catch (error) {
      console.warn("[axios] ⚠️ Failed to retrieve token:", error);
      return config;
    }
  },
  (error: AxiosError) => {
    console.error("[axios] ❌ Request error:", error.message);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (__DEV__) {
      console.log("[axios] Response Success:", {
        status: response.status,
        url: response.config.url,
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    // Diagnose and log network errors
    if (!error.response) {
      const errorCode = (error as any)?.code || "UNKNOWN";
      const errorMessage = error.message || "Unknown error";
      
      console.error("[axios] ❌ NETWORK ERROR - Host unreachable or no response:", {
        code: errorCode,
        message: errorMessage,
        baseURL: BASE_URL,
        url: originalRequest?.url,
        method: originalRequest?.method?.toUpperCase(),
        timeout: apiClient.defaults.timeout,
      });

      // Provide diagnostic information
      if (errorCode === "ENOTFOUND" || errorCode === "ERR_INVALID_URL") {
        console.error("[axios] 🔍 DIAGNOSIS: DNS resolution failed. Check if backend URL is correct.");
      } else if (errorCode === "EHOSTUNREACH" || errorCode === "ENETUNREACH") {
        console.error("[axios] 🔍 DIAGNOSIS: Network unreachable. Check if device/emulator has internet connectivity.");
      } else if (errorCode === "ECONNREFUSED") {
        console.error("[axios] 🔍 DIAGNOSIS: Connection refused. Backend server may be down or not accepting connections.");
      } else if (errorCode === "ETIMEDOUT") {
        console.error("[axios] 🔍 DIAGNOSIS: Request timeout. Server is not responding within 60 seconds.");
      }
    }

    // Handle 502 / 503 / HTML Server Proxy Rejections
    if (error.response?.status === 502 || error.response?.status === 503) {
      console.warn(`[axios] Server error (${error.response.status} Bad Gateway/Service Unavailable)`);
      return Promise.reject({
        message: "Server is currently updating or undergoing maintenance. Please try again shortly.",
        status: error.response.status,
        data: null,
        originalError: error,
        isNetworkError: true,
      });
    }

    // Automatic retry logic for brief network drops (max 2 retries)
    if (!error.response && !originalRequest._retry) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      if (originalRequest._retryCount < 2) {
        originalRequest._retry = true;
        if (__DEV__) {
          console.log(
            `[axios] 🔄 Retrying request (attempt ${originalRequest._retryCount}/2):`,
            originalRequest.url
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
        return apiClient(originalRequest);
      }
    }

    const errorData = error.response?.data as any;

    // Special handling for 404 + "invalid token" (backend returns this instead of 401)
    const is404InvalidToken =
      error.response?.status === 404 &&
      errorData?.message &&
      errorData.message.toLowerCase().includes("invalid token");

    if (is404InvalidToken) {
      if (__DEV__) {
        console.error("[axios] ⚠️ 404 INVALID TOKEN - This is an auth failure disguised as 404", {
          status: 404,
          message: errorData.message,
          url: originalRequest?.url,
          method: originalRequest?.method?.toUpperCase(),
        });
      }

      // Treat 404/invalid-token as 401 and attempt refresh
      if (!originalRequest._retry && !originalRequest.skipAuth) {
        if (__DEV__) console.log("[axios] Attempting token refresh due to 404/invalid token...");
        originalRequest._retry = true;
        try {
          const refreshToken = await SecureStore.getItemAsync("refreshToken");

          if (refreshToken) {
            const refreshResponse = await axios.post(
              `${BASE_URL}/auth/refresh-token`,
              { refreshToken },
              { headers: { "Content-Type": "application/json" } }
            );

            if (refreshResponse.status === 200) {
              const newToken = refreshResponse.data.data?.token || refreshResponse.data.token;

              if (newToken) {
                await setAuthToken(newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                if (__DEV__) console.log("[axios] ✅ Token refreshed, retrying original request");
                return apiClient(originalRequest);
              }
            }
          } else {
            if (__DEV__) console.error("[axios] ❌ No refreshToken available after 404/invalid token");
          }
        } catch (refreshError) {
          console.error("[axios] ❌ Token refresh failed after 404/invalid token:", refreshError);
        }

        // If refresh failed, clear tokens and signal auth failure
        await removeAuthToken();
        await SecureStore.deleteItemAsync("refreshToken");
        if (__DEV__) console.log("[axios] 🚫 Auth tokens cleared due to failed refresh");
      }
    }

    // Token Refresh Mechanism on 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.skipAuth) {
      if (__DEV__) console.log("[axios] ⚠️ Received 401 - Attempting token refresh");
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync("refreshToken");

        if (refreshToken) {
          const refreshResponse = await axios.post(
            `${BASE_URL}/auth/refresh-token`,
            { refreshToken },
            { headers: { "Content-Type": "application/json" } }
          );

          if (refreshResponse.status === 200) {
            const newToken = refreshResponse.data.data?.token || refreshResponse.data.token;

            if (newToken) {
              await setAuthToken(newToken);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              if (__DEV__) console.log("[axios] ✅ Token refreshed after 401, retrying original request");
              return apiClient(originalRequest);
            }
          }
        }
      } catch (refreshError) {
        console.error("[axios] ❌ Token refresh failed:", refreshError);
        await removeAuthToken();
        await SecureStore.deleteItemAsync("refreshToken");
        if (__DEV__) console.log("[axios] 🚫 Auth tokens cleared due to refresh failure");
      }
    }

    // Return structured error object
    const errorData = error.response?.data as any;
    const isHtmlResponse = typeof errorData === "string" && errorData.includes("<html");

    return Promise.reject({
      message: isHtmlResponse
        ? "Unexpected response from server. Please try again."
        : errorData?.message || error.message || "An error occurred",
      status: error.response?.status || null,
      data: isHtmlResponse ? null : errorData || null,
      originalError: error,
      isNetworkError: !error.response,
    });
  }
);

export const setAuthToken = async (token: string): Promise<void> => {
  try {
    if (isUsableToken(token)) {
      await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token.trim());
    } else {
      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
    }
  } catch (error) {
    console.error("[axios] Failed to store auth token:", error);
    throw error;
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
    return isUsableToken(token) ? token.trim() : null;
  } catch (error) {
    console.error("[axios] Failed to retrieve auth token:", error);
    return null;
  }
};

export const removeAuthToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error("[axios] Failed to remove auth token:", error);
    throw error;
  }
};

export default apiClient;
