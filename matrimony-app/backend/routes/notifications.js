const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/notifications — current user's notifications, newest first
router.get('/', async (req, res) => {
  try {
    const rows = await db.all(
      `SELECT n.*, u.name AS sender_name, u.phone_number AS sender_phone
       FROM notifications n
       LEFT JOIN users u ON u.id = n.sender_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 200`,
      [req.user.id]
    );
    res.json({ notifications: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notifications/unread-count — badge number for the app tab
router.get('/unread-count', async (req, res) => {
  try {
    const row = await db.get(
      'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    res.json({ total: row.total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/:id/read — mark one as read
router.post('/:id/read', async (req, res) => {
  try {
    await db.run(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/read-all — mark all as read
router.post('/read-all', async (req, res) => {
  try {
    await db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
