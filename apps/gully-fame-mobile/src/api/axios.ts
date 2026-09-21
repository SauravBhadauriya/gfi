import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

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

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, 
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

      if (__DEV__) {
        console.log("[axios] 🔐 [VERIFICATION] Request Details:", {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          fullURL: `${config.baseURL}${config.url}`,
          headers: {
            "Content-Type": config.headers?.["Content-Type"],
            "User-Agent": config.headers?.["User-Agent"],
            Authorization: config.headers?.Authorization ? "Bearer [TOKEN_PRESENT]" : "None",
          },
        });
      }

      if (!config.skipAuth) {
        const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        } else if (__DEV__) {
          console.warn("[axios] 🔐 [VERIFICATION] No token found in SecureStore - request will be sent without auth");
        }
      }
      
      return config;
    } catch (error) {
      console.warn("[axios] 🔐 [VERIFICATION] Failed to retrieve token:", error);
      return config;
    }
  },
  (error: AxiosError) => {
    console.error("[axios] 🔐 [VERIFICATION FAILED] Request error:", error.message);
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

    // Token Refresh Mechanism on 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.skipAuth) {
      if (__DEV__) console.log("[axios] Received 401 - Attempting token refresh");
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
              await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, newToken);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return apiClient(originalRequest);
            }
          }
        }
      } catch (refreshError) {
        console.error("[axios] Token refresh failed:", refreshError);
        await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
        await SecureStore.deleteItemAsync("refreshToken");
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
    await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
  } catch (error) {
    console.error("[axios] Failed to store auth token:", error);
    throw error;
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
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