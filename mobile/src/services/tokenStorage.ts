import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthResponse } from '@/types';

const ACCESS_KEY = 'mukurtham_access_token';
const REFRESH_KEY = 'mukurtham_refresh_token';
const USER_KEY = 'mukurtham_user';
const ONBOARDING_KEY = 'mukurtham_onboarding_done';

export const tokenStorage = {
  async saveTokens(auth: Pick<AuthResponse, 'accessToken' | 'refreshToken'>) {
    await Promise.all([
      AsyncStorage.setItem(ACCESS_KEY, auth.accessToken),
      AsyncStorage.setItem(REFRESH_KEY, auth.refreshToken),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACCESS_KEY);
    } catch {
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  },

  async saveUser(user: unknown) {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  async getUser<T>(): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  async isOnboardingDone(): Promise<boolean> {
    try {
      return (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true';
    } catch {
      return false;
    }
  },

  async setOnboardingDone() {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  },

  async clear() {
    await Promise.all([
      AsyncStorage.removeItem(ACCESS_KEY),
      AsyncStorage.removeItem(REFRESH_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
  },
};
