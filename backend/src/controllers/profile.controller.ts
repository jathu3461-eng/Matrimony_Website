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

    let resolvedMainPicture = mainProfilePicture;
    let newPhotoUrl: string | null = null;

    if (mainProfilePicture && mainProfilePicture.startsWith('data:image/')) {
      const matches = mainProfilePicture.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        res.status(400).json({ success: false, error: { message: 'Invalid image format.', code: 'BAD_REQUEST' } });
        return;
      }

      const buffer = Buffer.from(matches[2], 'base64');
      const tempFileName = `profile_temp_${userId}_${Date.now()}`;
      
      try {
        const fileUrl = await uploadToCloudinary(buffer, 'profiles', tempFileName);

        // AI verification
        const verification = await verifyProfilePhoto(fileUrl);
        if (!verification.isVerified) {
          res.status(400).json({
            success: false,
            error: { message: `Photo rejected: ${verification.reason}`, code: 'PHOTO_REJECTED' },
          });
          return;
        }

        resolvedMainPicture = fileUrl;
        newPhotoUrl = fileUrl;
      } catch (uploadError: any) {
        console.error('[Profile] Cloudinary/AI upload error:', uploadError);
        res.status(500).json({
          success: false,
          error: { message: 'Failed to verify or upload profile photo.', code: 'INTERNAL_SERVER_ERROR' },
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
        mainProfilePicture: resolvedMainPicture || null,
        aboutMe:          aboutMe || '',
      },
    });

    if (newPhotoUrl) {
      await prisma.photo.create({
        data: {
          profileId: profile.id,
          photoUrl: newPhotoUrl,
          status: 'approved',
          isMain: true,
        },
      });
    }

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

    let resolvedMainPicture = req.body.mainProfilePicture;
    let newPhotoUrl: string | null = null;

    if (resolvedMainPicture && resolvedMainPicture.startsWith('data:image/')) {
      const matches = resolvedMainPicture.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        res.status(400).json({ success: false, error: { message: 'Invalid image format.', code: 'BAD_REQUEST' } });
        return;
      }

      const buffer = Buffer.from(matches[2], 'base64');
      const fileName = `profile_${profileId}_${Date.now()}`;
      
      try {
        const fileUrl = await uploadToCloudinary(buffer, 'profiles', fileName);

        // AI verification
        const verification = await verifyProfilePhoto(fileUrl);
        if (!verification.isVerified) {
          res.status(400).json({
            success: false,
            error: { message: `Photo rejected: ${verification.reason}`, code: 'PHOTO_REJECTED' },
          });
          return;
        }

        resolvedMainPicture = fileUrl;
        newPhotoUrl = fileUrl;
      } catch (uploadError: any) {
        console.error('[Profile] Cloudinary/AI upload error:', uploadError);
        res.status(500).json({
          success: false,
          error: { message: 'Failed to verify or upload profile photo.', code: 'INTERNAL_SERVER_ERROR' },
        });
        return;
      }
    }

    const updated = await prisma.profile.update({
      where: { id: profileId },
      data: {
        ...req.body,
        mainProfilePicture: resolvedMainPicture !== undefined ? (resolvedMainPicture || null) : undefined,
        dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined,
      },
    });

    if (newPhotoUrl) {
      // Mark other photos of this profile as not main
      await prisma.photo.updateMany({
        where: { profileId },
        data: { isMain: false },
      });

      await prisma.photo.create({
        data: {
          profileId,
          photoUrl: newPhotoUrl,
          status: 'approved',
          isMain: true,
        },
      });
    }

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

    // Mark other photos of this profile as not main
    await prisma.photo.updateMany({
      where: { profileId },
      data: { isMain: false },
    });

    const photo = await prisma.photo.create({
      data: {
        profileId,
        photoUrl: fileUrl,
        status: 'approved', // Approved by AI
        isMain: true,
      },
    });

    // Update mainProfilePicture on profile
    await prisma.profile.update({
      where: { id: profileId },
      data: { mainProfilePicture: fileUrl },
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

// ============================================================
// GET /api/v1/profiles/:id/preferences
// ============================================================
export const getPreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const profileId = parseInt(req.params.id);
  try {
    const pref = await prisma.partnerPreference.findUnique({
      where: { profileId },
      include: {
        preferredCastes: { include: { caste: true } },
        preferredCountries: { include: { country: true } },
      },
    });
    res.status(200).json({ success: true, data: pref });
  } catch (error) {
    console.error('[Profile] getPreferences error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to get preferences.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// PUT /api/v1/profiles/:id/preferences
// Body: { minAge, maxAge, minHeightCm, maxHeightCm, maritalStatuses, religion, country, casteIds, countryIds }
// ============================================================
export const savePreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const profileId = parseInt(req.params.id);
  const { minAge, maxAge, minHeightCm, maxHeightCm, maritalStatuses, otherNotes, casteIds, countryIds } = req.body;

  try {
    // Verify ownership
    const profile = await prisma.profile.findFirst({ where: { id: profileId, userId: req.user.id, deletedAt: null } });
    if (!profile) {
      res.status(403).json({ success: false, error: { message: 'Profile not found or access denied.', code: 'FORBIDDEN' } });
      return;
    }

    // Upsert the preference row
    const pref = await prisma.partnerPreference.upsert({
      where: { profileId },
      create: {
        profileId,
        minAge: minAge ? Number(minAge) : null,
        maxAge: maxAge ? Number(maxAge) : null,
        minHeightCm: minHeightCm ? Number(minHeightCm) : null,
        maxHeightCm: maxHeightCm ? Number(maxHeightCm) : null,
        maritalStatuses: (maritalStatuses as any) || null,
        otherNotes: otherNotes || null,
      },
      update: {
        minAge: minAge ? Number(minAge) : null,
        maxAge: maxAge ? Number(maxAge) : null,
        minHeightCm: minHeightCm ? Number(minHeightCm) : null,
        maxHeightCm: maxHeightCm ? Number(maxHeightCm) : null,
        maritalStatuses: (maritalStatuses as any) || null,
        otherNotes: otherNotes || null,
      },
    });

    // Replace preferred castes
    if (casteIds !== undefined) {
      await prisma.partnerPreferenceCaste.deleteMany({ where: { preferenceId: pref.id } });
      if (Array.isArray(casteIds) && casteIds.length > 0) {
        await prisma.partnerPreferenceCaste.createMany({
          data: casteIds.map((cid: number) => ({ preferenceId: pref.id, casteId: Number(cid) })),
          skipDuplicates: true,
        });
      }
    }

    // Replace preferred countries
    if (countryIds !== undefined) {
      await prisma.partnerPreferenceCountry.deleteMany({ where: { preferenceId: pref.id } });
      if (Array.isArray(countryIds) && countryIds.length > 0) {
        await prisma.partnerPreferenceCountry.createMany({
          data: countryIds.map((cid: number) => ({ preferenceId: pref.id, countryId: Number(cid) })),
          skipDuplicates: true,
        });
      }
    }

    const updatedPref = await prisma.partnerPreference.findUnique({
      where: { profileId },
      include: {
        preferredCastes: { include: { caste: true } },
        preferredCountries: { include: { country: true } },
      },
    });

    res.status(200).json({ success: true, message: 'Partner preferences saved.', data: updatedPref });
  } catch (error) {
    console.error('[Profile] savePreferences error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to save preferences.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};
