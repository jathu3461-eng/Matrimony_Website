import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// ─── Helper: create a notification ────────────────────────────────────────────
async function createNotification(
  userId: number,
  type: string,
  titleEn: string,
  bodyEn: string,
  referenceId?: number,
) {
  try {
    await (prisma.notification as any).create({
      data: { userId, type, titleEn, bodyEn, referenceId },
    });
  } catch (e) {
    console.error('[Notification] failed to create:', e);
  }
}

// ─── Helper: get the first profile owned by a user ───────────────────────────
async function getUserProfile(userId: number) {
  return prisma.profile.findFirst({
    where: { userId, deletedAt: null },
    select: { id: true, name: true, userId: true },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/interests
// Body: { receiverProfileId, messageNote? }
// ─────────────────────────────────────────────────────────────────────────────
export const sendInterest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const { receiverProfileId, messageNote } = req.body;
  if (!receiverProfileId) {
    res.status(400).json({ success: false, error: { message: 'receiverProfileId is required.', code: 'VALIDATION_ERROR' } });
    return;
  }

  try {
    const senderProfile = await getUserProfile(req.user.id);
    if (!senderProfile) {
      res.status(404).json({ success: false, error: { message: 'You must create a profile before sending an interest.', code: 'NOT_FOUND' } });
      return;
    }

    if (senderProfile.id === Number(receiverProfileId)) {
      res.status(400).json({ success: false, error: { message: 'You cannot send interest to yourself.', code: 'VALIDATION_ERROR' } });
      return;
    }

    // Check receiver profile exists
    const receiverProfile = await prisma.profile.findFirst({
      where: { id: Number(receiverProfileId), deletedAt: null },
      select: { id: true, name: true, userId: true },
    });
    if (!receiverProfile) {
      res.status(404).json({ success: false, error: { message: 'Receiver profile not found.', code: 'NOT_FOUND' } });
      return;
    }

    // Check for existing interest
    const existing = await prisma.interest.findUnique({
      where: {
        senderProfileId_receiverProfileId: {
          senderProfileId: senderProfile.id,
          receiverProfileId: Number(receiverProfileId),
        },
      },
    });
    if (existing) {
      res.status(400).json({
        success: false,
        error: { message: `Interest already exists with status: ${existing.status}.`, code: 'ALREADY_EXISTS' },
        data: existing,
      });
      return;
    }

    // Set expiry 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const interest = await prisma.interest.create({
      data: {
        senderProfileId: senderProfile.id,
        receiverProfileId: Number(receiverProfileId),
        messageNote: messageNote || null,
        expiresAt,
      },
    });

    // Notify the receiver
    if (receiverProfile.userId) {
      await createNotification(
        receiverProfile.userId,
        'interest_received',
        'New Interest Received',
        `${senderProfile.name} has sent you an interest. Respond now.`,
        interest.id,
      );
    }

    res.status(201).json({ success: true, message: 'Interest sent successfully.', data: interest });
  } catch (err: any) {
    console.error('[Interest] sendInterest error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to send interest.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/interests
// Query: ?tab=received|sent|accepted|rejected  (default: received)
// ─────────────────────────────────────────────────────────────────────────────
export const getMyInterests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const tab = (req.query.tab as string) || 'received';

  try {
    const myProfile = await getUserProfile(req.user.id);
    if (!myProfile) {
      res.status(200).json({ success: true, data: [], counts: { received: 0, sent: 0, accepted: 0, rejected: 0 } });
      return;
    }

    // Build filter based on tab
    let whereClause: any = {};
    if (tab === 'received') {
      whereClause = { receiverProfileId: myProfile.id, status: 'pending' };
    } else if (tab === 'sent') {
      whereClause = { senderProfileId: myProfile.id, status: 'pending' };
    } else if (tab === 'accepted') {
      whereClause = {
        OR: [
          { senderProfileId: myProfile.id, status: 'accepted' },
          { receiverProfileId: myProfile.id, status: 'accepted' },
        ],
      };
    } else if (tab === 'rejected') {
      whereClause = {
        OR: [
          { senderProfileId: myProfile.id, status: 'rejected' },
          { receiverProfileId: myProfile.id, status: 'rejected' },
        ],
      };
    }

    const interests = await prisma.interest.findMany({
      where: whereClause,
      include: {
        senderProfile: {
          select: {
            id: true, name: true, gender: true, dateOfBirth: true,
            cityOrState: true, mainProfilePicture: true,
            occupationDetail: { select: { nameEn: true } },
            educationDetail: { select: { nameEn: true } },
            currentCountry: { select: { nameEn: true } },
            photos: { where: { status: 'approved', isMain: true }, take: 1, select: { photoUrl: true } },
          },
        },
        receiverProfile: {
          select: {
            id: true, name: true, gender: true, dateOfBirth: true,
            cityOrState: true, mainProfilePicture: true,
            occupationDetail: { select: { nameEn: true } },
            educationDetail: { select: { nameEn: true } },
            currentCountry: { select: { nameEn: true } },
            photos: { where: { status: 'approved', isMain: true }, take: 1, select: { photoUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Count all statuses for tab badges
    const [receivedCount, sentCount, acceptedCount, rejectedCount] = await Promise.all([
      prisma.interest.count({ where: { receiverProfileId: myProfile.id, status: 'pending' } }),
      prisma.interest.count({ where: { senderProfileId: myProfile.id, status: 'pending' } }),
      prisma.interest.count({
        where: {
          OR: [
            { senderProfileId: myProfile.id, status: 'accepted' },
            { receiverProfileId: myProfile.id, status: 'accepted' },
          ],
        },
      }),
      prisma.interest.count({
        where: {
          OR: [
            { senderProfileId: myProfile.id, status: 'rejected' },
            { receiverProfileId: myProfile.id, status: 'rejected' },
          ],
        },
      }),
    ]);

    const mapped = interests.map((item: any) => {
      const sender = item.senderProfile;
      const receiver = item.receiverProfile;
      if (sender) {
        sender.occupation = sender.occupationDetail?.nameEn || null;
        sender.education = sender.educationDetail?.nameEn || null;
      }
      if (receiver) {
        receiver.occupation = receiver.occupationDetail?.nameEn || null;
        receiver.education = receiver.educationDetail?.nameEn || null;
      }
      return item;
    });

    res.status(200).json({
      success: true,
      data: mapped,
      counts: { received: receivedCount, sent: sentCount, accepted: acceptedCount, rejected: rejectedCount },
      myProfileId: myProfile.id,
    });
  } catch (err) {
    console.error('[Interest] getMyInterests error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to retrieve interests.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/interests/:id
// Body: { status: 'accepted' | 'rejected' }
// Only the RECEIVER can respond
// ─────────────────────────────────────────────────────────────────────────────
export const respondToInterest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const interestId = parseInt(req.params.id);
  const { status } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    res.status(400).json({ success: false, error: { message: "status must be 'accepted' or 'rejected'.", code: 'VALIDATION_ERROR' } });
    return;
  }

  try {
    const myProfile = await getUserProfile(req.user.id);
    if (!myProfile) {
      res.status(404).json({ success: false, error: { message: 'Profile not found.', code: 'NOT_FOUND' } });
      return;
    }

    const interest = await prisma.interest.findUnique({
      where: { id: interestId },
      include: {
        senderProfile: { select: { id: true, name: true, userId: true } },
        receiverProfile: { select: { id: true, name: true } },
      },
    });

    if (!interest) {
      res.status(404).json({ success: false, error: { message: 'Interest not found.', code: 'NOT_FOUND' } });
      return;
    }

    if (interest.receiverProfileId !== myProfile.id) {
      res.status(403).json({ success: false, error: { message: 'You are not the receiver of this interest.', code: 'FORBIDDEN' } });
      return;
    }

    if (interest.status !== 'pending') {
      res.status(400).json({ success: false, error: { message: `Interest is already ${interest.status}.`, code: 'INVALID_STATE' } });
      return;
    }

    const updated = await prisma.interest.update({
      where: { id: interestId },
      data: { status: status as any, respondedAt: new Date() },
    });

    // Notify the sender
    if (interest.senderProfile.userId) {
      const notifType = status === 'accepted' ? 'interest_accepted' : 'interest_rejected';
      const titleEn = status === 'accepted' ? 'Interest Accepted! 🎉' : 'Interest Update';
      const bodyEn = status === 'accepted'
        ? `${interest.receiverProfile.name} has accepted your interest. You can now message each other!`
        : `${interest.receiverProfile.name} has declined your interest.`;
      await createNotification(interest.senderProfile.userId, notifType, titleEn, bodyEn, interest.id);
    }

    // If accepted, create a conversation between the two users
    if (status === 'accepted') {
      const senderUserId = interest.senderProfile.userId;
      const receiverUserId = myProfile.userId;

      if (senderUserId && receiverUserId) {
        // Check if conversation already exists between these users
        const existingConv = await prisma.conversation.findFirst({
          where: {
            participants: {
              every: { userId: { in: [senderUserId, receiverUserId] } },
            },
          },
          include: { participants: true },
        });

        if (!existingConv || existingConv.participants.length !== 2) {
          const conversation = await prisma.conversation.create({ data: {} });
          await prisma.conversationParticipant.createMany({
            data: [
              { conversationId: conversation.id, userId: senderUserId },
              { conversationId: conversation.id, userId: receiverUserId },
            ],
          });
        }
      }
    }

    res.status(200).json({ success: true, message: `Interest ${status} successfully.`, data: updated });
  } catch (err) {
    console.error('[Interest] respondToInterest error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to update interest.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/interests/:id
// Only the SENDER can withdraw
// ─────────────────────────────────────────────────────────────────────────────
export const withdrawInterest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const interestId = parseInt(req.params.id);

  try {
    const myProfile = await getUserProfile(req.user.id);
    if (!myProfile) {
      res.status(404).json({ success: false, error: { message: 'Profile not found.', code: 'NOT_FOUND' } });
      return;
    }

    const interest = await prisma.interest.findUnique({ where: { id: interestId } });

    if (!interest) {
      res.status(404).json({ success: false, error: { message: 'Interest not found.', code: 'NOT_FOUND' } });
      return;
    }

    if (interest.senderProfileId !== myProfile.id) {
      res.status(403).json({ success: false, error: { message: 'You cannot withdraw this interest.', code: 'FORBIDDEN' } });
      return;
    }

    if (interest.status !== 'pending') {
      res.status(400).json({ success: false, error: { message: `Cannot withdraw — interest is already ${interest.status}.`, code: 'INVALID_STATE' } });
      return;
    }

    await prisma.interest.update({
      where: { id: interestId },
      data: { status: 'withdrawn' as any },
    });

    res.status(200).json({ success: true, message: 'Interest withdrawn successfully.' });
  } catch (err) {
    console.error('[Interest] withdrawInterest error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to withdraw interest.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/interests/status/:profileId
// Check interest status between my profile and another profile
// ─────────────────────────────────────────────────────────────────────────────
export const getInterestStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const targetProfileId = parseInt(req.params.profileId);

  try {
    const myProfile = await getUserProfile(req.user.id);
    if (!myProfile) {
      res.status(200).json({ success: true, data: { status: null, direction: null } });
      return;
    }

    const sent = await prisma.interest.findUnique({
      where: {
        senderProfileId_receiverProfileId: {
          senderProfileId: myProfile.id,
          receiverProfileId: targetProfileId,
        },
      },
    });

    if (sent) {
      res.status(200).json({ success: true, data: { id: sent.id, status: sent.status, direction: 'sent' } });
      return;
    }

    const received = await prisma.interest.findUnique({
      where: {
        senderProfileId_receiverProfileId: {
          senderProfileId: targetProfileId,
          receiverProfileId: myProfile.id,
        },
      },
    });

    if (received) {
      res.status(200).json({ success: true, data: { id: received.id, status: received.status, direction: 'received' } });
      return;
    }

    res.status(200).json({ success: true, data: { status: null, direction: null } });
  } catch (err) {
    console.error('[Interest] getInterestStatus error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to get interest status.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};
