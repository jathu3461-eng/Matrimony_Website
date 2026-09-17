import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getMatches = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id ?? null;

    const matches = await prisma.profile.findMany({
      where: {
        ...(userId ? { userId: { not: userId } } : {}),
        status: 'active'
      },
      include: {
        user: {
          select: { username: true, email: true }
        },
        currentCountry: true,
        occupationCategory: true
      },
      take: 20
    });

    res.status(200).json({
      success: true,
      data: matches.map(m => {
        const age = Math.floor((Date.now() - new Date(m.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000));
        return {
          id: m.id,
          name: m.name,
          age: age,
          location: `${m.cityOrState}${m.currentCountry ? ', ' + (m.currentCountry as any).nameEn : ''}`,
          profession: (m.occupationCategory as any)?.nameEn || 'Not specified',
          gender: m.gender,
          score: Math.floor(Math.random() * 20) + 75, // Mock score 75-95
        };
      })
    });
  } catch (error) {
    console.error('[Matches] Error fetching matches:', error);
    res.status(500).json({ success: false, error: { message: 'Internal Server Error' } });
  }
};
