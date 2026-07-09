import { z } from 'zod';

export const profileSchema = z.object({
  profileRegisteredFor: z.enum([
    'self',
    'son',
    'daughter',
    'brother',
    'sister',
    'relative',
    'friend',
    'client'
  ]),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  gender: z.enum(['M', 'F']),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format'),
  heightFeet: z.number().int().min(3).max(7),
  heightInches: z.number().int().min(0).max(11),
  education: z.string().min(1, 'Education level is required'),
  occupation: z.string().min(1, 'Current occupation is required'),
  religionId: z.number().int().positive('Religion is required'),
  casteId: z.number().int().positive('Caste is required'),
  subReligion: z.string().max(100).optional().nullable(),
  raasiId: z.number().int().min(1).max(12),
  starId: z.number().int().min(1).max(27),
  bornCountryId: z.number().int().positive('Country of birth is required'),
  currentCountryId: z.number().int().positive('Current country of residence is required'),
  cityOrState: z.string().min(2, 'City/State must be at least 2 characters').max(100),
  mainProfilePicture: z.string().optional().nullable(),
  aboutMe: z.string().min(50, 'About me description must be at least 50 characters'),
});

export type ProfileInput = z.infer<typeof profileSchema>;
