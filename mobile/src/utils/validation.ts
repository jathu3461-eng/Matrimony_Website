// Validation rules matching the backend exactly (source of truth).
// Messages mirror what the website shows so the mobile app behaves identically.

export const USERNAME_RE = /^[a-zA-Z0-9_]{4,30}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^\+[1-9]\d{7,14}$/;
export const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
export const DOB_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Calculate age in years from a YYYY-MM-DD date. */
export function calcAge(dob: string): number | null {
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  return Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

/**
 * Live-field helper: empty → show "required" only after the field has been
 * touched (blurred or submitted); non-empty → validate live while typing.
 */
export function fieldError(
  value: string,
  touched: boolean,
  validate: (v: string) => string | null
): string | null {
  if (!value) return touched ? 'Required' : null;
  return validate(value);
}

export function validateUsername(value: string): string | null {
  if (value.length < 4) return 'At least 4 characters';
  if (value.length > 30) return 'Maximum 30 characters';
  if (!USERNAME_RE.test(value)) return 'Letters, numbers and underscore only';
  return null;
}

export function validateEmail(value: string): string | null {
  if (/\s/.test(value)) return 'Email cannot contain spaces';
  if (!EMAIL_RE.test(value)) return 'Invalid email format (e.g. name@example.com)';
  return null;
}

export function validateEmailOrPhone(value: string): string | null {
  if (EMAIL_RE.test(value) || PHONE_RE.test(value)) return null;
  if (value.includes('@')) return 'Invalid email format (e.g. name@example.com)';
  return 'Enter a valid email or mobile number (e.g. +14165550198)';
}

export function validatePhone(value: string): string | null {
  if (!value.startsWith('+')) return 'Must start with + (e.g. +14165550198)';
  const digits = value.slice(1);
  if (!/^\d+$/.test(digits)) return 'Only digits after +';
  if (digits.length < 7) return 'At least 8 digits total';
  if (digits.length > 15) return 'Maximum 16 digits total';
  return null;
}

export function validatePassword(value: string): string | null {
  if (value.length < 8) return 'Minimum 8 characters';
  if (!/[A-Z]/.test(value)) return 'Needs at least 1 uppercase letter';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value))
    return 'Needs at least 1 special character (!@#$...)';
  return null;
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return 'Confirm your password';
  if (password !== confirm) return 'Passwords do not match';
  return null;
}

export function validateBusinessName(value: string): string | null {
  if (value.length < 2) return 'Required. Minimum 2 characters';
  if (value.length > 80) return 'Too long (maximum 80 characters)';
  return null;
}

// ── Profile fields (aligned with backend routes/profiles.js) ──────────────────
export function validateName(value: string): string | null {
  if (value.length < 2) return 'Full name must be at least 2 characters';
  if (value.length > 60) return 'Too long (maximum 60 characters)';
  return null;
}

export function validateDob(value: string): string | null {
  if (!DOB_RE.test(value)) return 'Invalid format. Expected: YYYY-MM-DD';
  const age = calcAge(value);
  if (age === null) return 'Enter a valid date of birth';
  if (age < 18) return 'Must be 18 years or older';
  return null;
}

export function validateHeightFeet(value: string): string | null {
  const n = Number(value);
  if (isNaN(n) || n < 3 || n > 7) return 'Expected a value between 3 and 7';
  return null;
}

export function validateHeightInches(value: string): string | null {
  const n = Number(value);
  if (isNaN(n) || n < 0 || n > 11) return 'Expected a value between 0 and 11';
  return null;
}

export function validateLongText(value: string, label: string): string | null {
  if (value.length < 2) return `${label} must be at least 2 characters`;
  if (value.length > 200) return 'Too long (maximum 200 characters)';
  return null;
}

export function validateAboutMe(value: string): string | null {
  const len = value.trim().length;
  if (len < 50) return `Too short. Required: minimum 50 characters (currently ${len})`;
  if (len > 2000) return 'Too long (maximum 2000 characters)';
  return null;
}

// Hint text shown when a field is empty (guides the user on the expected format).
export const HINTS = {
  username: '4-30 characters, letters/numbers/underscore',
  email: 'name@example.com',
  phone: '+14165550198',
  password: 'Min 8 chars, 1 uppercase, 1 special character',
  confirm: 'Re-enter your password',
  businessName: 'Your agency name (min 2 characters)',
  name: 'Your full name',
  dob: 'YYYY-MM-DD (e.g. 1995-06-15)',
  heightFeet: '3-7',
  heightInches: '0-11',
  education: 'e.g. B.E. Computer Science',
  occupation: 'e.g. Software Engineer',
  city: 'e.g. Chennai',
  diet: 'e.g. Vegetarian, Non-vegetarian, Vegan',
  familyValues: 'e.g. Traditional, Moderate, Liberal',
  aboutMe: 'Tell your story (minimum 50 characters)',
} as const;
