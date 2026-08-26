const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Helper: check profile ownership
async function verifyProfileOwnership(userId, profileId) {
  const profile = await db.get('SELECT owner_user_id FROM profiles WHERE id = ?', [profileId]);
  return profile && profile.owner_user_id === userId;
}

// POST /api/interests/send
router.post('/send', async (req, res) => {
  try {
    const receiver_profile_id = req.body.receiver_profile_id || req.body.receiver_id || req.body.target_user_id || req.body.targetProfileId;
    const sender_profile_id = req.body.sender_profile_id || req.body.sender_id;
    const { message } = req.body;

    if (!receiver_profile_id)
      return res.status(400).json({ success: false, message: 'Target profile ID (receiver_id) is missing or invalid!' });

    // Resolve sender profile
    let activeSenderId = null;
    if (sender_profile_id) {
      const ownedProfile = await db.get('SELECT id FROM profiles WHERE id = ? AND owner_user_id = ?', [sender_profile_id, req.user.id]);
      if (ownedProfile) activeSenderId = ownedProfile.id;
    }
    if (!activeSenderId) {
      const firstOwned = await db.get('SELECT id FROM profiles WHERE owner_user_id = ?', [req.user.id]);
      if (!firstOwned)
        return res.status(400).json({ success: false, message: 'You must create a profile before expressing interest request.' });
      activeSenderId = firstOwned.id;
    }

    const receiver = await db.get('SELECT id, owner_user_id FROM profiles WHERE id = ?', [receiver_profile_id]);
    if (!receiver)
      return res.status(404).json({ success: false, message: 'Recipient profile not found!' });

    if (receiver.owner_user_id === req.user.id || Number(activeSenderId) === Number(receiver_profile_id))
      return res.status(400).json({ success: false, message: 'You cannot express interest in your own profile!' });

    const existing = await db.get(
      'SELECT * FROM interests WHERE (sender_profile_id = ? AND receiver_profile_id = ?) OR (sender_profile_id = ? AND receiver_profile_id = ?)',
      [activeSenderId, receiver_profile_id, receiver_profile_id, activeSenderId]
    );
    if (existing) {
      return res.status(400).json({ success: false, alreadySent: true, status: existing.status,
        message: 'You have already sent an interest request to this profile!',
        error: 'You have already expressed interest to this profile' });
    }

    const cleanMessage = message && message.trim().length > 0 ? message.trim().slice(0, 500) : null;

    const info = await db.run(
      "INSERT INTO interests (sender_profile_id, receiver_profile_id, status, message) VALUES (?, ?, 'pending', ?)",
      [activeSenderId, receiver_profile_id, cleanMessage]
    );

    // Notification
    try {
      const senderProfile = await db.get('SELECT name FROM profiles WHERE id = ?', [activeSenderId]);
      const senderName = senderProfile ? senderProfile.name : 'A user';
      await db.run(
        "INSERT INTO notifications (user_id, sender_id, type, message) VALUES (?, ?, 'interest_received', ?)",
        [receiver.owner_user_id, req.user.id, `${senderName} sent you an Interest Request.`]
      );
      // Real-time toast for the receiver (best-effort).
      const { getIO } = require('../socket');
      getIO()?.to(`user:${receiver.owner_user_id}`).emit('chat:interest', {
        type: 'interest_received',
        fromName: senderName,
        fromProfileId: activeSenderId,
        profileId: receiver_profile_id,
        message: `${senderName} sent you an Interest Request.`,
      });
      // Push notification
      try {
        const { sendPushToUser } = require('../routes/pushNotifications');
        sendPushToUser(receiver.owner_user_id, {
          title: 'New Interest',
          body: `${senderName} sent you an Interest Request.`,
          data: { type: 'interest_received', profileId: activeSenderId },
        });
      } catch (_) {}
    } catch (_) {}

    const interest = await db.get('SELECT * FROM interests WHERE id = ?', [info.lastInsertRowid]);
    res.status(201).json({ success: true, interest, message: 'Interest request sent successfully!' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, alreadySent: true,
        message: 'You have already sent an interest request to this profile!' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to send interest', error: err.message });
  }
});

// GET /api/interests/received
router.get('/received', async (req, res) => {
  try {
    const myProfileRows = await db.all('SELECT id FROM profiles WHERE owner_user_id = ?', [req.user.id]);
    const myProfileIds = myProfileRows.map(p => p.id);
    if (myProfileIds.length === 0) return res.status(200).json({ success: true, interests: [] });

    const placeholders = myProfileIds.map(() => '?').join(',');
    const rows = await db.all(`
      SELECT i.id AS interest_id, i.message AS initial_message, i.status, i.created_at,
             p.id AS sender_id, p.name, p.main_profile_picture, p.date_of_birth, p.occupation, p.city_or_state,
             rp.name AS receiver_name, rp.id AS receiver_profile_id
      FROM interests i
      JOIN profiles p ON i.sender_profile_id = p.id
      JOIN profiles rp ON i.receiver_profile_id = rp.id
      WHERE i.receiver_profile_id IN (${placeholders})
      ORDER BY i.created_at DESC
    `, myProfileIds);

    const interestsWithAge = rows.map(r => {
      const dob = new Date(r.date_of_birth);
      let age = null;
      if (!isNaN(dob)) age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      return { ...r, age };
    });
    res.status(200).json({ success: true, interests: interestsWithAge });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/interests/respond
router.put('/respond', async (req, res) => {
  try {
    const { interest_id, action } = req.body;
    if (!['accept', 'decline', 'accepted', 'rejected', 'declined'].includes(action))
      return res.status(400).json({ success: false, message: 'Invalid action' });

    const interest = await db.get('SELECT * FROM interests WHERE id = ?', [interest_id]);
    if (!interest) return res.status(404).json({ success: false, message: 'Interest request not found' });

    if (!(await verifyProfileOwnership(req.user.id, interest.receiver_profile_id)))
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this interest' });

    const newStatus = (action === 'accept' || action === 'accepted') ? 'accepted' : 'declined';
    await db.run('UPDATE interests SET status = ? WHERE id = ?', [newStatus, interest_id]);

    if (newStatus === 'accepted') {
      try {
        const senderProf = await db.get('SELECT owner_user_id FROM profiles WHERE id = ?', [interest.sender_profile_id]);
        const receiverProf = await db.get('SELECT name, owner_user_id FROM profiles WHERE id = ?', [interest.receiver_profile_id]);
        if (senderProf && receiverProf) {
          await db.run(
            "INSERT INTO notifications (user_id, sender_id, type, message) VALUES (?, ?, 'interest_accepted', ?)",
            [senderProf.owner_user_id, req.user.id, `${receiverProf.name} accepted your interest request! You can now send direct messages.`]
          );
        }
        // Real-time: both users get the new chat thread instantly (best-effort).
        const { getIO } = require('../socket');
        const chatService = require('../services/chatService');
        const io = getIO();
        if (io) {
          chatService.emitThreadUpdate(io, interest.sender_profile_id, interest.receiver_profile_id);
          io.to(`user:${senderProf.owner_user_id}`).emit('chat:interest', {
            type: 'interest_accepted',
            fromName: receiverProf.name,
            message: `${receiverProf.name} accepted your interest! You can now chat.`,
          });
          io.to(`user:${receiverProf.owner_user_id}`).emit('chat:interest', {
            type: 'interest_accepted',
            fromName: receiverProf.name,
            message: `You are now connected with ${receiverProf.name}.`,
          });
        }
        // Push notification to the sender
        try {
          const { sendPushToUser } = require('../routes/pushNotifications');
          sendPushToUser(senderProf.owner_user_id, {
            title: 'Interest Accepted!',
            body: `${receiverProf.name} accepted your interest request! You can now chat.`,
            data: { type: 'interest_accepted', profileId: interest.receiver_profile_id },
          });
        } catch (_) {}
      } catch (_) {}
    }
    res.status(200).json({ success: true, message: `Interest ${newStatus} successfully!`, status: newStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/interests/:id/respond — legacy
router.post('/:id/respond', async (req, res) => {
  try {
    const { status, action } = req.body;
    const targetAction = action || status;
    if (!['accepted','rejected','declined','accept','decline'].includes(targetAction))
      return res.status(400).json({ error: 'Invalid status response' });

    const interest = await db.get('SELECT * FROM interests WHERE id = ?', [req.params.id]);
    if (!interest) return res.status(404).json({ error: 'Interest request not found' });

    if (!(await verifyProfileOwnership(req.user.id, interest.receiver_profile_id)))
      return res.status(403).json({ error: 'You are not authorized to respond to this interest request' });

    const newStatus = (targetAction === 'accepted' || targetAction === 'accept') ? 'accepted' : 'declined';
    await db.run('UPDATE interests SET status = ? WHERE id = ?', [newStatus, req.params.id]);
    res.json({ ok: true, status: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/interests/shortlist
router.post('/shortlist', async (req, res) => {
  try {
    const { profile_id } = req.body;
    if (!profile_id) return res.status(400).json({ error: 'Profile ID is required' });

    const existing = await db.get('SELECT id FROM shortlists WHERE user_id = ? AND profile_id = ?', [req.user.id, profile_id]);
    if (existing) {
      await db.run('DELETE FROM shortlists WHERE user_id = ? AND profile_id = ?', [req.user.id, profile_id]);
      return res.json({ shortlisted: false });
    } else {
      await db.run('INSERT INTO shortlists (user_id, profile_id) VALUES (?, ?)', [req.user.id, profile_id]);
      return res.json({ shortlisted: true });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to add to shortlist' });
  }
});

// GET /api/interests/my-interactions
router.get('/my-interactions', async (req, res) => {
  try {
    const myProfileRows = await db.all('SELECT id FROM profiles WHERE owner_user_id = ?', [req.user.id]);
    const myProfileIds = myProfileRows.map(p => p.id);
    if (myProfileIds.length === 0) return res.json({ sent: [], received: [], shortlists: [] });

    const placeholders = myProfileIds.map(() => '?').join(',');

    const sent = await db.all(`
      SELECT i.*, p.id as receiver_id, p.name as receiver_name, p.main_profile_picture as receiver_pic,
             sp.name as sender_name
      FROM interests i
      JOIN profiles p ON p.id = i.receiver_profile_id
      JOIN profiles sp ON sp.id = i.sender_profile_id
      WHERE i.sender_profile_id IN (${placeholders})
      ORDER BY i.created_at DESC
    `, myProfileIds);

    const received = await db.all(`
      SELECT i.*, p.id as sender_id, p.name as sender_name, p.main_profile_picture as sender_pic,
             rp.name as receiver_name
      FROM interests i
      JOIN profiles p ON p.id = i.sender_profile_id
      JOIN profiles rp ON rp.id = i.receiver_profile_id
      WHERE i.receiver_profile_id IN (${placeholders})
      ORDER BY i.created_at DESC
    `, myProfileIds);

    const shortlists = await db.all(`
      SELECT s.*, p.id as profile_id, p.name as profile_name, p.main_profile_picture as profile_pic,
             p.date_of_birth, p.height_feet, p.height_inches, p.occupation, p.city_or_state
      FROM shortlists s
      JOIN profiles p ON p.id = s.profile_id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `, [req.user.id]);

    const shortlistsWithAge = shortlists.map(s => {
      const dob = new Date(s.date_of_birth);
      let age = null;
      if (!isNaN(dob)) age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      return { ...s, age };
    });

    res.json({ sent, received, shortlists: shortlistsWithAge });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
