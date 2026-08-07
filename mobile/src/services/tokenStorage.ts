import * as SecureStore from 'react-native-secure-store';
import type { AuthResponse } from '@/types';

const ACCESS_KEY = 'mukurtham_access_token';
const REFRESH_KEY = 'mukurtham_refresh_token';
const USER_KEY = 'mukurtham_user';
const ONBOARDING_KEY = 'mukurtham_onboarding_done';

export const tokenStorage = {
  async saveTokens(auth: Pick<AuthResponse, 'accessToken' | 'refreshToken'>) {
    await Promise.all([
      SecureStore.setItem(ACCESS_KEY, auth.accessToken),
      SecureStore.setItem(REFRESH_KEY, auth.refreshToken),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItem(ACCESS_KEY);
    } catch {
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  },

  async saveUser(user: unknown) {
    await SecureStore.setItem(USER_KEY, JSON.stringify(user));
  },

  async getUser<T>(): Promise<T | null> {
    try {
      const raw = await SecureStore.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  async isOnboardingDone(): Promise<boolean> {
    try {
      return (await SecureStore.getItem(ONBOARDING_KEY)) === 'true';
    } catch {
      return false;
    }
  },

  async setOnboardingDone() {
    await SecureStore.setItem(ONBOARDING_KEY, 'true');
  },

  async clear() {
    await Promise.all([
      SecureStore.deleteItem(ACCESS_KEY),
      SecureStore.deleteItem(REFRESH_KEY),
      SecureStore.deleteItem(USER_KEY),
    ]);
  },
};
