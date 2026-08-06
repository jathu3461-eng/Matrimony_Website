const { db } = require('../db');
const { getIO } = require('../socket');

function threadId(profileIdA, profileIdB) {
  const [lo, hi] = [profileIdA, profileIdB].map(Number).sort((a, b) => a - b);
  return `${lo}-${hi}`;
}

/**
 * Verifies that `viewerUserId` is one of the two owners of profiles A/B and that
 * an accepted mutual interest exists between the profiles. Returns
 * { ok: true, otherUserId } or { ok: false, error }.
 */
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
  const otherUserId = a.owner_user_id === viewerUserId ? b.owner_user_id : a.owner_user_id;
  return { ok: true, otherUserId };
}

/**
 * Builds the thread summary object shown in the conversation list.
 * `viewerUserId` controls which side's unread count is computed.
 */
async function buildThread(profileA, profileB, viewerUserId) {
  const [a, b, last] = await Promise.all([
    db.get('SELECT id, name, owner_user_id FROM profiles WHERE id = ?', [profileA]),
    db.get('SELECT id, name, owner_user_id FROM profiles WHERE id = ?', [profileB]),
    db.get(
      'SELECT id, message, sent_at, sender_profile_id FROM chat_messages WHERE thread_id = ? ORDER BY id DESC LIMIT 1',
      [threadId(profileA, profileB)]
    ),
  ]);
  if (!a || !b) return null;
  const myIds = [];
  if (a.owner_user_id === viewerUserId) myIds.push(a.id);
  if (b.owner_user_id === viewerUserId) myIds.push(b.id);
  const ph = myIds.length ? myIds.map(() => '?').join(',') : "'0'";
  const [[{ unread }]] = await db.pool.execute(
    `SELECT COUNT(*) AS unread FROM chat_messages
     WHERE thread_id = ? AND read_at IS NULL AND sender_profile_id NOT IN (${ph})`,
    [threadId(profileA, profileB), ...myIds]
  );
  return {
    thread_id: threadId(profileA, profileB),
    sender_profile_id: a.id,
    receiver_profile_id: b.id,
    sender_name: a.name,
    receiver_name: b.name,
    sender_user_id: a.owner_user_id,
    receiver_user_id: b.owner_user_id,
    last_message: last ? last.message : null,
    last_at: last ? last.sent_at : null,
    last_message_id: last ? last.id : null,
    last_sender_profile_id: last ? last.sender_profile_id : null,
    unread_count: unread || 0,
  };
}

