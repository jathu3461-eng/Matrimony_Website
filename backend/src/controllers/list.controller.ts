import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// ============================================================
// POST /api/v1/lists/favorites
// ============================================================
export const addFavorite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const { profileId } = req.body;
  const userId = req.user.id;

  try {
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        profileId: Number(profileId),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Profile added to favorites.',
      data: favorite,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, error: { message: 'Profile is already favorited.', code: 'ALREADY_EXISTS' } });
      return;
    }
    console.error('[Lists] Add favorite error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to add to favorites.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// DELETE /api/v1/lists/favorites/:profileId
// ============================================================
export const removeFavorite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const profileId = parseInt(req.params.profileId);
  const userId = req.user.id;

  try {
    await prisma.favorite.delete({
      where: {
        userId_profileId: {
          userId,
          profileId,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Profile removed from favorites.',
    });
  } catch (error) {
    console.error('[Lists] Remove favorite error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to remove favorite.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// GET /api/v1/lists/favorites
// ============================================================
export const getFavorites = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        profile: {
          include: {
            photos: { where: { status: 'approved' }, take: 1 },
            religion: true,
            caste: true,
            currentCountry: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: favorites,
    });
  } catch (error) {
    console.error('[Lists] Get favorites error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve favorites.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// POST /api/v1/lists/blocks
// ============================================================
export const blockUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const { blockedUserId } = req.body;
  const blockerUserId = req.user.id;

  try {
    const block = await prisma.block.create({
      data: {
        blockerUserId,
        blockedUserId: Number(blockedUserId),
      },
    });

    res.status(201).json({
      success: true,
      message: 'User blocked successfully.',
      data: block,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, error: { message: 'User is already blocked.', code: 'ALREADY_EXISTS' } });
      return;
    }
    console.error('[Lists] Block error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to block user.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// DELETE /api/v1/lists/blocks/:blockedUserId
// ============================================================
export const unblockUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const blockedUserId = parseInt(req.params.blockedUserId);
  const blockerUserId = req.user.id;

  try {
    await prisma.block.delete({
      where: {
        blockerUserId_blockedUserId: {
          blockerUserId,
          blockedUserId,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully.',
    });
  } catch (error) {
    console.error('[Lists] Unblock error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to unblock user.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
