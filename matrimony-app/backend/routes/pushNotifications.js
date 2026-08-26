const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// POST /api/notifications/push-token — register device push token
router.post('/push-token', async (req, res) => {
  try {
    const { token, platform } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    const plat = ['ios', 'android', 'web'].includes(platform) ? platform : 'ios';

    await db.run(
      'INSERT IGNORE INTO push_tokens (user_id, token, platform) VALUES (?, ?, ?)',
      [req.user.id, token, plat]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('push-token error:', err.message);
    res.status(500).json({ error: 'Failed to register push token' });
  }
});

// DELETE /api/notifications/push-token — remove push token on logout
router.delete('/push-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (token) {
      await db.run('DELETE FROM push_tokens WHERE user_id = ? AND token = ?', [req.user.id, token]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove push token' });
  }
});

module.exports = router;

// ── Push notification sending utility (used by other routes) ─────────────────
async function sendPushToUser(userId, { title, body, data }) {
  try {
    const tokens = await db.all(
      'SELECT token, platform FROM push_tokens WHERE user_id = ?',
      [userId]
    );
    if (tokens.length === 0) return;

    const Expo = require('expo-server-sdk');
    const expo = new Expo();

    const messages = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        sound: 'default',
        title,
        body,
        data: data || {},
        badge: 1,
      }));

    if (messages.length === 0) return;

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk).catch(() => {});
    }
  } catch (err) {
    console.error('sendPushToUser error:', err.message);
  }
}

module.exports.sendPushToUser = sendPushToUser;
