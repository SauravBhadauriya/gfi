// Created by Kiro
// Storage Utilities - AsyncStorage helpers with encryption/decryption

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';

/**
 * Simple encryption (base64 - for demo only, use proper encryption in production)
 * @param text - Text to encrypt
 * @returns Encrypted text
 */
const encrypt = (text: string): string => {
  return Buffer.from(text).toString('base64');
};

/**
 * Simple decryption (base64 - for demo only, use proper decryption in production)
 * @param encryptedText - Encrypted text
 * @returns Decrypted text
 */
const decrypt = (encryptedText: string): string => {
  return Buffer.from(encryptedText, 'base64').toString('utf-8');
};

/**
 * Save item to AsyncStorage
 * @param key - Storage key
 * @param value - Value to save
 * @param encrypt - Whether to encrypt the value
 * @returns Promise
 */
export const saveItem = async (
  key: string,
  value: any,
  shouldEncrypt: boolean = false
): Promise<void> => {
  try {
    let stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    if (shouldEncrypt) {
      stringValue = encrypt(stringValue);
    }

    await AsyncStorage.setItem(key, stringValue);
  } catch (error) {
    console.error(`Error saving item ${key}:`, error);
    throw error;
  }
};

/**
 * Get item from AsyncStorage
 * @param key - Storage key
 * @param isEncrypted - Whether the value is encrypted
 * @returns Retrieved value or null
 */
export const getItem = async (
  key: string,
  isEncrypted: boolean = false
): Promise<any> => {
  try {
    let value = await AsyncStorage.getItem(key);

    if (!value) return null;

    if (isEncrypted) {
      value = decrypt(value);
    }

    // Try to parse as JSON
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error(`Error getting item ${key}:`, error);
    throw error;
  }
};

/**
 * Remove item from AsyncStorage
 * @param key - Storage key
 * @returns Promise
 */
export const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing item ${key}:`, error);
    throw error;
  }
};

/**
 * Clear all items from AsyncStorage
 * @returns Promise
 */
export const clearStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
};

/**
 * Get all keys from AsyncStorage
 * @returns Array of keys
 */
export const getAllKeys = async (): Promise<readonly string[]> => {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('Error getting all keys:', error);
    throw error;
  }
};

/**
 * Get multiple items from AsyncStorage
 * @param keys - Array of keys
 * @returns Object with key-value pairs
 */
export const getMultipleItems = async (keys: string[]): Promise<Record<string, any>> => {
  try {
    const values = await AsyncStorage.multiGet(keys);
    const result: Record<string, any> = {};

    values.forEach(([key, value]) => {
      if (value) {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value;
        }
      }
    });

    return result;
  } catch (error) {
    console.error('Error getting multiple items:', error);
    throw error;
  }
};

/**
 * Save multiple items to AsyncStorage
 * @param items - Object with key-value pairs
 * @returns Promise
 */
export const saveMultipleItems = async (items: Record<string, any>): Promise<void> => {
  try {
    const pairs = Object.entries(items).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
    ]);

    await AsyncStorage.multiSet(pairs as [string, string][]);
  } catch (error) {
    console.error('Error saving multiple items:', error);
    throw error;
  }
};

/**
 * Remove multiple items from AsyncStorage
 * @param keys - Array of keys
 * @returns Promise
 */
export const removeMultipleItems = async (keys: string[]): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Error removing multiple items:', error);
    throw error;
  }
};

/**
 * Check if key exists in AsyncStorage
 * @param key - Storage key
 * @returns true if exists, false otherwise
 */
export const hasItem = async (key: string): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value !== null;
  } catch (error) {
    console.error(`Error checking item ${key}:`, error);
    return false;
  }
};

/**
 * Get storage size (approximate)
 * @returns Approximate size in bytes
 */
export const getStorageSize = async (): Promise<number> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const values = await AsyncStorage.multiGet(keys);

    let totalSize = 0;
    values.forEach(([, value]) => {
      if (value) {
        totalSize += value.length;
      }
    });

    return totalSize;
  } catch (error) {
    console.error('Error getting storage size:', error);
    return 0;
  }
};

/**
 * Save user session
 * @param userData - User data to save
 * @returns Promise
 */
export const saveUserSession = async (userData: any): Promise<void> => {
  try {
    await saveMultipleItems({
      authToken: userData.token,
      isLoggedIn: true,
      userRole: userData.role,
      userEmail: userData.email,
      userFirstName: userData.firstName,
      userLastName: userData.lastName,
      userMobile: userData.mobile,
      userId: userData.id,
      profileCompleted: userData.profileCompleted || false,
      accountCreatedVia: userData.accountCreatedVia || 'email',
    });
  } catch (error) {
    console.error('Error saving user session:', error);
    throw error;
  }
};

/**
 * Get user session
 * @returns User session data or null
 */
export const getUserSession = async (): Promise<any> => {
  try {
    const keys = [
      'authToken',
      'isLoggedIn',
      'userRole',
      'userEmail',
      'userFirstName',
      'userLastName',
      'userMobile',
      'userId',
      'profileCompleted',
      'accountCreatedVia',
    ];

    return await getMultipleItems(keys);
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
};

/**
 * Clear user session
 * @returns Promise
 */
export const clearUserSession = async (): Promise<void> => {
  try {
    const keys = [
      'authToken',
      'isLoggedIn',
      'userRole',
      'userEmail',
      'userFirstName',
      'userLastName',
      'userMobile',
      'userId',
      'profileCompleted',
      'accountCreatedVia',
    ];

    await removeMultipleItems(keys);
  } catch (error) {
    console.error('Error clearing user session:', error);
    throw error;
  }
};

/**
 * Save preferences
 * @param preferences - Preferences object
 * @returns Promise
 */
export const savePreferences = async (preferences: Record<string, any>): Promise<void> => {
  try {
    await saveItem('appPreferences', preferences);
  } catch (error) {
    console.error('Error saving preferences:', error);
    throw error;
  }
};

/**
 * Get preferences
 * @returns Preferences object or empty object
 */
export const getPreferences = async (): Promise<Record<string, any>> => {
  try {
    const prefs = await getItem('appPreferences');
    return prefs || {};
  } catch (error) {
    console.error('Error getting preferences:', error);
    return {};
  }
};

/**
 * Update preference
 * @param key - Preference key
 * @param value - Preference value
 * @returns Promise
 */
export const updatePreference = async (key: string, value: any): Promise<void> => {
  try {
    const prefs = await getPreferences();
    prefs[key] = value;
    await savePreferences(prefs);
  } catch (error) {
    console.error('Error updating preference:', error);
    throw error;
  }
};
