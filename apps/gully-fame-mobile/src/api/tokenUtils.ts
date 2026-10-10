import * as SecureStore from "expo-secure-store";
import jwtDecode from "jwt-decode";

const TOKEN_STORAGE_KEY = "authToken";
const REFRESH_TOKEN_STORAGE_KEY = "refreshToken";

/**
 * Extract metadata from a JWT token without trusting its claims.
 * Returns the exp claim if present, or null if the token is invalid or missing exp.
 */
export const getTokenMetadata = (token: string | null | undefined) => {
  if (!token || typeof token !== "string") {
    return {
      isValid: false,
      expiresAt: null,
      expiresIn: null,
      tokenPreview: "[no token]",
    };
  }

  try {
    const decoded: any = jwtDecode(token);
    const expiresAt = decoded.exp ? decoded.exp * 1000 : null; // exp is in seconds, convert to ms
    const expiresIn = expiresAt ? Math.max(0, expiresAt - Date.now()) : null;
    const isExpired = expiresIn !== null && expiresIn <= 0;

    // Token preview: first 20 + last 10 chars
    const preview =
      token.length > 30
        ? `${token.substring(0, 20)}...${token.substring(token.length - 10)}`
        : token;

    return {
      isValid: true,
      isExpired,
      expiresAt,
      expiresIn,
      tokenPreview: preview,
    };
  } catch (error) {
    return {
      isValid: false,
      isExpired: null,
      expiresAt: null,
      expiresIn: null,
      tokenPreview: "[malformed token]",
    };
  }
};

/**
 * Check if a stored token is currently usable (exists, is not malformed, not expired).
 * Does NOT make network calls; only checks local state.
 */
export const inspectTokenState = async () => {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);

    if (!token || typeof token !== "string") {
      return {
        isUsable: false,
        isExpired: false,
        expiresIn: null,
        tokenPreview: "[no token]",
        reason: "No token in SecureStore",
      };
    }

    const metadata = getTokenMetadata(token);

    if (!metadata.isValid) {
      return {
        isUsable: false,
        isExpired: false,
        expiresIn: null,
        tokenPreview: metadata.tokenPreview,
        reason: "Token is malformed or unreadable",
      };
    }

    if (metadata.isExpired) {
      return {
        isUsable: false,
        isExpired: true,
        expiresIn: metadata.expiresIn,
        tokenPreview: metadata.tokenPreview,
        reason: "Token is expired",
      };
    }

    return {
      isUsable: true,
      isExpired: false,
      expiresIn: metadata.expiresIn,
      tokenPreview: metadata.tokenPreview,
      reason: "Token is valid",
    };
  } catch (error: any) {
    return {
      isUsable: false,
      isExpired: false,
      expiresIn: null,
      tokenPreview: "[error reading token]",
      reason: `Error: ${error.message}`,
    };
  }
};

/**
 * Ensure the stored token is fresh (not expired, expires in > 60s).
 * If token is stale or expired, attempt to refresh it.
 * If refresh fails or no refreshToken exists, throw an error.
 *
 * This MUST be called before any authenticated request to prevent sending stale tokens.
 */
export const ensureTokenFresh = async (apiClient?: any): Promise<void> => {
  const tokenState = await inspectTokenState();

  if (__DEV__) {
    console.log("[tokenUtils] 🔐 Checking token freshness:", tokenState);
  }

  // Token is usable and expires in > 60 seconds
  if (tokenState.isUsable && (tokenState.expiresIn ?? 0) > 60 * 1000) {
    if (__DEV__) {
      console.log("[tokenUtils] ✅ Token is fresh, no refresh needed");
    }
    return;
  }

  // Token is expired or expires soon, attempt refresh
  if (__DEV__) {
    console.log("[tokenUtils] ⚠️ Token is stale or expired, attempting refresh...");
  }

  try {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_STORAGE_KEY);

    if (!refreshToken) {
      if (__DEV__) {
        console.error("[tokenUtils] ❌ No refreshToken in SecureStore");
      }
      throw new Error("No refresh token available. Please log in again.");
    }

    // Use the provided apiClient or import the default
    const client = apiClient || (await import("./axios")).default;

    const refreshResponse = await client.post("/auth/refresh-token", { refreshToken }, { skipAuth: true });

    const newToken = refreshResponse.data?.data?.token || refreshResponse.data?.token;

    if (!newToken) {
      if (__DEV__) {
        console.error("[tokenUtils] ❌ Refresh response did not contain a new token");
      }
      throw new Error("Token refresh failed: no token in response.");
    }

    // Store the new token
    const { setAuthToken } = await import("./axios");
    await setAuthToken(newToken);

    if (__DEV__) {
      console.log("[tokenUtils] ✅ Token refreshed successfully");
    }
  } catch (error: any) {
    const errorMsg = error.message || "Token refresh failed";
    if (__DEV__) {
      console.error("[tokenUtils] ❌ Token refresh failed:", errorMsg);
    }
    throw new Error(errorMsg);
  }
};

/**
 * Utility to clear all stored tokens (used on logout or auth failure).
 */
export const clearAllTokens = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY);
    if (__DEV__) {
      console.log("[tokenUtils] ✅ All tokens cleared");
    }
  } catch (error: any) {
    console.error("[tokenUtils] Error clearing tokens:", error.message);
  }
};
