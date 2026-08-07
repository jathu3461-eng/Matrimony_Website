import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { tokenStorage } from '@/services/tokenStorage';
import type { AuthResponse } from '@/types';

// Point this at your deployed Express API in production. Override via app.json
// extra or an env file. The web client uses https://api.mukurtham.ca/api.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://api.mukurtham.ca/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject the access token on every request when available.
api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // The host's WAF (LiteSpeed/ModSecurity) blocks POST/PUT/PATCH requests that
  // carry no body. Inject an empty JSON body whenever none was provided.
  const method = (config.method || 'get').toLowerCase();
  if (['post', 'put', 'patch'].includes(method) && config.data === undefined) {
    config.data = {};
  }
  return config;
});

// Builds a full URL for files stored on the backend (uploads folder).
export function uploadsUrl(name?: string | null): string {
  if (!name) return '';
  if (/^https?:\/\//.test(name)) return name;
  const origin = API_BASE_URL.endsWith('/api')
    ? API_BASE_URL.slice(0, -4)
    : API_BASE_URL.replace(/\/$/, '');
  return `${origin}/uploads/${name}`;
}

// Track whether a refresh is already in flight so concurrent 401s share it.
let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<AuthResponse>(
      `${API_BASE_URL}/auth/mobile/refresh`,
      { refreshToken },
      { timeout: 20000 }
    );
    await tokenStorage.saveTokens(data);
    await tokenStorage.saveUser(data.user);
    return data.accessToken;
  } catch {
    await tokenStorage.clear();
    return null;
  }
}

// On a 401, attempt a single refresh-token rotation and replay the request.
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const isAuthUrl =
      original?.url?.includes('/auth/mobile/login') ||
      original?.url?.includes('/auth/mobile/refresh') ||
      original?.url?.includes('/auth/mobile/logout') ||
      original?.url?.includes('/auth/login') ||
      original?.url?.includes('/auth/signup');

    if (status === 401 && original && !original._retry && !isAuthUrl) {
      original._retry = true;
      refreshing = refreshing || doRefresh();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// Helper to read backend error messages across the different response shapes.
export function extractError(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { error?: string; message?: string; errors?: Record<string, string> }
      | undefined;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
    if (data?.errors) {
      const first = Object.values(data.errors)[0];
      if (first) return first;
    }
  }
  return fallback;
}

export default api;
