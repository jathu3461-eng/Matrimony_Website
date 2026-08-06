const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');
const chatService = require('../services/chatService');

let io = null;
let presence = new Map(); // userId -> Set of socket ids (online devices)

function getIO() {
  return io;
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

function socketUserId(socket) {
  return socket.data && socket.data.user ? socket.data.user.id : null;
}

async function authenticate(io, socket, next) {
  try {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const token = socket.handshake.auth?.token || cookies.auth_token || (socket.handshake.query && socket.handshake.query.token);
    if (!token) return next(new Error('Unauthorized'));
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) return next(new Error('Unauthorized'));
    const user = await db.get('SELECT id, role, email, is_approved FROM users WHERE id = ?', [decoded.id]);
    if (!user) return next(new Error('Unauthorized'));
    socket.data.user = user;
    next();
  } catch (e) {
    next(new Error('Unauthorized'));
  }
}

async function markUserDeliveredAcrossThreads(userId) {
  try {
    const threads = await chatService.getThreadSummaries(userId);
    for (const t of threads) {
      const ids = await chatService.markMessagesDelivered({ receiverUserId: userId, threadId: t.thread_id });
      if (ids.length > 0 && io) {
        // Notify senders their messages were delivered.
        const partnerUserId = t.sender_user_id === userId ? t.receiver_user_id : t.sender_user_id;
        io.to(`user:${partnerUserId}`).emit('chat:delivered', { threadId: t.thread_id, messageIds: ids });
      }
    }
    return threads;
  } catch (e) {
    console.error('markUserDeliveredAcrossThreads error:', e.message);
    return [];
  }
}

