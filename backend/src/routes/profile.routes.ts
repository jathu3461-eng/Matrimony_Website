import { Router } from 'express';
import multer from 'multer';
import {
  createProfile,
  getProfile,
  getMyProfiles,
  updateProfile,
  uploadProfilePhotos,
  uploadHoroscope,
  getPreferences,
  savePreferences,
} from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { apiRateLimiter } from '../middleware/rateLimit.middleware';
import { z } from 'zod';

const router = Router();

// Configure Multer in-memory storage (file buffer passed to Cloudinary stream)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

// Inline Zod schemas for quick validations
const profileInputSchema = z.object({
  profileRegisteredFor: z.enum(['self', 'son', 'daughter', 'brother', 'sister', 'relative', 'friend', 'client']),
  name: z.string().min(2).max(100),
  gender: z.enum(['M', 'F']),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  heightCm:     z.number().int().min(100).max(250).optional(),
  heightFeet:   z.number().int().min(3).max(7).optional(),
  heightInches: z.number().int().min(0).max(11).optional(),
  education:   z.string().optional().nullable(),
  occupation:   z.string().optional().nullable(),
  religionId:   z.number().int().positive(),
  casteId:      z.number().int().positive(),
  subReligion:  z.string().max(100).optional().nullable(),
  raasiId: z.number().int().min(1).max(12),
  starId: z.number().int().min(1).max(27),
  bornCountryId: z.number().int().positive(),
  currentCountryId: z.number().int().positive(),
  cityOrState: z.string().min(2).max(100),
  mainProfilePicture: z.string().optional().nullable(),
  aboutMe: z.string().min(10),
}).passthrough();

/**
 * @route   POST /api/v1/profiles
 * @desc    Create a new matrimony profile
 * @access  Protected
 */
router.post(
  '/',
  authenticate,
  apiRateLimiter,
  validateBody(profileInputSchema),
  createProfile
);

/**
 * @route   GET /api/v1/profiles/me
 * @desc    Retrieve profiles managed by logged-in user
 * @access  Protected
 */
router.get('/me', authenticate, apiRateLimiter, getMyProfiles);

/**
 * @route   GET /api/v1/profiles/:id
 * @desc    Retrieve profile details
 * @access  Public (rate-limited)
 */
router.get('/:id', apiRateLimiter, getProfile);

/**
 * @route   PUT /api/v1/profiles/:id
 * @desc    Modify profile details
 * @access  Protected
 */
router.put(
  '/:id',
  authenticate,
  apiRateLimiter,
  validateBody(profileInputSchema.partial()),
  updateProfile
);

/**
 * @route   POST /api/v1/profiles/:id/photos
 * @desc    Upload profile photo
 * @access  Protected
 */
router.post(
  '/:id/photos',
  authenticate,
  upload.single('photo'),
  uploadProfilePhotos
);

/**
 * @route   POST /api/v1/profiles/:id/horoscope
 * @desc    Upload horoscope file
 * @access  Protected
 */
router.post(
  '/:id/horoscope',
  authenticate,
  upload.single('horoscope'),
  uploadHoroscope
);

/**
 * @route   GET /api/v1/profiles/:id/preferences
 * @desc    Get partner preferences for a profile
 * @access  Public
 */
router.get('/:id/preferences', apiRateLimiter, getPreferences);

/**
 * @route   PUT /api/v1/profiles/:id/preferences
 * @desc    Save partner preferences for a profile
 * @access  Protected
 */
router.put('/:id/preferences', authenticate, apiRateLimiter, savePreferences);

export default router;
