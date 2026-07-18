import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/conversations
// Returns list of conversations for the logged-in user with partner info,
// last message, and unread count.
// ─────────────────────────────────────────────────────────────────────────────
export const getConversations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  try {
    // Get all conversations the user participates in
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId: req.user.id },
      select: { conversationId: true, lastReadAt: true },
    });

    const conversationIds = participations.map((p) => p.conversationId);

    if (conversationIds.length === 0) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const conversations = await prisma.conversation.findMany({
      where: { id: { in: conversationIds } },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                profiles: {
                  select: {
                    id: true, name: true, gender: true, mainProfilePicture: true,
                    photos: {
                      where: { status: 'approved', isMain: true },
                      take: 1,
                      select: { photoUrl: true },
                    },
                  },
                },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, messageText: true, senderId: true, createdAt: true, isRead: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // For each conversation, compute unread count and identify the partner
    const myId = req.user.id;
    const result = await Promise.all(
      conversations.map(async (conv) => {
        const myParticipation = participations.find((p) => p.conversationId === conv.id);
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: myId },
            isRead: false,
          },
        });

        const partner = (conv.participants as any[]).find((p: any) => p.userId !== myId);
        const lastMessage = conv.messages[0] || null;

        return {
          id: conv.id,
          lastMessageAt: conv.lastMessageAt,
          unreadCount,
          lastMessage,
          partner: partner
            ? {
                userId: partner.userId,
                username: partner.user.username,
                profile: partner.user.profiles?.[0] || null,
              }
            : null,
        };
      }),
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('[Conversation] getConversations error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to retrieve conversations.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/conversations/:id/messages
// Paginated messages list
// Query: ?page=1&limit=50
// ─────────────────────────────────────────────────────────────────────────────
export const getMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const conversationId = parseInt(req.params.id);
  const page = parseInt((req.query.page as string) || '1');
  const limit = parseInt((req.query.limit as string) || '50');
  const skip = (page - 1) * limit;

  try {
    // Verify user is a participant
    const participation = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: req.user.id },
      },
    });

    if (!participation) {
      res.status(403).json({ success: false, error: { message: 'You are not a participant in this conversation.', code: 'FORBIDDEN' } });
      return;
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId, deletedBySender: false },
        include: {
          sender: {
            select: {
              id: true, username: true,
              profiles: { select: { id: true, name: true, gender: true, mainProfilePicture: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    res.status(200).json({
      success: true,
      data: messages,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[Conversation] getMessages error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to retrieve messages.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/conversations/:id/messages
// Body: { messageText }
// ─────────────────────────────────────────────────────────────────────────────
export const sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const conversationId = parseInt(req.params.id);
  const { messageText } = req.body;

  if (!messageText?.trim()) {
    res.status(400).json({ success: false, error: { message: 'messageText is required.', code: 'VALIDATION_ERROR' } });
    return;
  }

  try {
    // Verify user is a participant
    const participation = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: req.user.id },
      },
    });

    if (!participation) {
      res.status(403).json({ success: false, error: { message: 'You are not a participant in this conversation.', code: 'FORBIDDEN' } });
      return;
    }

    const now = new Date();
    const [message] = await Promise.all([
      prisma.message.create({
        data: {
          conversationId,
          senderId: req.user.id,
          messageText: messageText.trim(),
        },
        include: {
          sender: {
            select: {
              id: true, username: true,
              profiles: { select: { id: true, name: true, gender: true, mainProfilePicture: true } },
            },
          },
        },
      }),
      // Update lastMessageAt on conversation
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: now },
      }),
    ]);

    // Create notification for the other participant(s)
    const otherParticipants = await prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: req.user.id } },
      select: { userId: true },
    });

    const senderName = message.sender.profiles?.[0]?.name || message.sender.username;
    for (const p of otherParticipants) {
      await (prisma.notification as any).create({
        data: {
          userId: p.userId,
          type: 'new_message',
          titleEn: 'New Message',
          bodyEn: `${senderName} sent you a message.`,
          referenceId: conversationId,
        },
      }).catch(() => {});
    }

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    console.error('[Conversation] sendMessage error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to send message.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/conversations/:id/read
// Mark all messages in conversation as read for the current user
// ─────────────────────────────────────────────────────────────────────────────
export const markConversationRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const conversationId = parseInt(req.params.id);
  const now = new Date();

  try {
    const participation = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: req.user.id } },
    });

    if (!participation) {
      res.status(403).json({ success: false, error: { message: 'You are not a participant in this conversation.', code: 'FORBIDDEN' } });
      return;
    }

    await Promise.all([
      // Mark all messages NOT sent by me as read
      prisma.message.updateMany({
        where: { conversationId, senderId: { not: req.user.id }, isRead: false },
        data: { isRead: true, readAt: now },
      }),
      // Update participant lastReadAt
      prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId: req.user.id } },
        data: { lastReadAt: now },
      }),
    ]);

    res.status(200).json({ success: true, message: 'Conversation marked as read.' });
  } catch (err) {
    console.error('[Conversation] markConversationRead error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to mark as read.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/conversations/start
// Body: { partnerUserId }  — start or find existing conversation
// ─────────────────────────────────────────────────────────────────────────────
export const startConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const { partnerUserId } = req.body;
  if (!partnerUserId) {
    res.status(400).json({ success: false, error: { message: 'partnerUserId is required.', code: 'VALIDATION_ERROR' } });
    return;
  }

  const myId = req.user.id;
  const partnerId = Number(partnerUserId);

  try {
    // Find existing conversation
    const myConversations = await prisma.conversationParticipant.findMany({
      where: { userId: myId },
      select: { conversationId: true },
    });

    const myConvIds = myConversations.map((c) => c.conversationId);

    const existing = await prisma.conversationParticipant.findFirst({
      where: { userId: partnerId, conversationId: { in: myConvIds } },
      select: { conversationId: true },
    });

    if (existing) {
      res.status(200).json({ success: true, data: { conversationId: existing.conversationId, isNew: false } });
      return;
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({ data: {} });
    await prisma.conversationParticipant.createMany({
      data: [
        { conversationId: conversation.id, userId: myId },
        { conversationId: conversation.id, userId: partnerId },
      ],
    });

    res.status(201).json({ success: true, data: { conversationId: conversation.id, isNew: true } });
  } catch (err) {
    console.error('[Conversation] startConversation error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to start conversation.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};
