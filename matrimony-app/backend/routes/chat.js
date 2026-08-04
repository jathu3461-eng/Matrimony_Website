const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function threadId(profileIdA, profileIdB) {
  const [lo, hi] = [profileIdA, profileIdB].map(Number).sort((a, b) => a - b);
  return `${lo}-${hi}`;
}

async function verifyThreadAccess(viewerUserId, profileA, profileB) {
  const a = await db.get('SELECT owner_user_id FROM profiles WHERE id = ?', [profileA]);
  const b = await db.get('SELECT owner_user_id FROM profiles WHERE id = ?', [profileB]);
  if (!a || !b) return { ok: false, error: 'Profile not found' };

  const ownsOne = a.owner_user_id === viewerUserId || b.owner_user_id === viewerUserId;
  if (!ownsOne) return { ok: false, error: 'Access denied' };

  const mutual = await db.get(`
    SELECT id FROM interests WHERE status = 'accepted'
    AND ((sender_profile_id = ? AND receiver_profile_id = ?) OR (sender_profile_id = ? AND receiver_profile_id = ?))
  `, [profileA, profileB, profileB, profileA]);

  if (!mutual) return { ok: false, error: 'Chat is only available after mutual interest is accepted.' };
  return { ok: true };
}

// GET /api/chat/threads
router.get('/threads', requireAuth, async (req, res) => {
  try {
    const myProfiles = await db.all('SELECT id FROM profiles WHERE owner_user_id = ?', [req.user.id]);
    const myIds = myProfiles.map(p => p.id);
    if (myIds.length === 0) return res.json({ threads: [] });

    const placeholders = myIds.map(() => '?').join(',');

    // MySQL doesn't support NULLS LAST — use IS NULL trick
    const accepted = await db.all(`
      SELECT i.sender_profile_id, i.receiver_profile_id,
             ps.name AS sender_name, pr.name AS receiver_name,
             (SELECT message FROM chat_messages
              WHERE thread_id = CONCAT(LEAST(i.sender_profile_id, i.receiver_profile_id), '-', GREATEST(i.sender_profile_id, i.receiver_profile_id))
              ORDER BY sent_at DESC LIMIT 1) AS last_message,
             (SELECT sent_at FROM chat_messages
              WHERE thread_id = CONCAT(LEAST(i.sender_profile_id, i.receiver_profile_id), '-', GREATEST(i.sender_profile_id, i.receiver_profile_id))
              ORDER BY sent_at DESC LIMIT 1) AS last_at,
             (SELECT COUNT(*) FROM chat_messages
              WHERE thread_id = CONCAT(LEAST(i.sender_profile_id, i.receiver_profile_id), '-', GREATEST(i.sender_profile_id, i.receiver_profile_id))
              AND read_at IS NULL
              AND sender_profile_id NOT IN (${placeholders})) AS unread_count
      FROM interests i
      JOIN profiles ps ON ps.id = i.sender_profile_id
      JOIN profiles pr ON pr.id = i.receiver_profile_id
      WHERE i.status = 'accepted'
      AND (i.sender_profile_id IN (${placeholders}) OR i.receiver_profile_id IN (${placeholders}))
      ORDER BY last_at IS NULL, last_at DESC
    `, [...myIds, ...myIds, ...myIds]);

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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/:profileA/:profileB
router.get('/:profileA/:profileB', requireAuth, async (req, res) => {
  try {
    const { profileA, profileB } = req.params;
    const access = await verifyThreadAccess(req.user.id, profileA, profileB);
    if (!access.ok) return res.status(403).json({ error: access.error });

    const tid = threadId(profileA, profileB);
    const since = req.query.since || null;

    const messages = since
      ? await db.all('SELECT * FROM chat_messages WHERE thread_id = ? AND sent_at > ? ORDER BY sent_at ASC', [tid, since])
      : await db.all('SELECT * FROM chat_messages WHERE thread_id = ? ORDER BY sent_at ASC LIMIT 200', [tid]);

    // Mark as read
    const myProfiles = await db.all('SELECT id FROM profiles WHERE owner_user_id = ?', [req.user.id]);
    const myIds = myProfiles.map(p => p.id);
    if (myIds.length > 0) {
      const ph = myIds.map(() => '?').join(',');
      await db.run(
        `UPDATE chat_messages SET read_at = CURRENT_TIMESTAMP WHERE thread_id = ? AND read_at IS NULL AND sender_profile_id NOT IN (${ph})`,
        [tid, ...myIds]
      );
    }

    res.json({ messages, thread_id: tid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/:profileA/:profileB
router.post('/:profileA/:profileB', requireAuth, async (req, res) => {
  try {
    const { profileA, profileB } = req.params;
    const { message, sender_profile_id } = req.body;

    if (!message || message.trim().length === 0) return res.status(400).json({ error: 'Message cannot be empty' });
    if (message.length > 2000) return res.status(400).json({ error: 'Message too long (max 2000 characters)' });

    const access = await verifyThreadAccess(req.user.id, profileA, profileB);
    if (!access.ok) return res.status(403).json({ error: access.error });

    const senderProfile = await db.get('SELECT id FROM profiles WHERE id = ? AND owner_user_id = ?', [sender_profile_id, req.user.id]);
    if (!senderProfile) return res.status(403).json({ error: 'You do not own the sender profile' });

    const receiverId = Number(sender_profile_id) === Number(profileA) ? Number(profileB) : Number(profileA);
    const tid = threadId(profileA, profileB);

    const result = await db.run(
      'INSERT INTO chat_messages (thread_id, sender_profile_id, receiver_profile_id, message) VALUES (?, ?, ?, ?)',
      [tid, sender_profile_id, receiverId, message.trim()]
    );

    const inserted = await db.get('SELECT * FROM chat_messages WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ message: inserted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
