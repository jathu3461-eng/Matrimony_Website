const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

// ---------------- Broker approval queue ----------------

router.get('/brokers/pending', (req, res) => {
  const rows = db.prepare(`SELECT id, username, email, phone_number, business_name, broker_profile_limit, created_at
                            FROM users WHERE role = 'broker' AND is_approved = 0 ORDER BY created_at ASC`).all();
  res.json({ brokers: rows });
});

router.get('/brokers/all', (req, res) => {
  const rows = db.prepare(`SELECT id, username, email, phone_number, business_name, broker_profile_limit, is_approved, created_at
                            FROM users WHERE role = 'broker' ORDER BY created_at DESC`).all();
  res.json({ brokers: rows });
});

router.post('/brokers/:id/approve', (req, res) => {
  const result = db.prepare('UPDATE users SET is_approved = 1 WHERE id = ? AND role = ?').run(req.params.id, 'broker');
  if (result.changes === 0) return res.status(404).json({ error: 'Broker not found' });
  res.json({ ok: true });
});

router.post('/brokers/:id/reject', (req, res) => {
  const result = db.prepare('DELETE FROM users WHERE id = ? AND role = ? AND is_approved = 0').run(req.params.id, 'broker');
  if (result.changes === 0) return res.status(404).json({ error: 'Pending broker not found' });
  res.json({ ok: true });
});

router.put('/brokers/:id/quota', (req, res) => {
  const { broker_profile_limit } = req.body;
  const n = Number(broker_profile_limit);
  if (isNaN(n) || n < 0) return res.status(400).json({ errors: { broker_profile_limit: 'Must be a non-negative number' } });
  db.prepare('UPDATE users SET broker_profile_limit = ? WHERE id = ? AND role = ?').run(n, req.params.id, 'broker');
  res.json({ ok: true });
});

// ---------------- Site settings ----------------

router.put('/settings', (req, res) => {
  const fields = ['site_name','site_logo','site_favicon','contact_number','contact_email','contact_address',
    'meta_title','meta_description','meta_keywords','google_analytics_id','color_primary','color_secondary','color_background'];
  const updates = [];
  const params = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }
  });
  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
  params.push(1);
  db.prepare(`UPDATE settings SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json({ settings: db.prepare('SELECT * FROM settings WHERE id = 1').get() });
});

router.put('/footer-settings', (req, res) => {
  const fields = ['footer_copyright_text_en','footer_copyright_text_ta','footer_about_snippet_en','footer_about_snippet_ta',
    'social_facebook','social_youtube','social_tiktok','social_instagram'];
  const updates = [];
  const params = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }
  });
  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
  params.push(1);
  db.prepare(`UPDATE footer_settings SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json({ footer_settings: db.prepare('SELECT * FROM footer_settings WHERE id = 1').get() });
});

// ---------------- Menu items ----------------

router.get('/menu-items', (req, res) => {
  res.json({ menu_items: db.prepare('SELECT * FROM menu_items ORDER BY display_order').all() });
});

router.post('/menu-items', (req, res) => {
  const { title_en, title_ta, target_url, display_order, is_active } = req.body;
  if (!title_en || !title_ta || !target_url) {
    return res.status(400).json({ errors: { title_en: 'English title, Tamil title, and URL are all required' } });
  }
  const info = db.prepare('INSERT INTO menu_items (title_en, title_ta, target_url, display_order, is_active) VALUES (?,?,?,?,?)')
    .run(title_en, title_ta, target_url, display_order || 0, is_active === false ? 0 : 1);
  res.status(201).json({ menu_item: db.prepare('SELECT * FROM menu_items WHERE id = ?').get(info.lastInsertRowid) });
});

router.put('/menu-items/:id', (req, res) => {
  const { title_en, title_ta, target_url, display_order, is_active } = req.body;
  db.prepare(`UPDATE menu_items SET title_en=?, title_ta=?, target_url=?, display_order=?, is_active=? WHERE id=?`)
    .run(title_en, title_ta, target_url, display_order, is_active ? 1 : 0, req.params.id);
  res.json({ menu_item: db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id) });
});

router.delete('/menu-items/:id', (req, res) => {
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------------- Dashboard summary ----------------

router.get('/stats', (req, res) => {
  const totalUsers = db.prepare(`SELECT COUNT(*) c FROM users WHERE role != 'admin'`).get().c;
  const totalBrokers = db.prepare(`SELECT COUNT(*) c FROM users WHERE role = 'broker'`).get().c;
  const pendingBrokers = db.prepare(`SELECT COUNT(*) c FROM users WHERE role = 'broker' AND is_approved = 0`).get().c;
  const totalProfiles = db.prepare(`SELECT COUNT(*) c FROM profiles`).get().c;
  const verifiedProfiles = db.prepare(`SELECT COUNT(*) c FROM profiles WHERE is_verified = 1`).get().c;
  res.json({ totalUsers, totalBrokers, pendingBrokers, totalProfiles, verifiedProfiles });
});

// ---------------- Profile Verification ----------------

router.get('/profiles', (req, res) => {
  const profiles = db.prepare(`
    SELECT p.id, p.name, p.gender, p.date_of_birth, p.is_verified, p.status,
           p.main_profile_picture, p.created_at,
           u.username, u.email, u.role
    FROM profiles p
    JOIN users u ON u.id = p.owner_user_id
    ORDER BY p.created_at DESC
    LIMIT 200
  `).all();
  res.json({ profiles });
});

router.post('/profiles/:id/verify', (req, res) => {
  const result = db.prepare('UPDATE profiles SET is_verified = 1 WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Profile not found' });
  res.json({ ok: true, is_verified: true });
});

router.post('/profiles/:id/unverify', (req, res) => {
  const result = db.prepare('UPDATE profiles SET is_verified = 0 WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Profile not found' });
  res.json({ ok: true, is_verified: false });
});

module.exports = router;
