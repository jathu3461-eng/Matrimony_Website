// Validation rules matching the backend exactly.

export const USERNAME_RE = /^[a-zA-Z0-9_]{4,30}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^\+[1-9]\d{7,14}$/;
export const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

export function validateUsername(value: string): string | null {
  if (!value) return 'Username is required';
  if (value.length < 4) return `At least 4 characters (${value.length}/4)`;
  if (value.length > 30) return 'Max 30 characters';
  if (!USERNAME_RE.test(value)) return 'Letters, numbers and underscore only';
  return null;
}

export function validateEmail(value: string): string | null {
  if (!value) return 'Email is required';
  if (/\s/.test(value)) return 'Email cannot contain spaces';
  if (!value.includes('@')) return 'Must contain @';
  if (!EMAIL_RE.test(value)) return 'Invalid format: name@example.com';
  return null;
}

export function validatePhone(value: string): string | null {
  if (!value) return 'Phone number is required';
  if (!value.startsWith('+')) return 'Must start with + (e.g. +91...)';
  const digits = value.slice(1);
  if (!/^\d+$/.test(digits)) return 'Only digits after +';
  if (digits.length < 7) return `At least 8 digits total (${digits.length + 1}/8)`;
  if (digits.length > 15) return 'Max 16 digits total';
  if (!PHONE_RE.test(value)) return 'Invalid format: +14165550198';
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Password is required';
  if (value.length < 8) return `At least 8 characters (${value.length}/8)`;
  if (!/[A-Z]/.test(value)) return 'Must contain at least 1 uppercase letter';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Must contain at least 1 special character (!@#$...)';
  return null;
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return 'Please confirm your password';
  if (password !== confirm) return 'Passwords do not match';
  return null;
}

// Hint text shown when field is empty (guides the user).
export const HINTS = {
  username: '4-30 characters, letters/numbers/underscore',
  email: 'name@example.com',
  phone: '+14165550198',
  password: 'Min 8 chars, 1 uppercase, 1 special character',
  confirm: 'Re-enter your password',
  businessName: 'Your agency name (min 2 characters)',
} as const;
