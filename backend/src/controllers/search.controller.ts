import { Request, Response } from 'express';
import prisma from '../config/db';

export const searchProfiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      gender,
      minAge,
      maxAge,
      minHeightCm,
      maxHeightCm,
      maritalStatus,
      religionId,
      casteId,
      raasiId,
      starId,
      countryId,
      keyword,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build the query where clause
    const whereClause: any = { deletedAt: null };

    // Filters
    if (gender) {
      whereClause.gender = gender;
    }

    // Age calculation
    if (minAge || maxAge) {
      const today = new Date();
      whereClause.dateOfBirth = {};

      if (maxAge) {
        // Person cannot be born before this date
        const minDate = new Date(today.getFullYear() - Number(maxAge) - 1, today.getMonth(), today.getDate() + 1);
        whereClause.dateOfBirth.gte = minDate;
      }
      if (minAge) {
        // Person cannot be born after this date
        const maxDate = new Date(today.getFullYear() - Number(minAge), today.getMonth(), today.getDate());
        whereClause.dateOfBirth.lte = maxDate;
      }
    }

    // Height (stored in cm in the DB)
    if (minHeightCm) {
      whereClause.heightCm = { gte: Number(minHeightCm) };
    }
    if (maxHeightCm) {
      whereClause.heightCm = { ...whereClause.heightCm, lte: Number(maxHeightCm) };
    }

    // Marital status
    if (maritalStatus) whereClause.maritalStatus = maritalStatus;

    // Lookups
    if (religionId) whereClause.religionId = Number(religionId);
    if (casteId) whereClause.casteId = Number(casteId);
    if (raasiId) whereClause.raasiId = Number(raasiId);
    if (starId) whereClause.starId = Number(starId);
    if (countryId) whereClause.currentCountryId = Number(countryId);

    // Keyword search (name and cityOrState are actual string columns)
    if (keyword) {
      const kw = String(keyword);
      whereClause.OR = [
        { name: { contains: kw, mode: 'insensitive' } },
        { cityOrState: { contains: kw, mode: 'insensitive' } },
      ];
    }

    // Execute queries in transaction for accuracy
    const [profiles, totalCount] = await prisma.$transaction([
      prisma.profile.findMany({
        where: whereClause,
        skip,
        take,
        include: {
          religion: { select: { nameEn: true } },
          caste: { select: { nameEn: true } },
          raasi: { select: { nameEn: true } },
          star: { select: { nameEn: true } },
          currentCountry: { select: { nameEn: true } },
          occupationDetail: { select: { nameEn: true } },
          educationDetail: { select: { nameEn: true } },
          photos: {
            where: { status: 'approved', isMain: true },
            take: 1,
            select: { photoUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.profile.count({ where: whereClause }),
    ]);

    // Fetch blur data (columns not in Prisma schema)
    const profileIds = profiles.map(p => p.id);
    let blurRows: any[] = [];
    if (profileIds.length > 0) {
      const ids = profileIds.join(',');
      blurRows = await prisma.$queryRawUnsafe(
        `SELECT id, blur_photo, blur_horoscope FROM profiles WHERE id IN (${ids})`
      );
    }
    const blurMap: Record<number, any> = {};
    for (const row of blurRows) { blurMap[Number(row.id)] = row; }

    const sanitized = profiles.map(p => {
      const { videoUrl: _omit, ...rest } = p as any;
      const blur = blurMap[p.id] || {};
      return {
        ...rest,
        main_profile_picture: rest.mainProfilePicture || null,
        blur_photo: Number(blur.blur_photo) || 0,
        blur_horoscope: Number(blur.blur_horoscope) || 0,
      };
    });

    res.status(200).json({
      success: true,
      results: sanitized,
      pagination: {
        totalCount,
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / take),
        hasNextPage: skip + take < totalCount,
      },
    });
  } catch (error) {
    console.error('[Search] Error executing matchmaking search:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to search profiles.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
