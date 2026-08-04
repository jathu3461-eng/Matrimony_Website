const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Derive a deterministic thread ID from two profile IDs.
 * Ensures the same thread regardless of who initiates.
 */
function threadId(profileIdA, profileIdB) {
  const [lo, hi] = [profileIdA, profileIdB].map(Number).sort((a, b) => a - b);
  return `${lo}-${hi}`;
}

/**
 * Verify that the requester owns one of the two profiles in the thread
 * AND that both profiles have a mutually accepted interest.
 */
function verifyThreadAccess(viewerUserId, profileA, profileB) {
  const a = db.prepare('SELECT owner_user_id FROM profiles WHERE id = ?').get(profileA);
  const b = db.prepare('SELECT owner_user_id FROM profiles WHERE id = ?').get(profileB);
  if (!a || !b) return { ok: false, error: 'Profile not found' };

  const ownsOne = a.owner_user_id === viewerUserId || b.owner_user_id === viewerUserId;
  if (!ownsOne) return { ok: false, error: 'Access denied' };

  const mutual = db.prepare(`
    SELECT id FROM interests
    WHERE status = 'accepted'
    AND (
      (sender_profile_id = ? AND receiver_profile_id = ?) OR
      (sender_profile_id = ? AND receiver_profile_id = ?)
    )
  `).get(profileA, profileB, profileB, profileA);

  if (!mutual) return { ok: false, error: 'Chat is only available after mutual interest is accepted.' };
  return { ok: true };
}

// GET /api/chat/threads — list all active threads for the requesting user's profiles
router.get('/threads', requireAuth, (req, res) => {
  const myProfiles = db.prepare('SELECT id FROM profiles WHERE owner_user_id = ?').all(req.user.id);
  const myIds = myProfiles.map(p => p.id);
  if (myIds.length === 0) return res.json({ threads: [] });

  const placeholders = myIds.map(() => '?').join(',');

  // Get all accepted interests involving my profiles
  const accepted = db.prepare(`
    SELECT i.sender_profile_id, i.receiver_profile_id,
           ps.name AS sender_name, pr.name AS receiver_name,
           (SELECT message FROM chat_messages
            WHERE thread_id = (
              CASE WHEN i.sender_profile_id < i.receiver_profile_id
                THEN (i.sender_profile_id || '-' || i.receiver_profile_id)
                ELSE (i.receiver_profile_id || '-' || i.sender_profile_id)
              END
            )
            ORDER BY sent_at DESC LIMIT 1) AS last_message,
           (SELECT sent_at FROM chat_messages
            WHERE thread_id = (
              CASE WHEN i.sender_profile_id < i.receiver_profile_id
                THEN (i.sender_profile_id || '-' || i.receiver_profile_id)
                ELSE (i.receiver_profile_id || '-' || i.sender_profile_id)
              END
            )
            ORDER BY sent_at DESC LIMIT 1) AS last_at,
           (SELECT COUNT(*) FROM chat_messages
            WHERE thread_id = (
              CASE WHEN i.sender_profile_id < i.receiver_profile_id
                THEN (i.sender_profile_id || '-' || i.receiver_profile_id)
                ELSE (i.receiver_profile_id || '-' || i.sender_profile_id)
              END
            )
            AND read_at IS NULL
            AND sender_profile_id NOT IN (${placeholders})) AS unread_count
    FROM interests i
    JOIN profiles ps ON ps.id = i.sender_profile_id
    JOIN profiles pr ON pr.id = i.receiver_profile_id
    WHERE i.status = 'accepted'
    AND (i.sender_profile_id IN (${placeholders}) OR i.receiver_profile_id IN (${placeholders}))
    ORDER BY last_at DESC NULLS LAST
  `).all(...myIds, ...myIds, ...myIds);

  const threads = accepted.map(r => {
    const tid = threadId(r.sender_profile_id, r.receiver_profile_id);
    return {
      thread_id: tid,
      sender_profile_id: r.sender_profile_id,
      receiver_profile_id: r.receiver_profile_id,
      sender_name: r.sender_name,
      receiver_name: r.receiver_name,
      last_message: r.last_message,
      last_at: r.last_at,
      unread_count: r.unread_count || 0,
    };
  });

  res.json({ threads });
});

// GET /api/chat/:profileA/:profileB — fetch messages for a thread
router.get('/:profileA/:profileB', requireAuth, (req, res) => {
  const { profileA, profileB } = req.params;
  const access = verifyThreadAccess(req.user.id, profileA, profileB);
  if (!access.ok) return res.status(403).json({ error: access.error });

  const tid = threadId(profileA, profileB);
  const since = req.query.since || null;

  const messages = since
    ? db.prepare('SELECT * FROM chat_messages WHERE thread_id = ? AND sent_at > ? ORDER BY sent_at ASC').all(tid, since)
    : db.prepare('SELECT * FROM chat_messages WHERE thread_id = ? ORDER BY sent_at ASC LIMIT 200').all(tid);

  // Mark as read
  const myProfiles = db.prepare('SELECT id FROM profiles WHERE owner_user_id = ?').all(req.user.id);
  const myIds = myProfiles.map(p => p.id);
  if (myIds.length > 0) {
    const ph = myIds.map(() => '?').join(',');
    db.prepare(`
      UPDATE chat_messages SET read_at = CURRENT_TIMESTAMP
      WHERE thread_id = ? AND read_at IS NULL AND sender_profile_id NOT IN (${ph})
    `).run(tid, ...myIds);
  }

  res.json({ messages, thread_id: tid });
});

// POST /api/chat/:profileA/:profileB — send a message
router.post('/:profileA/:profileB', requireAuth, (req, res) => {
  const { profileA, profileB } = req.params;
  const { message, sender_profile_id } = req.body;

  if (!message || message.trim().length === 0) return res.status(400).json({ error: 'Message cannot be empty' });
  if (message.length > 2000) return res.status(400).json({ error: 'Message too long (max 2000 characters)' });

  const access = verifyThreadAccess(req.user.id, profileA, profileB);
  if (!access.ok) return res.status(403).json({ error: access.error });

  // Verify sender_profile_id is owned by requester
  const senderProfile = db.prepare('SELECT id FROM profiles WHERE id = ? AND owner_user_id = ?').get(sender_profile_id, req.user.id);
  if (!senderProfile) return res.status(403).json({ error: 'You do not own the sender profile' });

  const receiverId = Number(sender_profile_id) === Number(profileA) ? Number(profileB) : Number(profileA);
  const tid = threadId(profileA, profileB);

  const result = db.prepare(`
    INSERT INTO chat_messages (thread_id, sender_profile_id, receiver_profile_id, message)
    VALUES (?, ?, ?, ?)
  `).run(tid, sender_profile_id, receiverId, message.trim());

  const inserted = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: inserted });
});

module.exports = router;
