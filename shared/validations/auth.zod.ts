import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string()
    .min(4, 'Username must be at least 4 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9]+$/, 'Username must be alphanumeric with no spaces'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phoneNumber: z.string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in international format (e.g. +14165550198)'),
  role: z.enum(['regular', 'broker']),
  uiLanguage: z.enum(['en', 'ta']).default('en'),
});

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const otpVerifySchema = z.object({
  phoneOrEmail: z.string().min(1, 'Identifier is required'),
  code: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
