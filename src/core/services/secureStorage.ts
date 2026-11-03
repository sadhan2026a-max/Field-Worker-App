import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Secure token storage for auth tokens (access token, refresh token).
 * Uses hardware-backed encrypted Keychain/KeyStore via expo-secure-store on iOS/Android,
 * with fallback to AsyncStorage for Web or if SecureStore is unavailable.
 */
export const SecureTokenStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(key, value);
        return;
      } catch (e) {
        // Fallback to AsyncStorage if native secure storage fails
      }
    }
    await AsyncStorage.setItem(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS !== 'web') {
      try {
        const val = await SecureStore.getItemAsync(key);
        if (val !== null && val !== undefined) return val;
      } catch (e) {
        // Fallback to AsyncStorage
      }
    }
    return await AsyncStorage.getItem(key);
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (e) {
        // Fallback
      }
    }
    await AsyncStorage.removeItem(key);
  },

  async multiRemove(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.removeItem(key);
    }
  },
};

