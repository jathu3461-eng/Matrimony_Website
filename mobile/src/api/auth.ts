import api from './client';
import type { AuthResponse, User } from '@/types';

interface LoginPayload {
  email: string;
  password: string;
  device_info?: string;
}

interface SignupPayload {
  username: string;
  email: string;
  password: string;
  phone_number: string;
  role: 'regular' | 'broker';
  business_name?: string;
  ui_language?: 'en' | 'ta';
}

interface SignupResult {
  user?: User;
  status?: 'active' | 'pending_approval';
  message?: string;
  verification?: { sent: boolean; demo_otp?: string };
}

export const authApi = {
  async mobileLogin(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/mobile/login', payload);
    return data;
  },

  async mobileLogout(refreshToken: string): Promise<void> {
    await api.post('/auth/mobile/logout', { refreshToken }).catch(() => undefined);
  },

  async signup(payload: SignupPayload): Promise<SignupResult> {
    const { data } = await api.post<SignupResult>('/auth/signup', payload);
    return data;
  },

  async me(): Promise<User> {
    const { data } = await api.get<{ user: User }>('/auth/me');
    return data.user;
  },

  async requestForgotOtp(email: string): Promise<void> {
    await api.post('/auth/forgot-password/request', { email });
  },

  async verifyForgotOtp(email: string, otp: string): Promise<void> {
    await api.post('/auth/forgot-password/verify', { email, otp });
  },

  async resetPassword(email: string, otp: string, new_password: string): Promise<void> {
    await api.post('/auth/forgot-password/reset', { email, otp, new_password });
  },

  async requestSignupOtp(email: string): Promise<void> {
    await api.post('/auth/signup/verify/request', { email });
  },

  async verifySignupOtp(email: string, otp: string): Promise<void> {
    await api.post('/auth/signup/verify', { email, otp });
  },
};