async function getThreadSummaries(userId) {
  const myProfiles = await db.all('SELECT id FROM profiles WHERE owner_user_id = ?', [userId]);
  const myIds = myProfiles.map(p => p.id);
  if (myIds.length === 0) return [];

  const placeholders = myIds.map(() => '?').join(',');
  const accepted = await db.all(`
    SELECT i.sender_profile_id, i.receiver_profile_id,
           ps.name AS sender_name, pr.name AS receiver_name,
           ps.owner_user_id AS sender_user_id, pr.owner_user_id AS receiver_user_id,
           (SELECT message FROM chat_messages
            WHERE thread_id = CONCAT(LEAST(i.sender_profile_id, i.receiver_profile_id), '-', GREATEST(i.sender_profile_id, i.receiver_profile_id))
            ORDER BY id DESC LIMIT 1) AS last_message,
           (SELECT sender_profile_id FROM chat_messages
            WHERE thread_id = CONCAT(LEAST(i.sender_profile_id, i.receiver_profile_id), '-', GREATEST(i.sender_profile_id, i.receiver_profile_id))
            ORDER BY id DESC LIMIT 1) AS last_sender_profile_id,
           (SELECT id FROM chat_messages
            WHERE thread_id = CONCAT(LEAST(i.sender_profile_id, i.receiver_profile_id), '-', GREATEST(i.sender_profile_id, i.receiver_profile_id))
            ORDER BY id DESC LIMIT 1) AS last_message_id,
           (SELECT sent_at FROM chat_messages
            WHERE thread_id = CONCAT(LEAST(i.sender_profile_id, i.receiver_profile_id), '-', GREATEST(i.sender_profile_id, i.receiver_profile_id))
            ORDER BY id DESC LIMIT 1) AS last_at,
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

  return accepted.map(r => ({
    thread_id: threadId(r.sender_profile_id, r.receiver_profile_id),
    sender_profile_id: r.sender_profile_id,
    receiver_profile_id: r.receiver_profile_id,
    sender_name: r.sender_name,
    receiver_name: r.receiver_name,
    sender_user_id: r.sender_user_id,
    receiver_user_id: r.receiver_user_id,
    last_message: r.last_message,
    last_at: r.last_at,
    last_message_id: r.last_message_id,
    last_sender_profile_id: r.last_sender_profile_id || null,
    unread_count: r.unread_count || 0,
  }));
}

/**
 * Inserts a message with client-side idempotency (client_id UNIQUE).
 * Returns { message, duplicate }.
 */
async function insertMessage({ senderProfileId, receiverProfileId, text, clientId }) {
  const tid = threadId(senderProfileId, receiverProfileId);
  const clean = String(text).trim().slice(0, 2000);
  try {
    const result = await db.run(
      `INSERT INTO chat_messages (thread_id, sender_profile_id, receiver_profile_id, message, client_id)
       VALUES (?, ?, ?, ?, ?)`,
      [tid, senderProfileId, receiverProfileId, clean, clientId || null]
    );
    const message = await db.get('SELECT * FROM chat_messages WHERE id = ?', [result.lastInsertRowid]);
    return { message, duplicate: false };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY' && clientId) {
      const existing = await db.get('SELECT * FROM chat_messages WHERE client_id = ?', [clientId]);
      if (existing) return { message: existing, duplicate: true };
    }
    throw err;
  }
}

async function getMessages({ profileA, profileB, since, before, limit = 50 }) {
  const tid = threadId(profileA, profileB);
  const lim = Math.min(200, Math.max(1, Number(limit) || 50));
  let rows;
  if (before) {
    rows = await db.all(
      'SELECT * FROM chat_messages WHERE thread_id = ? AND id < ? ORDER BY id DESC LIMIT ?',
      [tid, Number(before), lim]
    );
    rows.reverse();
  } else if (since) {
    rows = await db.all(
      'SELECT * FROM chat_messages WHERE thread_id = ? AND sent_at > ? ORDER BY id ASC LIMIT ?',
      [tid, since, lim]
    );
  } else {
    rows = await db.all(
      'SELECT * FROM chat_messages WHERE thread_id = ? ORDER BY id ASC LIMIT ?',
      [tid, lim]
    );
  }
  return rows;
}

/** Marks incoming messages in a thread as delivered for the given user. */
async function markMessagesDelivered({ receiverUserId, threadId: tid }) {
  const myProfiles = await db.all('SELECT id FROM profiles WHERE owner_user_id = ?', [receiverUserId]);
  const myIds = myProfiles.map(p => p.id);
  if (myIds.length === 0) return [];
  const ph = myIds.map(() => '?').join(',');
  const affected = await db.all(
    `SELECT id FROM chat_messages WHERE thread_id = ? AND delivered_at IS NULL AND sender_profile_id NOT IN (${ph})`,
    [tid, ...myIds]
  );
  if (affected.length > 0) {
    await db.run(
      `UPDATE chat_messages SET delivered_at = CURRENT_TIMESTAMP WHERE id IN (${affected.map(() => '?').join(',')})`,
      affected.map(m => m.id)
    );
  }
  return affected.map(m => m.id);
}

/** Marks incoming messages in a thread as read for the given user. */
async function markMessagesRead({ receiverUserId, threadId: tid }) {
  const myProfiles = await db.all('SELECT id FROM profiles WHERE owner_user_id = ?', [receiverUserId]);
  const myIds = myProfiles.map(p => p.id);
  if (myIds.length === 0) return [];
  const ph = myIds.map(() => '?').join(',');
  const affected = await db.all(
    `SELECT id FROM chat_messages WHERE thread_id = ? AND read_at IS NULL AND sender_profile_id NOT IN (${ph})`,
    [tid, ...myIds]
  );
  if (affected.length > 0) {
    await db.run(
      `UPDATE chat_messages SET read_at = CURRENT_TIMESTAMP WHERE id IN (${affected.map(() => '?').join(',')})`,
      affected.map(m => m.id)
    );
  }
  return affected.map(m => m.id);
}

/** All user ids sharing an accepted thread with the given user (for presence). */
async function getThreadPartners(userId) {
  const myProfiles = await db.all('SELECT id FROM profiles WHERE owner_user_id = ?', [userId]);
  const myIds = myProfiles.map(p => p.id);
  if (myIds.length === 0) return [];
  const placeholders = myIds.map(() => '?').join(',');
  const rows = await db.all(
    `SELECT ps.owner_user_id AS uid, pr.owner_user_id AS uid2
     FROM interests i
     JOIN profiles ps ON ps.id = i.sender_profile_id
     JOIN profiles pr ON pr.id = i.receiver_profile_id
     WHERE i.status = 'accepted'
     AND (i.sender_profile_id IN (${placeholders}) OR i.receiver_profile_id IN (${placeholders}))`,
    myIds
  );
  const set = new Set();
  for (const r of rows) {
    if (r.uid !== userId) set.add(r.uid);
    if (r.uid2 !== userId) set.add(r.uid2);
  }
  return [...set];
}

function broadcastToRooms(io, rooms, event, payload) {
  if (!io) return;
  for (const room of rooms) {
    io.to(String(room)).emit(event, payload);
  }
}

/** Emits an updated thread summary to both users of a conversation. */
async function emitThreadUpdate(io, profileA, profileB, event = 'chat:thread') {
  if (!io) return;
  try {
    const [a, b] = await Promise.all([
      db.get('SELECT owner_user_id FROM profiles WHERE id = ?', [profileA]),
      db.get('SELECT owner_user_id FROM profiles WHERE id = ?', [profileB]),
    ]);
    if (!a || !b) return;
    const mine = await buildThread(profileA, profileB, a.owner_user_id);
    const theirs = await buildThread(profileA, profileB, b.owner_user_id);
    if (mine) io.to(`user:${a.owner_user_id}`).emit(event, mine);
    if (theirs) io.to(`user:${b.owner_user_id}`).emit(event, theirs);
  } catch (e) {
    console.error('emitThreadUpdate error:', e.message);
  }
}

module.exports = {
  threadId,
  verifyThreadAccess,
  buildThread,
  getThreadSummaries,
  insertMessage,
  getMessages,
  markMessagesDelivered,
  markMessagesRead,
  getThreadPartners,
  broadcastToRooms,
  emitThreadUpdate,
};
