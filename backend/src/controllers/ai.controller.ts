import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { generateBio } from '../utils/aiBio.utils';
import { calculateCompatibility } from '../utils/aiMatch.utils';

// ============================================================
// POST /api/v1/ai/generate-bio
// ============================================================
export const createAiBio = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  try {
    const profileData = req.body;
    const bio = await generateBio(profileData);

    res.status(200).json({
      success: true,
      data: { bio },
    });
  } catch (error) {
    console.error('[AI] Bio generation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to generate AI bio.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// GET /api/v1/ai/match/:sourceId/:targetId
// ============================================================
export const getMatchScore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const sourceId = parseInt(req.params.sourceId);
  const targetId = parseInt(req.params.targetId);

  try {
    const [sourceProfile, targetProfile] = await Promise.all([
      prisma.profile.findUnique({
        where: { id: sourceId },
        include: { religion: true, caste: true, currentCountry: true },
      }),
      prisma.profile.findUnique({
        where: { id: targetId },
        include: { religion: true, caste: true, currentCountry: true },
      }),
    ]);

    if (!sourceProfile || !targetProfile) {
      res.status(404).json({ success: false, error: { message: 'One or both profiles not found.', code: 'NOT_FOUND' } });
      return;
    }

    const matchData = calculateCompatibility(sourceProfile, targetProfile);

    res.status(200).json({
      success: true,
      data: matchData,
    });
  } catch (error) {
    console.error('[AI] Match score error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to calculate match score.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
