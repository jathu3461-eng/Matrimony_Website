const express = require('express');
const { db } = require('../db');
const { requireAuth, requireRole, refreshAdminSession } = require('../middleware/auth');

const router = express.Router();
// Every admin endpoint requires an authenticated administrator. The sliding
// refresh re-issues the admin cookie on each request so the 12h inactivity
// window resets, then expires if the admin goes idle.
router.use(requireAuth, requireRole('admin'), (req, res, next) => {
  refreshAdminSession(req, res);
  next();
});

// ── Broker approval queue ─────────────────────────────────────────────────────

router.get('/brokers/pending', async (req, res) => {
  try {
    const rows = await db.all(`SELECT id, username, email, phone_number, business_name, broker_profile_limit, created_at
                                FROM users WHERE role = 'broker' AND is_approved = 0 ORDER BY created_at ASC`);
    res.json({ brokers: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/brokers/all', async (req, res) => {
  try {
    const rows = await db.all(`SELECT id, username, email, phone_number, business_name, broker_profile_limit, is_approved, created_at
                                FROM users WHERE role = 'broker' ORDER BY created_at DESC`);
    res.json({ brokers: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/brokers/:id/approve', async (req, res) => {
  try {
    const result = await db.run("UPDATE users SET is_approved = 1 WHERE id = ? AND role = 'broker'", [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Broker not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/brokers/:id/reject', async (req, res) => {
  try {
    const result = await db.run("DELETE FROM users WHERE id = ? AND role = 'broker' AND is_approved = 0", [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Pending broker not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/brokers/:id/quota', async (req, res) => {
  try {
    const { broker_profile_limit } = req.body;
    const n = Number(broker_profile_limit);
    if (isNaN(n) || n < 0) return res.status(400).json({ errors: { broker_profile_limit: 'Must be a non-negative number' } });
    await db.run("UPDATE users SET broker_profile_limit = ? WHERE id = ? AND role = 'broker'", [n, req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Site settings ─────────────────────────────────────────────────────────────

router.put('/settings', async (req, res) => {
  try {
    const fields = ['site_name','site_logo','site_favicon','contact_number','contact_email','contact_address',
      'meta_title','meta_description','meta_keywords','google_analytics_id','color_primary','color_secondary','color_background'];
    const updates = []; const params = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); } });
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(1);
    await db.run(`UPDATE settings SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ settings: await db.get('SELECT * FROM settings WHERE id = 1') });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/footer-settings', async (req, res) => {
  try {
    const fields = ['footer_copyright_text_en','footer_copyright_text_ta','footer_about_snippet_en','footer_about_snippet_ta',
      'social_facebook','social_youtube','social_tiktok','social_instagram'];
    const updates = []; const params = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); } });
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(1);
    await db.run(`UPDATE footer_settings SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ footer_settings: await db.get('SELECT * FROM footer_settings WHERE id = 1') });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Menu items ────────────────────────────────────────────────────────────────

router.get('/menu-items', async (req, res) => {
  try {
    res.json({ menu_items: await db.all('SELECT * FROM menu_items ORDER BY display_order') });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/menu-items', async (req, res) => {
  try {
    const { title_en, title_ta, target_url, display_order, is_active } = req.body;
    if (!title_en || !title_ta || !target_url)
      return res.status(400).json({ errors: { title_en: 'English title, Tamil title, and URL are all required' } });
    const info = await db.run('INSERT INTO menu_items (title_en, title_ta, target_url, display_order, is_active) VALUES (?,?,?,?,?)',
      [title_en, title_ta, target_url, display_order || 0, is_active === false ? 0 : 1]);
    res.status(201).json({ menu_item: await db.get('SELECT * FROM menu_items WHERE id = ?', [info.lastInsertRowid]) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/menu-items/:id', async (req, res) => {
  try {
    const { title_en, title_ta, target_url, display_order, is_active } = req.body;
    await db.run('UPDATE menu_items SET title_en=?, title_ta=?, target_url=?, display_order=?, is_active=? WHERE id=?',
      [title_en, title_ta, target_url, display_order, is_active ? 1 : 0, req.params.id]);
    res.json({ menu_item: await db.get('SELECT * FROM menu_items WHERE id = ?', [req.params.id]) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/menu-items/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Dashboard stats ───────────────────────────────────────────────────────────

router.get('/stats', async (req, res) => {
  try {
    const totalUsers     = (await db.get("SELECT COUNT(*) c FROM users WHERE role != 'admin'")).c;
    const totalBrokers   = (await db.get("SELECT COUNT(*) c FROM users WHERE role = 'broker'")).c;
    const pendingBrokers = (await db.get("SELECT COUNT(*) c FROM users WHERE role = 'broker' AND is_approved = 0")).c;
    const totalProfiles  = (await db.get('SELECT COUNT(*) c FROM profiles')).c;
    const verifiedProfiles = (await db.get('SELECT COUNT(*) c FROM profiles WHERE is_verified = 1')).c;
    res.json({ totalUsers, totalBrokers, pendingBrokers, totalProfiles, verifiedProfiles });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Profile Verification ──────────────────────────────────────────────────────

router.get('/profiles', async (req, res) => {
  try {
    const profiles = await db.all(`
      SELECT p.id, p.name, p.gender, p.date_of_birth, p.is_verified, p.status,
             p.main_profile_picture, p.created_at, u.username, u.email, u.role
      FROM profiles p
      JOIN users u ON u.id = p.owner_user_id
      ORDER BY p.created_at DESC LIMIT 200
    `);
    res.json({ profiles });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/profiles/:id/verify', async (req, res) => {
  try {
    const result = await db.run('UPDATE profiles SET is_verified = 1 WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Profile not found' });
    res.json({ ok: true, is_verified: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/profiles/:id/unverify', async (req, res) => {
  try {
    const result = await db.run('UPDATE profiles SET is_verified = 0 WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Profile not found' });
    res.json({ ok: true, is_verified: false });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
