import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/notifications
// Query: ?page=1&limit=20&unread=true
// ─────────────────────────────────────────────────────────────────────────────
export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const page  = parseInt((req.query.page  as string) || '1');
  const limit = parseInt((req.query.limit as string) || '20');
  const unreadOnly = req.query.unread === 'true';
  const skip  = (page - 1) * limit;

  try {
    const where: any = { userId: req.user.id };
    if (unreadOnly) where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[Notification] getNotifications error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to retrieve notifications.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/notifications/unread-count
// Fast endpoint just for sidebar badge
// ─────────────────────────────────────────────────────────────────────────────
export const getUnreadCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  try {
    const [notifCount, messageCount] = await Promise.all([
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
      prisma.message.count({
        where: {
          isRead: false,
          senderId: { not: req.user.id },
          conversation: {
            participants: { some: { userId: req.user.id } },
          },
        },
      }),
    ]);

    res.status(200).json({ success: true, data: { notifications: notifCount, messages: messageCount } });
  } catch (err) {
    console.error('[Notification] getUnreadCount error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to get unread count.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/notifications/read
// Body: { ids?: number[] }  — if omitted, marks ALL as read
// ─────────────────────────────────────────────────────────────────────────────
export const markNotificationsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const { ids } = req.body;
  const now = new Date();

  try {
    const where: any = { userId: req.user.id, isRead: false };
    if (ids && Array.isArray(ids) && ids.length > 0) {
      where.id = { in: ids.map(Number) };
    }

    const result = await prisma.notification.updateMany({
      where,
      data: { isRead: true, readAt: now },
    });

    res.status(200).json({ success: true, message: `Marked ${result.count} notification(s) as read.`, count: result.count });
  } catch (err) {
    console.error('[Notification] markNotificationsRead error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to mark as read.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/notifications/:id
// ─────────────────────────────────────────────────────────────────────────────
export const deleteNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const notifId = parseInt(req.params.id);

  try {
    const notif = await prisma.notification.findUnique({ where: { id: notifId } });

    if (!notif || notif.userId !== req.user.id) {
      res.status(404).json({ success: false, error: { message: 'Notification not found.', code: 'NOT_FOUND' } });
      return;
    }

    await prisma.notification.delete({ where: { id: notifId } });

    res.status(200).json({ success: true, message: 'Notification deleted.' });
  } catch (err) {
    console.error('[Notification] deleteNotification error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to delete notification.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};
