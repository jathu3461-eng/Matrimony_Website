const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');
const chatService = require('../services/chatService');
const { getIO } = require('../socket');

const router = express.Router();

// GET /api/chat/threads — conversation list
router.get('/threads', requireAuth, async (req, res) => {
  try {
    const threads = await chatService.getThreadSummaries(req.user.id);
    res.json({ threads });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/unread — total unread count for the navbar badge
router.get('/unread', requireAuth, async (req, res) => {
  try {
    const threads = await chatService.getThreadSummaries(req.user.id);
    const total = threads.reduce((sum, t) => sum + (t.unread_count || 0), 0);
    res.json({ total, byThread: Object.fromEntries(threads.map(t => [t.thread_id, t.unread_count])) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/:profileA/:profileB?since=...|before=...&limit=...
router.get('/:profileA/:profileB', requireAuth, async (req, res) => {
  try {
    const { profileA, profileB } = req.params;
    const access = await chatService.verifyThreadAccess(req.user.id, profileA, profileB);
    if (!access.ok) return res.status(403).json({ error: access.error });

    const { since, before, limit } = req.query;
    const messages = await chatService.getMessages({ profileA, profileB, since, before, limit });

    // Mark delivered + read for the person viewing the thread.
    const tid = chatService.threadId(profileA, profileB);
    const deliveredIds = await chatService.markMessagesDelivered({ receiverUserId: req.user.id, threadId: tid });
    if (deliveredIds.length > 0) {
      getIO()?.to(`user:${access.otherUserId}`).emit('chat:delivered', { threadId: tid, messageIds: deliveredIds });
    }
    const readIds = await chatService.markMessagesRead({ receiverUserId: req.user.id, threadId: tid });
    if (readIds.length > 0) {
      getIO()?.to(`user:${access.otherUserId}`).emit('chat:seen', { threadId: tid, messageIds: readIds });
    }
    chatService.emitThreadUpdate(getIO(), profileA, profileB);

    res.json({ messages, thread_id: tid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/:profileA/:profileB — REST fallback (kept for compatibility; the
// socket path is primary but this remains fully functional and broadcasts live too).
router.post('/:profileA/:profileB', requireAuth, async (req, res) => {
  try {
    const { profileA, profileB } = req.params;
    const { message, sender_profile_id, client_id } = req.body;

    if (!message || message.trim().length === 0) return res.status(400).json({ error: 'Message cannot be empty' });
    if (message.length > 2000) return res.status(400).json({ error: 'Message too long (max 2000 characters)' });

    const access = await chatService.verifyThreadAccess(req.user.id, profileA, profileB);
    if (!access.ok) return res.status(403).json({ error: access.error });

    const senderProfile = await db.get('SELECT id, name FROM profiles WHERE id = ? AND owner_user_id = ?', [sender_profile_id, req.user.id]);
    if (!senderProfile) return res.status(403).json({ error: 'You do not own the sender profile' });
    if (Number(sender_profile_id) !== Number(profileA) && Number(sender_profile_id) !== Number(profileB)) {
      return res.status(403).json({ error: 'Sender profile is not part of this conversation' });
    }

    const receiverProfileId = Number(sender_profile_id) === Number(profileA) ? Number(profileB) : Number(profileA);
    const receiver = await db.get('SELECT owner_user_id, name FROM profiles WHERE id = ?', [receiverProfileId]);

    const { message: inserted, duplicate } = await chatService.insertMessage({
      senderProfileId: Number(sender_profile_id),
      receiverProfileId,
      text: message.trim(),
      clientId: client_id || null,
    });

    const { getIO: io } = require('../socket');
    const payload = {
      ...inserted,
      sender_name: senderProfile.name,
      receiver_name: receiver ? receiver.name : null,
      sender_user_id: req.user.id,
      receiver_user_id: receiver ? receiver.owner_user_id : null,
      delivered: !!receiver && !!getIO(),
    };
    io()?.to(`user:${req.user.id}`).emit('chat:message', payload);
    if (receiver) io()?.to(`user:${receiver.owner_user_id}`).emit('chat:message', payload);
    chatService.emitThreadUpdate(getIO(), profileA, profileB);

    res.status(201).json({ message: payload, duplicate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/chat/messages/:id — delete a single message
router.delete('/messages/:id', requireAuth, async (req, res) => {
  try {
    const msgId = Number(req.params.id);
    const msg = await db.get(
      'SELECT id, sender_profile_id FROM chat_messages WHERE id = ?',
      [msgId]
    );
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    const profile = await db.get(
      'SELECT id FROM profiles WHERE id = ? AND owner_user_id = ?',
      [msg.sender_profile_id, req.user.id]
    );
    if (!profile) return res.status(403).json({ error: 'Not authorized to delete this message' });

    await db.run('DELETE FROM chat_messages WHERE id = ?', [msgId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
