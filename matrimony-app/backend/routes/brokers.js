const express = require('express');
const { db } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/brokers — list approved brokers with client counts and viewer's request status
router.get('/', async (req, res) => {
  try {
    const brokers = await db.all(
      `SELECT u.id, u.username, u.business_name, u.created_at,
              (SELECT COUNT(*) FROM broker_requests br WHERE br.broker_id = u.id AND br.status = 'accepted') AS client_count
       FROM users u
       WHERE u.role = 'broker' AND u.is_approved = 1 AND u.id != ?
       ORDER BY client_count DESC, u.created_at ASC`,
      [req.user.id]
    );

    let requests = [];
    if (req.user.role === 'regular') {
      requests = await db.all(
        'SELECT broker_id, status FROM broker_requests WHERE user_id = ?',
        [req.user.id]
      );
    }
    const statusByBroker = Object.fromEntries(requests.map((r) => [r.broker_id, r.status]));

    res.json({ brokers: brokers.map((b) => ({ ...b, my_request_status: statusByBroker[b.id] || null })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load brokers' });
  }
});

// GET /api/brokers/my-requests — requests sent by the current user
router.get('/my-requests', requireRole('regular'), async (req, res) => {
  try {
    const rows = await db.all(
      `SELECT br.id, br.status, br.message, br.created_at, br.responded_at,
              u.id AS broker_id, u.username AS broker_username, u.business_name
       FROM broker_requests br
       JOIN users u ON u.id = br.broker_id
       WHERE br.user_id = ?
       ORDER BY br.created_at DESC`,
      [req.user.id]
    );
    res.json({ requests: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load your requests' });
  }
});

// POST /api/brokers/request — a member requests to work with a broker
router.post('/request', requireRole('regular'), async (req, res) => {
  try {
    const brokerId = Number(req.body.broker_id);
    const message = (req.body.message || '').toString().trim();

    if (!brokerId || !Number.isInteger(brokerId))
      return res.status(400).json({ error: 'Please select a broker to connect with' });
    if (message.length > 500)
      return res.status(400).json({ error: 'Message must be 500 characters or fewer' });

    const broker = await db.get(
      'SELECT id FROM users WHERE id = ? AND role = ? AND is_approved = 1',
      [brokerId, 'broker']
    );
    if (!broker)
      return res.status(404).json({ error: 'Broker not found or not yet approved' });

    const existing = await db.get(
      'SELECT id, status FROM broker_requests WHERE user_id = ? AND broker_id = ?',
      [req.user.id, brokerId]
    );

    if (existing) {
      if (existing.status === 'pending')
        return res.status(409).json({ error: 'You already have a pending request with this broker' });
      if (existing.status === 'accepted')
        return res.status(409).json({ error: 'You are already connected with this broker' });
      await db.run(
        `UPDATE broker_requests SET status = 'pending', message = ?, created_at = CURRENT_TIMESTAMP, responded_at = NULL WHERE id = ?`,
        [message || null, existing.id]
      );
      return res.json({ ok: true, status: 'pending', message: 'Request sent to the broker' });
    }

    await db.run(
      'INSERT INTO broker_requests (user_id, broker_id, status, message) VALUES (?, ?, ?, ?)',
      [req.user.id, brokerId, 'pending', message || null]
    );
    res.status(201).json({ ok: true, status: 'pending', message: 'Request sent to the broker' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not send request' });
  }
});

// GET /api/brokers/requests — requests received by the broker
router.get('/requests', requireRole('broker'), async (req, res) => {
  try {
    const rows = await db.all(
      `SELECT br.id, br.status, br.message, br.created_at, br.responded_at,
              u.id AS user_id, u.username AS user_username, u.email, u.phone_number, u.created_at AS user_joined,
              (SELECT COUNT(*) FROM profiles p WHERE p.owner_user_id = u.id) AS profile_count
       FROM broker_requests br
       JOIN users u ON u.id = br.user_id
       WHERE br.broker_id = ?
       ORDER BY (br.status = 'pending') DESC, br.created_at DESC`,
      [req.user.id]
    );
    res.json({ requests: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load client requests' });
  }
});

// GET /api/brokers/my-clients — connected clients for the broker
router.get('/my-clients', requireRole('broker'), async (req, res) => {
  try {
    const rows = await db.all(
      `SELECT u.id AS user_id, u.username AS user_username, u.email, u.phone_number, u.created_at AS user_joined,
              br.created_at AS connected_at,
              (SELECT COUNT(*) FROM profiles p WHERE p.owner_user_id = u.id) AS profile_count
       FROM broker_requests br
       JOIN users u ON u.id = br.user_id
       WHERE br.broker_id = ? AND br.status = 'accepted'
       ORDER BY br.responded_at DESC`,
      [req.user.id]
    );
    res.json({ clients: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load your clients' });
  }
});

// POST /api/brokers/requests/:id/accept
router.post('/requests/:id/accept', requireRole('broker'), async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const request = await db.get('SELECT id, broker_id, status FROM broker_requests WHERE id = ?', [requestId]);
    if (!request)
      return res.status(404).json({ error: 'Request not found' });
    if (Number(request.broker_id) !== req.user.id)
      return res.status(403).json({ error: 'Not authorized to respond to this request' });
    if (request.status !== 'pending')
      return res.status(409).json({ error: 'This request has already been responded to' });

    await db.run(
      `UPDATE broker_requests SET status = 'accepted', responded_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [requestId]
    );
    res.json({ ok: true, status: 'accepted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not accept request' });
  }
});

// POST /api/brokers/requests/:id/reject
router.post('/requests/:id/reject', requireRole('broker'), async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const request = await db.get('SELECT id, broker_id, status FROM broker_requests WHERE id = ?', [requestId]);
    if (!request)
      return res.status(404).json({ error: 'Request not found' });
    if (Number(request.broker_id) !== req.user.id)
      return res.status(403).json({ error: 'Not authorized to respond to this request' });
    if (request.status !== 'pending')
      return res.status(409).json({ error: 'This request has already been responded to' });

    await db.run(
      `UPDATE broker_requests SET status = 'rejected', responded_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [requestId]
    );
    res.json({ ok: true, status: 'rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not reject request' });
  }
});

module.exports = router;
