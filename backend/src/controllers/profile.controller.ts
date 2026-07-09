import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { uploadToCloudinary } from '../utils/cloudinary.utils';
import { verifyProfilePhoto } from '../utils/aiVerification.utils';

// ============================================================
// POST /api/v1/profiles
// ============================================================
export const createProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const {
    profileRegisteredFor,
    name,
    gender,
    dateOfBirth,
    // Frontend sends heightFeet + heightInches; we convert to heightCm for the DB
    heightFeet,
    heightInches,
    heightCm,
    religionId,
    casteId,
    raasiId,
    starId,
    bornCountryId,
    currentCountryId,
    cityOrState,
    mainProfilePicture,
    aboutMe,
  } = req.body;

  // Convert feet+inches → cm  (1 foot = 30.48 cm, 1 inch = 2.54 cm)
  const resolvedHeightCm: number = heightCm
    ? Number(heightCm)
    : Math.round((Number(heightFeet || 5) * 30.48) + (Number(heightInches || 0) * 2.54));

  try {
    const userId = req.user.id;
    const userRoles = req.user.roles;

    // Check account limits
    const isBroker = userRoles.includes('broker');

    if (!isBroker) {
      // Regular user: maximum 1 profile file allowed
      const existingProfile = await prisma.profile.findFirst({
        where: { userId, deletedAt: null },
      });
      if (existingProfile) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Regular accounts are limited to managing exactly 1 matrimony profile.',
            code: 'PROFILE_LIMIT_EXCEEDED',
          },
        });
        return;
      }
    } else {
      // Broker account: check quota limits
      const dbUser = await prisma.user.findFirst({
        where: { id: userId },
      });

      // Default broker limit is 50
      const brokerLimit = 50; 
      const currentActiveCount = await prisma.profile.count({
        where: { userId, deletedAt: null },
      });

      if (currentActiveCount >= brokerLimit) {
        res.status(400).json({
          success: false,
          error: {
            message: `Broker profile quota limit reached (${brokerLimit}). Upgrade your account or archive existing profiles.`,
            code: 'QUOTA_LIMIT_EXCEEDED',
          },
        });
        return;
      }
    }

    // Save profile record using correct DB field names matching the Prisma schema
    const profile = await prisma.profile.create({
      data: {
        userId,
        profileRegisteredFor,
        name,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        heightCm: resolvedHeightCm,
        religionId:       Number(religionId),
        casteId:          Number(casteId),
        raasiId:          Number(raasiId),
        starId:           Number(starId),
        bornCountryId:    Number(bornCountryId),
        currentCountryId: Number(currentCountryId),
        cityOrState:      cityOrState || '',
        mainProfilePicture: mainProfilePicture || null,
        aboutMe:          aboutMe || '',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Matrimony profile created successfully.',
      data: profile,
    });
  } catch (error) {
    console.error('[Profile] Creation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create profile.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// GET /api/v1/profiles/me
// ============================================================
export const getMyProfiles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  try {
    const profiles = await prisma.profile.findMany({
      where: { userId: req.user.id, deletedAt: null },
      include: {
        religion: true,
        caste: true,
        raasi: true,
        star: true,
        bornCountry: true,
        currentCountry: true,
        photos: { where: { status: 'approved' }, take: 1 }, // Only get primary photo
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: profiles,
    });
  } catch (error) {
    console.error('[Profile] Fetch my profiles error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve your profiles.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// GET /api/v1/profiles/:id
// ============================================================
export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const profileId = parseInt(req.params.id);

  try {
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, deletedAt: null },
      include: {
        religion: true,
        caste: true,
        raasi: true,
        star: true,
        bornCountry: true,
        currentCountry: true,
        photos: { where: { status: 'approved' } },
        documents: { where: { documentType: 'horoscope' } },
      },
    });

    if (!profile) {
      res.status(404).json({
        success: false,
        error: { message: 'Profile not found.', code: 'NOT_FOUND' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('[Profile] Fetch error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve profile details.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// PUT /api/v1/profiles/:id
// ============================================================
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const profileId = parseInt(req.params.id);
  const userId = req.user.id;
  const userRoles = req.user.roles;

  try {
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, deletedAt: null },
    });

    if (!profile) {
      res.status(404).json({ success: false, error: { message: 'Profile not found.', code: 'NOT_FOUND' } });
      return;
    }

    // Authorization: Owner or Admin/Moderator can modify
    const isOwner = profile.userId === userId;
    const isStaff = userRoles.includes('admin') || userRoles.includes('moderator');

    if (!isOwner && !isStaff) {
      res.status(403).json({
        success: false,
        error: { message: 'Access denied. You do not own this profile.', code: 'FORBIDDEN' },
      });
      return;
    }

    const updated = await prisma.profile.update({
      where: { id: profileId },
      data: {
        ...req.body,
        dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('[Profile] Update error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update profile.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// POST /api/v1/profiles/:id/photos
// ============================================================
export const uploadProfilePhotos = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, error: { message: 'No image file uploaded.', code: 'BAD_REQUEST' } });
    return;
  }

  const profileId = parseInt(req.params.id);

  try {
    const fileUrl = await uploadToCloudinary(
      req.file.buffer,
      'profiles',
      `profile_${profileId}_${Date.now()}`
    );

    // Call AI Verification Service
    const verification = await verifyProfilePhoto(fileUrl);

    if (!verification.isVerified) {
      res.status(400).json({
        success: false,
        error: { message: `Photo rejected: ${verification.reason}`, code: 'PHOTO_REJECTED' },
      });
      return;
    }

    const photo = await prisma.photo.create({
      data: {
        profileId,
        photoUrl: fileUrl,
        status: 'approved', // Approved by AI
      },
    });

    res.status(201).json({
      success: true,
      message: 'Photo uploaded successfully.',
      data: photo,
    });
  } catch (error) {
    console.error('[Profile] Photo upload error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to upload photo.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// POST /api/v1/profiles/:id/horoscope
// ============================================================
export const uploadHoroscope = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, error: { message: 'No file uploaded.', code: 'BAD_REQUEST' } });
    return;
  }

  const profileId = parseInt(req.params.id);

  try {
    const fileUrl = await uploadToCloudinary(
      req.file.buffer,
      'horoscopes',
      `horoscope_${profileId}_${Date.now()}`
    );

    const horoscope = await prisma.profileDocument.create({
      data: {
        profileId,
        documentType: 'horoscope',
        fileUrl,
        fileType: req.file.mimetype.includes('pdf') ? 'pdf' : 'image',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Horoscope uploaded successfully.',
      data: horoscope,
    });
  } catch (error) {
    console.error('[Profile] Horoscope upload error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to upload horoscope.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
