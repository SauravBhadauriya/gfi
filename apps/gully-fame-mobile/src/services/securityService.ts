/**
 * Security Service
 * Handles secure token storage, JWT validation, and token rotation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import jwtDecode from 'jwt-decode';

export interface TokenPayload {
  sub?: string;
  iat?: number;
  exp?: number;
  role?: string;
  userId?: string;
  email?: string;
}

interface SecureTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const TOKENS_STORAGE_KEY = 'gf_secure_tokens';
const TOKEN_ROTATION_BUFFER = 5 * 60 * 1000; // Refresh token 5 minutes before expiry

export class SecurityService {
  /**
   * Store tokens securely using expo-secure-store
   * Falls back to AsyncStorage if Secure Store is unavailable
   */
  static async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      // Decode token to get expiry
      const payload = this.decodeToken(accessToken);
      const expiresAt = (payload.exp || Date.now() / 1000 + 3600) * 1000;

      const tokens: SecureTokens = {
        accessToken,
        refreshToken,
        expiresAt,
      };

      try {
        // Try to use Secure Store first
        await SecureStore.setItemAsync(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
        console.log('[SecurityService] Tokens stored securely');
      } catch (error) {
        // Fallback to AsyncStorage
        console.warn('[SecurityService] Secure Store unavailable, using AsyncStorage');
        await AsyncStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
      }
    } catch (error) {
      console.error('[SecurityService] Failed to store tokens:', error);
      throw error;
    }
  }

  /**
   * Retrieve stored tokens
   */
  static async getTokens(): Promise<SecureTokens | null> {
    try {
      let tokensJson: string | null = null;

      try {
        // Try Secure Store first
        tokensJson = await SecureStore.getItemAsync(TOKENS_STORAGE_KEY);
      } catch {
        // Fallback to AsyncStorage
        tokensJson = await AsyncStorage.getItem(TOKENS_STORAGE_KEY);
      }

      if (!tokensJson) return null;

      const tokens = JSON.parse(tokensJson) as SecureTokens;
      return tokens;
    } catch (error) {
      console.error('[SecurityService] Failed to retrieve tokens:', error);
      return null;
    }
  }

  /**
   * Get access token
   */
  static async getAccessToken(): Promise<string | null> {
    const tokens = await this.getTokens();
    return tokens?.accessToken || null;
  }

  /**
   * Get refresh token
   */
  static async getRefreshToken(): Promise<string | null> {
    const tokens = await this.getTokens();
    return tokens?.refreshToken || null;
  }

  /**
   * Check if access token is expired
   */
  static async isTokenExpired(): Promise<boolean> {
    const tokens = await this.getTokens();
    if (!tokens) return true;

    const now = Date.now();
    return now >= tokens.expiresAt;
  }

  /**
   * Check if token needs refresh (within buffer time)
   */
  static async shouldRefreshToken(): Promise<boolean> {
    const tokens = await this.getTokens();
    if (!tokens) return true;

    const now = Date.now();
    const timeUntilExpiry = tokens.expiresAt - now;

    return timeUntilExpiry < TOKEN_ROTATION_BUFFER;
  }

  /**
   * Decode JWT token
   */
  static decodeToken(token: string): TokenPayload {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      return decoded;
    } catch (error) {
      console.error('[SecurityService] Failed to decode token:', error);
      return {};
    }
  }

  /**
   * Get token expiry time
   */
  static getTokenExpiryTime(token: string): number | null {
    const payload = this.decodeToken(token);
    if (payload.exp) {
      return payload.exp * 1000; // Convert seconds to milliseconds
    }
    return null;
  }

  /**
   * Get time until token expiry
   */
  static getTimeUntilExpiry(token: string): number {
    const expiryTime = this.getTokenExpiryTime(token);
    if (!expiryTime) return 0;

    const now = Date.now();
    return Math.max(0, expiryTime - now);
  }

  /**
   * Clear all tokens
   */
  static async clearTokens(): Promise<void> {
    try {
      try {
        await SecureStore.deleteItemAsync(TOKENS_STORAGE_KEY);
      } catch {
        await AsyncStorage.removeItem(TOKENS_STORAGE_KEY);
      }
      console.log('[SecurityService] Tokens cleared');
    } catch (error) {
      console.error('[SecurityService] Failed to clear tokens:', error);
    }
  }

  /**
   * Validate token structure and expiry
   */
  static isTokenValid(token: string): boolean {
    try {
      const payload = this.decodeToken(token);

      // Check if token has required fields
      if (!payload.exp) return false;

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp <= now) {
        console.warn('[SecurityService] Token is expired');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[SecurityService] Token validation failed:', error);
      return false;
    }
  }

  /**
   * Encrypt sensitive data (can be enhanced with encryption library)
   */
  static async encryptData(data: string): Promise<string> {
    // For now, we use base64 encoding as a simple obfuscation
    // In production, consider using: react-native-encryption, tweetnacl.js, or similar
    try {
      // Use simple base64 encoding for obfuscation
      return btoa(data);
    } catch (error) {
      console.error('[SecurityService] Failed to encrypt data:', error);
      throw error;
    }
  }

  /**
   * Decrypt sensitive data
   */
  static async decryptData(encryptedData: string): Promise<string> {
    try {
      return atob(encryptedData);
    } catch (error) {
      console.error('[SecurityService] Failed to decrypt data:', error);
      throw error;
    }
  }

  /**
   * Validate session
   */
  static async validateSession(): Promise<boolean> {
    try {
      const tokens = await this.getTokens();

      if (!tokens) {
        console.log('[SecurityService] No tokens found');
        return false;
      }

      // Check if tokens are valid
      const accessTokenValid = this.isTokenValid(tokens.accessToken);
      const refreshTokenValid = this.isTokenValid(tokens.refreshToken);

      if (!accessTokenValid || !refreshTokenValid) {
        console.warn('[SecurityService] One or more tokens are invalid');
        await this.clearTokens();
        return false;
      }

      return true;
    } catch (error) {
      console.error('[SecurityService] Session validation failed:', error);
      return false;
    }
  }

  /**
   * Get user info from token
   */
  static async getUserFromToken(): Promise<TokenPayload | null> {
    try {
      const token = await this.getAccessToken();
      if (!token) return null;

      return this.decodeToken(token);
    } catch (error) {
      console.error('[SecurityService] Failed to get user from token:', error);
      return null;
    }
  }
}