function notifyPartners(userId, payload) {
  if (!io) return;
  chatService.getThreadPartners(userId).then(partners => {
    for (const p of partners) io.to(`user:${p}`).emit('chat:presence', payload);
  }).catch(() => {});
}

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use((socket, next) => authenticate(io, socket, next));

  // Per-user sliding-window rate limiter (message spam protection)
  const rate = new Map(); // userId -> { count, windowStart }
  function rateLimited(userId) {
    const now = Date.now();
    const entry = rate.get(userId);
    if (!entry || now - entry.windowStart > 10000) {
      rate.set(userId, { count: 1, windowStart: now });
      return false;
    }
    entry.count += 1;
    if (entry.count > 20) return true; // max 20 messages / 10s
    return false;
  }

  io.on('connection', async (socket) => {
    const userId = socketUserId(socket);
    if (!userId) return socket.disconnect(true);
    const user = socket.data.user;

    // Friendly name for typing indicators / presence.
    try {
      const prof = await db.get('SELECT name FROM profiles WHERE owner_user_id = ? AND status = ? ORDER BY id ASC LIMIT 1', [userId, 'active']);
      socket.data.userName = prof ? prof.name : user.username;
    } catch (_) {
      socket.data.userName = user.username;
    }

    // Join personal room — all devices of the user share this room.
    socket.join(`user:${userId}`);

    const sockets = presence.get(userId) || new Set();
    sockets.add(socket.id);
    presence.set(userId, sockets);
    const isFirstDevice = sockets.size === 1;

    // Tell the client we're connected + online so far.
    socket.emit('chat:ready', { ok: true });

    // Broadcast online status to thread partners and mark queued deliveries.
    if (isFirstDevice) notifyPartners(userId, { userId, online: true, lastSeen: null });
    const threads = await markUserDeliveredAcrossThreads(userId);
    socket.emit('chat:sync', { ok: true, threads });

    socket.on('chat:send', async (payload, ack) => {
      try {
        if (rateLimited(userId)) {
          return ack && ack({ ok: false, error: 'Too many messages. Please slow down.', code: 'RATE_LIMIT' });
        }
        const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
        const profileA = Number(payload?.profileA);
        const profileB = Number(payload?.profileB);
        const senderProfileId = Number(payload?.senderProfileId);
        const clientId = typeof payload?.clientId === 'string' ? payload.clientId.slice(0, 64) : null;

        if (!text) return ack && ack({ ok: false, error: 'Message cannot be empty' });
        if (text.length > 2000) return ack && ack({ ok: false, error: 'Message too long (max 2000 characters)' });
        if (!profileA || !profileB || !senderProfileId) return ack && ack({ ok: false, error: 'Invalid thread' });

        const access = await chatService.verifyThreadAccess(userId, profileA, profileB);
        if (!access.ok) return ack && ack({ ok: false, error: access.error });

        const senderProfile = await db.get('SELECT id, name FROM profiles WHERE id = ? AND owner_user_id = ?', [senderProfileId, userId]);
        if (!senderProfile) return ack && ack({ ok: false, error: 'You do not own the sender profile' });
        if (senderProfileId !== profileA && senderProfileId !== profileB) {
          return ack && ack({ ok: false, error: 'Sender profile is not part of this conversation' });
        }

        const receiverProfileId = Number(senderProfileId) === profileA ? profileB : profileA;
        const receiver = await db.get('SELECT owner_user_id, name FROM profiles WHERE id = ?', [receiverProfileId]);
        if (!receiver) return ack && ack({ ok: false, error: 'Receiver profile not found' });

        const { message, duplicate } = await chatService.insertMessage({
          senderProfileId,
          receiverProfileId,
          text,
          clientId,
        });

        // Deliver immediately if the receiver has an online socket.
        let delivered = false;
        const receiverSockets = presence.get(receiver.owner_user_id);
        if (receiverSockets && receiverSockets.size > 0) {
          delivered = true;
          try {
            await db.run('UPDATE chat_messages SET delivered_at = CURRENT_TIMESTAMP WHERE id = ?', [message.id]);
            message.delivered_at = message.delivered_at || new Date();
          } catch (_) {}
        }

        const payloadForUsers = {
          ...message,
          sender_name: senderProfile.name,
          receiver_name: receiver.name,
          sender_user_id: userId,
          receiver_user_id: receiver.owner_user_id,
          delivered,
        };

        io.to(`user:${userId}`).emit('chat:message', payloadForUsers);
        io.to(`user:${receiver.owner_user_id}`).emit('chat:message', payloadForUsers);
        chatService.emitThreadUpdate(io, profileA, profileB);

        return ack && ack({ ok: true, message: payloadForUsers, duplicate });
      } catch (err) {
        console.error('chat:send error:', err.message);
        return ack && ack({ ok: false, error: 'Failed to send message' });
      }
    });

    socket.on('chat:read', async (payload, ack) => {
      try {
        const profileA = Number(payload?.profileA);
        const profileB = Number(payload?.profileB);
        if (!profileA || !profileB) return ack && ack({ ok: false });
        const access = await chatService.verifyThreadAccess(userId, profileA, profileB);
        if (!access.ok) return ack && ack({ ok: false });
        const tid = chatService.threadId(profileA, profileB);
        const affected = await chatService.markMessagesRead({ receiverUserId: userId, threadId: tid });
        if (affected.length > 0 && access.ok && io) {
          io.to(`user:${access.otherUserId}`).emit('chat:seen', { threadId: tid, messageIds: affected });
        }
        chatService.emitThreadUpdate(io, profileA, profileB);
        return ack && ack({ ok: true, affected: affected.length });
      } catch (err) {
        console.error('chat:read error:', err.message);
        return ack && ack({ ok: false });
      }
    });

    // Typing indicator — relayed with a throttle so we don't spam the network.
    const typingThrottle = new Map(); // `${userId}:${threadId}` -> lastEmit
    socket.on('chat:typing', async (payload, ack) => {
      try {
        const profileA = Number(payload?.profileA);
        const profileB = Number(payload?.profileB);
        const isTyping = !!payload?.isTyping;
        if (!profileA || !profileB) return;
        const access = await chatService.verifyThreadAccess(userId, profileA, profileB);
        if (!access.ok) return;
        const key = `${userId}:${profileA}:${profileB}`;
        const now = Date.now();
        const last = typingThrottle.get(key) || 0;
        if (isTyping && now - last < 400) return;
        typingThrottle.set(key, now);
        io.to(`user:${access.otherUserId}`).emit('chat:typing', {
          threadId: chatService.threadId(profileA, profileB),
          userId,
          name: socket.data.userName || '',
          isTyping,
        });
        return ack && ack({ ok: true });
      } catch (err) {
        return ack && ack({ ok: false });
      }
    });

    // Sync on reconnect — fresh thread summaries + partner online states.
    socket.on('chat:sync', async (_payload, ack) => {
      try {
        const freshThreads = await chatService.getThreadSummaries(userId);
        const partners = await chatService.getThreadPartners(userId);
        const onlinePartners = {};
        for (const p of partners) {
          const s = presence.get(p);
          onlinePartners[p] = { online: !!(s && s.size > 0), lastSeen: null };
        }
        return ack && ack({ ok: true, threads: freshThreads, onlinePartners });
      } catch (err) {
        return ack && ack({ ok: false, error: err.message });
      }
    });

    socket.on('disconnect', async () => {
      try {
        const sockets = presence.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            presence.delete(userId);
            await db.run('UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
            notifyPartners(userId, { userId, online: false, lastSeen: new Date() });
          }
        }
      } catch (err) {
        console.error('disconnect error:', err.message);
      }
    });
  });

  return io;
}

module.exports = { initSocket, getIO };
